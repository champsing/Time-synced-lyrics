<script setup lang="ts">
const errorMessage =
    "很抱歉，無法找到您要播放的內容。請確認您是從選歌系統點擊進來，或是直接前往選歌系統選擇歌曲。";
</script>
<template>
    <div
        class="fixed inset-0 z-80 bg-[#1a1a1a] flex flex-col items-center justify-center px-6 text-center"
    >
        <div class="mb-6">
            <span class="material-icons text-7xl text-rose-500"
                >error_outline</span
            >
        </div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4 font-playfair">
            抱歉，找不到播放內容
        </h2>
        <p class="text-gray-400 mb-8 max-w-md">{{ errorMessage }}</p>
        <a
            href="/song-select"
            class="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
            <span class="material-icons">library_music</span>
            前往選歌系統
        </a>

        <a
            href="/"
            class="mt-6 text-sm text-gray-500 hover:text-teal-400 underline"
        >
            回到首頁
        </a>
    </div>
</template>
