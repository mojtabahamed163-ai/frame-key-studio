# Export Failure Investigation Report

**Repository:** `mojtabahamed163-ai/frame-key-studio`  
**Investigated revision:** `1fcbc7f5c202659c80b8e24e9709f430238e6909`  
**Previous repair revision:** `6a16b048625f87113edfcf1a77a869e227b41517`  
**Investigation date:** 2026-11-15  
**Browser:** Chromium 156.0.8078.73 on Ubuntu 24.04.5 LTS

## Executive result

**PASS for the required WebM workflow.** A genuine public video was imported through the real application, a five-second vertical 9:16 clip was exported and saved, and a 30-second vertical 9:16 clip was then exported and saved. Both downloaded files were independently inspected outside the editor with FFprobe and fully decoded with FFmpeg without errors.

No new application code defect was identified in the current revision, so no code change was made during this investigation. The confirmed export defect found in the preceding repair work was the repeated File System Access picker race, and it is already fixed in `6a16b04`. The historical November demonstration remains a partial/failing demonstration and is not rewritten as a success.

## Preserved work and evidence

The repository was cloned into a separate investigation checkout. The checkout was clean before and after testing. Existing buyer reports, recordings, evidence references, and prior outputs were not deleted or overwritten. New evidence was written separately under:

`/home/ubuntu/qa-artifacts/export-investigation-2026-11-15/`

The genuine source was downloaded from the documented Wikimedia Commons `Special:FilePath` route and retained outside Git. Its size was 71,813,058 bytes and its SHA-256 was recorded in `source/source-sha256.txt`. The source was imported into the application as `source.webm`; no old export was used as the new source.

## Historical failure and confirmed technical cause

The preserved functional-verification report for the earlier demonstration records that both 30-second and five-second exports ended with `Export cancelled. No incomplete file was added to the results.`, with no final file and no stack trace. That report remains historically accurate.

Review of the code and the preceding repair commit confirmed a real, reproducible defect in the earlier export path:

1. `requestSaveTarget()` called `showSaveFilePicker()` and raced it against a 2.5-second timeout.
2. When the timeout won, export proceeded through the existing in-memory `BufferTarget` path, but the original native picker request could remain active.
3. A later picker request could then reject with `NotAllowedError` because a picker was already active.
4. The old UI cancellation message collapsed multiple abort paths and did not identify this exception, so the preserved historical evidence cannot prove that every earlier cancellation had exactly this cause.

The repair in `6a16b04` catches synchronous and asynchronous picker `NotAllowedError`, clears the timeout after the race settles, aborts a late writable target when the request has already settled, and safely falls back to `BufferTarget`. The added regression test simulates an already-active picker. The current real export run reached `Conversion.init`, `Conversion.execute`, and `BufferTarget` completion, with no worker error or unhandled rejection in the browser console.

## Current implementation reviewed

The investigation reviewed:

- Job creation and selected-clip/batch dispatch in `client/src/pages/Studio.tsx`.
- Queue state transitions: queued/rendering/ready/failed/cancelled.
- `requestSaveTarget()` and File System Access fallback.
- `BufferTarget` and `StreamTarget` creation in `client/src/features/studio/export/convert-clip.ts`.
- Mediabunny `Input`, `Output`, `Conversion.init`, `Conversion.execute`, video frame processing, audio processing, and final buffer/blob creation.
- Abort handling and output cancellation.
- Browser download handling in `client/src/features/studio/export/download.ts`.
- Existing export and download tests.

The current implementation did not show a new failure in job creation, state transitions, Mediabunny initialization, frame processing, audio processing, BufferTarget finalization, Blob creation, or download handling during the real run.

## Reproduction procedure

