import { computed, createApp, onMounted, ref, watch } from "vue";

import {
    generatePhraseStyle,
    isActivePhrase,
} from "./player/handles/phrasesHandle.js";
import {
    getDefaultVersion,
    getLyricResponsefromFile,
    getLyricResponsefromAPI,
    loadSongData,
} from "./player/handles/songsHandle.js";
import { useTransation } from "./player/handles/translationHandle.js";
import { initYouTubePlayer } from "./player/yt/onReadyPlayer.js";
import { onPlayerChangeSongVideo } from "./player/yt/changeVideo.js";
import {
    ALBUM_GOOGLE_LINK_BASE,
    DEBUG_INFO,
    INSTRUMENTAL,
    LIVE,
    MERCURY_TSL,
    ORIGINAL,
    THE_FIRST_TAKE,
    TSL_PLAYER_LINK_BASE,
} from "./utils/config.js";
import { initControllerPanel } from "./player/controllerPanel.js";
import {
    copyToClipboard,
    formatTime,
    scrollToLineIndex,
} from "./utils/global.js";
import {
    initAboutModal,
    initCreditModal,
    initSettingModal,
    initShareModal,
} from "./utils/modal.js";
import { parseLyrics } from "./player/handles/lyricsHandle.js";

const bodyBackgroundColor = ref("#365456");

watch(bodyBackgroundColor, (newColor) => {
    document.body.style.backgroundColor = newColor;
    localStorage.setItem("bodyBackgroundColor", newColor);
});

const params = new URL(document.URL).searchParams;
const songRequest = parseInt(decodeURIComponent(params.get("song")));
const versionRequest = decodeURIComponent(params.get("version"))
    .trim()
    .toLowerCase();

