# Frame & Key Studio

Frame & Key Studio is a browser-based short-form video editing studio focused on turning landscape recordings into vertical clips for real-estate marketing, social content, education, and creator workflows.

The Studio workflow runs locally in the user's browser. It reads the selected local video, extracts audio samples, runs optional speech transcription and translation in Web Workers, creates editable clip suggestions and captions, reframes the selected section into a portrait canvas, burns optional captions/title/logo overlays, and exports a local media file. The Studio does not upload video/audio bytes, video frames, generated captions, or transcripts to the application API or object storage.

The repository also contains an Express/tRPC application shell and a public inquiry form. That server-side shell is separate from the local media path and requires external platform configuration when the complete website is run.

## What is implemented

The code and current tests cover local video metadata inspection; audio extraction, downmixing, resampling, cancellation, and bounded analysis windows; browser-side Whisper transcription in a Web Worker; transcript-based clip and hook suggestions; manual clip boundaries; caption editing; SRT/VTT import/export; caption styles; title/logo/brand controls; local English-to-Arabic/French/Spanish/German OPUS-MT translation; unchanged English caption pass-through; portrait 9:16 framing; full-video/studio-background mode; optional face-assisted framing with stable caption placement; browser-side export; sequential multi-clip rendering; ZIP creation for small batches; and IndexedDB/optional OPFS project persistence.

The current repository checks are green: `pnpm check`, `pnpm test -- --run` (112 tests in 16 files), `pnpm build`, and `pnpm audit --prod` pass in the reviewed environment. See the mission acceptance report for the manual browser media evidence and the exact scope of those checks.

## Partial capabilities and known limits

Whisper output requires human review. Clip suggestions are rule-based transcript analysis, not a guaranteed engagement prediction. Face-assisted framing tracks visible faces but does not identify the speaker; small, compressed, dark, occluded, synthetic, or unusual faces may fall back to manual framing. Translation supports English source text to Arabic, French, Spanish, or German and uses approximate phrase-level timing; choosing English keeps the Whisper text unchanged. 1080x1920 is an output canvas and cannot restore detail lost to a 16:9-to-9:16 crop. Long exports are safest in browsers with direct-to-file saving; without it, memory-limited fallbacks and a 64 MiB ZIP safety budget apply. Projects are local to the browser and are not synchronized between devices. The repository has no production URL and intentionally contains no payment or subscription system; it is being prepared as a source-code/product asset transfer, not as a completed billing SaaS.

## Technology stack

The project uses React 19, TypeScript 5.9, Vite 7, Express 4, tRPC 11, Drizzle ORM/MySQL, Mediabunny 1.61.4, Transformers.js 4.3.1, TensorFlow.js/Face Detection, Web Workers, WebAssembly, IndexedDB, optional OPFS, Vitest, and fflate.

## Models and first-use downloads

Model weights are not committed to Git. They are fetched from public model repositories only when the relevant feature is used and may be cached by the browser.

| Feature | Model | Scope | Approximate size / note |
|---|---|---|---|
| English transcription | `Xenova/whisper-base.en` | English source speech | Not bundled; download varies by model files/runtime |
| Other-language transcription | `Xenova/whisper-tiny` | Multilingual transcription | Repository notice estimates about 41 MB for selected q8 ONNX weights before auxiliary files |
| Translation | `onnx-community/opus-mt-en-ar`, `en-fr`, `en-es`, `en-de` | English to Arabic/French/Spanish/German; English target is copied unchanged | Model weights are downloaded on first use and vary by model |
| Face-assisted framing | MediaPipe through TensorFlow.js | Optional local visible-face tracking | Local inference with manual fallback |

Translation uses CPU/WebAssembly and does not require WebGPU. First use may be slow and requires access to the public model host.

## Installation and development

Requirements are a Node.js 22-compatible runtime, pnpm 10, and a modern browser. The local Studio media path does not require a database.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
pnpm dev
```

Open `http://localhost:3000/studio`. Static scripts are available with `pnpm build:static` and `pnpm dev:static`. The complete server shell can be started with `pnpm start` after the required environment configuration; see `BUYER_HANDOFF.md`.

## Testing

```bash
pnpm check
pnpm test -- --run
pnpm build
git diff --check
```

The current canonical automated result is 13 passing test files and 90 passing tests. These are unit/regression and server-route tests, not a substitute for browser media acceptance. Use `docs/manual-acceptance-checklist.md` for the buyer procedure. Historical browser/media reports remain in `docs/` with their original dates.

## External services and privacy boundary

The Studio media path is local. The application shell still has external boundaries: `/api/leads` stores inquiry fields in the configured database and may notify the owner through Manus; OAuth uses the configured Manus OAuth service; inherited platform helpers can use Manus/Forge APIs for platform features; and Google Fonts are requested by the stylesheet. No secret values are committed. Runtime values are read from environment variables and are intended to remain server-side.

## Browser and media limitations

Historical repository reports document Chromium/Sandbox media checks. The current review did not independently test Chrome, Edge, Firefox, or Safari sessions, so the acceptance checklist marks untested combinations as `Needs testing`. Codec support, WebCodecs, File System Access, WebAssembly performance, WebGL, OPFS, and memory vary by browser/device. Use 720p and individual exports first on constrained hardware.

## Third-party notices and transfer boundary

`THIRD_PARTY_NOTICES.md` lists the main libraries and models, including Mediabunny MPL-2.0, Transformers.js/TensorFlow.js/face detection Apache-2.0, fflate MIT, Whisper notices, and OPUS-MT CC BY 4.0 attribution. Keep those notices with redistributed builds and re-check upstream terms before redistributing model weights.

The package declares MIT in `package.json`, but the repository does not currently include a standalone `LICENSE` file. This is an ownership/transfer item and was not silently changed. A buyer receives transferable rights in original project code, not exclusive ownership of third-party libraries, model weights, platform accounts, or external services.

See `BUYER_HANDOFF.md` for the transfer runbook and `docs/test-results-2026-11-03.md` for the current verification record.
