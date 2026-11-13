# Frame & Key Studio — Buyer Handoff

This document is the technical handoff for a buyer or developer receiving the Frame & Key Studio repository. It explains what is included, how to run it from a clean clone, where the important code lives, how the local media pipeline works, what is not included, and what should be verified after transfer.

## 1. Product boundary

Frame & Key Studio is a browser-local video editor. The Core Studio reads a user-selected video, processes metadata/audio/captions locally, runs optional AI workers in the browser, creates editable clips, and exports a local file. It is not a hosted SaaS product with managed users, subscriptions, cloud media storage, or a production URL.

The repository also contains an inherited React/Vite + Express/tRPC + Drizzle/MySQL application shell. That shell serves the website, health/config routes, OAuth hooks, the public inquiry form, and platform integrations. It is not the media-processing backend. The Core Studio does not require the database or platform services when the buyer only wants to inspect the local editor.

The Studio does not upload selected video/audio bytes, frames, transcripts, or generated captions to the application API or object storage. First use of local AI features does request public model files from Hugging Face and stores browser-side model/cache data according to the browser's storage policy.

## 2. Repository map

| Path                                                      | Responsibility                                                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/pages/Studio.tsx`                             | Main Studio workflow, controls, state transitions, transcription/translation orchestration, persistence calls, and export actions  |
| `client/src/features/studio/types.ts`                     | Transcript, cue, clip, project, Brand Kit, settings, language, and output types                                                    |
| `client/src/features/studio/analysis/`                    | Audio/window analysis, transcript timing, caption construction, subtitle parsing, clip suggestions, and transcript-derived copy    |
| `client/src/features/studio/media/`                       | Video inspection, audio extraction, local transcription orchestration, face tracking, portrait framing, and caption-safe placement |
| `client/src/features/studio/workers/transcribe.worker.ts` | Whisper pipeline loading, q8 inference, word timestamps, progress messages, and the three-minute model-load timeout                |
| `client/src/features/studio/workers/translate.worker.ts`  | OPUS-MT model selection, q8 translation, progress messages, and English-source target validation                                   |
| `client/src/features/studio/models/`                      | Client-side translation bridge and supported target-language model interface                                                       |
| `client/src/features/studio/export/`                      | Mediabunny/WebCodecs conversion, caption/title/logo rendering, source-aware output sizing, file saving, and ZIP/download helpers   |
| `client/src/features/studio/storage/project-store.ts`     | IndexedDB projects/preferences/Brand Kits/sources, serialized writes, source restoration, and optional OPFS compatibility          |
| `client/src/features/studio/components/`                  | Video preview, caption editor, progress UI, branding controls, and Studio panels                                                   |
| `client/src/pages/`                                       | Application pages, including the Studio route                                                                                      |
| `client/src/components/ui/`                               | Shared UI primitives                                                                                                               |
| `server/_core/`                                           | Express startup, Vite/static serving, public config, OAuth, platform helpers, storage, and inherited integrations                  |
| `server/leads.ts`                                         | Public inquiry validation, rate limiting, database persistence, and owner notification integration                                 |
| `server/routers.ts`                                       | tRPC router definitions for the application shell                                                                                  |
| `server/db.ts`                                            | Optional Drizzle/MySQL connection created when `DATABASE_URL` is present                                                           |
| `drizzle/`                                                | MySQL/Drizzle schema and checked-in migrations                                                                                     |
| `shared/`                                                 | Shared server/client constants and types                                                                                           |
| `docs/manual-acceptance-checklist.md`                     | Repeatable browser/device acceptance procedure                                                                                     |
| `THIRD_PARTY_NOTICES.md`                                  | Main library/model attribution and licensing notes                                                                                 |
| `Dockerfile`                                              | Node 22 production container build for the full server shell                                                                       |
| `package.json`                                            | Scripts, package manager pin, runtime dependencies, and development dependencies                                                   |
| `pnpm-lock.yaml`                                          | Reproducible dependency resolution                                                                                                 |
| `README.md`                                               | Buyer-facing quick start and product limitations                                                                                   |
| `BUYER_HANDOFF.md`                                        | This detailed transfer and maintenance guide                                                                                       |

## 3. Clean-room setup and verification

Use a buyer-owned clone and a buyer-owned runtime. The following sequence was written for a clean checkout and is the canonical setup:

```bash
git clone https://github.com/mojtabahamed163-ai/frame-key-studio.git
cd frame-key-studio
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
```

The local Studio can be inspected without a database:

```bash
pnpm dev:static
```

Open `http://localhost:3000/studio` and confirm that the source panel renders. The static preview uses Vite and is the clearest way to verify the browser-local media product.

The complete development shell is:

```bash
pnpm dev
```

It starts the Express entry point with Vite middleware. Open `http://localhost:3000/studio`. Without platform/database variables, configuration-dependent routes may be unavailable or log warnings; that does not change the local Studio boundary.

To run the production bundle:

```bash
pnpm build
NODE_ENV=production PORT=3000 pnpm start
```

The Docker path is:

```bash
docker build -t frame-key-studio .
docker run --rm -p 3000:3000 frame-key-studio
```

