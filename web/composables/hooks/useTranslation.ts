import type { LyricData, SongWithDisplay } from "@/types/types";
import { computed } from "vue";

export function useTransation(
    currentSong: SongWithDisplay | null,
    jsonMappingContent: LyricData,
    activeLineIndices: number[], // 改為接收活躍行索引陣列
) {
    if (!currentSong) {
        return {
            translationAuthor: computed(() => ""),
            translationText: computed(() => ""),
            backgroundTranslationText: computed(() => ""),
        };
    }
    const translationText = computed(() => {
        if (
            !jsonMappingContent ||
            !activeLineIndices ||
            activeLineIndices.length === 0
        )
            return "";

        // 只取最後一個有翻譯的活躍行
        return activeLineIndices
            .map((index) => jsonMappingContent[index]?.translation || "")
            .filter((text) => text !== "")
            .reverse()[0];
    });

    const backgroundTranslationText = computed(() => {
        if (
            !jsonMappingContent ||
            !activeLineIndices ||
            activeLineIndices.length === 0
        )
            return "";

        return activeLineIndices
            .map(
                (index: number) =>
                    jsonMappingContent[index]?.background_voice?.translation ||
                    "",
            )
            .filter((text: string) => text !== "")
            .reverse()[0];
    });

    const translationAuthor = computed(() => {
        if (!currentSong.translation?.author) return "";
        if (currentSong.translation?.modified === 1)
            return currentSong.translation?.author + "〔已修改〕";
        else return currentSong.translation?.author;
    });

    return { translationAuthor, translationText, backgroundTranslationText };
}
