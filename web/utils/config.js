import { PLAYBACK_ID } from "../player/about/injectPlaybackID.js";
import { BASE_VERSION } from "./base-version.js";
import { BUILD_DATE, COMMIT_ID } from "./commit-info.js"; // 引入生成的 commit ID

// 組合版本號：基礎版本 + 構建日期 + commit 前12位
export const PLAYER_VERSION = COMMIT_ID
    ? `${BASE_VERSION}-${BUILD_DATE}-${COMMIT_ID.slice(0, 12)}`
    : `${BASE_VERSION}-${BUILD_DATE}-dev`;

export const DEBUG_INFO = `播放器版本：${PLAYER_VERSION}
播放 ID：${PLAYBACK_ID}
`;

export const DEFAULT_DURATION = 100;
export const YOUTUBE_IFRAME_API = "https://www.youtube.com/iframe_api";
export const ALBUM_GOOGLE_LINK_BASE = "https://g.co/kgs/";
export const TSL_LINK_BASE = "https://timesl.online/";
export const TSL_PLAYER_LINK_BASE = "https://timesl.online/player/";

export const IS_DEV =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
export const API_BASE_URL = IS_DEV
    ? "http://localhost:8000"
    : "https://api.timesl.online";

export const MERCURY_TSL = " - 同步開唱";
export const ORIGINAL = "original";
export const THE_FIRST_TAKE = "the_first_take";
export const INSTRUMENTAL = "instrumental";
export const LIVE = "live";
