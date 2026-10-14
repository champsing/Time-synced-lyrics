import { ref, watch, type Ref } from "vue";

// ── 預設值 ────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
    lyricFontSize: 24,
    scrollToCurrentLine: true,
    enableTranslation: true,
    enablePronounciation: false,
    enableLyricBackground: true,
    showVideo: true,
    volume: 70,
    isMuted: false,
} as const;

// ── 持久化工具 ────────────────────────────────────────────────────────────────

// 建立一個與 localStorage 同步的 ref。讀取時若無資料或格式錯誤則使用 fallback。
function persistedRef<T>(key: string, fallback: T): Ref<T> {
    let initial = fallback;
    const stored = localStorage.getItem(key);
    if (stored !== null) {
        try {
            initial = JSON.parse(stored) as T;
        } catch {
            initial = fallback;
        }
    }

    const state = ref(initial) as Ref<T>;
    watch(state, (value) => localStorage.setItem(key, JSON.stringify(value)));
    return state;
}

// ── Composable ────────────────────────────────────────────────────────────────

export function usePlayerSettings() {
    // ── 設定項目 ─────────────────────────────────────────────────────────────
    const lyricFontSize = persistedRef<number>(
        "lyricFontSize",
        DEFAULT_SETTINGS.lyricFontSize,
    );
    const scrollToCurrentLine = persistedRef<boolean>(
        "scrollToCurrentLine",
        DEFAULT_SETTINGS.scrollToCurrentLine,
    );
    const enableTranslation = persistedRef<boolean>(
        "enableTranslation",
        DEFAULT_SETTINGS.enableTranslation,
    );
    const enablePronounciation = persistedRef<boolean>(
        "enablePronounciation",
        DEFAULT_SETTINGS.enablePronounciation,
    );
    const enableLyricBackground = persistedRef<boolean>(
        "enableLyricBackground",
        DEFAULT_SETTINGS.enableLyricBackground,
    );
    const showVideo = persistedRef<boolean>(
        "showVideo",
        DEFAULT_SETTINGS.showVideo,
    );
    const volume = persistedRef<number>("volume", DEFAULT_SETTINGS.volume);
    const isMuted = persistedRef<boolean>("isMuted", DEFAULT_SETTINGS.isMuted);

    // ── 重設 ─────────────────────────────────────────────────────────────────
    function resetSettings() {
        lyricFontSize.value = DEFAULT_SETTINGS.lyricFontSize;
        scrollToCurrentLine.value = DEFAULT_SETTINGS.scrollToCurrentLine;
        enableTranslation.value = DEFAULT_SETTINGS.enableTranslation;
        enablePronounciation.value = DEFAULT_SETTINGS.enablePronounciation;
        enableLyricBackground.value = DEFAULT_SETTINGS.enableLyricBackground;
        showVideo.value = DEFAULT_SETTINGS.showVideo;
    }

    return {
        lyricFontSize,
        scrollToCurrentLine,
        enableTranslation,
        enablePronounciation,
        enableLyricBackground,
        showVideo,
        volume,
        isMuted,
        resetSettings,
    };
}
