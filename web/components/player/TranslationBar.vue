<template>
    <div
        v-if="enableTranslation"
        class="fixed bottom-28 md:bottom-auto md:relative left-0 right-0 md:left-auto md:right-auto mx-4 md:mx-0 md:mt-4 p-3 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 text-center"
    >
        <template v-if="song.translation?.available">
            <p class="text-teal-300 font-medium leading-tight">
                {{ translationText }}
            </p>
            <p class="text-teal-500/80 text-xs mt-1">
                {{ backgroundTranslationText }}
            </p>
            <div v-if="translationAuthor" class="mt-2">
                <a
                    :href="song.translation?.cite"
                    class="text-[10px] text-white/40 hover:text-white/60 transition-colors"
                >
                    翻譯作者：{{ translationAuthor }}
                </a>
            </div>
        </template>
        <template v-else>
            <div class="text-[10px] text-white/40">
                <span>本歌曲尚未提供翻譯</span>
                <button
                    class="underline ml-4"
                    @click="$emit('disableTranslation')"
                >
                    關閉翻譯
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Song } from "@/types";
defineProps<{
    enableTranslation: boolean;
    song: Song;
    translationText: string;
    backgroundTranslationText: string;
    translationAuthor: string;
}>();
defineEmits<{ (e: "disableTranslation"): void }>();
</script>
