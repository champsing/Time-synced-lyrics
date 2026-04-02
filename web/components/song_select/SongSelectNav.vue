<script setup lang="ts">
import { PLAYER_VERSION } from "@/composables/utils/config";
</script>

<template>
   
        <div
            class="container mx-auto px-4 py-3 flex items-center justify-between"
        >
            <div class="flex items-center gap-3">
                <img
                    src="/og_image/music.webp"
                    alt="Logo"
                    class="w-10 h-10 select-none rounded-xl"
                />
                <h1 class="text-xl font-bold font-[Playfair] select-none">
                    同步開唱選歌系統
                </h1>
            </div>
            <div class="flex gap-4 items-center">
                <div class="hidden sm:flex flex-col gap-0">
                    <div class="text-sm opacity-75">
                        播放器版本：{{ PLAYER_VERSION }}
                    </div>
                </div>
                <a
                    href="/"
                    class="select-none px-4 py-2 bg-[#4ac2d7] rounded-md hover:bg-[#3aaabf] transition-transform hover:scale-110 duration-400"
                >
                    返回首頁
                </a>
            </div>
        </div>
    
</template>
