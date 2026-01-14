import { API_BASE_URL } from "/web/utils/config.js";

/**
 * 核心邏輯：確保藝人資料已載入
 * 優先序：記憶體 (artistCache) > 本地緩存 (sessionStorage) > API 請求
 */
const artistCache = {}; // 用於響應式顯示：{ "1": "YOASOBI" }

export async function ensureArtistLoaded(id) {
    if (!id) return;
    // 1. 檢查記憶體
    if (artistCache[id]) return;

    // 2. 檢查 sessionStorage (使用 artist_<id> 格式)
    const cachedName = sessionStorage.getItem(`artist_${id}`);
    if (cachedName) {
        artistCache[id] = cachedName;
        return;
    }

    // 3. 發起 API 請求
    try {
        const response = await fetch(API_BASE_URL + `/artists/?ids=${id}`);
        const data = await response.json();
        console.log(data);
        const name = data.original_name; // 假設後端回傳 { "name": "..." }

        // 存入 sessionStorage 與 記憶體
        sessionStorage.setItem(`artist_${id}`, name);
        artistCache[id] = name;
    } catch (err) {
        console.error(`無法獲取藝人資料 (ID: ${id}):`, err);
        artistCache[id] = "未知藝人";
    }
}

/**
 * 格式化顯示藝人/作詞家名稱
 * 支持單一 ID 或 ID 陣列 [1, 2]
 */
export function getArtistDisplay(ids) {
    if (!ids || (Array.isArray(ids) && ids.length === 0)) return "未提供";

    const idArray = Array.isArray(ids) ? ids : [ids];
    return idArray
        .map((id) => {
            if (artistCache[id]) return artistCache[id];
            // 若尚未載入，觸發異步讀取並回傳佔位符
            ensureArtistLoaded(id);
            return "...";
        })
        .join(", ");
}
