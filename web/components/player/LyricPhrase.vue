<template>
    <span
        class="lyric-phrase"
        :duration="duration * 100"
        :delay="delay * 100"
        :style="phraseStyle"
        :class="{
            active: isActive,
            kiai: phrase.kiai,
        }"
    >
        <!-- 有注音且強制顯示 -->
        <template v-if="phrase.pronounciation && phrase.pncat_forced">
            <ruby>
                {{ phrase.phrase }}
                <rp>(</rp>
                <rt class="text-rose-400">{{ phrase.pronounciation }}</rt>
                <rp>)</rp>
            </ruby>
        </template>

        <!-- 有注音且使用者開啟顯示注音 -->
        <template v-else-if="phrase.pronounciation && enablePronounciation">
            <ruby>
                {{ phrase.phrase }}
                <rp>(</rp>
                <rt>{{ phrase.pronounciation }}</rt>
                <rp>)</rp>
            </ruby>
        </template>

        <!-- 純文字 -->
        <template v-else>{{ phrase.phrase }}</template>
    </span>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { LyricPhrase } from "../../types/types";

defineProps<{
    phrase: LyricPhrase;
    duration: number;
    delay: number;
    phraseStyle: CSSProperties;
    isActive: boolean;
    enablePronounciation: boolean;
}>();
</script>
