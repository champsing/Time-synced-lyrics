import {
    ensureArtistLoaded,
    getArtistDisplay,
} from "@/composables/hooks/useArtist";
import { loadSongData, loadSongList } from "@/composables/hooks/useSongs";
import type {
    Color,
    SelectedVersionMap,
    SongListItem,
    SongVersion,
    SortOption,
} from "@/types/song_select";
import colorOptionsJson from "@composables/colorOptions.json";
import { computed, onMounted, reactive, ref, watch } from "vue";

// ── 常數 ──────────────────────────────────────────────────────────────────────

export const VERSION_LABELS: Record<string, string> = {
    original: "原曲",
    instrumental: "伴奏",
    the_first_take: "THE FIRST TAKE",
    live: "LIVE",
};

export const SORT_OPTIONS: SortOption[] = [
    "date",
    "name",
    "artist",
    "album",
    "lang",
];

export const SORT_LABELS: Record<SortOption, string> = {
    date: "📅 最後更新",
    name: "🎵 歌曲名稱",
    artist: "🎤 藝人名稱",
    album: "💿 專輯名稱",
    lang: "🌐 歌曲語言",
};

export const LANG_CODES: Record<string, string> = {
    zh: "華語",
    en: "英語",
    ja: "日語",
    kr: "韓語",
    se: "瑞典語",
};

// ── Composable ────────────────────────────────────────────────────────────────

