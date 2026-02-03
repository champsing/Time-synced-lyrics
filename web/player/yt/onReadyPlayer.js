import { onPlayerChangeSongVideo } from "./changeVideo.js";
import { YOUTUBE_IFRAME_API } from "/web/utils/config.js";

export const initYouTubePlayer = (vueContext) => {
    let player = null;
    let currentSong = vueContext.currentSong.value;
    let videoID = vueContext.currentSong.value.versions.find(
        (v) => v.version === vueContext.songVersion.value,
    ).id;

    const createPlayer = () => {
        return new window.YT.Player("player", {
            width: calcWidth().width,
            height: calcWidth().height,
            videoId: videoID,
            
            events: {
                onReady: onPlayerReady,
                onStateChange: (e) => onPlayerStateChange(e, vueContext),
            },
        });
    };

    const init = () => {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.src = YOUTUBE_IFRAME_API;
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                player = createPlayer();
                resolve(player);
            };
        });
    };

    const onPlayerStateChange = (
        event,
        { currentTime, songDuration, isPaused },
    ) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            const update = () => {
                currentTime.value = event.target.getCurrentTime();
                requestAnimationFrame(update);
            };
            update();
            isPaused.value = false;
        } else isPaused.value = true;

        if (
            event.data === window.YT.PlayerState.BUFFERING &&
            songDuration.value === 0
        ) {
            songDuration.value = event.target.getDuration();
        }
    };

    const onPlayerReady = () => {
        window.ytPlayer.setVolume(70); // 設定音量為 70
        onPlayerChangeSongVideo(currentSong, videoID, player);
        console.log("播放器已準備好");
    };

    return { init };
};

const calcWidth = () => {
    if (window.screen.width >= 960 && window.screen.height >= 768) {
        return { width: "300", height: "200" };
    } else return { width: "0", height: "0" };
};
