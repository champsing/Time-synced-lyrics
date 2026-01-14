CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER UNIQUE NOT NULL,
    romaji_name TEXT NOT NULL DEFAULT "",
    original_name TEXT NOT NULL DEFAULT "",
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 修正表名為 artists，並移除重複的 artist_id 索引
CREATE INDEX idx_romaji_name ON artists (romaji_name);