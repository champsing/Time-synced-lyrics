<script setup lang="ts">
import type { Song } from "@/types";

defineProps<{
    song: Song;
    selectedVersion: string;
}>();

const emit = defineEmits(["open", "play"]);
</script>

<template>
    <article
        class="group relative bg-white/5 rounded-xl overflow-hidden transition-all hover:bg-white/10 cursor-pointer"
        :class="{ 'opacity-50': !song.available }"
        @click="emit('open', song)"
    >
        <div class="relative aspect-square">
            <img
                :src="song.art"
                :alt="song.title"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />

            <div
                v-if="song.available"
                class="absolute top-2 left-2 px-2 py-1 backdrop-blur-md rounded text-[10px]"
            >
                {{ selectedVersion }}
            </div>

            <button
                v-if="song.available"
                @click.stop="emit('play', song)"
                class="absolute bottom-3 right-3 w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
                <span class="material-icons text-white">play_arrow</span>
            </button>
        </div>
        <div class="p-3">
            <h3 class="font-bold truncate">{{ song.title }}</h3>
            <p class="text-sm text-teal-200 truncate">
                {{ song.display_artist }}
            </p>
        </div>
    </article>
</template>
