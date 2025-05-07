import { createApp, ref, computed, onMounted, watch } from "vue";

import {
    ALBUM_GOOGLE_LINK_BASE,
    INSTRUMENTAL,
    THE_FIRST_TAKE,
    ORIGINAL,
    MERCURY_TSL,
    DEBUG_INFO,
    TSL_PLAYER_LINK_BASE,
} from "./utils/config.js";
import {
    formatTime,
    scrollToLineIndex,
    copyToClipboard,
} from "./utils/global.js";
import { useLyrics } from "./player/handles/lyricsHandle.js";
import { initYouTubePlayer } from "./player/yt/onReadyPlayer.js";
import {
    loadSongList,
    setDefaultVersion,
} from "./player/handles/songsHandle.js";
import {
    initAboutModal,
    initCreditModal,
    initSettingModal,
    initSongModal,
    initShareModal,
} from "./utils/modal.js";
import {
    generatePhraseStyle,
    isActivePhrase,
} from "./player/handles/phrasesHandle.js";
import { useTransation } from "./player/handles/translationHandle.js";
import { onPlayerChangeSongVideo } from "./player/yt/changeVideo.js";
import { initControllerPanel } from "./utils/controllerPanel.js";

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

const app = createApp({
    setup() {
        // 響應式狀態
        const currentTime = ref(0);
        const songDuration = ref(0);
        const songList = ref([]);
        const songVersion = ref(null);
        const currentSong = ref(null);
        const scrollToCurrentLine = ref(true);
        const enableTranslation = ref(true);
        const enablePronounciation = ref(false);
        const enableLyricBackground = ref(true);
        const isPaused = ref(true);

        const bodyBgColor = bodyBackgroundColor;
        const colorOptions = [
            "#365456", // 保留原色
            "#CC5200", // 原#FF6900 → 深琥珀橙
            "#D49A00", // 原#FCB900 → 暗金黃
            "#4A9B7D", // 原#7BDCB5 → 墨綠
            "#00855C", // 原#00D084 → 深翡翠綠
            "#3A7A9E", // 原#8ED1FC → 午夜藍
            "#0A5D8C", // 原#0693E3 → 深海藍
            "#6B7984", // 原#ABB8C3 → 石板灰
            "#8C0D2B", // 原#EB144C → 勃艮第紅
            "#9E4D64", // 原#F78DA7 → 酒紅
            "#4A0B6B", // 原#9900EF → 皇家紫
            "#404040", // 原#FFFFFF → 炭灰
            "#101010", // 原#000000 → 深淵黑
        ];

        // 計算屬性
        const formattedCurrentTime = computed(() =>
            formatTime(currentTime.value)
        );
        const formattedSongDuration = computed(() =>
            formatTime(songDuration.value)
        );

        const currentSongURI = computed(
            () => {
                if(songVersion.value == ORIGINAL) return TSL_PLAYER_LINK_BASE + "?song=" + currentSong.value.song_id
                else return TSL_PLAYER_LINK_BASE + "?song=" + currentSong.value.song_id + "&version=" + songVersion.value
            }
        );

        const { jsonMappingContent, currentLineIndex, loadLyrics } = useLyrics(
            currentSong,
            songVersion,
            currentTime,
            songDuration
        );

        const {
            translationText,
            backgroundTranslationText,
            translationAuthor,
        } = useTransation(currentSong, jsonMappingContent, currentLineIndex);

        // 跳至指定行
        const jumpToCurrentLine = (index) => {
            const line = jsonMappingContent.value[index];
            if (line && window.ytPlayer) {
                window.ytPlayer.seekTo(line.time);
                scrollToLineIndex(index);
            }
        };

        const isCurrentLine = (index) => {
            // need more rewriting
            //     let isNotYetFinished = false;
            //     let line = jsonMappingContent.value[index];

            //     if (line.end_time) {
            //         isNotYetFinished =
            //             line?.end_time > currentTime.value &&
            //             currentTime.value > line?.time &&
            //             currentLineIndex.value > index;
            //         return index === currentLineIndex.value || isNotYetFinished;
            //     } else return index === currentLineIndex.value;
            return index === currentLineIndex.value;
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

        // 初始化流程
        onMounted(async () => {
            try {
                // 載入歌曲列表
                songList.value = await loadSongList();
                songList.value = songList.value.filter(
                    (song) => song.available === true
                );

                // 調試：輸出實際加載的歌曲列表
                console.log(
                    "Available songs:",
                    songList.value.map((s) => `${s.song_id} - ${s.name}`)
                );

                const matchedSong = songList.value.find(
                    (song) => parseInt(song.song_id) === songRequest
                );

                // 檢查歌曲列表是否為空
                if (songList.value.length === 0) {
                    console.error("沒有可用歌曲");
                    return;
                }

                if (matchedSong) {
                    console.log(`已帶入指定歌曲 ID: ${songRequest} - ${matchedSong.name}`);
                    currentSong.value = matchedSong;
                } else {
                    currentSong.value = songList.value[0];
                    console.warn(
                        `未定義指定歌曲 ID、歌曲未啟用或該歌曲 ID 不存在: ${songRequest}, 使用第一首歌曲`
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
                    songVersion.value = setDefaultVersion(currentSong);
                    console.warn(
                        `未定義指定版本、版本未啟用或該版本不存在: ${versionRequest}, 使用該首歌曲的預設版本`
                    );
                }

                // 初始化播放器
                const { init } = initYouTubePlayer({
                    currentSong,
                    currentTime,
                    songDuration,
                    songVersion,
                    isPaused,
                });
                window.ytPlayer = await init();

                // 初始化模態框
                initSettingModal();
                initCreditModal();
                initSongModal();
                initControllerPanel();
                initAboutModal();
                initShareModal();

                // 初始化時讀取保存的顏色
                const savedColor = localStorage.getItem("bodyBackgroundColor");
                if (savedColor) {
                    bodyBackgroundColor.value = savedColor;
                } else {
                    document.body.style.backgroundColor =
                        bodyBackgroundColor.value; // 應用初始顏色
                }
            } catch (error) {
                console.error("初始化錯誤: ", error);
            }
        });

        // 監聽歌曲切換
        watch(currentSong, async (newSong) => {
            if (!newSong) return;

            document.title = currentSong.value.title + MERCURY_TSL;

            const matchedVersion = currentSong.value.versions?.find(
                (v) => v.version.trim().toLowerCase() === songVersion.value
            );

            if (matchedVersion) {
                console.log(`已帶入指定版本: ${versionRequest}`);
            } else {
                songVersion.value = setDefaultVersion(currentSong);
                console.warn(
                    `未定義指定版本、版本未啟用或該版本不存在: ${versionRequest}, 使用該首歌曲的預設版本`
                );
            }

            // 調試：輸出歌詞文件路徑
            console.log(
                `Loading lyrics from: ${newSong.name}/${songVersion.value}.json`
            );

            // 載入新歌詞
            loadLyrics(newSong.name, songVersion);

            onPlayerChangeSongVideo(currentSong, songVersion, window.ytPlayer);

            // 跳回開頭
            jumpToCurrentLine(0);

            resetTimer();
        });

        watch(currentLineIndex, (newVal) => {
            if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
        });

        watch(songVersion, async (newVal) => {
            if (!currentSong.value.versions) return;

            // 調試：輸出歌詞文件路徑
            console.log(
                `Loading lyrics from:${currentSong.value.name}/${newVal}.json`
            );

            // 載入新歌詞
            loadLyrics(currentSong.value.name, newVal);

            onPlayerChangeSongVideo(currentSong, songVersion, window.ytPlayer);

            // 跳回開頭
            jumpToCurrentLine(0);

            resetTimer();
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

        return {
            ALBUM_GOOGLE_LINK_BASE,
            THE_FIRST_TAKE,
            INSTRUMENTAL,
            ORIGINAL,
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
            bodyBackgroundColor: bodyBgColor,
            colorOptions,
            isPaused,
            debugInfo: DEBUG_INFO,
            playVideo,
            pauseVideo,
            rewind10Sec,
            moveForward10Sec,
            initSettingModal,
            initCreditModal,
            initYouTubePlayer,
            initControllerPanel,
            initShareModal,
            initAboutModal,
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
    },
});

app.mount("#app");