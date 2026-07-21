<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        isPaused: boolean;
        size?: "desktop" | "mobile";
    }>(),
    { size: "desktop" },
);

const emit = defineEmits<{
    (e: "rewind"): void;
    (e: "toggle-play"): void;
    (e: "forward"): void;
}>();
</script>

<template>
    <div
        class="flex items-center"
        :class="size === 'desktop' ? 'gap-8' : 'gap-6'"
    >
        <!-- 倒轉 10 秒 -->
        <button
            @click="emit('rewind')"
            class="text-white/70 hover:text-white active:scale-90 transition-all duration-200"
            :class="{
                'w-10 h-10 flex items-center justify-center': size === 'mobile',
            }"
            :title="size === 'desktop' ? '倒轉 10 秒' : undefined"
            :aria-label="'倒轉 10 秒'"
        >
            <span class="material-icons text-[28px] leading-none"
                >replay_10</span
            >
        </button>

        <!-- 播放 / 暫停 -->
        <button
            @click="emit('toggle-play')"
            class="apple-play-btn flex items-center justify-center bg-white rounded-full active:scale-95 transition-all duration-200"
            :class="
                size === 'desktop'
                    ? 'w-16 h-16 hover:scale-105'
                    : 'w-14 h-14'
            "
            :title="size === 'desktop' ? '播放 / 暫停' : undefined"
            :aria-label="'播放 / 暫停'"
        >
            <span class="material-icons text-4xl text-black leading-none">
                {{ isPaused ? "play_arrow" : "pause" }}
            </span>
        </button>

        <!-- 快轉 10 秒 -->
        <button
            @click="emit('forward')"
            class="text-white/70 hover:text-white active:scale-90 transition-all duration-200"
            :class="{
                'w-10 h-10 flex items-center justify-center': size === 'mobile',
            }"
            :title="size === 'desktop' ? '快轉 10 秒' : undefined"
            :aria-label="'快轉 10 秒'"
        >
            <span class="material-icons text-[28px] leading-none"
                >forward_10</span
            >
        </button>
    </div>
</template>
