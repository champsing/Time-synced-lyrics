export function onPlayerChangeSongVideo(currentSong, videoID, player) {

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
