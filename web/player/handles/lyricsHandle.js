import { getArtistDisplay } from "./artistsHandle.js";
import { DEFAULT_DURATION } from "/web/utils/config.js";

export const parseLyrics = (jsonMappingContent, currentSong, songDuration) => {
    if (!jsonMappingContent) return [];

    currentSong.value.artist_name = getArtistDisplay(currentSong.value.artist);

    currentSong.value.lyricist_name = getArtistDisplay(
        currentSong.value.lyricist,
    );

    const parsedLyrics = jsonMappingContent
        .map((line) => {
            const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                // eslint-disable-next-line no-unused-vars
                const [_, mm, ss] = timeMatch;
                line.time = parseFloat(mm) * 60 + parseFloat(ss);
            }

            if (line.background_voice) {
                const bgTimeMatch =
                    line.background_voice?.time.match(/(\d+):(\d+\.\d+)/);
                if (bgTimeMatch) {
                    // eslint-disable-next-line no-unused-vars
                    const [_, mm, ss] = bgTimeMatch;
                    line.background_voice.time =
                        parseFloat(mm) * 60 + parseFloat(ss);
                }

                line.background_voice.duration = new Array(
                    line.background_voice.text.length,
                ).fill(0);
                line.background_voice.duration = line.background_voice.text.map(
                    (phr) => phr.duration / 100 || DEFAULT_DURATION,
                    0,
                    line.background_voice.text.length,
                );

                line.background_voice.delay = new Array(
                    line.background_voice.duration.length,
                ).fill(0);
                let accumulated = 0;
                for (let i = 0; i < line.background_voice.delay.length; i++) {
                    line.background_voice.delay[i] = accumulated;
                    if (i < line.background_voice.duration.length - 1) {
                        accumulated += line.background_voice.duration[i];
                    }
                }
            }

            if (line.type === "interlude" || line.type === "prelude") {
                line.text = [{ phrase: "● ● ●", duration: 0 }];
            }

            if (line.type === "end") {
                line.text = [
                    {
                        phrase: `創作者：${
                            currentSong.value.lyricist_name ||
                            currentSong.value.artist_name ||
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
                line.text.length,
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
        if (line.type === "interlude" || line.type === "prelude") {
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
