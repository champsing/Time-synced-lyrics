export function onPlayerChangeSongVideo(
    currentSong,
    songVersion,
    player
) {
    const videoID = currentSong.value.versions.find(
        (v) => v.version === songVersion.value
    ).id;

    console.log("Loading video from video ID:", videoID);

    if (!videoID) {
        window.ytPlayer.loadVideoById("");
        console.error("找不到影片 ID");
        return;
    }
    setTimeout(() => player.loadVideoById(videoID), 1000);
    player.pauseVideo();
}
