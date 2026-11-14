# Frame & Key Studio — Buyer Technical Overview

**Repository:** `mojtabahamed163-ai/frame-key-studio`  
**Reviewed revision:** `442f5c6290b92e65112ae150b758f060617c97b4`  
**Scope:** source-based technical documentation for a prospective buyer. This document describes code paths and declared configuration visible in the repository; it is not a runtime certification, product-performance claim, or legal opinion.

## 1. Executive summary and product boundary

Frame & Key Studio is a React/TypeScript web application with a four-step, browser-local Studio workflow for turning a user-selected video into a portrait-oriented, captioned clip. The implemented Studio path accepts media from the browser, inspects and extracts audio locally, uses browser workers for speech transcription and selected machine translation, provides transcript/caption and clip-editing controls, applies portrait framing and optional face-guided positioning, and exports a rendered clip in the browser.

The `/studio` media workflow is designed around local processing and local persistence. The current Studio code does not send source video/audio bytes, extracted frames, transcripts, or captions to the application API or an application object store. It is therefore best understood as a local browser editor bundled inside a wider web application shell, not as evidence of a completed multi-tenant SaaS platform.

The wider repository also contains a landing page, a server/API shell, inherited authentication and database integration, lead capture, and generic storage helpers. Those surrounding services are separate from the core local media path and require buyer-owned deployment configuration if retained.

No current-file evidence establishes production hosting, a managed user base, subscriptions, revenue, guaranteed clip performance, or successful runtime execution on a particular browser/device. The model identifiers and code paths prove what is configured and implemented; they do not by themselves prove that every model download, inference, codec, or export succeeds in every environment.

## 2. Repository map

| Area | Important contents | Responsibility |
|---|---|---|
| `client/src/App.tsx` | Routes `/`, `/studio`, `/404`; lazy Studio route | Client routing and Studio loading boundary |
| `client/src/pages/Studio.tsx` | Main workflow orchestration | File selection, metadata, transcription, translation, face tracking, persistence, captions, editing, and export coordination |
| `client/src/features/studio/analysis/` | `clip-analysis.ts`, caption jobs/snapshots/tracks, subtitles, clip-time helpers | Transcript normalization, sentence grouping, speech ranges, caption cues, word-level cues, SRT/VTT, and rule-based clip suggestions |
| `client/src/features/studio/media/` | `analyze-video.ts`, `face-tracking.ts`, `framing.ts`, caption appearance/placement | Media inspection/audio preparation, local face tracking, portrait crop geometry, caption rendering settings |
| `client/src/features/studio/workers/` | `transcribe.worker.ts`, `translate.worker.ts` | Worker-isolated Transformers.js inference for Whisper and OPUS-MT |
| `client/src/features/studio/models/` | `translate-cues.ts` | Translation worker bridge, progress/errors, cue-count checks, phrase-level mapping |
| `client/src/features/studio/export/` | `convert-clip.ts`, `download.ts` | Canvas overlays, Mediabunny conversion, codec selection, browser download/save behavior |
| `client/src/features/studio/storage/` | `project-store.ts` | IndexedDB projects/preferences/brand kits/sources and optional OPFS source persistence |
| `client/src/features/studio/types.ts` | Project, transcript, cue, framing, settings and language types | Studio data model and defaults |
| `client/src/features/studio/components/` | Preview, cue editor, caption/brand/template controls, header | Studio UI controls and preview |
| `client/src/features/studio/studio.css` | Studio presentation and caption styling | Layout, preview, caption direction/rendering, and controls |
| `server/_core/` | Express bootstrap, environment, OAuth, SDK/context/cookies | Inherited server shell and external platform integration |
| `server/_core/index.ts` | Health/config/API/Vite/static routes | HTTP server, API registration, and production/static serving boundary |
| `server/routers.ts` | tRPC auth/system routes | Inherited server router; no media-processing router is established here |
| `server/leads.ts` | `/api/leads` validation, rate limiting, database save, owner notification | Landing-page inquiry handling |
| `server/storage.ts` | Forge presigned PUT/GET helpers | Optional server-side object storage path, separate from Studio source processing |
| `drizzle/` | MySQL/Drizzle schema and migrations | Server database structure |
| `README.md`, `BUYER_HANDOFF.md` | Setup, handoff, boundaries and limitations | Operational and transfer notes; current source code remains authoritative |
| `OWNERSHIP.md`, `LICENSE` | Ownership caveats and project-authored MIT grant | Transfer and licensing boundaries |
| `THIRD_PARTY_NOTICES.md`, `ASSET_LICENSES.md` | Library, model, font, icon and media notes | Third-party rights and attribution context |
| `docs/license-audit-package-inventory.md` | Historical package/license inventory | Existing audit artifact; not treated as a fresh version verification |

