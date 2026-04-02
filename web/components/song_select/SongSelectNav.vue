<script setup lang="ts">
import { PLAYER_VERSION } from "@/composables/utils/config";
</script>

<template>
    <div
        class="container mx-auto px-4 py-3 flex items-center justify-between"
        style="background-color: var(--theme-bg)"
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
                class="select-none px-4 py-2 rounded-lg text-white font-medium bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-400 ease-in-out hover:bg-white/20 hover:border-white/40 hover:shadow-zinc-500/20 hover:shadow-xl hover:scale-110 active:scale-105 active:bg-white/5 active:backdrop-blur-lg"
            >
                返回首頁
            </a>

            <!-- 
                /* 基礎佈局與文字 */
                select-none px-4 py-2 rounded-lg text-white font-medium
                
                /* 玻璃質感核心：半透明背景 + 磨砂濾鏡 */
                bg-white/10 backdrop-blur-md 
                
                /* 邊框：定義玻璃邊緣的微光 */
                border border-white/20 
                
                /* 外陰影：增加立體浮空感 */
                shadow-lg 
                
                /* 動畫過渡設定 */
                transition-all duration-400 ease-in-out
                
                /* Hover 狀態：亮度提升、邊框強化、外發光與放大 */
                hover:bg-white/20 hover:border-white/40 
                hover:shadow-xl hover:shadow-cyan-500/20 
                hover:scale-110
                
                /* 按下狀態：縮小回饋 */
                active:scale-95 active:bg-white/5 
            -->
        </div>
    </div>
</template>
