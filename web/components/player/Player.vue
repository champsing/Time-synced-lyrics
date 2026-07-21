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
import { useAlbumColors } from "@/composables/hooks/useAlbumColors";
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
import {
    copyToClipboard,
    scrollToLineIndex,
} from "@/composables/utils/global";
import AboutModal from "@components/player/AboutModal.vue";
import CreditModal from "@components/player/CreditModal.vue";
import ErrorDisplay from "@components/player/ErrorDisplay.vue";
import LoadingOverlay from "@components/player/LoadingOverlay.vue";
import LyricsContainer from "@components/player/LyricsContainer.vue";
import PlaybackControls from "@components/player/PlaybackControls.vue";
import PlayerNav from "@components/player/PlayerNav.vue";
import ProgressBar from "@components/player/ProgressBar.vue";
import SettingModal from "@components/player/SettingModal.vue";
import ShareModal from "@components/player/ShareModal.vue";
import VersionBadge from "@components/player/VersionBadge.vue";
import VolumeControl from "@components/player/VolumeControl.vue";
import YTPlayer from "@components/player/YTPlayer.vue";

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

// ── 專輯封面漸層背景 ─────────────────────────────────────────────────
const { colors: albumColors } = useAlbumColors(() => currentSong.value?.art);

// ── 分享連結 ─────────────────────────────────────────────────────────────
const currentSongURI = computed(() => {
    if (!currentSong.value) return "";
    if (songVersion.value === ORIGINAL)
        return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}`;
    return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}&version=${songVersion.value}`;
});

