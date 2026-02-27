export const generatePhraseStyle = (currentTime, line, phraseIndex) => {
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

    let phraseProgressValue;

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

    if (line.text[phraseIndex].kiai) {
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

export const isActivePhrase = (currentTime, line, phraseIndex) => {
    return (
        currentTime - line.time > line.delay?.[phraseIndex] &&
        currentTime - line.time - line.delay?.[phraseIndex] <
            line.duration?.[phraseIndex]
    );
};
