# Technical Architecture

## Application shape

Frame & Key Studio is a React 19 and TypeScript application built with Vite 7. The client uses Wouter, Tailwind CSS, Radix UI, Lucide, TanStack Query, and feature modules under `client/src/features/studio/`. The recommended local media path is the static Vite route at `/studio`.

The repository also contains an Express 4 server shell, tRPC 11, Drizzle ORM, MySQL support, OAuth/platform helpers, and a public inquiry route. These server integrations are separate from the browser-local media pipeline.

## Local media pipeline

A user-selected `File` is inspected in the browser with Mediabunny. The application reads duration, dimensions, available codecs, audio presence, and audio samples locally. Audio is downmixed/resampled for analysis and passed to a Web Worker. The application does not upload the selected media to its API or object storage.

Whisper transcription uses Transformers.js and the referenced Xenova Whisper models. English uses `Xenova/whisper-base.en`; other exposed source languages use `Xenova/whisper-tiny`. The worker returns timed words and the client builds editable caption cues and transcript-derived clip suggestions.

Translation uses local OPUS-MT ONNX models for English→Arabic, English→French, English→Spanish, and English→German. Translation timing follows source phrases; word-level translation alignment is not inferred. Models are downloaded on first use and are not committed to Git.

## Editing and rendering

The Studio stores project state in IndexedDB, with optional OPFS persistence where available. Portrait framing and optional face-assisted framing are performed in the browser. Face assistance tracks visible faces; it does not identify a speaker and is not universally verified.

Export uses Mediabunny and WebCodecs capability checks. In the verified Chromium evidence, WebM output used VP9 video and Opus audio at a portrait 9:16 size. MP4 is conditional on browser encoder support and is not promised as a product export format without a device-specific test.

## Dependencies and requirements

- Node.js 22-compatible runtime.
- pnpm 10 and the committed `pnpm-lock.yaml`.
- Modern browser with JavaScript, IndexedDB, WebAssembly, and media decoding.
- WebCodecs/WebGL/OPFS/File System Access support varies by browser and device.
- Public network access on first use for model files.
- Database and server environment variables only for optional server-shell features.

## Repository map

- `client/src/features/studio/analysis/`: transcription, caption tracks, subtitle parsing, clip suggestions.
- `client/src/features/studio/media/`: media inspection, audio preparation, framing, face assistance.
- `client/src/features/studio/export/`: Mediabunny rendering and download handling.
- `client/src/features/studio/storage/`: IndexedDB and local persistence.
- `server/`: Express/tRPC shell and optional server-side routes.
- `shared/`: shared types/constants.
- `docs/`, `buyer-materials/`, and `BUYER_DELIVERY/`: QA and handoff evidence.
