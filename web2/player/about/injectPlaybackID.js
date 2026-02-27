export const PLAYBACK_ID = crypto.randomUUID();

export const injectPlaybackID = () => {
    const playback_id = document.getElementById("playback-id");
    if (playback_id) playback_id.innerText = `播放 ID：${PLAYBACK_ID}`;
};
