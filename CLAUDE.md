# CLAUDE.md — 時間同步歌詞 (Time-Synced Lyrics / 同步開唱 / tslyric.com)

A full-stack web-based karaoke music player with phrase-level synchronized lyrics over YouTube playback. Vue 3 frontend + Rust/Actix backend, SQLite storage, Cloudflare R2 object storage, GitHub OAuth auth.

---

## Tech Stack

- **Frontend**: Vue 3.5 (Composition API, `<script setup lang="ts">`), vue-router 4, Vite 8, TypeScript ~5.9, Tailwind CSS v4 via `@tailwindcss/vite` plugin. **NO `tailwind.config.js`** — theming is done via `@theme` in `web/styles/theme.css`. Google Fonts loaded in `index.html` (Playfair Display, Noto Sans, Poppins, Source Sans Pro, Material Icons).
- **Note**: `LoadingOverlay.vue` is the sole Options API outlier — do NOT copy its pattern. All other components use `<script setup lang="ts">`.
- **Backend**: Rust edition 2024, Actix-web 4.12, Tokio, SQLite (`rusqlite` + `r2d2` pool, WAL mode), Cloudflare R2 via `aws-sdk-s3`, GitHub OAuth + JWT, HMAC-SHA256.
- **CI**: GitHub Actions. PR checks run `cargo fmt`, Prettier, `vue-tsc --noEmit`, `vite build`, and version-sync checks. Docker deploy triggers on version bump.
- **Lint/Format**: ESLint flat config (vue essential rules), Prettier (`tabWidth: 4`, double quotes, semicolons).
- **Deliberate absences**: No test framework, **no Pinia/Vuex** (pure Composition API `ref`/`computed`/`watch`).

## Commands

```bash
npm run dev           # Vite dev server
npm run build         # Production build
npm run type-check    # vue-tsc --build
npm run lint          # ESLint --fix --cache
npm run format        # Prettier --write
npm run format:check  # Prettier --check
cargo dev             # dotenv -- run --bin tsl_api
cargo fmt --all -- --check
```

## Project Structure

```
Cargo.toml, package.json
src/                    # Rust backend
  main.rs, lib.rs, error.rs, utils.rs
  webpage/              # Actix routes: mod.rs, auth/, songs/, lyrics/, artists/
  database/             # SQLite: mod.rs, song.rs, artist.rs, migration/
web/                    # Vue frontend
  main.ts, App.vue
  router/index.ts       # Routes: / (Home), /songs (SongSelect), /player/:id? (Player)
  components/
    home/               # Home.vue, Card.vue
    player/             # Player.vue, YTPlayer, PlayerNav, SongInfo, ProgressBar, PlaybackControls, MobileController, ErrorDisplay
      lyrics/           # LyricsContainer, LyricLine, LyricPhrase, TranslationBar
      modals/           # SettingModal, ShareModal, AboutModal, CreditModal
    song_select/        # SongSelect, SearchBar, SongCard, SongDetailModal, SongSelectNav, RefreshModal
    LoadingOverlay.vue
  composables/
    hooks/              # useSongs, useLyricTimeline, useAlbumColors, useProgressBar, useVolumeControl, useTranslation, useSongSelect, useArtist
    utils/              # config.ts (constants/API_BASE_URL), global.ts (formatTime, scrollToLineIndex, copyToClipboard)
  styles/theme.css      # Tailwind v4 @import + @theme (--font-sans: Noto Sans)
  types/                # player.d.ts, song_select.d.ts, youtube.d.ts, env.d.ts
public/                 # Static assets
data/                   # Runtime: tsl.db, hmac_private_key (gitignored)
py_tools/               # Python lyric-conversion scripts (not runtime)
```

## Path Aliases

| Alias | Target |
|---|---|
| `@` | `web/` |
| `@components` | `web/components/` |
| `@composables` | `web/composables/` |

Import from these aliases for cross-tree references; use relative `./` imports for same-directory files.

---

## CRITICAL: Glassomorphism Design Language

This is the signature visual style used **consistently across the entire app**. Every glass surface layers on top of a dark, dynamically-colored page background.

### Core Recipe

