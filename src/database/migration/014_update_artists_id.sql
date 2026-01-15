UPDATE songs
SET
    artist = CASE
        WHEN artist = '秋山黄色' THEN 1398614676
        WHEN artist = 'Vaundy' THEN 1487570516
        WHEN artist = '米津玄師' THEN 530814268
        WHEN artist = 'Mrs. GREEN APPLE' THEN 96222103300
        WHEN artist = 'Omoinotake' THEN 1185371943
        WHEN artist = 'amazarashi' THEN 342419284
        WHEN artist = 'こっちのけんと' THEN 1639972219
        WHEN artist = 'HOYO-MiX, 魏晨, Nea' THEN '1447413190, 326063388, 85096326'
        WHEN artist = '米津玄師, Hikaru Utada' THEN '530814268, 18756224'
        WHEN artist = 'Mrs. GREEN APPLE, Sonoko Inoue' THEN '96222103300, 1668934157'
        WHEN artist = 'HOYO-MiX, Chevy, 知更鳥' THEN '1447413190, 1425598392, 1744861538'
        WHEN artist = 'yutori' THEN 1566501388
        ELSE artist = artist
    END
WHERE
    artist IN (
        '秋山黄色',
        'Vaundy',
        '米津玄師',
        'Mrs. GREEN APPLE',
        'Omoinotake',
        'amazarashi',
        'こっちのけんと',
        'HOYO-MiX, 魏晨, Nea',
        '米津玄師, Hikaru Utada',
        'Mrs. GREEN APPLE, Sonoko Inoue',
        'HOYO-MiX, Chevy, 知更鳥',
        'yutori'
    );