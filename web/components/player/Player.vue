<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
// ── Types ────────────────────────────────────────────────────────────────
import type {
    Song,
    LyricData,
    Color,
    SongWithDisplay,
    Version,
    ProcessedLine,
    ParsedLine,
} from "@/types/types";

// ── Vue 組件 ─────────────────────────────────────────────────────────────
import LoadingOverlay from "@components/player/LoadingOverlay.vue";
import ErrorDisplay from "@components/player/ErrorDisplay.vue";
import PlayerNav from "@components/player/PlayerNav.vue";
import LyricsContainer from "@components/player/LyricsContainer.vue";
import TranslationBar from "@components/player/TranslationBar.vue";
import ControllerPanel from "@components/player/ControllerPanel.vue";
import SettingModal from "@components/player/SettingModal.vue";
import CreditModal from "@components/player/CreditModal.vue";
import ShareModal from "@components/player/ShareModal.vue";
import AboutModal from "@components/player/AboutModal.vue";
import {
    copyToClipboard,
    formatTime,
    scrollToLineIndex,
} from "@/composables/utils/global";
import colorOptions from "@composables/colorOptions.json";
import {
    ALBUM_GOOGLE_LINK_BASE,
    DEBUG_INFO,
    INSTRUMENTAL,
    LIVE,
    ORIGINAL,
    PLAYER_VERSION,
    THE_FIRST_TAKE,
    TSL_PLAYER_LINK_BASE,
    TSL_SUFFIX,
} from "@/composables/utils/config";
import {
    generatePhraseStyle,
    getDefaultVersion,
    getLyricResponse,
    isActivePhrase,
    loadSongData,
    parseLyrics,
} from "@/composables/hooks/useSongs";
import { useTransation } from "@/composables/hooks/useTranslation";

// ── URL 參數 ─────────────────────────────────────────────────────────────
const params = new URL(document.URL).searchParams;
const songRequest = parseInt(decodeURIComponent(params.get("song") ?? ""));
const versionRequest = decodeURIComponent(params.get("version") ?? "")
    .trim()
    .toLowerCase();

// ── Modal 開關 ───────────────────────────────────────────────────────────
const settingModalOpen = ref(false);
const creditModalOpen = ref(false);
const shareModalOpen = ref(false);
const aboutModalOpen = ref(false);

// ── 播放狀態 ─────────────────────────────────────────────────────────────
const currentTime = ref(0);
const songDuration = ref(0);
const volume = ref<number>(Number(sessionStorage.getItem("volume")) || 70);
const songVersion = ref<string | null>(null);
const jsonMappingContent = ref<LyricData>([] as LyricData);
const scrollToCurrentLine = ref(true);
const enableTranslation = ref(true);
const enablePronounciation = ref(false);
const enableLyricBackground = ref(true);
const isPaused = ref(true);
const isLoading = ref(true);
const isMuted = ref(false);
const isError = ref(false);
const errorMessage = ref("");

const currentSong = ref<SongWithDisplay | null>(null);

// ── 顏色 ─────────────────────────────────────────────────────────────────
const colorOptionsList = ref<Color[]>(
    colorOptions || [{ color: "#365456", name: "預設 II：礦石靛" }],
);

const bodyBackgroundColor = ref(
    localStorage.getItem("bodyBackgroundColor") ?? "#365456",
);

watch(bodyBackgroundColor, (newColor) => {
    document.body.style.backgroundColor = newColor;
    localStorage.setItem("bodyBackgroundColor", newColor);
});

const bgColorName = computed(
    () =>
        colorOptionsList.value.find(
            (x) => x.color === bodyBackgroundColor.value,
        )?.name ??
        colorOptionsList.value[0]?.name ??
        "預設顏色",
);

// ── 時間格式 ─────────────────────────────────────────────────────────────
const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedSongDuration = computed(() => formatTime(songDuration.value));

// ── 分享連結 ─────────────────────────────────────────────────────────────
const currentSongURI = computed(() => {
    if (!currentSong.value) return "";
    if (songVersion.value === ORIGINAL)
        return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}`;
    return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}&version=${songVersion.value}`;
});

// ── 偵錯 ─────────────────────────────────────────────────────────────────
const debugInfo = DEBUG_INFO;

// ── processedLines：計算每行結束時間 ─────────────────────────────────────
const processedLines = computed((): ProcessedLine[] => {
    if (!jsonMappingContent.value) return [];

    return (jsonMappingContent.value as ParsedLine[]).map((line) => {
        const mainTotal = line.duration.reduce((a, b) => a + b, 0);
        let maxEnd = line.time + mainTotal;
        const validDuration = mainTotal > 0 ? mainTotal : 3.0;

        if (
            line.background_voice?.time !== undefined &&
            line.background_voice?.duration
        ) {
            const bgTotal = line.background_voice.duration.reduce(
                (a: number, b: number) => a + b,
                0,
            );
            maxEnd = Math.max(maxEnd, line.background_voice.time + bgTotal);
        }

        const finalEnd =
            maxEnd > line.time ? maxEnd : line.time + validDuration;
        return { ...line, computedEndTime: finalEnd };
    });
});

