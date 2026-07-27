<script setup lang="ts">
import type { LyricData, SongWithDisplay, Version } from "@/types/player";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

// ── Composables ──────────────────────────────────────────────────────────
import { useAlbumColors } from "@/composables/hooks/useAlbumColors";
import { getArtistDisplay } from "@/composables/hooks/useArtist";
import { useLyricTimeline } from "@/composables/hooks/useLyricTimeline";
import { useProgressBar } from "@/composables/hooks/useProgressBar";
import {
    getDefaultVersion,
    getLyricResponse,
    isActivePhrase,
    loadSongData,
    parseLyrics,
} from "@/composables/hooks/useSongs";
import { useTranslation } from "@/composables/hooks/useTranslation";
import { useVolumeControl } from "@/composables/hooks/useVolumeControl";
import {
    ALBUM_GOOGLE_LINK_BASE,
    DEBUG_INFO,
    ORIGINAL,
    PLAYER_VERSION,
    TSL_PLAYER_LINK_BASE,
    TSL_SUFFIX,
} from "@/composables/utils/config";
import { copyToClipboard, scrollToLineIndex } from "@/composables/utils/global";

// ── 子組件 ─────────────────────────────────────────────────────────────
import ErrorDisplay from "@components/player/ErrorDisplay.vue";
import LoadingOverlay from "@components/player/LoadingOverlay.vue";
import LyricsContainer from "@components/player/lyrics/LyricsContainer.vue";
import TranslationBar from "@components/player/lyrics/TranslationBar.vue";
import AboutModal from "@components/player/modals/AboutModal.vue";
import CreditModal from "@components/player/modals/CreditModal.vue";
import SettingModal from "@components/player/modals/SettingModal.vue";
import ShareModal from "@components/player/modals/ShareModal.vue";
import PlaybackControls from "@components/player/PlaybackControls.vue";
import PlayerNav from "@components/player/PlayerNav.vue";
import ProgressBar from "@components/player/ProgressBar.vue";
import SongInfo from "@components/player/SongInfo.vue";
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
const isPaused = ref(true);
const isLoading = ref(true);
const isMuted = ref(false);
const isError = ref(false);
const errorMessage = ref("");
const currentSong = ref<SongWithDisplay>({} as SongWithDisplay);

// ── 設定項目 ─────────────────────────────────────────────────────────────
const lyricFontSize = ref<number>(
    Number(localStorage.getItem("lyricFontSize")) || 24,
);
const scrollToCurrentLine = ref(true);
const enableTranslation = ref(true);
const enablePronounciation = ref(false);
const enableLyricBackground = ref(true);
const mobilePanelCollapsed = ref(false);
const controllerPanelRef = ref<HTMLElement | null>(null);
const controllerPanelHeight = ref(185);

// ── Modals ──────────────────────────────────────────────────────────────
const settingModalOpen = ref(false);
const creditModalOpen = ref(false);
const shareModalOpen = ref(false);
const aboutModalOpen = ref(false);

// ── 核心 Composables 組合 ─────────────────────────────────────────────────
const { colors: albumColors } = useAlbumColors(() => currentSong.value?.art);

const {
    isDragging,
    isHoveringProgress,
    displayPercent,
    onBarMouseDown,
    onBarTouchStart,
} = useProgressBar(currentTime, songDuration, (ratio) => {
    if (songDuration.value > 0)
        window.ytPlayer?.seekTo(ratio * songDuration.value, true);
});

const {
    isDraggingVolume,
    isHoveringVolume,
    toggleMute,
    onVolumeMouseDown,
    onVolumeTouchStart,
} = useVolumeControl(volume, isMuted, (vol) => window.ytPlayer?.setVolume(vol));

const {
    processedLines,
    activeLineIndices,
    currentLineIndex,
    isCurrentLine,
    getPhraseStyle,
    getBackgroundPhraseStyle,
} = useLyricTimeline(jsonMappingContent, currentTime, songDuration);

