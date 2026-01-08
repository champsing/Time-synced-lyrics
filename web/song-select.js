import { createApp, ref, computed, onMounted, watch } from "vue";
import { loadSongData, loadSongList } from "./player/handles/songsHandle.js";
import { SONGLIST_VERSION } from "./utils/base-version.js";
import { PLAYER_VERSION } from "./utils/config.js";
import { initRefreshModal } from "./utils/modal.js";

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

    const colorOptions = [
        { color: "#56773f", name: "預設：森林綠" },
        { color: "#365456", name: "礦石靛" },
        { color: "#CC5200", name: "深琥珀橙" },
        { color: "#D49A00", name: "暗金黃" },
        { color: "#4A9B7D", name: "墨綠" },
        { color: "#00855C", name: "深翡翠綠" },
        { color: "#3A7A9E", name: "午夜藍" },
        { color: "#0A5D8C", name: "深海藍" },
        { color: "#6B7984", name: "石板灰" },
        { color: "#8C0D2B", name: "勃艮第紅" },
        { color: "#a48b8b", name: "煙霞粉" },
        { color: "#9E4D64", name: "酒紅" },
        { color: "#4A0B6B", name: "皇家紫" },
        { color: "#404040", name: "炭灰" },
        { color: "#101010", name: "深淵黑" },
        { color: "#fb2b43", name: "Apple Music 粉紅" },
    ];


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

    // 1. 優化過濾邏輯：增加防錯處理，因為初始清單可能沒有 subtitle 或 album
    const filteredSongs = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((song) => !song.hidden)
            .filter((song) => {
                const searchFields = [
                    song.folder,
                    song.title,
                    song.artist,
                    song.subtitle || "", // 初始列表可能為空
                    song.album?.name || "", // 初始列表可能為空
                    song.lyricist || "",
                ]
                    .join(" ")
                    .toLowerCase();
                return searchFields.includes(query);
            })
            .sort(sortSong(sortOption.value));
    });

    // 2. 新增：確保歌曲詳細資料已載入的函數
    async function ensureSongData(song) {
        // 如果已經有 versions 欄位，代表已經是完整資料，直接回傳
        if (song.versions && song.versions.length > 0) {
            return song;
        }

        try {
            // 先嘗試從 SessionStorage 拿單曲詳細快取
            let fullData = JSON.parse(
                sessionStorage.getItem(`detail_${song.song_id}`)
            );

            if (!fullData) {
                // 真正發送 API 請求
                fullData = await loadSongData(song.song_id);
                sessionStorage.setItem(
                    `detail_${song.song_id}`,
                    JSON.stringify(fullData)
                );
            }

            // 將詳細資料合併回原本的歌曲物件中（保持響應式）
            const index = songs.value.findIndex(
                (s) => s.song_id === song.song_id
            );
            if (index !== -1) {
                songs.value[index] = { ...songs.value[index], ...fullData };
            }
            return songs.value[index];
        } catch (err) {
            console.error(`載入歌曲詳細資訊失敗 (${song.song_id}):`, err);
            return song;
        }
    }

    // 3. 修改：獲取清單（現在只拿基礎欄位）
    async function fetchSongs() {
        try {
            isLoading.value = true;
            let songList = JSON.parse(sessionStorage.getItem("songList"));

            if (!songList) {
                songList = await loadSongList(); // 這裡現在拿到的是 8 個欄位的清單
                sessionStorage.setItem("songList", JSON.stringify(songList));
            }

            songs.value = songList;

            // 修改後的版本初始化邏輯
            const storedVersions = sessionStorage.getItem("selectedVersions");
            if (storedVersions) {
                selectedVersions.value = JSON.parse(storedVersions);
            } else {
                // 若抓不到字段，將所有歌曲預設設為 'original'
                const defaults = {};
                songList.forEach((song) => {
                    defaults[song.song_id] = "original";
                });
                selectedVersions.value = defaults;
            }
        } catch (error) {
            console.error("歌曲清單加載失敗:", error);
        } finally {
            isLoading.value = false;
        }
    }

    // 4. 修改：開啟 Modal（改為非同步）

    // 在 main() 函數內部新增
    const showDetailModal = ref(false);
    const selectedModalSong = ref(null);

    async function openSongModal(song) {
        if (!song.available) return;
        // 點擊後才去抓詳細資料
        const fullSong = await ensureSongData(song);
        selectedModalSong.value = fullSong;
        showDetailModal.value = true;
    }

    function closeSongModal() {
        showDetailModal.value = false;
    }

    // 5. 修改：直接播放（改為非同步）
    async function selectSong(song) {
        if (!song.available) return;

        const fullSong = await ensureSongData(song);
        const defaultVer =
            fullSong.versions?.find((v) => v.default)?.version ||
            fullSong.versions?.[0]?.version ||
            "original";

        const version = selectedVersions.value[fullSong.song_id] || defaultVer;

        const params = new URLSearchParams({
            song: fullSong.song_id,
            version: version,
        });

        window.location.href = `/player/?${params}`;
    }

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

    function parseSubtitle(subtitle) {
        return subtitle?.replace(/\\n/g, " · ") || "";
    }

    function refreshSongList() {
        sessionStorage.removeItem("songList");
        location.reload();
    }

    async function nextSong() {
        if (!selectedModalSong.value) return;

        // 從過濾後的清單找到當前索引
        const currentIndex = filteredSongs.value.findIndex(
            (s) => s.song_id === selectedModalSong.value.song_id
        );
        // 找下一個可用的索引（循環切換）
        const nextIndex = (currentIndex + 1) % filteredSongs.value.length;
        const nextSongObj = filteredSongs.value[nextIndex];

        // 如果下一首不可用 (coming soon)，則遞迴再找下一首
        if (!nextSongObj.available) {
            selectedModalSong.value = nextSongObj; // 先設值讓 findIndex 能運作
            return nextSong();
        }

        const fullSong = await ensureSongData(nextSongObj);
        selectedModalSong.value = fullSong;
    }

    async function prevSong() {
        if (!selectedModalSong.value) return;

        const currentIndex = filteredSongs.value.findIndex(
            (s) => s.song_id === selectedModalSong.value.song_id
        );
        // 找上一個索引
        const prevIndex =
            (currentIndex - 1 + filteredSongs.value.length) %
            filteredSongs.value.length;
        const prevSongObj = filteredSongs.value[prevIndex];

        if (!prevSongObj.available) {
            selectedModalSong.value = prevSongObj;
            return prevSong();
        }

        const fullSong = await ensureSongData(prevSongObj);
        selectedModalSong.value = fullSong;
    }

    // 2. 響應式變數
    const bodyBackgroundColor = ref(
        localStorage.getItem("themeColor") || colorOptions[0].color
    );

    // 3. 自動獲取當前顏色名稱
    const bgColorName = computed(() => {
        const found = colorOptions.find(
            (opt) => opt.color === bodyBackgroundColor.value
        );
        return found ? found.name : "自訂顏色";
    });

    // 4. 配色工具函式 (將主色調暗以生成導航列顏色)
    function darkenColor(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = ((num >> 8) & 0x00ff) + amt,
            B = (num & 0x0000ff) + amt;
        return (
            "#" +
            (
                0x1000000 +
                (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 0 ? 0 : B) : 255)
            )
                .toString(16)
                .slice(1)
        );
    }

    // 5. 監聽變更並套用至全域樣式
    watch(
        bodyBackgroundColor,
        (newColor) => {
            const navColor = darkenColor(newColor, -15); // 導航列比背景深 15%
            document.body.style.setProperty("--theme-bg", newColor);
            document.body.style.setProperty("--theme-nav", navColor);
            localStorage.setItem("themeColor", newColor);
        },
        { immediate: true }
    );

    onMounted(async () => {
        await fetchSongs();
        initRefreshModal();
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
        showDetailModal,
        selectedModalSong,
        colorOptions,
        bodyBackgroundColor,
        bgColorName,
        openSongModal,
        closeSongModal,
        parseSubtitle,
        getVersionLabel,
        selectSong,
        selectVersion,
        fetchSongs,
        refreshSongList,
        nextSong,
        prevSong,
    };
}

const app = createApp({
    setup() {
        return main();
    },
});

app.mount("#app");
