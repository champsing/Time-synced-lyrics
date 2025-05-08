import { PLAYBACK_ID } from "../handles/playbackIDHandle.js";

export const injectPlaybackID = () => {
    document.getElementById("playback-id").innerText = `播放 ID：${PLAYBACK_ID}`;
}