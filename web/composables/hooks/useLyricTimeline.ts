import { computed, type Ref } from "vue";
import type { LyricData, ProcessedLine } from "@/types/player";
import { generatePhraseStyle } from "@/composables/hooks/useSongs";

export function useLyricTimeline(
    jsonMappingContent: Ref<LyricData>,
    currentTime: Ref<number>,
    songDuration: Ref<number>,
) {
    const processedLines = computed((): ProcessedLine[] => {
        if (!jsonMappingContent.value) return [];
        return (jsonMappingContent.value as ProcessedLine[]).map((line) => {
            const mainTotal = line.duration.reduce((a, b) => a + b, 0);
            let maxEnd = line.time + mainTotal;
            const validDuration = mainTotal > 0 ? mainTotal : 3.0;

            if (
                line.background_voice?.time !== undefined &&
                line.background_voice?.duration
            ) {
                const bgTotal = line.background_voice.duration.reduce(
                    (a, b) => a + b,
                    0,
                );
                maxEnd = Math.max(maxEnd, line.background_voice.time + bgTotal);
            }

            const finalEnd =
                maxEnd > line.time ? maxEnd : line.time + validDuration;
            return { ...line, computedEndTime: finalEnd };
        });
    });

    const activeLineIndices = computed(() => {
        const result: number[] = [];
        const now = currentTime.value;

        processedLines.value.forEach((line, index) => {
            const startTime = line.time - 0.3;
            const nextLine = processedLines.value[index + 1];

            let endTime: number;
            if (nextLine) {
                endTime =
                    nextLine.time - 0.3 < line.computedEndTime
                        ? line.computedEndTime
                        : nextLine.time - 0.3;
            } else {
                endTime =
                    Math.max(line.computedEndTime, songDuration.value) + 0.5;
            }

            if (now >= startTime && now < endTime) result.push(index);
        });
        return result;
    });

    const isCurrentLine = (index: number) =>
        activeLineIndices.value.includes(index);

    const currentLineIndex = computed(() => {
        const arr = activeLineIndices.value;
        return arr.length === 0 ? -1 : arr[arr.length - 1];
    });

    const getPhraseStyle = (lineIndex: number, phraseIndex: number) => {
        if (!isCurrentLine(lineIndex)) return {};
        const line = processedLines.value[lineIndex];
        if (!line) return {};
        return generatePhraseStyle(currentTime.value, line as any, phraseIndex);
    };

    const getBackgroundPhraseStyle = (
        lineIndex: number,
        phraseIndex: number,
    ) => {
        if (!isCurrentLine(lineIndex)) return {};
        const line = processedLines.value[lineIndex];
        if (!line?.background_voice) return {};
        return generatePhraseStyle(
            currentTime.value,
            line.background_voice,
            phraseIndex,
        );
    };

    return {
        processedLines,
        activeLineIndices,
        currentLineIndex,
        isCurrentLine,
        getPhraseStyle,
        getBackgroundPhraseStyle,
    };
}
