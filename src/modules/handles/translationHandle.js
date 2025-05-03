import { computed } from "vue";

export function useTransation(
    currentSong,
    jsonMappingContent,
    currentLineIndex
) {
    const translationText = computed(() => {
        if (!jsonMappingContent.value || currentLineIndex.value === -1)
            return "";
        return (
            jsonMappingContent.value[currentLineIndex.value]?.translation || ""
        );
    });

    const backgroundTranslationText = computed(() => {
        if (
            !jsonMappingContent.value[currentLineIndex.value] ||
            currentLineIndex.value === -1
        )
            return "";
        return (
            jsonMappingContent.value[currentLineIndex.value].background_voice
                ?.translation || ""
        );
    });

    const translationAuthor = computed(() => {
        if (!currentSong.value.translation?.author) return "";
        if (currentSong.value.translation?.modified === true)
            return currentSong.value.translation?.author + "〔已修改〕";
        else return currentSong.value.translation?.author;
    });

    return { translationAuthor, translationText, backgroundTranslationText };
}
