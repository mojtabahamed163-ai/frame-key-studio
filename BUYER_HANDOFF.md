# Frame & Key Studio — Buyer Handoff

This document describes how to inspect, run, validate, and transfer the repository without assuming access to the seller's platform accounts.

**Current acquisition branch:** `feat/brand-kit-templates-qa` with application baseline `b9068e9` before the documentation commit. The historical `main` verification record at `efb00be` reports 13 test files and 90 tests; this branch adds the Brand Kit test file and was separately rerun at 14 test files and 92 tests. These counts describe different revisions and must not be conflated. The repository contains no documented paying users or revenue and no production SaaS deployment.

## 1. Product boundary

The Core Studio is the browser-local media editor under `client/src/features/studio/` and `client/src/pages/Studio.tsx`. It reads a local video, optionally transcribes or translates it in browser workers, creates editable clip/caption data, reframes it, and exports locally.

The application shell is the inherited React/Vite + Express/tRPC + Drizzle/MySQL layer. It serves the website, OAuth hooks, health/config routes, and the public inquiry form. It is not the media-processing backend.

The Studio intentionally does not upload video/audio bytes, frames, transcripts, or generated captions to the application API or storage. The first use of local models does make public model-file requests to the model host.

## 2. Important directories

| Path | Purpose |
|---|---|
| `client/src/pages/Studio.tsx` | Studio workflow, state, controls, local persistence calls, translation/tracking/export orchestration |
| `client/src/features/studio/analysis/` | Clip analysis, timing, caption generation, subtitle parsing, transcript-derived post copy |
| `client/src/features/studio/media/` | Mediabunny input/audio inspection, local transcription orchestration, face tracking, framing geometry |
| `client/src/features/studio/workers/` | Whisper and OPUS-MT Web Workers |
| `client/src/features/studio/models/` | Translation worker bridge |
| `client/src/features/studio/export/` | Mediabunny conversion, file saving, ZIP/download helpers |
| `client/src/features/studio/storage/` | IndexedDB and optional OPFS project/source persistence |
| `client/src/features/studio/components/` | Preview, captions, branding, and Studio UI components |
| `client/src/features/studio/brand/` | Brand Kit storage/types, 15 built-in templates, custom-template persistence, and related tests/styles |
| `server/_core/` | Express startup, platform helpers, OAuth, config, storage, notifications, and inherited integrations |
| `server/leads.ts` | Public inquiry validation, rate limiting, database save, and owner notification |
| `drizzle/` | MySQL/Drizzle schema and checked-in migrations |
| `docs/` | Current buyer report, acceptance evidence, historical validation reports, and the buyer acceptance checklist |
| `THIRD_PARTY_NOTICES.md` | Main third-party library/model attribution and license notes |
| `package.json` | Scripts, runtime dependencies, and package metadata |
| `Dockerfile` | Production build/container instructions for the application shell |

## 3. Local Core Studio run

Requirements: Node.js 22-compatible runtime, pnpm 10, and a modern browser.

```bash
git clone <buyer-repository-url>
cd frame-key-studio
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
pnpm dev
```

Open `http://localhost:3000/studio`. The local media workflow does not need `DATABASE_URL` if only the Studio is being inspected, but the application shell may still expose configuration-dependent routes.

For a static client build:

```bash
pnpm build:static
pnpm dev:static
```

Use a buyer-owned or synthetic video. Do not use private client media in a shared demonstration.

## 4. Full server shell

The production script builds the Vite client and bundles the Express entry point:

```bash
pnpm build
pnpm start
```

The server exposes `/api/health`, `/api/platform/config.js`, `/api/leads`, OAuth callbacks, and tRPC routes. Server-side features require the relevant runtime configuration. Values are read at runtime; do not place secrets in source files or documentation.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `PORT` | Server listen port | Optional; defaults to `3000` |
| `NODE_ENV` | Development/production selection | Use `development` for Vite middleware and `production` for built static files |
| `MANUS_PROJECT_ID` | Platform SDK/project binding | Buyer must create/use a buyer-owned project |
| `MANUS_JWT_SECRET` | Signed/session operations | Keep server-side; rotate on transfer |
| `DATABASE_URL` | Drizzle database and lead persistence | Required for database-backed routes/migrations |
| `MANUS_OAUTH_API_URL` | Manus OAuth | Required only when OAuth login is used |
| `MANUS_API_URL` | Forge/platform API, notification/storage helpers | Required by corresponding platform helpers |
| `MANUS_API_KEY` | Forge/platform authorization | Server-only secret; never expose to the browser |
| `OWNER_OPEN_ID` | Optional legacy owner hint | Not required for the local Studio path |

Do not run `pnpm db:migrate` or `pnpm db:push` against a buyer's production database until the buyer has reviewed the migrations and created backups.

## 5. What requires external services

The following are external/configuration-dependent:

- Manus OAuth callback and session integration.
- Manus/Forge platform helpers used by inherited template features.
- MySQL database for server-side users/leads and migrations.
- Manus notification service for owner inquiry notifications.
- Public model hosting for first-use Whisper and OPUS-MT downloads.
- Google Fonts requested by the stylesheet.

