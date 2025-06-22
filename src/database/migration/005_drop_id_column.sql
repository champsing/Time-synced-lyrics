DROP INDEX IF EXISTS idx_song_id;
DROP INDEX IF EXISTS idx_title;

CREATE TABLE
    songs2 (
        song_id INTEGER UNIQUE PRIMARY KEY NOT NULL,
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
        translation JSON NOT NULL DEFAULT `{available: false}`,
        updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
        lang TEXT NOT NULL DEFAULT "",
        -- JSON 字段
        credits JSON NOT NULL DEFAULT `[]`
    );

CREATE INDEX idx_song_id ON songs2 (song_id);

CREATE INDEX idx_title ON songs2 (title);

INSERT INTO
    songs2 (
        song_id,
        available,
        hidden,
        folder,
        art,
        artist,
        lyricist,
        title,
        subtitle,
        album,
        versions,
        is_duet,
        translation,
        updated_at,
        lang,
        credits
    )
SELECT 
    song_id,
    available,
    hidden,
    folder,
    art,
    artist,
    lyricist,
    title,
    subtitle,
    album,
    versions,
    is_duet,
    translation,
    updated_at,
    lang,
    credits
FROM
    songs;

DROP TABLE songs;
ALTER TABLE songs2 RENAME TO songs;
