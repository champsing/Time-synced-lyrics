<script setup lang="ts">
import { SORT_LABELS, SORT_OPTIONS } from "@/composables/hooks/useSongSelect";
import type { Color, SortOption } from "@/types/song_select";
import { computed } from "vue";

const props = defineProps<{
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

const sortEmoji = computed(() =>
    String.fromCodePoint(SORT_LABELS[props.sortOption].codePointAt(0)!),
);
</script>

<template>
    <div class="flex flex-col fixed bottom-5 w-full px-4 left-0 sm:px-0 z-50">
        <!-- 重新整理按鈕 -->
        <div class="flex flex-row mb-4">
            <div class="grow" />
            <button
                @click="emit('refresh')"
                class="group select-none px-5 py-2.5 rounded-full font-medium text-white/80 text-sm bg-white/10 border border-white/15 backdrop-blur-md shadow-lg flex items-center gap-2 hover:bg-white/20 hover:border-white/30 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
            >
                <span
                    class="material-icons text-lg transition-transform duration-500 group-hover:rotate-180"
                >
                    refresh
                </span>
                重新整理歌曲
            </button>
            <div class="grow" />
        </div>

        <!-- 搜尋列 -->
        <div class="flex flex-row">
            <div class="hidden sm:block grow" />
            <div
                class="container py-4 bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl w-full sm:w-1/2 shadow-2xl"
            >
                <div class="flex sm:flex-row gap-3 px-3">
                    <!-- ── 搜尋輸入 ── -->
                    <div class="flex-1 relative search-input-wrapper">
                        <span
                            class="search-icon material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xl pointer-events-none transition-colors duration-300"
                        >
                            search
                        </span>
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
                            class="w-full pl-10 pr-4 py-2.5 bg-white/[0.07] border border-white/6 rounded-xl text-white/85 placeholder-white/25 text-sm outline-none transition-all duration-300 focus:bg-white/12 focus:border-white/20 focus:placeholder-white/35"
                        />
                    </div>

                    <!-- ── 排序按鈕 ── -->
                    <div
                        class="relative"
                        tabindex="0"
                        @blur="emit('update:showSortOptions', false)"
                    >
                        <button
                            @click.stop="
                                emit(
                                    'update:showSortOptions',
                                    !showSortOptions,
                                )
                            "
                            class="flex items-center gap-1.5 px-3 py-2.5 bg-white/[0.07] border border-white/6 rounded-xl text-white/60 hover:bg-white/[0.14] hover:border-white/20 hover:text-white/85 transition-all duration-300"
                        >
                            <span class="text-base leading-none">{{
                                sortEmoji
                            }}</span>
                            <span
                                class="material-icons text-sm transition-transform duration-300"
                                :class="{ 'rotate-180': showSortOptions }"
                            >
                                expand_more
                            </span>
                        </button>

                        <Transition name="glass-drop">
                            <div
                                v-if="showSortOptions"
                                class="absolute bottom-full left-0 mb-2 min-w-48 bg-[#0c1314]/95 backdrop-blur-xl border border-white/12 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5"
                            >
                                <div
                                    class="text-[10px] text-white/25 font-semibold tracking-widest uppercase px-4 py-2"
                                >
                                    排序方式
                                </div>
                                <button
                                    v-for="option in SORT_OPTIONS"
                                    :key="option"
                                    @click.stop="
                                        emit('update:sortOption', option)
                                    "
                                    class="w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 flex items-center gap-2.5"
                                    :class="{
                                        'bg-white/8 text-white':
                                            sortOption === option,
                                        'text-white/55 hover:bg-white/4 hover:text-white/80':
                                            sortOption !== option,
                                    }"
                                >
                                    <span
                                        class="material-icons text-base"
                                        :class="{
                                            'text-white/80':
                                                sortOption === option,
                                            'text-white/20':
                                                sortOption !== option,
                                        }"
                                    >
                                        {{
                                            sortOption === option
                                                ? "check"
                                                : "radio_button_unchecked"
                                        }}
                                    </span>
                                    {{ SORT_LABELS[option] }}
                                </button>
                            </div>
                        </Transition>
                    </div>

                    <!-- ── 顏色選擇器 ── -->
                    <div
                        class="relative"
                        tabindex="0"
                        @blur="emit('update:showColorPicker', false)"
                    >
                        <button
                            @click.stop="
                                emit(
                                    'update:showColorPicker',
                                    !showColorPicker,
                                )
                            "
                            class="flex items-center gap-2 px-3 py-2.5 bg-white/[0.07] border border-white/6 rounded-xl text-white/60 hover:bg-white/[0.14] hover:border-white/20 hover:text-white/85 transition-all duration-300"
                        >
                            <span
                                class="w-5 h-5 rounded-full border shadow-md shrink-0 transition-shadow duration-300"
                                :class="{
                                    'border-white/40 shadow-white/10':
                                        !showColorPicker,
                                    'border-white/60 shadow-white/20':
                                        showColorPicker,
                                }"
                                :style="{
                                    backgroundColor: bodyBackgroundColor,
                                }"
                            />
                            <span
                                class="text-sm font-medium hidden md:inline-block"
                            >
                                {{ bgColorName }}
                            </span>
                            <span
                                class="material-icons text-sm transition-transform duration-300"
                                :class="{ 'rotate-180': showColorPicker }"
                            >
                                expand_less
                            </span>
                        </button>

                        <Transition name="glass-drop">
                            <div
                                v-if="showColorPicker"
                                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0c1314]/95 backdrop-blur-xl border border-white/12 rounded-2xl shadow-2xl z-50 p-4 min-w-52"
                            >
                                <div
                                    class="text-[10px] text-white/25 font-semibold tracking-widest uppercase mb-3 px-1"
                                >
                                    主題色彩設定
                                </div>
                                <div class="grid grid-cols-5 gap-2.5">
                                    <button
                                        v-for="colorObj in colorOptions"
                                        :key="colorObj.color"
                                        type="button"
                                        class="w-9 h-9 rounded-lg cursor-pointer transition-all duration-200 hover:scale-115 focus:outline-none border-2"
                                        :class="{
                                            'border-white scale-110 shadow-lg ring-1 ring-white/15':
                                                bodyBackgroundColor ===
                                                colorObj.color,
                                            'border-transparent hover:border-white/25':
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
/* ── 搜尋框 focus 時點亮搜尋圖示 ── */
.search-input-wrapper:focus-within .search-icon {
    color: rgb(255 255 255 / 0.5);
}

/* ── 下拉選單過渡動畫 ── */
.glass-drop-enter-active,
.glass-drop-leave-active {
    transition:
        opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-drop-enter-from,
.glass-drop-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
}
</style>