```html
<!-- Standard glass card -->
<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
  <!-- content -->
</div>

<!-- Darker glass (mobile panels) -->
<div class="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
  <!-- content -->
</div>

<!-- Modal pattern — ALWAYS use Teleport + Transition + backdrop + card -->
<Teleport to="body">
  <Transition name="modal">
    <div class="bg-black/60 backdrop-blur-sm fixed inset-0 z-40">
      <div class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
        <!-- modal content -->
      </div>
    </div>
  </Transition>
</Teleport>
```

### Additional UI Patterns

Copy these directly for common UI elements:

**Hoverable card** (subtle — no blur, raise fill on hover):
```html
<article class="group bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 cursor-pointer">
```

**Icon button** (circular, glass border):
```html
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg">
  <span class="material-icons text-xl">icon_name</span>
</button>
```

**Small ghost icon** (no fill, just icon):
```html
<button class="p-2 text-white/50 hover:text-white rounded-full transition-colors">
  <span class="material-icons text-xl">close</span>
</button>
```

**Search input**:
```html
<input class="w-full pl-10 pr-4 py-2.5 bg-white/[0.07] border border-white/6 rounded-xl text-white/85 placeholder-white/25 text-sm outline-none focus:bg-white/12 focus:border-white/20">
```

**Version badge** (colored pill with glass blur):
```html
<span class="px-1.5 py-0.5 text-[9px] rounded-md border border-white/20 uppercase backdrop-blur-md"
      :class="versionClass">
```
Version colors: `bg-cyan-600/80` (original), `bg-purple-600/80` (instrumental), `bg-zinc-900/80` (standard), `bg-red-400/80` (live/TFT).

**Nav bar** (glass over dominant album color):
```html
<div class="top-0 fixed w-full py-4 z-50 backdrop-blur-xl"
     :style="{ background: `linear-gradient(to bottom, ${dominantColor}40 0%, ${dominantColor}10 100%)` }">
```

**Glass dropdown menu**:
```html
<div class="absolute top-full mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-glass-drop">
```
Animation: `opacity 0 + translateY(8px) scale(0.96)` → enter.

### Design Tokens

**Use these tokens. Do NOT invent new colors, blurs, or radii.**

| Category | Available Classes | Usage Notes |
|---|---|---|
| **Glass fills** | `bg-white/3`, `/4`, `/5`, `/6`, `/10`, `/12`, `/15`, `/20`, `/30` | Higher = more opaque. Use `/5`–`/10` for cards, `/3`–`/6` for subtle surfaces. |
| **Glass borders** | `border-white/4`, `/6`, `/10`, `/12`, `/15`, `/20`, `/30`, `/40` | `/10` is the standard. Step up on hover (`/20` → `/40`). |
| **Text** | `text-white/25` → `/35` → `/40` → `/50` → `/60` → `/70` → `/80` → `/90` → `text-white` | Disabled → secondary/meta → body → primary → headings → active |
| **Blur** | `backdrop-blur-sm` (backdrops), `backdrop-blur-xl` (nav/panels — **most common**), `backdrop-blur-2xl` (modal cards), `blur-xl` (background images) | |
| **Corners** | `rounded-2xl` (cards, containers), `rounded-3xl` (modals, mobile panels), `rounded-full` (icon buttons, toggles) | |
| **Shadows** | `shadow-2xl` (modals, panels), `shadow-lg` (buttons, nav), `shadow-lg shadow-red-500/20` (play button) | |

### Brand Accent (`#FC3C44`)

```html
<!-- Red accent — ONLY for play button and progress/volume bar fills -->
<button class="bg-[#FC3C44] hover:bg-[#e8353d] text-white rounded-2xl shadow-lg shadow-red-500/20">
  <!-- play/pause icon -->
</button>
```

**`#FC3C44` is sacred.** It appears only on the play/pause button and progress/volume bar fills. Never use it for text, borders, or decorations.

### Progress Bars

```html
<!-- Track: bg-white/12 + rounded-full. Fill: bg-[#FC3C44] absolute. Hover expands height. -->
<div class="relative w-full rounded-full overflow-hidden transition-[height] duration-300 bg-white/12"
     :class="{ 'h-1': !hovering && !dragging, 'h-1.5': hovering, 'h-4': dragging }">
  <div class="absolute top-0 left-0 h-full rounded-full bg-[#FC3C44]"
       :style="{ width: percent + '%' }" />
</div>
<!-- Time labels: font-mono text-white/40 -->
<span class="text-[10px] font-mono text-white/40 tracking-tight">{{ formatTime(currentTime) }}</span>
```

