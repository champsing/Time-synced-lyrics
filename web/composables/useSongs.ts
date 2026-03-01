import { ref, computed, watch, reactive, type ComputedRef } from "vue";
import type { Song, SortOption } from "@/types";
import { IS_DEV, API_BASE_URL } from "@composables/utils/config";

export const loadSongList = async () => {
    try {
        console.log("獲取歌曲列表中...");
        const response = await fetch(API_BASE_URL + "/songs/");
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌曲列表載入失敗：" + err.message);
    } finally {
        console.log("歌曲列表獲取成功。");
    }
};

export const loadSongData = async (songId: number) => {
    try {
        console.log("獲取歌曲中..." + `(${songId})`);
        const response = await fetch(API_BASE_URL + `/songs/${songId}`);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌曲載入失敗：" + err.message);
    } finally {
        console.log("歌曲獲取成功。");
    }
};

export const getLyricResponse = async (folder: string, songVersion: string) => {
    try {
        const address = () => {
            if (IS_DEV) {
                return `/mappings/${folder}/${songVersion}.json`;
            } else {
                return `https://raw.githubusercontent.com/champsing/Time-synced-lyrics/master/mappings/${folder}/${songVersion}.json`;
            }
        };
        console.log(`獲取歌詞檔案中...(URL: ${address()})`);
        const response = await fetch(address());
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err: any) {
        throw new Error("歌詞載入失敗：" + err.message);
    } finally {
        console.log("歌詞檔案獲取成功。");
    }
};

export const getDefaultVersion = (currentSong: Song) => {
    return (
        currentSong.versions.find((v) => v.default === true)?.version ||
        "original"
    );
};

/**
 * 核心邏輯：確保藝人資料已載入
 * 優先序：記憶體 (artistCache) > 本地緩存 (sessionStorage) > API 請求
 */
const artistCache: Record<number, string> = reactive({}); // 用於響應式顯示：{ "1": "YOASOBI" }

const pendingIds = new Set(); // 正在請求中的 ID

const STORAGE_KEY = "artists_name";

/**
 * 核心邏輯：確保單一藝人資料已載入
 * 修正點：確保 id 參數僅為單一標記，不含逗號
 */
export async function ensureArtistLoaded(id: number) {
    if (!id) return;

    // 1. 檢查記憶體
    if (artistCache[id] || pendingIds.has(id)) return;

    pendingIds.add(id);

    // 2. 檢查 sessionStorage
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        let artistsMap = storedData ? JSON.parse(storedData) : {};

        if (artistsMap[id]) {
            artistCache[id] = artistsMap[id];
            pendingIds.delete(id);
            return;
        }
    } catch (e) {
        console.error("解析 sessionStorage 失敗", e);
    }

    // 3. 發起 API 請求 (請求單一 ID)
    try {
        const response = await fetch(`${API_BASE_URL}/artists/?ids=${id}`);
        const data = await response.json();

        // 注意：這裡假設後端回傳的是該 ID 的物件
        // 如果後端回傳的是陣列，請改為 data[0].original_name
        const name = data.original_name || "未知藝人";

        artistCache[id] = name;

        // 更新儲存
        const currentStored = sessionStorage.getItem(STORAGE_KEY);
        const currentMap = currentStored ? JSON.parse(currentStored) : {};
        currentMap[id] = name;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));
    } catch (err) {
        console.error(`無法獲取藝人資料 (ID: ${id}):`, err);
        artistCache[id] = "未知藝人";
    } finally {
        pendingIds.delete(id);
    }
}

/**
 * 非同步版本的格式化顯示：會等待所有 ID 載入完成才回傳
 */
export async function getArtistDisplay(
    ids: number | number[] | string,
): Promise<string> {
    if (!ids) return "未提供";

    let idArray = [];
    if (Array.isArray(ids)) {
        idArray = ids.map(Number);
    } else {
        idArray = String(ids)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "")
            .map(Number);
    }

    if (idArray.length === 0) return "未提供";

    // 使用 Promise.all 等待所有 ID 載入
    await Promise.all(idArray.map((id) => ensureArtistLoaded(id)));

    // 此時 artistCache 應該已經有資料了，再透過原本的同步邏輯抓取
    const results = idArray.map((id) => artistCache[id] || "載入中...");
    return results.join(", ");
}

export function useSongs() {
    const songs = ref<Song[]>([]);
    const searchQuery = ref("");
    const sortOption = ref<SortOption>("date");
    const isLoading = ref(true);
    const selectedVersions = ref<Record<number, string>>({});

    // 載入與初始化
    const fetchSongs = async () => {
        try {
            isLoading.value = true;
            const list = await loadSongList();

            // 處理顯示名稱
            await Promise.all(
                list.map(async (song: Song) => {
                    song.display_artist = await getArtistDisplay(song.artist);
                }),
            );

            songs.value = list;

            // 初始化版本選擇
            const stored = sessionStorage.getItem("selectedVersions");
            selectedVersions.value = stored
                ? JSON.parse(stored)
                : Object.fromEntries(
                      list.map((s: Song) => [s.song_id, "original"]),
                  );
        } finally {
            isLoading.value = false;
        }
    };

    // 過濾邏輯
    const filteredSongs: ComputedRef<Song[]> = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((s) => !s.hidden)
            .filter((s) => {
                if (!query) return true;
                return (
                    s.title.toLowerCase().includes(query) ||
                    s.display_artist?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                if (sortOption.value === "name")
                    return a.title.localeCompare(b.title, "zh-TW");
                return 0; // 簡化處理，可補上其他排序
            });
    });

    watch(
        selectedVersions,
        (val) => {
            sessionStorage.setItem("selectedVersions", JSON.stringify(val));
        },
        { deep: true },
    );

    return {
        songs,
        searchQuery,
        sortOption,
        filteredSongs,
        isLoading,
        selectedVersions,
        fetchSongs,
    };
}
