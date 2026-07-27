<script setup lang="ts">
defineProps<{
    isPaused: boolean;
}>();

defineEmits<{
    (e: "play"): void;
    (e: "pause"): void;
    (e: "rewind"): void;
    (e: "forward"): void;
}>();
</script>

<template>
    <div class="playback-controls w-full max-w-95 lg:max-w-110 mb-4">
        <div class="flex items-center justify-center gap-8">
            <button
                @click="$emit('rewind')"
                class="text-white/50 hover:text-white transition-all transform active:scale-90"
                title="倒轉 10 秒"
            >
                <span class="material-icons text-2xl">replay_10</span>
            </button>

            <button
                @click="isPaused ? $emit('play') : $emit('pause')"
                class="w-14 h-14 flex items-center justify-center bg-[#FC3C44] hover:bg-[#e8353d] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/20"
                title="播放 / 暫停"
            >
                <span class="material-icons text-[36px] leading-none">
                    {{ isPaused ? "play_arrow" : "pause" }}
                </span>
            </button>

            <button
                @click="$emit('forward')"
                class="text-white/50 hover:text-white transition-all transform active:scale-90"
                title="快轉 10 秒"
            >
                <span class="material-icons text-2xl">forward_10</span>
            </button>
        </div>
    </div>
</template>
