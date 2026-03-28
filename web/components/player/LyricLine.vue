<script setup lang="ts">
import type { ProcessedBGLine, ProcessedLine } from "@/types/player";
import type { CSSProperties } from "vue";
import LyricPhrase from "./LyricPhrase.vue";

defineProps<{
    line: ProcessedLine;
    bgLine?: ProcessedBGLine;
    index: number;
    totalLines: number;
    isCurrent: boolean;
    isDuet?: boolean;
    currentTime: number;
    enablePronounciation: boolean;
    getPhraseStyle: (lineIndex: number, phraseIndex: number) => CSSProperties;
    isActivePhrase: (
        currentTime: number,
        line: ProcessedLine | ProcessedBGLine,
        phraseIndex: number,
    ) => boolean;
}>();
defineEmits<{ (e: "jump", index: number): void }>();
</script>

<template>
    <div
        :id="`lyric-line-${index}`"
        class="lyric-line m-6!"
        :class="{
            'is-duet': isDuet,
            'is-secondary-vocalist': line.is_secondary,
            'is-together': line.is_together,
        }"
    >
        <button
            :id="`line-button-${index}`"
            type="button"
            class="z-1 lyric-button text-2xl bg-transparent p-0 cursor-pointer max-w-[50%] relative"
            :class="{ active: isCurrent }"
            @click="$emit('jump', index)"
        >
            <div class="primary-vocals">
                <LyricPhrase
                    v-for="(t, phraseIndex) in line.text"
                    :key="phraseIndex"
                    :phrase="t"
                    :line-index="index"
                    :phrase-index="phraseIndex"
                    :duration="line.duration[phraseIndex] || 0"
                    :delay="line.delay[phraseIndex] || 0"
                    :phrase-style="getPhraseStyle(index, phraseIndex)"
                    :is-active="
                        isActivePhrase(currentTime, line, phraseIndex) &&
                        index < totalLines - 1
                    "
                    :is-kiai="!!t.kiai"
                    :enable-pronounciation="enablePronounciation"
                />
            </div>
            <div v-if="bgLine" class="background-vocals">
                <LyricPhrase
                    v-for="(bvt, phraseIndex) in bgLine.text"
                    v-if="isCurrent"
                    :key="phraseIndex"
                    :phrase="bvt"
                    :line-index="index"
                    :phrase-index="phraseIndex"
                    :duration="bgLine.duration[phraseIndex] || 0"
                    :delay="bgLine.delay[phraseIndex] || 0"
                    :phrase-style="getPhraseStyle(index, phraseIndex)"
                    :is-active="
                        isActivePhrase(currentTime, bgLine, phraseIndex) &&
                        index < totalLines - 1
                    "
                    :is-kiai="!!bvt.kiai"
                    :enable-pronounciation="enablePronounciation"
                    :is-background="true"
                />
            </div>
        </button>
    </div>
</template>
