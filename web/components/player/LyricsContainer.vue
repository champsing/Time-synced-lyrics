<template>
    <div
        id="lyrics-container"
        class="scroll-smooth snap-y snap-proximity text-center p-4 w-full relative mb-[30vh] md:mb-10"
        :class="{ 'bg-[#3b3a3a]': !enableLyricBackground }"
    >
        <div
            class="md:h-svh md:overflow-scroll md:overflow-x-hidden"
            style="scrollbar-width: none"
        >
            <LyricLine
                v-for="(line, index) in lines"
                :key="index"
                :line="line"
                :index="index"
                :total-lines="lines.length"
                :is-current="isCurrentLine(index)"
                :is-duet="song.is_duet"
                :current-time="currentTime"
                :enable-pronounciation="enablePronounciation"
                :get-phrase-style="getPhraseStyle"
                :get-background-phrase-style="getBackgroundPhraseStyle"
                :is-active-phrase="isActivePhrase"
                @jump="$emit('jump', $event)"
            />
        </div>
        <div
            v-if="enableLyricBackground"
            class="absolute inset-0 -z-10 overflow-hidden rounded-2xl select-none"
        >
            <img
                :src="song.art"
                :alt="song.folder"
                class="reflection-scan w-full h-full object-cover opacity-50 brightness-50 blur-xl animate-background relative overflow-hidden translate-z-0 backface-hidden"
            />
        </div>
        <div v-if="enableTranslation" class="md:h-[10vh] h-0" />
    </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { Song } from "@/types";
import LyricLine from "./LyricLine.vue";

defineProps<{
    lines: any[];
    song: Song;
    currentTime: number;
    enablePronounciation: boolean;
    enableLyricBackground: boolean;
    enableTranslation: boolean;
    isCurrentLine: (index: number) => boolean;
    getPhraseStyle: (lineIndex: number, phraseIndex: number) => CSSProperties;
    getBackgroundPhraseStyle: (
        lineIndex: number,
        phraseIndex: number,
    ) => CSSProperties;
    isActivePhrase: (
        currentTime: number,
        line: unknown,
        phraseIndex: number,
    ) => boolean;
}>();
defineEmits<{ (e: "jump", index: number): void }>();
</script>
