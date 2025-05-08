import * as axios from "axios";

// 處理播放 ID 狀況
async function handlePlaybackID() {
    let playbackId = localStorage.getItem("playbackId").id;

    // 有缓存 → 验证有效性
    if (playbackId) {
        try {
            await axios.get(`${API_BASE_URL}/playbacks/${playbackId}`);
            return playbackId; // 有效则直接使用
        } catch {
            localStorage.removeItem("playbackId");
            playbackId = null; // 无效则清除缓存
        }
    }

    // 无缓存 → 创建新 ID
    if (!playbackId) {
        const { playback } = await axios.post(`${API_BASE_URL}/playbacks`);
        playbackId = playback.id;
        localStorage.setItem("playbackId", playback);
    }

    return playbackId;
}

export const PLAYBACK_ID = handlePlaybackID();