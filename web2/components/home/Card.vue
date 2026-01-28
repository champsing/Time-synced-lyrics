<template>
    <!-- 背景漸層 -->
    <div class="absolute inset-0 -z-10 opacity-40">
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-rose-200/80 via-rose-100/50 to-transparent"
        ></div>
    </div>

    <!-- 文字區塊 -->
    <div
        class="relative backdrop-blur-[2px] bg-white/30 p-12 rounded-3xl shadow-[0_8px_32px_rgba(190,24,93,0.1)]"
    >
        <slot name="content"></slot>
    </div>
</template>
