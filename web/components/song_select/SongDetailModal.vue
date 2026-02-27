<script setup lang="ts">
import { ref } from "vue";
import type { Song } from "@/types";

const props = defineProps<{
    show: boolean;
    song: Song | null;
    currentVersion: string;
}>();

const emit = defineEmits(["close", "update:version", "select"]);
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="show && song"
                class="fixed inset-0 z-100 flex items-center justify-center p-4"
            >
                <div
                    class="absolute inset-0 bg-black/80"
                    @click="emit('close')"
                ></div>

                <div
                    class="relative bg-[#1a2c2e] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
                >
                    <div class="flex flex-col md:flex-row">
                        <img
                            :src="song.art"
                            class="w-full md:w-72 h-72 object-cover"
                        />
                        <div class="p-6 flex-1">
                            <h2 class="text-2xl font-bold mb-2">
                                {{ song.title }}
                            </h2>
                            <p class="text-teal-300 mb-4">
                                {{ song.display_artist }}
                            </p>

                            <div class="flex flex-wrap gap-2 mb-6">
                                <button
                                    v-for="v in song.versions"
                                    :key="v.version"
                                    @click="emit('update:version', v.version)"
                                    :class="
                                        currentVersion === v.version
                                            ? 'bg-rose-500'
                                            : 'bg-white/10'
                                    "
                                    class="px-4 py-2 rounded-full text-sm transition-colors"
                                >
                                    {{ v.version }}
                                </button>
                            </div>

                            <button
                                @click="emit('select', song)"
                                class="w-full py-3 bg-rose-500 rounded-xl font-bold hover:scale-105 transition-transform"
                            >
                                立即開唱
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
