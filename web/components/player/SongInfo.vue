<script setup lang="ts">
import {
    INSTRUMENTAL,
    LIVE,
    ORIGINAL,
    THE_FIRST_TAKE,
} from "@/composables/utils/config";
import type { SongWithDisplay } from "@/types/player";

defineProps<{
    currentSong: SongWithDisplay;
    songVersion: string | null;
}>();

defineEmits<{
    (e: "openCredit"): void;
}>();

const parseSubtitle = (subtitle: string) =>
    subtitle?.replace(/\\n/g, "\n") || "";
</script>

<template>
    <div class="song-info w-full max-w-95 lg:max-w-110 md:pt-10">
        <h1
            class="text-white text-2xl lg:text-3xl font-bold tracking-tight leading-tight line-clamp-2"
        >
            {{ currentSong.title || currentSong.folder }}
        </h1>

        <div class="flex items-center gap-2 mt-2">
            <button
                v-if="currentSong.credits"
                @click="$emit('openCredit')"
                class="text-white/60 hover:text-white text-sm lg:text-base transition-colors underline underline-offset-4 md:no-underline md:hover:underline"
            >
                {{ currentSong.displayArtist || "未知藝人" }}
            </button>
            <span v-else class="text-white/50 text-sm lg:text-base">
                {{ currentSong.displayArtist || "未知藝人" }}
            </span>
        </div>

        <div class="flex items-center gap-4 mt-2 flex-wrap">
            <span class="text-white/50 text-xs lg:text-sm">
                {{ currentSong.album?.name || "單曲" }}
            </span>
            <span
                v-if="songVersion !== ORIGINAL"
                class="px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider"
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
                        ? "Instrumental"
                        : songVersion === THE_FIRST_TAKE
                          ? "The First Take"
                          : songVersion === LIVE
                            ? "Live"
                            : songVersion
                }}
            </span>
        </div>

        <p
            v-if="currentSong.subtitle"
            class="text-white/50 text-xs mt-2 line-clamp-2 italic"
        >
            {{ parseSubtitle(currentSong.subtitle) }}
        </p>
    </div>
</template>