### Page Background

Always a dark gradient extracted from album art via `useAlbumColors`:
```css
/* Generated by useAlbumColors composable */
background: linear-gradient(135deg, dark1, dark2, dark3);
/* Fallback: #1a1a2e → #16213e → #0f3460 */
```

### Lyric Highlighting

```css
/* Phrase-level karaoke fill — runtime gradient width tracks singing progress */
background-image: linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(132,132,132,0.35) 100%);
/* Applied with text-transparent bg-clip-text on the phrase span */
```

Active kiai phrases get a soft glow: `text-shadow-[0_0_5px_rgba(255_255_255/0.5)]`.

### Animations

Keep animations in scoped `<style>` blocks:
- `animate-modal-pop` — scale(0.95)→scale(1) + fade in for modals
- `scale-pulse` — 30s background album art scale pulse
- `reflection-scan` — diagonal sheen across lyrics background (`mix-blend-mode: soft-light`)
- `animate-fade-in` — simple opacity transition

---

## Mobile Design Guidelines

### Breakpoints

Use **Tailwind v4 utility classes only** — **NEVER write raw `@media` queries.** Primary breakpoint is `md:` (768px). Others: `sm:` (640px), `lg:` (1024px), `xl:` (1280px).

### Pattern 1 — Dual Layout (most common)

Render both desktop and mobile layouts in the same component, toggle with Tailwind:

```html
<!-- Desktop -->
<div class="hidden md:flex flex-1 overflow-hidden pt-20">
  <!-- two-column layout -->
</div>

<!-- Mobile -->
<div class="md:hidden flex-1 flex flex-col overflow-hidden pt-16">
  <!-- fullscreen layout -->
</div>
```

### Pattern 2 — Dedicated Mobile Component

For complex mobile UI (e.g. `MobileController.vue`, 310 lines), extract to a separate file. The parent reads the component's measured height via `ResizeObserver` and adjusts surrounding layout:

```typescript
// Parent: offset lyrics to avoid occlusion by fixed bottom panel
const controllerPanelHeight = ref(0);
// Use in template:
// :style="{ paddingBottom: controllerPanelHeight + 20 + 'px' }"
```

### Mobile Conventions

- **Handle BOTH touch AND mouse events**: `@touchstart.prevent` / `@touchmove` + `@mousedown`
- **Large touch targets**: play button `w-24 h-12`, icon buttons `rounded-full`
- **Fixed bottom panels**: `fixed bottom-0 left-0 right-0 z-50`
- **Audio-only video**: hide the YouTube iframe on mobile with `w-0 h-0 overflow-hidden opacity-0 pointer-events-none` (audio keeps playing)
- **Modals**: `p-3 md:p-4`, `max-h-[90vh] md:max-h-[85vh]`
- **Nav**: `hidden sm:flex` for desktop items, `sm:hidden` for mobile hamburger
- **Song grid**: `grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6`
- **Search bar**: `fixed bottom-5 w-full sm:w-1/2`
- If a component renders a lyrics container in both desktop and mobile layouts, the same `LyricsContainer` may be in the DOM twice — the scroll helper (`scrollToLineIndex` in `global.ts`) handles this by picking the visible instance via `querySelectorAll`.

---

## Component Composition Rules

### Keep Components Small

**Most components should be 50–150 lines.** Only page-level orchestrators exceed 400 lines. If a single file grows beyond ~200 lines, consider extracting focused sub-components.

| Size | Examples |
|---|---|
| Tiny (<50 lines) | `Card.vue`, `PlaybackControls.vue`, `ErrorDisplay.vue`, `ProgressBar.vue` |
| Small (50–150) | `SongCard.vue`, `LyricPhrase.vue`, `SongInfo.vue`, `PlayerNav.vue`, `LyricsContainer.vue`, `YTPlayer.vue` |
| Medium (150–300) | `SearchBar.vue`, `SongDetailModal.vue`, `SettingModal.vue`, `MobileController.vue` |
| Large (>400, orchestrators only) | `Player.vue`, `Home.vue` |

### Organize by Page/Feature

