import { DEFAULT_ELAPSE_SPEED } from "./config.js";

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
        .map((line) => {
            const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const [_, mm, ss] = timeMatch;
                line.time = parseFloat(mm) * 60 + parseFloat(ss);
            }

            if (!line.pace)
                line.pace = [
                    currentSong.value.default_elapse_speed ||
                        DEFAULT_ELAPSE_SPEED,
                ];

            if (line.type === "interlude") {
                line.text = "● ● ●";
                line.pace = [DEFAULT_ELAPSE_SPEED]
            }
            if (line.type === "end") {
                line.text = `作者：${currentSong.value.lyricist?.trim() || currentSong.value.artist?.trim() || "未知的作者"}`;
                line.pace = [1000];
            }

            line.text = line.text.split("|"); // can't add .toString() since it will not work properly. (["a,b,c"] rather than ["a","b","c"])

            return {
                ...line,
            };
        })
        .filter((line) => line && line.text);
};
