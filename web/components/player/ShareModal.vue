<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    currentSongURI: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "copy-link", uri: string): void;
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
                    class="relative w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0"
                    >
                        <h2
                            class="text-lg font-bold text-white/90 tracking-tight"
                        >
                            分享
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

                    <!-- Body -->
                    <div class="px-5 py-4 space-y-4">
                        <!-- Link section -->
                        <div class="flex items-center gap-3">
                            <span class="material-icons text-white/40 shrink-0">
                                link
                            </span>
                            <div
                                class="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5"
                            >
                                <p
                                    class="text-xs text-white/60 truncate font-mono select-all"
                                >
                                    {{ currentSongURI }}
                                </p>
                            </div>
                        </div>

                        <!-- Copy button -->
                        <button
                            class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 text-teal-300 font-medium transition-all active:scale-[0.98]"
                            @click="emit('copy-link', currentSongURI)"
                        >
                            <span class="material-icons text-lg"
                                >content_copy</span
                            >
                            <span>複製連結</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
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
