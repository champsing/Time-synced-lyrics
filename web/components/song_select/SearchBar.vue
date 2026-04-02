<script setup lang="ts">
import { SORT_LABELS, SORT_OPTIONS } from "@/composables/hooks/useSongSelect";
import type { Color, SortOption } from "@/types/song_select";

defineProps<{
    searchQuery: string;
    sortOption: SortOption;
    showSortOptions: boolean;
    showColorPicker: boolean;
    colorOptions: Color[];
    bodyBackgroundColor: string;
    bgColorName: string;
}>();

const emit = defineEmits<{
    (e: "update:searchQuery", val: string): void;
    (e: "update:sortOption", val: SortOption): void;
    (e: "update:showSortOptions", val: boolean): void;
    (e: "update:showColorPicker", val: boolean): void;
    (e: "update:bodyBackgroundColor", val: string): void;
    (e: "refresh"): void;
}>();
</script>

<template>
    <div class="flex flex-col fixed bottom-5 w-full px-5 left-0 sm:px-0 z-50">
        <!-- 重新整理按鈕 -->
        <div class="flex flex-row mb-4">
            <div class="grow" />
            <button
                @click="emit('refresh')"
                class="select-none px-5 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-cyan-700 to-teal-700 shadow-lg flex items-center gap-2 hover:from-cyan-400 hover:to-teal-400 hover:scale-105 active:scale-95 transition-all duration-200"
            >
                <span class="material-icons text-white text-xl">refresh</span>
                重新整理歌曲
            </button>
            <div class="grow" />
        </div>

        <!-- 搜尋列 -->
        <div class="flex flex-row">
            <div class="hidden sm:block grow" />
            <div
                class="container py-4 bg-gray-300/20 backdrop-blur-lg rounded-2xl w-full sm:w-1/2"
            >
                <div
                    class="flex sm:flex-row gap-3 p-3 mx-5 rounded-2xl shadow-inner"
                >
                    <!-- 搜尋輸入 -->
                    <div class="flex-1 bg-white/10 p-2 rounded-xl">
                        <input
                            :value="searchQuery"
                            @input="
                                emit(
                                    'update:searchQuery',
                                    ($event.target as HTMLInputElement).value,
                                )
                            "
                            type="text"
                            placeholder="搜尋歌曲、藝人或專輯..."
                            class="w-full p-2 bg-transparent border-none text-lg focus:ring-0 placeholder-gray-600 text-white outline-none"
                        />
                    </div>

                    <!-- 排序 -->
                    <div
                        class="bg-white/10 p-2 rounded-xl relative"
                        tabindex="0"
                        @click.stop="
                            emit('update:showSortOptions', !showSortOptions)
                        "
                        @blur="emit('update:showSortOptions', false)"
                    >
                        <div
                            class="flex items-center justify-between cursor-pointer text-gray-300 select-none"
                        >
                            <span class="material-icons p-2">filter_list</span>
                            <span class="bg-black rounded-2xl px-1">
                                {{
                                    String.fromCodePoint(
                                        SORT_LABELS[sortOption].codePointAt(0)!,
                                    )
                                }}
                            </span>
                            <div class="hidden sm:flex">
                                <span
                                    class="material-icons transform transition-transform duration-200"
                                    :class="{ 'rotate-180': !showSortOptions }"
                                    >expand_more</span
                                >
                            </div>
                        </div>
                        <Transition name="fade">
                            <div
                                v-if="showSortOptions"
                                class="min-w-45 absolute -left-15 right-0 sm:-left-5 mb-2 bottom-full bg-[#2d4a4d] rounded-lg shadow-xl z-50 select-none"
                            >
                                <div
                                    class="p-2 space-y-2 max-h-60 overflow-y-auto"
                                >
                                    <div
                                        v-for="option in SORT_OPTIONS"
                                        :key="option"
                                        class="px-4 py-2 rounded-md cursor-pointer hover:bg-[#3a5d5f] transition-colors text-white"
                                        :class="{
                                            'bg-[#3a5d5f]':
                                                sortOption === option,
                                        }"
                                        @click.stop="
                                            emit('update:sortOption', option)
                                        "
                                    >
                                        {{ SORT_LABELS[option] }}
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <!-- 顏色選擇器 -->
                    <div
                        class="bg-white/10 p-2 rounded-xl relative focus:outline-none"
                        tabindex="0"
                        @click.stop="
                            emit('update:showColorPicker', !showColorPicker)
                        "
                        @blur="emit('update:showColorPicker', false)"
                    >
                        <div
                            class="mt-2 flex items-center justify-between cursor-pointer text-gray-300 select-none space-x-2"
                        >
                            <div class="flex items-center space-x-2 px-1">
                                <span
                                    class="w-5 h-5 border border-white/30 rounded-full shadow-sm block"
                                    :style="{
                                        backgroundColor: bodyBackgroundColor,
                                    }"
                                />
                                <span
                                    class="text-sm font-medium hidden md:inline-block"
                                    >{{ bgColorName }}</span
                                >
                            </div>
                            <span
                                class="material-icons text-sm opacity-50 transform transition-transform duration-200"
                                :class="{ 'rotate-180': showColorPicker }"
                                >expand_less</span
                            >
                        </div>
                        <Transition name="fade">
                            <div
                                v-if="showColorPicker"
                                class="min-w-50 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#2d4a4d] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 select-none"
                            >
                                <div
                                    class="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2 px-1"
                                >
                                    主題色彩設定
                                </div>
                                <div class="grid grid-cols-5 gap-2">
                                    <button
                                        v-for="colorObj in colorOptions"
                                        :key="colorObj.color"
                                        type="button"
                                        class="w-8 h-8 rounded-lg cursor-pointer duration-200 transition-all hover:scale-125 focus:outline-none border-2"
                                        :class="{
                                            'border-white scale-110 shadow-lg':
                                                bodyBackgroundColor ===
                                                colorObj.color,
                                            'border-transparent':
                                                bodyBackgroundColor !==
                                                colorObj.color,
                                        }"
                                        :style="{
                                            backgroundColor: colorObj.color,
                                        }"
                                        :title="colorObj.name"
                                        @click.stop="
                                            emit(
                                                'update:bodyBackgroundColor',
                                                colorObj.color,
                                            )
                                        "
                                    />
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>
            <div class="hidden sm:block grow" />
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.15s,
        transform 0.15s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}
</style>
