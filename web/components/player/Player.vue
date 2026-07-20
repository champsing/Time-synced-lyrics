<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
// ── Types ────────────────────────────────────────────────────────────────
import type {
    LyricData,
    ProcessedLine,
    SongWithDisplay,
    Version,
} from "@/types/player";

// ── Vue 組件 ─────────────────────────────────────────────────────────────
import { getArtistDisplay } from "@/composables/hooks/useArtist";
import {
    generatePhraseStyle,
    getDefaultVersion,
    getLyricResponse,
    isActivePhrase,
    loadSongData,
    parseLyrics,
} from "@/composables/hooks/useSongs";
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
import { copyToClipboard, formatTime, scrollToLineIndex } from "@/composables/utils/global";
import type { Color } from "@/types/song_select";
import AboutModal from "@components/player/AboutModal.vue";
import CreditModal from "@components/player/CreditModal.vue";
import ErrorDisplay from "@components/player/ErrorDisplay.vue";
import LoadingOverlay from "@components/player/LoadingOverlay.vue";
import LyricsContainer from "@components/player/LyricsContainer.vue";
import PlayerNav from "@components/player/PlayerNav.vue";
import SettingModal from "@components/player/SettingModal.vue";
import ShareModal from "@components/player/ShareModal.vue";
import YTPlayer from "@components/player/YTPlayer.vue";
import colorOptions from "@composables/colorOptions.json";

// ── URL 參數 ─────────────────────────────────────────────────────────────
const params = new URL(document.URL).searchParams;
const songRequest = parseInt(decodeURIComponent(params.get("song") ?? ""));
const versionRequest = decodeURIComponent(params.get("version") ?? "")
    .trim()
    .toLowerCase();

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

// ── 字型大小設定 ─────────────────────────────────────────────────────────
const lyricFontSize = ref<number>(
    Number(localStorage.getItem("lyricFontSize")) || 24,
);
watch(lyricFontSize, (newSize) => {
    localStorage.setItem("lyricFontSize", String(newSize));
});

// ── 手機版面板收合 ───────────────────────────────────────────────────────
const mobilePanelCollapsed = ref(false);

// ── Modal 開關 ───────────────────────────────────────────────────────────
const settingModalOpen = ref(false);
const creditModalOpen = ref(false);
const shareModalOpen = ref(false);
const aboutModalOpen = ref(false);

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

const bgColor = computed(
    () =>
        colorOptionsList.value.find(
            (x) => x.color === bodyBackgroundColor.value,
        ) ??
        colorOptionsList.value[0] ?? { color: "#56773f", name: "預設顏色" },
);

// ── 時間格式 ─────────────────────────────────────────────────────────────
const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedSongDuration = computed(() => formatTime(songDuration.value));

// ── 進度條 ───────────────────────────────────────────────────────────────
const durationPercent = computed(() => {
    if (songDuration.value === 0) return 0;
    return (currentTime.value / songDuration.value) * 100;
});

const progressBarSeek = (event: MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    window.ytPlayer?.seekTo(ratio * songDuration.value, true);
};

// ── 分享連結 ─────────────────────────────────────────────────────────────
const currentSongURI = computed(() => {
    if (!currentSong.value) return "";
    if (songVersion.value === ORIGINAL)
        return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}`;
    return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}&version=${songVersion.value}`;
});

// ── 當前影片 ID ──────────────────────────────────────────────────────────
const currentVideoId = computed(() => {
    return currentSong.value?.versions.find(
        (v: Version) => v.version === songVersion.value,
    )?.id ?? null;
});

