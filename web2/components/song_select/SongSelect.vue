<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useSongs } from "@/composables/useSongs";
import SongCard from "@/components/song_select/SongCard.vue";
import SongDetailModal from "@/components/song_select/SongDetailModal.vue";
import type { Song } from "@/types";

const { filteredSongs, isLoading, searchQuery, selectedVersions, fetchSongs } =
    useSongs();
const showDetail = ref(false);
const selectedSong = ref<Song | null>(filteredSongs.value[0] || null);

const handleOpenModal = async (song: Song) => {
    // 這裡可以實作 lazy loading 詳細資料
    selectedSong.value = song;
    showDetail.value = true;
};

const handleSelect = (song: Song) => {
    const version = selectedVersions.value[song.song_id];
    window.location.href = `/player/?song=${song.song_id}&version=${version}`;
};

onMounted(fetchSongs);
</script>

<template>
    <div class="min-h-screen bg-[#0f1a1b] text-white">
        <nav
            class="fixed top-0 w-full bg-black/20 backdrop-blur-lg z-50 p-4"
        ></nav>

        <main class="container mx-auto px-4 pt-24 pb-40">
            <div
                v-if="isLoading"
                class="flex flex-col items-center justify-center h-64"
            >
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"
                ></div>
                <p class="mt-4">載入中...</p>
            </div>

            <div
                v-else
                class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
            >
                <SongCard
                    v-for="song in filteredSongs"
                    :key="song.song_id"
                    :song="song"
                    :selected-version="
                        selectedVersions[song.song_id] || 'original'
                    "
                    @open="handleOpenModal"
                    @play="handleSelect"
                />
            </div>
        </main>

        <footer class="fixed bottom-5 w-full px-4">
            <div
                class="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-4 rounded-2xl flex gap-4"
            >
                <input
                    v-model="searchQuery"
                    placeholder="搜尋歌曲..."
                    class="flex-1 bg-transparent outline-none"
                />
            </div>
        </footer>

        <SongDetailModal
            :show="showDetail"
            :song="selectedSong"
            :current-version="
                selectedVersions[selectedSong!.song_id] || 'original'
            "
            @close="showDetail = false"
            @update:version="
                (v) =>
                    selectedSong
                        ? (selectedVersions[selectedSong.song_id] = v)
                        : v
            "
            @select="handleSelect"
        />
    </div>
</template>
