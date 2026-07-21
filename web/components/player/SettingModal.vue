<script setup lang="ts">
const props = defineProps<{
    isOpen: boolean;
    enableLyricBackground: boolean;
    scrollToCurrentLine: boolean;
    enableTranslation: boolean;
    enablePronounciation: boolean;
    furiganaAvailable: boolean | null;
    lyricFontSize: number;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "update:enableLyricBackground", val: boolean): void;
    (e: "update:scrollToCurrentLine", val: boolean): void;
    (e: "update:enableTranslation", val: boolean): void;
    (e: "update:enablePronounciation", val: boolean): void;
    (e: "update:lyricFontSize", val: number): void;
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
                    class="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh] md:max-h-[85vh]"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0"
                    >
                        <h2
                            class="text-lg font-bold text-white/90 tracking-tight"
                        >
                            設定
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

                    <!-- Scrollable body -->
                    <div
                        class="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar"
                    >
                        <!-- 歌詞字型大小 -->
                        <div
                            class="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5"
                        >
                            <div
                                class="flex items-center justify-between w-full"
                            >
                                <label class="text-sm font-medium text-white/80"
                                    >歌詞字型大小</label
                                >
                                <span
                                    class="text-xs font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded-full"
                                >
                                    {{ lyricFontSize }}px
                                </span>
                            </div>
                            <div class="flex items-center gap-3 w-full">
                                <span class="text-xs text-white/40">16px</span>
                                <input
                                    type="range"
                                    min="16"
                                    max="40"
                                    :value="lyricFontSize"
                                    class="flex-1 h-1.5 bg-white/10 rounded-full appearance-none accent-teal-400 cursor-pointer"
                                    @input="
                                        emit(
                                            'update:lyricFontSize',
                                            Number(
                                                ($event.target as HTMLInputElement)
                                                    .value,
                                            ),
                                        )
                                    "
                                />
                                <span class="text-xs text-white/40">40px</span>
                            </div>
                            <!-- Preview -->
                            <div
                                class="py-2 px-4 bg-black/20 rounded-lg w-full text-center"
                            >
                                <span
                                    class="text-white/70 transition-all duration-150"
                                    :style="{ fontSize: lyricFontSize + 'px' }"
                                >
                                    歌詞預覽 Aa
                                </span>
                            </div>
                        </div>

                        <!-- Toggles -->
                        <div
                            class="flex flex-col divide-y divide-white/5 rounded-2xl bg-white/5 border border-white/5 overflow-hidden"
                        >
                            <!-- 歌詞背景 -->
                            <label
                                class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <span class="text-sm text-white/80"
                                    >開啟歌詞背景</span
                                >
                                <div class="switch">
                                    <input
                                        type="checkbox"
                                        :checked="enableLyricBackground"
                                        @change="
                                            emit(
                                                'update:enableLyricBackground',
                                                ($event.target as HTMLInputElement)
                                                    .checked,
                                            )
                                        "
                                    />
                                    <span class="slider round" />
                                </div>
                            </label>

                            <!-- 自動滾動 -->
                            <label
                                class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <span class="text-sm text-white/80"
                                    >自動滾動到當前行</span
                                >
                                <div class="switch">
                                    <input
                                        type="checkbox"
                                        :checked="scrollToCurrentLine"
                                        @change="
                                            emit(
                                                'update:scrollToCurrentLine',
                                                ($event.target as HTMLInputElement)
                                                    .checked,
                                            )
                                        "
                                    />
                                    <span class="slider round" />
                                </div>
                            </label>

                            <!-- 翻譯 -->
                            <label
                                class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <span class="text-sm text-white/80"
                                    >開啟翻譯</span
                                >
                                <div class="switch">
                                    <input
                                        type="checkbox"
                                        :checked="enableTranslation"
                                        @change="
                                            emit(
                                                'update:enableTranslation',
                                                ($event.target as HTMLInputElement)
                                                    .checked,
                                            )
                                        "
                                    />
                                    <span class="slider round" />
                                </div>
                            </label>

                            <!-- 注音 -->
                            <label
                                class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <span class="text-sm text-white/80"
                                    >顯示假名讀音（僅部分歌曲可用）</span
                                >
                                <div class="switch">
                                    <input
                                        type="checkbox"
                                        :disabled="!furiganaAvailable"
                                        :checked="enablePronounciation"
                                        @change="
                                            emit(
                                                'update:enablePronounciation',
                                                ($event.target as HTMLInputElement)
                                                    .checked,
                                            )
                                        "
                                    />
                                    <span class="slider round" />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

/* Switch — compact glass style */
.switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
}
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.slider {
    position: absolute;
    inset: 0;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background: rgba(255, 255, 255, 0.5);
    transition: all 0.3s;
    border-radius: 50%;
}
input:checked + .slider {
    background: rgba(20, 184, 166, 0.5);
    border-color: rgba(20, 184, 166, 0.5);
}
input:checked + .slider:before {
    transform: translateX(18px);
    background: white;
}
input:disabled + .slider {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Animations */
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