const {
    translationText,
    backgroundTranslationText,
    translationAuthor,
    translationModified,
} = useTranslation(
    () => currentSong.value,
    () => processedLines.value,
    () => activeLineIndices.value,
);

// ── 計算屬性 ─────────────────────────────────────────────────────────────
const currentSongURI = computed(() => {
    if (!currentSong.value) return "";
    if (songVersion.value === ORIGINAL)
        return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}`;
    return `${TSL_PLAYER_LINK_BASE}?song=${currentSong.value.song_id}&version=${songVersion.value}`;
});

const currentVideoId = computed(() => {
    return (
        currentSong.value?.versions.find(
            (v: Version) => v.version === songVersion.value,
        )?.id ?? null
    );
});

// ── 播放方法 ─────────────────────────────────────────────────────────────
const playVideo = () => {
    window.ytPlayer?.playVideo();
    isPaused.value = false;
};
const pauseVideo = () => {
    window.ytPlayer?.pauseVideo();
    isPaused.value = true;
};
const rewind10Sec = () => window.ytPlayer?.seekTo(currentTime.value - 10, true);
const moveForward10Sec = () =>
    window.ytPlayer?.seekTo(currentTime.value + 10, true);

const jumpToCurrentLine = (index: number) => {
    const line = processedLines.value[index];
    if (line && window.ytPlayer) {
        window.ytPlayer.seekTo(line.time - 0.2);
        scrollToLineIndex(index);
    }
};

// ── 初始化與事件 ─────────────────────────────────────────────────────────
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
        }
        await loadSongLyric();
        isLoading.value = false;
    } catch (err: unknown) {
        isLoading.value = false;
        isError.value = true;
        errorMessage.value = err instanceof Error ? err.message : "未知錯誤";
    }
}

watch(lyricFontSize, (newSize) =>
    localStorage.setItem("lyricFontSize", String(newSize)),
);
watch(currentLineIndex, (newVal) => {
    if (
        newVal !== -1 &&
        typeof newVal !== "undefined" &&
        scrollToCurrentLine.value
    ) {
        scrollToLineIndex(newVal);
    }
});

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        settingModalOpen.value =
            creditModalOpen.value =
            shareModalOpen.value =
            aboutModalOpen.value =
                false;
    }
}

onMounted(() => {
    window.addEventListener("keydown", onKeydown);
    setup();
    if (controllerPanelRef.value) {
        const observer = new ResizeObserver((entries) => {
            const height = entries[0]?.contentRect.height;
            if (height) controllerPanelHeight.value = height;
        });
        observer.observe(controllerPanelRef.value);
        onUnmounted(() => observer.disconnect());
    }
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
        <LoadingOverlay v-if="isLoading" />

        <div class="x-20">
            <ErrorDisplay v-if="isError" :error-message="errorMessage" />
        </div>

        <template v-if="!isLoading && !isError && currentSong">
            <PlayerNav :dominant-color="albumColors.dominant" />

            <!-- 桌面版兩欄式 -->
            <div class="hidden md:flex flex-1 overflow-hidden pt-20">
                <!-- 左側面板 -->
                <div
                    class="left-panel flex flex-col items-center w-[40%] lg:w-[35%] overflow-y-auto pl-10 pr-6 py-6"
                >
                    <div class="video-container w-full max-w-95 lg:max-w-110">
                        <div
                            class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black"
                        >
                            <YTPlayer
                                v-if="currentVideoId"
                                :video-id="currentVideoId"
                                @update:current-time="currentTime = $event"
                                @update:is-paused="isPaused = $event"
                                @update:song-duration="songDuration = $event"
                            />
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

                    <SongInfo
                        :current-song="currentSong"
                        :song-version="songVersion"
                        @open-credit="creditModalOpen = true"
                    />

                    <ProgressBar
                        :current-time="currentTime"
                        :song-duration="songDuration"
                        :display-percent="displayPercent"
                        :is-dragging="isDragging"
                        v-model:is-hovering="isHoveringProgress"
                        @bar-mouse-down="onBarMouseDown"
                        @bar-touch-start="onBarTouchStart"
                    />

                    <PlaybackControls
                        :is-paused="isPaused"
                        @play="playVideo"
                        @pause="pauseVideo"
                        @rewind="rewind10Sec"
                        @forward="moveForward10Sec"
                    />

                    <!-- 音量與工具按鈕列表 -->
                    <div
                        class="utility-controls w-full max-w-95 lg:max-w-110 flex items-center justify-between"
                    >
                        <div class="flex items-center gap-2">
                            <button
                                @click="toggleMute"
                                class="text-white/50 hover:text-white transition-colors"
                            >
                                <span class="material-icons text-xl">{{
                                    volume === 0 || isMuted
                                        ? "volume_off"
                                        : "volume_up"
                                }}</span>
                            </button>
                            <div
                                class="relative w-24 cursor-pointer py-2 -my-2"
                                @mousedown="onVolumeMouseDown"
                                @touchstart.prevent="onVolumeTouchStart"
                                @mouseenter="isHoveringVolume = true"
                                @mouseleave="isHoveringVolume = false"
                            >
                                <div
                                    class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out bg-white/12"
                                    :class="{
                                        'h-1':
                                            !isHoveringVolume &&
                                            !isDraggingVolume,
                                        'h-1.5':
                                            isHoveringVolume &&
                                            !isDraggingVolume,
                                        'h-4': isDraggingVolume,
                                    }"
                                >
                                    <div
                                        class="absolute top-0 left-0 h-full rounded-full transition-[width] bg-[#FC3C44]"
                                        :style="{ width: volume + '%' }"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-1">
                            <button
                                @click="shareModalOpen = true"
                                class="p-2 text-white/50 hover:text-white rounded-full"
                            >
                                <span class="material-icons text-xl"
                                    >share</span
                                >
                            </button>
                            <button
                                @click="settingModalOpen = true"
                                class="p-2 text-white/50 hover:text-white rounded-full"
                            >
                                <span class="material-icons text-xl"
                                    >settings</span
                                >
                            </button>
                            <button
                                @click="aboutModalOpen = true"
                                class="p-2 text-white/30 hover:text-white/70"
                            >
                                <span class="material-icons text-lg">info</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 右側歌詞面板 -->
                <div
                    class="right-panel flex-1 overflow-hidden relative pr-10 pb-10"
                >
                    <LyricsContainer
                        :lines="processedLines"
                        :song="currentSong"
                        :active-line-indices="activeLineIndices"
                        :current-time="currentTime"
                        :enable-lyric-background="enableLyricBackground"
                        :enable-pronounciation="enablePronounciation"
                        :lyric-font-size="lyricFontSize"
                        :is-active-phrase="isActivePhrase"
                        :is-current-line="isCurrentLine"
                        :get-phrase-style="getPhraseStyle"
                        :get-background-phrase-style="getBackgroundPhraseStyle"
                        @jump="jumpToCurrentLine"
                    />
                    <TranslationBar
                        v-if="enableTranslation"
                        :song="currentSong"
                        :translation-text="translationText"
                        :background-translation-text="backgroundTranslationText"
                        :translation-author="translationAuthor"
                        :translation-modified="translationModified"
                        class="z-2 absolute bottom-6 md:bottom-10 left-4 right-auto max-w-md md:max-w-none md:w-2/5"
                    />
                </div>
            </div>

            <!-- 手機版 Layout（略，可套用相同解耦後的按鈕與狀態） -->

            <!-- Modals -->
            <SettingModal
                :is-open="settingModalOpen"
                v-model:enable-lyric-background="enableLyricBackground"
                v-model:scroll-to-current-line="scrollToCurrentLine"
                v-model:enable-translation="enableTranslation"
                v-model:enable-pronounciation="enablePronounciation"
                v-model:lyric-font-size="lyricFontSize"
                :furigana-available="currentSong.furigana == 1"
                @close="settingModalOpen = false"
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
