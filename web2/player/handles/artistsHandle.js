import { API_BASE_URL } from "/web/utils/config.js";
import { reactive } from "vue";

const artistCache = reactive({});
const pendingIds = new Set();
const STORAGE_KEY = "artists_name";

// 新增：批次請求隊列
let batchQueue = new Set();
let batchTimeout = null;

/**
 * 核心邏輯：處理批次請求
 */
async function processBatch() {
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

        const data = await response.json();

        // 更新快取與 SessionStorage
        const currentStored = sessionStorage.getItem(STORAGE_KEY);
        const currentMap = currentStored ? JSON.parse(currentStored) : {};

        idsToFetch.forEach((id) => {
            // 從 Rust HashMap { "id": { data } } 中提取
            const artistData = data[id];
            const name =
                artistData && artistData.original_name
                    ? artistData.original_name
                    : "未知藝人";

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
 * 確保藝人資料已載入 (現在支援自動批次合併)
 */
export function ensureArtistLoaded(id) {
    const cleanId = String(id).trim();
    if (!cleanId || cleanId.includes(",")) return Promise.resolve();

    // 1. 檢查記憶體
    if (artistCache[cleanId]) return Promise.resolve();

    // 2. 檢查是否已經在請求中
    if (pendingIds.has(cleanId)) {
        // 返回一個監聽該 ID 載入完成的 Promise (可選，這裡簡化為輪詢或直接返回)
        return new Promise((resolve) => {
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
    let artistsMap = storedData ? JSON.parse(storedData) : {};
    if (artistsMap[cleanId]) {
        artistCache[cleanId] = artistsMap[cleanId];
        return Promise.resolve();
    }

    // 4. 加入批次隊列
    pendingIds.add(cleanId);
    batchQueue.add(cleanId);

    // 設置一個微小的延遲（例如 50ms），收集同一個畫面裡所有的請求
    if (!batchTimeout) {
        batchTimeout = setTimeout(processBatch, 50);
    }

    // 返回一個等待資料出現的 Promise
    return new Promise((resolve) => {
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
export async function getArtistDisplay(ids) {
    if (!ids) return "未提供";

    let idArray = [];
    if (Array.isArray(ids)) {
        idArray = ids.map(String);
    } else {
        idArray = String(ids)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
    }

    if (idArray.length === 0) return "未提供";

    // 這裡會觸發多次 ensureArtistLoaded，但會被 batchQueue 合併成一個請求
    await Promise.all(idArray.map((id) => ensureArtistLoaded(id)));

    const results = idArray.map((id) => artistCache[id] || "載入中...");
    return results.join(", ");
}