The following are local in the Core Studio:

- Video metadata and audio sampling.
- Whisper transcription after model download.
- Transcript-based clip suggestions.
- Caption editing and SRT/VTT parsing/export.
- Brand Kit application, JSON import/export, and built-in/custom video templates.
- OPUS-MT translation after model download.
- Face-assisted framing.
- Canvas overlays and browser media conversion.
- IndexedDB/OPFS project/source persistence.

## 6. Buyer acceptance procedure

Use `docs/manual-acceptance-checklist.md`. The short form is:

1. Open `/studio`.
2. Select a legal local video with audio.
3. Confirm metadata and audio status.
4. Run English transcription and wait for the model to load.
5. Review the transcript and suggested clips.
6. Edit one clip boundary and one caption cue.
7. Try Fill portrait and Full video/studio background.
8. Apply a built-in template and a saved Brand Kit; verify that the preview changes.
9. Optionally export/import a Brand Kit JSON file and reuse a custom template.
10. Optionally translate an English caption set to one supported language.
11. Export a short 720p clip first.
12. Inspect the file in a media player or with `ffprobe`.
13. Test one cancellation/error path.
14. Repeat at 1080p or with a larger file only on a device with sufficient memory.

The acceptance checklist distinguishes automated tests from browser/manual results. Do not mark a browser or device as supported unless it has actually been tested.

## 7. Models and download expectations

- English transcription uses `Xenova/whisper-base.en`.
- Other-language transcription uses `Xenova/whisper-tiny`; the repository notice estimates approximately 41 MB for the selected q8 ONNX weights before auxiliary files.
- Translation uses `onnx-community/opus-mt-en-fr`, `en-es`, or `en-de`; the repository notice estimates approximately 214.5–234.8 MiB per selected language before auxiliary/runtime files.
- Face tracking uses TensorFlow.js/MediaPipe locally.

Models are not committed to Git and are downloaded on demand. Offline first use is not guaranteed. Keep `THIRD_PARTY_NOTICES.md` with any distributed build and review the current upstream model cards before redistributing weights.

## 8. Known issues and limitations

- Face tracking is optional and can fail for small, compressed, dark, occluded, synthetic, or unusual faces. Manual framing is the safe fallback.
- Whisper output requires human review.
- Translation is currently English-source only for French, Spanish, and German, with phrase-level timing.
- Browser codec, WebCodecs, File System Access, OPFS, WebGL, WASM speed, and memory vary. MP4 export is conditional on H.264/AAC support; the current acceptance evidence proves WebM/VP9 + Opus, not MP4.
- Long exports without direct-to-file saving may be memory constrained.
- ZIP batches are bounded by a 64 MiB in-browser safety limit.
- Project/source persistence is local to the browser and does not synchronize between devices.
- 1080x1920 cannot restore detail lost by a 16:9-to-9:16 crop.
- The current build still reports a non-blocking Vite warning for `/api/platform/config.js` and large-chunk advisory warnings.
- There is no production deployment or payment/subscription system in this repository.
- The package declares MIT, but a standalone `LICENSE` file is not currently included. Do not change that status without reviewing ownership and third-party terms.

## 9. Current checked-in acceptance evidence

The repository includes `docs/FINAL_ACCEPTANCE_REPORT.md` and `docs/qa-evidence/`. The 2026-11-03 browser acceptance record documents a real MP4 source of about 37 MB and 8 minutes, local Whisper analysis, 225 timed words, three suggested clips, application of `Property Showcase` and a Brand Kit, and a saved WebM export with video, audio, captions, and successful `ffmpeg` decoding. The source was 320×240, so this is workflow evidence rather than a high-resolution production-quality claim. The record does not claim MP4 export success or broad browser support.

## 10. Transfer preparation

Before delivery, the buyer and seller should agree in writing on:

- Which original code and assets are included.
- Which platform accounts, databases, domains, and external services are excluded or transferred.
- The continuing obligations for MPL-2.0, Apache-2.0, MIT, CC BY 4.0, Google Fonts, and model cards.
- Whether the public GitHub history/repository is part of the transaction; a public repository cannot be made exclusive merely by handing over a clone.
- Who owns any logos, fonts, stock footage, music, screenshots, or external test media.

A clean delivery should include source, lockfile, tests, Dockerfile, migrations, README, this handoff, the acceptance checklist, historical reports, and third-party notices. Exclude `node_modules/`, `dist/`, logs, local `.env` files, personal data, lead records, and media without clear redistribution rights.

Before transfer, run a full-history secret scan, rotate any external credentials, create buyer-owned service credentials, and verify that no buyer handoff document contains secret values.

## 11. Recommended buyer follow-up work

The buyer may later choose to add cloud synchronization, a hosted media queue, more languages, broader browser/device acceptance, code splitting, or a separate deployment adapter. None of those are required to run the local Studio demo, and none is represented as complete in this handoff.
