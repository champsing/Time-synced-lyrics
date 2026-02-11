<script setup lang="ts">
import { ALBUM_GOOGLE_LINK_BASE } from '@/composables/utils/config';
import type { Song } from '@/types';
const currentSong: Song = {
    title: "未知的歌曲",
    artist: "未知的藝人",
    album: {
        name: "未知的專輯",
        link: "",
    },
    credits: {
        performance: [
            {
                name: "未知的表演者",
                contribution: ["未知的表演"],
            },
        ],
        song_writing: [
            {
                name: "未知的詞曲創作者",
                contribution: ["未知的詞曲創作"],
            },
        ],
        engineering: [
            {
                name: "未知的製作與工程團隊成員",
                contribution: ["未知的製作與工程"],
            },
        ],
    },
};
</script>

<template>
                <!-- 工作人員名單 -->
                <div id="credit-modal-container" class="hidden">
                    <div id="credit-modal-mask" class="modal-mask"></div>
                    <!-- Modal content -->
                    <div
                        id="credit-modal-content"
                        class="modal-mutual bg-[#2c4f3d] left-[10%] top-1/5 w-4/5 md:left-[30%] md:w-2/5"
                    >
                        <div class="flex flex-row">
                            <span class="modal-name">工作人員名單</span>
                            <div class="grow"></div>
                            <span
                                class="close"
                                id="credit-modal-close-btn"
                                title="關閉"
                                aria-label="關閉視窗"
                                >&times;</span
                            >
                        </div>
                        <div id="artist-banner" class="text-center">
                            <span id="artist">演出藝人</span>
                            <div class="text-2xl font-bold">
                                <!-- {{ currentSong.displayArtist || "未知的藝人" }} -->

                            </div>
                        </div>

                        <hr class="m-4" />

                        <div class="text-center items-center mr-2 mb-2">
                            <span id="collection-album">收錄專輯：</span>
                            <div
                                class="inline p-1.5 md:p-2 rounded-xl font-poppins underline md:no-underline md:hover:underline text-sm text-wrap bg-[#2cc3b9]"
                            >
                                <a
                                    :href="ALBUM_GOOGLE_LINK_BASE + currentSong.album.link"
                                    v-if="currentSong.album?.link !== undefined"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="專輯名稱"
                                    aria-label="專輯名稱"
                                >
                                    {{ currentSong.album?
                                    currentSong.album?.name : currentSong.title
                                    + " - 單曲" }}
                                </a>
                                <span v-else>
                                    {{ currentSong.album? currentSong.album.name
                                    : currentSong.title + " - 單曲" }}
                                </span>
                            </div>
                        </div>

                        <div
                            class="pr-4 custom-scrollbar whitespace-pre-wrap grid grid-row-3 md:grid-cols-3 gap-y-6 overflow-y-scroll max-h-70 font-poppins"
                            v-if="currentSong.credits"
                        >
                            <!-- 演職員名單 需要可以再加 -->
                            <div
                                class="credit-list-contribution-type-name"
                                v-if="currentSong.credits.performance"
                            >
                                表演者
                            </div>
                            <div
                                :id="`performance-contributors-${index + 1}`"
                                class="flex flex-col gap-2 text-center"
                                v-for="(contributor, index) in currentSong.credits.performance"
                            >
                                <div
                                    :id="'contributor' + index"
                                    class="text-xl font-bold"
                                >
                                    {{ contributor.name }}
                                </div>
                                <span
                                    :id="'contribution' + index"
                                    class="text-slate-300"
                                >
                                    {{ contributor.contribution?.join("、") }}
                                </span>
                            </div>
                            <div
                                class="credit-list-contribution-type-name"
                                v-if="currentSong.credits.song_writing"
                            >
                                詞曲
                            </div>
                            <div
                                :id="`song-writing-contributors-${index + 1}`"
                                class="flex flex-col gap-2 text-center"
                                v-for="(contributor, index) in currentSong.credits.song_writing"
                            >
                                <div
                                    :id="'contributor' + index"
                                    class="text-xl font-bold"
                                >
                                    {{ contributor.name }}
                                </div>
                                <span
                                    :id="'contribution' + index"
                                    class="text-slate-300"
                                >
                                    {{ contributor.contribution?.join("、") }}
                                </span>
                            </div>
                            <div
                                class="credit-list-contribution-type-name"
                                v-if="currentSong.credits.engineering"
                            >
                                製作與工程團隊
                            </div>
                            <div
                                :id="`engineering-contributors-${index + 1}`"
                                class="flex flex-col gap-2 text-center"
                                v-for="(contributor, index) in currentSong.credits.engineering"
                            >
                                <div
                                    :id="'contributor' + index"
                                    class="text-xl font-bold"
                                >
                                    {{ contributor.name }}
                                </div>
                                <span
                                    :id="'contribution' + index"
                                    class="text-slate-300"
                                >
                                    {{ contributor.contribution?.join("、") }}
                                </span>
                            </div>
                        </div>

                        <hr class="mt-4" />
                        <span class="text-xs text-gray-400 text-wrap"
                            >工作人員名單僅供參考，本站並不保證該名單 100%
                            正確或樂曲之製作必然為本工作人員名單所提供的分工。</span
                        >
                    </div>
                </div>

</template>
