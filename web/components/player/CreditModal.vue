<script setup lang="ts">
import type { Song } from "@/types/types";

defineProps<{
    isOpen: boolean;
    currentSong: Song & { displayArtist?: string };
    ALBUM_GOOGLE_LINK_BASE: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
}>();
</script>

<template>
    <div id="credit-modal-container" :class="{ hidden: !isOpen }">
        <div id="credit-modal-mask" class="modal-mask" @click="emit('close')" />
        <div
            id="credit-modal-content"
            class="modal-mutual bg-[#2c4f3d] left-[10%] top-1/5 w-4/5 md:left-[30%] md:w-2/5"
        >
            <div class="flex flex-row">
                <span class="modal-name">工作人員名單</span>
                <div class="grow" />
                <span
                    class="close"
                    title="關閉"
                    aria-label="關閉視窗"
                    @click="emit('close')"
                    >&times;</span
                >
            </div>

            <div id="artist-banner" class="text-center">
                <span>演出藝人</span>
                <div class="text-2xl font-bold">
                    {{ currentSong.displayArtist || "未知的藝人" }}
                </div>
            </div>

            <hr class="m-4" />

            <div class="text-center items-center mr-2 mb-2">
                <span>收錄專輯：</span>
                <div
                    class="p-1.5 md:p-2 rounded-xl font-poppins underline md:no-underline md:hover:underline text-sm text-wrap bg-[#2cc3b9]"
                >
                    <a
                        v-if="currentSong.album?.link !== undefined"
                        :href="ALBUM_GOOGLE_LINK_BASE + currentSong.album.link"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{
                            currentSong.album
                                ? currentSong.album.name
                                : currentSong.title + " - 單曲"
                        }}
                    </a>
                    <span v-else>
                        {{
                            currentSong.album
                                ? currentSong.album.name
                                : currentSong.title + " - 單曲"
                        }}
                    </span>
                </div>
            </div>

            <div
                v-if="currentSong.credits"
                class="pr-4 custom-scrollbar whitespace-pre-wrap grid grid-row-3 md:grid-cols-3 gap-y-6 overflow-y-scroll max-h-70 font-poppins"
            >
                <template v-if="currentSong.credits.performance">
                    <div class="credit-list-contribution-type-name">表演者</div>
                    <div
                        v-for="(c, i) in currentSong.credits.performance"
                        :key="`perf-${i}`"
                        class="flex flex-col gap-2 text-center"
                    >
                        <div class="text-xl font-bold">{{ c.name }}</div>
                        <span class="text-slate-300">{{
                            c.contribution?.join("、")
                        }}</span>
                    </div>
                </template>

                <template v-if="currentSong.credits.song_writing">
                    <div class="credit-list-contribution-type-name">詞曲</div>
                    <div
                        v-for="(c, i) in currentSong.credits.song_writing"
                        :key="`sw-${i}`"
                        class="flex flex-col gap-2 text-center"
                    >
                        <div class="text-xl font-bold">{{ c.name }}</div>
                        <span class="text-slate-300">{{
                            c.contribution?.join("、")
                        }}</span>
                    </div>
                </template>

                <template v-if="currentSong.credits.engineering">
                    <div class="credit-list-contribution-type-name">
                        製作與工程團隊
                    </div>
                    <div
                        v-for="(c, i) in currentSong.credits.engineering"
                        :key="`eng-${i}`"
                        class="flex flex-col gap-2 text-center"
                    >
                        <div class="text-xl font-bold">{{ c.name }}</div>
                        <span class="text-slate-300">{{
                            c.contribution?.join("、")
                        }}</span>
                    </div>
                </template>
            </div>

            <hr class="mt-4" />
            <span class="text-xs text-gray-400"
                >工作人員名單僅供參考，本站並不保證該名單 100%
                正確或樂曲之製作必然為本工作人員名單所提供的分工。</span
            >
        </div>
    </div>
</template>
