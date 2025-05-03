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
    const rawProgress = (currentTime.value - line.time - delay) / duration;

    // 若時間未到延遲時間，進度設為 0
    if (currentTime.value - lineTime < delay) {
        phraseProgressValue = 0;
    }

    const progress = Math.min(1, Math.max(0, rawProgress));

    return {
        transform: `matrix(1, 0, 0, 1, 0, ${-2 * phraseProgressValue})`,
        "--progress": `${progress * 100}%`,
    };
};
