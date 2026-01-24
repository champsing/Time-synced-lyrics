import { createApp, ref, computed, onMounted, watch } from "vue";
import { loadSongData, loadSongList } from "./player/handles/songsHandle.js";
import { SONGLIST_VERSION } from "./utils/base-version.js";
import { PLAYER_VERSION } from "./utils/config.js";
import { initRefreshModal } from "./utils/modal.js";
import {
    ensureArtistLoaded,
    getArtistDisplay,
} from "./player/handles/artistsHandle.js";

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
    const sortOptions = ["date", "name", "artist", "album", "lang"];
    const sortOption = ref("date");
    const showSortOptions = ref(false);
    const showColorPicker = ref(false);
    const colorOptions = ref([
        {
            color: "#56773f",
            name: "預設 I：森林綠",
        },
    ]);

    const sortLabels = {
        date: "📅 最後更新",
        name: "🎵 歌曲名稱",
        artist: "🎤 藝人名稱",
        album: "💿 專輯名稱",
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
                // 如果搜尋字串為空，直接過回傳 true
                if (!query) return true;

                // 直接取用 fetchSongs 階段已經封裝好的 display 屬性
                // 增加選取性語法 ?. 以防資料尚未加載完成
                const artistNames = (song.displayArtist || "").toLowerCase();
                const lyricistNames = (
                    song.displayLyricist || ""
                ).toLowerCase();
                const albumName = (song.album?.name || "").toLowerCase();
                const title = (song.title || "").toLowerCase();

                return (
                    title.includes(query) ||
                    artistNames.includes(query) ||
                    lyricistNames.includes(query) ||
                    albumName.includes(query)
                );
            })
            .sort(sortSong(sortOption.value));
    });

    // 2. 修改：確保歌曲詳細資料已載入的函數
    async function ensureSongData(song) {
        // 如果已經有 versions 欄位，代表已經是完整資料，直接回傳
        if (song.versions && song.versions.length > 0) {
            return song;
        }

        try {
            let fullData = JSON.parse(
                sessionStorage.getItem(`detail_${song.song_id}`),
            );

            if (!fullData) {
                fullData = await loadSongData(song.song_id);
                sessionStorage.setItem(
                    `detail_${song.song_id}`,
                    JSON.stringify(fullData),
                );
            }

            // --- 核心修正處 ---
            // 確保詳細資料中的藝人和作詞家名稱也被轉換
            if (fullData.artist) {
                fullData.displayArtist = await getArtistDisplay(
                    fullData.artist,
                );
            }
            if (fullData.lyricist) {
                fullData.displayLyricist = await getArtistDisplay(
                    fullData.lyricist,
                );
            }
            // ----------------

            const index = songs.value.findIndex(
                (s) => s.song_id === song.song_id,
            );
            if (index !== -1) {
                // 合併加工後的資料
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

            // 預解析所有藝人與作詞家 ID
            const requiredIds = new Set();
            songList.forEach((song) => {
                [song.artist, song.lyricist].forEach((val) => {
                    if (Array.isArray(val))
                        val.forEach((id) => requiredIds.add(id));
                    else if (val) requiredIds.add(val);
                });
            });

            // 批次觸發載入（不需 await，讓它在背景跑）
            requiredIds.forEach((id) => ensureArtistLoaded(id));

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

            // 核心修正：將 songs 賦值後，立即跑一次轉換
            const list = songList;

            // 使用 Promise.all 同步處理所有歌曲的藝人名稱
            await Promise.all(
                list.map(async (song) => {
                    song.displayArtist = await getArtistDisplay(song.artist);
                    song.displayLyricist = await getArtistDisplay(
                        song.lyricist,
                    );
                }),
            );

            songs.value = list;
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
                        "zh-TW",
                    );
                case "date":
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case "lang":
                    return (a.lang || "未知").localeCompare(
                        b.lang || "未知",
                        "zh-TW",
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
        sessionStorage.removeItem("selectedVersions");
        // 刪除所有符合 detail_ 開頭的項目
        const keysToRemove = [];

        // 先找出所有符合條件的 Key
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("detail_")) {
                keysToRemove.push(key);
            }
        }

        // 執行刪除
        keysToRemove.forEach((key) => {
            sessionStorage.removeItem(key);
        });

        location.reload();
    }

    async function nextSong() {
        if (!selectedModalSong.value) return;

        // 從過濾後的清單找到當前索引
        const currentIndex = filteredSongs.value.findIndex(
            (s) => s.song_id === selectedModalSong.value.song_id,
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
            (s) => s.song_id === selectedModalSong.value.song_id,
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

    // 非同步讀取 JSON
    const fetchColors = async () => {
        try {
            const response = await fetch("/web/utils/colorOptions.json");
            colorOptions.value = await response.json();
        } catch (err) {
            console.error("無法讀取顏色設定檔:", err);
        }
    };

    // 3. 自動獲取當前顏色名稱
    const bgColorName = computed(
        () =>
            colorOptions.value.filter(
                (x) => x.color === bodyBackgroundColor.value,
            )[0].name ||
            colorOptions.value[0].name ||
            "預設顏色",
    );

    // 2. 響應式變數
    const bodyBackgroundColor = ref(
        localStorage.getItem("themeColor") || colorOptions.value[0].color,
    );

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
        { immediate: true },
    );

    onMounted(async () => {
        await fetchColors();
        await fetchSongs();
        initRefreshModal();

        // 監聽鍵盤事件
        window.addEventListener("keydown", (e) => {
            if (!showDetailModal.value) return;
            if (e.key === "ArrowLeft") prevSong();
            if (e.key === "ArrowRight") nextSong();
            if (e.key === "Escape") closeSongModal();
        });
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
        showColorPicker,
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
        getArtistDisplay,
        fetchColors,
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