## 3. Actual stack and declared versions

The following versions are the direct package versions visible in the current `package.json`, not estimates from older reports.

| Layer | Current implementation |
|---|---|
| Language | TypeScript; JavaScript/JSX runtime configuration is also present where applicable |
| UI | React `19.2.1`, React DOM `19.2.1` |
| Build/dev server | Vite `7.3.8` |
| CSS/UI | Tailwind CSS `4.3.5`, Radix UI component packages, Lucide React |
| Routing | Wouter |
| Server | Express `4.22.3` |
| API | tRPC packages in the `11.x` line, with Express adapter |
| Database | Drizzle ORM `0.45.4` with `mysql2` `3.24.6` |
| Media processing | Mediabunny `1.61.4`; `fflate` `0.8.3` |
| Speech/translation runtime | `@huggingface/transformers` `4.3.1` |
| Speech/face ML | TensorFlow.js packages `4.22.0`; `@tensorflow-models/face-detection` `1.0.3` |
| Validation/utilities | Zod, React Hook Form, TanStack Query, SuperJSON and other UI/runtime utilities declared in `package.json` |
| Package manager | `pnpm` is pinned in package metadata as `10.34.9`; some README/Docker instructions still mention `10.18.0`, a documentation inconsistency that should be resolved by the buyer rather than silently assumed |
| Lockfile | `pnpm-lock.yaml`, lockfile version `9.0` |

`docs/license-audit-package-inventory.md` reports 707 resolved package entries and references an older commit (`27f2ab8`). It is retained as an audit artifact, but it is not used here as proof that all transitive versions or licenses are current.

## 4. Studio architecture and end-to-end media path

### 4.1 Entry and local source selection

`App.tsx` exposes `/studio`, and `Studio.tsx` lazy-loads the Studio workflow. The source is selected through the browser file input/drag-and-drop path. The selected `File` remains in the browser; the Studio path does not upload it to an application endpoint.

`analyze-video.ts` uses Mediabunny `Input`, `BlobSource`, and `AudioSampleSink` to inspect media metadata and read audio samples from the local file. Audio is downmixed to mono and linearly resampled to 16 kHz before transcription. The implementation processes Whisper windows of approximately 24 seconds with 4 seconds of overlap and includes tail recovery and timestamp cleanup.

### 4.2 Transcription

`transcribe.worker.ts` runs in a Web Worker through Transformers.js. The configured models are:

- English: `Xenova/whisper-base.en`
- Other supported source-language path: `Xenova/whisper-tiny`

The worker uses quantized (`q8`) inference and requests word timestamps. Model loading has a 180-second timeout. Model weights are not committed to the repository; first use requires network access to the public Hugging Face model repositories unless the buyer supplies an equivalent local/cache strategy. Web Worker isolation keeps inference off the main UI thread. Transformers.js may use browser/WASM capabilities supplied by the library, but this repository should not be read as proof of a specific WASM backend, hardware acceleration result, or browser performance level unless separately validated.

### 4.3 Transcript normalization and clip suggestions

The analysis modules normalize returned transcript words, group them into sentences/cues, compute speech ranges, and construct word-by-word or phrase-level caption timing. Clip suggestions are rule-based in `clip-analysis.ts`; the current files do not establish a cloud ranking service, an engagement model, speaker identity, or a guarantee that a suggested section will perform well.

The suggestion and caption logic operates on the local transcript and timing data. Its output is editable in the Studio rather than being a claim that the system understands audience reach or virality.

### 4.4 Translation and cue timing

`translate.worker.ts` uses quantized Transformers.js translation pipelines for these configured English-to-target models:

- `onnx-community/opus-mt-en-ar` — Arabic
- `onnx-community/opus-mt-en-fr` — French
- `onnx-community/opus-mt-en-es` — Spanish
- `onnx-community/opus-mt-en-de` — German

English target output copies source cues and does not invoke a translation model. `translate-cues.ts` manages the worker, progress/error states, line-count validation, and phrase-level mapping back to caption cues. The implementation therefore preserves source timing as the anchor; it does not prove professional translation quality, perfect word alignment, or support for arbitrary language pairs. As with Whisper, first use of the model repositories requires network access and the models are not included in the repository.

### 4.5 Portrait framing and face-guided positioning

`framing.ts` calculates 9:16 crop geometry and converts crop decisions into CSS object-position values. It also assesses crop quality/upscaling conditions. `face-tracking.ts` uses TensorFlow.js with a WebGL backend and a MediaPipe face detector. It samples frames through Canvas and combines full-frame sweeps with ROI/recovery sweeps. Candidate selection uses face geometry and temporal continuity, followed by smoothing, bounded movement, short hold behavior, and a manual fallback.

