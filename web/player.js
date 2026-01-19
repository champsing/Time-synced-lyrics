import { computed, createApp, onMounted, ref, watch } from "vue";

import {
    generatePhraseStyle,
    isActivePhrase,
} from "./player/handles/phrasesHandle.js";
import {
    getDefaultVersion,
    getLyricResponse,
    loadSongData,
} from "./player/handles/songsHandle.js";
import { useTransation } from "./player/handles/translationHandle.js";
import { initYouTubePlayer } from "./player/yt/onReadyPlayer.js";
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
import { getArtistDisplay } from "./player/handles/artistsHandle.js";

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
    const volume = ref(sessionStorage.getItem("volume") || 70);
    const songVersion = ref(null);
    const currentSong = ref(null);
    const jsonMappingContent = ref(null);
    const scrollToCurrentLine = ref(true);
    const enableTranslation = ref(true);
    const enablePronounciation = ref(false);
    const enableLyricBackground = ref(true);
    const isPaused = ref(true);
    const isLoading = ref(true);
    const isMuted = ref(false);

    const colorOptions = ref([{ color: "#365456", name: "預設 II：礦石靛" }]);

    // 非同步讀取 JSON
    const fetchColors = async () => {
        try {
            const response = await fetch("/web/utils/colorOptions.json");
            colorOptions.value = await response.json();
        } catch (err) {
            console.error("無法讀取顏色設定檔:", err);
        }
    };

    const bgColorName = computed(
        () =>
            colorOptions.value.filter(
                (x) => x.color === bodyBackgroundColor.value,
            )[0].name || colorOptions.value[0].name,
    );

    // 計算屬性
    const formattedCurrentTime = computed(() => formatTime(currentTime.value));
    const formattedSongDuration = computed(() =>
        formatTime(songDuration.value),
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

    const processedLines = computed(() => {
        if (!jsonMappingContent.value) return [];

        const outcome = jsonMappingContent.value.map((line) => {
            // 計算主歌詞的總時長
            const mainTotalDuration = line.duration.reduce((a, b) => a + b, 0);

            // 主歌詞的結束時間 (預設使用主歌詞的 startTime + mainTotalDuration)
            let maxEndTime = line.time + mainTotalDuration;

            // 處理 duration 防呆 (如果是 0，給個預設值，例如 3秒)
            const validDuration =
                mainTotalDuration > 0 ? mainTotalDuration : 3.0;

            const lineBG = line.background_voice;
            if (lineBG) {
                // 🚨 新增邏輯：檢查背景和聲的結束時間 🚨
                if (lineBG.time !== undefined && lineBG.duration) {
                    // 計算背景和聲的總時長
                    const bgTotalDuration = lineBG.duration.reduce(
                        (a, b) => a + b,
                        0,
                    );

                    // 背景和聲的實際結束時間
                    const bgEndTime = lineBG.time + bgTotalDuration;

                    // 取主歌詞結束時間 和 背景和聲結束時間 兩者的最大值
                    maxEndTime = Math.max(maxEndTime, bgEndTime);
                }
            }

            // 如果 maxEndTime <= line.startTime (例如主歌詞 totalDuration 也是 0 的情況)
            // 則使用 validDuration 作為安全預設值
            const finalEndTime =
                maxEndTime > line.time ? maxEndTime : line.time + validDuration;

            return {
                ...line,
                computedEndTime: finalEndTime,
            };
        });

        console.log(songVersion.value, outcome);
        return outcome;
    });

    // 2. 核心邏輯：找出所有「現在應該顯示」的行數索引
    const activeLineIndices = computed(() => {
        if (!processedLines.value) return [];

        const activeIndices = [];
        const now = currentTime.value;

        // 提早 0.3 秒顯示 (配合您原本的邏輯)
        const startOffset = 0.3;

        // 延後 0.2 秒消失 (選用：讓歌詞唱完後稍微停留一下下再消失，感覺比較平滑)
        // 如果想要唱完字瞬間消失，將此設為 0 即可
        const endBuffer = 0.2;

        processedLines.value.forEach((line, index) => {
            // 定義顯示區間：
            // 開始：表定時間 - 0.3秒
            // 結束：表定時間 + 總時長 + 0.2秒緩衝
            const startTime = line.time - startOffset;
            const endTime = line.computedEndTime + endBuffer;

            // 如果現在時間落在這個區間內，這行就是 active
            if (now >= startTime && now < endTime) {
                activeIndices.push(index);
            }
        });

        return activeIndices;
    });

    // 3. 樣式判斷函式
    // 直接檢查該 index 是否在活躍陣列中
    const isCurrentLine = (index) => {
        return activeLineIndices.value.includes(index);
    };

    // 4. 定義 currentLineIndex 以相容舊邏輯 (例如捲動、其他依賴單一行數的功能)
    // 我們取活躍行中的最後一行 (通常是最新開始的一行) 作為當前主要行
    const currentLineIndex = computed(() => {
        if (!activeLineIndices.value || activeLineIndices.value.length === 0) {
            return -1;
        }
        return activeLineIndices.value[activeLineIndices.value.length - 1];
    });

    // 將 activeLineIndices 傳入翻譯處理，以支援多行翻譯
    const { translationText, backgroundTranslationText, translationAuthor } =
        useTransation(currentSong, jsonMappingContent, activeLineIndices);

    // 跳至指定行
    const jumpToCurrentLine = (index) => {
        const line = jsonMappingContent.value[index];
        if (line && window.ytPlayer) {
            window.ytPlayer.seekTo(line.time - 0.2);
            scrollToLineIndex(index);
        }
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
            phraseIndex,
        );
    };

    const getPhraseStyle = (lineIndex, phraseIndex) => {
        if (!isCurrentLine(lineIndex)) return {};

        // 檢查 jsonMappingContent.value 是否存在，並安全存取 line
        const line = jsonMappingContent.value?.[lineIndex];

        return generatePhraseStyle(currentTime.value, line, phraseIndex);
    };

    async function loadSongLyric(song, version) {
        if (!song) return;

        document.title = song.value.title + MERCURY_TSL;

        // 載入新歌詞
        // development

        jsonMappingContent.value = await parseLyrics(
            await getLyricResponse(song.value.folder, version.value),
            currentSong,
            songDuration.value,
        );
    }

    watch(currentLineIndex, (newVal) => {
        if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
    });

    watch(volume, (newVal) => {
        const slider = document.getElementById("player-volume-slider");
        if (slider) {
            slider.style.setProperty("--value", newVal);
        }
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

    const parseSubtitle = (subtitle) => {
        return subtitle?.replace(/\\n/g, "\n") || "";
    };

    const toggleMute = () => {
        if (isMuted.value) {
            window.ytPlayer.unMute();
            isMuted.value = false;
        } else {
            window.ytPlayer.mute();
            isMuted.value = true;
        }
    };

    const changeVolume = (newVolume) => {
        volume.value = newVolume;
        window.ytPlayer.setVolume(newVolume);
        if (volume.value === 0) {
            isMuted.value = true;
        } else {
            isMuted.value = false;
        }
        sessionStorage.setItem("volume", newVolume);
    };

    async function setupPlayerAndLoadSong() {
        // 1. 初始化播放器
        try {
            const { init } = await initYouTubePlayer({
                currentSong,
                songVersion,
                currentTime,
                songDuration,
                isPaused,
            });

            window.ytPlayer = await init();

            // jumpToCurrentLine(0);
        } catch (e) {
            console.error("播放器初始化失敗", e);
        }
    }

    // 初始化流程
    onMounted(async () => {
        try {
            if (songRequest) {
                let requestSongData;
                if (sessionStorage.getItem(songRequest))
                    requestSongData = JSON.parse(
                        sessionStorage.getItem(songRequest),
                    );
                else requestSongData = await loadSongData(songRequest);
                console.log(
                    `已帶入指定歌曲 ID: ${songRequest} - ${requestSongData.folder}`,
                );
                if (requestSongData && requestSongData.available)
                    currentSong.value = requestSongData;
                else {
                    currentSong.value = null;
                    throw new Error("指定歌曲不存在未被啟用");
                }
            } else {
                currentSong.value = null;
                throw new Error(
                    "未定義指定歌曲 ID、歌曲未啟用或該歌曲 ID 不存在, 請由選歌系統選擇歌曲, 勿直接訪問 /player/ 目錄",
                );
            }

            // 這時歌曲才確定，才開始設定版本

            const matchedVersion = currentSong.value.versions?.find(
                (v) => v.version.trim().toLowerCase() === versionRequest,
            );

            if (matchedVersion) {
                console.log(`已帶入指定版本: ${versionRequest}`);
                songVersion.value = versionRequest;
            } else {
                songVersion.value = getDefaultVersion(currentSong);
                console.warn(
                    `未定義指定版本、版本未啟用或該版本不存在: ${versionRequest}, 使用該首歌曲的預設版本`,
                );
            }

            loadSongLyric(currentSong, songVersion);

            currentSong.value.displayArtist = await getArtistDisplay(
                currentSong.value.artist,
            );

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
            await fetchColors(); // 讀取顏色
            await setupPlayerAndLoadSong();
            // 初始化模態框
            initSettingModal();
            initCreditModal();
            initControllerPanel();
            initAboutModal();
            initShareModal();
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
        bgColorName,
        isPaused,
        isMuted,
        isLoading,
        debugInfo: DEBUG_INFO,
        fetchColors,
        parseSubtitle,
        playVideo,
        pauseVideo,
        rewind10Sec,
        moveForward10Sec,
        toggleMute,
        changeVolume,
        initYouTubePlayer,
        copyToClipboard,
        jumpToCurrentLine,
        getArtistDisplay,
        getPhraseStyle,
        getBackgroundPhraseStyle,
        isCurrentLine,
        isActivePhrase,
        isKiai: (line, phraseIndex) => line.text[phraseIndex].kiai,
        isBackgroundKiai: (line, phraseIndex) =>
            line.background_voice.text[phraseIndex].kiai,
    };
}

const app = createApp({
    setup() {
        return main();
    },
});

app.mount("#app");
