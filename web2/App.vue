<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 全域背景色邏輯 (承接你原本的 localStorage 邏輯)
const globalStyle = computed(() => {
  const savedColor = localStorage.getItem("themeColor") || "#365456";
  return {
    backgroundColor: savedColor,
    '--theme-bg': savedColor,
  };
});
</script>

<template>
  <div :style="globalStyle" class="min-h-screen transition-colors duration-500">
    <nav  class="p-4 flex gap-4 bg-black/10 backdrop-blur-md sticky top-0 z-50">
      <router-link to="/" class="nav-link">首頁</router-link>
      <router-link to="/song-select" class="nav-link">選歌系統</router-link>
    </nav>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>



<style scoped>

</style>