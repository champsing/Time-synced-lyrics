<script setup lang="ts">
import { onUnmounted, ref } from "vue";

const props = withDefaults(
    defineProps<{
        volume: number;
        isMuted: boolean;
        compact?: boolean;
    }>(),
    { compact: false },
);

const emit = defineEmits<{
    (e: "toggle-mute"): void;
    (e: "change-volume", value: number): void;
}>();

// ── 拖曳狀態 ─────────────────────────────────────────────────────────────
const isDragging = ref(false);
const isHovering = ref(false);
let activeBarEl: HTMLElement | null = null;

// ── 輔助函數 ─────────────────────────────────────────────────────────────
const getVolumeRatio = (clientX: number, bar: HTMLElement): number => {
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
};

const changeVolume = (newVolume: number) => {
    emit("change-volume", newVolume);
};

// ── 滑鼠拖曳 ─────────────────────────────────────────────────────────────
const onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    activeBarEl = event.currentTarget as HTMLElement;
    isDragging.value = true;
    const ratio = getVolumeRatio(event.clientX, activeBarEl);
    changeVolume(Math.round(ratio * 100));
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
    if (!isDragging.value || !activeBarEl) return;
    const ratio = getVolumeRatio(event.clientX, activeBarEl);
    changeVolume(Math.round(ratio * 100));
};

const onMouseUp = () => {
    isDragging.value = false;
    activeBarEl = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
};

// ── 觸控拖曳 ─────────────────────────────────────────────────────────────
const onTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    activeBarEl = event.currentTarget as HTMLElement;
    isDragging.value = true;
    const ratio = getVolumeRatio(event.touches[0].clientX, activeBarEl);
    changeVolume(Math.round(ratio * 100));
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
};

const onTouchMove = (event: TouchEvent) => {
    if (!isDragging.value || !activeBarEl) return;
    event.preventDefault();
    const ratio = getVolumeRatio(event.touches[0].clientX, activeBarEl);
    changeVolume(Math.round(ratio * 100));
};

const onTouchEnd = () => {
    isDragging.value = false;
    activeBarEl = null;
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
};

// ── 清理 ─────────────────────────────────────────────────────────────────
onUnmounted(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
});
</script>

<template>
    <div class="flex items-center gap-1.5">
        <!-- 靜音按鈕 -->
        <button
            @click="emit('toggle-mute')"
            class="text-white/50 hover:text-white transition-colors shrink-0"
            aria-label="靜音切換"
        >
            <span
                class="material-icons"
                :class="compact ? 'text-lg' : 'text-xl'"
            >
                {{ volume === 0 || isMuted ? "volume_off" : "volume_up" }}
            </span>
        </button>

        <!-- 音量滑桿 -->
        <div
            class="relative cursor-pointer py-2 -my-2"
            :class="compact ? 'flex-1' : 'w-24'"
            @mousedown="onMouseDown"
            @touchstart.prevent="onTouchStart"
            @mouseenter="isHovering = true"
            @mouseleave="isHovering = false"
        >
            <div
                class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out"
                :class="{
                    'h-1': !isHovering && !isDragging,
                    'h-1.5': isHovering && !isDragging,
                    'h-4': isDragging,
                }"
                style="background-color: rgba(255, 255, 255, 0.12)"
            >
                <div
                    class="absolute top-0 left-0 h-full rounded-full transition-[width] duration-300 ease-out bg-[#FC3C44]"
                    :style="{ width: volume + '%' }"
                />
            </div>
        </div>
    </div>
</template>
