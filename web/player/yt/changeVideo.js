export function onPlayerChangeSongVideo(currentSong, songVersion, player) {
    const videoID = currentSong.value.versions.find(
        (v) => v.version === songVersion.value
    ).id;

    console.log("Loading video from video ID:", videoID);

    if (!videoID) {
        player.loadVideoById("");
        console.error("找不到影片 ID");
        return;
    }
    
    setTimeout(() => {
        while (!player.loadVideoById(videoID)) {
            continue
        }
        player.loadVideoById(videoID);
        player.pauseVideo();
    }, 3000);
}
