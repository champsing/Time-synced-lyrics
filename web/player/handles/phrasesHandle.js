export const generatePhraseStyle = (currentTime, line, phraseIndex) => {
    if (!line) return {};

    // 使用 Optional Chaining 檢查 line.type
    if (line.type === "end") {
        return { "--progress": "100%", "font-size": "20px" };
    }

    // 安全存取 line.time，若不存在則給默認值 0
    const lineTime = line.time || 0;

    const delay = line.delay?.[phraseIndex] || 0;
    const duration = line.duration?.[phraseIndex] || 0;
    const rawProgress = (currentTime - lineTime - delay) / duration;

    let phraseProgressValue;

    if (duration > 0)
        phraseProgressValue = Math.min(1, Math.max(0, rawProgress)); // 限制在 0~1 範圍

    // 若時間未到延遲時間，進度設為 0
    if (currentTime - lineTime < delay) {
        phraseProgressValue = 0;
    }

    const a = 0.35 + 0.5 * phraseProgressValue;

    const linearGradient = `linear-gradient(to right, rgba(255, 255, 255, ${a}) ${
        phraseProgressValue * 100
    }%, rgba(126,126,126,0.75) ${phraseProgressValue * 100}%)`;

    if (line.text[phraseIndex].kiai) {
        const waveScale = 0.1; // 縮放幅度 (1.1 = 1 + 0.1)
        const waveFrequency = 1; // 波浪次數 (1 = 單一完整波浪)

        // 使用正弦函數計算波浪縮放 (範圍 0~1 → 1.0~1.1~1.0)
        const scaleWave = Math.sin(
            phraseProgressValue * Math.PI * waveFrequency
        );
        const scaleValue = 1 + waveScale * scaleWave;

        return {
            transform: `matrix(${scaleValue}, 0, 0, ${scaleValue}, 0, ${
                -2 * phraseProgressValue
            })`,
            "--progress": `${phraseProgressValue * 100}%`,
            backgroundImage: `${linearGradient}`,
        };
    } else
        return {
            transform: `matrix(1, 0, 0, 1, 0, ${-2 * phraseProgressValue})`,
            "--progress": `${phraseProgressValue * 100}%`,
            backgroundImage: `${linearGradient}`,
        };
};

export const isActivePhrase = (currentTime, line, phraseIndex) => {
    return (
        currentTime - line.time > line.delay?.[phraseIndex] &&
        currentTime - line.time - line.delay?.[phraseIndex] <
            line.duration?.[phraseIndex]
    );
};
