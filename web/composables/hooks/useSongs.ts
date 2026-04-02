import type {
    LyricLine,
    LyricPhrase,
    ProcessedBGLine,
    ProcessedLine,
    RawLyricData,
    Song,
    SongWithDisplay,
} from "@/types/player";
import { API_BASE_URL, DEFAULT_DURATION } from "../utils/config";

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

// 1. 抽取時間轉換邏輯
const parseTimeToSeconds = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+\.\d+)/);
    if (!match) return 0;
    const [, mm, ss] = match;
    if (mm && ss) return parseFloat(mm) * 60 + parseFloat(ss);
    else return 0;
};

// 2. 抽取計算 duration 與 delay 的邏輯
const processTiming = (text: LyricPhrase[], lineTime: number) => {
    const durations = text.map((phr) => phr.duration / 100 || DEFAULT_DURATION);

    let accumulated = 0;
    const delays = durations.map((dur, i) => {
        const currentDelay = accumulated;
        accumulated += dur;
        return currentDelay;
    });

    return { durations, delays };
};

export const parseLyrics = async (
    jsonMappingContent: RawLyricData,
    currentSong: SongWithDisplay,
    songDuration: number,
) => {
    if (!jsonMappingContent) return [];

    const parsedLyrics = jsonMappingContent
        .map((line: LyricLine) => {
            // 初始轉換時間
            const startTime = parseTimeToSeconds(line.time);

            // 處理特殊類型文字
            let lineText = line.text || [];
            if (line.type === "interlude" || line.type === "prelude") {
                lineText = [{ phrase: "● ● ●", duration: 0 }];
            } else if (line.type === "end") {
                lineText = [
                    {
                        phrase: `創作者：${currentSong.displayLyricist || currentSong.displayArtist || "未知的創作者"}`,
                        duration: (songDuration - startTime) * 100, // 轉回厘秒以符合 processTiming 的計算
                    },
                ];
            }

            // 計算主線 Timing
            const { durations, delays } = processTiming(lineText, startTime);

            // 處理背景音 (如有)
            let processedBg = undefined;
            if (line.background_voice) {
                const bgStartTime = parseTimeToSeconds(
                    line.background_voice.time,
                );
                const { durations: bgDurs, delays: bgDels } = processTiming(
                    line.background_voice.text,
                    bgStartTime,
                );
                processedBg = {
                    ...line.background_voice,
                    time: bgStartTime,
                    duration: bgDurs,
                    delay: bgDels,
                    computedEndTime: 0, // 依據需求初始化
                };
            }

            return {
                ...line,
                text: lineText,
                time: startTime,
                duration: durations,
                delay: delays,
                background_voice: processedBg,
                computedEndTime: 0,
            } as ProcessedLine;
        })
        .filter((line) => line && line.text);

    // 第二次遍歷處理間奏長度
    return parsedLyrics.map((line, index, array) => {
        if (
            (line.type === "interlude" || line.type === "prelude") &&
            array[index + 1]
        ) {
            const interludeDuration = array[index + 1]!.time - line.time;
            line.duration = [interludeDuration];
            line.delay = [0];
        }
        return line;
    });
};

export const calcPhraseProgress = (
    currentTime: number,
    line: { time: number; delay?: number[]; duration?: number[] },
    phraseIndex: number,
): number => {
    const lineTime = line.time || 0;
    const delay = line.delay?.[phraseIndex] ?? 0;
    const duration = line.duration?.[phraseIndex] ?? 0;

    if (duration <= 0) return 0;
    if (currentTime - lineTime < delay) return 0;

    return Math.min(
        1,
        Math.max(0, (currentTime - lineTime - delay) / duration),
    );
};

export const generatePhraseStyle = (
    currentTime: number,
    line: ProcessedLine | ProcessedBGLine,
    phraseIndex: number,
) => {
    if (!line) return {};

    if ((line as ProcessedLine).type === "end") {
        return {
            "background-image": `linear-gradient(to right, rgba(255, 255, 255, 0.85) 100%)`,
            "font-size": "20px",
        };
    }

    const progress = calcPhraseProgress(currentTime, line, phraseIndex);

    const a = 0.35 + 0.5 * Math.sin((progress * Math.PI) / 2);
    const transitionWidth = 8;
    const colorStop = progress * 100;
    const transitionStart =
        progress === 0 ? 0 : Math.max(0, colorStop - transitionWidth);
    const transitionEnd =
        progress === 0
            ? 0
            : Math.min(100 + transitionWidth, colorStop + transitionWidth);

    const linearGradient = `linear-gradient(to right,
        rgba(255, 255, 255, ${a}) 0%,
        rgba(255, 255, 255, ${a}) ${transitionStart}%,
        rgba(132, 132, 132, 0.35) ${transitionEnd}%,
        rgba(132, 132, 132, 0.35) 100%
    )`;

    const translateY = -2 * progress;

    const isKiai =
        (line as ProcessedLine).text?.[phraseIndex]?.kiai ??
        (line as ProcessedBGLine).text?.[phraseIndex]?.kiai;

    if (isKiai) {
        const scaleValue = 1 + 0.1 * Math.sin(progress * Math.PI);
        return {
            transform: `matrix(${scaleValue}, 0, 0, ${scaleValue}, 0, ${translateY})`,
            "--progress": `${progress * 100}%`,
            "background-image": linearGradient,
        };
    }

    return {
        transform: `matrix(1, 0, 0, 1, 0, ${translateY})`,
        "--progress": `${progress * 100}%`,
        "background-image": linearGradient,
    };
};

export const isActivePhrase = (
    currentTime: number,
    line: ProcessedLine | ProcessedBGLine,
    phraseIndex: number,
) => {
    if (!line?.duration[phraseIndex] || !line?.delay[phraseIndex]) return false;
    const p = calcPhraseProgress(currentTime, line, phraseIndex);
    return p > 0 && p < 1;
};
