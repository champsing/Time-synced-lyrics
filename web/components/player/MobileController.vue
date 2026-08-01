<script setup lang="ts">
import type { SongWithDisplay } from "@/types/player";
import { computed, onMounted, onUnmounted, ref } from "vue";

import {
    INSTRUMENTAL,
    LIVE,
    ORIGINAL,
    THE_FIRST_TAKE,
} from "@/composables/utils/config";
import { formatTime } from "@/composables/utils/global";

import YTPlayer from "@components/player/YTPlayer.vue";

// ── Props ────────────────────────────────────────────────────────────────
const props = defineProps<{
    currentSong: SongWithDisplay;
    songVersion: string | null;
    currentTime: number;
    songDuration: number;
    displayPercent: number;
    isDragging: boolean;
    isHoveringProgress: boolean;
    isPaused: boolean;
    volume: number;
    isMuted: boolean;
    isDraggingVolume: boolean;
    isHoveringVolume: boolean;
    currentVideoId: string | null;
    mobilePanelCollapsed: boolean;
}>();

// ── Emits ────────────────────────────────────────────────────────────────
const emit = defineEmits<{
    (e: "play"): void;
    (e: "pause"): void;
    (e: "rewind"): void;
    (e: "forward"): void;
    (e: "toggleMute"): void;
    (e: "volumeMouseDown", event: MouseEvent): void;
    (e: "volumeTouchStart", event: TouchEvent): void;
    (e: "barMouseDown", event: MouseEvent): void;
    (e: "barTouchStart", event: TouchEvent): void;
    (e: "update:isHoveringProgress", value: boolean): void;
    (e: "update:isHoveringVolume", value: boolean): void;
    (e: "update:mobilePanelCollapsed", value: boolean): void;
    (e: "update:currentTime", value: number): void;
    (e: "update:isPaused", value: boolean): void;
    (e: "update:songDuration", value: number): void;
    (e: "update:panelHeight", value: number): void;
    (e: "openShare"): void;
    (e: "openSetting"): void;
    (e: "openCredit"): void;
}>();

// ── Computed ─────────────────────────────────────────────────────────────
const formattedCurrentTime = computed(() => formatTime(props.currentTime));
const formattedSongDuration = computed(() => formatTime(props.songDuration));

// ── Panel height observer ───────────────────────────────────────────────
const panelRef = ref<HTMLElement | null>(null);

onMounted(() => {
    if (panelRef.value) {
        const observer = new ResizeObserver((entries) => {
            const height = entries[0]?.contentRect.height;
            if (height) emit("update:panelHeight", height);
        });
        observer.observe(panelRef.value);
        onUnmounted(() => observer.disconnect());
    }
});
</script>

