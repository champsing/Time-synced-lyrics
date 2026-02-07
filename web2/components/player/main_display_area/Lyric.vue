<template>
                    <!-- 歌詞容器 -->
                <div
                    id="lyrics-container"
                    class="scroll-smooth snap-y snap-proximity text-center p-4 w-full relative mb-[30vh] md:mb-10"
                    :class="{ 'bg-[#3b3a3a]': !enableLyricBackground }"
                >
                    <div
                        class="md:h-svh md:overflow-scroll md:overflow-x-hidden"
                        style="scrollbar-width: none"
                    >
                        <div
                            v-for="(line, index) in jsonMappingContent"
                            class="lyric-line m-6! opacity-100"
                            :id="`lyric-line-${index}`"
                            :class="{ 'is-secondary-vocalist': line.is_secondary, 'is-together': line.is_together }"
                        >
                            <button
                                :id="`line-button-${index}`"
                                @click="jumpToCurrentLine(index)"
                                class="lyric-button text-2xl bg-transparent p-0 cursor-pointer max-w-[50%]"
                                type="button"
                                :class="{ 'active': isCurrentLine(index) }"
                            >
                                <!-- [for debugging] show line index -->
                                <!-- {{ index }} -->
                                <div class="primary-vocals">
                                    <span
                                        v-for="(t, phraseIndex) in line.text"
                                        :key="phraseIndex"
                                        :id="`lyric-phrase-${index}-${phraseIndex}`"
                                        class="lyric-phrase"
                                        :duration="line.duration[phraseIndex] * 100"
                                        :delay="line.delay[phraseIndex] * 100"
                                        :style="getPhraseStyle(index, phraseIndex)"
                                        :class="{ 'active': isActivePhrase(currentTime, line, phraseIndex) && index < jsonMappingContent.length - 1, 'kiai': isKiai(line, phraseIndex) }"
                                    >
                                        <span v-if="t.pronounciation">
                                            <span v-if="t.pncat_forced">
                                                <ruby>
                                                    {{ t.phrase }}
                                                    <rp>(</rp>
                                                    <rt class="text-rose-400"
                                                        >{{ t.pronounciation
                                                        }}</rt
                                                    >
                                                    <rp>)</rp>
                                                </ruby>
                                            </span>
                                            <span
                                                v-else-if="enablePronounciation"
                                            >
                                                <ruby>
                                                    {{ t.phrase }}
                                                    <rp>(</rp>
                                                    <rt
                                                        >{{ t.pronounciation
                                                        }}</rt
                                                    >
                                                    <rp>)</rp>
                                                </ruby>
                                            </span>
                                            <span v-else>{{ t.phrase }}</span>
                                        </span>
                                        <span v-else>{{ t.phrase }}</span>
                                    </span>
                                </div>

                                <div
                                    v-if="line.background_voice !== undefined"
                                    class="background-vocals"
                                >
                                    <span
                                        v-for="(bvt, phraseIndex) in line.background_voice.text"
                                        v-if="isCurrentLine(index)"
                                        :key="phraseIndex"
                                        class="lyric-phrase text-lg"
                                        :duration="line.duration[phraseIndex] * 100"
                                        :delay="line.delay[phraseIndex] * 100"
                                        :style="getBackgroundPhraseStyle(index, phraseIndex)"
                                        :class="{ 'active': isActivePhrase(currentTime, line.background_voice, phraseIndex)  && index < jsonMappingContent.length - 1, 'kiai': isBackgroundKiai(line, phraseIndex) }"
                                    >
                                        <span v-if="bvt.pronounciation">
                                            <span v-if="bvt.pncat_forced">
                                                <ruby>
                                                    {{ bvt.phrase }}
                                                    <rp>(</rp>
                                                    <rt class="text-rose-400"
                                                        >{{ bvt.pronounciation
                                                        }}</rt
                                                    >
                                                    <rp>)</rp>
                                                </ruby>
                                            </span>
                                            <span
                                                v-else-if="enablePronounciation"
                                            >
                                                <ruby>
                                                    {{ bvt.phrase }}
                                                    <rp>(</rp>
                                                    <rt
                                                        >{{ bvt.pronounciation
                                                        }}</rt
                                                    >
                                                    <rp>)</rp>
                                                </ruby>
                                            </span>
                                            <span v-else>{{ bvt.phrase }}</span>
                                        </span>
                                        <span v-else>{{ bvt.phrase }}</span>
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div
                        class="absolute inset-0 -z-10 overflow-hidden rounded-2xl select-none"
                        v-if="enableLyricBackground"
                    >
                        <img
                            :src="currentSong.art"
                            :alt="currentSong.folder"
                            class="reflection-scan w-full h-full object-cover opacity-50 brightness-50 blur-xl animate-background relative overflow-hidden translate-z-0 backface-hidden"
                        />
                    </div>
                    <!-- 電腦版翻譯置於歌詞框下方正中 -->
                    <div v-if="enableTranslation" class="md:h-[10vh] h-0"></div>
                </div>

</template>