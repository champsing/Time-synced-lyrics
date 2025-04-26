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
        const charProgress = ref(0);

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

        const getCharStyle = (lineIndex, phraseIndex, charIndex) => {
            if (lineIndex !== currentLineIndex.value) return {};

            const line = jsonMappingContent.value[lineIndex];

            if (line.type == "end")
                return { "--progress": 100 + "%", "font-size": 20 + "px" };

            const nextLine = jsonMappingContent.value[lineIndex + 1];
            const lineDuration = (nextLine?.time || songDuration) - line.time;
            const averageCharDuration =
                lineDuration / line.text.join("").length;

            for (let i = 0; i < phraseIndex; i++) {
                charIndex += line.text[i].length;
            }

            charProgress.value = Math.min(
                1,
                ((currentTime.value - line.time) / averageCharDuration) *
                    line.pace[phraseIndex] -
                    charIndex
            );

            if (
                charProgress.value < 0 ||
                charIndex >
                    Math.floor(
                        ((currentTime.value - line.time) /
                            averageCharDuration) *
                            line.pace[phraseIndex]
                    )
            ) {
                charProgress.value = 0;
            }

            return { "--progress": charProgress.value * 100 + "%" };
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
            getCharStyle,
            isCurrentLine: (index) => index === currentLineIndex.value,
            isKiai: (line) => line.kiai === true,
            isCompletedChar: () => charProgress.value >= 1,
        };
    },
});

app.mount("#app");