// ── activeLineIndices：哪幾行目前應顯示 ──────────────────────────────────
const activeLineIndices = computed(() => {
    const result: number[] = [];
    const now = currentTime.value;

    processedLines.value.forEach((line, index) => {
        const startTime = line.time - 0.3;
        const nextLine = processedLines.value[index + 1];

        let endTime: number;
        if (nextLine) {
            endTime =
                nextLine.time - 0.3 < line.computedEndTime
                    ? line.computedEndTime
                    : nextLine.time - 0.3;
        } else {
            endTime = line.computedEndTime + 0.5;
        }

        if (now >= startTime && now < endTime) result.push(index);
    });
    return result;
});

const isCurrentLine = (index: number) =>
    activeLineIndices.value.includes(index);

const currentLineIndex = computed(() => {
    const arr = activeLineIndices.value;
    return arr.length === 0 ? -1 : arr[arr.length - 1];
});

// ── 翻譯 ─────────────────────────────────────────────────────────────────
const { translationText, backgroundTranslationText, translationAuthor } =
    useTransation(
        currentSong.value,
        jsonMappingContent.value,
        activeLineIndices.value,
    ) || {
        translationText: computed(() => ""),
        backgroundTranslationText: computed(() => ""),
        translationAuthor: computed(() => ""),
    };

// ── 短語樣式 ─────────────────────────────────────────────────────────────
const getPhraseStyle = (lineIndex: number, phraseIndex: number) => {
    if (!isCurrentLine(lineIndex)) return {};
    const line = (jsonMappingContent.value as unknown as ParsedLine[] | null)?.[
        lineIndex
    ];
    if (!line) return {};
    return generatePhraseStyle(currentTime.value, line as any, phraseIndex);
};

const getBackgroundPhraseStyle = (lineIndex: number, phraseIndex: number) => {
    if (!isCurrentLine(lineIndex)) return {};
    const line = (jsonMappingContent.value as unknown as ParsedLine[] | null)?.[
        lineIndex
    ];
    if (!line?.background_voice) return {};
    return generatePhraseStyle(
        currentTime.value,
        line.background_voice,
        phraseIndex,
    );
};

// ── 播放控制 ─────────────────────────────────────────────────────────────
const playVideo = () => {
    window.ytPlayer.playVideo();
    isPaused.value = false;
};
const pauseVideo = () => {
    window.ytPlayer.pauseVideo();
    isPaused.value = true;
};
const rewind10Sec = () => window.ytPlayer.seekTo(currentTime.value - 10, true);
const moveForward10Sec = () =>
    window.ytPlayer.seekTo(currentTime.value + 10, true);
const parseSubtitle = (subtitle: string) =>
    subtitle?.replace(/\\n/g, "\n") || "";

const toggleMute = () => {
    if (isMuted.value) {
        window.ytPlayer.unMute();
        isMuted.value = false;
    } else {
        window.ytPlayer.mute();
        isMuted.value = true;
    }
};

const changeVolume = (newVolume: number) => {
    volume.value = newVolume;
    window.ytPlayer.setVolume(newVolume);
    isMuted.value = newVolume === 0;
    sessionStorage.setItem("volume", String(newVolume));
};

const jumpToCurrentLine = (index: number) => {
    const line = (jsonMappingContent.value as unknown as ParsedLine[] | null)?.[
        index
    ];
    if (line && window.ytPlayer) {
        window.ytPlayer.seekTo(line.time - 0.2);
        scrollToLineIndex(index);
    }
};

// ── 歌詞載入 ─────────────────────────────────────────────────────────────
async function loadSongLyric() {
    if (!currentSong.value || !songVersion.value) return;
    document.title = currentSong.value.title + TSL_SUFFIX;
    jsonMappingContent.value = await parseLyrics(
        await getLyricResponse(
            currentSong.value.song_id,
            currentSong.value.folder,
            songVersion.value,
        ),
        currentSong.value,
        songDuration.value,
    );
}

// ── 初始化 ───────────────────────────────────────────────────────────────
async function setup() {
    try {
        isLoading.value = true;

        const song = await loadSongData(songRequest);
        if (!song) throw new Error("找不到歌曲資料");
        currentSong.value = song;

        songVersion.value = versionRequest || getDefaultVersion(song);

        // YouTube 播放器現在由 YTPlayer.vue 組件自行初始化，這裡不再需要 initYouTubePlayer

        await loadSongLyric();

        isLoading.value = false;
    } catch (err: unknown) {
        isLoading.value = false;
        isError.value = true;
        errorMessage.value = err instanceof Error ? err.message : "未知錯誤";
    }
}

