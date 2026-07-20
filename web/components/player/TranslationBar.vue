<script setup lang="ts">
import type { Song } from "@/types/player";

defineProps<{
    song: Song;
    translationText: string;
    backgroundTranslationText: string;
    translationAuthor: string;
}>();

defineEmits<{ (e: "disableTranslation"): void }>();
</script>

<template>
    <div id="translation-container" class="z-2 hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2">
        <template v-if="song.translation?.available">
            <div
                class="p-4 flex flex-col items-center gap-2 bg-[#231f1f]/90 backdrop-blur-md rounded-xl shadow-lg border border-white/5"
            >
                <div class="text-2xl font-bold text-center text-teal-300 p-2">
                    {{ translationText }}
                    <div class="mt-1 text-base text-center text-teal-500">
                        {{ backgroundTranslationText }}
                    </div>
                </div>
                <div class="mt-2">
                    <a
                        v-if="song.translation?.cite"
                        :href="song.translation?.cite"
                        title="翻譯作者姓名"
                        aria-label="翻譯作者姓名"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs font-bold text-center text-green-400 underline md:no-underline md:hover:underline"
                    >
                        翻譯作者：{{ translationAuthor }}
                    </a>
                    <div v-else class="text-xs text-center text-white/60">
                        翻譯作者：{{ translationAuthor }}
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div
                class="p-4 flex flex-col items-center gap-2 bg-[#231f1f]/80 backdrop-blur-md rounded-xl shadow-lg border border-white/5"
            >
                <span class="text-white/60">本歌曲尚未提供翻譯</span>
            </div>
        </template>
    </div>
</template>
