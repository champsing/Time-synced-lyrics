import { COMMIT_ID } from "./commit-info.js"; // 引入生成的 commit ID

const BASE_VERSION = "2.5.1";
const BUILD_DATE = new Date(Date.now() + 28800000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
// 3600.000 * 8 = 28800.000, to insure UTC+8.

// 組合版本號：基礎版本 + 構建日期 + commit 前12位
export const VERSION = COMMIT_ID
    ? `${BASE_VERSION}-${BUILD_DATE}-${COMMIT_ID.slice(0, 12)}`
    : `${BASE_VERSION}-${BUILD_DATE}-dev`;

export const DEFAULT_DURATION = 1000;
export const YOUTUBE_IFRAME_API = "https://www.youtube.com/iframe_api";
export const SONGLIST_PATH = "./public/song_list.json";
export const MAPPINGS_BASE_PATH = "./public/mappings/";
export const ALBUM_GOOGLE_LINK_BASE = "https://g.co/kgs/";
export const THE_FIRST_TAKE = "the_first_take";
export const INSTRUMENTAL = "instrumental";
export const DEFAULT_VERSION = "default_version";
export const MERCURY_TSL = " - 水星電臺"