// ── Watchers ──────────────────────────────────────────────────────────────
watch(currentLineIndex, (newVal) => {
    if (newVal === -1 || typeof newVal === "undefined") return;
    if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
});

watch(volume, (newVal) => {
    const slider = document.getElementById(
        "player-volume-slider",
    ) as HTMLInputElement | null;
    slider?.style.setProperty("--value", String(newVal));
});

// ── 啟動 ─────────────────────────────────────────────────────────────────
onMounted(setup);
</script>

<template>
    <div
        id="body"
        class="min-h-screen m-0!"
        :style="{ backgroundColor: bodyBackgroundColor }"
    >
        <!-- 載入中 -->
        <LoadingOverlay :is-loading="isLoading" />

        <!-- 錯誤 -->
        <ErrorDisplay :is-error="isError" :error-message="errorMessage" />

        <template v-if="!isLoading && !isError && currentSong">
            <!-- 頂部導覽 -->
            <PlayerNav />

            <!-- 左側：歌詞 -->
            <div
                id="main-display-section"
                class="md:flex flex-col items-center md:w-[68%] md:ml-8 px-4 mt-20"
            >
                <LyricsContainer
                    :lines="processedLines"
                    :song="currentSong"
                    :current-time="currentTime"
                    :enable-lyric-background="enableLyricBackground"
                    :enable-translation="enableTranslation"
                    :enable-pronounciation="enablePronounciation"
                    :is-active-phrase="isActivePhrase"
                    :is-current-line="isCurrentLine"
                    :get-phrase-style="getPhraseStyle"
                    :get-background-phrase-style="getBackgroundPhraseStyle"
                    @jump="jumpToCurrentLine"
                />

                <TranslationBar
                    :enable-translation="enableTranslation"
                    :song="currentSong"
                    :translation-text="translationText || ''"
                    :background-translation-text="
                        backgroundTranslationText || ''
                    "
                    :translation-author="translationAuthor"
                    @disable-translation="enableTranslation = false"
                />
            </div>

            <!-- 右側：播放控制面板 -->
            <ControllerPanel
                :current-song="currentSong"
                :song-version="songVersion"
                :is-paused="isPaused"
                :is-muted="isMuted"
                :volume="volume"
                :formatted-current-time="formattedCurrentTime"
                :formatted-song-duration="formattedSongDuration"
                :ORIGINAL="ORIGINAL"
                :INSTRUMENTAL="INSTRUMENTAL"
                :THE_FIRST_TAKE="THE_FIRST_TAKE"
                :LIVE="LIVE"
                :parse-subtitle="parseSubtitle"
                :video-i-d="
                    currentSong.versions.find(
                        (v: Version) => v.version === songVersion,
                    )?.id ?? null
                "
                @update:current-time="currentTime = $event"
                @update:is-paused="isPaused = $event"
                @update:song-duration="songDuration = $event"
                @play="playVideo"
                @pause="pauseVideo"
                @rewind="rewind10Sec"
                @forward="moveForward10Sec"
                @toggle-mute="toggleMute"
                @change-volume="changeVolume"
            />

            <!-- Modals -->
            <SettingModal
                :is-open="settingModalOpen"
                :bg-color-name="bgColorName"
                :color-options="colorOptions"
                :enable-lyric-background="enableLyricBackground"
                :scroll-to-current-line="scrollToCurrentLine"
                :enable-translation="enableTranslation"
                :enable-pronounciation="enablePronounciation"
                :furigana-available="currentSong.furigana == 1 ? true : false"
                @close="settingModalOpen = false"
                @change-bg-color="bodyBackgroundColor = $event"
                @update:enableLyricBackground="enableLyricBackground = $event"
                @update:scrollToCurrentLine="scrollToCurrentLine = $event"
                @update:enableTranslation="enableTranslation = $event"
                @update:enablePronounciation="enablePronounciation = $event"
            />

            <CreditModal
                :is-open="creditModalOpen"
                :current-song="currentSong"
                :ALBUM_GOOGLE_LINK_BASE="ALBUM_GOOGLE_LINK_BASE"
                @close="creditModalOpen = false"
            />

            <ShareModal
                :is-open="shareModalOpen"
                :current-song-u-r-i="currentSongURI"
                @close="shareModalOpen = false"
                @copy-link="copyToClipboard($event, '歌曲連結')"
            />

            <AboutModal
                :is-open="aboutModalOpen"
                :player-version="PLAYER_VERSION"
                @close="aboutModalOpen = false"
                @copy-debug-info="copyToClipboard(debugInfo, '偵錯資訊')"
            />
        </template>
    </div>
</template>
