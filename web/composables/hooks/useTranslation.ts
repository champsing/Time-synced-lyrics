import type { LyricData, SongWithDisplay } from "@/types/player";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

export function useTranslation(
    songSource: MaybeRefOrGetter<SongWithDisplay>,
    contentSource: MaybeRefOrGetter<LyricData>,
    indicesSource: MaybeRefOrGetter<number[]>,
) {
    // 使用 toValue (Vue 3.3+) 可以同時相容 Ref、Getter 函數或普通值
    const translationText = computed(() => {
        const song = toValue(songSource);
        const content = toValue(contentSource);
        const indices = toValue(indicesSource);

        if (!song || !content || !indices?.length) return "";

        return (
            indices
                .map((index) => content[index]?.translation)
                .filter((text) => !!text)
                .reverse()[0] || ""
        );
    });

    const backgroundTranslationText = computed(() => {
        const song = toValue(songSource);
        const content = toValue(contentSource);
        const indices = toValue(indicesSource);

        if (!song || !content || !indices?.length) return "";

        return (
            indices
                .map((index) => content[index]?.background_voice?.translation)
                .filter((text) => !!text)
                .reverse()[0] || ""
        );
    });

    const translationAuthor = computed(() => {
        const song = toValue(songSource);
        return song?.translation?.author || "";
    });

    const translationModified = computed(() => {
        const song = toValue(songSource);
        return song?.translation?.modified === 1;
    });

    return { translationAuthor, translationModified, translationText, backgroundTranslationText };
}
