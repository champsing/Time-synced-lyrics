<template>
    <section
        class="fixed bottom-0 right-0 w-full md:w-[400px] p-4 md:pl-0 z-50 transition-all duration-300"
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
            <!-- 歌曲資訊 -->
            <div class="p-5 pb-1 flex flex-col gap-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <!-- 標題 + 版本徽章（手機） -->
                        <div class="flex items-center gap-2">
                            <h2
                                class="text-white text-xl md:text-2xl font-bold truncate tracking-tight"
                            >
                                {{ currentSong.title || currentSong.folder }}
                            </h2>
                            <div
                                v-if="songVersion !== ORIGINAL"
                                class="md:hidden flex flex-wrap gap-1"
                            >
                                <span
                                    v-if="songVersion === INSTRUMENTAL"
                                    class="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/30 uppercase tracking-wider"
                                    >Instrumental</span
                                >
                                <span
                                    v-if="songVersion === THE_FIRST_TAKE"
                                    class="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md border border-red-500/30 uppercase tracking-wider"
                                    >THE FIRST TAKE</span
                                >
                                <span
                                    v-if="songVersion === LIVE"
                                    class="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-md border border-purple-500/30 uppercase tracking-wider"
                                    >LIVE</span
                                >
                            </div>
                        </div>
                        <p class="text-white/60 text-sm mt-0.5 truncate">
                            {{
                                currentSong.displayArtist || currentSong.artist
                            }}
                        </p>
                    </div>

                    <!-- 分享 + 設定 -->
                    <div class="flex items-center ml-2">
                        <button
                            id="share-btn"
                            class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            aria-label="分享"
                        >
                            <span class="material-icons text-xl">share</span>
                        </button>
                        <button
                            id="setting-btn"
                            class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            aria-label="設定"
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
            </div>

            <!-- 播放控制 -->
            <div class="px-5 pb-4 flex flex-col gap-4">
                <!-- YouTube iframe + 時間列 -->
                <div class="flex flex-col gap-2">
                    <div
                        id="player"
                        class="w-0 h-0 md:w-full md:h-full bg-white/10 rounded-3xl relative group cursor-pointer"
                    />
                    <!-- 桌面版時間 + 版本徽章 -->
                    <div
                        class="hidden md:flex justify-between items-center px-1"
                    >
                        <span
                            class="text-[10px] font-mono text-white/40 tracking-tighter"
                        >
                            {{ formattedCurrentTime }}
                        </span>
                        <div
                            v-if="songVersion !== ORIGINAL"
                            class="flex flex-wrap gap-1"
                        >
                            <span
                                v-if="songVersion === INSTRUMENTAL"
                                class="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-md border border-cyan-500/30 uppercase tracking-wider"
                                >Instrumental</span
                            >
                            <span
                                v-if="songVersion === THE_FIRST_TAKE"
                                class="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md border border-red-500/30 uppercase tracking-wider"
                                >THE FIRST TAKE</span
                            >
                            <span
                                v-if="songVersion === LIVE"
                                class="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-md border border-purple-500/30 uppercase tracking-wider"
                                >LIVE</span
                            >
                        </div>
                        <span
                            class="text-[10px] font-mono text-white/40 tracking-tighter"
                        >
                            {{ formattedSongDuration }}
                        </span>
                    </div>
                </div>

                <!-- 主按鈕列 -->
                <div class="flex items-center justify-between">
                    <!-- 音量（hover 展開滑桿） -->
                    <div class="group relative flex items-center gap-1">
                        <button
                            class="text-white/60 hover:text-white transition-colors"
                            aria-label="靜音切換"
                            @click="emit('toggle-mute')"
                        >
                            <span class="material-icons">
                                {{
                                    volume === 0 || isMuted
                                        ? "volume_off"
                                        : "volume_up"
                                }}
                            </span>
                        </button>
                        <div
                            class="hidden md:flex w-0 group-hover:w-36 overflow-hidden transition-all duration-300 ease-out items-center"
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
                            <span class="text-white/60 text-xs">{{
                                volume
                            }}</span>
                        </div>
                    </div>

                    <!-- 播放核心三鍵 -->
                    <div class="flex items-center gap-6">
                        <button
                            class="text-white/60 hover:text-white transition-all active:scale-90"
                            aria-label="倒退 10 秒"
                            @click="emit('rewind')"
                        >
                            <span class="material-icons text-2xl"
                                >replay_10</span
                            >
                        </button>

                        <button
                            class="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                            :aria-label="isPaused ? '播放' : '暫停'"
                            @click="isPaused ? emit('play') : emit('pause')"
                        >
                            <span class="material-icons text-4xl">
                                {{ isPaused ? "play_arrow" : "pause" }}
                            </span>
                        </button>

                        <button
                            class="text-white/60 hover:text-white transition-all active:scale-90"
                            aria-label="快進 10 秒"
                            @click="emit('forward')"
                        >
                            <span class="material-icons text-2xl"
                                >forward_10</span
                            >
                        </button>
                    </div>

                    <!-- 關於按鈕 -->
                    <button
                        id="about-btn"
                        class="text-white/40 hover:text-white/80 transition-colors"
                        aria-label="關於"
                    >
                        <span class="material-icons">info</span>
                    </button>
                </div>

                <!-- 手機版音量滑桿 -->
                <div class="flex md:hidden items-center gap-2">
                    <span class="material-icons text-white/60 text-sm">
                        {{
                            volume === 0 || isMuted ? "volume_off" : "volume_up"
                        }}
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        :value="volume"
                        class="flex-1 h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer py-3"
                        @input="
                            emit(
                                'change-volume',
                                Number(
                                    ($event.target as HTMLInputElement).value,
                                ),
                            )
                        "
                    />
                    <span class="text-white/60 text-xs w-6 text-right">{{
                        volume
                    }}</span>
                </div>
            </div>

            <!-- 工作人員名單連結 -->
            <div class="px-5 pb-4 flex justify-center">
                <button
                    id="credit-btn"
                    class="text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                    工作人員名單
                </button>
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

<script setup lang="ts">
import type { Song } from "../../../types";

defineProps<{
    currentSong: Song & { displayArtist?: string };
    songVersion: string | null;
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
}>();
</script>
