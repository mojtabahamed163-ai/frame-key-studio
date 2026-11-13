# Frame & Key Studio — Complete Acceptance and Quality Report
**Coverage:** Phases 4, 5, 6, and 7
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio
**Purpose:** Consolidated copy of all phase reports and real-media acceptance evidence for this task. The individual reports remain unchanged in the repository for traceability.
## Report index
1. `PHASE4_ACCEPTANCE_REPORT.md`
2. `PHASE5_REPAIR_AND_ACCEPTANCE_REPORT.md`
3. `PHASE6_REAL_MEDIA_ACCEPTANCE_REPORT.md`
4. `PHASE7_QUALITY_AND_CAPTION_REPORT.md`
5. `PHASE7_REAL_MEDIA_ACCEPTANCE_REPORT.md`

---


<!-- BEGIN PHASE4_ACCEPTANCE_REPORT.md -->

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


<!-- END PHASE4_ACCEPTANCE_REPORT.md -->


---


<!-- BEGIN PHASE5_REPAIR_AND_ACCEPTANCE_REPORT.md -->

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


<!-- END PHASE5_REPAIR_AND_ACCEPTANCE_REPORT.md -->


---


<!-- BEGIN PHASE6_REAL_MEDIA_ACCEPTANCE_REPORT.md -->

# Phase 6 Real Human Media Acceptance Report — Frame & Key Studio

**Date:** 2026-11-13  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Branch:** `main`  
**Test mode:** local Vite preview exercised through the real browser UI and DOM events; no mock transcription or translation service was used.

## Executive result

Phase 6 completed a real-media acceptance run using a licensed human speech recording. The workflow was executed end to end:

1. A public-domain Wikimedia Commons recording of President Kennedy's Rice University speech was downloaded together with its reference English transcript.
2. A 100-second MP4 excerpt containing the original human video and audio was uploaded through the Studio UI.
3. Whisper Base English ran locally in the browser and produced timed English captions from the actual speech.
4. The timed Whisper output was translated locally with OPUS-MT into Arabic, French, Spanish, and German. All four language runs produced non-empty translated caption lines while retaining the source cue timings.
5. The Arabic result was rendered into a 1080×1920 portrait WebM with the original audio, VP9 video, Opus audio, title overlay, and RTL Arabic captions.
6. The final WebM was downloaded from the live UI, inspected with `ffprobe`, and a frame was extracted for visual inspection.

No source media, downloaded model files, or large generated video was added to Git. Only this acceptance report is committed.

## Human source and ground truth

Source: Wikimedia Commons, “President Kennedy's Speech at Rice University” (`File:President Kennedy's Speech at Rice University.ogv`). The Commons page was checked before download; the recording is public-domain material. The repository does not redistribute the source media.

Local test files used outside the repository:

```text
/home/ubuntu/acceptance/phase6/source/kennedy-rice-full.ogv
/home/ubuntu/acceptance/phase6/source/kennedy-rice-100s.mp4
/home/ubuntu/acceptance/phase6/source/kennedy-rice.en.srt
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-final.webm
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-frame.png
```

The MP4 excerpt was cut from the human recording with FFmpeg while preserving the speech audio. The reference transcript was taken from the source-provided English SRT and aligned to the excerpt boundary. No TTS, `espeak`, generated speech, or artificial transcript was used.

## Whisper acceptance

The actual browser run used the UI's **Whisper Base English** option. The Studio reported a complete timed transcript of **195 timed words** and generated two editable candidate clips from that transcript:

| Candidate | Time range in the excerpt | Whisper-derived text |
|---|---:|---|
| 1 | 0:05–0:27 | “Congressman Thomas, Senator Wiley and Congressman Miller, Mr. Webb, Mr. Bell, scientists, distinguished guests, ladies and gentlemen…” |
| 2 | 0:45–0:55 | “For we meet in an hour of change and challenge, in a decade of hope and fear, in an age of knowledge and ignorance.” |

The first candidate was inspected in the UI but was not used for the final export because its Whisper segmentation split names and short fragments into unusually small cues. The second candidate was used for translation and export because its three timed cues form a coherent sentence while remaining directly sourced from Whisper output.

### WER result

WER was calculated after lowercasing and removing punctuation, using the licensed source transcript as reference and the full Whisper UI transcript as hypothesis. The excerpt-boundary comparison produced:

```text
reference words: 199
hypothesis words: 194
substitutions:    3
deletions:        6
insertions:       1
WER:              5.03%
```

The detailed calculation and edit examples are preserved outside the repository at:

```text
/home/ubuntu/acceptance/phase6/wer-results.json
/home/ubuntu/acceptance/phase6/calculate_wer.py
```

The principal differences were proper-name/intro omissions and a few lexical substitutions, including `I'm`/`I am`, `in`/`at`, and `outstrip`/`outstripped`. This is a measured result against the source transcript, not a claim that the model output is publication-ready without review.

