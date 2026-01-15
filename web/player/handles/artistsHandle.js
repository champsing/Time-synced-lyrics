import { API_BASE_URL } from "/web/utils/config.js";
import { reactive } from "vue";

/**
 * 核心邏輯：確保藝人資料已載入
 * 優先序：記憶體 (artistCache) > 本地緩存 (sessionStorage) > API 請求
 */
const artistCache = reactive({}); // 用於響應式顯示：{ "1": "YOASOBI" }

const pendingIds = new Set(); // 正在請求中的 ID

const STORAGE_KEY = "artists_name";

/**
 * 核心邏輯：確保單一藝人資料已載入
 * 修正點：確保 id 參數僅為單一標記，不含逗號
 */
export async function ensureArtistLoaded(id) {
    // 轉為字串並過濾掉包含逗號的錯誤格式
    const cleanId = String(id).trim();
    if (!cleanId || cleanId.includes(',')) return; 

    // 1. 檢查記憶體
    if (artistCache[cleanId] || pendingIds.has(cleanId)) return;

    pendingIds.add(cleanId);

    // 2. 檢查 sessionStorage
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        let artistsMap = storedData ? JSON.parse(storedData) : {};

        if (artistsMap[cleanId]) {
            artistCache[cleanId] = artistsMap[cleanId];
            pendingIds.delete(cleanId);
            return;
        }
    } catch (e) {
        console.error("解析 sessionStorage 失敗", e);
    }

    // 3. 發起 API 請求 (請求單一 ID)
    try {
        const response = await fetch(`${API_BASE_URL}/artists/?ids=${cleanId}`);
        const data = await response.json();
        
        // 注意：這裡假設後端回傳的是該 ID 的物件
        // 如果後端回傳的是陣列，請改為 data[0].original_name
        const name = data.original_name || "未知藝人";

        artistCache[cleanId] = name;

        // 更新儲存
        const currentStored = sessionStorage.getItem(STORAGE_KEY);
        const currentMap = currentStored ? JSON.parse(currentStored) : {};
        currentMap[cleanId] = name;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));
    } catch (err) {
        console.error(`無法獲取藝人資料 (ID: ${cleanId}):`, err);
        artistCache[cleanId] = "未知藝人";
    } finally {
        pendingIds.delete(cleanId);
    }
}

/**
 * 格式化顯示：徹底拆分每個 ID 並獨立處理
 */
export function getArtistDisplay(ids) {
    if (!ids) return "未提供";

    let idArray = [];

    // 統一轉化為「乾淨的 ID 陣列」
    if (Array.isArray(ids)) {
        idArray = ids.map(String);
    } else {
        // 處理數字或含逗號的字串
        idArray = String(ids)
            .split(",")
            .map(s => s.trim())
            .filter(s => s !== "");
    }

    if (idArray.length === 0) return "未提供";

    // 針對每個 ID 獨立查找或觸發載入
    const results = idArray.map((id) => {
        if (artistCache[id]) {
            return artistCache[id];
        }

        // 觸發單個 ID 的載入
        ensureArtistLoaded(id);
        return "...";
    });

    return results.join(", ");
}