function main() {
    // 響應式狀態
    const currentTime = ref(0);
    const songDuration = ref(0);
    const songList = ref([]);
    const songVersion = ref(null);
    const currentSong = ref(null);
    const jsonMappingContent = ref(null);
    const scrollToCurrentLine = ref(true);
    const enableTranslation = ref(true);
    const enablePronounciation = ref(false);
    const enableLyricBackground = ref(true);
    const isPaused = ref(true);
    const isLoading = ref(true);

    const colorOptions = [
        "#365456", // 保留原色
        "#CC5200", // 深琥珀橙
        "#D49A00", // 暗金黃
        "#4A9B7D", // 墨綠
        "#00855C", // 深翡翠綠
        "#3A7A9E", // 午夜藍
        "#0A5D8C", // 深海藍
        "#6B7984", // 石板灰
        "#8C0D2B", // 勃艮第紅
        "#a48b8b",
        "#9E4D64", // 酒紅
        "#4A0B6B", // 皇家紫
        "#404040", // 炭灰
        "#101010", // 深淵黑
    ];

    // 計算屬性
    const formattedCurrentTime = computed(() => formatTime(currentTime.value));
    const formattedSongDuration = computed(() =>
        formatTime(songDuration.value)
    );

    const currentSongURI = computed(() => {
        if (songVersion.value == ORIGINAL)
            return TSL_PLAYER_LINK_BASE + "?song=" + currentSong.value.song_id;
        else
            return (
                TSL_PLAYER_LINK_BASE +
                "?song=" +
                currentSong.value.song_id +
                "&version=" +
                songVersion.value
            );
    });

    const currentLineIndex = computed(() => {
        if (!jsonMappingContent.value) return -1;
        for (let i = jsonMappingContent.value.length - 1; i >= 0; i--) {
            if (currentTime.value >= jsonMappingContent.value[i].time) {
                return i;
            }
        }
        return -1;
    });

    const { translationText, backgroundTranslationText, translationAuthor } =
        useTransation(currentSong, jsonMappingContent, currentLineIndex);

    // 跳至指定行
    const jumpToCurrentLine = (index) => {
        const line = jsonMappingContent.value[index];
        if (line && window.ytPlayer) {
            window.ytPlayer.seekTo(line.time);
            scrollToLineIndex(index);
        }
    };

    const isCurrentLine = (index) => {
        const currentIndex = currentLineIndex.value;

        // 基本條件：當前索引是否匹配
        if (index === currentIndex) return true;

        // 獲取當前播放行的數據
        const currentLine = jsonMappingContent.value[currentIndex];

        if (!currentLine || !currentLine.concurrent_lines) return false;

        // 檢查當前播放行是否有定義 concurrent_lines 且包含目標索引
        const isConcurrentLine =
            currentLine.concurrent_lines.includes(index) ?? false;

        return isConcurrentLine;
    };

    const getBackgroundPhraseStyle = (lineIndex, phraseIndex) => {
        if (!isCurrentLine(lineIndex)) return {};
        // 檢查 jsonMappingContent.value 是否存在，並安全存取 line
        const line = jsonMappingContent.value?.[lineIndex];

        // 若 line.background_voice 不存在，直接返回空樣式
        if (!line.background_voice) return {};

        return generatePhraseStyle(
            currentTime.value,
            line.background_voice,
            phraseIndex
        );
    };

    const getPhraseStyle = (lineIndex, phraseIndex) => {
        if (!isCurrentLine(lineIndex)) return {};

        // 檢查 jsonMappingContent.value 是否存在，並安全存取 line
        const line = jsonMappingContent.value?.[lineIndex];

        return generatePhraseStyle(currentTime.value, line, phraseIndex);
    };

    const resetTimer = () => {
        // 清空現在時刻跟影片長度
        currentTime.value = 0;
        songDuration.value = 0;
    };

    async function loadSongLyric(song, version) {
        if (!song) return;

        document.title = song.value.title + MERCURY_TSL;

        // 載入新歌詞
        // development
        const rawJson = await getLyricResponsefromFile(
            song.value.folder,
            version.value
        );
        jsonMappingContent.value = parseLyrics(
            rawJson,
            currentSong,
            songDuration.value
        );
        // prod
        // jsonMappingContent.value = await getLyricResponsefromAPI(
        //     song.value.song_id,
        //     version.value
        // );

        console.log(version.value, jsonMappingContent.value);
    }

    watch(currentLineIndex, (newVal) => {
        if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
    });

    const playVideo = () => {
        window.ytPlayer.playVideo();
        isPaused.value = false;
    };

    const pauseVideo = () => {
        window.ytPlayer.pauseVideo();
        isPaused.value = true;
    };

    const rewind10Sec = () =>
        window.ytPlayer.seekTo(currentTime.value - 10, true);

    const moveForward10Sec = () =>
        window.ytPlayer.seekTo(currentTime.value + 10, true);

    async function setupPlayerAndLoadSong() {
        // 1. 初始化播放器
        try {
            const { init } = await initYouTubePlayer({
                currentSong,
                currentTime,
                songDuration,
                songVersion,
                isPaused,
            });

            window.ytPlayer = await init();

            onPlayerChangeSongVideo(currentSong, songVersion, window.ytPlayer);
            jumpToCurrentLine(0);
            resetTimer();
        } catch (e) {
            console.error("播放器初始化失敗", e);
        }
    }

    // 初始化流程
    onMounted(async () => {
        try {
            if (songRequest) {
                const requestSongData = await loadSongData(songRequest);
                console.log(
                    `已帶入指定歌曲 ID: ${songRequest} - ${requestSongData.folder}`
                );
                currentSong.value = requestSongData;
            } else {
                currentSong.value = null;
                console.warn(
                    `未定義指定歌曲 ID、歌曲未啟用或該歌曲 ID 不存在, 請由選歌系統選擇歌曲, 勿直接訪問 /player/ 目錄`
                );
            }

            // 這時歌曲才確定，才開始設定版本

            const matchedVersion = currentSong.value.versions?.find(
                (v) => v.version.trim().toLowerCase() === versionRequest
            );

            if (matchedVersion) {
                console.log(`已帶入指定版本: ${versionRequest}`);
                songVersion.value = versionRequest;
            } else {
                songVersion.value = getDefaultVersion(currentSong);
                console.warn(
                    `未定義指定版本、版本未啟用或該版本不存在: ${versionRequest}, 使用該首歌曲的預設版本`
                );
            }

            loadSongLyric(currentSong, songVersion);

            await setupPlayerAndLoadSong();

            // 初始化模態框
            initSettingModal();
            initCreditModal();
            initControllerPanel();
            initAboutModal();
            initShareModal();

            // 初始化時讀取保存的顏色
            const savedColor = localStorage.getItem("bodyBackgroundColor");
            if (savedColor) {
                bodyBackgroundColor.value = savedColor;
            } else {
                document.body.style.backgroundColor = bodyBackgroundColor.value; // 應用初始顏色
            }
        } catch (error) {
            console.error("初始化錯誤: ", error);
        } finally {
            isLoading.value = false;
        }
    });

    return {
        ALBUM_GOOGLE_LINK_BASE,
        THE_FIRST_TAKE,
        INSTRUMENTAL,
        ORIGINAL,
        LIVE,
        jsonMappingContent,
        currentTime,
        currentLineIndex,
        songDuration,
        songList,
        songVersion,
        enablePronounciation,
        enableLyricBackground,
        enableTranslation,
        currentSong,
        currentSongURI,
        scrollToCurrentLine,
        formattedCurrentTime,
        formattedSongDuration,
        translationText,
        backgroundTranslationText,
        translationAuthor,
        bodyBackgroundColor,
        colorOptions,
        isPaused,
        isLoading,
        debugInfo: DEBUG_INFO,
        playVideo,
        pauseVideo,
        rewind10Sec,
        moveForward10Sec,
        initYouTubePlayer,
        copyToClipboard,
        jumpToCurrentLine,
        getPhraseStyle,
        getBackgroundPhraseStyle,
        isCurrentLine,
        isActivePhrase,
        isKiai: (line, phraseIndex) => line.text[phraseIndex].kiai,
        isBackgroundKiai: (line, phraseIndex) =>
            line.background_voice.text[phraseIndex].kiai,
        queryAlternativeVersion: (version) => {
            return currentSong.value.versions?.find(
                (x) => x.version === version
            );
        },
    };
}

const app = createApp({
    setup() {
        return main();
    },
});

app.mount("#app");
