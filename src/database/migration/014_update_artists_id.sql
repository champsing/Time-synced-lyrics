UPDATE songs
SET
    artist = CASE
        WHEN artist = '秋山黄色' THEN 1398614676
        WHEN artist = 'Vaundy' THEN 1487570516
        WHEN artist = '米津玄師' THEN 530814268
        ELSE artist
    END
WHERE
    artist IN ('秋山黄色', 'Vaundy', '米津玄師');

-- 最後再改型別
ALTER TABLE songs MODIFY COLUMN `artist` INTEGER NOT NULL DEFAULT 0;