```
web/components/
├── home/            # Home page: Home.vue, Card.vue
├── player/          # Player page: Player.vue + sub-components
│   ├── lyrics/      #   Lyric rendering sub-tree
│   └── modals/      #   Player-specific modals
└── song_select/     # Song selection page
```

### Component Skeleton

Every component follows this structure:

```vue
<script setup lang="ts">
import type { SomeType } from "@/types/...";

// ── Props ──
const props = defineProps<{
    title: string;
    isActive: boolean;
}>();

// ── Emits ──
const emit = defineEmits<{
    (e: "select", id: string): void;
    (e: "update:isActive", value: boolean): void;
}>();

// ── Composables / State ──
const localState = ref<string>("");
</script>

<template>
  <!-- template uses kebab-case for props/events -->
  <div :class="{ 'text-white': isActive }" @click="emit('select', 'id')">
    {{ title }}
  </div>
</template>

<style scoped>
  /* only component-specific @keyframes */
</style>
```

### Props & Data Flow

- **Props**: use inline TypeScript type literals in `defineProps<{...}>()` — not runtime validation objects.
- **Callbacks as props**: when a deeply-nested child needs to call a parent function (e.g., `getPhraseStyle`, `isActivePhrase`), pass it as a function prop — **do NOT use provide/inject**.
- **v-model**: use the `update:` emit prefix convention (`defineEmits<{ (e: "update:isHovering", value: boolean): void }>()`).
- **Event naming**: camelCase in `defineEmits` (`barMouseDown`), kebab-case in templates (`@bar-mouse-down`).

### Modal Recipe

Every modal follows this pattern:

```vue
<Teleport to="body">
  <Transition name="modal">
    <div v-if="open" class="bg-black/60 backdrop-blur-sm fixed inset-0 z-40 flex items-center justify-center p-3 md:p-4"
         @click.self="$emit('close')">
      <div class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        <!-- modal header, body, footer -->
      </div>
    </div>
  </Transition>
</Teleport>
```

### No Barrel Exports

**Do NOT create `index.ts` re-export files.** Import components directly:

```typescript
// ✅ Correct
import PlayerNav from "@components/player/PlayerNav.vue";
import { useSongs } from "@/composables/hooks/useSongs";

// ❌ Wrong — no barrel files exist, don't create them
import { PlayerNav, ProgressBar } from "@components/player";
```

---

## State Management

- **No Pinia, Vuex, Redux, or Zustand.** State is managed with Vue 3 Composition API primitives: `ref`, `computed`, `reactive`, `watch`.
- Extract reusable stateful logic into composables under `web/composables/hooks/`.
- **Module-level shared state** (see `useArtist.ts`): use a `reactive` singleton cache at module scope + batched fetch pattern with a `Map` of resolve-listeners.
- **Persistence**: `localStorage` for user preferences (`lyricFontSize`, `themeColor`), `sessionStorage` for session-scoped data (`volume`, `songList`, `selectedVersions`).
- **Theme colors**: set CSS custom properties on `document.body` (`--theme-bg`, `--theme-nav`).
- **YouTube player**: exposed as a global `window.ytPlayer` reference (typed in `web/types/env.d.ts`).

---

## Coding Conventions

### TypeScript

- Use `import type { ... }` for all type-only imports.
- Types are centralized in `web/types/*.d.ts` (`player.d.ts`, `song_select.d.ts`, `youtube.d.ts`, `env.d.ts`).
- Prefer interfaces and discriminated unions. Use `Processed*` naming for runtime-transformed types (e.g., `ProcessedLine`).

### Naming

| Category | Convention | Example |
|---|---|---|
| Component files | PascalCase | `MobileController.vue`, `SongDetailModal.vue` |
| Composables | camelCase `use*` | `useSongSelect`, `useAlbumColors` |
| Utility functions | camelCase | `formatTime`, `scrollToLineIndex` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `ORIGINAL`, `THE_FIRST_TAKE` |
| TypeScript types | PascalCase | `ProcessedLine`, `SongWithDisplay` |
| Template props/events | kebab-case | `:mobile-panel-collapsed`, `@update:panel-height` |
| Emit names (code) | camelCase | `barMouseDown`, `update:isHovering` |

### Imports

```typescript
// Cross-tree: use path aliases
import PlayerNav from "@components/player/PlayerNav.vue";
import { formatTime } from "@/composables/utils/global";

// Same directory: use relative
import LyricLine from "./LyricLine.vue";
```