The container runs `pnpm build` during image creation and starts `dist/index.js`. Configure server integrations at runtime; do not bake secrets into the image.

## 4. Scripts and what they mean

- `pnpm dev` — Express server with Vite development middleware.
- `pnpm dev:static` — Vite-only browser Studio preview on port 3000 or `PORT`.
- `pnpm build` — Vite client build plus bundled Express server output in `dist/`.
- `pnpm build:static` — Vite client build only.
- `pnpm start` — starts `dist/index.js`; use after `pnpm build` and set `NODE_ENV=production`.
- `pnpm check` — TypeScript no-emit check.
- `pnpm test -- --run` — Vitest unit/regression and server-route tests.
- `pnpm format` — Prettier write across the repository; review all resulting changes before committing.
- `pnpm db:push` — generates and applies Drizzle migrations; requires `DATABASE_URL` and must not be run against production without review and backups.
- `pnpm db:migrate` — applies Drizzle migrations; requires `DATABASE_URL`.

The current verified repository result is 16 test files and 114 passing tests, a passing TypeScript check, a passing production build, a clean `git diff --check`, and no known production vulnerabilities from `pnpm audit --prod`. Repeat these commands after transfer because browser/device acceptance is separate from Node tests.

## 5. Local video and audio pipeline

The user selects a local file through the Studio. The browser inspects its duration, dimensions, codecs where available, and audio presence. Audio is decoded and sampled locally for bounded speech/silence analysis. The application limits analysis windows and supports cancellation so it does not need to upload the source or create a server-side media job.

Transcript words and cues are stored in the project state. Suggestions are generated from transcript text, word timing, sentence boundaries, pauses, and simple topic/number signals. The process is intentionally reviewable and rule-based. It is not a semantic model that guarantees viral or high-engagement choices.

For export, Mediabunny/WebCodecs creates a portrait canvas, applies the selected crop/framing, draws captions/title/logo overlays, and preserves the selected audio path. The output profile is source-aware: the application does not intentionally encode a canvas taller than the available source height. Direct-to-file saving is preferred when File System Access is available; otherwise the browser uses an in-memory/download fallback with safety limits.

The current Chromium acceptance evidence confirms WebM VP9/Opus output. MP4/H.264/AAC is conditional on the browser reporting compatible encoders and must not be promised without a device-specific test.

## 6. Whisper transcription

The worker in `client/src/features/studio/workers/transcribe.worker.ts` selects:

- `Xenova/whisper-base.en` when the source language is English.
- `Xenova/whisper-tiny` for the other source-language path.

Transformers.js loads the selected model from its public repository on first use. The worker requests q8 inference and `return_timestamps: "word"`. It posts model progress to the UI, runs inference on the extracted audio window, converts returned chunks into project-relative timed words, and reports an error if the model does not load within 180 seconds.

The timed transcript is then converted into editable caption cues and used by the suggestion rules. Whisper output is not ground truth. Buyers should review names, punctuation, missing words, word boundaries, language selection, and timestamps before publishing. Auto-detection is not a substitute for confirming the source language when translation is needed.

Model weights are not committed to Git. First use requires access to the public model host and enough browser storage/memory. The browser may cache the model; clearing site data removes that cache. See `THIRD_PARTY_NOTICES.md` and the upstream model cards for current license and size information.

## 7. OPUS-MT translation

The translation worker maps the selected target to these actual model IDs:

- Arabic: `onnx-community/opus-mt-en-ar`.
- French: `onnx-community/opus-mt-en-fr`.
- Spanish: `onnx-community/opus-mt-en-es`.
- German: `onnx-community/opus-mt-en-de`.
- English: the Studio preserves/copies English source cues rather than claiming an English translation model result.

The worker loads one selected model with Transformers.js using q8 settings, translates each source cue locally through WebAssembly/CPU, reports progress, and returns one translated line per input cue. The current OPUS-MT paths accept English source text. The UI therefore blocks or warns for non-English source translation rather than claiming arbitrary language-pair support.

Translation keeps the source cue ranges. This is phrase-level timing, not word-level alignment. Long sentences may need manual line breaks, timing edits, or wording review. Arabic is rendered RTL in the caption path; Latin-script outputs remain LTR. Model transfer and memory consumption vary by language and browser. The third-party notice records observed approximate size information but buyers should verify current upstream files before distribution.

## 8. Local persistence and privacy

The project store uses the browser database `framekey-studio-local`, currently schema version 3. It contains separate stores for `projects`, `preferences`, `brandKits`, and `sources`. Writes are serialized so an older asynchronous save does not overwrite a newer one. Project metadata, cues, settings, Brand Kits, and source files saved through the Studio remain in the current browser profile.

Source files are saved in the IndexedDB `sources` store when the project flow requests local source saving. The code also retains optional OPFS support and a compatibility path for older records. If the browser refuses storage, quota is exceeded, site data is cleared, or the source was not saved, the project may reopen without its binary and ask the user to choose the original file again.

Projects are not cloud-synchronized. Moving the Git repository to another machine does not move a user's browser database, cached models, Brand Kits, source videos, downloaded outputs, or local acceptance media. Buyers must export or separately migrate those assets if needed, subject to their rights and privacy obligations.

