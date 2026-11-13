# Phase 4 Acceptance Report — Frame & Key Studio

**Date:** 2026-11-13  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Branch:** `main`  
**Initial local/remote SHA:** `6912834600f7ff8118785920ad25b321a11541c0`  
**Test environment:** local Vite/static preview served from the sandbox and exercised through Chromium using the application UI and browser DOM events.  
**Important media limitation:** no pre-existing human English recording with a trustworthy ground-truth transcript was available in the environment. The non-human test clip used below was only for UI, caption, branding, timing, and export checks; it was not used to claim Whisper accuracy.

## Executive decision

The Arabic OPUS-MT path, RTL caption rendering, logo handling, manual caption timing, all 15 template variants, WebM export, and Batch/ZIP export were exercised with the real application in the browser. WebM and ZIP passed this round. MP4 was not available in the active Chromium codec environment and was therefore not claimed as supported.

Whisper WER is **not applicable / not measured** because the required human recording plus ground truth was unavailable. No synthetic voice, TTS, `espeak`, generated speech, or fake transcription was substituted.

Project persistence passed only partially: project metadata, transcript/caption notes, and settings are stored in the browser database, but the tested project had not saved its source binary to OPFS, so a reload correctly requested the original source again. This is consistent with the UI’s “Save source locally (optional)” behavior and should be disclosed to buyers.

## Initial repository review

Before this phase, local `main` and `origin/main` both pointed to:

```text
6912834600f7ff8118785920ad25b321a11541c0
```

The working tree contained the previous phase’s uncommitted Arabic/RTL/export/documentation changes. Those changes were reviewed and were not reimplemented. The reviewed files included:

