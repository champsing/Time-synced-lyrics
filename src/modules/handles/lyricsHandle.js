const { ref, computed } = Vue;

import { DEFAULT_DURATION } from "../utils/config.js";
import { getLyricFilePath } from "./songsHandle.js";

export const parseLyrics = (jsonMappingContent, currentSong, songDuration) => {
    if (!jsonMappingContent) return [];

    const parsedLyrics = jsonMappingContent
        .map((line) => {
            const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const [_, mm, ss] = timeMatch;
                line.time = parseFloat(mm) * 60 + parseFloat(ss);
            }

            if (line.end_time) {
                const endTimeMatch = line.end_time.match(/(\d+):(\d+\.\d+)/);
                if (endTimeMatch) {
                    const [_, mm, ss] = endTimeMatch;
                    line.end_time = parseFloat(mm) * 60 + parseFloat(ss);
                }
            }

            if (line.background_voice) {
                const bgTimeMatch =
                    line.background_voice?.time.match(/(\d+):(\d+\.\d+)/);
                if (bgTimeMatch) {
                    const [_, mm, ss] = bgTimeMatch;
                    line.background_voice.time =
                        parseFloat(mm) * 60 + parseFloat(ss);
                }

                line.background_voice.duration = new Array(
                    line.background_voice.text.length
                ).fill(0);
                line.background_voice.duration = line.background_voice.text.map(
                    (phr) =>
                        phr.duration / 100 ||
                        currentSong.value.default_phrase_duration ||
                        DEFAULT_DURATION,
                    0,
                    line.background_voice.text.length
                );

                line.background_voice.delay = new Array(
                    line.background_voice.duration.length
                ).fill(0);
                let accumulated = 0;
                for (let i = 0; i < line.background_voice.delay.length; i++) {
                    line.background_voice.delay[i] = accumulated;
                    if (i < line.background_voice.duration.length - 1) {
                        accumulated += line.background_voice.duration[i];
                    }
                }
            }

            if (line.type === "interlude") {
                line.text = [{ phrase: "● ● ●", duration: 0 }];
            }

            if (line.type === "end") {
                line.text = [
                    {
                        phrase: `創作者：${
                            currentSong.value.lyricist?.trim() ||
                            currentSong.value.artist?.trim() ||
                            "未知的創作者"
                        }`,
                        duration: songDuration.value - line.time,
                    },
                ];
            }

            line.duration = new Array(line.text.length).fill(0);
            line.duration = line.text.map(
                (phr) =>
                    phr.duration / 100 || // json 中的 duration 值單位是厘秒，秒的 1/100 倍
                    DEFAULT_DURATION,
                0,
                line.text.length
            );

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

    return parsedLyrics.map((line, index) => {
        if (line.type === "interlude") {
            const interludeDuration =
                jsonMappingContent[index + 1].time - line.time;
            line.duration = [interludeDuration];
            line.delay = [0];
        }
        return {
            ...line,
        };
    });
};

export function useLyrics(currentSong, songVersion, currentTime, songDuration) {
    const jsonMappingContent = ref(null);

    const loadLyrics = async () => {
        const path = getLyricFilePath(
            currentSong.value.name,
            songVersion.value
        );
        const response = await fetch(path);
        jsonMappingContent.value = parseLyrics(
            await response.json(),
            currentSong,
            songDuration
        );

        console.log(songVersion.value, jsonMappingContent.value);
    };

    const currentLineIndex = computed(() => {
        if (!jsonMappingContent.value) return -1;
        for (let i = jsonMappingContent.value.length - 1; i >= 0; i--) {
            if (currentTime.value >= jsonMappingContent.value[i].time) {
                return i;
            }
        }
        return -1;
    });

    return { jsonMappingContent, currentLineIndex, loadLyrics };
}
