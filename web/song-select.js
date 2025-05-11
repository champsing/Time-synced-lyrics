import { createApp, ref, computed, onMounted, watch } from "vue";
import { loadSongList } from "./player/handles/songsHandle.js";
import { PLAYER_VERSION, SONGLIST_DATA_VERSION } from "./utils/config.js";

const VERSION_LABELS = {
    original: "原曲",
    instrumental: "伴奏",
    the_first_take: "THE FIRST TAKE",
};

const selectedVersions = ref({}); // 儲存每首歌選擇的版本 { songId: version }

watch(selectedVersions, (newVal) => {
    sessionStorage.setItem("selectedVersions", JSON.stringify(newVal));
});

function main() {
    const searchQuery = ref("");
    const songs = ref([]);
    const isLoading = ref(true);
    const error = ref(null);

    const filteredSongs = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((song) => !song.hidden) // 過濾隱藏歌曲
            .filter((song) => {
                const searchFields = [
                    song.name, // 純羅馬化的歌檔名，讓不會打日語的人打英文也搜的到
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
            ...selectedVersions.value,
            [songId]: version,
        };
        console.log("版本選擇變更：", selectedVersions.value);
    }

    function selectSong(song) {
        if (!song.available) return;

        const defaultVer =
            song.versions.find((v) => v.default)?.version ||
            song.versions[0].version;
        const version = selectedVersions.value[song.song_id] || defaultVer;

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

            // 若無快取，初始化默認版本選擇
            if (!sessionStorage.getItem("selectedVersions")) {
                console.log("未找到版本選擇記錄，使用各歌曲預設值。");

                songs.value
                    .filter((song) => song.available)
                    .forEach((song) => {
                        const defaultVer = song.versions.find((v) => v.default);
                        if (defaultVer) {
                            selectedVersions.value[song.song_id] =
                                defaultVer.version;
                        } else
                            selectedVersions.value[song.song_id] = "original";
                    });
            } else {
                console.log(
                    "已帶入版本選擇：",
                    JSON.parse(sessionStorage.getItem("selectedVersions"))
                );
                selectedVersions.value = JSON.parse(
                    sessionStorage.getItem("selectedVersions")
                );
            }

            const availableSongs = songs.value.filter((song) => song.available);

            const unavailableSongs = songs.value.filter(
                (song) => !song.available
            );

            // 調試：輸出實際加載的歌曲列表
            console.log(
                "Available songs:",
                availableSongs.map((s) => `${s.song_id} - ${s.name}`),
                "Unavailable songs:",
                unavailableSongs.map((s) => {
                    if (s.hidden) return `${s.song_id} - ${s.name} (hidden)`;
                    else return `${s.song_id} - ${s.name}`;
                })
            );
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
        PLAYER_VERSION,
        SONGLIST_DATA_VERSION,
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
