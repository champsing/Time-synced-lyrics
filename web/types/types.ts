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

export interface Translation {
    available: number | false;
    author: string | "";
    cite?: string;
    modified?: number | false;
}

export interface Album {
    name: string;
    link: string;
}
export interface Credits {
    performance: Contributor[];
    song_writing: Contributor[];
    engineering: Contributor[];
}

export interface Contributor {
    name: string;
    contribution: string[];
}

export interface Version {
    default?: boolean;
    version: string;
    id: string;
    duration: string;
}

export interface LyricPhrase {
    phrase: string;
    duration: number;
    pronounciation?: string;
    kiai?: boolean;
    pncat_forced?: boolean; // 新增此行
}

export interface LyricLine {
    time: string;
    type?: "prelude" | "interlude" | "end";
    text?: LyricPhrase[];
    translation?: string;
    background_voice?: BackgroundVoiceLine; // 新增
    is_secondary?: boolean;
    is_together?: boolean;
}

export interface BackgroundVoiceLine {
    time: string;
    text: LyricPhrase[];
    translation?: string;
}

export interface parsedLyricLine {
    time: number;
    type?: "prelude" | "interlude" | "end";
    text?: LyricPhrase[];
    duration: number[];
    delay: number[];
    translation?: string;
    background_voice?: parsedBackgroundVoiceLine; // 新增
    is_secondary?: boolean;
    is_together?: boolean;
}

export interface parsedBackgroundVoiceLine {
    time: number;
    text: LyricPhrase[];
    duration: number[];
    delay: number[];
    translation?: string;
}

export type RawLyricData = LyricLine[];
export type LyricData = parsedLyricLine[];

// ── 歌詞處理型別 ─────────────────────────────────────────────────────────

export type ParsedLine = {
    time: number;
    duration: number[];
    delay: number[];
    text: any[];
    background_voice?: any;
    type?: string;
    is_secondary?: boolean;
    is_together?: boolean;
};
export type ProcessedLine = ParsedLine & { computedEndTime: number };

export type SongWithDisplay = Song & {
    displayArtist?: string;
    displayLyricist?: string;
};

export interface Color {
    color: string;
    name: string;
}

export type SortOption = "date" | "name" | "artist" | "album" | "lang";
