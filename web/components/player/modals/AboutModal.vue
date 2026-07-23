<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    playerVersion: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "copy-debug-info"): void;
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
                    class="relative w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-5 py-4 border-b border-white/10"
                    >
                        <h2
                            class="text-lg font-bold text-white/90 tracking-tight"
                        >
                            關於
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
                    <div class="px-5 py-6 flex flex-col items-center gap-5">
                        <!-- Author -->
                        <div class="text-center">
                            <p class="text-sm text-white/40">網站作者</p>
                            <p class="text-2xl font-bold text-white mt-1">
                                香榭 Champsing
                            </p>
                        </div>

                        <!-- Version -->
                        <div
                            class="w-full text-center py-3 px-4 rounded-xl bg-white/5 border border-white/5"
                        >
                            <p class="text-xs text-white/40 mb-1">播放器版本</p>
                            <p class="text-sm font-mono text-white/70">
                                {{ playerVersion }}
                            </p>
                        </div>

                        <!-- Copy debug info -->
                        <button
                            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/25 hover:bg-teal-500/25 text-teal-300 text-sm font-medium transition-all active:scale-[0.98]"
                            @click="emit('copy-debug-info')"
                        >
                            <span class="material-icons text-base"
                                >bug_report</span
                            >
                            <span>複製偵錯資訊</span>
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
