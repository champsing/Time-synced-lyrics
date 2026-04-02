<script setup lang="ts">
defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{
    (e: "close"): void;
    (e: "confirm"): void;
}>();
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-100 flex items-center justify-center p-4"
            >
                <div
                    class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    @click="emit('close')"
                />
                <div
                    class="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-[85%] max-w-md"
                >
                    <div class="flex items-center mb-4">
                        <span class="text-xl font-bold text-white"
                            >重新整理歌曲資料</span
                        >
                        <div class="grow" />
                        <button
                            @click="emit('close')"
                            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg"
                        >
                            &times;
                        </button>
                    </div>
                    <div class="text-white/90 space-y-4">
                        <p class="text-lg">
                            您確定要刪除本地緩存並重新獲取歌曲資料嗎？
                        </p>
                        <p class="text-base italic">
                            須花費一些時間重新下載歌曲檔案。
                        </p>
                        <div class="flex gap-4 pt-4">
                            <button
                                @click="emit('confirm')"
                                class="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-emerald-400 to-teal-500 hover:scale-105 transition-transform shadow-md"
                            >
                                確定
                            </button>
                            <button
                                @click="emit('close')"
                                class="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-rose-500 to-red-500 hover:scale-105 transition-transform shadow-md"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
