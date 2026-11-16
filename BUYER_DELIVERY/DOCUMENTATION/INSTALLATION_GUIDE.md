# Installation Guide

## Clean checkout

```bash
git clone https://github.com/mojtabahamed163-ai/frame-key-studio.git
cd frame-key-studio
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
```

The seller environment used Node `v22.23.4` and pnpm `10.34.9`; the repository lockfile installed successfully in that environment.

## Run the browser-local Studio

```bash
pnpm dev:static
```

Open `http://localhost:3000/studio`. Select a legally usable local video. On first use of transcription or translation, allow the browser to download the relevant public model files.

## Full server shell

```bash
pnpm dev
```

This starts the Express/Vite shell. Server-side OAuth, database persistence, notifications, and platform helpers require their own environment configuration; they are not required for the browser-local Studio path.

## Build

```bash
pnpm check
pnpm test -- --run
pnpm build
```

Verified on 2026-11-16 in the seller checkout: TypeScript passed; 21 test files and 140 tests passed; production build passed. Vite emitted a non-fatal warning about the platform config script and large chunks. These are build warnings, not build failures.

## Basic acceptance path

1. Open `/studio`.
2. Choose a local video with audio.
3. Confirm duration, dimensions, and audio status.
4. Select English speech when the source is English.
5. Run local Whisper and review warnings and captions.
6. Select a suggested clip or set manual boundaries.
7. Edit a caption and confirm the preview updates.
8. Choose portrait framing and review the 9:16 preview.
9. For English captions, choose a target translation language and run the local translation workflow.
10. Review machine output before export.
11. Export a short WebM first and inspect it with `ffprobe`.

## Recommended verification commands

```bash
ffprobe -v error -show_format -show_streams output.webm
ffmpeg -v error -i output.webm -map 0:v:0 -f null -
ffmpeg -v error -ss 2 -i output.webm -frames:v 1 inspection-frame.png
sha256sum output.webm
```
