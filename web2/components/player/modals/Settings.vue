<script setup lang="ts">
import colorOptions from "@/composables/colorOptions.json";
</script>

<template>
    <!-- 設定 -->
    <div id="setting-modal-container" class="hidden">
        <div id="setting-modal-mask" class="modal-mask"></div>
        <!-- Modal content -->
        <div
            id="setting-modal-content"
            class="modal-mutual bg-[#455a47] top-2/5 left-[10%] w-4/5 md:left-[30%] md:top-[30%] md:w-2/5"
        >
            <div class="flex flex-row">
                <span class="modal-name">設定</span>
                <div class="grow"></div>
                <span
                    class="close"
                    id="setting-modal-close-btn"
                    title="關閉"
                    aria-label="關閉視窗"
                    >&times;</span
                >
            </div>

            <div class="modal-view-area custom-scrollbar">
                <div
                    id="change-body-background-container"
                    class="settings-entry"
                >
                    <label id="change-body-background">背景顏色：</label>
                    <div
                        id="change-body-background"
                        class="color-picker inline-block"
                    >
                        <details class="dropdown relative">
                            <summary
                                class="dropdown-trigger flex items-center gap-2 p-2 px-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                            >
                                <span
                                    class="color-preview w-5 h-5 border border-gray-200 rounded-sm"
                                    :style="{
                                        backgroundColor: bodyBackgroundColor,
                                    }"
                                ></span>
                                <span class="text-sm font-mono">{{
                                    bgColorName
                                }}</span>
                            </summary>
                            <div
                                class="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-md z-50 p-2 w-max"
                            >
                                <div class="color-grid grid grid-cols-5 gap-1">
                                    <button
                                        v-for="(
                                            colorObj, index
                                        ) in colorOptions"
                                        :key="index"
                                        type="button"
                                        class="color-square w-7 h-7 border border-gray-200 rounded cursor-pointer duration-200 transition-transform hover:scale-110 focus:outline-none"
                                        :class="{
                                            'border-2 border-gray-800 ring-1 ring-gray-300':
                                                bodyBackgroundColor ===
                                                colorObj.color,
                                        }"
                                        :style="{
                                            backgroundColor: colorObj.color,
                                        }"
                                        @click="
                                            bodyBackgroundColor = colorObj.color
                                        "
                                        :title="color"
                                        :aria-label="color"
                                    ></button>
                                </div>
                            </div>
                        </details>
                    </div>
                    <br />
                </div>
                <div id="enable-background-container" class="settings-entry">
                    <label class="switch mr-2">
                        <input
                            type="checkbox"
                            id="enable-background"
                            v-model="enableLyricBackground"
                        />
                        <span class="slider round"></span>
                    </label>
                    <label id="enable-background">開啟歌詞背景</label><br />
                </div>
                <div
                    id="enable-scroll-to-current-line-container"
                    class="settings-entry"
                >
                    <label class="switch mr-1">
                        <input
                            type="checkbox"
                            id="enable-scroll-to-current-line"
                            v-model="scrollToCurrentLine"
                        />
                        <span class="slider round"></span>
                    </label>
                    <label id="enable-scroll-to-current-line"
                        >自動滾動到當前行</label
                    ><br />
                </div>
                <div id="enable-translation-container" class="settings-entry">
                    <label class="switch mr-2">
                        <input
                            type="checkbox"
                            id="enable-translation"
                            v-model="enableTranslation"
                        />
                        <span class="slider round"></span>
                    </label>
                    <label id="enable-translation">開啟翻譯</label><br />
                </div>
                <div
                    id="enable-pronounciation-container"
                    class="settings-entry"
                >
                    <label class="switch mr-2">
                        <input
                            type="checkbox"
                            id="enable-pronounciation"
                            :disabled="!currentSong.furigana"
                            v-model="enablePronounciation"
                        />
                        <span class="slider round"></span>
                    </label>
                    <label id="enable-pronounciation"
                        >顯示假名讀音（僅部分歌曲可用）</label
                    ><br />
                </div>
            </div>
        </div>
    </div>
</template>
