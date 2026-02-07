<template>


    <div id="controller-panel" class="relative w-full">
        <!-- [for debugging] show currentTime full value -->
        <!-- {{ currentTime }} -->
        <!-- [for debugging] show currentLineIndex -->
        <!-- {{ currentLineIndex }} -->
        <div
            class="flex flex-col justify-center gap-2 p-4 bg-[#443737] rounded-xl w-full"
        >
            <div class="grid grid-cols-2 gap-x-4 w-full">
                <button
                    id="setting-btn"
                    class="settings-button"
                    type="button"
                    aria-label="設定"
                    title="設定"
                >
                    <span>設定</span>
                </button>

                <button
                    id="share-btn"
                    class="share-button"
                    type="button"
                    aria-label="分享"
                    title="分享歌曲"
                >
                    <span>分享</span>
                </button>
            </div>

            <div class="flex flex-col w-full gap-2 justify-center items-center">
                <div
                    class="p-4 flex flex-row md:flex-col items-center gap-4 md:gap-2 bg-[#231f1f] rounded-xl w-full md:w-max-content text-center"
                >
                    <div class="w-3/5 md:w-full flex flex-col gap-2">
                        <div
                            class="text-2xl sm:text-3xl md:text-4xl m-2 font-bold text-center text-white font-poppins"
                        >
                            {{
                                currentSong.title
                                    ? currentSong.title
                                    : currentSong.folder
                            }}
                        </div>
                        <div
                            class="text-sm text-wrap whitespace-pre-wrap text-center"
                            v-if="currentSong.subtitle"
                        >
                            {{
                                currentSong.subtitle
                                    ? parseSubtitle(currentSong.subtitle)
                                    : ""
                            }}
                        </div>
                    </div>

                    <div
                        class="w-2/5 md:w-4/5 flex flex-col gap-4 md:gap-2 items-center"
                    >
                        <div
                            class="flex flex-col md:flex-row items-center gap-2"
                        >
                            <div class="text-base text-center text-white">
                                <button
                                    v-if="currentSong.credits"
                                    id="credit-btn"
                                    type="button"
                                    class="underline md:no-underline md:hover:underline text-balance"
                                    title="查看工作人員名單"
                                    aria-label="查看工作人員名單"
                                >
                                    {{
                                        currentSong.displayArtist ||
                                        "未知的藝人"
                                    }}
                                </button>
                                <span v-else>
                                    {{
                                        currentSong.displayArtist ||
                                        "未知的藝人"
                                    }}
                                </span>
                            </div>
                            <span>．</span>
                            <div
                                class="inline font-poppins text-sm text-center text-pretty"
                            >
                                <span>
                                    {{
                                        currentSong.album
                                            ? currentSong.album.name
                                            : currentSong.title + " - 單曲"
                                    }}
                                </span>
                            </div>
                        </div>

                        <!-- 歌曲不同版本的徽章 -->
                        <div
                            v-if="songVersion !== ORIGINAL"
                            class="version-badge inline ml-2 items-center select-none"
                        >
                            <span
                                v-if="songVersion == INSTRUMENTAL"
                                class="bg-cyan-700 text-xs mr-1 p-1.25 rounded-[5px]"
                            >
                                INSTRUMENTAL
                            </span>

                            <span
                                v-if="songVersion == THE_FIRST_TAKE"
                                class="bg-black text-xs mr-1 p-1.25 rounded-[5px]"
                            >
                                THE FIRST TAKE
                            </span>

                            <span
                                v-if="songVersion == LIVE"
                                class="bg-rose-500 text-xs mr-1 p-1.25 rounded-[5px]"
                            >
                                LIVE CONCERT
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
