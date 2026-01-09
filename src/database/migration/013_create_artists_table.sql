CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER UNIQUE NOT NULL,
    romaji_name TEXT NOT NULL DEFAULT "",
    original_name TEXT NOT NULL DEFAULT "",
);

CREATE INDEX idx_artist_id ON artist (artist_id);

CREATE INDEX idx_romaji_name ON artist (romaji_name);