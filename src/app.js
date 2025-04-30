const { createApp, ref, computed, onMounted, watch } = Vue;

import {
    VERSION,
    ALBUM_GOOGLE_LINK_BASE,
    INSTRUMENTAL,
    THE_FIRST_TAKE,
} from "./modules/config.js";
import { formatTime, scrollToLineIndex, parseLyrics } from "./modules/utils.js";
import { initYouTubePlayer } from "./modules/player.js";
import { loadSongList, getLyricFilePath } from "./modules/songList.js";
import { initCreditModal, initSettingModal } from "./modules/modal.js";

// 版本顯示
document.getElementById("version").innerText = `播放器版本：${VERSION}`;

const params = new URL(document.URL).searchParams;
const songRequest = decodeURIComponent(params.get("song")).trim().toLowerCase();

const app = createApp({
    setup() {
        // 響應式狀態
        const jsonMappingContent = ref(null);
        const currentTime = ref(0);
        const songDuration = ref(0);
        const songList = ref([
            {
                name: "",
            },
        ]);
        const songVersion = ref("default");
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

        const currentLineIndex = computed(() => {
            if (!jsonMappingContent.value) return -1;
            for (let i = jsonMappingContent.value.length - 1; i >= 0; i--) {
                if (currentTime.value >= jsonMappingContent.value[i].time) {
                    return i;
                }
            }
            return -1;
        });

        const translationText = computed(() => {
            if (!jsonMappingContent.value || currentLineIndex.value === -1)
                return "";
            return (
                jsonMappingContent.value[currentLineIndex.value]?.translation ||
                ""
            );
        });

        const backgroundTranslationText = computed(() => {
            if (
                !jsonMappingContent.value[currentLineIndex.value] ||
                currentLineIndex.value === -1
            )
                return "";
            return (
                jsonMappingContent.value[currentLineIndex.value]
                    .background_voice?.translation || ""
            );
        });

        const translationAuthor = computed(() => {
            if (!currentSong.value.translation?.author) return "";
            if (currentSong.value.translation?.modified === true)
                return currentSong.value.translation?.author + "〔已修改〕";
            else return currentSong.value.translation?.author;
        });

        // 方法
        const jumpToCurrentLine = (index) => {
            const line = jsonMappingContent.value[index];
            if (line && window.ytPlayer) {
                window.ytPlayer.seekTo(line.time);
                scrollToLineIndex(index);
            }
        };

        const getBackgroundPhraseStyle = (lineIndex, phraseIndex) => {
            if (lineIndex !== currentLineIndex.value) return {};
            // 檢查 jsonMappingContent.value 是否存在，並安全存取 line
            const line = jsonMappingContent.value?.[lineIndex];

            // 若 line.background_voice 不存在，直接返回空樣式
            if (!line.background_voice) return {};

            // 安全存取 line.time，若不存在則給默認值 0
            const lineTime = line.background_voice.time || 0;

            // 安全存取陣列元素，避免 phraseIndex 超出範圍
            const delay = line.background_voice.delay?.[phraseIndex] || 0;
            const duration = line.background_voice.duration?.[phraseIndex] || 0;

            // 計算進度（加入防呆避免除以零）
            let phraseProgressValue = 0;
            if (duration > 0) {
                const rawProgress =
                    (currentTime.value - lineTime - delay) / duration;
                phraseProgressValue = Math.min(1, Math.max(0, rawProgress)); // 限制在 0~1 範圍
            }

            // 若時間未到延遲時間，進度設為 0
            if (currentTime.value - lineTime < delay) {
                phraseProgressValue = 0;
            }

            return {
                transform: `matrix(1, 0, 0, 1, 0, ${-2 * phraseProgressValue})`,
                "--progress": `${phraseProgressValue * 100}%`,
            };
        };

        const getPhraseStyle = (lineIndex, phraseIndex) => {
            if (lineIndex !== currentLineIndex.value) return {};
            // 檢查 jsonMappingContent.value 是否存在，並安全存取 line
            const line = jsonMappingContent.value?.[lineIndex];

            // 若 line 不存在，直接返回空樣式
            if (!line) return {};

            // 使用 Optional Chaining 檢查 line.type
            if (line.type === "end") {
                return { "--progress": "100%", "font-size": "20px" };
            }

            // 安全存取 line.time，若不存在則給默認值 0
            const lineTime = line.time || 0;

            // 安全存取陣列元素，避免 phraseIndex 超出範圍
            // 這裡的單位已經是秒了，直接使用不用再除以 100
            const delay = line.delay?.[phraseIndex] || 0;
            const duration = line.duration?.[phraseIndex] || 0;

            // 計算進度（加入防呆避免除以零）
            let phraseProgressValue = 0;
            if (duration > 0) {
                const rawProgress =
                    (currentTime.value - lineTime - delay) / duration;
                phraseProgressValue = Math.min(1, Math.max(0, rawProgress)); // 限制在 0~1 範圍
            }

            // 若時間未到延遲時間，進度設為 0
            if (currentTime.value - lineTime < delay) {
                phraseProgressValue = 0;
            }

            return {
                transform: `matrix(1, 0, 0, 1, 0, ${-2 * phraseProgressValue})`,
                "--progress": `${phraseProgressValue * 100}%`,
            };
        };

        // 初始化流程
        onMounted(async () => {
            try {
                // 載入歌曲列表
                songList.value = await loadSongList();
                songList.value = songList.value.filter(
                    (song) => song.available === true
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
                    currentSong.value = matchedSong;
                } else {
                    currentSong.value = songList.value[0];
                    console.warn(`歌曲未找到: ${songRequest}, 使用第一首歌曲`);
                }

                // 初始化播放器
                const { init } = initYouTubePlayer({
                    currentSong,
                    currentTime,
                    songDuration,
                });
                window.ytPlayer = await init();

                // 載入歌詞
                const lyricResponse = await fetch(
                    getLyricFilePath(currentSong.value.name)
                );
                jsonMappingContent.value = parseLyrics(
                    await lyricResponse.json(),
                    currentSong,
                    songDuration
                );

                // 初始化模態框
                initSettingModal();
                initCreditModal();
            } catch (error) {
                console.error("初始化錯誤:", error);
            }
        });

        // 監聽歌曲切換
        watch(currentSong, async (newSong) => {
            if (!newSong) return;

            // 調試：輸出實際加載的歌曲列表
            console.log(
                "Available songs:",
                songList.value.map((s) => s.name)
            );

            // 調試：輸出歌詞文件路徑

            // 載入新歌詞
            const lyricResponse = await fetch(getLyricFilePath(newSong.name));
            console.log("Loading lyrics from:", newSong.name);

            jsonMappingContent.value = parseLyrics(
                await lyricResponse.json(),
                currentSong,
                songDuration
            );
            console.log(jsonMappingContent.value);

            jumpToCurrentLine(0);

            songVersion.value = "default";

            window.ytPlayer.loadVideoById(newSong.id);
            window.ytPlayer.pauseVideo();
            // 清空所有資料和翻譯文字 要跟歌詞一起才能清空
            currentTime.value = 0;
            songDuration.value = 0;
        });

        watch(currentLineIndex, (newVal) => {
            if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
        });

        watch(songVersion, (newVal) => {
            if (!currentSong.value.alternative_versions) return;

            // 切換YouTube視頻
            if (newVal == THE_FIRST_TAKE)
                window.ytPlayer.loadVideoById(
                    currentSong.value.alternative_versions.filter(
                        (x) => x.type === THE_FIRST_TAKE
                    )[0].id
                );
            else if (newVal == INSTRUMENTAL)
                window.ytPlayer.loadVideoById(
                    currentSong.value.alternative_versions.filter(
                        (x) => x.type === INSTRUMENTAL
                    )[0].id
                );
            else window.ytPlayer.loadVideoById(currentSong.value.id);

            window.ytPlayer.pauseVideo();
        });

        return {
            ALBUM_GOOGLE_LINK_BASE,
            THE_FIRST_TAKE,
            INSTRUMENTAL,
            jsonMappingContent,
            currentTime,
            songDuration,
            songList,
            songVersion,
            togglePronounciation,
            currentSong,
            scrollToCurrentLine,
            toggleTranslation,
            formattedCurrentTime,
            formattedSongDuration,
            currentLineIndex,
            translationText,
            backgroundTranslationText,
            translationAuthor,
            initSettingModal,
            initCreditModal,
            initYouTubePlayer,
            jumpToCurrentLine,
            getPhraseStyle,
            getBackgroundPhraseStyle,
            isCurrentLine: (index) => index === currentLineIndex.value,
            isKiai: (line, phraseIndex) => line.text[phraseIndex].kiai,
            isBackgroundKiai: (line, phraseIndex) =>
                line.background_voice.text[phraseIndex].kiai,
            isActivePhrase: (line, phraseIndex) => {
                return (
                    currentTime.value - line.time > line.delay?.[phraseIndex] &&
                    currentTime.value - line.time - line.delay?.[phraseIndex] <
                        line.duration?.[phraseIndex]
                );
            },
            isBackgroundActivePhrase: (line, phraseIndex) => {
                return (
                    currentTime.value - line.background_voice?.time >
                        line.background_voice?.delay[phraseIndex] &&
                    currentTime.value -
                        line.background_voice?.time -
                        line.background_voice?.delay[phraseIndex] <
                        line.background_voice?.duration[phraseIndex]
                );
            },
            queryAlternativeVersion: (version) => {
                return currentSong.value.alternative_versions?.filter(
                    (x) => x.type === version
                )[0];
            },
        };
    },
});

app.mount("#app");
