<template>
    <div
        id="translation-container-below-md"
        v-if="enableTranslation"
        class="md:hidden"
    >
        <div
            v-if="currentSong.translation?.available == true"
            class="p-4 flex flex-col items-center gap-2 bg-[#231f1f] opacity-90 rounded-xl w-fit"
        >
            <div class="text-xl font-bold text-center text-teal-300">
                {{ translationText }}
                <div class="mt-1 text-sm text-center text-teal-500">
                    {{ backgroundTranslationText }}
                </div>
            </div>

            <div class="mt-2">
                <div v-if="currentSong.translation?.cite">
                    <a
                        :href="currentSong.translation?.cite"
                        title="翻譯作者姓名"
                        aria-label="翻譯作者姓名"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs font-bold text-center text-green-400 underline md:no-underline md:hover:underline"
                    >
                        翻譯作者：{{ translationAuthor }}
                    </a>
                </div>
                <div
                    id="translate-author-without-link"
                    class="opacity-100"
                    v-else
                >
                    翻譯作者：{{ translationAuthor }}
                </div>
            </div>
        </div>
        <div
            v-else
            class="p-4 flex flex-col items-center gap-2 bg-[#231f1f] opacity-80 rounded-xl w-fit"
        >
            <span>本歌曲尚未提供翻譯</span>
        </div>
    </div>
</template>
