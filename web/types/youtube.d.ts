// YouTube IFrame Player API 型別宣告
// 放在 src/ 底下，tsconfig 的 include 範圍內即自動生效

interface YTPlayerOptions {
    width?: string | number;
    height?: string | number;
    videoId?: string;
    events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerStateEvent) => void;
        onError?: (event: YTPlayerEvent) => void;
    };
}

interface YTPlayerEvent {
    target: YTPlayer;
}

interface YTPlayerStateEvent extends YTPlayerEvent {
    data: number;
}

interface YTPlayer {
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    loadVideoById(videoId: string): void;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
}

interface YTPlayerConstructor {
    new (elementId: string, options: YTPlayerOptions): YTPlayer;
}

interface YTPlayerState {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
}

interface YTNamespace {
    Player: YTPlayerConstructor;
    PlayerState: YTPlayerState;
}

declare global {
    interface Window {
        YT: YTNamespace;
        onYouTubeIframeAPIReady: () => void;
        ytPlayer: YTPlayer;
    }
}

export {};
