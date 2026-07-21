<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { formatTime } from "@/composables/utils/global";

const props = withDefaults(
    defineProps<{
        currentTime: number;
        songDuration: number;
        size?: "desktop" | "mobile";
    }>(),
    { size: "desktop" },
);

const emit = defineEmits<{
    (e: "seek", seconds: number): void;
}>();

// ── 拖曳狀態 ─────────────────────────────────────────────────────────────
const isDragging = ref(false);
const isHovering = ref(false);
const dragPercent = ref(0);
let activeBarEl: HTMLElement | null = null;

// ── 計算屬性 ─────────────────────────────────────────────────────────────
const formattedCurrentTime = computed(() => formatTime(props.currentTime));
const formattedSongDuration = computed(() => formatTime(props.songDuration));

const durationPercent = computed(() => {
    if (props.songDuration === 0) return 0;
    return (props.currentTime / props.songDuration) * 100;
});

const displayPercent = computed(() => {
    if (isDragging.value) return dragPercent.value;
    return durationPercent.value;
});

// ── 輔助函數 ─────────────────────────────────────────────────────────────
const getSeekRatio = (clientX: number, bar: HTMLElement): number => {
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
};

const seekToRatio = (ratio: number) => {
    if (props.songDuration > 0) {
        emit("seek", ratio * props.songDuration);
    }
};

// ── 滑鼠拖曳 ─────────────────────────────────────────────────────────────
const onBarMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    activeBarEl = event.currentTarget as HTMLElement;
    isDragging.value = true;
    const ratio = getSeekRatio(event.clientX, activeBarEl);
    dragPercent.value = ratio * 100;
    seekToRatio(ratio);
    document.addEventListener("mousemove", onBarMouseMove);
    document.addEventListener("mouseup", onBarMouseUp);
};

const onBarMouseMove = (event: MouseEvent) => {
    if (!isDragging.value || !activeBarEl) return;
    const ratio = getSeekRatio(event.clientX, activeBarEl);
    dragPercent.value = ratio * 100;
    seekToRatio(ratio);
};

const onBarMouseUp = () => {
    isDragging.value = false;
    activeBarEl = null;
    document.removeEventListener("mousemove", onBarMouseMove);
    document.removeEventListener("mouseup", onBarMouseUp);
};

// ── 觸控拖曳 ─────────────────────────────────────────────────────────────
const onBarTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    activeBarEl = event.currentTarget as HTMLElement;
    isDragging.value = true;
    const ratio = getSeekRatio(event.touches[0].clientX, activeBarEl);
    dragPercent.value = ratio * 100;
    seekToRatio(ratio);
    document.addEventListener("touchmove", onBarTouchMove, { passive: false });
    document.addEventListener("touchend", onBarTouchEnd);
};

const onBarTouchMove = (event: TouchEvent) => {
    if (!isDragging.value || !activeBarEl) return;
    event.preventDefault();
    const ratio = getSeekRatio(event.touches[0].clientX, activeBarEl);
    dragPercent.value = ratio * 100;
    seekToRatio(ratio);
};

const onBarTouchEnd = () => {
    isDragging.value = false;
    activeBarEl = null;
    document.removeEventListener("touchmove", onBarTouchMove);
    document.removeEventListener("touchend", onBarTouchEnd);
};

// ── 清理 ─────────────────────────────────────────────────────────────────
onUnmounted(() => {
    document.removeEventListener("mousemove", onBarMouseMove);
    document.removeEventListener("mouseup", onBarMouseUp);
    document.removeEventListener("touchmove", onBarTouchMove);
    document.removeEventListener("touchend", onBarTouchEnd);
});
</script>

<template>
    <div>
        <!-- 可拖曳進度條 -->
        <div
            class="relative w-full cursor-pointer py-2 -my-2"
            @mousedown="onBarMouseDown"
            @touchstart.prevent="onBarTouchStart"
            @mouseenter="isHovering = true"
            @mouseleave="isHovering = false"
        >
            <!-- 軌道 -->
            <div
                class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out"
                :class="{
                    'h-1': !isHovering && !isDragging,
                    'h-1.5': isHovering && !isDragging,
                    'h-4': isDragging,
                }"
                style="background-color: rgba(255, 255, 255, 0.12)"
            >
                <!-- 已播放進度 -->
                <div
                    class="absolute top-0 left-0 h-full rounded-full transition-[width] duration-300 ease-out bg-[#FC3C44]"
                    :style="{ width: displayPercent + '%' }"
                />
            </div>
        </div>

        <!-- 時間標籤 -->
        <div
            class="flex justify-between"
            :class="
                size === 'desktop'
                    ? 'mt-1.5'
                    : '-mt-1 mb-2'
            "
        >
            <span
                class="font-mono tracking-tight"
                :class="
                    size === 'desktop'
                        ? 'text-[10px] text-white/40'
                        : 'text-[9px] text-white/35'
                "
            >
                {{ formattedCurrentTime }}
            </span>
            <span
                class="font-mono tracking-tight"
                :class="
                    size === 'desktop'
                        ? 'text-[10px] text-white/40'
                        : 'text-[9px] text-white/35'
                "
            >
                {{ formattedSongDuration }}
            </span>
        </div>
    </div>
</template>
