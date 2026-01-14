import { API_BASE_URL } from "/web/utils/config.js";
import { reactive } from "vue";

/**
 * 核心邏輯：確保藝人資料已載入
 * 優先序：記憶體 (artistCache) > 本地緩存 (sessionStorage) > API 請求
 */
const artistCache = reactive({}); // 用於響應式顯示：{ "1": "YOASOBI" }

const pendingIds = new Set(); // 正在請求中的 ID

export async function ensureArtistLoaded(id) {
    if (!id) return;
    // 1. 檢查記憶體
    if (artistCache[id] || pendingIds.has(id)) return;

    pendingIds.add(id);

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
        const name = data.original_name; // 假設後端回傳 { "name": "..." }

        // 存入 sessionStorage 與 記憶體
        sessionStorage.setItem(`artist_${id}`, name);
        artistCache[id] = name;
        pendingIds.delete(id);
    } catch (err) {
        console.error(`無法獲取藝人資料 (ID: ${id}):`, err);
        artistCache[id] = "未知藝人";
        pendingIds.delete(id);
    }
}

/**
 * 格式化顯示藝人/作詞家名稱
 * 支持單一數字字串、逗號分隔字串或 ID 陣列
 */
export function getArtistDisplay(ids) {
    if (!ids) return "未提供";

    let idArray;

    if (Array.isArray(ids)) {
        // 如果已經是陣列，直接使用
        idArray = ids;
    } else if (typeof ids === "string") {
        // 如果是字串，先檢查有沒有逗號，並切分後轉成數字
        // trim() 確保不會因為空格導致 parse 錯誤
        idArray = ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id !== "");
    } else if (typeof ids === "number") {
        // 如果直接傳數字，包裝成陣列
        idArray = [ids];
    } else {
        return "格式錯誤";
    }

    if (idArray.length === 0) return "未提供";

    return idArray
        .map((id) => {
            // 確保 id 是數字型態或是正確的 Cache Key 格式
            // 建議統一轉成字串或數字作為 key
            const key = String(id);

            if (artistCache[key]) {
                return artistCache[key];
            }

            // 若尚未載入，觸發異步讀取並回傳佔位符
            ensureArtistLoaded(key);
            return "...";
        })
        .join(", ");
}