1. Started the current checkout with the development server.
2. Opened the real `/studio` application in Chromium.
3. Imported the genuine `source.webm` file through the application’s video source input.
4. Used “Skip analysis and set a cut manually” so Whisper failure could not be confused with export failure.
5. Set the clip to `0.00–5.00` seconds, kept vertical 9:16 framing, and used the application’s detected WebM / VP9 + Opus format.
6. Clicked `Export selected clip`.
7. Waited for the UI to report `Ready`, clicked `Save file`, and copied the browser download into the new QA directory.
8. Repeated the same real workflow for `0.00–30.00` seconds after the five-second export succeeded.
9. Captured browser console output and independently ran FFprobe, SHA-256, frame counting, and full FFmpeg decoding.

## Five-second export

**Result: PASS.** The UI reached `Ready`, reported a 2.7 MB `Property-cut-1.webm`, and produced a browser download.

| Property | Verified value |
|---|---|
| QA file | `outputs/clip-05s.webm` |
| Size | 2,829,717 bytes |
| Container | Matroska/WebM |
| Video | VP9, 608×1080, 30 fps |
| Audio | Opus, stereo, 48 kHz |
| Duration | 5.027 seconds |
| Video frames | 151 frames reported by the encoded stream check |
| SHA-256 | `cc18661369732676843f0a2183eccee882e965325e6dd6d9fb1761b978d2e0c2` |
| FFmpeg full decode | PASS; no errors |

The file was copied out of the browser download directory and validated outside the editor. FFprobe reported `Mediabunny v1.61.4` as the encoder tag. The browser console recorded `Conversion.init:done`, `Conversion.execute:done`, and `BufferTarget:done`; no export exception, worker error, or unhandled rejection was observed.

## Thirty-second export

**Result: PASS.** The UI reached `Ready`, reported a 17 MB `Property-cut-1.webm`, and produced a browser download.

| Property | Verified value |
|---|---|
| QA file | `outputs/clip-30s.webm` |
| Size | 17,310,022 bytes |
| Container | Matroska/WebM |
| Video | VP9, 608×1080, 30 fps |
| Audio | Opus, stereo, 48 kHz |
| Duration | 30.027 seconds |
| SHA-256 | `9aea633549404beabbf6f9b33c99e807959736b87eef73b858ada9faa3315ff2` |
| FFmpeg full decode | PASS; no errors |

## Tests and build results

Executed from the clean investigation checkout:

- `pnpm check` — **PASS**
- `pnpm test -- --run` — **PASS**, 21 test files and 140 tests
- `pnpm build` — **PASS**. Vite emitted only the existing informational warning about the non-module `api/platform/config.js` script and a chunk-size warning; the build completed successfully.
- `git diff --check` — **PASS**

The existing regression test for the picker race is in `client/src/features/studio/export/convert-clip.test.ts`.

## Files changed

No application source files were changed during this investigation. No new regression test was needed because the confirmed picker defect and its focused regression test are already present in the previous repair commit.

The only new repository files created by this task are this report and its Arabic counterpart. The binary source and export evidence remain outside Git in the QA directory listed above.

For provenance, the preceding confirmed repair changed:

- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/export/convert-clip.test.ts`
- `vite.config.ts`
- `docs/BUYER_CRITICAL_FIXES_REPORT.md`
- `docs/BUYER_CRITICAL_FIXES_REPORT_AR.md`

## Limitations and non-claims

- Only WebM / VP9 + Opus was tested in this run. MP4 / H.264 + AAC is **not** claimed.
- The result is verified in Chromium 156.0.8078.73 on this Linux sandbox only; all browsers are not claimed.
- FFmpeg fully decoded the saved audio and video streams outside the editor. No separate human listening/viewing session was used as a substitute for the independent technical checks.
- The historical generic cancellation message remains under-specified; the old evidence does not identify one unique originating exception.
- The previous buyer demonstration remains partial and is not rewritten as successful.

## Git status and commit information

Current revision: `1fcbc7f5c202659c80b8e24e9709f430238e6909`  
Branch: `main`, tracking `origin/main`  
Working tree before report creation: clean  
No commit or push was created by this investigation. The report files are intentionally left as uncommitted requested deliverables; authorization is required before any commit or push.
