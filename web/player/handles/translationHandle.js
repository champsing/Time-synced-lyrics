import { computed } from "vue";

export function useTransation(
    currentSong,
    jsonMappingContent,
    activeLineIndices, // 改為接收活躍行索引陣列
) {
    const translationText = computed(() => {
        if (
            !jsonMappingContent.value ||
            !activeLineIndices.value ||
            activeLineIndices.value.length === 0
        )
            return "";

        // 遍歷所有活躍行，取出翻譯，過濾掉空的，然後用換行符號連接
        return activeLineIndices.value
            .map((index) => jsonMappingContent.value[index]?.translation || "")
            .filter((text) => text !== "")
            .join("\n");
    });

    const backgroundTranslationText = computed(() => {
        if (
            !jsonMappingContent.value ||
            !activeLineIndices.value ||
            activeLineIndices.value.length === 0
        )
            return "";

        return activeLineIndices.value
            .map(
                (index) =>
                    jsonMappingContent.value[index]?.background_voice
                        ?.translation || "",
            )
            .filter((text) => text !== "")
            .join("\n");
    });

    const translationAuthor = computed(() => {
        if (!currentSong.value.translation?.author) return "";
        if (currentSong.value.translation?.modified === true)
            return currentSong.value.translation?.author + "〔已修改〕";
        else return currentSong.value.translation?.author;
    });

    return { translationAuthor, translationText, backgroundTranslationText };
}