This is framing assistance, not speaker identification. The current implementation does not establish multi-person identity tracking, biometric identification, or a semantic understanding of who is speaking.

### 4.6 Caption appearance and editing

The Studio exposes caption appearance and placement controls, including styling and direction-aware rendering paths in `studio.css`. Cue editing, caption snapshots/tracks, timing helpers, and subtitle generation support the visible preview and export overlays. SRT and VTT generation paths are present in the analysis/subtitle modules. Exact visual output remains dependent on the browser canvas, fonts/assets, source media, and selected settings.

### 4.7 Browser export

`convert-clip.ts` uses Mediabunny `Conversion`, `Input`, `Output`, `VideoSample`, and `AudioSample`. Canvas overlays are applied during conversion. The code detects WebCodecs capabilities and selects among WebM VP9/VP8 or conditional MP4 H.264/AAC paths. The configured maximum clip length is 180 seconds and the export frame rate is 30 fps. Audio is retained through the audio path with optional normalization.

When the File System Access API is available, the exporter can save through a direct `StreamTarget`; otherwise it uses a `BufferTarget` followed by browser download behavior. Actual MP4 availability depends on the browser's codec/WebCodecs support. The repository contains capability detection, not evidence that every target browser supports every advertised output combination.

### 4.8 Persistence and privacy boundary

`project-store.ts` uses IndexedDB database `framekey-studio-local`, version 3, with stores for `projects`, `preferences`, `brandKits`, and `sources`. Optional source persistence can use OPFS. This is browser-local persistence; it is not a cloud project database, account sync service, or backup guarantee. Clearing browser data, changing profiles, or storage quota pressure may affect availability.

## 5. Local, network, and external configuration boundaries

### Runs in the browser/local path

- File selection and local media metadata inspection.
- Audio extraction, downmixing, resampling, and window preparation.
- Whisper transcription after model availability.
- OPUS-MT translation after model availability.
- Transcript/cue analysis, rule-based clip suggestions, timing edits, and caption rendering.
- TensorFlow.js/MediaPipe face detection and framing calculations.
- Mediabunny/WebCodecs conversion and download/save.
- IndexedDB and optional OPFS project/source persistence.

### Requires network access or externally supplied model availability

- Initial download of Whisper and OPUS-MT weights from their public Hugging Face repositories.
- Any hosted application shell, static deployment, OAuth exchange, database access, owner notification, or Forge/S3 storage operation.
- External fonts, images, or other hosted assets where referenced by the application.

The current Studio code does not use the application API as a media-processing backend. Network model fetching should not be conflated with uploading the user's source media to the project server.

### Requires buyer-owned deployment configuration

