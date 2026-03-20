<script setup lang="ts">
import type { Color } from "@/types/types";

const props = defineProps<{
    isOpen: boolean;
    bgColor: Color;
    colorOptions: Color[];
    enableLyricBackground: boolean;
    scrollToCurrentLine: boolean;
    enableTranslation: boolean;
    enablePronounciation: boolean;
    furiganaAvailable: boolean | null;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "change-bg-color", color: string): void;
    (e: "update:enableLyricBackground", val: boolean): void;
    (e: "update:scrollToCurrentLine", val: boolean): void;
    (e: "update:enableTranslation", val: boolean): void;
    (e: "update:enablePronounciation", val: boolean): void;
}>();
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen" id="setting-modal-container">
            <!-- 遮罩 -->
            <div class="modal-mask" @click="emit('close')" />

            <!-- 內容 -->
            <div
                class="modal-mutual bg-[#455a47] top-2/5 left-[10%] w-4/5 md:left-[30%] md:top-[30%] md:w-2/5"
            >
                <!-- 標題列 -->
                <div class="flex flex-row items-center">
                    <span class="modal-name">設定</span>
                    <div class="grow" />
                    <button
                        class="close"
                        title="關閉"
                        aria-label="關閉視窗"
                        @click="emit('close')"
                    >
                        &times;
                    </button>
                </div>

                <div class="modal-view-area custom-scrollbar">
                    <!-- 背景顏色 -->
                    <div class="settings-entry">
                        <label>背景顏色：</label>
                        <div class="flex flex-row gap-2 items-center mt-1">
                            <span class="flex gap-2 text-sm text-white/70">
                                <span
                                    class="color-preview w-5 h-5 border border-gray-200 rounded-sm"
                                    :style="{
                                        backgroundColor: bgColor.color,
                                    }"
                                ></span>
                                <span class="text-sm font-mono">{{
                                    bgColor.name
                                }}</span>
                            </span>
                            <details class="relative">
                                <summary
                                    class="cursor-pointer text-sm text-teal-300 underline list-none"
                                >
                                    選擇顏色
                                </summary>
                                <div
                                    class="mt-2 p-3 bg-gray-800 rounded-xl border border-white/20 flex flex-wrap gap-2 w-52 shadow-2xl"
                                >
                                    <button
                                        v-for="colorObj in colorOptions"
                                        :key="colorObj.color"
                                        class="w-7 h-7 rounded-full border-2 border-white/20 hover:scale-125 transition-transform"
                                        :style="{
                                            backgroundColor: colorObj.color,
                                        }"
                                        :title="colorObj.name"
                                        :aria-label="colorObj.name"
                                        @click="
                                            emit(
                                                'change-bg-color',
                                                colorObj.color,
                                            )
                                        "
                                    />
                                </div>
                            </details>
                        </div>
                    </div>

                    <!-- 歌詞背景 -->
                    <div class="settings-entry">
                        <label class="switch mr-2">
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
                        </label>
                        <label>開啟歌詞背景</label>
                    </div>

                    <!-- 自動滾動 -->
                    <div class="settings-entry">
                        <label class="switch mr-1">
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
                        </label>
                        <label>自動滾動到當前行</label>
                    </div>

                    <!-- 翻譯 -->
                    <div class="settings-entry">
                        <label class="switch mr-2">
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
                        </label>
                        <label>開啟翻譯</label>
                    </div>

                    <!-- 注音 -->
                    <div class="settings-entry">
                        <label class="switch mr-2">
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
                        </label>
                        <label>顯示假名讀音（僅部分歌曲可用）</label>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
