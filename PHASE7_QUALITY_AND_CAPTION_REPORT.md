# Phase 7 — Quality, Smart Captions, and Multilingual Transcription Report

**Project:** Frame & Key Studio  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Date:** 2026-11-13  
**Branch:** `main`

## Executive result

This phase implemented the requested code changes in the existing browser-local editor. The project was not rebuilt from scratch and existing templates, Brand Kits, logo controls, crop/face tracking, local project persistence, caption editing, batch export, and ZIP download paths were preserved.

The following checks passed after the changes:

- `pnpm check`
- `pnpm test -- --run` — **15 test files, 98 tests passed**
- `pnpm build`
- `pnpm audit --prod` — **No known vulnerabilities found**
- `git diff --check`

A real-media acceptance run was **not repeated in this execution** because no 720p/1080p human recording was available in the sandbox, and no source media was added or downloaded merely to manufacture evidence. The previous repository report `PHASE6_REAL_MEDIA_ACCEPTANCE_REPORT.md` records an earlier real human-media run, but its results are not claimed as a new Phase 7 execution.

## Implemented changes

### 1. Source-aware export quality

- Added `effectivePortraitHeight()` to prevent the export canvas from being taller than the source video. A 720p source requested as 1080×1920 now exports at a source-limited 405×720 9:16 canvas rather than manufacturing detail; a 1080p source is similarly limited to 1080px height.
- The export UI now displays the effective 9:16 output dimensions instead of always claiming 1080×1920.
- Existing bitrate profiles remain in place: 6 Mbps for the 720-class profile and 12 Mbps for the 1080-class profile.
- Existing WebCodecs capability detection remains authoritative: MP4 is shown only when H.264/AAC is reported as supported; otherwise WebM VP9/Opus or VP8/Opus is selected when supported.
- Mediabunny remains the local conversion path and File System Access streaming remains preferred for large output files.

### 2. Caption placement and face avoidance

- Added `caption-placement.ts` with deterministic safe-zone resolution.
- The user's chosen top/middle/bottom position remains the default.
- When smart framing has a tracked face near the selected caption anchor, the caption moves to the nearest safe zone instead of covering the face.
- The same decision is used in the live preview and in the rendered export, so preview and output use the same placement rule.
- Fallback order is stable (`bottom`, `top`, `middle`) and does not randomly jump between zones.
- Existing manual caption-position controls remain available.

### 3. Explicit transcription workflow

- Added a persisted `captionProcessingMode` setting with two explicit choices:
  - **Transcribe only** — keeps Whisper output in the selected/detected speech language and never starts translation.
  - **Transcribe + translate** — exposes a separate target-language choice and requires an explicit translation action after reviewing the Whisper transcript.
- The translation path continues to use the actual timed Whisper cues as its input; imported SRT/VTT files are not used as a substitute for transcription.
- Source speech language and target translation language remain separate controls.

### 4. Supported target languages and directionality

- Target-language choices now explicitly include English, Arabic, French, Spanish, and German, plus the no-translation option.
- Arabic preview/export direction remains RTL; Latin-language captions remain LTR.
- English-to-English selection preserves the actual Whisper text and timing rather than pretending to run a translation model.
- The bundled OPUS-MT models still accept English source text only. If another source language is selected, the UI explains the limitation and does not claim a translation was produced.

### 5. Tests added

- `caption-placement.test.ts` verifies that captions stay in the selected zone when safe and move away from a face only when necessary.
- `convert-clip.test.ts` verifies that 720p and 1080p sources are not upscaled to a 1920px export canvas.
- Existing transcription-window, caption timing, face tracking, framing, export, persistence, template, and server tests all continue to pass.

## Files changed

- `client/src/pages/Studio.tsx`
- `client/src/features/studio/types.ts`
- `client/src/features/studio/models/translate-cues.ts`
- `client/src/features/studio/workers/translate.worker.ts`
- `client/src/features/studio/components/VideoPreview.tsx`
- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/export/convert-clip.test.ts`
- `client/src/features/studio/media/caption-placement.ts`
- `client/src/features/studio/media/caption-placement.test.ts`
- `PHASE7_QUALITY_AND_CAPTION_REPORT.md`

## Media evidence and comparison

No new source video, rendered video, frame image, or SRT was present in the sandbox during this Phase 7 run. Therefore this report intentionally does not invent source bitrate, output bitrate, PSNR/SSIM, Whisper WER, translation examples, frame-by-frame face checks, or final audio/video stream measurements.

The prior real-human-media evidence is preserved in `PHASE6_REAL_MEDIA_ACCEPTANCE_REPORT.md`. It documents a public-domain Kennedy speech recording, local Whisper Base transcription, local OPUS-MT Arabic/French/Spanish/German runs, RTL rendering, and a VP9/Opus 1080×1920 export. Those are historical Phase 6 results, not a newly repeated Phase 7 acceptance run.

## Known limitations

- The local translation models currently support English source captions only. Supporting arbitrary source/target pairs requires additional open-weight model files and a deliberate size/performance decision.
- Auto-detection is passed to Whisper when selected, but the current UI does not promote a low-confidence detected language into a confirmed source-language selection. Users should choose the speech language manually when translation is needed.
- The new face-safe caption rule uses the tracked crop center as a conservative face proxy; it is not speaker identification and cannot know who is speaking when multiple faces are present.
- Full real-media upload → Whisper → five target-language runs → preview frame review → export verification must be repeated with a supplied or approved human recording before claiming Phase 7 media acceptance.
- `pnpm build` retains the pre-existing Vite warning about `/api/platform/config.js` lacking `type="module"`; the build still succeeds and this warning is outside the Phase 7 media path.

## Final verification commands

```text
pnpm check                         PASS
pnpm test -- --run                 PASS — 15 files / 98 tests
pnpm build                         PASS
pnpm audit --prod                  PASS — no known vulnerabilities
git diff --check                   PASS
```
