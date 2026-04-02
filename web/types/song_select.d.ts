// 主題顏色選項
export interface Color {
    color: string;
    name: string;
}

// 歌曲排序邏輯
export type SortOption = "date" | "name" | "artist" | "album" | "lang";

// 選歌頁面使用的歌曲列表摘要型別（來自 /api/songs/list）
export interface SongListItem {
    song_id: number;
    available: boolean;
    hidden?: boolean;
    title: string;
    art: string;
    album?: { name: string; link?: string } | null;
    artist: string;
    lyricist?: string;
    lang: string;
    updated_at: string;
    signature: string;
    // 前端加工後的欄位
    displayArtist?: string;
    displayLyricist?: string;
    // ensureSongData 後才有的完整欄位
    versions?: SongVersion[];
    subtitle?: string;
    translation?: { author?: string; available?: boolean };
    folder?: string;
    furigana?: boolean;
}

export interface SongVersion {
    version: string;
    id: string;
    default?: boolean;
    duration?: string;
}

export type SelectedVersionMap = Record<number, string>;

export type SortLabels = Record<SortOption, string>;
