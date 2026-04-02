<script setup lang="ts">
import { useTranslation } from "@/composables/hooks/useTranslation";
import type { ProcessedBGLine, ProcessedLine, Song } from "@/types/player";
import TranslationBar from "@components/player/TranslationBar.vue";
import { computed, type CSSProperties } from "vue";
import LyricLine from "./LyricLine.vue";

const props = defineProps<{
    lines: ProcessedLine[];
    song: Song;
    activeLineIndices: number[];
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
        line: ProcessedLine | ProcessedBGLine,
        phraseIndex: number,
    ) => boolean;
}>();
defineEmits<{ (e: "jump", index: number): void }>();
const isDuet = computed(() => props.song.is_duet);

// 在 <script setup> 中
const { translationText, backgroundTranslationText, translationAuthor } =
    useTranslation(
        () => props.song,
        () => props.lines,
        () => props.activeLineIndices,
    );
</script>

<template>
    <div
        id="lyrics-container"
        class="scroll-smooth snap-y snap-proximity p-4 w-full relative mb-[30vh] md:mb-10"
        :class="{ 'bg-[#3b3a3a]': !enableLyricBackground }"
    >
        <div
            class="md:h-svh md:overflow-scroll md:overflow-x-hidden rounded-2xl relative"
            style="scrollbar-width: none"
        >
            <LyricLine
                v-for="(line, index) in lines"
                :key="index"
                :line="line"
                :bg-line="line.background_voice"
                :index="index"
                :total-lines="lines.length"
                :is-current="isCurrentLine(index)"
                :is-duet="isDuet"
                :current-time="currentTime"
                :enable-pronounciation="enablePronounciation"
                :get-phrase-style="getPhraseStyle"
                :get-background-phrase-style="getBackgroundPhraseStyle"
                :is-active-phrase="isActivePhrase"
                @jump="
                    try {
                        $emit('jump', $event);
                    } catch (e) {
                        console.error('Failed to emit jump event:', e);
                    }
                "
            />
        </div>

        <!-- 背景圖 -->
        <div
            v-if="enableLyricBackground"
            class="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl select-none"
        >
            <img
                :src="song.art"
                :alt="song.folder"
                class="animate-background w-full h-full object-cover opacity-50 brightness-50 blur-xl relative overflow-hidden translate-z-0 backface-hidden"
            />
        </div>

        <div v-if="enableTranslation" class="md:h-[15vh] h-0" />
    </div>
    <TranslationBar
        v-if="enableTranslation"
        :song="song"
        :translation-text="translationText"
        :background-translation-text="backgroundTranslationText"
        :translation-author="translationAuthor"
        @disable-translation="enableTranslation = false"
    />
</template>

<style scoped>
/* animate-background: scale-pulse + fade-in */
@keyframes background-fade-in {
    from {
        opacity: 0;
        transform: scale(1);
    }
    to {
        opacity: 0.5;
        transform: scale(1.1);
    }
}

@keyframes scale-pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.animate-background {
    animation:
        scale-pulse 30s infinite linear,
        background-fade-in 1.5s ease-out;
}

/* reflection-scan 偽元素掃光效果 */
.reflection-scan::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0) 25%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0) 75%
    );
    mix-blend-mode: soft-light;
    animation: scan-reflect 4s infinite linear;
    transform: rotate(45deg);
}

.reflection-scan::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0) 20%,
        rgba(255, 255, 255, 0.08) 40%,
        rgba(255, 255, 255, 0) 60%,
        rgba(255, 255, 255, 0.03) 100%
    );
    mix-blend-mode: overlay;
    z-index: 1;
    animation: multi-scan 6s infinite linear;
    transform: rotate(45deg);
}

@keyframes scan-reflect {
    0% {
        transform: translate(-100%, -100%) rotate(45deg);
    }
    100% {
        transform: translate(100%, 100%) rotate(45deg);
    }
}

@keyframes multi-scan {
    0% {
        transform: translateX(-100%) skewX(-15deg);
    }
    100% {
        transform: translateX(100%) skewX(-15deg);
    }
}
</style>
