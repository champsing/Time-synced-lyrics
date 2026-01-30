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

        // 只取最後一個有翻譯的活躍行
        return activeLineIndices.value
            .map((index) => jsonMappingContent.value[index]?.translation || "")
            .filter((text) => text !== "")
            .reverse()[0];
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
            .reverse()[0];
    });

    const translationAuthor = computed(() => {
        if (!currentSong.value.translation?.author) return "";
        if (currentSong.value.translation?.modified === true)
            return currentSong.value.translation?.author + "〔已修改〕";
        else return currentSong.value.translation?.author;
    });

    return { translationAuthor, translationText, backgroundTranslationText };
}
