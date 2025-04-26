import { DEFAULT_DURATION, DEFAULT_ELAPSE_SPEED } from "./config.js";

export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index) => {
    const currentLineId = document.getElementById(index);
    currentLineId?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
};

export const parseLyrics = (jsonMappingContent, currentSong) => {
    if (!jsonMappingContent) return [];

    return jsonMappingContent
        .map((line, index) => {
            const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const [_, mm, ss] = timeMatch;
                line.time = parseFloat(mm) * 60 + parseFloat(ss);
            }

            if (line.type === "interlude") {
                line.text = "● ● ●";
            }

            if (line.type === "end") {
                line.text = `作者：${
                    currentSong.value.lyricist?.trim() ||
                    currentSong.value.artist?.trim() ||
                    "未知的作者"
                }`;
            }

            line.text = line.text.split("|"); // can't add .toString() since it will not work properly. (["a,b,c"] rather than ["a","b","c"])

            if (!line.duration) {
                line.duration = line.text.slice();
                line.duration.fill(
                    currentSong.value.default_phrase_duration ||
                        DEFAULT_DURATION,
                    0,
                    line.text.length
                );
            }

            line.delay = new Array(line.duration.length).fill(0);
            let accumulated = 0;
            for (let i = 0; i < line.delay.length; i++) {
              line.delay[i] = accumulated;
              if (i < line.duration.length - 1) {
                accumulated += line.duration[i];
              }
            }

            return {
                ...line,
            };
        })
        .filter((line) => line && line.text);
};
