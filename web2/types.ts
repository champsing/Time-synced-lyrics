export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string | null;
    versions: SongVersion[];
}

export interface SongVersion {
    type: string;
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
