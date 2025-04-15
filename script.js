const { createApp, ref, computed, onMounted, watch } = Vue;

let App = createApp({
  setup() {
    // 歌词数据
    const lrcContent = ref("");
    const error = ref(null);
    const currentTime = ref(0);
    const isPlaying = ref(false);
    const audio = ref(null);
    const lyricsContainer = ref(null);
    // 初始化歌曲文件名（空值）
    const songFileName = ref("");
    const lyricFile = ref("./lrc/" + songFileName + ".lrc");
    const songArtistName = ref("");
    const defaultElapseSpeed = ref(1.5); // 默认流逝速度
    const songShownName = ref("");
    // 新增歌曲列表相关
    const songList = ref([]);

    // 监听歌曲变化
    watch(songFileName, (newVal) => {
      if (audio.value && newVal) {
        lyricFile.value = `./lrc/${newVal}.lrc`;
        autoLoadLrc();
      }
    });

    onMounted(async () => {
      await loadSongList();
      autoLoadLrc();
    });

    // 加载歌曲列表
    const loadSongList = async () => {
      try {
        const response = await fetch("./song_list.json");
        if (!response.ok) throw new Error("載入失敗");
        songList.value = await response.json();
        if (songList.value.length > 0) {
          songFileName.value = songList.value[0];
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
      if (!lrcContent.value) return [];

      return lrcContent.value
        .split("\n")
        .map((line) => {
          const noElapseSpeed = line.match(/\[(\d+):(\d+\.\d+)\](.*)/); //Example: [00:01.00]XXX
          const withElapseSpeed = line.match(
            /\[(\d+):(\d+\.\d+), (\d+\.+\d+)\](.*)/
          ); //Example: [00:01.00, 0.5]XXX
          const SongInterludeWithSpeed = line.match(
            /\[(\d+):(\d+\.\d+), (\d+\.+\d+), INTERLUDE\]/
          ); //Example: [00:01.00, 2.0, INTERLUDE]
          const SongInterludeWithoutSpeed = line.match(
            /\[(\d+):(\d+\.\d+), INTERLUDE\]/
          ); //Example: [00:01.00, INTERLUDE]
          const isSongEnd = line.match(/\[(\d+):(\d+\.\d+), END\]/); //Example: [00:01.00, END]
          const songArtist = line.match(/\[ar\](.*)/); //Example: [ar]XXX
          const defaultElapseSpeedRegex = line.match(/\[dfelpspd\](\d+\.\d+)/); //Example: [dfelpspd]1.25
          const songShownNameRegex = line.match(/\[ti\](.*)/); //Example: [ti]XXX

          if (songArtist) {
            //歌手資訊
            const [_, artist] = songArtist;
            songArtistName.value = artist.trim();
            return null;
          } else if (defaultElapseSpeedRegex) {
            //默認流逝速度值
            const [_, dfelpspd] = defaultElapseSpeedRegex;
            defaultElapseSpeed.value = parseFloat(dfelpspd);
            return null;
          } else if (songShownNameRegex) {
            //默認流逝速度值
            const [_, title] = songShownNameRegex;
            songShownName.value = title.trim();
            return null;
          }

          if (noElapseSpeed) {
            //一般無流逝速度
            const [_, mm, ss, text] = noElapseSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: text.trim(),
              elapseSpeed: defaultElapseSpeed.value, // 默认流逝速度 1.5
            };
          } else if (withElapseSpeed) {
            //有流逝速度
            const [_, mm, ss, speed, text] = withElapseSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: text.trim(),
              elapseSpeed: parseFloat(speed),
            };
          } else if (SongInterludeWithSpeed) {
            //這行是有定義流逝速度的間奏
            const [_, mm, ss, speed] = SongInterludeWithSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: "● ● ●".trim(),
              elapseSpeed: parseFloat(speed),
            };
          } else if (SongInterludeWithoutSpeed) {
            //這行是沒有定義流逝速度的間奏
            const [_, mm, ss] = SongInterludeWithoutSpeed;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: "● ● ●".trim(),
              elapseSpeed: defaultElapseSpeed.value,
            };
          } else if (isSongEnd) {
            //歌曲結束
            const [_, mm, ss] = isSongEnd;
            return {
              time: parseFloat(mm) * 60 + parseFloat(ss),
              text: "作者：" + songArtistName.value.trim(),
              elapseSpeed: 1000,
              isEnd: true,
            };
          } else return null;
        })
        .filter((line) => line && line.text);
    });

    // 新增 currentLineIndex 计算属性
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

    function scrollToLineIndex(index) {
      const currentLineId = document.getElementById(index);
      currentLineId.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    function jumpToCurrentLine(index) {
      const line = parsedLyrics.value[index];
      if (line) {
        scrollToLineIndex(index);
        if (!isPlaying.value) audio.value.play();
        audio.value.currentTime = line.time;
      }
    }


    // 确保返回对象包含所有需要导出的内容
    return {
      songList,
      songFileName,
      songShownName,
      songArtistName,
      parsedLyrics,
      error,
      currentLineIndex, // 必须导出
      currentTime,
      isPlaying,
      audio,
      lyricsContainer,
      autoLoadLrc,
      jumpToCurrentLine,
      scrollToLineIndex,
      getCharStyle: (lineIndex, charIndex) => {
        if (lineIndex !== currentLineIndex.value) return {};

        const line = parsedLyrics.value[lineIndex];
        const nextLine = parsedLyrics.value[lineIndex + 1];
        const lineDuration =
          (nextLine?.time || audio.value.duration) - line.time;
        const elapsed = (currentTime.value - line.time) * line.elapseSpeed;
        const progress = Math.min(1, elapsed / lineDuration);

        const charProgress = Math.max(
          0,
          Math.min(1, progress * line.text.length - charIndex)
        );

        scrollToLineIndex(currentLineIndex.value);
        if (line.isEnd == true)
          return { "--progress": 100 + "%", "font-size": 20 + "px" };
        else return { "--progress": charProgress * 100 + "%" };
      },
      isCurrentLine: (index) => index === currentLineIndex.value,
      togglePlay: () => {
        isPlaying.value ? audio.value.pause() : audio.value.play();
        isPlaying.value = !isPlaying.value;
      },
      updateTime: () => {
        currentTime.value = audio.value.currentTime;
      },
    };
  },
}).mount("#app");
