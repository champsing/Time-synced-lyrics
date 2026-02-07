<script setup lang="ts">
import { ref } from 'vue';

const bodyBackgroundColor = ref("#365456");

</script>

<template>
    <!-- 導航欄 -->
    <nav class="shadow-sm">
        <div
            class="top-0 fixed w-full px-4 py-2 z-50"
            :style="{ backgroundColor: bodyBackgroundColor }"
        >
            <div
                class="flex flex-row justify-between items-center w-full gap-2 sm:gap-0"
            >
                <div class="flex flex-row gap-3 md:ml-8">
                    <img
                        src="/og_image/music.webp"
                        alt="同步開唱"
                        aria-label="同步開唱"
                        class="w-8 h-8 md:w-10 md:h-10 rounded-xl"
                    />
                    <a href="/" aria-label="回首頁">
                        <h1
                            class="text-2xl md:text-3xl font-bold text-black font-playfair mt-1"
                            :class="{
                                'text-rose-600':
                                    bodyBackgroundColor === '#101010',
                            }"
                        >
                            同步開唱
                        </h1>
                    </a>
                </div>
                <div class="grow"></div>
                <div
                    id="song-select-sm"
                    class="sm:hidden bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                >
                    <a
                        href="/song-select"
                        title="返回選歌系統"
                        aria-label="返回選歌系統"
                    >
                        <svg
                            height="50"
                            width="50"
                            viewBox="-143.36 -143.36 1310.72 1310.72"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#000000"
                        >
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g
                                id="SVGRepo_tracerCarrier"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    fill="#000000"
                                    d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                                ></path>
                                <path
                                    fill="#000000"
                                    d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                                ></path>
                            </g>
                        </svg>
                    </a>
                </div>
                <div
                    id="abouticon-below-sm"
                    class="sm:hidden bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                >
                    <button
                        type="button"
                        aria-label="關於"
                        class="mt-1"
                        id="about-btn-below-sm"
                        title="關於"
                    >
                        <svg
                            width="50"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 17V11"
                                stroke="#1C274C"
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                            <circle
                                cx="1"
                                cy="1"
                                r="1"
                                transform="matrix(1 0 0 -1 11 9)"
                                fill="#1C274C"
                            />
                            <path
                                opacity="0.5"
                                d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                stroke="#1C274C"
                                stroke-width="1.5"
                            />
                        </svg>
                    </button>
                </div>

                <div
                    id="giticon-below-sm"
                    class="sm:hidden bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                >
                    <a
                        href="https://github.com/champsing/time-synced-lyrics"
                        target="_blank"
                        referrerpolicy="no-referrer"
                        rel="noopener"
                        aria-label="這項專案的Repo"
                        title="GitHub"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="-5 -5 75 75"
                            height="50"
                            width="50"
                            aria-labelledby="title"
                            aria-describedby="desc"
                            role="img"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>Github</title>
                            <desc>
                                A solid styled icon from Orion Icon Library.
                            </desc>
                            <path fill="#374151"></path>
                            <path
                                data-name="layer2"
                                d="M32 0a32.021 32.021 0 0 0-10.1 62.4c1.6.3 2.2-.7 2.2-1.5v-6c-8.9 1.9-10.8-3.8-10.8-3.8-1.5-3.7-3.6-4.7-3.6-4.7-2.9-2 .2-1.9.2-1.9 3.2.2 4.9 3.3 4.9 3.3 2.9 4.9 7.5 3.5 9.3 2.7a6.93 6.93 0 0 1 2-4.3c-7.1-.8-14.6-3.6-14.6-15.8a12.27 12.27 0 0 1 3.3-8.6 11.965 11.965 0 0 1 .3-8.5s2.7-.9 8.8 3.3a30.873 30.873 0 0 1 8-1.1 30.292 30.292 0 0 1 8 1.1c6.1-4.1 8.8-3.3 8.8-3.3a11.965 11.965 0 0 1 .3 8.5 12.1 12.1 0 0 1 3.3 8.6c0 12.3-7.5 15-14.6 15.8a7.746 7.746 0 0 1 2.2 5.9v8.8c0 .9.6 1.8 2.2 1.5A32.021 32.021 0 0 0 32 0z"
                                fill="#202020"
                            ></path>
                            <path
                                data-name="layer1"
                                d="M12.1 45.9c-.1.2-.3.2-.5.1s-.4-.3-.3-.5.3-.2.6-.1c.2.2.3.4.2.5zm1.3 1.5a.589.589 0 0 1-.8-.8.631.631 0 0 1 .7.1.494.494 0 0 1 .1.7zm1.3 1.8a.585.585 0 0 1-.7-.3.6.6 0 0 1 0-.8.585.585 0 0 1 .7.3c.2.3.2.7 0 .8zm1.7 1.8c-.2.2-.5.1-.8-.1-.3-.3-.4-.6-.2-.8a.619.619 0 0 1 .8.1.554.554 0 0 1 .2.8zm2.4 1c-.1.3-.4.4-.8.3s-.6-.4-.5-.7.4-.4.8-.3c.3.2.6.5.5.7zm2.6.2c0 .3-.3.5-.7.5s-.7-.2-.7-.5.3-.5.7-.5c.4.1.7.3.7.5zm2.4-.4q0 .45-.6.6a.691.691 0 0 1-.8-.3q0-.45.6-.6c.5-.1.8.1.8.3z"
                                fill="#202020"
                            ></path>
                        </svg>
                    </a>
                </div>

                <div
                    class="sm:flex sm:flex-row sm:gap-2 hidden text-right justify-end"
                >
                    <div
                        id="song-select-sm"
                        class="bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                    >
                        <a href="/song-select">
                            <svg
                                height="50"
                                width="50"
                                viewBox="-143.36 -143.36 1310.72 1310.72"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="#000000"
                            >
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g
                                    id="SVGRepo_tracerCarrier"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                ></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path
                                        fill="#000000"
                                        d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                                    ></path>
                                    <path
                                        fill="#000000"
                                        d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                                    ></path>
                                </g>
                            </svg>
                        </a>
                    </div>

                    <div
                        id="abouticon-sm"
                        class="bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                    >
                        <button
                            type="button"
                            aria-label="關於"
                            class="mt-1"
                            id="about-btn-sm"
                            title="關於"
                        >
                            <svg
                                width="50"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 17V11"
                                    stroke="#1C274C"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <circle
                                    cx="1"
                                    cy="1"
                                    r="1"
                                    transform="matrix(1 0 0 -1 11 9)"
                                    fill="#1C274C"
                                />
                                <path
                                    opacity="0.5"
                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                    stroke="#1C274C"
                                    stroke-width="1.5"
                                />
                            </svg>
                        </button>
                    </div>

                    <div
                        id="giticon-sm"
                        class="bg-[#4ac2d7] outline-2 outline-cyan-800 rounded-md hover:bg-sky-300 transition-colors duration-200"
                    >
                        <a
                            href="https://github.com/champsing/time-synced-lyrics"
                            target="_blank"
                            referrerpolicy="no-referrer"
                            rel="noopener"
                            aria-label="這項專案的Repo"
                            title="GitHub"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 -5 64 64"
                                height="40"
                                width="50"
                                aria-labelledby="title"
                                aria-describedby="desc"
                                role="img"
                                xmlns:xlink="http://www.w3.org/1999/xlink"
                            >
                                <title>Github</title>
                                <desc>
                                    A solid styled icon from Orion Icon Library.
                                </desc>
                                <path fill="#374151"></path>
                                <path
                                    data-name="layer2"
                                    d="M32 0a32.021 32.021 0 0 0-10.1 62.4c1.6.3 2.2-.7 2.2-1.5v-6c-8.9 1.9-10.8-3.8-10.8-3.8-1.5-3.7-3.6-4.7-3.6-4.7-2.9-2 .2-1.9.2-1.9 3.2.2 4.9 3.3 4.9 3.3 2.9 4.9 7.5 3.5 9.3 2.7a6.93 6.93 0 0 1 2-4.3c-7.1-.8-14.6-3.6-14.6-15.8a12.27 12.27 0 0 1 3.3-8.6 11.965 11.965 0 0 1 .3-8.5s2.7-.9 8.8 3.3a30.873 30.873 0 0 1 8-1.1 30.292 30.292 0 0 1 8 1.1c6.1-4.1 8.8-3.3 8.8-3.3a11.965 11.965 0 0 1 .3 8.5 12.1 12.1 0 0 1 3.3 8.6c0 12.3-7.5 15-14.6 15.8a7.746 7.746 0 0 1 2.2 5.9v8.8c0 .9.6 1.8 2.2 1.5A32.021 32.021 0 0 0 32 0z"
                                    fill="#202020"
                                ></path>
                                <path
                                    data-name="layer1"
                                    d="M12.1 45.9c-.1.2-.3.2-.5.1s-.4-.3-.3-.5.3-.2.6-.1c.2.2.3.4.2.5zm1.3 1.5a.589.589 0 0 1-.8-.8.631.631 0 0 1 .7.1.494.494 0 0 1 .1.7zm1.3 1.8a.585.585 0 0 1-.7-.3.6.6 0 0 1 0-.8.585.585 0 0 1 .7.3c.2.3.2.7 0 .8zm1.7 1.8c-.2.2-.5.1-.8-.1-.3-.3-.4-.6-.2-.8a.619.619 0 0 1 .8.1.554.554 0 0 1 .2.8zm2.4 1c-.1.3-.4.4-.8.3s-.6-.4-.5-.7.4-.4.8-.3c.3.2.6.5.5.7zm2.6.2c0 .3-.3.5-.7.5s-.7-.2-.7-.5.3-.5.7-.5c.4.1.7.3.7.5zm2.4-.4q0 .45-.6.6a.691.691 0 0 1-.8-.3q0-.45.6-.6c.5-.1.8.1.8.3z"
                                    fill="#202020"
                                ></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>
