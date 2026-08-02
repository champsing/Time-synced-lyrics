# 時間同步歌詞 🎵

> **同步開唱** — 一個以片語級別精準同步歌詞的網頁卡拉 OK 播放器，在 YouTube 影片上疊加逐詞著色的動態歌詞。

🌐 [tslyric.com](https://tslyric.com)　|　版本 **7.1.4**（前後端統一）

---

## 目錄

- [專案總覽](#專案總覽)
- [技術棧](#技術棧)
- [架構概覽](#架構概覽)
- [專案結構](#專案結構)
- [資料庫設計](#資料庫設計)
- [API 端點](#api-端點)
- [歌詞時間譜格式](#歌詞時間譜格式)
- [前端設計系統](#前端設計系統)
- [開發環境設定](#開發環境設定)
- [環境變數](#環境變數)
- [CI／CD](#cicd)
- [部署](#部署)

---

## 專案總覽

時間同步歌詞是一個全端網頁應用程式，核心功能為：

- 🎬 **YouTube 影片嵌入** — 使用 YouTube IFrame API 控制播放
- 🎤 **片語級歌詞同步** — 每句歌詞拆分為多個片語，各自擁有獨立時間碼，以漸層著色即時跟隨人聲
- 🌐 **多版本支援** — 同一首歌可提供原曲（original）、伴奏（instrumental）、THE FIRST TAKE（live）等版本
- 🎨 **動態專輯色調** — Canvas 提取專輯封面主色，即時生成頁面深色漸層背景
- 🔐 **GitHub OAuth 登入** — 後台編輯功能以 JWT 驗證保護
- ☁️ **Cloudflare R2 儲存** — 歌詞 JSON 檔案存放於 R2（S3 相容物件儲存），透過自訂域名 `lyric.tslyric.com` 公開讀取

---

## 技術棧

| 層 | 技術 |
|---|---|
| **前端** | Vue 3.5（Composition API `<script setup lang="ts">`）、vue-router 4、Vite 8、TypeScript ~5.9、Tailwind CSS v4 |
| **後端** | Rust edition 2024、Actix-web 4.12、Tokio |
| **資料庫** | SQLite（`rusqlite` + `r2d2` 連線池，WAL 模式） |
| **物件儲存** | Cloudflare R2（`aws-sdk-s3`，S3 相容 API） |
| **認證** | GitHub OAuth + JWT（`jsonwebtoken`）、HMAC-SHA256 簽章 |
| **部署** | Docker → Cloudflare Tunnel → 自託管主機 |
| **CI** | GitHub Actions（PR 檢查 + 版本發布自動部署） |

### 前端依賴

- **執行時期**：`vue`、`vue-router`、`@tailwindcss/vite`、`tailwindcss`
- **開發時期**：`typescript ~5.9`、`vite 8`、`vue-tsc`、`eslint`、`prettier`
- **無狀態管理庫** — 純 Composition API（`ref`／`computed`／`watch`），不使用 Pinia 或 Vuex
- **無 CSS 預處理器** — 純 Tailwind v4，無 `tailwind.config.js`

### 後端依賴

- **網頁框架**：`actix-web` + `actix-cors`
- **非同步執行**：`tokio`（full features）
- **HTTP 客户端**：`reqwest`（rustls）
- **序列化**：`serde`／`serde_json`、`chrono`
- **資料庫**：`rusqlite`（bundled SQLite）+ `r2d2` + `sea-query`
- **認證**：`jsonwebtoken`、`hmac` + `sha2`、`hex`

---

## 架構概覽

```
┌─────────────────────────────────────────────────┐
│                   使用者瀏覽器                     │
│  vue-router:  /  |  /songs  |  /player?id=&ver=  │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌───────────┐     ┌──────────────┐
│  Vite 前端  │     │  Actix API   │
│  (SPA)     │     │  :8000       │
│  tslyric.  │     │  api.tslyric │
│  com       │     │  .com        │
└───────────┘     └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   ┌──────────┐   ┌────────────┐   ┌──────────┐
   │ SQLite   │   │ Cloudflare │   │ YouTube  │
   │ tsl.db   │   │    R2      │   │ IFrame   │
   │ (歌曲/藝人)│   │ (歌詞 JSON) │   │   API    │
   └──────────┘   └────────────┘   └──────────┘
```

- **前端** 部署於 `tslyric.com`，為純靜態 SPA
- **後端 API** 部署於 `api.tslyric.com`，提供 RESTful 端點
- **歌詞檔案** 由 R2 透過 `lyric.tslyric.com` 自訂域名直接提供（公開讀取）
- **YouTube 影片** 在前端透過 IFrame API 嵌入播放，後端不參與影片串流
- **歌曲與藝人的中繼資料** 存放於 SQLite；歌詞 JSON 存放於 R2；兩者以 `song_id` 關聯

---

## 專案結構

```
├── Cargo.toml                  # Rust 專案設定（版本、依賴）
├── package.json                # Node 專案設定（版本、腳本）
├── Dockerfile                  # 多階段 Docker 建置（僅後端）
├── readme.md                   # 本文件
│
├── src/                        # Rust 後端原始碼
│   ├── main.rs                 # tokio 進入點：init DB → run server
│   ├── lib.rs                  # 模組宣告
│   ├── error.rs                # ServerError 枚舉（實作 ResponseError）
│   ├── utils.rs                # HMAC 簽章、Shift-JIS 解碼、系統 uptime
│   │
│   ├── database/
│   │   ├── mod.rs              # r2d2 連線池（max 10）、ConnGuard 洩漏追蹤
│   │   ├── song.rs             # Song 模型：CRUD、簽章、序列化
│   │   ├── artist.rs           # Artist 模型：CRUD
│   │   └── migration/          # 編號 SQL 遷移（001–005）
│   │
│   └── webpage/
│       ├── mod.rs              # CORS 設定、路由註冊、伺服器啟動
│       ├── status.rs           # GET /api/status
│       ├── auth/
│       │   ├── mod.rs          # JWT 簽發/驗證、extract_bearer()
│       │   ├── github.rs       # GitHub OAuth 登入/回呼
│       │   └── me.rs           # GET /api/auth/me
│       ├── songs/
│       │   ├── mod.rs
│       │   ├── list.rs         # GET /api/songs/list
│       │   ├── song.rs         # GET /api/songs/{id}
│       │   ├── create.rs       # POST /api/songs/create    🔐
│       │   ├── update.rs       # POST /api/songs/update    🔐
│       │   ├── delete.rs       # POST /api/songs/delete    🔐
│       │   └── verify.rs       # POST /api/songs/verify
│       ├── lyrics/
│       │   ├── mod.rs
│       │   ├── update.rs       # POST /api/lyrics/update   🔐
│       │   └── r2.rs           # R2 操作：put/get/delete/copy/sync
│       └── artists/
│           ├── mod.rs
│           ├── artist.rs       # GET /api/artists?id=1,2,3
│           ├── list.rs         # GET /api/artists/list
│           ├── create.rs       # POST /api/artists/create  🔐
│           └── delete.rs       # POST /api/artists/delete  🔐（待實作）
│
├── web/                        # Vue 3 前端原始碼
│   ├── main.ts                 # Vue app 進入點
│   ├── App.vue                 # 根元件（router-view）
│   ├── router/index.ts         # 路由：/、/songs、/player/:id?
│   │
│   ├── components/
│   │   ├── home/               # Home.vue、Card.vue
│   │   ├── player/             # Player.vue、YTPlayer、PlayerNav、
│   │   │   │                   # SongInfo、ProgressBar、PlaybackControls、
│   │   │   │                   # MobileController、ErrorDisplay
│   │   │   ├── lyrics/         # LyricsContainer、LyricLine、LyricPhrase、
│   │   │   │                   # TranslationBar
│   │   │   └── modals/         # SettingModal、ShareModal、AboutModal、
│   │   │                       # CreditModal
│   │   ├── song_select/        # SongSelect、SearchBar、SongCard、
│   │   │                       # SongDetailModal、SongSelectNav、RefreshModal
│   │   └── LoadingOverlay.vue
│   │
│   ├── composables/
│   │   ├── hooks/              # useSongs、useLyricTimeline、useAlbumColors、
│   │   │                       # useProgressBar、useVolumeControl、
│   │   │                       # useTranslation、useSongSelect、useArtist
│   │   └── utils/
│   │       ├── config.ts       # 常數（API_BASE_URL、版本標籤、TSL_SUFFIX）
│   │       └── global.ts       # 工具函式（formatTime、scrollToLineIndex）
│   │
│   ├── types/                  # TypeScript 型別定義
│   │   ├── player.d.ts         # Song、LyricLine、ProcessedLine 等
│   │   ├── song_select.d.ts    # SongListItem、SortOption 等
│   │   ├── youtube.d.ts        # YouTube IFrame API 型別
│   │   └── env.d.ts            # 全域型別（Window.ytPlayer）
│   │
│   └── styles/theme.css        # Tailwind v4 @import + @theme 自訂屬性
│
├── public/                     # 靜態資源（og_image、homepage_images）
├── data/                       # 執行時期資料（tsl.db、hmac_private_key）
│                               # ⚠️ 由 .gitignore 排除
│
└── py_tools/                   # Python 離線歌詞轉換腳本（非執行時期）
    └── 003_* ~ 009_*           # 各種格式→JSON 時間譜轉換器
```

---

## 資料庫設計

### 連線

- SQLite 檔案：`data/tsl.db`
- 模式：**WAL**（Write-Ahead Logging）
- busy_timeout：5000ms
- 連線池：**max 10**（`r2d2`）
- 自訂 `ConnGuard` 追蹤未釋放連線（超過 8 個時警告）

### 遷移系統

遷移檔案位於 `src/database/migration/`，依序執行：

| 編號 | 檔案 | 說明 |
|---|---|---|
| 001 | `001_create_songs_table.sql` | 建立 song 表（含 `id` 自動遞增主鍵、`translation_*` 獨立欄位） |
| 002 | `002_fix_translation_field.sql` | 重構 translation 為 JSON 欄位、新增 `furigana` 欄位、新增 `idx_title` 索引 |
| 003 | `003_drop_id_column.sql` | 移除 `id` 自動遞增欄位、以 `song_id` 作為唯一主鍵 |
| 004 | `004_create_artists_table.sql` | 建立 artist 表（`artist_id`、`romaji_name`、`original_name`、`created_at`） |
| 005 | `005_tighten_song_fields.sql` | 表名改為 `songs`、所有欄位設 NOT NULL 預設值、版本 JSON 修正 |

遷移版本以 `PRAGMA user_version` 追蹤，當前版本：**4**（對應 005 遷移）。

### songs 表結構

| 欄位 | 類型 | 說明 |
|---|---|---|
| `song_id` | INTEGER UNIQUE PK | 歌曲編號（手動指定，非自動遞增） |
| `available` | BOOLEAN | 是否公開顯示 |
| `hidden` | BOOLEAN | 是否隱藏（`null` = 未設定） |
| `folder` | TEXT | R2 路徑中的目錄名（格式：`"{song_id}_{title}"`） |
| `art` | TEXT | 專輯封面圖片 URL |
| `artist` | TEXT | 藝人 ID（逗號分隔的數字字串，關聯 artist 表） |
| `lyricist` | TEXT | 作詞者 ID（格式同 artist） |
| `title` | TEXT | 歌曲標題 |
| `subtitle` | TEXT | 副標題（`\n` 換行） |
| `album` | JSON | `{"name": "", "link": ""}` |
| `versions` | JSON | 版本陣列（見下方說明） |
| `is_duet` | BOOLEAN | 是否為對唱歌曲 |
| `furigana` | BOOLEAN | 是否提供日文假名讀音 |
| `translation` | JSON | `{"available": bool, "author": "", "cite": "", "modified": bool}` |
| `updated_at` | DATE | 最後更新日期（`YYYY-MM-DD`） |
| `lang` | TEXT | 語言代碼（`zh`、`en`、`ja`、`kr`、`se` 等） |
| `credits` | JSON | 製作名單（`performance`、`song_writing`、`engineering` 陣列） |

**versions JSON 格式**：

```json
[
    { "version": "original", "id": "YouTube影片ID", "default": true, "duration": "M:SS" },
    { "version": "instrumental", "id": "YouTube影片ID", "duration": "M:SS" }
]
```

版本類型慣例：`original`（原曲）、`instrumental`（伴奏）、`the_first_take`（THE FIRST TAKE）、`live`（LIVE）。

**artist 欄位格式說明**：`artist` 與 `lyricist` 欄位儲存的是以逗號分隔的數字字串（如 `"1,2,3"`），這些數字對應 `artist` 表中的 `artist_id`。前端透過 `/api/artists?ids=1,2,3` 批次查詢取得顯示名稱。

### artists 表結構

| 欄位 | 類型 | 說明 |
|---|---|---|
| `artist_id` | INTEGER UNIQUE | 藝人編號 |
| `romaji_name` | TEXT | 羅馬拼音名稱（用於英文顯示） |
| `original_name` | TEXT | 原始語言名稱（如日文漢字、中文） |
| `created_at` | DATE | 建立日期 |

---

## API 端點

所有端點前綴為 `/api`。🔐 標記表示需 `Authorization: Bearer <JWT>` header。

### 狀態

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/status` | 伺服器狀態、版本、uptime |

### 認證（GitHub OAuth）

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/auth/github` | 發起 GitHub OAuth 登入流程 |
| GET | `/api/auth/callback` | GitHub 回呼端點（簽發 JWT，重導回前端） |
| GET | `/api/auth/me` 🔐 | 回傳當前登入使用者資訊 |

### 歌曲

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/songs/list` | 歌曲摘要清單（含 HMAC 簽章） |
| GET | `/api/songs/{song_id}` | 單首歌曲完整資料 |
| POST | `/api/songs/create` 🔐 | 建立新歌曲（同時在 R2 建立空歌詞檔） |
| POST | `/api/songs/update` 🔐 | 更新歌曲中繼資料（自動同步 R2 version 變化） |
| POST | `/api/songs/delete` 🔐 | 刪除歌曲（同時刪除 R2 歌詞檔） |
| POST | `/api/songs/verify` | 驗證 HMAC 簽章（防止竄改 `available` 狀態） |

### 歌詞

| 方法 | 路徑 | 說明 |
|---|---|---|
| POST | `/api/lyrics/update` 🔐 | 上傳/更新歌詞 JSON 至 R2 |

### 藝人

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/artists?id=1,2,3` | 批次查詢藝人（支援 `?id=` 或 `?ids=`） |
| GET | `/api/artists/list` | 所有藝人清單 |
| POST | `/api/artists/create` 🔐 | 建立藝人 |

### 身分驗證流程

1. 前端點擊登入 → 導向 `GET /api/auth/github`
2. 後端將前端 Origin base64 編碼後放入 `state` 參數，重導至 GitHub 授權頁
3. 使用者授權後 GitHub 回呼 `GET /api/auth/callback?code=...&state=...`
4. 後端以 code 換 access_token → 取得 GitHub 使用者資訊 → 驗證 `ALLOWED_GITHUB_ID` → 簽發 JWT（7 天有效）
5. 重導回前端 `/#token=<jwt>`，前端儲存 token 供後續 🔐 請求使用

### 簽章驗證

歌曲列表中的每首歌附帶一個 HMAC-SHA256 `signature`（簽章內容：`"{song_id}:{available}"`）。前端可透過 `/api/songs/verify` 驗證簽章，確保歌曲的 `available` 欄位未被中間人篡改。

---

## 歌詞時間譜格式

歌詞以 JSON 格式儲存於 Cloudflare R2，路徑為 `{song_id}_{folder}/{version}.json`（例如 `1_HO-YO-MiX-On-the-Journey/original.json`），並透過 `https://lyric.tslyric.com/` 公開讀取。

檔案頂層為陣列，每個元素代表一行歌詞。

### 完整範例

```json
[
    {
        "time": "00:12.50",
        "type": "prelude"
    },
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
            "translation": "不息，歲月"
        }
    },
    {
        "time": "02:03.84",
        "text": [
            { "phrase": "就算", "duration": 48 },
            { "phrase": "化為", "duration": 45, "kiai": true },
            { "phrase": "泡沫", "duration": 96 }
        ],
        "translation": "たとえ泡となっても",
        "is_secondary": true
    },
    {
        "time": "04:36.00",
        "type": "end"
    }
]
```

### 歌詞行屬性

| 屬性 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `time` | string | ✓ | 該行開始時間，格式 `"mm:ss.SS"`（如 `"01:56.57"`） |
| `type` | string | | 特殊行類型：`"prelude"`（前奏）、`"interlude"`（間奏）、`"end"`（歌曲結束） |
| `text` | array | | 主聲片語陣列（prelude/interlude/end 可省略，將自動生成） |
| ↳ `phrase` | string | ✓ | 文字片段（可為空字串作為停頓） |
| ↳ `duration` | number | ✓ | 持續時間，單位為**厘秒**（1/100 秒）。設為 `0` 時自動替換為預設值 `100`（即 1 秒） |
| ↳ `kiai` | boolean | | 是否強調顯示（啟用時該片語會有白色光暈） |
| ↳ `pronounciation` | string | | 讀音標註（主要為日文假名設計，以 `<ruby>` 標籤呈現） |
| `translation` | string | | 該行歌詞的翻譯文字 |
| `is_secondary` | boolean | | 對唱模式：該行為第二歌手（文字靠右顯示） |
| `is_together` | boolean | | 對唱模式：該行為合唱（文字置中顯示） |
| `background_voice` | object | | 背景和聲（結構同主聲：`time`、`text`、`translation`） |
| ↳ `time` | string | ✓ | 和聲開始時間 |
| ↳ `text` | array | ✓ | 和聲片語陣列（同 `text` 格式） |
| ↳ `translation` | string | | 和聲翻譯 |

### 特殊行類型行為

- **`prelude`／`interlude`**：`text` 自動設為 `[{ "phrase": "● ● ●", "duration": 下一行 time - 此行 time }]`
- **`end`**：`text` 自動設為 `[{ "phrase": "創作者：", "duration": 0 }, { "phrase": "<作詞者或藝人名>", "duration": 歌曲總長 - 此行 time }]`
- 若該行設有 `type` 且同時提供 `text`，則以提供的 `text` 為準

### 對唱規則

- `is_secondary` 與 `is_together` **互斥**，同時設定不會有效果
- 需在歌曲資料中將 `is_duet` 設為 `true` 才會啟用對唱排版
- 背景和聲（`background_voice`）會跟隨主旋律的對齊方向

### 前端處理流程

1. `parseLyrics()` 讀取原始 JSON → 將 `time` 字串轉為秒數（`number`）
2. 將 `duration` 厘秒轉為秒（`÷ 100`），搭配 `delay[]` 計算每片語的漸層進度
3. 計算 `computedEndTime`（該行最晚的結束時間，含背景和聲）
4. `useLyricTimeline` 根據 `currentTime` 判斷哪些行為 active，並即時產生漸層 CSS
5. `generatePhraseStyle()` 產生每個片語的 `background-image: linear-gradient(...)` 樣式，實作逐詞著色動畫

---

## 前端設計系統

本專案使用**玻璃擬態（Glassomorphism）**設計語言，所有 UI 元件都統一遵循以下設計詞彙。詳細規範見 `CLAUDE.md`。

### 核心樣式配方

```html
<!-- 標準玻璃卡片 -->
<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
  <!-- 內容 -->
</div>

<!-- 玻璃按鈕 -->
<button class="bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40
               rounded-full transition-all duration-300 shadow-lg">
</button>

<!-- 模態框（一律使用 Teleport + Transition） -->
<Teleport to="body">
  <Transition name="modal">
    <div class="bg-black/60 backdrop-blur-sm fixed inset-0 z-40">
      <div class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
        <!-- 內容 -->
      </div>
    </div>
  </Transition>
</Teleport>
```

### 設計詞彙表

| 類別 | 可用 class | 說明 |
|---|---|---|
| 玻璃填充 | `bg-white/3` ~ `/30` | 透明度越高越不透明；`/5`–`/10` 為卡片常用 |
| 玻璃邊框 | `border-white/4` ~ `/40` | `/10` 為標準；hover 時可提升至 `/20`–`/40` |
| 文字 | `text-white/25` → `text-white` | `/25`（disabled）→ `/40`–`/60`（次要）→ `/80`–`/90`（主要）→ `white`（標題） |
| 模糊 | `backdrop-blur-sm`、`xl`、`2xl` | `xl` 最常見（導航/面板）；`2xl`（模態框） |
| 圓角 | `rounded-2xl`（卡片）、`rounded-3xl`（模態框/手機面板）、`rounded-full`（按鈕） |
| 陰影 | `shadow-2xl`、`shadow-lg` | 模態框/面板用 `2xl`；按鈕/導航用 `lg` |

### 品牌色（`#FC3C44`）

`#FC3C44` **僅用於**播放/暫停按鈕和進度/音量條的填充色。絕不用於文字、邊框或裝飾。

### 頁面背景

一律使用從專輯封面提取的深色漸層（由 `useAlbumColors` composable 在 Canvas 上取樣像素產生）：

```css
background: linear-gradient(135deg, dark1, dark2, dark3);
/* 預設備用色：#1a1a2e → #16213e → #0f3460 */
```

---

## 開發環境設定

### 前置需求

- **Rust**（stable toolchain，含 `rustfmt`）
- **Node.js** ≥ 20.19.0 或 ≥ 22.12.0
- **npm**（隨 Node.js 提供）

### 安裝與啟動

```bash
# 1. 安裝前端依賴
npm ci

# 2. 啟動前端開發伺服器（Vite，localhost:5173）
npm run dev

# 3. 啟動後端伺服器（需設定環境變數，見下方）
cargo dev          # 等同於 dotenv -- run --bin tsl_api
```

後端預設監聽 `0.0.0.0:8000`。

### 常用指令

```bash
# 前端
npm run dev            # Vite 開發伺服器
npm run build          # 生產建置
npm run type-check     # vue-tsc 型別檢查
npm run lint           # ESLint（--fix --cache）
npm run format         # Prettier 格式化
npm run format:check   # Prettier 格式檢查

# 後端
cargo dev              # 執行（需 dotenv）
cargo fmt --all -- --check  # 格式檢查
cargo build --release       # 生產建置
```

### 本機開發注意事項

- 前端在開發模式下自動將 API 請求指向 `http://localhost:8000/api`
- 歌詞檔案從 `https://lyric.tslyric.com/`（R2 公開域名）讀取
- 後端需有效的環境變數才能啟動（見下方）
- `data/` 目錄下的 `tsl.db` 和 `hmac_private_key` 由 `.gitignore` 排除

---

## 環境變數

後端在啟動時從環境變數讀取所有機密設定（透過 `LazyLock` 延遲初始化）。

| 變數 | 必要 | 說明 |
|---|---|---|
| `HMAC_KEY` | ✓ | HMAC-SHA256 私鑰（64 字元 hex，即 32 bytes） |
| `JWT_SECRET` | ✓ | JWT 簽署密鑰（任意字串） |
| `ALLOWED_GITHUB_ID` | ✓ | 允許登入的 GitHub 使用者數字 ID |
| `GITHUB_CLIENT_ID` | ✓ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✓ | GitHub OAuth App Client Secret |
| `ALLOWED_ORIGINS` | | CORS 允許的來源（逗號分隔），預設 `https://tslyric.com, https://edit.tslyric.com` |
| `R2_BUCKET_NAME` | ✓ | Cloudflare R2 儲存桶名稱 |
| `R2_ENDPOINT` | ✓ | R2 端點 URL（`https://<account>.r2.cloudflarestorage.com`） |
| `R2_ACCESS_KEY_ID` | ✓ | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | ✓ | R2 Secret Access Key |

`HMAC_KEY` 若未在環境變數中設定，後端會嘗試從 `data/hmac_private_key` 檔案讀取。

---

## CI／CD

### PR 檢查（`.github/workflows/check.yml`）

在 PR 開啟/推送至 `main` 時觸發，以路徑過濾決定執行哪些 job：

| Job | 觸發條件 | 檢查內容 |
|---|---|---|
| **Rust** | `Cargo.toml`、`src/**` 變更 | `cargo fmt --all -- --check` |
| **Docker** | `Dockerfile`、`docker-compose.yml` 變更 | `docker build -t tsl .` |
| **Vue.js** | `web/**`、`package.json` 等變更 | `npm ci` → `format:check` → `vue-tsc --noEmit` → `vite build` |
| **Version** | `Cargo.toml`、`package.json` 變更 | 驗證兩者版本號一致 |

### 部署（`.github/workflows/build.yml`）

在 `main` 分支上的 `Cargo.toml` 版本號變更時觸發：

1. 偵測版本變更（比對 `HEAD~1`）
2. `docker build -t tsl .`
3. `docker save --output tsl.tar`
4. 透過 Cloudflare Tunnel（`cloudflared access ssh`）上傳 `tsl.tar` 至部署主機
5. 遠端執行 `docker load -i tsl.tar` + 重啟 docker-compose

### 版本號規則

`Cargo.toml` 與 `package.json` 中的 `version` 欄位**必須一致**，否則 CI 會失敗。版本號遵循 `MAJOR.MINOR.PATCH` 格式。

---

## 部署

### Docker 建置

使用多階段建置（`Dockerfile`）：

- **階段一**（`rust:bookworm`）：安裝 `libsqlite3-dev`、編譯 `--release`
- **階段二**（`debian:bookworm-slim`）：僅保留執行檔與 `libsqlite3-0`、`ca-certificates`

最終映像檔僅包含 `tsl_api` 二進位檔，監聽 port `8000`。

### 伺服器架構

```
Cloudflare DNS
  ├── tslyric.com       → 前端靜態主機（Vite SPA）
  ├── api.tslyric.com   → 後端 API 伺服器（Docker 容器，port 8000）
  └── lyric.tslyric.com → Cloudflare R2（歌詞 JSON 公開讀取）
```

- 前端與後端之間以 CORS 溝通（白名單由 `ALLOWED_ORIGINS` 控制）
- 後端與部署主機之間透過 Cloudflare Tunnel 連接（無需公開 IP）
- R2 物件的公開讀取由 Cloudflare 的 CDN 提供

---

## 補充說明

### 無測試框架

本專案目前**沒有自動化測試**（無論前端或後端）。資料庫模組有一個簡單的記憶體內遷移測試（`#[cfg(test)]`），但 CI 不會執行它。開發時以手動驗證為主。

### Python 工具腳本

`py_tools/` 目錄中的腳本（`003_*` 至 `009_*`）是離線的歌詞格式轉換工具，用於將各種外部格式（Karaoke-time CSV、LRC、XML、HTML）轉換為本專案的時間譜 JSON。這些腳本**不參與建置或執行時期**，僅在新增歌曲時手動執行。

### 編輯用後台

`edit.tslyric.com` 是一個獨立的前端實例，用於歌曲中繼資料的編輯與歌詞時間譜的調整。它透過相同的 API 與後端互動，使用 GitHub OAuth 登入進行身分驗證。

### 前端狀態管理策略

- **`localStorage`**：使用者偏好（主題顏色 `themeColor`、歌詞字型大小 `lyricFontSize`）
- **`sessionStorage`**：會話範圍資料（歌曲列表 `songList`、版本選擇 `selectedVersions`、藝人快取 `artists_name`、歌曲詳細快取 `detail_{id}`）
- **響應式狀態**：`ref`／`reactive`（元件內）、模組級 `reactive` singleton（`useArtist` 的 `artistCache`）
- **YouTube 播放器**：全域 `window.ytPlayer`（型別定義於 `web/types/env.d.ts`）

### 手機版設計

- 主要斷點：`md:`（768px）
- 桌面版與手機版在同一個元件中渲染，以 `hidden md:flex`／`md:hidden` 切換
- 手機版有專屬的 `MobileController.vue`（310 行，固定底部面板）
- 同時支援觸控與滑鼠事件（`@touchstart.prevent` + `@mousedown`）
- 手機版隱藏 YouTube iframe（`w-0 h-0 overflow-hidden opacity-0 pointer-events-none`），僅保留音訊

### 歌詞容器雙重渲染

由於桌面版與手機版同時存在於 DOM 中（以 `hidden`／`md:hidden` 隱藏），同一個 `LyricsContainer` 可能被渲染兩次。`scrollToLineIndex()` 在 `global.ts` 中透過 `querySelectorAll` + `offsetParent` 檢查自動選擇可見的實例進行滾動。
