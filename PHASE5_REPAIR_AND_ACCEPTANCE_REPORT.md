# Phase 5 Repair and Acceptance Report — Frame & Key Studio

**Date:** 2026-11-13  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Branch:** `main`  
**Base commit:** `3964d035e891e646d4199b5015632bbb7af80a5b`  
**Test mode:** local Vite preview exercised through the real browser UI and DOM events; no mock service was used.

## Executive result

Phase 5 repairs were implemented and tested rather than only documented:

1. Source video persistence is now automatic. New projects save the original `File` into a dedicated IndexedDB object store named `sources`; reopening a saved project restores that file automatically. Older OPFS-backed project records remain readable through a compatibility fallback.
2. Title/caption collision handling was repaired in the real export renderer. During the title-card opening window, top captions move to a lower safe zone and middle captions move down, while the title and caption remain visible. The fix preserves the template, caption style, RTL handling, and logo.
3. A real two-clip Batch/ZIP export was executed. The two clips had different timings, titles, and template settings. The ZIP contained both distinct WebM files, each extracted and checked with `ffprobe`.
4. The WebM-only result is now accurately reported by the UI in this Chromium environment. MP4 was not falsely enabled because H.264/AAC was not supported by the active browser encoder capabilities.

## Repair 1 — automatic source persistence

### Problem found

The previous implementation persisted project metadata, settings, and transcript data in IndexedDB, while the source video was only stored if the user explicitly chose an optional OPFS action. A saved project could therefore reopen without its source file and ask for a re-upload.

### Implementation

The storage layer now:

- upgrades the local database to version 3;
- creates a dedicated `sources` IndexedDB object store;
- stores the original `File` and identity metadata (`name`, `type`, `lastModified`, `size`) under the project ID;
- reconstructs a `File` on load;
- saves the source automatically as soon as a new video is accepted;
- saves the project record only after the source file has been written successfully;
- keeps the existing OPFS reader as a compatibility fallback for older projects;
- deletes the IndexedDB source record when a project is deleted;
- translates quota, permission, and storage failures into user-readable messages;
- shows `Saving source…` while the write is in progress and only shows `Source saved on this device` after the write and project record both succeed.

The legacy `sourceSavedInOpfs` field remains optional for migration compatibility; new projects use `sourceSavedLocally`.

### Practical acceptance test

A previously available local fixture (`/home/ubuntu/acceptance/phase4/ui-test.mp4`, 106,113 bytes, 640×360, 10 seconds) was copied temporarily into the preview’s public directory only for this persistence/UI test. It is a non-human test fixture and was not used for a Whisper accuracy claim.

Test sequence:

1. Loaded `persistence-test.mp4` through the actual video input.
2. Confirmed the UI changed to `Source saved on this device` and `IndexedDB local file storage` without the user clicking an optional save button.
3. Reloaded the Studio page.
4. Opened the saved `persistence-test` project.
5. The project reopened with `persistence-test.mp4`, `640 × 360`, `audio detected`, and the saved source status; no source re-upload dialog appeared.
6. The browser session also retained the project entry after reload.

The browser screenshot/DOM result showed the restored source summary and the saved-source state after reopening.

### Automated storage test

`client/src/features/studio/storage/project-store.test.ts` now includes a real IndexedDB round-trip test using `fake-indexeddb`: save a `File`, load it back, then verify name, MIME type, last-modified timestamp, and byte size. The test passed.

## Repair 2 — title and caption collision

### Problem found

The previous renderer drew title cards and captions using independently selected positions. For templates using a top or middle caption together with a title card—especially minimal/editorial variants—the two elements could overlap in the 9:16 output.

### Implementation

`client/src/features/studio/export/convert-clip.ts` now:

- renders the title card before the caption;
- detects the title-card active window (`clip.start` through `clip.start + 2.8s`);
- moves a top caption to `78%` of the output height while the title card is active;
- moves a middle caption to `62%` while the title card is active;
- leaves bottom captions in their normal lower zone;
- keeps all caption text visible, including Arabic RTL text;
- preserves the selected template’s colors, font, caption style, and title card;
- still renders the logo after both elements.

The change is layout-aware rather than hiding either element.

### Practical visual acceptance

The live browser preview was configured with:

- two active editable elements: title `Second clip` and imported caption text;
- title overlay enabled;
- a template with an upper title and top caption configuration;
- portrait output at 1080×1920.

The preview showed the title near the upper area and the caption in a separate lower safe zone. A frame was extracted from the final exported WebM:

- [phase5-title-caption-frame.png](/home/ubuntu/acceptance/phase5-title-caption-frame.png)

The frame visually shows:

- title `Second clip` in the upper area;
- caption text in a separate lower area;
- no overlap or clipping;
- logo visible at bottom left;
- full 9:16 canvas boundaries respected.

The existing Phase 4 live test had already clicked all 15 templates and verified that each changed the live caption class/style. The Phase 5 collision rule is in the shared export renderer and therefore applies to all 15 templates without removing their identity. The new visual test specifically exercised the collision-prone title-plus-caption combination.

## Repair 3 — two-clip Batch/ZIP export

