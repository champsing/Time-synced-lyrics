const { createApp, ref, computed, onMounted, watch } = Vue;

const VERSION = "1.2.0a-20250425"; // 版本號

document.getElementById("version").innerText = `播放器版本：${VERSION}`;

let App = createApp({
    setup() {
        const jsonMappingContent = ref(null); // 歌詞內容
        const error = ref(null);
        const currentTime = ref(0); // 現在播放時間
        const songDuration = ref(0); // 歌曲總長度
        const defaultElapseSpeed = ref(1.5); // 預設流逝速度
        // 歌曲列表
        const songList = ref([
            {
                name: "",
            },
        ]);
        const currentSong = ref(songList.value[0]); // 當前歌曲
        const lyricFile = ref(""); // 歌詞檔案路徑
        const charProgress = ref(0); // 當前字元進度
        const translationText = ref(
            computed(() => getCurrentLineTranslation(currentLineIndex.value))
        ); // 翻譯文字
        const toggleTranslation = ref(true); // 是否顯示翻譯文字
        const scrollToCurrentLine = ref(true); // 是否滾動到當前行

        // 加载歌曲列表
        const loadSongList = async () => {
            try {
                const response = await fetch("./public/song_list.json");
                if (!response.ok) throw new Error("載入失敗");
                songList.value = await response.json();
                if (songList.value.length > 0) {
                    currentSong.value = songList.value[0];
                    lyricFile.value = `./public/mappings/${currentSong.value.name}.json`;
                }
            } catch (err) {
                error.value = "歌曲列表載入失敗：" + err.message;
            }
        };

        // 自动加载同目录下的 json mapping 文件
        const autoLoadJsonMapping = async () => {
            try {
                const response = await fetch(lyricFile.value);
                if (!response.ok) throw new Error("File not found");
                jsonMappingContent.value = await response.json();
                console.log(jsonMappingContent.value);
                parsedLyrics(jsonMappingContent.value);
            } catch (err) {
                error.value = `Failed to load lyrics: ${err.message}`;
            }
        };

        // 解析歌词
        function parsedLyrics(jsonMappingContent) {
            // 清空所有資料和翻譯文字 要跟歌詞一起才能清空
            defaultElapseSpeed.value = currentSong.value.default_elapse_speed;
            currentTime.value = 0;
            songDuration.value = 0;
            translationText.value = "";

            if (!jsonMappingContent) return [];

            return jsonMappingContent
                .map((line) => {
                    const time = line.time.match(/(\d+):(\d+\.\d+)/);
                    const [_, mm, ss] = time || [];
                    line.time = parseFloat(mm) * 60 + parseFloat(ss);

                    if (!line.pace) line.pace = [defaultElapseSpeed.value];

                    if (line.type === "interlude") line.text = "● ● ●";

                    if (line.type === "end") {
                        line.text = "作者：" + songLyricistName.value.trim();
                        line.pace = [1000];
                    }

                    line.text = line.text.split("|"); // can't add .toString() since it will not work properly. (["a,b,c"] rather than ["a","b","c"])
                })
                .filter((line) => line && line.text);
        }

        // 新增 currentLineIndex 計算屬性
        const currentLineIndex = computed(() => {
            const lyrics = jsonMappingContent.value;
            if (!lyrics || !lyrics.length) return -1;

            for (let i = lyrics.length - 1; i >= 0; i--) {
                if (currentTime.value >= lyrics[i].time) {
                    return i;
                }
            }
            return -1;
        });

        watch(currentLineIndex, (newVal) => {
            if (scrollToCurrentLine.value) scrollToLineIndex(newVal);
        });

        function getCurrentLineTranslation(lineIndex) {
            if (lineIndex < 0) return null;
            if (jsonMappingContent.value[lineIndex].translation != null) {
                return jsonMappingContent.value[lineIndex].translation;
            } else return "";
        }

        function scrollToLineIndex(index) {
            const currentLineId = document.getElementById(index);
            currentLineId.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }

        const formattedCurrentTime = ref(formatTime(currentTime.value));
        const formattedSongDuration = ref(formatTime(songDuration.value));

        function formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec.toString().padStart(2, "0")}`;
        }

        function getCharStyle(lineIndex, phraseIndex, charIndex) {
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
        }

        const player = ref(null);

        // 初始化 YouTube 播放器
        const initPlayer = () => {
            const onYouTubeIframeAPIReady = () => {
                player.value = new YT.Player("player", {
                    width: "300",
                    height: "200",
                    videoId: currentSong.value.id,
                    playerVars: {
                        enablejsapi: 1,
                        playsinline: 1,
                    },
                    events: {
                        onReady: onPlayerReady,
                        onStateChange: onPlayerStateChange,
                    },
                });
            };

            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag =
                    document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
            } else {
                onYouTubeIframeAPIReady();
            }
        };

        const onPlayerReady = (event) => {
            console.log("播放器已準備好");
        };

        const onPlayerStateChange = (event) => {
            if (
                event.data === YT.PlayerState.BUFFERING &&
                songDuration.value === 0
            ) {
                // 這是第一次載入歌曲，獲取歌曲長度
                songDuration.value = player.value.getDuration();
                formattedSongDuration.value = formatTime(songDuration.value);
            }
            if (event.data === YT.PlayerState.PLAYING) {
                const updateTime = () => {
                    if (player.value && player.value.getCurrentTime()) {
                        currentTime.value = player.value.getCurrentTime();
                        formattedCurrentTime.value = formatTime(
                            currentTime.value
                        );
                        requestAnimationFrame(updateTime);
                    }
                };
                requestAnimationFrame(updateTime);
            }
        };

        onMounted(async () => {
            await loadSongList();
            autoLoadJsonMapping();
            initPlayer(); // 初始化播放器
        });

        function jumpToCurrentLine(index) {
            const line = jsonMappingContent.value[index];
            if (line) {
                scrollToLineIndex(index);
                player.value.seekTo(line.time);
            }
        }

        // 在歌曲切換時更新播放器
        watch(currentSong, (newVal) => {
            player.value.pauseVideo();
            lyricFile.value = `./public/mappings/${newVal.name}.json`;
            autoLoadJsonMapping();
            player.value.loadVideoById(newVal.id);
            player.value.pauseVideo();
        });

        // 确保返回对象包含所有需要导出的内容
        return {
            songList,
            player,
            currentSong,
            jsonMappingContent,
            error,
            currentLineIndex,
            formattedCurrentTime,
            formattedSongDuration,
            currentTime,
            songDuration,
            translationText,
            scrollToCurrentLine,
            toggleTranslation,
            parsedLyrics,
            autoLoadJsonMapping,
            jumpToCurrentLine,
            scrollToLineIndex,
            getCharStyle,
            isCurrentLine: (index) => index === currentLineIndex.value,
            isKiai: (line) => line.kiai === true,
            isCompletedChar: () => charProgress.value === 1,
        };
    },
}).mount("#app");

function showModal(modal) {
    modal.style.display = "block";
}

function hideModal(modal) {
    modal.style.display = "none";
}

// Get the modal
let settingModal = document.getElementById("setting-modal-container");

// Get the button that opens the modal
let settingBtn = document.getElementById("setting-btn");

// Get the <span> element that closes the modal
let settingCloseBtn = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
settingBtn.onclick = function () {
    showModal(settingModal);
};

// When the user clicks on <span> (x), close the modal
settingCloseBtn.onclick = function () {
    hideModal(settingModal);
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == settingModal) {
        hideModal(settingModal);
    }
};