## Local translation acceptance

The same three timed Whisper captions were translated from English in the browser. Each language loaded its local OPUS-MT model and produced actual text while preserving the source cue ranges.

| Target | Example output observed | Result |
|---|---|---|
| Arabic | `لأننا نجتمع في ساعة من التغيير والتحدي، في` / `عقد من الأمل والخوف، في عصر` / `المعرفة والجهل.` | Pass; RTL text displayed in the editor and preview |
| French | `Car nous nous réunissons dans une heure de changement et de défi, dans` / `une décennie d'espoir et de peur, à une époque` / `connaissance et ignorance.` | Pass |
| Spanish | `Para que nos encontremos en una hora de cambio y desafío, en` / `una década de esperanza y miedo, en una era de` / `conocimiento e ignorancia.` | Pass |
| German | `Denn wir treffen uns in einer Stunde des Wandels und der Herausforderung, in` / `ein Jahrzehnt der Hoffnung und Angst, in einem Alter von` / `Wissen und Unwissenheit.` | Pass |

The UI explicitly labels these translations as phrase-timed to the source and warns that word-level alignment is not inferred. That warning is accurate and remains visible for review.

## Final Arabic export

The Arabic version was exported from the live browser UI after selecting the second Whisper candidate. The downloaded file was:

```text
/home/ubuntu/Downloads/For-we-meet-in-an-hour-of-change-and-challenge-in-a-decade-of-hope-and.webm
```

A preserved acceptance copy is available outside the repository at:

```text
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-final.webm
```

### `ffprobe` result

```text
video codec:           vp9
video dimensions:      1080x1920
aspect ratio:          9:16
frame rate:            30/1
audio codec:           opus
sample rate:           48000 Hz
channels:              2
duration:               10.068000 seconds
size:                   11,444,492 bytes
mean audio volume:     -32.6 dB
max audio volume:      -14.5 dB
```

The file contains both a video stream and an audio stream. A frame extracted at five seconds was visually inspected at `/home/ubuntu/acceptance/phase6/final/kennedy-arabic-frame.png`; it shows the human speaker in the portrait crop and Arabic caption text rendered in the video. The Arabic text is visible separately from the title overlay, with no observed title/caption collision.

## Scope and limitations

- Whisper timing and translations are local browser results and remain editable; users should review proper names, meaning, line breaks, and phrase timing before publishing.
- The tested browser environment exposes WebM VP9/Opus rather than MP4 H.264/AAC, consistent with the capability detection already documented in Phase 5.
- The final artifact is intentionally kept outside Git because it is a large generated binary and the source recording is not part of the application repository.
- This phase added acceptance evidence and did not require a new application-code change; the tested Whisper, translation, RTL, export, persistence, and collision behavior is already present in the implementation committed in the preceding phases.


<!-- END PHASE6_REAL_MEDIA_ACCEPTANCE_REPORT.md -->


---


<!-- BEGIN PHASE7_QUALITY_AND_CAPTION_REPORT.md -->

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


<!-- END PHASE7_QUALITY_AND_CAPTION_REPORT.md -->


---


<!-- BEGIN PHASE7_REAL_MEDIA_ACCEPTANCE_REPORT.md -->

# Phase 7 — Real Media Acceptance Test

**Date:** 2026-11-13  
**Repository commit tested:** `faf9e370ad9f0ac0e3910618b08bfb29f635e99c`  
**Test mode:** local Vite app through the real browser UI; no mock transcript and no imported SRT/VTT

## Result