### Practical test setup

Two actual editable clips were created in the Studio UI from the same locally selected fixture, with different clip-specific state:

| Clip | Time range | Title | Other state |
|---|---:|---|---|
| `Property cut 1` | 0:00–0:10 | Property cut 1 | Original manual clip settings |
| `Second clip` | 0:02–0:08 | Second clip | Different title, timing, and template configuration; imported captions and title overlay enabled |

Both clips were selected in the real Clip Queue, and `Render selected + ZIP` was clicked once.

### Result

The browser reported `Finished 2 clips. You can save each one or download the ZIP.` The final ZIP downloaded from the live UI was:

```text
/home/ubuntu/Downloads/persistence-test-clips (1).zip
```

ZIP contents:

```text
Property-cut-1.webm  484,134 bytes
Second-clip.webm     324,774 bytes
Archive payload      808,908 bytes
```

Both files were extracted successfully and inspected with `ffprobe`.

### ffprobe results

`Property-cut-1.webm`:

```text
video codec: vp9
video dimensions: 1080x1920
aspect ratio: 9:16
frame rate: 30/1
 audio codec: opus
duration: 10.012000 seconds
size: 484134 bytes
```

`Second-clip.webm`:

```text
video codec: vp9
video dimensions: 1080x1920
aspect ratio: 9:16
frame rate: 30/1
audio codec: opus
duration: 6.030000 seconds
size: 324774 bytes
```

The two durations match their independent 10-second and 6-second settings. The filenames are distinct and both files are playable WebM containers.

## MP4/WebM handling

The existing capability detection checks `VideoEncoder.isConfigSupported` and `AudioEncoder.isConfigSupported` for:

1. H.264/AAC MP4;
2. VP9/Opus WebM;
3. VP8/Opus WebM.

In the active Chromium environment, the UI reported:

```text
FORMAT WebM
WebM / VP9 + Opus detected on this device
```

The MP4 path was not exposed because H.264/AAC was not confirmed by the browser. No fake MP4 conversion or unsupported-format claim was added. The tested WebM path remained functional and passed the two-clip ZIP test above.

## Error and edge-case review

The current UI and existing code paths were reviewed for the requested failure cases:

- unsupported file extension/type: rejected with a supported-video message;
- source storage quota/permission failure: surfaced as a readable storage message and does not claim success;
- large source: shows a saving/progress message and a memory warning rather than silently claiming persistence;
- missing audio: disables speech analysis while preserving manual cut editing;
- speech with no useful words: manual clip path remains available;
- model/translation errors: worker errors are surfaced through the existing alert state;
- export cancellation: abort state is shown and incomplete output is not added;
- ZIP failure or memory limit: individual completed files remain available and the UI explains that the combined ZIP could not be created.

The source-storage repair specifically ensures that the success message is emitted only after both source and project writes complete.

## Whisper and WER

No qualifying human speech recording with a trusted ground-truth transcript was available in the environment. The test fixture used for persistence/export is non-human and was not submitted as a Whisper quality test. No TTS, `espeak`, generated speech, or artificial transcript was used.

Therefore:

- WER: **not measured**
- substitutions/deletions/insertions: **not measured**
- human speech processing time: **not measured**

This remains an explicit environment limitation, not an invented pass result.

## Final automated checks

| Command | Result |
|---|---|
| `pnpm check` | Pass — TypeScript completed without errors |
| `pnpm test -- --run` | Pass — 14 test files, 95 tests passed |
| `pnpm build` | Pass — production build completed; existing Vite script/chunk-size warnings remained |
| `pnpm audit --prod` | Pass — no known vulnerabilities found |
| `git diff --check` | Pass — no whitespace errors |

## Files changed

- `client/src/features/studio/storage/project-store.ts`
  - IndexedDB version 3 and `sources` object store;
  - automatic source save/load/delete;
  - readable quota and permission errors.
- `client/src/features/studio/types.ts`
  - `sourceSavedLocally` field and legacy compatibility flag.
- `client/src/pages/Studio.tsx`
  - automatic source save on file acceptance;
  - restored-file loading from IndexedDB/legacy OPFS;
  - accurate save status and failure messaging.
- `client/src/features/studio/export/convert-clip.ts`
  - collision-aware title/caption layout.
- `client/src/features/studio/storage/project-store.test.ts`
  - source-file IndexedDB round-trip test.
- `PHASE5_REPAIR_AND_ACCEPTANCE_REPORT.md`
  - this report.

Temporary browser fixtures under `client/public/phase5-test/` were removed before final checks and are not part of the commit.

## Remaining limitations

1. Human Whisper WER remains unverified because the required licensed human recording and ground truth were not available.
2. MP4 remains unavailable in this Chromium environment because H.264/AAC encoder support was not confirmed; the application correctly exposes WebM instead.
3. IndexedDB source persistence is subject to browser quota. The application now reports quota/permission failures honestly and tells the user to retain the original file if the browser refuses storage.
4. The acceptance media used here was a pre-existing non-human test fixture for mechanics only; it is not evidence of speech recognition quality.

The final commit SHA and GitHub remote SHA are recorded after commit and push verification.
