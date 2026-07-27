<script setup lang="ts">
import { formatTime } from "@/composables/utils/global";

defineProps<{
    currentTime: number;
    songDuration: number;
    displayPercent: number;
    isHovering: boolean;
    isDragging: boolean;
}>();

defineEmits<{
    (e: "barMouseDown", event: MouseEvent): void;
    (e: "barTouchStart", event: TouchEvent): void;
    (e: "update:isHovering", value: boolean): void;
}>();
</script>

<template>
    <div class="duration-bar-container w-full max-w-95 lg:max-w-110 pt-3">
        <div
            class="relative w-full group cursor-pointer py-2 -my-2"
            @mousedown="$emit('barMouseDown', $event)"
            @touchstart.prevent="$emit('barTouchStart', $event)"
            @mouseenter="$emit('update:isHovering', true)"
            @mouseleave="$emit('update:isHovering', false)"
        >
            <div
                class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out bg-white/12"
                :class="{
                    'h-1': !isHovering && !isDragging,
                    'h-1.5': isHovering && !isDragging,
                    'h-4': isDragging,
                }"
            >
                <div
                    class="absolute top-0 left-0 h-full rounded-full transition-[width] duration-300 ease-out bg-[#FC3C44]"
                    :style="{ width: displayPercent + '%' }"
                />
            </div>
        </div>
        <div class="flex justify-between mt-1.5">
            <span class="text-[10px] font-mono text-white/40 tracking-tight">
                {{ formatTime(currentTime) }}
            </span>
            <span class="text-[10px] font-mono text-white/40 tracking-tight">
                {{ formatTime(songDuration) }}
            </span>
        </div>
    </div>
</template>
