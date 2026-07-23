<script setup lang="ts">
import type { Song } from "@/types/player";

defineProps<{
    song: Song;
    translationText: string;
    backgroundTranslationText: string;
    translationAuthor: string;
    translationModified: boolean;
}>();

defineEmits<{ (e: "disableTranslation"): void }>();
</script>

<template>
    <div id="translation-container" class="block w-full">
        <template v-if="song.translation?.available">
            <div
                class="p-3 md:p-5 flex flex-col items-start gap-1.5 md:gap-2 bg-white/4 backdrop-blur-xl rounded-2xl border border-white/6"
            >
                <div
                    class="text-lg md:text-2xl font-bold text-white/90 leading-snug"
                >
                    {{ translationText }}
                    <div
                        class="mt-1 text-sm md:text-base font-normal text-white/50"
                    >
                        {{ backgroundTranslationText }}
                    </div>
                </div>
                <div class="mt-1">
                    <a
                        v-if="song.translation?.cite"
                        :href="song.translation?.cite"
                        title="翻譯作者姓名"
                        aria-label="翻譯作者姓名"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[10px] md:text-xs font-medium text-zinc-300/70 hover:text-zinc-200 underline decoration-zinc-300/20 hover:decoration-zinc-300/50 underline-offset-2 transition-colors"
                    >
                        翻譯作者：{{ translationAuthor }}
                        <span
                            v-if="translationModified"
                            class="ml-1.5 px-1.5 py-0.5 rounded-md bg-zinc-300/20 text-[10px] text-zinc-300 font-normal no-underline"
                        >
                            有更動
                        </span>
                    </a>
                    <div v-else class="text-[10px] md:text-xs text-zinc-300/60">
                        翻譯作者：{{ translationAuthor }}
                        <span
                            v-if="translationModified"
                            class="ml-1.5 px-1.5 py-0.5 rounded-md bg-zinc-300/15 text-[10px] text-zinc-300/90 font-normal"
                        >
                            有更動
                        </span>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div
                class="p-3 md:p-4 flex flex-col items-start gap-2 bg-white/3 backdrop-blur-xl rounded-2xl border border-white/4"
            >
                <span class="text-white/25 text-xs md:text-sm"
                    >本歌曲尚未提供翻譯</span
                >
            </div>
        </template>
    </div>
</template>
