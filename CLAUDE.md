# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

**時間同步歌詞 (Time-Synced Lyrics / 同步開唱 / tslyric.com)** — a web karaoke player that overlays phrase-level synchronized lyrics onto YouTube playback, coloring each word in time with the vocals. Vue 3 SPA frontend, Rust/Actix backend, SQLite + Cloudflare R2 storage, GitHub OAuth auth.

- Frontend: Vue 3.5 (`<script setup lang="ts">` Composition API) + TypeScript ~5.9, Vite 8, vue-router 4, Tailwind CSS v4 via `@tailwindcss/vite` (theming in `web/styles/theme.css` — **no `tailwind.config.js`**).
- Backend: Rust (edition 2024), actix-web 4.12, tokio, rusqlite 0.32 (bundled SQLite) + r2d2 + sea-query, aws-sdk-s3 (Cloudflare R2), jsonwebtoken JWT + HMAC-SHA256.
- Database: single SQLite file `data/tsl.db`, WAL mode, r2d2 pool (max 10), migrations via `PRAGMA user_version` (v4, files 001–005).
- Deliberate absences: no test framework, no Pinia/Vuex — pure Composition API `ref`/`computed`/`watch`.

## Commands

```sh
npm run dev           # Vite dev server (localhost:5173)
npm run build         # production build
npm run type-check    # vue-tsc --build
npm run lint          # ESLint --fix --cache
npm run format        # Prettier --write
npm run format:check  # Prettier --check

cargo dev             # dotenv -- run --bin tsl_api (binds 0.0.0.0:8000)
cargo fmt --all -- --check
```

Frontend auto-targets `http://localhost:8000/api` in dev (see `web/composables/utils/config.ts`).

## Architecture

Vue SPA (`web/`) calls a REST API (`src/`) on :8000; lyric JSON lives in Cloudflare R2 (publicly read at `lyric.tslyric.com`) and song/artist metadata in SQLite, joined by `song_id`.

- `src/webpage/` — Actix routes, domain-organized: `auth/` (GitHub OAuth + JWT), `songs/`, `lyrics/` (+ `r2.rs`), `artists/`; registered in `mod.rs`. Protected routes call `auth::extract_bearer()`.
- `src/database/` — SQLite models (`song.rs`, `artist.rs`) + `migration/` (001–005 sequential SQL files).
- `src/main.rs`, `src/lib.rs`, `src/error.rs`, `src/utils.rs` — entry, module root, `ServerError`, HMAC/Shift-JIS/uptime.
- `web/` — `router/index.ts` (routes `/`, `/songs`, `/player/:id?`), `components/` (per-feature folders: `home/`, `player/`, `song_select/`), `composables/hooks/` + `utils/`, `styles/theme.css`, `types/*.d.ts`.
- `py_tools/` — offline Python lyric-conversion scripts (not part of builds).

Full schema (DB tables, API endpoints, lyric JSON format, env vars, deployment) is in `readme.md` — read it before touching lyric parsing/rendering or DB migrations.

## Conventions

- **UI text and docs are Traditional Chinese (zh-TW)**; code identifiers and technical notes in English. Comments use `// ── Section ──` dividers.
- **Version sync is mandatory**: `Cargo.toml` and `package.json` must carry the same version (currently 7.1.4); CI fails otherwise. Bump both together.
- **Formatting**: 4-space indent, double quotes, semicolons, trailing commas. Prettier `tabWidth: 4` (no other config); `cargo fmt` for Rust.
- Vue components use `<script setup lang="ts">` with the skeleton: Props (`defineProps<{...}>()` inline type literals) → Emits (`defineEmits<{...}>()`) → Composables/State, each under a `// ──` divider. `LoadingOverlay.vue` is the sole Options-API outlier — don't copy it.
- **Events**: camelCase in `defineEmits` (`barMouseDown`), kebab-case in templates (`@bar-mouse-down`); `v-model` uses the `update:` prefix. Use **callbacks as props**, not provide/inject, when a deep child needs a parent function.
- **No barrel `index.ts` re-exports** — import components directly. No Pinia, no raw `@media` queries, no CSS modules.
- **Path aliases**: `@` → `web/`, `@components` → `web/components/`, `@composables` → `web/composables/`. Use aliases cross-tree, relative `./` within a directory.
- Constants in `web/composables/utils/config.ts`; utility functions in `web/composables/utils/global.ts`; types in `web/types/*.d.ts`.
- **Backend**: never block the async runtime — run rusqlite work inside `web::block(move || ...)`, unwrapping the double `Result` with `??` after `.map_err(|e| ServerError::Internal(...))`. Handlers return `Result<impl Responder, ServerError>`. Models implement `TryFrom<&Row>`; read secrets once via `std::env::var(...)` into `LazyLock`.

## Design system (Glassomorphism)

The signature visual style. Every surface layers glass on a dark, dynamically-colored page background (album art → `useAlbumColors` gradient). Use the existing tokens — **do not invent new colors, blurs, or radii.**

- **Glass card**: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`. Darker mobile panels: `bg-[#1a1a1a]/90 backdrop-blur-xl rounded-3xl`.
- **Modal**: always `Teleport to="body"` + `Transition name="modal"` + `bg-black/60 backdrop-blur-sm fixed inset-0 z-40` backdrop wrapping a `bg-white/5 backdrop-blur-2xl ... rounded-3xl` card.
- **Fills** `bg-white/3`…`/30` (cards `/5`–`/10`); **borders** `border-white/4`…`/40` (standard `/10`); **text** `text-white/25`→`text-white` (disabled → headings); **blur** `backdrop-blur-sm`/`xl`/`2xl`; **corners** `rounded-2xl`/`3xl`/`full`; **shadows** `shadow-2xl`/`lg`.
- **`#FC3C44` is sacred** — only on the play/pause button and progress/volume bar fills. Never for text, borders, or decoration.
- Mobile: dual-layout via `hidden md:flex` / `md:hidden` (768px breakpoint); handle both touch (`@touchstart.prevent`) and mouse events; fixed bottom panels `fixed bottom-0 ... z-50`.

## Gotchas

- **Lyrics data model** (phrase-level `time`/`text`/`duration` in centiseconds) is in `readme.md`; the frontend transforms raw JSON into `ProcessedLine` in `useSongs.ts`/`useLyricTimeline.ts` (entry `parseLyrics()`).
- **Dual lyrics container**: desktop + mobile layouts render the same `LyricsContainer` twice in the DOM; `scrollToLineIndex()` in `global.ts` picks the visible one via `querySelectorAll`.
- **Secrets** come from env vars at startup (`HMAC_KEY`, `JWT_SECRET`, `ALLOWED_GITHUB_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_ORIGINS`, `R2_*`). Never hardcode. `data/` holds runtime state (`tsl.db`, `hmac_private_key`) and is gitignored.
- **No automated tests** (frontend or backend); a single `#[cfg(test)]` in-memory migration test exists but CI doesn't run it. Verify manually.
- **Migrations**: add a numbered `.sql` file under `src/database/migration/`, wire it in `mod.rs`, bump the `VERSION` const + `PRAGMA user_version`.

## Git / CI

- `main` is protected; work on feature branches and open PRs.
- `.github/workflows/check.yml` (on PR, path-filtered): `cargo fmt --check`, Docker test build, `npm ci` → `format:check` → `vue-tsc --noEmit` → `vite build`, and version-consistency check.
- `.github/workflows/build.yml` (on `Cargo.toml` version bump to `main`): Docker build → `tsl.tar` → upload over Cloudflare Tunnel SSH → `docker load` + restart.
