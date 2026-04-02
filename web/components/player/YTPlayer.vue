<script setup lang="ts">
import { YOUTUBE_IFRAME_API } from "@/composables/utils/config";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
    /** 已由父層解析好的 YouTube 影片 ID（v.link） */
    videoId: string | null;
}>();

// ── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits<{
    (e: "update:currentTime", value: number): void;
    (e: "update:isPaused", value: boolean): void;
    (e: "update:songDuration", value: number): void;
}>();

// ── Internal state ─────────────────────────────────────────────────────────
const visible = ref(true);
let ytPlayer: any = null;
let rafId: number | null = null;

// ── Helpers ────────────────────────────────────────────────────────────────
const calcSize = () => {
    if (window.screen.width >= 960 && window.screen.height >= 768) {
        return { width: "300", height: "200" };
    }
    return { width: "0", height: "0" };
};

// ── Player creation ────────────────────────────────────────────────────────
const createPlayer = (videoId: string) => {
    const { width, height } = calcSize();
    return new window.YT.Player("player", {
        width,
        height,
        videoId,
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
        },
    });
};

// ── Event handlers ─────────────────────────────────────────────────────────
const onPlayerReady = () => {
    ytPlayer.setVolume(70);

    if (!props.videoId) {
        console.error("找不到影片 ID");
        return;
    }

    ytPlayer.loadVideoById(props.videoId);
    ytPlayer.pauseVideo();
    console.log("播放器已準備好，載入影片 ID：", props.videoId);
};

const onPlayerStateChange = (event: any) => {
    const YT = window.YT.PlayerState;

    if (event.data === YT.PLAYING) {
        emit("update:isPaused", false);
        const tick = () => {
            emit("update:currentTime", event.target.getCurrentTime());
            rafId = requestAnimationFrame(tick);
        };
        cancelAnimationFrame(rafId!);
        tick();
    } else {
        emit("update:isPaused", true);
        cancelAnimationFrame(rafId!);
    }

    if (event.data === YT.BUFFERING) {
        const duration = event.target.getDuration();
        if (duration > 0) emit("update:songDuration", duration);
    }
};

// ── YouTube API 載入 ───────────────────────────────────────────────────────
const loadYouTubeAPI = () =>
    new Promise<void>((resolve) => {
        if (window.YT?.Player) {
            resolve();
            return;
        }
        const tag = document.createElement("script");
        tag.src = YOUTUBE_IFRAME_API;
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = resolve;
    });

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
    if (!props.videoId) return;
    await loadYouTubeAPI();
    ytPlayer = createPlayer(props.videoId);
    window.ytPlayer = ytPlayer;
});

onBeforeUnmount(() => {
    cancelAnimationFrame(rafId!);
    ytPlayer?.destroy();
    ytPlayer = null;
});

// ── 切歌：videoId prop 改變時重建播放器 ───────────────────────────────────
watch(
    () => props.videoId,
    async (newId) => {
        if (!newId) {
            console.error("找不到影片 ID");
            return;
        }

        cancelAnimationFrame(rafId!);
        ytPlayer?.destroy();
        visible.value = false;

        await nextTick();
        visible.value = true;
        await nextTick();

        ytPlayer = createPlayer(newId);
        window.ytPlayer = ytPlayer;
    },
);

// ── Expose ─────────────────────────────────────────────────────────────────
defineExpose({
    play: () => ytPlayer?.playVideo(),
    pause: () => ytPlayer?.pauseVideo(),
    seekTo: (sec: number) => ytPlayer?.seekTo(sec, true),
    getPlayer: () => ytPlayer,
});
</script>

<template>
    <div ref="playerContainer">
        <div
            id="player"
            class="w-0 h-0 md:w-full md:h-full bg-white/10 rounded-2xl relative group cursor-pointer"
        />
    </div>
</template>
