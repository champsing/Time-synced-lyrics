import { YOUTUBE_IFRAME_API } from "@/composables/utils/config";
import type { Song } from "@/types";

export const initYouTubePlayer = (currentSong: Song, songVersion: string, currentTime: number, songDuration: number, isPaused: boolean) => {
    let player: any = null;
    let videoID = currentSong.value.versions.find(
        (v) => v.version === .songVersion.value,
    ).id;

    const createPlayer = () => {
        return new window.YT.Player("player", {
            width: calcWidth().width,
            height: calcWidth().height,
            videoId: videoID,
            events: {
                onReady: onPlayerReady,
                onStateChange: (e) => onPlayerStateChange(e, {currentTime, songDuration, isPaused}),
            },
        });
    };

    const init = () => {
        return new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.src = YOUTUBE_IFRAME_API;
            const firstScriptTag = document.getElementsByTagName("script")[0];
            if (firstScriptTag) firstScriptTag!.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                player = createPlayer();
                resolve(player);
            };
        });
    };

    const onPlayerStateChange = (
        event: Event,
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


export function onPlayerChangeSongVideo(currentSong: Song, videoID: string, player: any) {
    console.log("Loading video from video ID:", videoID);

    if (!videoID) {
        player.loadVideoById("");
        console.error("找不到影片 ID");
        return;
    }

    player.loadVideoById(videoID);
    player.pauseVideo();
}
