export const PLAYBACK_ID = crypto.randomUUID();

export const injectPlaybackID = () => {
    document.getElementById("playback-id").innerText = `播放 ID：${PLAYBACK_ID}`;
}