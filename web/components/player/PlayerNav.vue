<script setup lang="ts">
defineProps<{
    bodyBackgroundColor: string;
}>();
</script>

<template>
    <nav>
        <div
            class="top-0 fixed w-full py-4 z-50 backdrop-blur-md transition-all duration-300"
            :style="{ backgroundColor: `${bodyBackgroundColor}cc` }"
        >
            <div
                class="flex flex-row justify-between items-center w-full px-4 md:px-8"
            >
                <div class="flex items-center gap-4">
                    <a
                        href="/song-select"
                        class="group flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg"
                        title="返回選歌系統"
                        aria-label="返回選歌系統"
                    >
                        <svg
                            class="w-6 h-6 fill-current text-white/80 group-hover:text-white"
                            viewBox="0 0 1024 1024"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                            />
                            <path
                                d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                            />
                        </svg>
                    </a>

                    <div class="flex items-center gap-3">
                        <img
                            src="/og_image/music.webp"
                            alt="同步開唱"
                            class="w-8 h-8 rounded-lg shadow-md"
                        />
                        <a href="/" class="hover:opacity-80 transition-opacity">
                            <h1
                                class="text-xl md:text-2xl font-bold tracking-tight font-playfair"
                                :class="
                                    bodyBackgroundColor === '#101010'
                                        ? 'text-rose-500'
                                        : 'text-white/90'
                                "
                            >
                                同步開唱
                            </h1>
                        </a>
                    </div>
                </div>

                <div class="grow"></div>

                <div class="flex items-center gap-4">
                    <a
                        href="https://github.com/champsing/time-synced-lyrics"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg"
                        title="GitHub"
                        aria-label="GitHub Repo"
                    >
                        <svg
                            class="w-6 h-6 fill-current text-white/80"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 64 64"
                        >
                            <path
                                d="M32 0a32.021 32.021 0 0 0-10.1 62.4c1.6.3 2.2-.7 2.2-1.5v-6c-8.9 1.9-10.8-3.8-10.8-3.8-1.5-3.7-3.6-4.7-3.6-4.7-2.9-2 .2-1.9.2-1.9 3.2.2 4.9 3.3 4.9 3.3 2.9 4.9 7.5 3.5 9.3 2.7a6.93 6.93 0 0 1 2-4.3c-7.1-.8-14.6-3.6-14.6-15.8a12.27 12.27 0 0 1 3.3-8.6 11.965 11.965 0 0 1 .3-8.5s2.7-.9 8.8 3.3a30.873 30.873 0 0 1 8-1.1 30.292 30.292 0 0 1 8 1.1c6.1-4.1 8.8-3.3 8.8-3.3a11.965 11.965 0 0 1 .3 8.5 12.1 12.1 0 0 1 3.3 8.6c0 12.3-7.5 15-14.6 15.8a7.746 7.746 0 0 1 2.2 5.9v8.8c0 .9.6 1.8 2.2 1.5A32.021 32.021 0 0 0 32 0z"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </nav>
</template>
