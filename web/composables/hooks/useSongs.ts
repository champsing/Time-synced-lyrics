import type {
    LyricLine,
    LyricPhrase,
    parsedBackgroundVoiceLine,
    parsedLyricLine,
    RawLyricData,
    Song,
} from "@/types/types";
import { API_BASE_URL, DEFAULT_DURATION } from "../utils/config";
import { getArtistDisplay } from "./useArtist";

export const loadSongList = async () => {
    try {
        console.log("獲取歌曲列表中...");
        const response = await fetch(`${API_BASE_URL}/songs/list`);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌曲列表載入失敗：" + err.message);
    } finally {
        console.log("歌曲列表獲取成功。");
    }
};

export const loadSongData = async (songId: number) => {
    try {
        console.log("獲取歌曲中..." + `(${songId})`);
        const response = await fetch(`${API_BASE_URL}/songs/${songId}`);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌曲載入失敗：" + err.message);
    } finally {
        console.log("歌曲獲取成功。");
    }
};

export const getLyricResponse = async (
    songId: number,
    folder: string,
    songVersion: string,
) => {
    try {
        const address = `https://lyric.timesl.online/${songId}_${folder}/${songVersion}.json`;
        console.log(`獲取歌詞檔案中...(URL: ${address})`);

        const response = await fetch(address);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌詞載入失敗：" + err.message);
    } finally {
        console.log("歌詞檔案獲取成功。");
    }
};

export const getDefaultVersion = (currentSong: Song) =>
    currentSong.versions.find((v) => v.default === true)?.version || "original";

export const parseLyrics = async (
    jsonMappingContent: RawLyricData,
    currentSong: Song,
    songDuration: number,
) => {
    if (!jsonMappingContent) return [];

    const display_artist = await getArtistDisplay(currentSong.artist);

    const display_lyricist = await getArtistDisplay(currentSong.lyricist);

    const parsedLyrics = jsonMappingContent
        .map((line: LyricLine) => {
            const parsedLine: parsedLyricLine = {
                // @ts-ignore
                time: 0,
                duration: [],
                delay: [],
                ...line,
            };
            const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                // eslint-disable-next-line no-unused-vars
                const [_, mm, ss] = timeMatch;
                if (mm && ss)
                    parsedLine.time = parseFloat(mm) * 60 + parseFloat(ss);
            }

            if (line.background_voice) {
                const bgLine = line.background_voice;
                const parsedBgLine: parsedBackgroundVoiceLine = {
                    // @ts-ignore
                    time: 0,
                    duration: [],
                    delay: [],
                    ...line.background_voice,
                };

                const bgTimeMatch = bgLine.time.match(/(\d+):(\d+\.\d+)/);
                if (bgTimeMatch) {
                    // eslint-disable-next-line no-unused-vars
                    const [_, mm, ss] = bgTimeMatch;
                    if (mm && ss)
                        parsedBgLine.time =
                            parseFloat(mm) * 60 + parseFloat(ss);
                }

                parsedBgLine.duration = new Array(
                    parsedBgLine.text.length,
                ).fill(0) as number[];

                parsedBgLine.duration = parsedBgLine.text.map(
                    (phr) => phr.duration / 100 || DEFAULT_DURATION,
                );

                parsedBgLine.delay = new Array(
                    parsedBgLine.duration.length,
                ).fill(0);
                let accumulated = 0;
                for (let i = 0; i < parsedBgLine.delay.length; i++) {
                    parsedBgLine.delay[i] = accumulated;
                    if (i < parsedBgLine.duration.length - 1) {
                        accumulated += parsedBgLine.duration[i] as number;
                    }
                }
            }

            if (
                parsedLine.type === "interlude" ||
                parsedLine.type === "prelude"
            ) {
                parsedLine.text = [{ phrase: "● ● ●", duration: 0 }];
            }

            if (parsedLine.type === "end") {
                parsedLine.text = [
                    {
                        phrase: `創作者：${
                            display_lyricist || display_artist || "未知的創作者"
                        }`,
                        duration: songDuration - parsedLine.time,
                    },
                ];
            }

            parsedLine.duration = new Array(parsedLine.text?.length).fill(0);
            parsedLine.duration = parsedLine.text?.map(
                (phr: LyricPhrase) =>
                    phr.duration / 100 || // json 中的 duration 值單位是厘秒，秒的 1/100 倍
                    DEFAULT_DURATION,
                0,
            ) as number[];

            parsedLine.delay = new Array(parsedLine.duration.length).fill(0);
            let accumulated = 0;
            for (let i = 0; i < parsedLine.delay.length; i++) {
                parsedLine.delay[i] = accumulated;
                if (i < parsedLine.duration.length - 1) {
                    accumulated += parsedLine.duration[i] || 0;
                }
            }

            return {
                ...parsedLine,
            };
        })
        .filter((line: parsedLyricLine) => line && line.text);

    return parsedLyrics.map((line: parsedLyricLine, index: number) => {
        if (line.type === "interlude" || line.type === "prelude") {
            const interludeDuration = parsedLyrics[index + 1]!.time - line.time;
            line.duration = [interludeDuration];
            line.delay = [0];
        }
        return {
            ...line,
        };
    });
};

