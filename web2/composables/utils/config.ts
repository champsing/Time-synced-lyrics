export const SONGLIST_VERSION = "2026.01.25";

export const PLAYER_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

export const DEBUG_INFO = `播放器版本：${PLAYER_VERSION}`;

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

export const TSL_SUFFIX = " - 同步開唱";
export const ORIGINAL = "original";
export const THE_FIRST_TAKE = "the_first_take";
export const INSTRUMENTAL = "instrumental";
export const LIVE = "live";
