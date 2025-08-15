export function onPlayerChangeSongVideo(currentSong, songVersion, player) {
    const videoID = currentSong.versions.find(
        (v) => v.version === songVersion
    ).id;

    console.log("Loading video from video ID:", videoID);

    if (!videoID) {
        player.loadVideoById("");
        console.error("找不到影片 ID");
        return;
    }
    
    setTimeout(() => {
        while (!player) {
            continue
        }
        player.loadVideoById(videoID);
        player.pauseVideo();
    }, 3000);
}
