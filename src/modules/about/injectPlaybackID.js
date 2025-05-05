export const injectPlaybackID = () => {
    const PLAYBACK_ID = "<UUID>";
    document.getElementById("playback-id").innerText = `播放 ID：${PLAYBACK_ID}`;
}