### Formatting

- **4-space indentation** (Prettier `tabWidth: 4`)
- **Double quotes**
- **Semicolons**
- Trailing commas where Prettier adds them

### Comments

- Bilingual: Traditional Chinese (zh-TW) for explanations, English for technical identifiers.
- Use `// ── Section ──` decorative dividers to organize `<script>` blocks.
- Document the *why* for non-obvious logic (e.g., dual lyric container scrolling behavior).

### Constants

Centralize all constants in `web/composables/utils/config.ts`. Key exports:
```typescript
export const IS_DEV = import.meta.env.DEV;
export const API_BASE_URL = IS_DEV ? "http://localhost:8000/api" : "https://api.tslyric.com/api";
export const ORIGINAL = "original";
export const INSTRUMENTAL = "instrumental";
export const LIVE = "live";
export const THE_FIRST_TAKE = "the_first_take";
export const TSL_PLAYER_LINK_BASE = "https://tslyric.com/player/?song=";
export const TSL_SUFFIX = "&utm_source=tsl_sync";
```

Always import these rather than hardcoding strings. Use `IS_DEV` for dev-only behavior.

---

## Backend (Rust) Conventions

### Module Structure

```
src/
├── main.rs              # tokio entry: db::init() + webpage::run(), binds 0.0.0.0:8000
├── lib.rs
├── error.rs             # Shared error type, impl actix_web::ResponseError
├── utils.rs             # HMAC signature, Shift-JIS decode, uptime
├── database/
│   ├── mod.rs           # r2d2 pool (max 10 conns, WAL mode), ConnGuard leak tracking
│   ├── song.rs
│   ├── artist.rs
│   └── migration/       # Numbered SQL migrations (001–005)
└── webpage/
    ├── mod.rs           # CORS config, server setup
    ├── status.rs
    ├── auth/            # GitHub OAuth (login/callback), JWT (me)
    ├── songs/           # create, list, song, update, delete, verify
    ├── lyrics/          # update, r2.rs (Cloudflare R2 S3-compatible storage)
    └── artists/         # artist, list, create, delete
```

### Handler Patterns

**GET handler**:
```rust
#[get("/api/songs/{song_id}")]
pub async fn handler(song_id: web::Path<i32>) -> Result<impl Responder, ServerError> {
    let id = song_id.into_inner();
    let song = web::block(move || database::song::Song::find_by_id(id as i64))
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??;
    Ok(HttpResponse::Ok().json(song))
}
```

**POST handler (protected)**:
```rust
#[post("/api/songs/create")]
pub async fn handler(req: HttpRequest, body: web::Json<CreateSongRequest>)
    -> Result<impl Responder, ServerError>
{
    auth::extract_bearer(&req)?;          // 401 unless valid JWT
    let req = body.into_inner();
    // ... synchronous work inside web::block(move || ...)
    Ok(HttpResponse::Created().json(serde_json::json!({ "ok": true, "song_id": song_id })))
}
```

### Key Rust Conventions

- **Never block the async runtime**: all synchronous rusqlite work goes inside `web::block(move || ...)`. Unwrap the double `Result` with `??` after `.map_err(|e| ServerError::Internal(e.to_string()))`.
- **Domain-organized routes**: each resource gets a subdirectory under `src/webpage/` with individual handler files (`create.rs`, `detail.rs`, `list.rs`, etc.). Register in `src/webpage/mod.rs`.
- **DB access**: call `database::get_connection()` for reads (returns `ConnGuard`); pass `&Transaction` to write methods. Always `drop(stmt)` after iterating a prepared statement.
- **DB models**: derive `Debug, Serialize, Deserialize, Clone` + `#[enum_def]`. Implement `TryFrom<&Row>` with helpers for booleans (stored as INTEGER) and JSON (stored as TEXT). Build queries with sea-query + `.build_rusqlite(SqliteQueryBuilder)`.
- **Errors**: use `ServerError` enum (`src/error.rs`) — convert with `?` or `ServerError::Internal(msg.into())`. Handlers return `Result<impl Responder, ServerError>`.
- **Migrations**: add numbered `.sql` file under `src/database/migration/`, wire in `migration/mod.rs`, bump the `VERSION` const + `PRAGMA user_version`.
- **Secrets**: read env vars at startup via `std::env::var("NAME").expect("[FATAL] NAME not configured")`, cached in `LazyLock`. Keys: `HMAC_KEY`, `JWT_SECRET`, `ALLOWED_GITHUB_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_ORIGINS`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. Never hardcode secrets.
- **R2 storage**: lyric JSON files stored in Cloudflare R2. Client at `src/webpage/lyrics/r2.rs`. Key format: `"{song_id}_{folder}/{version}.json"`.
- **CORS**: allowed origins from `ALLOWED_ORIGINS` (comma-separated), defaults to `https://tslyric.com, https://edit.tslyric.com`.
- **Logging**: `log::` macros; `env_logger` initialized in `main.rs`.