- `client/src/features/studio/types.ts`
- `client/src/features/studio/workers/translate.worker.ts`
- `client/src/features/studio/models/translate-cues.ts`
- `client/src/features/studio/components/CaptionCueEditor.tsx`
- `client/src/features/studio/components/VideoPreview.tsx`
- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/studio.css`
- `client/src/pages/Studio.tsx`
- `THIRD_PARTY_NOTICES.md`

The previous Arabic implementation was found present, including the real `onnx-community/opus-mt-en-ar` model, `dir="rtl"`, Arabic caption styling, and Arabic attribution.

## Available media and ground truth

A filesystem inventory was performed for video/audio and transcript files. No human speech recording with a reliable ground-truth transcript was available. The only local fixture used for this phase was:

| File | Type | Size | Duration / streams | Permitted use |
|---|---|---:|---|---|
| `ui-test-phase4.mp4` / source fixture `ui-test.mp4` | H.264/AAC MP4, 640×360 | 106,113 bytes | 10.000 s; video + audio | UI, timing, captions, branding, export only |
| `captions.srt` | English SRT | 252 bytes | 3 timed lines | Caption import and translation only |
| `logo.png` | PNG | 1,655 bytes | local brand fixture | Logo preview/export only |

The temporary fixture copy under `client/public/phase4-test/` was removed before the final checks and was not committed.

## Acceptance matrix

Statuses mean: **Pass** = executed in the real app and supported by direct evidence; **Partial** = some required behavior passed but a stated boundary remains; **Fail** = executed and produced an invalid result; **Not tested** = no claim made.

| Test | Status | Direct evidence |
|---|---|---|
| Human Whisper test with ground truth | Not tested | No qualifying human recording and ground truth existed. No WER was invented. |
| Whisper WER, substitutions/deletions/insertions | Not applicable | Cannot calculate a valid WER without the required reference transcript. |
| Project persistence after reload | Partial | Opening a saved project after navigating to `/studio` restored the saved project entry and showed the app message that saved transcript/settings remain locally. The project then requested the original `ui-test.mp4` because the source had not been stored in OPFS. |
| Caption timing editor | Pass | The start input was changed from `0.00` to `1.00` through the live app control. The export screen then showed `0:01 — 0:10 · 9 sec`, proving the clip range change propagated to the export state. |
| Caption timing persistence into export | Pass | The exported ZIP’s WebM was 9.011 seconds, consistent with the edited 1–10 second range, rather than the original 0–10 second range. |
| Template catalog count | Pass | The live UI displayed `15 EDITABLE DESIGNS`; the existing unit test also asserts exactly 15 unique templates, three per category. |
| All 15 templates change actual styling | Pass | Each of the 15 template cards was clicked in the live browser. Every card became `is-selected`; preview caption classes/styles changed across caption style, position, background color, and/or font family. Examples: Listing Hero → clean/bottom/DM Sans; Editorial Listing → editorial/middle/Georgia; Social Proof → bold/middle/Arial; Boardroom Brief → editorial/top/Georgia. Full per-template evidence was captured from the browser DOM during the test. |
| MP4 export | Not supported in this environment | The live export screen reported `WebM / VP9 + Opus detected on this device`, displayed `FORMAT WebM`, and did not offer an MP4 output. The code supports an MP4 branch when the browser reports H.264/AAC, but this Chromium environment did not report that encoder pair. No MP4 success claim is made. |
| Batch/ZIP export | Pass | Clicking the real `Render selected + ZIP` button completed with `Finished 1 clips. You can save each one or download the ZIP.` The downloaded `/home/ubuntu/Downloads/ui-test-phase4-clips.zip` was 377.3 KiB and contained one `Property-cut-1.webm` entry. |
| ZIP payload validity | Pass | `unzip -l` showed one valid entry. `ffprobe` on the extracted WebM reported VP9 + Opus, 1080×1920, 30 fps, 9:16, duration 9.011 s, 406,238 bytes. |
| Logo upload and preview | Pass | The real PNG was uploaded through the brand logo input. The UI changed to `Replace local logo` and exposed `Remove`; the preview displayed the orange logo at bottom right. |
| Logo in final video | Pass | A frame extracted at 2 seconds from the final WebM inside the downloaded ZIP visibly contained the orange logo at bottom right. Evidence image: `/home/ubuntu/acceptance/phase4-export-frame.png`. |
| Arabic translation | Pass from previous phase; not unnecessarily repeated | The previous live browser run executed `onnx-community/opus-mt-en-ar` locally and produced three Arabic lines. No translation code changed after that successful run. |
| Arabic RTL preview/export | Pass from previous phase; not unnecessarily repeated | The previous live run showed `caption-arabic`, Arabic text, and `dir="rtl"`; the existing report records the successful Arabic WebM export. No related code changed after that run. |
| Final WebM encoding | Pass | The current final ZIP WebM passed `ffprobe` as VP9 + Opus, 1080×1920, 30 fps, 9:16, 9.011 s. The separately saved single-file export from the prior phase was also valid WebM. |

## Whisper result and WER

No valid Whisper accuracy result can be reported. The environment did not contain the required pre-existing human English recording and trusted ground truth. The synthetic/non-human 10-second fixture had a tone rather than speech and was intentionally not submitted as a Whisper quality test. Therefore:

- WER: **not calculated**
- Correct words: **not calculated**
- Substitutions: **not calculated**
- Deletions: **not calculated**
- Insertions: **not calculated**
- Human audio processing time: **not measured**

This is an explicit limitation, not a pass or a hidden failure.

## Export evidence

The final ZIP was downloaded from the live UI:

```text
/home/ubuntu/Downloads/ui-test-phase4-clips.zip
```

ZIP listing:

```text
Property-cut-1.webm  406238 bytes
```

`ffprobe` result for the extracted entry:

```text
video codec: vp9
video size: 1080x1920
video rate: 30/1 fps
display aspect ratio: 9:16
audio codec: opus
duration: 9.011000 seconds
size: 406238 bytes
```

The extracted visual evidence frame is:

```text
/home/ubuntu/acceptance/phase4-export-frame.png
```

It shows the title/caption rendering and the orange logo at the bottom-right of the 1080×1920 output.

## Fixes and changes included in the final commit

No new speculative feature was added during this phase. The previous implementation changes were retained and are included in the final commit because they were still uncommitted at the start of this phase:

1. Arabic was added as a supported translation target and connected to the real OPUS-MT English→Arabic ONNX model.
2. Arabic attribution was added to `THIRD_PARTY_NOTICES.md` and the Studio credits.
3. RTL direction and Arabic typography were added to the caption editor and live preview.
4. Export-side Arabic text rendering was updated to use RTL canvas direction and Arabic-safe rendering.
5. Translation messaging was corrected to describe phrase-timed output and avoid claiming word-level alignment for translated captions.
6. The acceptance documentation was expanded with the previous Arabic/export evidence and the current phase results.

No production source change was required by the current browser tests.

## Remaining buyer-impacting limitations

- Whisper quality remains unverified in this environment for human speech because no qualifying human recording and ground truth were available. The earlier report’s Whisper observations prove execution only, not production-grade accuracy.
- MP4 export depends on the browser’s H.264/AAC WebCodecs support. This tested Chromium environment exposed WebM only.
- Project metadata and captions persist in IndexedDB, but source media is not automatically stored unless the user selects the optional local-source save path. Reloading a project without the source stored asks for the original file again.
- Translated captions are phrase-timed; word-level alignment is not inferred for Arabic.
- The current export visual sample showed the caption and title card occupying overlapping vertical space. This is not an encoding failure, but buyers should review template/title/caption combinations before publishing.
- This phase validated a one-item ZIP batch. The implementation exposes a selected-clips batch path, but a multi-clip batch with several independently edited clips was not required to prove the one-item ZIP mechanism and was not claimed here.

## Final automated checks

| Command | Result |
|---|---|
| `pnpm check` | Pass — `tsc --noEmit` completed without errors |
| `pnpm test -- --run` | Pass — 14 test files, 94 tests passed |
| `pnpm build` | Pass — Vite and server bundle completed; known config-script/chunk-size warnings remained |
| `pnpm audit --prod` | Pass — `No known vulnerabilities found` |
| `git diff --check` | Pass — no whitespace errors |

## Git delivery

Validated implementation commit SHA: `41596fec168b339683f3b0864327b1f34f377d36`. The final pushed HEAD SHA and clean working-tree result are verified after push and recorded in the delivery response.
