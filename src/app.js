const { createApp, ref, computed, onMounted, watch } = Vue;

import {
    VERSION,
    ALBUM_GOOGLE_LINK_BASE,
    INSTRUMENTAL,
    THE_FIRST_TAKE,
    ORIGINAL,
    MERCURY_TSL,
    TSL_LINK_BASE,
} from "./modules/utils/config.js";
import {
    formatTime,
    scrollToLineIndex,
    copyToClipboard,
} from "./modules/utils/global.js";
import { useLyrics } from "./modules/handles/lyricsHandle.js";
import { initYouTubePlayer } from "./modules/players/onReadyPlayer.js";
import {
    loadSongList,
    setDefaultVersion,
} from "./modules/handles/songsHandle.js";
import {
    initCreditModal,
    initSettingModal,
    initSongModal,
} from "./modules/utils/modal.js";
import {
    generatePhraseStyle,
    isActivePhrase,
} from "./modules/utils/generatePhraseStyle.js";
import { useTransation } from "./modules/handles/translationHandle.js";

// 版本顯示
document.getElementById("version").innerText = `播放器版本：${VERSION}`;

const params = new URL(document.URL).searchParams;
const songRequest = decodeURIComponent(params.get("song")).trim().toLowerCase();
// const versionRequest = decodeURIComponent(params.get("version")).trim().toLowerCase();

const app = createApp({
    setup() {
        // 響應式狀態
        const currentTime = ref(0);
        const songDuration = ref(0);
        const songList = ref([
            {
                name: "",
            },
        ]);
        const songVersion = ref(ORIGINAL);
        const currentSong = ref(songList.value[0]);
        const scrollToCurrentLine = ref(true);
        const toggleTranslation = ref(true);
        const togglePronounciation = ref(false);

        // 計算屬性
        const formattedCurrentTime = computed(() =>
            formatTime(currentTime.value)
        );
        const formattedSongDuration = computed(() =>
            formatTime(songDuration.value)
        );

        const currentSongURI = computed(
            () => TSL_LINK_BASE + "?song=" + currentSong.value.name
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
                    songList.value.map((s) => s.name)
                );

                const matchedSong = songList.value.find(
                    (song) => song.name.trim().toLowerCase() === songRequest
                );

                // 檢查歌曲列表是否為空
                if (songList.value.length === 0) {
                    console.error("沒有可用歌曲");
                    return;
                }

                if (matchedSong) {
                    console.log(`已帶入指定歌曲: ${songRequest}`);
                    currentSong.value = matchedSong;
                } else {
                    currentSong.value = songList.value[0];
                    console.warn(
                        `未定義指定歌曲或歌曲未啟用: ${songRequest}, 使用第一首歌曲`
                    );
                }

                songVersion.value = setDefaultVersion(currentSong);

                // 初始化播放器
                const { init } = initYouTubePlayer({
                    currentSong,
                    currentTime,
                    songDuration,
                    songVersion,
                });
                window.ytPlayer = await init();

                // 載入歌詞
                loadLyrics(currentSong, songVersion);

                // 初始化模態框
                initSettingModal();
                initCreditModal();
                initSongModal();
            } catch (error) {
                console.error("初始化錯誤: ", error);
            }
        });

        // 監聽歌曲切換
        watch(currentSong, async (newSong) => {
            if (!newSong) return;

            document.title = currentSong.value.title + MERCURY_TSL;

            songVersion.value = setDefaultVersion(currentSong);

            // 調試：輸出歌詞文件路徑
            console.log(
                `Loading lyrics from: ${newSong.name}/${songVersion.value}.json`
            );

            // 載入新歌詞
            loadLyrics(newSong.name, songVersion);

            // 跳回開頭
            jumpToCurrentLine(0);

            const videoID = currentSong.value.versions.find(
                (v) => v.version === songVersion.value
            ).id;
            console.log(videoID);

            window.ytPlayer.loadVideoById(videoID);
            window.ytPlayer.pauseVideo();

            // 清空現在時刻跟影片長度
            currentTime.value = 0;
            songDuration.value = 0;
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

            // 切換YouTube視頻
            if (newVal == ORIGINAL)
                window.ytPlayer.loadVideoById(
                    currentSong.value.versions.find(
                        (v) => v.version === ORIGINAL
                    ).id
                );
            else if (newVal == THE_FIRST_TAKE)
                window.ytPlayer.loadVideoById(
                    currentSong.value.versions.find(
                        (v) => v.version === THE_FIRST_TAKE
                    ).id
                );
            else if (newVal == INSTRUMENTAL)
                window.ytPlayer.loadVideoById(
                    currentSong.value.versions.find(
                        (v) => v.version === INSTRUMENTAL
                    ).id
                );
            else {
                window.ytPlayer.loadVideoById("");
                console.error(`找不到 ${newVal} 版本的影片 ID`);
            }

            window.ytPlayer.pauseVideo();
            // 清空現在時刻跟影片長度
            currentTime.value = 0;
            songDuration.value = 0;
        });

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
            togglePronounciation,
            currentSong,
            currentSongURI,
            scrollToCurrentLine,
            toggleTranslation,
            formattedCurrentTime,
            formattedSongDuration,
            translationText,
            backgroundTranslationText,
            translationAuthor,
            initSettingModal,
            initCreditModal,
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
    },
});

app.mount("#app");
