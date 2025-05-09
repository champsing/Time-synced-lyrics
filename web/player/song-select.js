import { createApp, ref, computed, onMounted } from "vue";
import { loadSongList } from "./handles/songsHandle.js";

const DATA_VERSION = "2025.05.09"

const VERSION_LABELS = {
    original: "原曲",
    instrumental: "伴奏",
    the_first_take: "一鏡版",
};

function main() {
    const searchQuery = ref("");
    const songs = ref([]);
    const isLoading = ref(true);
    const selectedVersions = ref({}); // 儲存每首歌選擇的版本 { songId: version }
    const error = ref(null);
    const dataVersion = DATA_VERSION;

    const filteredSongs = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((song) => song.available) // 過濾不可用歌曲
            .filter((song) => {
                const searchFields = [
                    song.title,
                    song.artist,
                    song.subtitle,
                    song.album?.name,
                    song.lyricist,
                ]
                    .join(" ")
                    .toLowerCase();
                return searchFields.includes(query);
            });
    });

    // 取得可用版本
    function parseSubtitle(subtitle) {
        return subtitle?.replace(/\n/g, " · ") || "";
    }

    function getVersionLabel(version) {
        return VERSION_LABELS[version] || version;
    }

    function selectVersion(songId, version) {
        selectedVersions.value = {
            ...selectedVersions,
            [songId]: version,
        };
    }

    function selectSong(song) {
        if (!song.available) return;

        const defaultVer =
            song.versions.find((v) => v.default)?.version ||
            song.versions[0].version;
        const version = selectedVersions[song.song_id] || defaultVer;

        const params = new URLSearchParams({
            song: song.song_id,
            version: version,
        });

        window.location.href = `/player/?${params}`;
    }

    async function fetchSongs() {
        try {
            const data = await loadSongList();
            songs.value = data;
            // 初始化默認版本選擇
            songs.value.forEach((song) => {
                const defaultVer = song.versions.find((v) => v.default);
                if (defaultVer) {
                    selectedVersions[song.song_id] = defaultVer.version;
                }
            });
        } catch (error) {
            console.error("歌曲加載失敗:", error);
        } finally {
            isLoading.value = false;
        }
    }

    onMounted(async () => {
        await fetchSongs();
    });

    return {
        dataVersion,
        searchQuery,
        songs,
        selectedVersions,
        isLoading,
        filteredSongs,
        error,
        parseSubtitle,
        getVersionLabel,
        selectSong,
        selectVersion,
        fetchSongs,
    };
}

const app = createApp({
    setup() {
        return main();
    },
});

app.mount("#app");
