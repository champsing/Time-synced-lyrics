<script setup lang="ts">
import { useSongSelect } from "@/composables/hooks/useSongSelect";
import type { SongListItem } from "@/types/song_select";

const { getVersionLabel } = useSongSelect();

defineProps<{
    song: SongListItem;
    selectedVersion: string;
}>();

const emit = defineEmits<{
    (e: "open", song: SongListItem): void;
    (e: "play", song: SongListItem): void;
}>();
</script>

<template>
    <article
        class="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 cursor-pointer"
        :class="{ 'opacity-50': !song.available }"
        @click="emit('open', song)"
    >
        <div class="relative aspect-square overflow-hidden">
            <img
                :src="song.art"
                :alt="song.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none"
            />

            <!-- 版本徽章 -->
            <div
                v-if="song.available"
                class="absolute top-2 left-2 px-2 py-1 backdrop-blur-md text-white text-[10px] rounded-md border border-white/20 pointer-events-none z-10"
                :class="{
                    'bg-cyan-600/80': selectedVersion === 'original',
                    'bg-purple-600/80': selectedVersion === 'instrumental',
                    'bg-zinc-900/80': selectedVersion === 'the_first_take',
                    'bg-red-400/80': selectedVersion === 'live',
                }"
            >
                {{ getVersionLabel(selectedVersion) }}
            </div>

            <!-- Coming Soon 遮罩 -->
            <div
                v-if="!song.available"
                class="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
                <span class="text-xl font-bold rotate-12 text-white/70"
                    >COMING SOON</span
                >
            </div>

            <!-- 播放按鈕 -->
            <button
                v-if="song.available"
                @click.stop="emit('play', song)"
                class="absolute bottom-3 right-3 w-10 h-10 bg-rose-500 rounded-full shadow-lg flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-rose-300 hover:scale-110"
                :aria-label="`播放 ${song.title}`"
            >
                <span class="material-icons text-white">play_arrow</span>
            </button>
        </div>

        <div class="p-3">
            <h3 class="font-bold text-base truncate mb-0.5" :title="song.title">
                {{ song.title }}
            </h3>
            <p class="text-sm text-teal-200 truncate">
                {{ song.displayArtist }}
            </p>
        </div>
    </article>
</template>