## 9. Server shell and environment variables

The full server entry point is `server/_core/index.ts`. It exposes `/api/health`, `/api/platform/config.js`, `/api/leads`, OAuth routes, and `/api/trpc`, then serves Vite middleware in development or built files in production. It bounds JSON/urlencoded request bodies to 1 MB and does not accept the Studio's media files as an upload API.

Runtime variables are read server-side:

| Variable              | Role                                        | Required when                                 |
| --------------------- | ------------------------------------------- | --------------------------------------------- |
| `PORT`                | Listen port; defaults to `3000`             | Running the server on a chosen port           |
| `NODE_ENV`            | Development vs production serving           | Always set explicitly for deployment          |
| `MANUS_PROJECT_ID`    | Platform/project binding                    | Platform/auth features are used               |
| `MANUS_JWT_SECRET`    | Signed session/cookie operations            | Auth/session features are used                |
| `DATABASE_URL`        | MySQL/Drizzle connection                    | Database-backed routes or migrations are used |
| `MANUS_OAUTH_API_URL` | OAuth service endpoint                      | OAuth is used                                 |
| `MANUS_API_URL`       | Platform/Forge/notification/storage helpers | Corresponding inherited integrations are used |
| `MANUS_API_KEY`       | Server-only platform authorization          | Corresponding inherited integrations are used |
| `OWNER_OPEN_ID`       | Optional owner hint for inherited behavior  | Only if that integration needs it             |

Never put server secrets in `client/`, `README.md`, `BUYER_HANDOFF.md`, committed `.env` files, public config, or browser storage. The public config route must contain only values intentionally safe for the browser.

`drizzle.config.ts` requires `DATABASE_URL` before `pnpm db:push` or `pnpm db:migrate` can run. Review `drizzle/` migrations, back up the buyer database, and create buyer-owned credentials before applying them. The local Studio itself does not need those commands.

## 10. Transfer procedure

A proper handoff should include the Git repository, `package.json`, `pnpm-lock.yaml`, source code, tests, migrations, `README.md`, this file, `docs/manual-acceptance-checklist.md`, historical acceptance reports, and `THIRD_PARTY_NOTICES.md`.

Do not transfer `node_modules/`, `dist/`, `.manus-logs/`, local `.env` files, credentials, database dumps, private lead records, cached model weights, or test media unless their owner has explicitly cleared them for transfer. The repository includes historical reports and links to external public media; it does not grant ownership of third-party code, model weights, fonts, logos, stock media, domains, accounts, or customer data.

Before closing the transfer, the buyer should:

1. Clone the repository into a buyer-controlled account or organization.
2. Run the clean-clone commands in this document.
3. Confirm `pnpm check`, `pnpm test -- --run`, `pnpm build`, and `pnpm audit --prod`.
4. Run `pnpm dev:static` and open `/studio`.
5. Use a legal local video with known rights and perform the manual checklist.
6. Create buyer-owned platform/database/OAuth credentials only if server integrations are required.
7. Review and rotate any inherited external credentials; no credentials should be assumed to transfer with source code.
8. Record browser/device/codec evidence instead of marking untested browsers as supported.
9. Review current third-party licenses and model cards before redistributing model weights or a commercial build.

## 11. Buyer follow-up work

Potential post-transfer work includes selecting a buyer-owned hosting/platform adapter, adding cloud synchronization only if the product requirement changes, adding more language-pair models, testing additional browsers/devices, improving code splitting and large-model UX, adding product analytics with a documented privacy boundary, adding a standalone license/ownership file after legal review, and creating a production deployment pipeline.

None of those items should be presented as already complete. The current deliverable is a source-code product asset with a browser-local Studio and an inherited, configuration-dependent server shell.

## 12. Known limitations to disclose

- The editor runs locally in the browser; it is not a hosted SaaS service.
- WebM/VP9/Opus is the tested Chromium output. MP4 support depends on the browser's H.264/AAC encoders.
- Source dimensions and portrait crop determine effective output detail. A 1080×1920 canvas cannot restore crop detail.
- Whisper needs human review and can misrecognize names, words, language, or timings.
- Suggestions use rules and transcript timing, not complete semantic understanding.
- Face assistance does not identify a speaker and can fail on small, dark, occluded, compressed, synthetic, or unusual faces.
- OPUS-MT translation is currently English-source only for Arabic, French, Spanish, and German; timing is phrase-level.
- Model downloads can be slow, require public-host access, and consume browser cache/storage/memory.
- Long exports and ZIP batches can be memory constrained. Direct-to-file saving is preferred; ZIP output has a safety budget.
- Browser storage is local, quota-limited, clearable, and not synchronized across devices.
- The server shell has no production URL, managed account system, payment/subscription system, or automatically provisioned database.
- The package declares MIT in `package.json`, but the repository does not currently include a standalone `LICENSE` file. Resolve ownership and licensing with the buyer before commercial redistribution.
- Keep `THIRD_PARTY_NOTICES.md` and re-check upstream licenses/model terms before redistribution.
