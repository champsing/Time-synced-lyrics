import { YOUTUBE_IFRAME_API } from "./config.js";

export const initYouTubePlayer = (vueContext) => {
  let player = null;
  
  const init = () => {
    return new Promise((resolve) => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = YOUTUBE_IFRAME_API;
        const firstScriptTag = document.getElementsByTagName('script')[0];
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
    return new window.YT.Player('player', {
      width: '300',
      height: '200',
      videoId: vueContext.currentSong.value.id,
      events: {
        onReady: onPlayerReady,
        onStateChange: (e) => onPlayerStateChange(e, vueContext)
      }
    });
  };

  const onPlayerReady = (event) => {
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
    
    if (event.data === window.YT.PlayerState.BUFFERING && songDuration.value === 0) {
      songDuration.value = event.target.getDuration();
    }
  };

  return { init };
};