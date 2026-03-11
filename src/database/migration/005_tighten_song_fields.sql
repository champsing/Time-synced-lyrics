-- migration/005_tighten_song_fields.sql
DROP TABLE IF EXISTS songs;

CREATE TABLE songs (
    song_id INTEGER UNIQUE PRIMARY KEY NOT NULL,
    available BOOLEAN NOT NULL,
    hidden BOOLEAN,
    folder TEXT NOT NULL DEFAULT "",
    art TEXT NOT NULL DEFAULT "",
    artist TEXT NOT NULL DEFAULT "",
    lyricist TEXT NOT NULL DEFAULT "",
    title TEXT NOT NULL DEFAULT "",
    subtitle TEXT DEFAULT "",
    album JSON DEFAULT `{"album": "", "link": ""}`,
    versions JSON NOT NULL DEFAULT `[{"version": "original", "id": "", "default": true, "duration": "0:00"}]`,
    is_duet BOOLEAN NOT NULL DEFAULT 0,
    furigana BOOLEAN NOT NULL DEFAULT 0,
    translation JSON NOT NULL DEFAULT `{"available": false}`,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    lang TEXT NOT NULL DEFAULT "",
    credits JSON NOT NULL DEFAULT `[]`
);

CREATE INDEX idx_song_id ON songs (song_id);
CREATE INDEX idx_title ON songs (title);