<script setup lang="ts">
import { INSTRUMENTAL, LIVE, ORIGINAL, THE_FIRST_TAKE } from "@/composables/utils/config";

const props = withDefaults(
    defineProps<{
        songVersion: string | null;
        compact?: boolean;
    }>(),
    { compact: false },
);
</script>

<template>
    <span
        v-if="songVersion !== ORIGINAL"
        class="px-1.5 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider md:px-2 md:py-0.5 md:text-[10px]"
        :class="{
            'bg-cyan-500/20 text-cyan-400 border-cyan-500/30':
                songVersion === INSTRUMENTAL,
            'bg-white/10 text-white border-white/20':
                songVersion === THE_FIRST_TAKE,
            'bg-rose-500/20 text-rose-400 border-rose-500/30':
                songVersion === LIVE,
        }"
    >
        {{
            songVersion === INSTRUMENTAL
                ? compact
                    ? "Inst."
                    : "Instrumental"
                : songVersion === THE_FIRST_TAKE
                  ? compact
                      ? "TFT"
                      : "The First Take"
                  : songVersion === LIVE
                    ? "Live"
                    : songVersion
        }}
    </span>
</template>
