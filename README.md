# Frame & Key Studio

Frame & Key Studio is a browser-local short-form video editor. It turns a locally selected recording into editable vertical clips with transcript-based captions, optional local translation, portrait reframing, branding overlays, and a locally saved WebM or conditionally supported MP4 export.

The product is designed for real-estate marketers, social-content teams, educators, podcasters, interview editors, and creators who need a reviewable local editing workflow rather than a hosted media-processing queue.

> **Important product boundary:** Frame & Key Studio is not a hosted SaaS editor with managed accounts, subscriptions, cloud media storage, or a production URL. The core Studio processes the selected media inside the browser. The repository also contains an inherited Express/tRPC application shell and public inquiry form; that shell is separate from the local media path and needs its own platform/database configuration for its server-side features.

## What problem it solves

Long recordings contain useful moments but are slow to turn into social-ready clips. The Studio reads local media metadata, samples audio, optionally creates timed speech captions with Whisper, suggests editable moments from transcript timing and sentence rules, reframes a selection into 9:16, adds optional captions/title/logo/brand styling, and renders a local output file. Every important edit remains reviewable before export.

## Implemented features

The current code implements the following capabilities:

- Local video selection and metadata inspection, including duration, dimensions, codecs when available, and audio presence.
- Local audio extraction, downmixing, resampling, bounded analysis windows, and cancellation handling.
- Browser-worker speech transcription with `Xenova/whisper-base.en` for English and `Xenova/whisper-tiny` for other selected source languages.
- Timed words and caption cues that remain editable in the Studio.
- Rule-based transcript clip suggestions, hook options, titles, descriptions, hashtags, and manual clip boundaries. Suggestions are not semantic engagement predictions.
- SRT/VTT import and SRT/VTT export.
- Explicit caption workflows: **Transcribe only** or **Transcribe + translate**.
- Local English-source translation to Arabic, French, Spanish, or German through the corresponding OPUS-MT ONNX model. English target selection preserves the English source cues; it does not claim to translate them.
- Phrase-level translated timing that follows the source cue. Word-level translation alignment is not inferred.
- RTL Arabic caption rendering and LTR rendering for Latin-script languages.
- Portrait 9:16 framing with Fill portrait and Show full video/studio background modes.
- Manual horizontal framing and optional local face-assisted framing. Face tracking does not identify the speaker.
- Caption-safe placement that preserves the selected top/middle/bottom preference unless the tracked face is near that caption anchor.
- Caption styles, timing modes, title cards, logo placement, templates, and local Brand Kits.
- Source-aware export sizing that avoids manufacturing detail by upscaling a source beyond its available height.
- Browser-side rendering through Mediabunny/WebCodecs, direct-to-file saving when available, local download fallback, sequential multi-clip rendering, and small-batch ZIP creation.
- IndexedDB project/settings/Brand Kit/source persistence, with optional OPFS source persistence where the browser provides it.

## How the Studio works

1. Open `/studio` and choose a local video.
2. Review the detected dimensions, duration, and audio status.
3. Select the speech language when transcription is needed. Choose **Transcribe only** to keep the source language, or explicitly choose **Transcribe + translate** later.
4. Run local speech analysis and wait for the model to download on first use. Review the timed transcript and any suggested moments.
5. Select a suggestion or add a manual clip. Adjust in/out points, caption text, caption timing, title, description, and tags.
6. Choose the portrait framing mode, optional face assistance, caption style/position, template, Brand Kit, title card, and output height.
7. If the source captions are English, choose Arabic, French, Spanish, or German and start translation explicitly. Review the result before export.
8. Export a short 720-class clip first. Inspect the downloaded file in a player or with `ffprobe` before processing larger files.

## Technology stack

The client uses React 19, TypeScript 5.9, Vite 7, Wouter, Tailwind CSS, Radix UI components, Lucide icons, Transformers.js 4.3.1, Mediabunny 1.61.4, TensorFlow.js/MediaPipe face detection, Web Workers, WebAssembly, IndexedDB, optional OPFS, and `fflate` for ZIP output.

The repository also includes an Express 4 server shell, tRPC 11, Drizzle ORM, MySQL support, OAuth/platform helpers, and the public inquiry route. Those server integrations are not required for the local Studio media workflow.

## Requirements

For the local Studio path, use:

- Node.js 22 or another Node runtime compatible with the lockfile and TypeScript toolchain.
- Corepack or pnpm 10.18.0.
- A modern browser with JavaScript, IndexedDB, WebAssembly, and browser media decoding. WebCodecs, WebGL, OPFS, File System Access, memory, and codec support vary by browser and device.
- Network access on first use of Whisper, OPUS-MT, and other public model files. The model weights are not committed to Git.

A database is not required for the local Studio path. The complete server shell has additional optional/runtime requirements described in [BUYER_HANDOFF.md](BUYER_HANDOFF.md).

## Install from a clean clone

These commands are intended for a new checkout, not only for the seller's existing development environment:

```bash
git clone https://github.com/mojtabahamed163-ai/frame-key-studio.git
cd frame-key-studio
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
```

Do not commit `.env` files, model weights, `node_modules/`, `dist/`, private media, credentials, or database dumps.

## Run locally

### Recommended local Studio preview

The static Vite path is the smallest way to inspect the browser-local editor:

```bash
pnpm dev:static
```

