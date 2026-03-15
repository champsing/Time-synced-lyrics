<script setup lang="ts">
defineProps<{
    isError: boolean;
    errorMessage: string;
}>();
</script>

<template>
    <div
        v-if="isError"
        class="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center flex-col gap-6 text-white px-8 text-center"
    >
        <span class="material-icons text-6xl text-red-400">error_outline</span>
        <h2 class="text-2xl font-bold">載入失敗</h2>
        <p class="text-white/70 max-w-md">{{ errorMessage }}</p>
        <a
            href="/song-select"
            class="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-full font-semibold transition-colors"
        >
            返回歌曲選擇
        </a>
    </div>
</template>
