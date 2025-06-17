CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER UNIQUE NOT NULL,
    available BOOLEAN NOT NULL,
    folder TEXT NOT NULL,
    art TEXT,
    artist TEXT NOT NULL,
    lyricist TEXT,  -- 存儲為 JSON 數組
    title TEXT NOT NULL,
    subtitle TEXT,
    is_duet BOOLEAN NOT NULL,
    translation_available BOOLEAN,
    translation_author TEXT,
    translation_cite TEXT,
    updated_at DATE NOT NULL,
    lang TEXT NOT NULL,
    -- JSON 字段
    versions JSON NOT NULL,
    credits JSON NOT NULL
);

CREATE INDEX idx_song_id ON songs(song_id);
CREATE INDEX idx_title ON songs(title);