import { YOUTUBE_IFRAME_API } from "../utils/config.js";

export const initYouTubePlayer = (vueContext) => {
    let player = null;

    const init = () => {
        return new Promise((resolve) => {
            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = YOUTUBE_IFRAME_API;
                const firstScriptTag =
                    document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = () => {
                    player = createPlayer();
                    resolve(player);
                };
            } else {
                player = createPlayer();
                resolve(player);
            }
        });
    };

    const createPlayer = () => {
        return new window.YT.Player("player", {
            width: calcWidth().width,
            height: calcWidth().height,
            videoId: vueContext.currentSong.value.versions.find(
                (v) => v.version === vueContext.songVersion.value
            ).id,
            events: {
                onReady: onPlayerReady,
                onStateChange: (e) => onPlayerStateChange(e, vueContext),
            },
        });
    };

    const onPlayerReady = () => {
        console.log("播放器已準備好");
    };

    const onPlayerStateChange = (event, { currentTime, songDuration }) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            const update = () => {
                currentTime.value = event.target.getCurrentTime();
                requestAnimationFrame(update);
            };
            update();
        }

        if (
            event.data === window.YT.PlayerState.BUFFERING &&
            songDuration.value === 0
        ) {
            songDuration.value = event.target.getDuration();
        }
    };

    return { init };
};

const calcWidth = () => {
    if (window.screen.width >= 1024 && window.screen.height >= 768) {
        return {width: "300", height: "200"}
    } else return {width: "0", height: "0"}
}