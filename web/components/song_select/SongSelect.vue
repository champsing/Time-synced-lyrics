<script setup lang="ts">
import { useSongSelect } from "@/composables/hooks/useSongSelect";
import { PLAYER_VERSION } from "@/composables/utils/config";
import type { SortOption } from "@/types/song_select";
import RefreshModal from "@components/song_select/RefreshModal.vue";
import SearchBar from "@components/song_select/SearchBar.vue";
import SongCard from "@components/song_select/SongCard.vue";
import SongDetailModal from "@components/song_select/SongDetailModal.vue";
import { ref } from "vue";
import LoadingOverlay from "../player/LoadingOverlay.vue";
import SongSelectNav from "./SongSelectNav.vue";

const {
    searchQuery,
    sortOption,
    showSortOptions,
    showColorPicker,
    filteredSongs,
    isLoading,
    selectedVersions,
    colorOptions,
    bodyBackgroundColor,
    bgColorName,
    showDetailModal,
    selectedModalSong,
    openSongModal,
    closeSongModal,
    selectSong,
    selectVersion,
    nextSong,
    prevSong,
    refreshSongList,
} = useSongSelect();

const showRefreshModal = ref(false);
</script>

<template>
    <div
        class="min-h-screen text-gray-100 transition-colors duration-500"
        style="background-color: var(--theme-bg)"
    >
        <nav
            class="fixed top-0 left-0 w-full shadow-lg z-50 transition-colors duration-500"
        >
            <SongSelectNav />
        </nav>

        <main
            class="container mx-auto px-4 py-8 pt-20 sm:pt-25 pb-40 min-h-screen"
        >
            <!-- 版本資訊（手機） -->
            <div class="sm:hidden flex flex-col gap-0 text-center mb-4">
                <div class="text-sm opacity-75">
                    播放器版本：{{ PLAYER_VERSION }}
                </div>
            </div>

            <!-- 載入中 -->
            <div
                v-if="isLoading"
                class="w-full h-60 flex items-center justify-center"
            >
                <LoadingOverlay />
            </div>

            <!-- 歌曲網格 -->
            <div
                class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6 mb-20"
            >
                <SongCard
                    v-for="song in filteredSongs"
                    :key="song.song_id"
                    :song="song"
                    :selected-version="
                        selectedVersions[song.song_id] ?? 'original'
                    "
                    @open="openSongModal"
                    @play="selectSong"
                />

                <div
                    v-if="!isLoading && filteredSongs.length === 0"
                    class="col-span-full text-center py-8 text-gray-200"
                >
                    <span class="material-icons text-4xl mb-2">search_off</span>
                    <p>找不到符合的歌曲</p>
                </div>
            </div>
        </main>

        <SearchBar
            :search-query="searchQuery"
            :sort-option="sortOption"
            :show-sort-options="showSortOptions"
            :show-color-picker="showColorPicker"
            :color-options="colorOptions"
            :body-background-color="bodyBackgroundColor"
            :bg-color-name="bgColorName"
            @update:search-query="searchQuery = $event"
            @update:sort-option="sortOption = $event as SortOption"
            @update:show-sort-options="showSortOptions = $event"
            @update:show-color-picker="showColorPicker = $event"
            @update:body-background-color="bodyBackgroundColor = $event"
            @refresh="showRefreshModal = true"
        />

        <SongDetailModal
            :is-open="showDetailModal"
            :song="selectedModalSong"
            :selected-versions="selectedVersions"
            @close="closeSongModal"
            @select-version="selectVersion"
            @play="selectSong"
            @prev="prevSong"
            @next="nextSong"
        />

        <RefreshModal
            :is-open="showRefreshModal"
            @close="showRefreshModal = false"
            @confirm="refreshSongList"
        />
    </div>
</template>

<style>
:root {
    --theme-bg: #365456;
    --theme-nav: #2d4648;
}
body,
nav {
    transition: background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