export function useSongSelect() {
    // ── 狀態 ──────────────────────────────────────────────────────────────────
    const songs = ref<SongListItem[]>([]);
    const isLoading = ref(true);
    const searchQuery = ref("");
    const sortOption = ref<SortOption>("date");
    const showSortOptions = ref(false);
    const showColorPicker = ref(false);
    const selectedVersions = reactive<SelectedVersionMap>({});

    const showDetailModal = ref(false);
    const selectedModalSong = ref<SongListItem | null>(null);
    const showRefreshModal = ref(false);

    const colorOptions = ref<Color[]>(colorOptionsJson as Color[]);
    const bodyBackgroundColor = ref<string>(
        localStorage.getItem("themeColor") ||
            (colorOptionsJson[0] as Color).color,
    );

    // ── 計算屬性 ──────────────────────────────────────────────────────────────

    const filteredSongs = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return songs.value
            .filter((song) => !song.hidden)
            .filter((song) => {
                if (!query) return true;
                return (
                    (song.title || "").toLowerCase().includes(query) ||
                    (song.displayArtist || "").toLowerCase().includes(query) ||
                    (song.displayLyricist || "")
                        .toLowerCase()
                        .includes(query) ||
                    (song.album?.name || "").toLowerCase().includes(query)
                );
            })
            .sort(sortSong(sortOption.value));
    });

    const bgColorName = computed(
        () =>
            colorOptions.value.find(
                (x) => x.color === bodyBackgroundColor.value,
            )?.name ||
            colorOptions.value[0]?.name ||
            "預設顏色",
    );

    // ── 顏色 ──────────────────────────────────────────────────────────────────

    function darkenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = ((num >> 8) & 0x00ff) + amt;
        const B = (num & 0x0000ff) + amt;
        return (
            "#" +
            (
                0x1000000 +
                (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 0 ? 0 : B) : 255)
            )
                .toString(16)
                .slice(1)
        );
    }

    watch(
        bodyBackgroundColor,
        (newColor) => {
            const navColor = darkenColor(newColor, -15);
            document.body.style.setProperty("--theme-bg", newColor);
            document.body.style.setProperty("--theme-nav", navColor);
            localStorage.setItem("themeColor", newColor);
        },
        { immediate: true },
    );

    watch(selectedVersions, (newVal) => {
        sessionStorage.setItem("selectedVersions", JSON.stringify(newVal));
    });

    // ── 工具函式 ──────────────────────────────────────────────────────────────

    function sortSong(option: SortOption) {
        return (a: SongListItem, b: SongListItem) => {
            switch (option) {
                case "name":
                    return (a.title || "").localeCompare(
                        b.title || "",
                        "zh-TW",
                    );
                case "artist":
                    return (a.displayArtist || "").localeCompare(
                        b.displayArtist || "",
                        "zh-TW",
                    );
                case "album":
                    return (a.album?.name || a.title || "單曲").localeCompare(
                        b.album?.name || b.title || "單曲",
                        "zh-TW",
                    );
                case "date":
                    return (
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                    );
                case "lang":
                    return (a.lang || "未知").localeCompare(
                        b.lang || "未知",
                        "zh-TW",
                    );
                default:
                    return 0;
            }
        };
    }

    function getVersionLabel(version: string): string {
        return VERSION_LABELS[version] || version;
    }

    function parseSubtitle(subtitle?: string): string {
        return subtitle?.replace(/\\n/g, " · ") || "";
    }

    function selectVersion(songId: number, version: string) {
        selectedVersions[songId] = version;
    }

    // ── 歌曲資料 ──────────────────────────────────────────────────────────────

    async function ensureSongData(song: SongListItem): Promise<SongListItem> {
        if (song.versions && song.versions.length > 0) return song;

        try {
            const cacheKey = `detail_${song.song_id}`;
            let fullData: SongListItem | null = null;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) fullData = JSON.parse(cached);
            if (!fullData) {
                fullData = await loadSongData(song.song_id);
                sessionStorage.setItem(cacheKey, JSON.stringify(fullData));
            }

            if (fullData!.artist) {
                fullData!.displayArtist = await getArtistDisplay(
                    String(fullData!.artist)
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                );
            }
            if (fullData!.lyricist) {
                fullData!.displayLyricist = await getArtistDisplay(
                    String(fullData!.lyricist)
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                );
            }

            const index = songs.value.findIndex(
                (s) => s.song_id === song.song_id,
            );
            if (index !== -1) {
                songs.value[index] = { ...songs.value[index], ...fullData! };
                return songs.value[index];
            }
            return { ...song, ...fullData! };
        } catch (err) {
            console.error(`載入歌曲詳細資訊失敗 (${song.song_id}):`, err);
            return song;
        }
    }

    async function fetchSongs() {
        try {
            isLoading.value = true;

            let songList: SongListItem[] | null = null;
            const cached = sessionStorage.getItem("songList");
            if (cached) songList = JSON.parse(cached);

            if (!songList) {
                songList = await loadSongList();
                sessionStorage.setItem("songList", JSON.stringify(songList));
            }

            songs.value = songList!;

            // 預觸發藝人 ID 批次載入
            const requiredIds = new Set<string>();
            songList!.forEach((song) => {
                [String(song.artist || ""), String(song.lyricist || "")]
                    .flatMap((s) =>
                        s
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                    )
                    .forEach((id) => requiredIds.add(id));
            });
            requiredIds.forEach((id) => ensureArtistLoaded(id));

            // 版本選擇初始化
            const storedVersions = sessionStorage.getItem("selectedVersions");
            if (storedVersions) {
                Object.assign(
                    selectedVersions,
                    JSON.parse(storedVersions) as SelectedVersionMap,
                );
            } else {
                songList!.forEach((song) => {
                    selectedVersions[song.song_id] = "original";
                });
            }

            // 批次解析 displayArtist / displayLyricist
            await Promise.all(
                songList!.map(async (song) => {
                    song.displayArtist = await getArtistDisplay(
                        String(song.artist || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                    );
                    song.displayLyricist = await getArtistDisplay(
                        String(song.lyricist || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                    );
                }),
            );

            songs.value = [...songList!];
        } catch (err) {
            console.error("歌曲清單加載失敗:", err);
        } finally {
            isLoading.value = false;
        }
    }

    // ── Modal ─────────────────────────────────────────────────────────────────

    async function openSongModal(song: SongListItem) {
        if (!song.available) return;
        selectedModalSong.value = await ensureSongData(song);
        showDetailModal.value = true;
    }

    function closeSongModal() {
        showDetailModal.value = false;
    }

    async function nextSong() {
        if (!selectedModalSong.value) return;
        const idx = filteredSongs.value.findIndex(
            (s) => s.song_id === selectedModalSong.value!.song_id,
        );
        const next =
            filteredSongs.value[(idx + 1) % filteredSongs.value.length];
        if (!next) return;
        if (!next.available) {
            selectedModalSong.value = next;
            return nextSong();
        }
        selectedModalSong.value = await ensureSongData(next);
    }

    async function prevSong() {
        if (!selectedModalSong.value) return;
        const idx = filteredSongs.value.findIndex(
            (s) => s.song_id === selectedModalSong.value!.song_id,
        );
        const prev =
            filteredSongs.value[
                (idx - 1 + filteredSongs.value.length) %
                    filteredSongs.value.length
            ];
        if (!prev) return;
        if (!prev.available) {
            selectedModalSong.value = prev;
            return prevSong();
        }
        selectedModalSong.value = await ensureSongData(prev);
    }

    async function selectSong(song: SongListItem) {
        if (!song.available) return;
        const fullSong = await ensureSongData(song);
        const defaultVer =
            fullSong.versions?.find((v: SongVersion) => v.default)?.version ||
            fullSong.versions?.[0]?.version ||
            "original";
        const version = selectedVersions[fullSong.song_id] || defaultVer;
        window.location.href = `/player/?${new URLSearchParams({ song: String(fullSong.song_id), version })}`;
    }

    function refreshSongList() {
        sessionStorage.removeItem("songList");
        sessionStorage.removeItem("selectedVersions");
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith("detail_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        location.reload();
    }

    onMounted(async () => {
        await fetchSongs();
        window.addEventListener("keydown", (e) => {
            if (!showDetailModal.value) return;
            if (e.key === "ArrowLeft") prevSong();
            if (e.key === "ArrowRight") nextSong();
            if (e.key === "Escape") closeSongModal();
            if (e.key === "Enter" && selectedModalSong.value)
                selectSong(selectedModalSong.value);
        });
    });

    return {
        songs,
        isLoading,
        searchQuery,
        sortOption,
        showSortOptions,
        showColorPicker,
        selectedVersions,
        showDetailModal,
        selectedModalSong,
        showRefreshModal,
        colorOptions,
        bodyBackgroundColor,
        filteredSongs,
        bgColorName,
        SORT_OPTIONS,
        SORT_LABELS,
        LANG_CODES,
        getVersionLabel,
        parseSubtitle,
        selectVersion,
        openSongModal,
        closeSongModal,
        nextSong,
        prevSong,
        selectSong,
        refreshSongList,
        fetchSongs,
    };
}
