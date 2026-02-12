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

UPDATE songs
SET
    lyricist = CASE
        WHEN lyricist = 'Kiro Akiyama' THEN 1398614676
        WHEN lyricist = 'Vaundy' THEN 1487570516
        WHEN lyricist = '米津玄師' THEN 530814268
        WHEN lyricist = '大森元貴' THEN 1360524149
        WHEN lyricist = 'Omoinotake' THEN 1185371943
        WHEN lyricist = '福島智朗' THEN 400500459931649 --random
        WHEN lyricist = 'Ren Urayama' THEN 400500791011570 --random
        WHEN lyricist = 'Kocchi no Kento' THEN 1639972219
        WHEN lyricist = '秋田ひろむ' THEN 646867579
        WHEN lyricist = 'Ruby Qu、王可鑫' THEN '400500549134030, 400500668546150' --random
        WHEN lyricist = '大森元貴, Marcus Lindberg' THEN '1360524149, 984593137'
        ELSE lyricist = lyricist
    END
WHERE
    lyricist IN (
        'Kiro Akiyama',
        'Vaundy',
        '米津玄師',
        '大森元貴',
        'Omoinotake',
        '福島智朗',
        'Ren Urayama',
        'Kocchi no Kento',
        '秋田ひろむ',
        'Ruby Qu、王可鑫',
        '大森元貴, Marcus Lindberg'
    );