INSERT INTO
    songs (
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
        furigana,
        translation,
        updated_at,
        lang,
        credits
    )
VALUES
    (
        1840081736,
        1,
        NULL,
        'Kenshi Yonezu, Hikaru Utada - JANE DOE',
        'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/73/91/aa/7391aabc-81d8-2bcb-3b0f-8e24bc855745/4547366775211.jpg/600x600bf-60.jpg',
        '米津玄師, Hikaru Utada',
        '米津玄師',
        'JANE DOE',
        '劇場版『チェンソーマン レゼ篇』\nエンディング・テーマ',
        NULL,
        '[{"version": "original", "id": "sPLqsLsooJY", "default": true, "duration": "4:06"}]',
        1,
        1,
        '{"available": false, "author": "", "cite": ""}',
        '2025-12-07',
        'ja',
        '
        {
            "performance": [
                {"name": "米津玄師", "contribution": ["聲樂","編程"]},
                {"name": "宇多田光", "contribution": ["聲樂"]},
                {"name": "Yaffle", "contribution": ["編程"]},
                {"name": "Taichi Toyoda", "contribution": ["貝斯"]}
            ],
            "song_writing": [
                {"name": "米津玄師", "contribution": ["詞曲創作"]},
                {"name": "Yaffle", "contribution": ["編曲"]}
            ],
            "engineering": [
                {"name": "米津玄師", "contribution": ["製作人"]},
                {"name": "Masahito Komori", "contribution": ["混音師","錄音師"]},
                {"name": "Yuya Saito", "contribution": ["錄音師"]},
                {"name": "Randy Merrill", "contribution": ["母帶工程師"]}
            ]
        }
        '
    )