The additional real-media integration test passed for the requested Whisper and export paths. A real human speech recording was downloaded from Wikimedia Commons, converted only into a short local test excerpt, uploaded through the Studio UI, transcribed by the browser worker using Whisper Base English, turned into an editable clip, rendered by the browser export pipeline, downloaded, and inspected with `ffprobe`.

The source is President John F. Kennedy's Rice University speech. Wikimedia Commons identifies the recording as NASA material and marks it public domain in the United States; the JFK Library independently describes the same NASA coverage and lists its copyright status as public domain. [1] [2]

## Source media

The original source file was:

```text
https://upload.wikimedia.org/wikipedia/commons/1/16/President_Kennedy%27s_Speech_at_Rice_University.ogv
```

The Commons page reports an 18-minute-15-second recording at 640×480. The local test excerpt was cut from the real recording at approximately 00:45 for 12 seconds, preserving real human video and speech audio:

```text
/home/ubuntu/acceptance/phase7/source/kennedy-rice-12s.mp4
```

The excerpt metadata was verified before upload:

```text
video: H.264, 640×480, approximately 12 seconds
 audio: AAC, 44.1 kHz, stereo
size: 2,511,537 bytes
```

No reference transcript or subtitle file was supplied to the Studio. The test used the video's own audio as the only transcription input.

## Whisper browser test

The file was uploaded in the Studio UI and displayed as `kennedy-rice-12s.mp4`, 640×480, with audio detected. The Speech language control was set to **English**, and the workflow was left on **Transcribe only**.

The UI loaded the local speech model and completed analysis. It reached the Pick moments step and reported **24 timed words** in the full transcript. The visible transcript began:

> “I am delighted to be here, and I'm particularly delighted to be here on this occasion. We meet at a college, noted for knowledge,”

The transcript remained local and editable. Because the short excerpt did not produce a self-contained candidate according to the editor's sentence/segment rules, the UI correctly displayed no automatic suggestions and offered **Add manual clip**. A manual 12-second clip was created for the export portion of the acceptance test.

## Export browser test

Before export, the UI was set to the lighter **720 × 1280** output profile. The source-aware export logic correctly limited the actual canvas to the source height rather than upscaling the 640×480 source. The Studio displayed:

```text
9:16 output: 270 × 480 · 30 fps
format: WebM
```

The clip was rendered locally with captions enabled. The UI reported the file ready at 4.6 MB, and the Save file action downloaded:

```text
/home/ubuntu/Downloads/Property-cut-1.webm
```

The downloaded file was independently inspected:

```json
{
  "video": {
    "codec": "vp9",
    "width": 270,
    "height": 480,
    "frame_rate": "30/1"
  },
  "audio": {
    "codec": "opus",
    "sample_rate": "48000",
    "channels": 2
  },
  "duration_seconds": 12.032,
  "size_bytes": 4776759
}
```

A frame extracted at five seconds was visually inspected at:

```text
/home/ubuntu/acceptance/phase7/final/export-frame.png
```

The frame shows the real speaker in a 9:16 crop and the Whisper-derived caption rendered visibly over the video. The output contains both a video and an audio stream, confirming that the export path did not silently drop the original speech audio.

## Acceptance conclusion

The requested additional test confirms that the current application can process a real human video through the browser-local path: local source ingest, actual Whisper model loading, timed speech transcription, editable clip creation, portrait rendering, caption burning, audio preservation, file download, and post-export media inspection all completed successfully.

This test intentionally used the available 640×480 source, so it validates source-aware low-resolution behavior rather than 720p/1080p quality. The result was not upscaled: it was exported at 270×480. A separate 720p/1080p acceptance run would be needed to measure higher-resolution output quality, bitrate behavior, or perceptual metrics such as PSNR/SSIM.

Translation was not part of this additional request and was not claimed here. No code change was required after the test; the test confirms the already-pushed implementation at commit `faf9e370ad9f0ac0e3910618b08bfb29f635e99c`.

## References

[1]: https://commons.wikimedia.org/wiki/File:President_Kennedy%27s_Speech_at_Rice_University.ogv "Wikimedia Commons file page and public-domain metadata"
[2]: https://www.jfklibrary.org/learn/about-jfk/historic-speeches/address-at-rice-university-on-the-nations-space-effort "JFK Library historic speech record and public-domain status"


<!-- END PHASE7_REAL_MEDIA_ACCEPTANCE_REPORT.md -->

