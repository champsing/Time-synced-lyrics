import { API_BASE_URL } from "../utils/config";
import { reactive } from "vue";

interface ArtistData {
    original_name?: string;
    [key: string]: unknown;
}

type ArtistMap = Record<string, string>;
type ArtistApiResponse = Record<string, ArtistData>;

const artistCache = reactive<ArtistMap>({});
const pendingIds = new Set<string>();
const STORAGE_KEY = "artists_name";

// 批次請求隊列
let batchQueue = new Set<string>();
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 核心邏輯：處理批次請求
 */
async function processBatch(): Promise<void> {
    if (batchQueue.size === 0) return;

    const idsToFetch = Array.from(batchQueue);
    batchQueue.clear();
    batchTimeout = null;

    try {
        // idsToFetch 會變成 "1,2,3"
        const idsString = idsToFetch.join(",");
        const response = await fetch(
            `${API_BASE_URL}/artists?ids=${idsString}`,
        );

        if (!response.ok) throw new Error("Batch fetch failed");

        const data: ArtistApiResponse = await response.json();

        // 更新快取與 SessionStorage
        const currentStored = sessionStorage.getItem(STORAGE_KEY);
        const currentMap: ArtistMap = currentStored
            ? JSON.parse(currentStored)
            : {};

        idsToFetch.forEach((id) => {
            // 從 Rust HashMap { "id": { data } } 中提取
            const artistData = data[id];
            const name = artistData?.original_name ?? "未知藝人";

            artistCache[id] = name;
            currentMap[id] = name;
            pendingIds.delete(id);
        });

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));
    } catch (err) {
        console.error("批次獲取藝人失敗:", err);
        idsToFetch.forEach((id) => {
            artistCache[id] = "未知藝人";
            pendingIds.delete(id);
        });
    }
}

/**
 * 確保藝人資料已載入（支援自動批次合併）
 */
export function ensureArtistLoaded(id: string | number): Promise<void> {
    const cleanId = String(id).trim();
    if (!cleanId || cleanId.includes(",")) return Promise.resolve();

    // 1. 檢查記憶體
    if (artistCache[cleanId]) return Promise.resolve();

    // 2. 檢查是否已經在請求中
    if (pendingIds.has(cleanId)) {
        return new Promise<void>((resolve) => {
            const check = setInterval(() => {
                if (artistCache[cleanId]) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
    }

    // 3. 檢查 sessionStorage
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    const artistsMap: ArtistMap = storedData ? JSON.parse(storedData) : {};
    if (artistsMap[cleanId]) {
        artistCache[cleanId] = artistsMap[cleanId];
        return Promise.resolve();
    }

    // 4. 加入批次隊列
    pendingIds.add(cleanId);
    batchQueue.add(cleanId);

    // 設置微小延遲（50ms），收集同一畫面裡所有的請求
    if (!batchTimeout) {
        batchTimeout = setTimeout(processBatch, 50);
    }

    // 返回一個等待資料出現的 Promise
    return new Promise<void>((resolve) => {
        const check = setInterval(() => {
            if (artistCache[cleanId]) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}

/**
 * 顯示邏輯不變
 */
export async function getArtistDisplay(
    ids: string | number | (string | number)[] | null | undefined,
): Promise<string> {
    if (!ids) return "未提供";

    let idArray: string[];
    if (Array.isArray(ids)) {
        idArray = ids.map(String);
    } else {
        idArray = String(ids)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
    }

    if (idArray.length === 0) return "未提供";

    // 觸發多次 ensureArtistLoaded，由 batchQueue 合併成一個請求
    await Promise.all(idArray.map((id) => ensureArtistLoaded(id)));

    const results = idArray.map((id) => artistCache[id] ?? "載入中...");
    return results.join(", ");
}
