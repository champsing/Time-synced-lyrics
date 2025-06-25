import { createApp, ref, computed, onMounted, watch } from "vue";
import { loadSongData, loadSongList } from "./player/handles/songsHandle.js";
import { SONGLIST_VERSION } from "./utils/base-version.js";
import { PLAYER_VERSION } from "./utils/config.js";

const VERSION_LABELS = {
    original: "原曲",
    instrumental: "伴奏",
    the_first_take: "THE FIRST TAKE",
    live: "LIVE",
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
    const sortOptions = ["name", "artist", "album", "date", "lang"];
    const sortOption = ref("date");
    const showSortOptions = ref(false);

    const sortLabels = {
        name: "🎵 歌曲名稱",
        artist: "🎤 藝人名稱",
        album: "💿 專輯名稱",
        date: "📅 最後更新",
        lang: "🌐 歌曲語言",
    };

    const langCodes = {
        zh: "華語",
        en: "英語",
        ja: "日語",
        kr: "韓語",
        se: "瑞典語",
    };

    function sortSong(sortOption) {
        return (a, b) => {
            switch (sortOption) {
                case "name":
                    return a.title.localeCompare(b.title, "zh-TW");
                case "artist":
                    return a.artist.localeCompare(b.artist, "zh-TW");
                case "album":
                    return (a.album?.name || a?.title || "單曲").localeCompare(
                        b.album?.name || b?.title || "單曲",
                        "zh-TW"
                    );
                case "date":
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case "lang":
                    return (a.lang || "未知").localeCompare(
                        b.lang || "未知",
                        "zh-TW"
                    );
                default:
                    return 0;
            }
        };
    }

    const filteredSongs = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((song) => !song.hidden) // 過濾隱藏歌曲
            .filter((song) => {
                const searchFields = [
                    song.folder, // 純羅馬化的歌檔名，讓不會打日語的人打英文也搜的到
                    song.title,
                    song.artist,
                    song.subtitle,
                    song.album?.name,
                    song.lyricist,
                ]
                    .join(" ")
                    .toLowerCase();
                return searchFields.includes(query);
            })
            .sort(sortSong(sortOption.value));
    });

    // 取得可用版本
    function parseSubtitle(subtitle) {
        return subtitle?.replace(/\\n/g, " · ") || "";
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

            // use sessionStorage 才不會每開一次下載一次 在還沒用成資料庫前先這樣吧
            const song_list = JSON.parse(sessionStorage.getItem("songList"));
            if (!song_list) {
                let songList = await loadSongList();
                for (let i = 0; i < songList.length; i++) {
                    let songData = await loadSongData(songList[i].song_id);
                    sessionStorage.setItem(songList[i].song_id, JSON.stringify(songData));
                    songs.value.push(songData);
                }
                sessionStorage.setItem("songList", JSON.stringify(songList));
            } else {
                for (let i = 0; i < song_list.length; i++) {
                    let songData = JSON.parse(sessionStorage.getItem(song_list[i].song_id));
                    songs.value.push(songData);
                }
            }

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
                availableSongs.map((s) => `${s.song_id} - ${s.folder}`),
                "Unavailable songs:",
                unavailableSongs.map((s) => {
                    if (s.hidden) return `${s.song_id} - ${s.folder} (hidden)`;
                    else return `${s.song_id} - ${s.folder}`;
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
        SONGLIST_VERSION,
        searchQuery,
        songs,
        selectedVersions,
        isLoading,
        filteredSongs,
        showSortOptions,
        sortOption,
        sortOptions,
        sortLabels,
        langCodes,
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
