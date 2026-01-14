UPDATE songs
SET
    artist = CASE
        WHEN artist = '秋山黄色' THEN 1398614676
        WHEN artist = 'Vaundy' THEN 1487570516
        WHEN artist = '米津玄師' THEN 530814268
        WHEN artist = "Mrs. GREEN APPLE" THEN 96222103300
        ELSE artist
    END
WHERE
    artist IN ('秋山黄色', 'Vaundy', '米津玄師');