// ── 當前影片 ID ──────────────────────────────────────────────────────────
const currentVideoId = computed(() => {
    return (
        currentSong.value?.versions.find(
            (v: Version) => v.version === songVersion.value,
        )?.id ?? null
    );
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
        class="h-screen m-0! flex flex-col overflow-hidden transition-[background] duration-1000"
        :style="{ backgroundImage: albumColors.gradient }"
    >
        <!-- 載入中 -->
        <LoadingOverlay v-if="isLoading" />

        <!-- 錯誤 -->
        <div class="x-20">
            <ErrorDisplay v-if="isError" :error-message="errorMessage" />
        </div>

        <template v-if="!isLoading && !isError && currentSong">
            <!-- 頂部導覽 -->
            <PlayerNav :dominant-color="albumColors.dominant" />

            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 桌面版：兩欄式佈局                                        -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            <div class="hidden md:flex flex-1 overflow-hidden pt-20">
                <!-- ── 左側面板：影片 + 歌曲資訊 + 控制 ── -->
                <div
                    class="left-panel flex flex-col items-center w-[40%] lg:w-[35%] overflow-y-auto pl-10 pr-6 py-6"
                >
                    <!-- 影片播放器 -->
                    <div class="video-container w-full max-w-95alg:max-w-110">
                        <div
                            class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-black"
                        >
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
                    <div
                        class="song-info w-full max-w-95 lg:max-w-1105 md:pt-10"
                    >
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
                            <span
                                v-else
                                class="text-white/40 text-sm lg:text-base"
                            >
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </span>
                        </div>

                        <!-- 專輯 + 版本徽章 -->
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                            <span class="text-white/40 text-xs lg:text-sm">
                                {{ currentSong.album?.name || "單曲" }}
                            </span>
                            <VersionBadge :song-version="songVersion" />
                        </div>

                        <!-- 副標題 -->
                        <p
                            v-if="currentSong.subtitle"
                            class="text-white/30 text-xs mt-2 line-clamp-2 italic"
                        >
                            {{ parseSubtitle(currentSong.subtitle) }}
                        </p>
                    </div>

                    <!-- 進度條（桌面版） -->
                    <div
                        class="duration-bar-container w-full max-w-95 lg:max-w-1103 pt-3"
                    >
                        <ProgressBar
                            :current-time="currentTime"
                            :song-duration="songDuration"
                            size="desktop"
                            @seek="(s) => window.ytPlayer?.seekTo(s, true)"
                        />
                    </div>

                    <!-- 播放控制 -->
                    <div
                        class="playback-controls w-full max-w-95 lg:max-w-110 mb-4"
                    >
                        <PlaybackControls
                            :is-paused="isPaused"
                            size="desktop"
                            @rewind="rewind10Sec"
                            @toggle-play="
                                isPaused ? playVideo() : pauseVideo()
                            "
                            @forward="moveForward10Sec"
                        />
                    </div>

                    <!-- 音量 + 功能按鈕 -->
                    <div
                        class="utility-controls w-full max-w-95 lg:max-w-110 flex items-center justify-between"
                    >
                        <VolumeControl
                            :volume="volume"
                            :is-muted="isMuted"
                            @toggle-mute="toggleMute"
                            @change-volume="changeVolume"
                        />

                        <div class="flex items-center gap-1">
                            <button
                                @click="shareModalOpen = true"
                                class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="分享"
                                aria-label="分享"
                            >
                                <span class="material-icons text-xl"
                                    >share</span
                                >
                            </button>
                            <button
                                @click="settingModalOpen = true"
                                class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="設定"
                                aria-label="設定"
                            >
                                <span class="material-icons text-xl"
                                    >settings</span
                                >
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
                <div
                    class="right-panel flex-1 overflow-hidden relative pr-10 pb-10"
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
            </div>

            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 手機版：全螢幕歌詞 + 底部固定控制欄                      -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            <div class="md:hidden flex-1 flex flex-col overflow-hidden pt-16">
                <!-- 歌詞區域：pb 值對應底部固定面板高度，確保 scrollIntoView 置中在可見區域內 -->
                <div
                    class="flex-1 overflow-hidden"
                    :class="{
                        'pb-46.25': !mobilePanelCollapsed,
                        'pb-33.75': mobilePanelCollapsed,
                    }"
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
                    class="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-3 transition-all duration-300"
                >
                    <div
                        class="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <!-- 可收合區塊：歌曲資訊 -->
                        <div :class="{ hidden: mobilePanelCollapsed }">
                            <div
                                class="px-5 pt-4 pb-3 flex items-start justify-between"
                            >
                                <div class="flex-1 min-w-0 mr-3">
                                    <h2
                                        class="text-white text-base font-bold truncate tracking-tight"
                                    >
                                        {{
                                            currentSong.title ||
                                            currentSong.folder
                                        }}
                                    </h2>
                                    <div
                                        class="flex items-center gap-2 mt-0.5 flex-wrap"
                                    >
                                        <button
                                            v-if="currentSong.credits"
                                            @click="creditModalOpen = true"
                                            class="text-white/50 hover:text-white text-xs transition-colors truncate"
                                        >
                                            {{
                                                currentSong.displayArtist ||
                                                "未知藝人"
                                            }}
                                        </button>
                                        <span
                                            v-else
                                            class="text-white/40 text-xs truncate"
                                        >
                                            {{
                                                currentSong.displayArtist ||
                                                "未知藝人"
                                            }}
                                        </span>
                                        <VersionBadge
                                            :song-version="songVersion"
                                            compact
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-1 shrink-0">
                                    <button
                                        @click="shareModalOpen = true"
                                        class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                                        aria-label="分享"
                                    >
                                        <span class="material-icons text-lg"
                                            >share</span
                                        >
                                    </button>
                                    <button
                                        @click="settingModalOpen = true"
                                        class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                                        aria-label="設定"
                                    >
                                        <span class="material-icons text-lg"
                                            >settings</span
                                        >
                                    </button>
                                </div>
                            </div>

                            <!-- YTPlayer（手機版隱藏，僅供音源） -->
                            <div
                                class="w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
                            >
                                <YTPlayer
                                    v-if="currentVideoId"
                                    :video-id="currentVideoId"
                                    @update:current-time="currentTime = $event"
                                    @update:is-paused="isPaused = $event"
                                    @update:song-duration="
                                        songDuration = $event
                                    "
                                />
                            </div>
                        </div>

                        <!-- 永遠顯示：進度條 + 控制按鈕 -->
                        <div
                            :class="{
                                'px-5': true,
                                'pb-2': mobilePanelCollapsed,
                            }"
                        >
                            <!-- 進度條（手機版） -->
                            <div
                                :class="{ 'mt-3': mobilePanelCollapsed }"
                            >
                                <ProgressBar
                                    :current-time="currentTime"
                                    :song-duration="songDuration"
                                    size="mobile"
                                    @seek="
                                        (s) => window.ytPlayer?.seekTo(s, true)
                                    "
                                />
                            </div>

                            <!-- 控制按鈕：Apple Music 風格 -->
                            <div class="flex items-center justify-between pb-3">
                                <!-- 音量（左側） -->
                                <div class="w-22">
                                    <VolumeControl
                                        :volume="volume"
                                        :is-muted="isMuted"
                                        compact
                                        @toggle-mute="toggleMute"
                                        @change-volume="changeVolume"
                                    />
                                </div>

                                <!-- 核心播放按鈕：Apple Music 風格 -->
                                <PlaybackControls
                                    :is-paused="isPaused"
                                    size="mobile"
                                    @rewind="rewind10Sec"
                                    @toggle-play="
                                        isPaused ? playVideo() : pauseVideo()
                                    "
                                    @forward="moveForward10Sec"
                                />

                                <!-- 收合按鈕（右側） -->
                                <button
                                    @click="
                                        mobilePanelCollapsed =
                                            !mobilePanelCollapsed
                                    "
                                    class="w-22 flex justify-end text-white/40 hover:text-white/80 transition-colors"
                                    aria-label="展開/收合"
                                >
                                    <span
                                        class="material-icons transition-transform duration-300"
                                        :class="{
                                            'rotate-180': mobilePanelCollapsed,
                                        }"
                                        >expand_more</span
                                    >
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- ── Modals ── -->
            <SettingModal
                :is-open="settingModalOpen"
                :enable-lyric-background="enableLyricBackground"
                :scroll-to-current-line="scrollToCurrentLine"
                :enable-translation="enableTranslation"
                :enable-pronounciation="enablePronounciation"
                :furigana-available="currentSong.furigana == 1"
                :lyric-font-size="lyricFontSize"
                @close="settingModalOpen = false"
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
                @copy-debug-info="copyToClipboard(DEBUG_INFO, '偵錯資訊')"
            />
        </template>
    </div>
</template>

<style scoped>
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

/* ── Apple Music 風格播放按鈕光暈 ── */
.apple-play-btn {
    box-shadow:
        0 0 0 5px rgba(255, 255, 255, 0.05),
        0 0 28px rgba(255, 255, 255, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.4);
}
.apple-play-btn:active {
    box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.03),
        0 0 12px rgba(255, 255, 255, 0.06),
        0 4px 16px rgba(0, 0, 0, 0.3);
}
</style>
