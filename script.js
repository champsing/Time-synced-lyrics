const { createApp, ref, computed, onMounted, watch } = Vue;

const VERSION = "1.1.0b-20250423"; // 版本號

document.getElementById("version").innerText = `播放器版本：${VERSION}`;

let App = createApp({
  setup() {
    const lrcContent = ref(""); // 歌詞內容
    const error = ref(null);
    const currentTime = ref(0); // 現在播放時間
    const songDuration = ref(0); // 歌曲總長度
    const songArtistName = ref(""); // 歌手名稱
    const songLyricistName = ref(""); // 作詞者名稱
    const defaultElapseSpeed = ref(1.5); // 預設流逝速度
    const songShownName = ref(""); // 歌曲顯示名稱
    // 歌曲列表
    const songList = ref([
      {
        name: "",
      },
    ]);
    const currentSong = ref(songList.value[0]); // 當前歌曲
    const lyricFile = ref("./public/lrc/" + currentSong.name + ".lrc"); // 歌詞檔案路徑
    const charProgress = ref(0); // 當前字元進度
    const translation = ref([]); // 翻譯文字列表
    const translationText = ref(
      computed(() => getCurrentLineTranslation(currentLineIndex.value))
    ); // 翻譯文字
    const translationAuthor = ref(""); // 翻譯作者
    const translationCite = ref(null); // 翻譯出處

    // 加载歌曲列表
    const loadSongList = async () => {
      try {
        const response = await fetch("./public/song_list.json");
        if (!response.ok) throw new Error("載入失敗");
        songList.value = await response.json();
        if (songList.value.length > 0) {
          currentSong.value = songList.value[0];
          lyricFile.value = `./public/lrc/${currentSong.value.name}.lrc`;
        }
      } catch (err) {
        error.value = "歌曲列表載入失敗：" + err.message;
      }
    };

    // 自动加载同目录下的 lyrics.lrc
    const autoLoadLrc = async () => {
      try {
        const response = await fetch(lyricFile.value);
        if (!response.ok) throw new Error("File not found");
        lrcContent.value = await response.text();
        console.log(lrcContent.value);
      } catch (err) {
        error.value = `Failed to load lyrics: ${err.message}`;
      }
    };

    // 解析歌词
    const parsedLyrics = computed(() => {
      // 清空所有資料和翻譯文字 要跟歌詞一起才能清空
      songArtistName.value = "";
      songLyricistName.value = "";
      songShownName.value = "";
      defaultElapseSpeed.value = 1.5;
      currentTime.value = 0;
      songDuration.value = 0;
      translationAuthor.value = "";
      translation.value = [];
      translationText.value = "";
      translationCite.value = null;

      if (!lrcContent.value) return [];

      return lrcContent.value
        .split("\n")
        .map((line) => {
          const noElapseSpeed = line.match(/\[(\d+):(\d+\.\d+)\](.*)/); //Example: [00:01.00]XXX
          const withElapseSpeed = line.match(
            /\[(\d+):(\d+\.\d+), {(.*)}\](.*)/
          ); //Example: [00:01.00, 0.5]XXX
          const noElapseSpeedKiai = line.match(
            /\[(\d+):(\d+\.\d+), KIAI\](.*)/
          ); //Example: [00:01.00]XXX
          const withElapseSpeedKiai = line.match(
            /\[(\d+):(\d+\.\d+), {(.*)}, KIAI\](.*)/
          ); //Example: [00:01.00, 0.5]XXX
          const SongInterludeWithSpeed = line.match(
            /\[(\d+):(\d+\.\d+), (\d+\.+\d+), INTERLUDE\]/
          ); //Example: [00:01.00, 2.0, INTERLUDE]
          const SongInterludeWithoutSpeed = line.match(
            /\[(\d+):(\d+\.\d+), INTERLUDE\]/
          ); //Example: [00:01.00, INTERLUDE]
          const songEnd = line.match(/\[(\d+):(\d+\.\d+), END\]/); //Example: [00:01.00, END]
          const songArtist = line.match(/\[ar\:(.*)\]/); //Example: [ar]XXX
          const defaultElapseSpeedRegex = line.match(/\[dfelpspd:(\d+\.\d+)\]/); //Example: [dfelpspd]1.25
          const songShownNameRegex = line.match(/\[ti\:(.*)\]/); //Example: [ti]XXX
          const songTranslate = line.match(/\[(\d+), TRANSLATE\](.*)/); //Example: [1, TRANSLATE]
          const songTranslateAuthor = line.match(/\[translate_author\:(.*)\]/); //Example: [translate_author:XXX]
          const songTranslateCite = line.match(/\[translate_cite\:(.*)\]/); //Example: [translate_cite:XXX]
          const songLyricist = line.match(/\[lyricist\:(.*)\]/); //Example: [lyricist:XXX]
          const songLyricistIsArtist = line.match(/\[lyricist=ar\]/); //Example: [lyricist=ar]

          if (songArtist) {
            //歌手資訊
            const [_, artist] = songArtist;
            songArtistName.value = artist.trim();
            return null;
          } else if (songLyricist) {
            //作詞者
            const [_, lyricist] = songLyricist;
            songLyricistName.value = lyricist.trim();
            return null;
          } else if (songLyricistIsArtist) {
            //藝人自己作詞
            songLyricistName.value = songArtistName.value.trim();
            return null;
          }

          if (songShownNameRegex) {
            //歌曲顯示名稱
            const [_, title] = songShownNameRegex;
            songShownName.value = title.trim();
            return null;
          } else if (songTranslate) {
            //翻譯文字
            const [_, lineIndex, text] = songTranslate;
            translation.value.push({
              time: parseInt(lineIndex),
              text: text,
            });
            return null;
          } else if (songTranslateAuthor) {
            //翻譯作者
            const [_, author] = songTranslateAuthor;
            translationAuthor.value = author.trim();
            return null;
          } else if (songTranslateCite) {
            //翻譯出處
            const [_, cite] = songTranslateCite;
            translationCite.value = cite.trim();
            return null;
          }

          if (defaultElapseSpeedRegex) {
            //預設流逝速度值
            const [_, dfelpspd] = defaultElapseSpeedRegex;
            defaultElapseSpeed.value = parseFloat(dfelpspd);
            return null;
          } else if (noElapseSpeed) {
            //無流逝速度歌詞
            const [_, mm, ss, text] = noElapseSpeed;
            const textSplit = text.split("|");

            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: textSplit,
              elapseSpeed: [defaultElapseSpeed.value],
              // 預設流逝速度 1.5
            };
          } else if (withElapseSpeed) {
            //有流逝速度歌詞
            const [_, mm, ss, speed, text] = withElapseSpeed;
            const textSplit = text.split("|");
            const speedSplit = speed
              .replaceAll("df", defaultElapseSpeed.value)
              .split(",")
              .map((s) => parseFloat(s.trim()));

            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: textSplit,
              elapseSpeed: speedSplit,
            };
          }
          if (noElapseSpeedKiai) {
            //一般無流逝速度的歌曲高潮
            const [_, mm, ss, text] = noElapseSpeedKiai;
            const textSplit = text.split("|");

            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: textSplit,
              elapseSpeed: [defaultElapseSpeed.value],
              type: "kiai",
              // 預設流逝速度 1.5
            };
          } else if (withElapseSpeedKiai) {
            //有流逝速度的歌曲高潮
            const [_, mm, ss, speed, text] = withElapseSpeedKiai;
            const textSplit = text.split("|");
            const speedSplit = speed
              .replaceAll("df", defaultElapseSpeed.value)
              .split(",")
              .map((s) => parseFloat(s.trim()));

            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: textSplit,
              elapseSpeed: speedSplit,
              type: "kiai",
            };
          } else if (SongInterludeWithSpeed) {
            //這行是有定義流逝速度的間奏
            const [_, mm, ss, speed] = SongInterludeWithSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: ["● ● ●"],
              elapseSpeed: [parseFloat(speed)],
              type: "interlude",
            };
          } else if (SongInterludeWithoutSpeed) {
            //這行是沒有定義流逝速度的間奏
            const [_, mm, ss] = SongInterludeWithoutSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: ["● ● ●"],
              elapseSpeed: [defaultElapseSpeed.value],
              type: "interlude",
            };
          } else if (songEnd) {
            //歌曲結束
            const [_, mm, ss] = songEnd;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: ["作者：", songLyricistName.value.trim()],
              elapseSpeed: [1000],
              type: "end",
            };
          } else return null;
        })
        .filter((line) => line && line.text);
    });

    // 新增 currentLineIndex 計算屬性
    const currentLineIndex = computed(() => {
      const lyrics = parsedLyrics.value;
      if (!lyrics || !lyrics.length) return -1;

      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime.value >= lyrics[i].time) {
          return i;
        }
      }
      return -1;
    });

    watch(currentLineIndex, (newVal) => {
      scrollToLineIndex(newVal);
    });

    function getCurrentLineTranslation(lineIndex) {
      if (lineIndex < 0) return null;
      if (translation.value[lineIndex]?.text) {
        return translation.value[lineIndex].text;
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
      const line = parsedLyrics.value[lineIndex];
      const nextLine = parsedLyrics.value[lineIndex + 1];
      const lineDuration = (nextLine?.time || songDuration) - line.time;
      const averageCharDuration = lineDuration / line.text.join("").length;

      for (let i = 0; i < phraseIndex; i++) {
        charIndex += line.text[i].length;
      }

      charProgress.value = Math.min(
        1,
        ((currentTime.value - line.time) / averageCharDuration) *
          line.elapseSpeed[phraseIndex] -
          charIndex
      );

      if (
        charProgress.value < 0 ||
        charIndex >
          Math.floor(
            ((currentTime.value - line.time) / averageCharDuration) *
              line.elapseSpeed[phraseIndex]
          )
      )
        charProgress.value = 0;

      if (line.type == "end")
        return { "--progress": 100 + "%", "font-size": 20 + "px" };
      else return { "--progress": charProgress.value * 100 + "%" };
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
        const firstScriptTag = document.getElementsByTagName("script")[0];
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
      if (event.data === YT.PlayerState.BUFFERING && songDuration.value === 0) {
        // 這是第一次載入歌曲，獲取歌曲長度
        songDuration.value = player.value.getDuration();
        formattedSongDuration.value = formatTime(songDuration.value);
      }
      if (event.data === YT.PlayerState.PLAYING) {
        const updateTime = () => {
          if (player.value && player.value.getCurrentTime()) {
            currentTime.value = player.value.getCurrentTime();
            formattedCurrentTime.value = formatTime(currentTime.value);
            requestAnimationFrame(updateTime);
          }
        };
        requestAnimationFrame(updateTime);
      }
    };

    onMounted(async () => {
      await loadSongList();
      autoLoadLrc();
      initPlayer(); // 初始化播放器
    });

    function jumpToCurrentLine(index) {
      const line = parsedLyrics.value[index];
      if (line) {
        scrollToLineIndex(index);
        player.value.seekTo(line.time);
      }
    }

    // 在歌曲切換時更新播放器
    watch(currentSong, (newVal) => {
      lyricFile.value = `./public/lrc/${newVal.name}.lrc`;
      autoLoadLrc();
      player.value.loadVideoById(newVal.id);
      player.value.pauseVideo();
    });

    // 确保返回对象包含所有需要导出的内容
    return {
      songList,
      player,
      currentSong,
      songShownName,
      songArtistName,
      songLyricistName,
      parsedLyrics,
      error,
      currentLineIndex,
      formattedCurrentTime,
      formattedSongDuration,
      currentTime,
      songDuration,
      translation,
      translationText,
      translationAuthor,
      translationCite,
      autoLoadLrc,
      jumpToCurrentLine,
      scrollToLineIndex,
      getCharStyle,
      isCurrentLine: (index) => index === currentLineIndex.value,
      isKiai: (line) => line.type === "kiai",
      isCompletedChar: () => charProgress.value === 1,
    };
  },
}).mount("#app");
