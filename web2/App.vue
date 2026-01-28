<script setup lang="ts">
</script>

<template>
    <div class="min-h-screen transition-colors duration-500">
        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </div>
</template>

<style scoped></style>
