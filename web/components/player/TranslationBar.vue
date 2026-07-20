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
    <div
        id="translation-container"
        class="z-2 hidden md:block absolute bottom-6 left-4 max-w-md"
    >
        <template v-if="song.translation?.available">
            <div
                class="p-5 flex flex-col items-start gap-2 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06]"
            >
                <div class="text-2xl font-bold text-white/90 leading-snug">
                    {{ translationText }}
                    <div class="mt-1 text-base font-normal text-white/50">
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
                        class="text-xs font-medium text-white/35 hover:text-white/70 underline decoration-white/20 hover:decoration-white/50 underline-offset-2 transition-colors"
                    >
                        翻譯作者：{{ translationAuthor }}
                    </a>
                    <div v-else class="text-xs text-white/25">
                        翻譯作者：{{ translationAuthor }}
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div
                class="p-4 flex flex-col items-start gap-2 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.04]"
            >
                <span class="text-white/25 text-sm">本歌曲尚未提供翻譯</span>
            </div>
        </template>
    </div>
</template>