---

## CI / GitHub Actions

### PR Checks (`.github/workflows/check.yml`)

Path-filtered; runs on PRs to `main`:
- **Rust**: `cargo fmt --all -- --check`
- **Docker**: test build
- **Frontend**: `npm ci` → `npm run format:check` → `npm run type-check` → `npm run build`
- **Version**: asserts `Cargo.toml` version == `package.json` version

### Deploy (`.github/workflows/build.yml`)

Triggers on push to `main` when `Cargo.toml` version changes: builds Docker image, exports to `tsl.tar`, uploads via SSH over Cloudflare Tunnel, runs `docker load` + restart.

**Version bump workflow**: change `version` in **both** `Cargo.toml` and `package.json` to the same value. CI will fail if they mismatch.

---

## Lyric Data Model

The core domain is phrase-level lyric JSON. Full schema lives in `readme.md` — read it before touching lyric parsing or rendering. Key facts:

- Song list at `/public/song_list.json`. Lyric files under `/public/mappings/(song name)/` keyed by version.
- Each line: `{ time: "mm:ss.SS", text: [{ phrase, duration (centiseconds, 0 = default 100), kiai?, pronounciation? }], translation?, type?: "prelude"|"interlude"|"end", is_secondary?, is_together?, background_voice? }`.
- Frontend transforms raw lines into `ProcessedLine` (numeric `time`, `delay[]`, `duration[]`, `computedEndTime`) in `useSongs.ts` / `useLyricTimeline.ts`. Entry point is `parseLyrics()`.

---

## Python Tools (`py_tools/`)

Offline scripts (numbered `003_`…`009_`) that convert various lyric formats (Karaoke-time CSV, LRC, XML, HTML) into the app's JSON time-spec. They run manually, are NOT part of builds, and their output lands in `/public/mappings/…`. Do not modify runtime behavior from these. Only add a new numbered script for a new source format.

---

## Common Task Checklists

### Add a new Vue component
1. Create `PascalCase.vue` under the correct page directory
2. Follow the skeleton: Props → Emits → Composables sections with `// ──` dividers
3. Apply glass recipe classes (use the design tokens, don't invent new ones)
4. Wire into the parent/orchestrator with kebab-case events
5. Verify both desktop and mobile layouts

### Add a new backend endpoint
1. Add sub-module under the correct domain (`src/webpage/{songs,artists,lyrics,auth}/`)
2. Annotate route with `#[get(...)]` or `#[post(...)]`
3. Register in `src/webpage/mod.rs` via `.service(domain::module::handler)`
4. Return `Result<impl Responder, ServerError>`
5. Add a migration if the schema changes

### Add a new shared constant or type
- **Constant** → `web/composables/utils/config.ts`, import it — never inline string/number literals
- **Type** → matching file in `web/types/` (`player.d.ts`, `song_select.d.ts`, etc.)
- **Utility function** → `web/composables/utils/global.ts`

---

## Golden Rules

1. **Consistency over cleverness.** Every new UI surface must use the Glassomorphism tokens above — never invent new colors, blurs, or radii.
2. **`#FC3C44` is sacred.** The red accent appears ONLY on the play/pause button and progress/volume bar fills. Never elsewhere.
3. **No `index.ts` barrels, no Pinia, no raw `@media` queries, no `tailwind.config.js`, no CSS modules.**
4. **Keep components small** — the Player page is the ceiling for complexity, and even it delegates heavily to sub-components.
5. **Follow the existing skeleton** — `<script setup lang="ts">` + `defineProps<{}>()` + `defineEmits<{}>()` + section dividers.
6. **When in doubt, mirror an existing component** in the same feature directory.