The server shell reads values including `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `DATABASE_URL`, `MANUS_OAUTH_API_URL`, `OWNER_OPEN_ID`, `MANUS_API_URL`, and `MANUS_API_KEY` through `server/_core/env.ts`. The exact platform provisioning, domains, secrets, OAuth registration, database, and notification/storage accounts are not transferred merely by transferring repository files.

`server/storage.ts` is a separate Forge-backed helper: it obtains presigned PUT/GET URLs through `MANUS_API_URL`/`MANUS_API_KEY` and uploads server-supplied data directly to S3. Its presence does not mean that Studio source media is automatically uploaded; the Studio local path does not call this helper for its source processing.

## 6. Server shell separation

`server/_core/index.ts` starts an Express server with health/config routes, lead handling, OAuth routes, tRPC, Vite development/static serving, and a 1 MB JSON/urlencoded body limit. It explicitly does not accept media uploads as part of the Studio pipeline.

The inherited server capabilities include:

- `/api/health` and platform configuration serving.
- `/api/leads`, implemented in `server/leads.ts`, with Zod validation, a five-request-per-IP ten-minute rate window, honeypot handling, MySQL/Drizzle persistence, and optional owner notification through a Manus API endpoint.
- OAuth callback handling in `server/_core/oauth.ts`, including state/nonce validation, token exchange, user upsert, and session cookie creation.
- tRPC auth/system routes in the inherited router.
- Optional Forge/S3 storage helpers.

These capabilities are operational dependencies of the surrounding shell, not prerequisites for the core local media transformation path. A buyer retaining them must provision and secure the associated external services.

## 7. What a buyer receives and what is excluded

Subject to the transaction agreement and the seller's actual rights, the repository transfer can include:

- Project-authored application source code and configuration tracked in the repository.
- The Studio workflow, analysis, worker bridges, media/framing/export code, UI components, and local persistence implementation.
- Repository documentation, handoff notes, ownership notes, asset/license notes, and this technical overview.
- The current repository history and tracked project files, if the agreed transfer includes them.

The transfer does **not** automatically include:

- Seller-controlled GitHub, Manus, Forge, AWS/S3, OAuth, database, notification, domain, hosting, or other accounts.
- Secrets, API keys, credentials, production infrastructure, managed users, subscriptions, customer data, or revenue history.
- Exclusive rights in third-party libraries, model weights, fonts, icons, stock/external media, or platform services.
- Exclusive trademark ownership for the SVG mark or brand unless separately documented.
- A guarantee that the buyer can use every external asset in every commercial context.
- A claim that the server shell is a deployed production SaaS system.

`OWNERSHIP.md` correctly cautions that Git history alone is not proof of exclusive ownership. The buyer should complete a separate rights, account, dependency, model, font, media, trademark, and domain diligence process.

## 8. Licensing and ownership notes

The current repository contains a `LICENSE` file with an MIT license dated 2026 and a scope note limiting that grant to project-authored material for which the project owner has the right to grant it. This current file is more authoritative for the present tree than older statements saying that no standalone license file existed.

The MIT file does not relicense third-party material. `THIRD_PARTY_NOTICES.md` identifies, among other items, Mediabunny under MPL-2.0, Transformers.js under Apache-2.0, TensorFlow.js/face detection under Apache-2.0, and Lucide/Feather-related notices. `ASSET_LICENSES.md` records external Google fonts, Lucide, acceptance media from external Wikimedia sources, and the tracked SVG mark with an unresolved question about exclusive trademark ownership. Model repositories and model weights retain their own terms.

The package declaration also states MIT, but package metadata is not a substitute for the third-party notices or the ownership review. The existing license inventory is historical and should be refreshed from the final lockfile and final dependency tree before a commercial transfer.

## 9. Known limitations and items not proven from current files

The following are intentionally not asserted as facts because the current files do not establish them:

1. No end-to-end runtime test was run as part of this documentation task, and no claim is made that the complete workflow has been validated on a particular browser, OS, GPU, codec set, or device class.
2. Configured Whisper/OPUS-MT identifiers do not prove model download success, inference quality, translation quality, or acceptable performance under all network, memory, and storage conditions.
3. The code does not prove a complete offline-first distribution: first model use normally needs network access unless weights are separately cached or packaged.
4. WebCodecs/MP4 support is capability-dependent; no universal H.264/AAC or File System Access guarantee is established.
5. No cloud sync, server-side media processing, media backup, multi-tenant isolation, production monitoring, billing, subscription system, or account provisioning is proven for the Studio path.
6. No user, revenue, engagement, reach, lead, conversion, or clip-performance data is established.
7. Face tracking does not prove speaker identification or biometric identity recognition.
8. Rule-based clip suggestions do not prove virality prediction, audience understanding, or guaranteed content performance.
9. Third-party rights, commercial permissions, model terms, font terms, stock-media rights, trademark ownership, and seller authority require independent legal/diligence review.
10. The repository's historical package/license inventory is not proof of current transitive versions or a complete current license audit.
11. The mismatch between the metadata-pinned pnpm `10.34.9` and older README/Docker references to `10.18.0` remains a documentation inconsistency.
12. No production URL, deployment topology, uptime, security review, data-retention policy, privacy compliance posture, or disaster-recovery process is established by the source files.
13. The landing-page copy describes a human-reviewed editing service and enquiry flow; that copy is not evidence that the local Studio automatically performs human review or that the advertised service is currently operating at scale.

## 10. Evidence index

Primary implementation evidence is located in:

- `client/src/pages/Studio.tsx`
- `client/src/features/studio/media/analyze-video.ts`
- `client/src/features/studio/workers/transcribe.worker.ts`
- `client/src/features/studio/workers/translate.worker.ts`
- `client/src/features/studio/models/translate-cues.ts`
- `client/src/features/studio/analysis/clip-analysis.ts`
- `client/src/features/studio/media/face-tracking.ts`
- `client/src/features/studio/media/framing.ts`
- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/storage/project-store.ts`
- `client/src/features/studio/types.ts`
- `client/src/App.tsx`
- `client/src/features/studio/studio.css`

Server and transfer evidence is located in:

- `server/_core/index.ts`
- `server/_core/env.ts`
- `server/_core/oauth.ts`
- `server/leads.ts`
- `server/storage.ts`
- `server/routers.ts`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `BUYER_HANDOFF.md`
- `OWNERSHIP.md`
- `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `ASSET_LICENSES.md`
- `docs/license-audit-package-inventory.md`

This overview documents the current repository state at the revision identified above. It does not replace a buyer's legal, security, dependency, deployment, or runtime acceptance review.

