<script setup lang="ts">
import type { Song } from "@/types/types";
import YTPlayer from "./YTPlayer.vue";

defineProps<{
    currentSong: Song & { displayArtist?: string };
    songVersion: string | null;
    videoID: string | null; // 新增：由父層從 currentSong.versions 解析後傳入
    isPaused: boolean;
    isMuted: boolean;
    volume: number;
    formattedCurrentTime: string;
    formattedSongDuration: string;
    ORIGINAL: string;
    INSTRUMENTAL: string;
    THE_FIRST_TAKE: string;
    LIVE: string;
    parseSubtitle: (subtitle: string) => string;
}>();

const emit = defineEmits<{
    (e: "play"): void;
    (e: "pause"): void;
    (e: "rewind"): void;
    (e: "forward"): void;
    (e: "toggle-mute"): void;
    (e: "change-volume", value: number): void;
    // 新增：從 YTPlayer 往上透傳
    (e: "update:currentTime", value: number): void;
    (e: "update:isPaused", value: boolean): void;
    (e: "update:songDuration", value: number): void;
}>();
</script>


<template>
    <section
        class="fixed bottom-0 right-0 w-full md:w-100 p-4 md:pl-0 z-50 transition-all duration-300"
    >
        <!-- 桌面收合按鈕 -->
        <div class="hidden md:flex justify-end mb-2">
            <button
                id="controller-panel-switch-md"
                class="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg border border-white/10"
                title="顯示/隱藏介面"
            >
                <span
                    class="material-icons block transition-transform duration-300"
                    id="controller-panel-switch-icon-md"
                    >expand_more</span
                >
            </button>
        </div>

        <!-- 主面板 -->
        <div
            id="controller-panel"
            class="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-2xl overflow-hidden transition-all"
        >
            <!-- 歌曲資訊區塊 -->
            <div class="p-5 pb-1 flex flex-col gap-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex gap-2">
                            <h2
                                class="text-white text-xl md:text-2xl font-bold truncate tracking-tight"
                            >
                                {{ currentSong.title || currentSong.folder }}
                            </h2>
                            <!-- 版本徽章區 -->
                            <div
                                v-if="songVersion !== ORIGINAL"
                                class="md:hidden flex flex-wrap gap-2"
                            >
                                <span
                                    v-if="songVersion == INSTRUMENTAL"
                                    class="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/30 uppercase tracking-wider"
                                    >Instrumental</span
                                >
                                <span
                                    v-if="songVersion == THE_FIRST_TAKE"
                                    class="px-2 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded-md border border-white/20 uppercase tracking-wider"
                                    >The First Take</span
                                >
                                <span
                                    v-if="songVersion == LIVE"
                                    class="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-md border border-rose-500/30 uppercase tracking-wider"
                                    >Live</span
                                >
                            </div>
                        </div>

                        <div class="flex items-center gap-2 mt-1">
                            <button
                                v-if="currentSong.credits"
                                id="credit-btn"
                                class="text-white/60 hover:text-white text-sm transition-colors truncate underline underline-offset-4 md:no-underline"
                            >
                                {{ currentSong.displayArtist || "未知藝人" }}
                            </button>
                            <span
                                v-else
                                class="text-white/40 text-sm truncate underline underline-offset-4 md:no-underline"
                                >{{
                                    currentSong.displayArtist || "未知藝人"
                                }}</span
                            >
                            <span class="text-white/20 text-xs">•</span>
                            <span class="text-white/40 text-xs truncate">{{
                                currentSong.album?.name || "單曲"
                            }}</span>
                        </div>
                    </div>

                    <!-- 快速動作按鈕 -->
                    <div class="flex gap-1 ml-2">
                        <button
                            id="share-btn"
                            class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <span class="material-icons text-xl">share</span>
                        </button>
                        <button
                            id="setting-btn"
                            class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <span class="material-icons text-xl">settings</span>
                        </button>
                    </div>
                </div>

                <!-- 副標題 -->
                <p
                    v-if="currentSong.subtitle"
                    class="text-white/40 text-xs line-clamp-2 italic"
                >
                    {{ parseSubtitle(currentSong.subtitle) }}
                </p>

                <!-- YT Player：有 videoID 才渲染 -->
                <YTPlayer
                    v-if="videoID"
                    :video-id="videoID"
                    :current-song="currentSong"
                    :song-version="songVersion"
                    @update:current-time="emit('update:currentTime', $event)"
                    @update:is-paused="emit('update:isPaused', $event)"
                    @update:song-duration="emit('update:songDuration', $event)"
                />
            </div>

            <!-- 播放控制區 -->
            <div class="px-5 pb-4 flex flex-col gap-5">
                <!-- 進度條與時間 -->
                <div class="flex flex-col gap-2">
                    <div
                        class="hidden md:flex justify-between items-center px-1"
                    >
                        <span
                            class="text-[10px] font-mono text-white/40 tracking-tighter"
                            >{{ formattedCurrentTime }}</span
                        >
                        <!-- 版本徽章區 -->
                        <div
                            v-if="songVersion !== ORIGINAL"
                            class="flex flex-wrap gap-2"
                        >
                            <span
                                v-if="songVersion == INSTRUMENTAL"
                                class="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/30 uppercase tracking-wider"
                                >Instrumental</span
                            >
                            <span
                                v-if="songVersion == THE_FIRST_TAKE"
                                class="px-2 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded-md border border-white/20 uppercase tracking-wider"
                                >The First Take</span
                            >
                            <span
                                v-if="songVersion == LIVE"
                                class="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-md border border-rose-500/30 uppercase tracking-wider"
                                >Live</span
                            >
                        </div>
                        <span
                            class="text-[10px] font-mono text-white/40 tracking-tighter"
                            >{{ formattedSongDuration }}</span
                        >
                    </div>
                    <div
                        class="md:hidden flex justify-between items-center px-1"
                    >
                        <span
                            class="text-[10px] font-mono text-white/40 tracking-tighter"
                        >
                            {{ formattedCurrentTime }} /
                            {{ formattedSongDuration }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div
            id="controller-panel"
            class="p-4 mt-2 bg-[#1a1a1a]/80 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-2xl overflow-hidden transition-all"
        >
            <!-- 主控制按鈕組 -->
            <div class="flex items-center justify-between">
                <!-- 音量控制 (簡化) -->
                <div class="group relative flex items-center">
                    <button
                        @click="emit('toggle-mute')"
                        class="text-white/60 hover:text-white transition-colors"
                    >
                        <span class="material-icons">{{
                            volume == 0 || isMuted ? "volume_off" : "volume_up"
                        }}</span>
                    </button>

                    <div
                        class="hidden md:flex ml-2 w-0 overflow-hidden group-hover:w-40 transition-all duration-300 ease-out items-center"
                    >
                        <input
                            type="range"
                            min="0"
                            max="100"
                            :value="volume"
                            class="w-full h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer py-3 mx-2"
                            @input="
                                emit(
                                    'change-volume',
                                    Number(
                                        ($event.target as HTMLInputElement)
                                            .value,
                                    ),
                                )
                            "
                        />
                        <span class="p-1">{{ volume || 70 }}</span>
                    </div>
                </div>

                <!-- 播放核心按鈕 -->
                <div class="flex items-center gap-10">
                    <button
                        @click="emit('rewind')"
                        class="text-white/60 hover:text-white transition-all transform active:scale-90"
                    >
                        <span class="material-icons text-2xl">replay_10</span>
                    </button>

                    <button
                        @click="isPaused ? emit('play') : emit('pause')"
                        class="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                    >
                        <span class="material-icons text-4xl">{{
                            isPaused ? "play_arrow" : "pause"
                        }}</span>
                    </button>

                    <button
                        @click="emit('forward')"
                        class="text-white/60 hover:text-white transition-all transform active:scale-90"
                    >
                        <span class="material-icons text-2xl">forward_10</span>
                    </button>
                </div>

                <!-- 額外功能: 關於 (原本隱藏在設定中，現在可以放在這) -->
                <button
                    id="about-btn"
                    class="text-white/40 hover:text-white/80 transition-colors"
                >
                    <span class="material-icons">info</span>
                </button>
            </div>
            <!-- 手機版音量滑桿 -->
            <div
                class="flex md:hidden group-hover:w-40 transition-all duration-300 ease-out items-center mt-2"
            >
                <input
                    type="range"
                    min="0"
                    max="100"
                    :value="volume"
                    class="w-full h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer py-3 mx-2"
                    @input="
                        emit(
                            'change-volume',
                            Number(($event.target as HTMLInputElement).value),
                        )
                    "
                />
                <span class="p-1">{{ volume || 70 }}</span>
            </div>
        </div>

        <!-- 手機收合按鈕 -->
        <div class="md:hidden mt-2 flex justify-center">
            <button
                id="controller-panel-switch-below-md"
                class="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold border border-white/5"
            >
                <div class="flex items-center gap-1">
                    <span
                        class="material-icons text-sm"
                        id="controller-panel-switch-icon-below-md"
                        >keyboard_arrow_down</span
                    >
                    <span id="controller-panel-switch-state-below-md"
                        >CLOSE</span
                    >
                </div>
            </button>
        </div>
    </section>
</template>

