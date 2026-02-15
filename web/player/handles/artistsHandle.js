import { API_BASE_URL } from "/web/utils/config.js";
import { reactive } from "vue";

/**
 * 核心邏輯：確保藝人資料已載入
 * 優先序：記憶體 (artistCache) > 本地緩存 (sessionStorage) > API 請求
 */
const artistCache = reactive({}); // 用於響應式顯示：{ "1": "YOASOBI" }

const pendingIds = new Set(); // 正在請求中的 ID

const STORAGE_KEY = "artists_name";

// 外部狀態管理
let isFullyLoaded = false;

/**
 * 核心邏輯：確保藝人資料已載入
 * @param {string|number} id - 選填。若傳入則確保該 ID 存在；若不傳則嘗試全量載入。
 */
export async function ensureArtistLoaded(id = null) {
    const cleanId = id ? String(id).trim() : null;

    // 1. 如果有指定 ID，先檢查記憶體快取
    if (cleanId && (artistCache[cleanId] || pendingIds.has(cleanId))) {
        return;
    }

    // 2. 如果沒指定 ID 且已經全量載入過，直接返回
    if (!cleanId && isFullyLoaded) return;

    // 3. 嘗試從 sessionStorage 恢復資料並比對
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const artistsMap = JSON.parse(storedData);
            Object.assign(artistCache, artistsMap);

            // 如果從 Storage 拿到了指定的 ID，就不用發請求了
            if (cleanId && artistCache[cleanId]) return;
            // 如果沒指定 ID，代表 Storage 已經有全量資料
            if (!cleanId) {
                isFullyLoaded = true;
                return;
            }
        }
    } catch (e) {
        console.error("解析 sessionStorage 失敗", e);
    }

    // 4. 發起 API 請求
    // 鎖定狀態：若有 ID 則鎖定該 ID，否則鎖定全量標記
    const lockKey = cleanId || "ALL_ARTISTS";
    if (pendingIds.has(lockKey)) return;
    pendingIds.add(lockKey);

    try {
        // 根據是否有 cleanId 決定 URL (若有 ID 則帶參數，若無則請求全體)
        const url = cleanId
            ? `${API_BASE_URL}/artists/?ids=${cleanId}`
            : `${API_BASE_URL}/artists/`;

        const response = await fetch(url);
        const data = await response.json();

        // 5. 資料處理與合併
        const currentStored = sessionStorage.getItem(STORAGE_KEY);
        const currentMap = currentStored ? JSON.parse(currentStored) : {};

        if (cleanId) {
            // 單一查詢模式：假設後端回傳物件或陣列首項
            const name =
                data.original_name ||
                (Array.isArray(data) ? data[0]?.original_name : null) ||
                "未知藝人";
            artistCache[cleanId] = name;
            currentMap[cleanId] = name;
        } else {
            // 全量查詢模式
            const newMap = Array.isArray(data)
                ? Object.fromEntries(data.map((a) => [a.id, a.original_name]))
                : data; // 假設若是 Object 則直接使用

            Object.assign(artistCache, newMap);
            Object.assign(currentMap, newMap);
            isFullyLoaded = true;
        }

        // 更新 Storage
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));
    } catch (err) {
        console.error(`獲取藝人資料失敗 (${lockKey}):`, err);
        if (cleanId) artistCache[cleanId] = "未知藝人";
    } finally {
        pendingIds.delete(lockKey);
    }
}

/**
 * 非同步版本的格式化顯示：會等待所有 ID 載入完成才回傳
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

    // 使用 Promise.all 等待所有 ID 載入
    await Promise.all(idArray.map((id) => ensureArtistLoaded(id)));

    // 此時 artistCache 應該已經有資料了，再透過原本的同步邏輯抓取
    const results = idArray.map((id) => artistCache[id] || "載入中...");
    return results.join(", ");
}
