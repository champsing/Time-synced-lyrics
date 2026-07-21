<script setup lang="ts">
import type { Song } from "@/types/player";

const props = defineProps<{
    isOpen: boolean;
    currentSong: Song & { displayArtist?: string };
    ALBUM_GOOGLE_LINK_BASE: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
}>();
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-4"
            >
                <!-- Glass backdrop -->
                <div
                    class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    @click="emit('close')"
                />

                <!-- Glass content card -->
                <div
                    class="relative w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[60vh]"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0"
                    >
                        <h2
                            class="text-lg font-bold text-white/90 tracking-tight"
                        >
                            工作人員名單
                        </h2>
                        <button
                            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                            title="關閉"
                            aria-label="關閉視窗"
                            @click="emit('close')"
                        >
                            <span class="material-icons text-lg">close</span>
                        </button>
                    </div>

                    <!-- Scrollable body -->
                    <div
                        class="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar"
                    >
                        <!-- Artist banner -->
                        <div class="text-center mb-4">
                            <span class="text-sm text-white/50">演出藝人</span>
                            <div class="text-2xl font-bold text-white mt-1">
                                {{ currentSong.displayArtist || "未知的藝人" }}
                            </div>
                        </div>

                        <hr class="border-white/10 my-4" />

                        <!-- Album -->
                        <div class="text-center mb-4">
                            <span class="text-sm text-white/50"
                                >收錄專輯：</span
                            >
                            <div
                                class="inline-block mt-1 px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-sm font-medium"
                            >
                                <a
                                    v-if="currentSong.album?.link !== undefined"
                                    :href="
                                        ALBUM_GOOGLE_LINK_BASE +
                                        currentSong.album.link
                                    "
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-teal-300 hover:text-teal-200 underline underline-offset-4 decoration-teal-500/30 transition-colors"
                                >
                                    {{
                                        currentSong.album
                                            ? currentSong.album.name
                                            : currentSong.title + " - 單曲"
                                    }}
                                </a>
                                <span v-else class="text-white/70">
                                    {{
                                        currentSong.album
                                            ? currentSong.album.name
                                            : currentSong.title + " - 單曲"
                                    }}
                                </span>
                            </div>
                        </div>

                        <!-- Credits grid -->
                        <div
                            v-if="currentSong.credits"
                            class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-y-6 max-h-[50vh] md:max-h-[55vh] overflow-y-auto custom-scrollbar pr-2"
                        >
                            <template v-if="currentSong.credits.performance">
                                <div
                                    class="md:col-span-3 text-sm font-bold text-teal-400 mt-2 tracking-wide uppercase"
                                >
                                    表演者
                                </div>
                                <div
                                    v-for="(c, i) in currentSong.credits
                                        .performance"
                                    :key="`perf-${i}`"
                                    class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div class="text-lg font-bold text-white">
                                        {{ c.name }}
                                    </div>
                                    <span class="text-xs text-white/40">{{
                                        c.contribution?.join("、")
                                    }}</span>
                                </div>
                            </template>

                            <template v-if="currentSong.credits.song_writing">
                                <div
                                    class="md:col-span-3 text-sm font-bold text-teal-400 mt-2 tracking-wide uppercase"
                                >
                                    詞曲
                                </div>
                                <div
                                    v-for="(c, i) in currentSong.credits
                                        .song_writing"
                                    :key="`sw-${i}`"
                                    class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div class="text-lg font-bold text-white">
                                        {{ c.name }}
                                    </div>
                                    <span class="text-xs text-white/40">{{
                                        c.contribution?.join("、")
                                    }}</span>
                                </div>
                            </template>

                            <template v-if="currentSong.credits.engineering">
                                <div
                                    class="md:col-span-3 text-sm font-bold text-teal-400 mt-2 tracking-wide uppercase"
                                >
                                    製作與工程團隊
                                </div>
                                <div
                                    v-for="(c, i) in currentSong.credits
                                        .engineering"
                                    :key="`eng-${i}`"
                                    class="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div class="text-lg font-bold text-white">
                                        {{ c.name }}
                                    </div>
                                    <span class="text-xs text-white/40">{{
                                        c.contribution?.join("、")
                                    }}</span>
                                </div>
                            </template>
                        </div>

                        <hr class="border-white/10 mt-4 mb-3" />
                        <p class="text-xs text-white/30 leading-relaxed">
                            工作人員名單僅供參考，本站並不保證該名單 100%
                            正確或樂曲之製作必然為本工作人員名單所提供的分工。
                        </p>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

@keyframes modal-pop {
    0% {
        transform: scale(0.95) translateY(10px);
        opacity: 0;
    }
    100% {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}
.animate-modal-pop {
    animation: modal-pop 0.3s ease-out;
}

.modal-fade-enter-active {
    transition: opacity 0.2s ease;
}
.modal-fade-leave-active {
    transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
