# 時間同步歌詞 🎵

[ 自動同步播放時間滾動歌詞的網頁工具 ]

# 歌曲清單格式

歌曲清單在 `/public/song_list.json` 中以 JSON 格式定義每一首歌的資料與屬性。JSON 檔案中的每個物件都是一首歌。

以下範例是標準的一首歌：

```json
[
...
    {
        "available": true,
        "name": "amazarashi - Cassiopeia Keiryuujo",
        "id": "pTwSEgflLq0",
        "artist": "amazarashi",
        "title": "カシオピア係留所",
        "lyricist": "秋田ひろむ",
        "album": {
            "name": "永遠市",
            "link": "cCJ7CCq"
        },
        "translation": {
            "available": true,
            "author": "Alice／箱庭博物館",
            "cite": "http://alicepika.blog.fc2.com/blog-entry-737.html"
        },
        "default_phrase_duration": 100,
        "is_duet": false,
        "alternative_versions": [
            {"type": "the_first_take", "id": "XXXX"},
            {"type": "instrumental", "id": "XXXX"}
        ]
    },
...
]
```

WIP

# 歌詞時間譜格式

歌詞的 JSON 時間譜檔案統一放在 `/public/mappings/` 裡。
JSON 檔案中的每個物件都是一行歌詞。

以下範例是標準的一行歌詞：

```json
[
...
    {
        "time": "03:55.98",
        "text": [
            { "phrase": "また", "duration": 0 },
            { "phrase": "しわを", "duration": 0 },
            { "phrase": "あわせて", "duration": 0, "kiai": true }
        ],
        "translation": "再一次 將我們的皺紋結合起來",
        "background_voice": {
            "time": "03:54.70",
            "text": [
                { "phrase": "思い出す", "duration": 80 },
                { "phrase": "ことも", "duration": 80 },
                { "phrase": "なくなって", "duration": 100 },
                { "phrase": "　", "duration": 10 },
                { "phrase": "しまうんだろう", "duration": 120 },
                { "phrase": "　", "duration": 10 },
                { "phrase": "しまうんだろう", "duration": 120, "kiai": true },
                { "phrase": "", "duration": 40 },
                { "phrase": "って", "duration": 20 }
            ],
            "translation": "會變得什麼都無法回想起來 會變成這樣吧 會變成這樣吧.....我想"
        },
        "is_secondary": true
    },
...
]
```

## time

**必填**；string

該行開始的時間。

在 YouTube 播放器的當前時刻到達這個位置時，會切換至該行歌詞。

## text

**必填**；Array

該行的文字。由多個 `{"phrase": string, "duration": number}` 物件組成。

### phrase

**必填**；string

一段片語。

-   若設定為空字串，則歌詞中不會顯示，可作為停頓之用。

### duration

**必填**；number

該片語的持續時間。

-   若填寫 `0`，將會將該值取代為 `/public/song_list.json` 中定義的該歌曲的 `default_phrase_duration` 數值。

-   若該值也不存在，將使用系統預設值常數 `100`。

-   該值將配合 YouTube 播放器的當前時刻決定該片語由左向右漸層著色的快慢。

### kiai

可選；boolean

為該片語加上強調樣式。

-   若為 `true`，該片語在著色時會帶有白色光暈效果，作為強調用途。

## translation

可選；string 該行歌詞的翻譯。

## background_voice

可選；Array

該行的背景和聲。

陣列中的每項物件皆是一行背景和聲，格式比照主旋律。

## is_secondary

可選；boolean

表示該行為第二歌手的歌詞。

需要在 `/public/song_list.json` 中將該歌曲的 `is_duet` 設置為 `true` 方可正常使用。
