<script setup lang="ts"></script>

<template>
    <div class="min-h-screen transition-colors duration-500">
        <router-view v-slot="{ Component }">
            <component :is="Component" />
            <transition name="fade" mode="out-in"></transition>
        </router-view>
    </div>
</template>

<style scoped></style>