Open [http://localhost:3000/studio](http://localhost:3000/studio). Set another available port with `PORT=3001 pnpm dev:static`.

### Full development shell

The full Express/Vite development process is available when the buyer also wants the website shell and its routes:

```bash
pnpm dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio). Without platform/database variables, the local Studio can still be inspected, but OAuth, database-backed lead persistence, notifications, and inherited platform helpers are not configured. Do not treat a blank or unavailable server integration as a failure of the browser-local media path.

## Build and run production output

Build the browser and server bundles:

```bash
pnpm build
```

Run the built Express shell:

```bash
NODE_ENV=production PORT=3000 pnpm start
```

For a static client build only:

```bash
pnpm build:static
```

The repository also contains a `Dockerfile` based on `node:22-bookworm-slim`. It installs pnpm 10.18.0, installs the frozen lockfile, runs `pnpm build`, exposes port 3000, and starts `dist/index.js`. A production container still needs the runtime environment required by any server-side integration it uses.

## Test and quality commands

Run the same checks used for the current handoff:

```bash
pnpm check
pnpm test -- --run
pnpm build
git diff --check
pnpm audit --prod
```

The current verified result is **16 test files and 114 tests passed**, TypeScript passed, the production build passed, `git diff --check` passed, and `pnpm audit --prod` reported no known production vulnerabilities. Browser/media acceptance is separate from Node/Vitest tests; use [docs/manual-acceptance-checklist.md](docs/manual-acceptance-checklist.md) for a repeatable browser run.

## Models and first-use downloads

Weights are fetched from public model repositories only when the relevant feature is used and may be cached in the browser. They are not stored in this repository.

| Feature                         | Model actually referenced by the code                                                 | Supported scope                            | Notes                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| English transcription           | [`Xenova/whisper-base.en`](https://huggingface.co/Xenova/whisper-base.en)             | English source speech                      | Loaded in a Web Worker with q8 settings and word timestamps |
| Other selected source languages | [`Xenova/whisper-tiny`](https://huggingface.co/Xenova/whisper-tiny)                   | The language options exposed by the Studio | Uses the multilingual worker path; review output carefully  |
| English → Arabic                | [`onnx-community/opus-mt-en-ar`](https://huggingface.co/onnx-community/opus-mt-en-ar) | English source captions                    | Local WebAssembly/CPU translation                           |
| English → French                | [`onnx-community/opus-mt-en-fr`](https://huggingface.co/onnx-community/opus-mt-en-fr) | English source captions                    | Local WebAssembly/CPU translation                           |
| English → Spanish               | [`onnx-community/opus-mt-en-es`](https://huggingface.co/onnx-community/opus-mt-en-es) | English source captions                    | Local WebAssembly/CPU translation                           |
| English → German                | [`onnx-community/opus-mt-en-de`](https://huggingface.co/onnx-community/opus-mt-en-de) | English source captions                    | Local WebAssembly/CPU translation                           |

The transcription worker has a three-minute model-load timeout and reports an actionable error if the model cannot load. Translation loads one selected language model at a time. CPU/WebAssembly is supported; WebGPU is not required. First-use transfer size and memory use vary with model files, runtime, browser cache, and device. The repository's third-party notice records approximate model-size observations; verify current upstream model cards before redistributing weights.

## Browser support and known limitations

The Studio has been manually exercised in a Chromium/Sandbox environment, including local Whisper, captions, portrait rendering, WebM/Opus export, and real-media acceptance. Do not infer that Chrome, Edge, Firefox, Safari, or mobile combinations are supported without running the workflow on that browser/device. The acceptance matrix in [docs/manual-acceptance-checklist.md](docs/manual-acceptance-checklist.md) intentionally leaves untested combinations as `Needs testing`.

The important limitations are:

- The core editor is local browser software, not a hosted processing service. It does not provide cloud synchronization, managed users, subscriptions, or a production SaaS URL.
- WebM was tested in the current Chromium environment. MP4 is conditional on the browser reporting compatible H.264/AAC encoders; it must not be promised without a device-specific test.
- Export resolution is constrained by source dimensions and portrait cropping. A 9:16 output canvas cannot restore detail lost by cropping or create real detail through upscaling.
- Whisper output requires human review. Names, punctuation, timing, and language detection can be wrong.
- Clip suggestions use transcript text, sentence boundaries, pauses, and simple rules. They are not full semantic understanding or a guaranteed engagement score.
- Face assistance tracks visible faces but does not identify a speaker. Manual framing remains the fallback.
- Translation is currently English-source only for the OPUS-MT paths. Translation timing follows source phrases; accurate word-by-word alignment is not provided.
- First-use model downloads require public-host access and local browser storage. Offline first use is not guaranteed.
- Long exports can be memory-intensive. Direct-to-file saving is preferred where available. ZIP batches have an in-browser safety budget and should be kept small.
- Projects, preferences, Brand Kits, and saved sources belong to the current browser profile. They are not automatically synchronized to another browser or device. Browser storage can be cleared or quota-limited.
- Server-side routes require their own configuration. Running the local Studio does not provision OAuth, MySQL, notifications, Manus platform services, domains, accounts, or payments.

## Privacy and external services

The Studio media path reads local files and processes media, audio, captions, and project state in the browser. The application does not upload the selected video/audio bytes, frames, transcript, or generated captions to its API or object storage. First-use AI features do request public model files from Hugging Face. The inherited server shell has separate external boundaries for OAuth, platform helpers, database-backed leads, notifications, and Google Fonts.

Never place API keys or secrets in this README, client code, committed `.env` files, or browser-visible configuration. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and license notes.

## Documentation and handoff

- [BUYER_HANDOFF.md](BUYER_HANDOFF.md) — technical transfer and maintenance guide.
- [docs/manual-acceptance-checklist.md](docs/manual-acceptance-checklist.md) — browser acceptance procedure.
- [FRAME_KEY_COMPLETE_REPORT.md](FRAME_KEY_COMPLETE_REPORT.md) — consolidated historical acceptance and quality reports.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — library/model sources and licensing notes.

The package declares MIT in `package.json`, but the repository does not currently include a standalone `LICENSE` file. Review ownership and third-party terms before commercial redistribution.
