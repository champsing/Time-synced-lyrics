CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER UNIQUE NOT NULL,
    available BOOLEAN NOT NULL,
    `hidden` BOOLEAN,
    folder TEXT NOT NULL DEFAULT "",
    art TEXT,
    artist TEXT NOT NULL DEFAULT "",
    lyricist TEXT,
    title TEXT NOT NULL DEFAULT "",
    subtitle TEXT DEFAULT "",
    album JSON DEFAULT `{"album": "", link: ""}`,
    versions JSON NOT NULL DEFAULT `{"version": "original", "id": "", "default": true, "duration": "0:00"}`,
    is_duet BOOLEAN NOT NULL DEFAULT 0,
    translation_available BOOLEAN,
    translation_author TEXT,
    translation_cite TEXT,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    lang TEXT NOT NULL DEFAULT "",
    -- JSON 字段
    credits JSON NOT NULL DEFAULT []
);

CREATE INDEX idx_song_id ON songs (song_id);