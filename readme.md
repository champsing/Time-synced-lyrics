# 時間同步歌詞 🎵

[ 自動同步播放時間滾動歌詞的網頁工具 ]

## 歌曲清單格式

歌曲清單在 `/public/song_list.json` 中以 JSON 格式定義，陣列中的每個物件代表一首歌。

### 基本結構

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
            {"type": "the_first_take", "id": "XXXX"}, // optional
            {"type": "instrumental", "id": "XXXX"} // optional
        ],
        "credits": {
            "vocalist": "秋田ひろむ",
            "lyricist": "XXXXXX", // optional
            "song_writing": "XXXXXX", // optional
            "lyricist_and_songwriting": "秋田ひろむ",
            "arrangement": "出羽良彰"
        }
    },
...
]
```

### 歌曲屬性說明

| 屬性                         | 類型    | 必填 | 說明                                   |
| ---------------------------- | ------- | ---- | -------------------------------------- |
| `available`                  | boolean | ✓    | 是否啟用該歌曲                         |
| `name`                       | string  | ✓    | 時間譜檔案名稱 (e.g. "artist - title") |
| `id`                         | string  | ✓    | YouTube 影片 ID                        |
| `artist`                     | string  | ✓    | 歌手/團體名稱                          |
| `title`                      | string  | ✓    | 歌曲標題（不含歌手名）                 |
| `lyricist`                   | string  |      | 作詞者                                 |
| `album`                      | object  |      | 專輯資訊                               |
| ↳ `name`                     | string  | ✓    | 專輯名稱                               |
| ↳ `link`                     | string  |      | 專輯連結代碼                           |
| `translation`                | object  |      | 翻譯資訊                               |
| ↳ `available`                | boolean | ✓    | 是否有翻譯                             |
| ↳ `author`                   | string  |      | 翻譯作者                               |
| ↳ `cite`                     | string  |      | 翻譯出處連結                           |
| `default_phrase_duration`    | number  |      | 預設片語持續時間(ms)                   |
| `is_duet`                    | boolean |      | 是否為對唱歌曲                         |
| `alternative_versions`       | array   |      | 替代版本列表                           |
| ↳ `type`                     | string  | ✓    | 版本類型 (e.g. "instrumental")         |
| ↳ `id`                       | string  | ✓    | YouTube 影片 ID                        |
| `credits`                    | object  |      | 歌曲的製作名單                         |
| ↳ `vocalist`                 | string  |      | 主唱姓名                               |
| ↳ `lyricist`                 | string  |      | 作詞姓名                               |
| ↳ `songwriting`              | string  |      | 作曲姓名                               |
| ↳ `lyricist_and_songwriting` | string  |      | 詞曲創作姓名                           |
| ↳ `arrangement`              | string  |      | 編曲姓名                               |

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

### 歌詞行屬性說明

| 屬性               | 類型    | 必填 | 說明                                               |
| ------------------ | ------- | ---- | -------------------------------------------------- |
| `time`             | string  | ✓    | 開始時間 (格式 "mm:ss.SS")                         |
| `type`             | string  |      | 該行的類型，僅在值為 `interlude` 和 `end` 時有作用 |
| `text`             | array   |      | 主歌詞片語陣列                                     |
| ↳ `phrase`         | string  | ✓    | 文字片段                                           |
| ↳ `duration`       | number  | ✓    | 持續時間(ms)，0=使用預設值                         |
| ↳ `kiai`           | boolean |      | 是否強調顯示                                       |
| `translation`      | string  |      | 該行翻譯                                           |
| `background_voice` | object  |      | 背景和聲                                           |
| ↳ `time`           | string  | ✓    | 開始時間                                           |
| ↳ `text`           | array   | ✓    | 同主歌詞格式                                       |
| ↳ `translation`    | string  |      | 和聲翻譯                                           |
| `is_secondary`     | boolean |      | 是否為第二歌手                                     |

## 根元素

**必填**；Array

包含該首歌曲所有歌詞物件的陣列

## time

該行開始的時間。

在 YouTube 播放器的當前時刻到達這個位置時，會切換至該行歌詞。

## type

該行的類型。

-   若設為 `interlude`，則該行為間奏。

-   若設為 `end`，則該行為歌曲結束時間。

## text

該行的文字。由多個 `{"phrase": string, "duration": number}` 物件組成。

### phrase

一段片語。

-   若設定為空字串，則歌詞中不會顯示，可作為停頓之用。

-   範例：
    ```json
    { "phrase": "", "duration": 40 } // 作為停頓使用
    ```

### duration

該片語的持續時間。單位為厘秒（即 1/100 秒）。

-   若填寫 `0`，將會將該值取代為 `/public/song_list.json` 中定義的該歌曲的 `default_phrase_duration` 數值。

-   若該值也不存在，將使用系統預設值常數 `100`。

-   該值將配合 YouTube 播放器的當前時刻決定該片語由左向右漸層著色的快慢。

### 間奏與歌曲結束

-   若該行的 `type` 值為 `interlude`（即該行為間奏），

    `text` 將自動被設定為：

    ```json
    [
        {
            "phrase": "． ． ．",
            "duration": "(下一行的 time - 該行的 time，單位為秒)"
        }
    ]
    ```

-   若該行的 `type` 值為 `end`（即該行為歌曲結束），

    `text` 將自動被設定為：

    ```json
    [
        {
            "phrase": "創作者：（作詞者名稱，若無則使用藝人名稱）",
            "duration": "(該歌曲總長度 - 該行的 time，單位為秒)"
        }
    ]
    ```

### kiai

為該片語加上強調樣式。

-   若為 `true`，該片語在著色時會帶有白色光暈效果，作為強調用途。

## translation

該行歌詞的翻譯。

## background_voice

該行的背景和聲。

陣列中的每項物件皆是一行背景和聲，格式比照主旋律。

## is_secondary

表示該行為第二歌手的歌詞。

-   需要在 `/public/song_list.json` 中將該歌曲的 `is_duet` 設置為 `true` 方可正常使用。

-   若為 `true`，該行文字將會靠右顯示。
