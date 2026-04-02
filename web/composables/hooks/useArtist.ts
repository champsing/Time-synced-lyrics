import { reactive } from "vue";
import { API_BASE_URL } from "../utils/config";

// --- 型別定義 ---
interface ArtistData {
    artist_id: number;
    original_name: string;
}
type ArtistMap = Record<string, string>;
type ArtistApiResponse = ArtistData[];

// --- 狀態管理 ---
const artistCache = reactive<ArtistMap>({});
const STORAGE_KEY = "artists_name";

/**
 * 事件中心：key 是 ID，value 是 resolve 函數的陣列
 * 當資料抓到時，一次執行該 ID 下所有的 resolve
 */
const listeners = new Map<string, Array<() => void>>();

let batchQueue = new Set<string>();
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 核心邏輯：執行批次請求並通知所有聽眾
 */
async function processBatch(): Promise<void> {
    if (batchQueue.size === 0) return;

    const idsToFetch = Array.from(batchQueue);
    batchQueue.clear();
    batchTimeout = null;

    try {
        const response = await fetch(
            `${API_BASE_URL}/artists?ids=${idsToFetch.join(",")}`,
        );
        if (!response.ok) throw new Error("Batch fetch failed");

        // 確保取到的是 Array
        const data: ArtistApiResponse = await response.json();

        const currentStored = JSON.parse(
            sessionStorage.getItem(STORAGE_KEY) || "{}",
        );

        // 優化：先建立一個 Map 方便快速查找，避免在迴圈裡一直用 .find()
        // 這樣處理 O(n) 比起原本的 O(n^2) 效能更好
        const dataMap = new Map(
            data.map((item) => [String(item.artist_id), item.original_name]),
        );

        idsToFetch.forEach((id) => {
            // 從 map 中取出名字，如果找不到則給予預設值
            const name = dataMap.get(id) ?? "未知藝人";

            // 寫入響應式狀態與持久化緩存
            artistCache[id] = name;
            currentStored[id] = name;

            // 觸發 EventEmitter 通知等待中的 Promise
            if (listeners.has(id)) {
                listeners.get(id)?.forEach((resolve) => resolve());
                listeners.delete(id);
            }
        });

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentStored));
    } catch (err) {
        console.error("批次獲取藝人失敗:", err);
        idsToFetch.forEach((id) => {
            artistCache[id] = "未知藝人";
            if (listeners.has(id)) {
                listeners.get(id)?.forEach((resolve) => resolve());
                listeners.delete(id);
            }
        });
    }
}

/**
 * 確保藝人資料已載入
 */
export function ensureArtistLoaded(id: string | number): Promise<void> {
    const cleanId = String(id).trim();
    if (!cleanId) return Promise.resolve();

    // 1. 命中快取：直接返回
    if (artistCache[cleanId]) return Promise.resolve();

    // 2. 命中 SessionStorage：同步到快取並返回
    const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    if (storedData[cleanId]) {
        artistCache[cleanId] = storedData[cleanId];
        return Promise.resolve();
    }

    // 3. 進入等待邏輯
    return new Promise<void>((resolve) => {
        // 如果還沒有人在等這個 ID，將其加入批次隊列
        if (!listeners.has(cleanId)) {
            listeners.set(cleanId, []);
            batchQueue.add(cleanId);

            // 啟動 50ms 窗口收集其他請求
            if (!batchTimeout) {
                batchTimeout = setTimeout(processBatch, 50);
            }
        }

        // 將自己的 resolve 註冊到聽眾清單中
        listeners.get(cleanId)!.push(resolve);
    });
}

/**
 * 最終顯示邏輯：現在 Promise.all 會精準地在資料填入後結束
 */
export async function getArtistDisplay(
    ids: string | number | (string | number)[] | null | undefined,
): Promise<string> {
    if (!ids) return "未提供";

    const idArray = Array.isArray(ids)
        ? ids.map(String).map((s) => s.trim())
        : String(ids)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);

    if (idArray.length === 0) return "未提供";

    // 等待所有 ID 的事件被觸發
    await Promise.all(idArray.map((id) => ensureArtistLoaded(id)));

    // 到這裡時，artistCache[id] 絕對已經有值了
    return idArray.map((id) => artistCache[id] || "未知藝人").join(", ");
}