<template>
    <section
        ref="panelRef"
        class="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-3 transition-all duration-300"
    >
        <div
            class="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
            <!-- 可收合區塊：歌曲資訊 -->
            <div :class="{ hidden: mobilePanelCollapsed }">
                <div class="px-5 pt-4 pb-3 flex items-start justify-between">
                    <div class="flex-1 min-w-0 mr-3">
                        <h2
                            class="text-white text-base font-bold truncate tracking-tight"
                        >
                            {{ currentSong.title || currentSong.folder }}
                        </h2>
                        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                            <button
                                v-if="currentSong.credits"
                                @click="emit('openCredit')"
                                class="text-white/50 hover:text-white text-xs transition-colors truncate"
                            >
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </button>
                            <span v-else class="text-white/40 text-xs truncate">
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </span>
                            <span
                                v-if="songVersion !== ORIGINAL"
                                class="px-1.5 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider"
                                :class="{
                                    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30':
                                        songVersion === INSTRUMENTAL,
                                    'bg-white/10 text-white border-white/20':
                                        songVersion === THE_FIRST_TAKE,
                                    'bg-rose-500/20 text-rose-400 border-rose-500/30':
                                        songVersion === LIVE,
                                }"
                            >
                                {{
                                    songVersion === INSTRUMENTAL
                                        ? "Inst."
                                        : songVersion === THE_FIRST_TAKE
                                          ? "TFT"
                                          : songVersion === LIVE
                                            ? "Live"
                                            : songVersion
                                }}
                            </span>
                        </div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button
                            @click="emit('openShare')"
                            class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                            aria-label="分享"
                        >
                            <span class="material-icons text-lg">share</span>
                        </button>
                        <button
                            @click="emit('openSetting')"
                            class="p-1.5 text-white/50 hover:text-white rounded-full transition-colors"
                            aria-label="設定"
                        >
                            <span class="material-icons text-lg">settings</span>
                        </button>
                    </div>
                </div>

                <!-- YTPlayer（手機版隱藏，僅供音源） -->
                <div
                    class="w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
                >
                    <YTPlayer
                        v-if="currentVideoId"
                        :video-id="currentVideoId"
                        @update:current-time="
                            emit('update:currentTime', $event)
                        "
                        @update:is-paused="emit('update:isPaused', $event)"
                        @update:song-duration="
                            emit('update:songDuration', $event)
                        "
                    />
                </div>
            </div>

            <!-- 永遠顯示：進度條 + 控制按鈕 -->
            <div
                :class="{
                    'px-5': true,
                    'pb-2': mobilePanelCollapsed,
                }"
            >
                <!-- 進度條（手機版） -->
                <div
                    class="relative w-full cursor-pointer mb-3 py-2 -my-2"
                    :class="{ 'mt-3': mobilePanelCollapsed }"
                    @mousedown="emit('barMouseDown', $event)"
                    @touchstart.prevent="emit('barTouchStart', $event)"
                    @mouseenter="emit('update:isHoveringProgress', true)"
                    @mouseleave="emit('update:isHoveringProgress', false)"
                >
                    <div
                        class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out"
                        :class="{
                            'h-1': !isHoveringProgress && !isDragging,
                            'h-1.5': isHoveringProgress && !isDragging,
                            'h-4': isDragging,
                        }"
                        style="background-color: rgba(255, 255, 255, 0.12)"
                    >
                        <div
                            class="absolute top-0 left-0 h-full rounded-full transition-[width] duration-300 ease-out bg-[#FC3C44]"
                            :style="{ width: displayPercent + '%' }"
                        />
                    </div>
                </div>

                <!-- 時間標籤 -->
                <div class="flex justify-between -mt-1 mb-2">
                    <span
                        class="text-[9px] font-mono text-white/35 tracking-tight"
                    >
                        {{ formattedCurrentTime }}
                    </span>
                    <span
                        class="text-[9px] font-mono text-white/35 tracking-tight"
                    >
                        {{ formattedSongDuration }}
                    </span>
                </div>

                <!-- 播放控制 + 收合按鈕 -->
                <div class="flex items-center pb-3">
                    <div class="flex-1" />
                    <div class="flex items-center gap-5">
                        <button
                            @click="emit('rewind')"
                            class="w-10 h-10 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                            aria-label="倒轉 10 秒"
                        >
                            <span
                                class="material-icons text-[28px] leading-none"
                                >replay_10</span
                            >
                        </button>

                        <button
                            @click="isPaused ? emit('play') : emit('pause')"
                            class="flex items-center justify-center w-24 h-12 bg-[#FC3C44] hover:bg-[#e8353d] rounded-2xl active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/20"
                            aria-label="播放 / 暫停"
                        >
                            <span
                                class="material-icons text-[32px] text-white leading-none"
                            >
                                {{ isPaused ? "play_arrow" : "pause" }}
                            </span>
                        </button>

                        <button
                            @click="emit('forward')"
                            class="w-10 h-10 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                            aria-label="快轉 10 秒"
                        >
                            <span
                                class="material-icons text-[28px] leading-none"
                                >forward_10</span
                            >
                        </button>
                    </div>
                    <div class="flex-1 flex justify-end">
                        <button
                            @click="
                                emit(
                                    'update:mobilePanelCollapsed',
                                    !mobilePanelCollapsed,
                                )
                            "
                            class="text-white/40 hover:text-white/80 transition-colors"
                            aria-label="展開/收合"
                        >
                            <span
                                class="material-icons transition-transform duration-300"
                                :class="{
                                    'rotate-180': mobilePanelCollapsed,
                                }"
                                >expand_more</span
                            >
                        </button>
                    </div>
                </div>

                <!-- 音量控制列 -->
                <div class="flex items-center gap-1.5">
                    <button
                        @click="emit('toggleMute')"
                        class="text-white/50 hover:text-white transition-colors shrink-0"
                        aria-label="靜音切換"
                    >
                        <span class="material-icons text-lg">
                            {{
                                volume === 0 || isMuted
                                    ? "volume_off"
                                    : "volume_up"
                            }}
                        </span>
                    </button>
                    <div
                        class="relative flex-1 cursor-pointer py-2 -my-2"
                        @mousedown="emit('volumeMouseDown', $event)"
                        @touchstart.prevent="emit('volumeTouchStart', $event)"
                        @mouseenter="emit('update:isHoveringVolume', true)"
                        @mouseleave="emit('update:isHoveringVolume', false)"
                    >
                        <div
                            class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 ease-out"
                            :class="{
                                'h-1': !isHoveringVolume && !isDraggingVolume,
                                'h-1.5': isHoveringVolume && !isDraggingVolume,
                                'h-4': isDraggingVolume,
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
            </div>
        </div>
    </section>
</template>