export const generatePhraseStyle = (
    currentTime: number,
    line: parsedLyricLine,
    phraseIndex: number,
) => {
    if (!line) return {};

    // 使用 Optional Chaining 檢查 line.type
    if (line.type === "end") {
        return {
            "background-image": `linear-gradient(to right, rgba(255, 255, 255, 0.85) 100%)`,
            "font-size": "20px",
        };
    }

    // 安全存取 line.time，若不存在則給默認值 0
    const lineTime = line.time || 0;

    const delay = line.delay?.[phraseIndex] || 0;
    const duration = line.duration?.[phraseIndex] || 0;
    const rawProgress = (currentTime - lineTime - delay) / duration;

    let phraseProgressValue: number = 0;

    if (duration > 0)
        phraseProgressValue = Math.min(1, Math.max(0, rawProgress)); // 限制在 0~1 範圍

    // 若時間未到延遲時間，進度設為 0
    if (currentTime - lineTime < delay) {
        phraseProgressValue = 0;
    }

    const sinProgress = Math.sin((phraseProgressValue * Math.PI) / 2);
    const a = 0.35 + 0.5 * sinProgress; // 從0.35緩入到0.85

    // 設定過渡區間的寬度（百分比）
    const transitionWidth = 8;

    // 計算漸變的起始和結束位置
    const colorStop = phraseProgressValue * 100;
    let transitionStart = Math.max(0, colorStop - transitionWidth);
    let transitionEnd = Math.min(
        100 + transitionWidth,
        colorStop + transitionWidth,
    );

    if (phraseProgressValue === 0) {
        transitionStart = 0;
        transitionEnd = 0;
    }

    const linearGradient = `linear-gradient(to right,
        rgba(255, 255, 255, ${a}) 0%,
        rgba(255, 255, 255, ${a}) ${transitionStart}%,
        rgba(132, 132, 132, 0.35) ${transitionEnd}%,
        rgba(132, 132, 132, 0.35) 100%
    )`;

    if (line.text && line.text[phraseIndex]?.kiai) {
        const waveScale = 0.1; // 縮放幅度 (1.1 = 1 + 0.1)
        const waveFrequency = 1; // 波浪次數 (1 = 單一完整波浪)

        // 使用正弦函數計算波浪縮放 (範圍 0~1 → 1.0~1.1~1.0)
        const scaleWave = Math.sin(
            phraseProgressValue * Math.PI * waveFrequency,
        );
        const scaleValue = 1 + waveScale * scaleWave;

        return {
            transform: `matrix(${scaleValue}, 0, 0, ${scaleValue}, 0, ${
                -2 * phraseProgressValue
            })`,
            "--progress": `${phraseProgressValue * 100}%`,
            "background-image": `${linearGradient}`,
        };
    } else
        return {
            transform: `matrix(1, 0, 0, 1, 0, ${-2 * phraseProgressValue})`,
            "--progress": `${phraseProgressValue * 100}%`,
            "background-image": `${linearGradient}`,
        };
};

export const isActivePhrase = (
    currentTime: number,
    line: parsedLyricLine | parsedBackgroundVoiceLine,
    phraseIndex: number,
) => {
    if (!line || !line.duration[phraseIndex] || !line.delay[phraseIndex])
        return false;
    else
        return (
            currentTime - line.time > line.delay[phraseIndex] &&
            currentTime - line.time - line.delay[phraseIndex] <
                line.duration[phraseIndex]
        );
};
