const { createApp, ref, computed, onMounted, watch } = Vue;

import { VERSION } from "./modules/config.js";
import { formatTime, scrollToLineIndex, parseLyrics } from "./modules/utils.js";
import { initYouTubePlayer } from "./modules/player.js";
import { loadSongList, getLyricFilePath } from "./modules/songList.js";
import { initModal } from "./modules/modal.js";

// 版本顯示
document.getElementById("version").innerText = `播放器版本：${VERSION}`;

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
        const currentSong = ref(songList.value[0]);
        const scrollToCurrentLine = ref(true);
        const toggleTranslation = ref(true);
        const phraseProgress = ref(0);

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

        const getPhraseStyle = (lineIndex, phraseIndex) => {
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
            const delay = line.delay?.[phraseIndex] || 0;
            const duration = line.duration?.[phraseIndex] || 0;

            // 計算進度（加入防呆避免除以零）
            let phraseProgressValue = 0;
            if (duration > 0) {
                const rawProgress =
                    (currentTime.value - lineTime - delay / 1000) /
                    (duration / 1000);
                //   console.log(rawProgress);
                console.log(
                    line.text[phraseIndex],
                    currentTime.value - lineTime,
                    delay / 1000
                );
                phraseProgressValue = Math.min(1, Math.max(0, rawProgress)); // 限制在 0~1 範圍
            }

            // 若時間未到延遲時間，進度設為 0
            if (currentTime.value - lineTime < delay / 1000) {
                phraseProgressValue = 0;
            }

            return {
                transform: "matrix(1, 0, 0, 1, 0, -2)",
                "--progress": `${phraseProgressValue * 100}%`,
            };
        };

        // 初始化流程
        onMounted(async () => {
            try {
                // 載入歌曲列表
                songList.value = await loadSongList();
                songList.value = songList.value.filter(
                    (song) => song.available == true
                );
                currentSong.value = songList.value[0];

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
                    currentSong
                );

                // 初始化模態框
                initModal();
            } catch (error) {
                console.error("初始化錯誤:", error);
            }
        });

        // 監聽歌曲切換
        watch(currentSong, async (newSong) => {
            if (!newSong) return;

            // 載入新歌詞
            const lyricResponse = await fetch(getLyricFilePath(newSong.name));
            jsonMappingContent.value = parseLyrics(
                await lyricResponse.json(),
                currentSong
            );
            console.log(jsonMappingContent.value);

            // 切換YouTube視頻
            window.ytPlayer.loadVideoById(newSong.id);
            window.ytPlayer.pauseVideo();
            // 清空所有資料和翻譯文字 要跟歌詞一起才能清空
            currentTime.value = 0;
            songDuration.value = 0;
            translationText.value = "";
        });

        watch(currentLineIndex, (newVal) => {
            if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
        });

        return {
            jsonMappingContent,
            currentTime,
            songDuration,
            songList,
            currentSong,
            scrollToCurrentLine,
            toggleTranslation,
            formattedCurrentTime,
            formattedSongDuration,
            currentLineIndex,
            translationText,
            translationAuthor,
            initModal,
            initYouTubePlayer,
            jumpToCurrentLine,
            getPhraseStyle,
            isCurrentLine: (index) => index === currentLineIndex.value,
            isKiai: (line) => line.kiai === true,
            isCompletedPhrase: () => phraseProgress.value >= 1,
        };
    },
});

app.mount("#app");
