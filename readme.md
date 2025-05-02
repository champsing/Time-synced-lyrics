# 時間同步歌詞 🎵

[ 自動同步播放時間滾動歌詞的網頁工具 ]

> [!NOTE]
> 在以下的說明中，子節點如為必填而母節點為選填，指「當母節點存在時，該子節點必填」。

## 歌曲清單格式

歌曲清單在 `/public/song_list.json` 中以 JSON 格式定義，陣列中的每個物件代表一首歌。

### 基本結構

以下範例是標準的一首歌：

```json
[
...
    {
        "available": true,
        "name": "HOYO-MiX, Vision Wei, Nea - On the Journey",
        "artist": "HOYO-MiX, 魏晨, Nea",
        "lyricist": "Ruby Qu、王可鑫",
        "title": "不虛此行",
        "subtitle": "《崩壞:星穹鐵道》兩週年紀念曲",
        "is_duet": true,
        "versions": [
            {
                "version": "original",
                "id": "0WyDtxRZ938",
                "default": true
            }
        ],
        "translation": {
            "available": true,
            "author": "YouTube 影片內翻譯"
        },

        "credits": {
            "performance": [
                {
                    "name": "HOYO-MiX",
                    "contribution": ["演出者"]
                },
                {
                    "name": "魏晨",
                    "contribution": ["主唱"]
                },
                {
                    "name": "NEA",
                    "contribution": ["主唱"]
                }
            ],
            "song_writing": [
                {
                    "name": "王可鑫",
                    "contribution": ["詞曲創作", "編曲"]
                },
                {
                    "name": "Ruby Qu",
                    "contribution": ["作詞"]
                }
            ],
            "engineering": [
                {
                    "name": "崔瀚普",
                    "contribution": ["製作人"]
                },
                {
                    "name": "张迦南",
                    "contribution": ["母帶工程師"]
                },
                {
                    "name": "王可鑫",
                    "contribution": ["製作人、母帶工程師"]
                },
                {
                    "name": "阿烈",
                    "contribution": ["混音師"]
                }
            ]
        }
    },
...
]
```

### 歌曲屬性說明

| 屬性              | 類型         | 必填 | 說明                                   |
| ----------------- | ------------ | ---- | -------------------------------------- |
| `available`       | boolean      | ✓    | 是否啟用該歌曲                         |
| `name`            | string       | ✓    | 時間譜檔案名稱 (e.g. "artist - title") |
| `artist`          | string       | ✓    | 歌手/團體名稱                          |
| `title`           | string       | ✓    | 歌曲標題（不含歌手名）                 |
| `subtitle`        | string       |      | 歌曲副標題（不含歌名，可使用`\n`換行） |
| `lyricist`        | string       |      | 作詞者                                 |
| `is_duet`         | boolean      |      | 是否為對唱歌曲                         |
| `versions`        | array        | ✓    | 替代版本列表                           |
| ↳ `version`       | string       | ✓    | 版本類型 (e.g. "instrumental")         |
| ↳ `id`            | string       | ✓    | YouTube 影片 ID                        |
| ↳ `default`       | boolean      |      | 是否為預設版本                         |
| `album`           | object       |      | 專輯資訊                               |
| ↳ `name`          | string       | ✓    | 專輯名稱                               |
| ↳ `link`          | string       |      | 專輯連結代碼                           |
| `translation`     | object       |      | 翻譯資訊                               |
| ↳ `available`     | boolean      | ✓    | 是否有翻譯                             |
| ↳ `author`        | string       | ✓    | 翻譯作者                               |
| ↳ `cite`          | string       |      | 翻譯出處連結                           |
| `credits`         | object       |      | 歌曲的製作名單                         |
| ↳ `performance`   | array        |      | 表演貢獻者                             |
| ↳ `song_writing`  | array        |      | 詞曲創作貢獻者                         |
| ↳ `engineering`   | array        |      | 後製與工程類貢獻者                     |
| ↳↳ `name`         | string       | ✓    | 貢獻者姓名                             |
| ↳↳ `contribution` | string array | ✓    | 貢獻內容                               |

WIP

# 歌詞時間譜格式

歌詞的 JSON 時間譜檔案統一放在 `/public/mappings/(歌名)/` 裡，以歌曲版本 (i.e. `original`, `the_first_take`, `instrumental`, ...)命名。JSON 檔案中的每個物件都是一行歌詞。

以下範例是標準的一行歌詞：

```json
[
...
    {
        "time": "01:56.57",
        "text": [
            { "phrase": "Life ", "duration": 47 },
            { "phrase": "goes ", "duration": 23 },
            { "phrase": "on,", "duration": 31 },
            { "phrase": " ", "duration": 156 },
            { "phrase": "through ", "duration": 23 },
            { "phrase": "tides ", "duration": 28 },
            { "phrase": "of ", "duration": 27 },
            { "phrase": "time", "duration": 87 }
        ],
        "translation": "生命不息，歲月不止",
        "is_together": true,
        "background_voice": {
            "time": "01:58.06",
            "text": [
                { "phrase": "Goes ", "duration": 40 },
                { "phrase": "on,", "duration": 31 },
                { "phrase": " ", "duration": 100 },
                { "phrase": "time", "duration": 100, "kiai": true }
            ],
            "translation":"不息，歲月"
        }
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
| ↳ `pronounciation` | string  |      | 該片語的發音（為日文假名讀音設計）                 |
| `translation`      | string  |      | 該行翻譯                                           |
| `background_voice` | object  |      | 背景和聲                                           |
| ↳ `time`           | string  | ✓    | 開始時間                                           |
| ↳ `text`           | array   | ✓    | 同主歌詞`text`格式                                 |
| ↳ `translation`    | string  |      | 和聲翻譯                                           |
| `is_secondary`     | boolean |      | 是否為第二歌手                                     |
| `is_together`      | boolean |      | 是否為合唱                                         |

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

範例：

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

### pronounciation

該片語的讀音，主要為日語假名讀音設計；也可用在別種用途，但**尚不推薦**。

範例：

```json
{ "phrase": "夜空", "duration": 40, "pronounciation": "よぞら" }
```

輸出結果：

<ruby>
    夜空 <rp>(</rp> <rt>よぞら</rt> <rp>)</rp>
</ruby>

## translation

該行歌詞的翻譯。

## background_voice

該行的背景和聲。

陣列中的每項物件皆是一行背景和聲，格式比照主旋律。

## is_secondary

表示該行為第二歌手的歌詞。

-   需要在 `/public/song_list.json` 中將該歌曲的 `is_duet` 設置為 `true` 方可正常使用。

-   若為 `true`，該行文字將會靠右顯示。

-   背景和聲將跟隨主旋律靠右。

-   <font color=red>不可與`is_together`並用，否則沒有效果。</font>

## is_together

表示該行為歌手合唱的歌詞。

-   需要在 `/public/song_list.json` 中將該歌曲的 `is_duet` 設置為 `true` 方可正常使用。

-   若為 `true`，該行文字將會正常居中顯示。

-   背景和聲將跟隨主旋律置中。

-   <font color=red>不可與`is_secondary`並用，否則沒有效果。</font>
