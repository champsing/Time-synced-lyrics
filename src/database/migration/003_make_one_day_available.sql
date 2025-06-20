UPDATE songs
SET
    `available` = 1,
    `updated_at` = CURRENT_DATE
WHERE
    `song_id` = 1704107222;