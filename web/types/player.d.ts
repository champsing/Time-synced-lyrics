// 統一定義所有類型

// ── 歌曲資料處理型別 ─────────────────────────────────────────────────────────

export interface Song {
    song_id: number;
    available: number;
    hidden: number;
    folder: string | "";
    art: string;
    artist: string;
    lyricist: string;
    title: string | "";
    subtitle: string;
    album: Album | null;
    versions: Version[];
    is_duet: number;
    furigana: number | null;
    translation: Translation;
    updated_at: string;
    lang: string;
    credits: Credits;
}

export type SongWithDisplay = Song & {
    displayArtist?: string;
    displayLyricist?: string;
};

// 歌曲資料細節

//  專輯

export interface Album {
    name: string;
    link: string;
}

//  翻譯

export interface Translation {
    available: number | false;
    author: string | "";
    cite?: string;
    modified?: number | false;
}

//  工作人員名單

export interface Credits {
    performance: Contributor[];
    song_writing: Contributor[];
    engineering: Contributor[];
}

export interface Contributor {
    name: string;
    contribution: string[];
}

//  版本

export interface Version {
    default?: boolean;
    version: string;
    id: string;
    duration: string;
}

// ── 歌詞處理型別 ─────────────────────────────────────────────────────────

export type RawLyricData = LyricLine[];
export type LyricData = ProcessedLine[];

// 歌詞片語

export interface LyricPhrase {
    phrase: string;
    duration: number;
    pronounciation?: string;
    kiai?: boolean;
    pncat_forced?: boolean; // 新增此行
}

//  主聲歌詞行

export interface LyricLine {
    time: string;
    type?: "prelude" | "interlude" | "end";
    text?: LyricPhrase[];
    translation?: string;
    background_voice?: BackgroundVoiceLine;
    is_secondary?: boolean;
    is_together?: boolean;
}

export type ProcessedLine = Omit<LyricLine, "time" | "background_voice"> & {
    background_voice?: ProcessedBGLine;
    time: number;
    delay: number[];
    duration: number[];
    computedEndTime: number;
};

//  背景聲歌詞行

export interface BackgroundVoiceLine {
    time: string;
    text: LyricPhrase[];
    translation?: string;
}

export type ProcessedBGLine = Omit<BackgroundVoiceLine, "time"> & {
    time: number;
    duration: number[];
    delay: number[];
    computedEndTime: number;
};
