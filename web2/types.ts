export interface Song {
    song_id: number;
    available: boolean;
    hidden: boolean;
    folder: string | "";
    art: string;
    artist: string;
    lyricist: string;
    title: string | "";
    subtitle: string;
    album: Album | null;
    versions: Version[];
    is_duet: boolean;
    furigana: boolean | null;
    translation: Translation;
    updated_at: string;
    lang: string;
    credits: Credits;
    display_artist?: string;
    display_lyricist?: string;
}

export interface Translation {
    available: boolean | false;
    author: string;
    cite: string;
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
    link: string;
    duration: string;
}

export interface LyricPhrase {
    phrase: string;
    duration: number;
    pronounciation?: string;
    kiai?: boolean;
    pncat_forced?: boolean; // 新增此行
}

export interface BackgroundVoiceLine {
    time: string;
    text: LyricPhrase[];
    translation?: string;
}

export interface LyricLine {
    time: string;
    type?: "prelude" | "interlude" | "end" | "normal";
    text?: LyricPhrase[];
    translation?: string;
    background_voice?: BackgroundVoiceLine; // 新增
    is_secondary?: boolean;
    is_together?: boolean;
}

export type LyricData = LyricLine[];

export interface Color {
    color: string;
    name: string;
}

export type SortOption = "date" | "name" | "artist" | "album" | "lang";