// ── processedLines：計算每行結束時間 ─────────────────────────────────────
const processedLines = computed((): ProcessedLine[] => {
    if (!jsonMappingContent.value) return [];

    return (jsonMappingContent.value as ProcessedLine[]).map((line) => {
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

// ── 短語樣式 ─────────────────────────────────────────────────────────────
const getPhraseStyle = (lineIndex: number, phraseIndex: number) => {
    if (!isCurrentLine(lineIndex)) return {};
    const line = (
        jsonMappingContent.value as unknown as ProcessedLine[] | null
    )?.[lineIndex];
    if (!line) return {};
    return generatePhraseStyle(currentTime.value, line as any, phraseIndex);
};

const getBackgroundPhraseStyle = (lineIndex: number, phraseIndex: number) => {
    if (!isCurrentLine(lineIndex)) return {};
    const line = (
        jsonMappingContent.value as unknown as ProcessedLine[] | null
    )?.[lineIndex];
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
    const line = (
        jsonMappingContent.value as unknown as ProcessedLine[] | null
    )?.[index];
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

        if (currentSong.value) {
            currentSong.value = {
                ...currentSong.value,
                displayArtist: await getArtistDisplay(
                    currentSong.value.artist.split(","),
                ),
                displayLyricist: await getArtistDisplay(
                    currentSong.value.lyricist.split(","),
                ),
            };
            console.log(currentSong.value);
        }

        await loadSongLyric();

        isLoading.value = false;
    } catch (err: unknown) {
        isLoading.value = false;
        isError.value = true;
        errorMessage.value = err instanceof Error ? err.message : "未知錯誤";
    }
}

// ── Keyboard handler ─────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        settingModalOpen.value = false;
        creditModalOpen.value = false;
        shareModalOpen.value = false;
        aboutModalOpen.value = false;
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
onMounted(() => {
    window.addEventListener("keydown", onKeydown);
    setup();
});

onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
    <div
        id="body"
        class="h-screen m-0! flex flex-col overflow-hidden"
        :style="{ backgroundColor: bodyBackgroundColor }"
    >
        <!-- 載入中 -->
        <LoadingOverlay v-if="isLoading" />

        <!-- 錯誤 -->
        <div class="x-20">
            <ErrorDisplay v-if="isError" :error-message="errorMessage" />
        </div>

        <template v-if="!isLoading && !isError && currentSong">
            <!-- 頂部導覽 -->
            <PlayerNav :body-background-color="bodyBackgroundColor" />

            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 桌面版：兩欄式佈局                                        -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            <div
                class="hidden md:flex flex-1 overflow-hidden pt-20"
            >
                <!-- ── 左側面板：影片 + 歌曲資訊 + 控制 ── -->
                <div
                    class="left-panel flex flex-col items-center w-[40%] lg:w-[35%] overflow-y-auto px-6 py-6"
                >
                    <!-- 影片播放器 -->
                    <div class="video-container w-full max-w-[380px] lg:max-w-[440px] mb-6">
                        <div class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-black">
                            <YTPlayer
                                v-if="currentVideoId"
                                :video-id="currentVideoId"
                                @update:current-time="currentTime = $event"
                                @update:is-paused="isPaused = $event"
                                @update:song-duration="songDuration = $event"
                            />
                            <!-- 無影片時的封面替代 -->
                            <div
                                v-else
                                class="w-full h-full flex items-center justify-center"
                            >
                                <img
                                    :src="currentSong.art"
                                    :alt="currentSong.folder"
                                    class="w-full h-full object-cover opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- 歌曲資訊 -->
                    <div class="song-info w-full max-w-[380px] lg:max-w-[440px] mb-5">
                        <!-- 標題 -->
                        <h1
                            class="text-white text-2xl lg:text-3xl font-bold tracking-tight leading-tight line-clamp-2"
                        >
                            {{ currentSong.title || currentSong.folder }}
                        </h1>

                        <!-- 藝人 -->
                        <div class="flex items-center gap-2 mt-2">
                            <button
                                v-if="currentSong.credits"
                                @click="creditModalOpen = true"
                                class="text-white/60 hover:text-white text-sm lg:text-base transition-colors underline underline-offset-4 md:no-underline md:hover:underline"
                            >
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </button>
                            <span v-else class="text-white/40 text-sm lg:text-base">
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </span>
                        </div>

                        <!-- 專輯 + 版本徽章 -->
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                            <span class="text-white/40 text-xs lg:text-sm">
                                {{ currentSong.album?.name || "單曲" }}
                            </span>
                            <span
                                v-if="songVersion !== ORIGINAL"
                                class="px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider"
                                :class="{
                                    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30':
                                        songVersion === INSTRUMENTAL,
                                    'bg-white/10 text-white border-white/20':
                                        songVersion === THE_FIRST_TAKE,
                                    'bg-rose-500/20 text-rose-400 border-rose-500/30':
                                        songVersion === LIVE,
                                }"
                            >
                                {{
                                    songVersion === INSTRUMENTAL
                                        ? "Instrumental"
                                        : songVersion === THE_FIRST_TAKE
                                          ? "The First Take"
                                          : songVersion === LIVE
                                            ? "Live"
                                            : songVersion
                                }}
                            </span>
                        </div>

                        <!-- 副標題 -->
                        <p
                            v-if="currentSong.subtitle"
                            class="text-white/30 text-xs mt-2 line-clamp-2 italic"
                        >
                            {{ parseSubtitle(currentSong.subtitle) }}
                        </p>
                    </div>

                    <!-- 進度條 -->
                    <div class="duration-bar-container w-full max-w-[380px] lg:max-w-[440px] mb-3">
                        <div class="relative w-full group cursor-pointer">
                            <div
                                class="relative w-full h-1 bg-white/10 rounded-full overflow-hidden"
                                @click="progressBarSeek"
                            >
                                <div
                                    class="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100 ease-linear group-hover:!bg-teal-400"
                                    :style="{ width: durationPercent + '%' }"
                                />
                                <div
                                    class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    :style="{ left: `calc(${durationPercent}% - 6px)` }"
                                />
                            </div>
                        </div>
                        <div class="flex justify-between mt-1.5">
                            <span class="text-[10px] font-mono text-white/40 tracking-tight">
                                {{ formattedCurrentTime }}
                            </span>
                            <span class="text-[10px] font-mono text-white/40 tracking-tight">
                                {{ formattedSongDuration }}
                            </span>
                        </div>
                    </div>

                    <!-- 播放控制 -->
                    <div class="playback-controls w-full max-w-[380px] lg:max-w-[440px] mb-4">
                        <div class="flex items-center justify-center gap-8">
                            <button
                                @click="rewind10Sec"
                                class="text-white/50 hover:text-white transition-all transform active:scale-90"
                                title="倒轉 10 秒"
                                aria-label="倒轉 10 秒"
                            >
                                <span class="material-icons text-2xl">replay_10</span>
                            </button>

                            <button
                                @click="isPaused ? playVideo() : pauseVideo()"
                                class="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all"
                                title="播放 / 暫停"
                                aria-label="播放 / 暫停"
                            >
                                <span class="material-icons text-4xl">
                                    {{ isPaused ? "play_arrow" : "pause" }}
                                </span>
                            </button>

                            <button
                                @click="moveForward10Sec"
                                class="text-white/50 hover:text-white transition-all transform active:scale-90"
                                title="快轉 10 秒"
                                aria-label="快轉 10 秒"
                            >
                                <span class="material-icons text-2xl">forward_10</span>
                            </button>
                        </div>
                    </div>

                    <!-- 音量 + 功能按鈕 -->
                    <div class="utility-controls w-full max-w-[380px] lg:max-w-[440px] flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <button
                                @click="toggleMute"
                                class="text-white/50 hover:text-white transition-colors"
                                title="靜音"
                                aria-label="靜音切換"
                            >
                                <span class="material-icons text-xl">
                                    {{ volume === 0 || isMuted ? "volume_off" : "volume_up" }}
                                </span>
                            </button>
                            <input
                                id="player-volume-slider"
                                type="range"
                                min="0"
                                max="100"
                                :value="volume"
                                class="w-24 h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
                                @input="
                                    changeVolume(
                                        Number(
                                            ($event.target as HTMLInputElement).value,
                                        ),
                                    )
                                "
                            />
                        </div>

                        <div class="flex items-center gap-1">
                            <button
                                @click="shareModalOpen = true"
                                class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="分享"
                                aria-label="分享"
                            >
                                <span class="material-icons text-xl">share</span>
                            </button>
                            <button
                                @click="settingModalOpen = true"
                                class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="設定"
                                aria-label="設定"
                            >
                                <span class="material-icons text-xl">settings</span>
                            </button>
                            <button
                                @click="aboutModalOpen = true"
                                class="p-2 text-white/30 hover:text-white/70 transition-colors"
                                title="關於"
                                aria-label="關於"
                            >
                                <span class="material-icons text-lg">info</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ── 右側面板：歌詞 ── -->
                <div class="right-panel flex-1 overflow-hidden relative">
                    <LyricsContainer
                        :lines="processedLines"
                        :song="currentSong"
                        :active-line-indices="activeLineIndices"
                        :current-time="currentTime"
                        :enable-lyric-background="enableLyricBackground"
                        :enable-translation="enableTranslation"
                        :enable-pronounciation="enablePronounciation"
                        :lyric-font-size="lyricFontSize"
                        :is-active-phrase="isActivePhrase"
                        :is-current-line="isCurrentLine"
                        :get-phrase-style="getPhraseStyle"
                        :get-background-phrase-style="getBackgroundPhraseStyle"
                        @jump="jumpToCurrentLine"
                    />
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 手機版：全螢幕歌詞 + 底部固定控制欄                      -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            <div class="md:hidden flex-1 flex flex-col overflow-hidden pt-16">
                <!-- 歌詞區域（獨立捲軸） -->
                <div
                    class="flex-1 overflow-y-auto overflow-x-hidden"
                    :class="{ 'mb-[140px]': !mobilePanelCollapsed, 'mb-[72px]': mobilePanelCollapsed }"
                >
                    <LyricsContainer
                        :lines="processedLines"
                        :song="currentSong"
                        :active-line-indices="activeLineIndices"
                        :current-time="currentTime"
                        :enable-lyric-background="enableLyricBackground"
                        :enable-translation="enableTranslation"
                        :enable-pronounciation="enablePronounciation"
                        :lyric-font-size="lyricFontSize"
                        :is-active-phrase="isActivePhrase"
                        :is-current-line="isCurrentLine"
                        :get-phrase-style="getPhraseStyle"
                        :get-background-phrase-style="getBackgroundPhraseStyle"
                        @jump="jumpToCurrentLine"
                    />
                </div>

                <!-- 手機版底部控制面板 -->
                <section
                    class="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-0 transition-all duration-300"
                >
                    <div
                        class="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <!-- 可收合區塊：歌曲資訊 -->
                        <div :class="{ hidden: mobilePanelCollapsed }">
                            <div class="px-5 pt-4 pb-3 flex items-start justify-between">
                                <div class="flex-1 min-w-0 mr-3">
                                    <h2 class="text-white text-base font-bold truncate tracking-tight">
                                        {{ currentSong.title || currentSong.folder }}
                                    </h2>
                                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <button
                                            v-if="currentSong.credits"
                                            @click="creditModalOpen = true"
                                            class="text-white/50 hover:text-white text-xs transition-colors truncate"
                                        >
                                            {{ currentSong.displayArtist || "未知藝人" }}
                                        </button>
                                        <span v-else class="text-white/40 text-xs truncate">
                                            {{ currentSong.displayArtist || "未知藝人" }}
                                        </span>
                                        <span
                                            v-if="songVersion !== ORIGINAL"
                                            class="px-1.5 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider"
                                            :class="{
                                                'bg-cyan-500/20 text-cyan-400 border-cyan-500/30':
                                                    songVersion === INSTRUMENTAL,
                                                'bg-white/10 text-white border-white/20':
                                                    songVersion === THE_FIRST_TAKE,
                                                'bg-rose-500/20 text-rose-400 border-rose-500/30':
                                                    songVersion === LIVE,
                                            }"
                                        >
                                            {{
                                                songVersion === INSTRUMENTAL
                                                    ? "Inst."
                                                    : songVersion === THE_FIRST_TAKE
                                                      ? "TFT"
                                                      : songVersion === LIVE
                                                        ? "Live"
                                                        : songVersion
                                            }}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex gap-1 shrink-0">
                                    <button
                                        @click="shareModalOpen = true"
                                        class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                                        aria-label="分享"
                                    >
                                        <span class="material-icons text-lg">share</span>
                                    </button>
                                    <button
                                        @click="settingModalOpen = true"
                                        class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                                        aria-label="設定"
                                    >
                                        <span class="material-icons text-lg">settings</span>
                                    </button>
                                </div>
                            </div>

                            <!-- YTPlayer（手機版隱藏，僅供音源） -->
                            <div class="w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
                                <YTPlayer
                                    v-if="currentVideoId"
                                    :video-id="currentVideoId"
                                    @update:current-time="currentTime = $event"
                                    @update:is-paused="isPaused = $event"
                                    @update:song-duration="songDuration = $event"
                                />
                            </div>
                        </div>

                        <!-- 永遠顯示：進度條 + 控制按鈕 -->
                        <div :class="{ 'px-5': true, 'pb-2': mobilePanelCollapsed }">
                            <!-- 進度條（手機版） -->
                            <div
                                class="relative w-full h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer mb-3"
                                :class="{ 'mt-3': mobilePanelCollapsed }"
                                @click="progressBarSeek"
                            >
                                <div
                                    class="absolute top-0 left-0 h-full bg-white rounded-full"
                                    :style="{ width: durationPercent + '%' }"
                                />
                            </div>

                            <!-- 時間標籤 -->
                            <div class="flex justify-between -mt-1 mb-2">
                                <span class="text-[9px] font-mono text-white/35 tracking-tight">
                                    {{ formattedCurrentTime }}
                                </span>
                                <span class="text-[9px] font-mono text-white/35 tracking-tight">
                                    {{ formattedSongDuration }}
                                </span>
                            </div>

                            <!-- 控制按鈕 -->
                            <div class="flex items-center justify-between pb-3">
                                <!-- 音量 -->
                                <div class="flex items-center gap-1.5">
                                    <button
                                        @click="toggleMute"
                                        class="text-white/50 hover:text-white transition-colors"
                                        aria-label="靜音切換"
                                    >
                                        <span class="material-icons text-lg">
                                            {{ volume === 0 || isMuted ? "volume_off" : "volume_up" }}
                                        </span>
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        :value="volume"
                                        class="w-16 h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
                                        @input="
                                            changeVolume(
                                                Number(
                                                    ($event.target as HTMLInputElement).value,
                                                ),
                                            )
                                        "
                                    />
                                </div>

                                <!-- 核心播放按鈕 -->
                                <div class="flex items-center gap-8">
                                    <button
                                        @click="rewind10Sec"
                                        class="text-white/50 hover:text-white transition-all active:scale-90"
                                        aria-label="倒轉 10 秒"
                                    >
                                        <span class="material-icons text-xl">replay_10</span>
                                    </button>

                                    <button
                                        @click="isPaused ? playVideo() : pauseVideo()"
                                        class="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                                        aria-label="播放 / 暫停"
                                    >
                                        <span class="material-icons text-3xl">
                                            {{ isPaused ? "play_arrow" : "pause" }}
                                        </span>
                                    </button>

                                    <button
                                        @click="moveForward10Sec"
                                        class="text-white/50 hover:text-white transition-all active:scale-90"
                                        aria-label="快轉 10 秒"
                                    >
                                        <span class="material-icons text-xl">forward_10</span>
                                    </button>
                                </div>

                                <!-- 收合按鈕 -->
                                <button
                                    @click="mobilePanelCollapsed = !mobilePanelCollapsed"
                                    class="text-white/40 hover:text-white/80 transition-colors"
                                    aria-label="展開/收合"
                                >
                                    <span
                                        class="material-icons transition-transform duration-300"
                                        :class="{ 'rotate-180': mobilePanelCollapsed }"
                                    >expand_more</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- ── Modals ── -->
            <SettingModal
                :is-open="settingModalOpen"
                :bg-color="bgColor"
                :color-options="colorOptionsList"
                :enable-lyric-background="enableLyricBackground"
                :scroll-to-current-line="scrollToCurrentLine"
                :enable-translation="enableTranslation"
                :enable-pronounciation="enablePronounciation"
                :furigana-available="currentSong.furigana == 1"
                :lyric-font-size="lyricFontSize"
                @close="settingModalOpen = false"
                @change-bg-color="bodyBackgroundColor = $event"
                @update:enableLyricBackground="enableLyricBackground = $event"
                @update:scrollToCurrentLine="scrollToCurrentLine = $event"
                @update:enableTranslation="enableTranslation = $event"
                @update:enablePronounciation="enablePronounciation = $event"
                @update:lyricFontSize="lyricFontSize = $event"
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
                @copy-debug-info="
                    copyToClipboard(DEBUG_INFO, '偵錯資訊')
                "
            />
        </template>
    </div>
</template>

<style scoped>
/* ── 進度條樣式 ── */
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

input[type="range"]:hover::-webkit-slider-thumb {
    opacity: 1;
}

input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
    opacity: 0;
    transition: opacity 0.15s ease;
}

input[type="range"]:hover::-moz-range-thumb {
    opacity: 1;
}

/* ── 左側面板捲軸 ── */
.left-panel::-webkit-scrollbar {
    width: 3px;
}
.left-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}
.left-panel::-webkit-scrollbar-track {
    background: transparent;
}
</style>
