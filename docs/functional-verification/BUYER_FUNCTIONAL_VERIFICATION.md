# Frame & Key Studio — Functional Verification Report

**Repository:** `mojtabahamed163-ai/frame-key-studio`  
**Required test commit:** `442f5c6290b92e65112ae150b758f060617c97b4`  
**Tested commit:** `442f5c6290b92e65112ae150b758f060617c97b4`  
**Current repository after test:** `main` at `59f7083e3e6e6cc00c63e03598015eb77ccb2b50`  
**Report scope:** evidence-based operational verification of the visible `/studio` workflow. This report does not certify every browser, codec, model, or deployment environment.

## 1. Version gate and test conditions

The required commit was available locally and was checked out in a detached working tree for the live test. At the initial preflight, `HEAD` and `origin/main` both pointed to `59f7083e3e6e6cc00c63e03598015eb77ccb2b50`, not to the requested test commit. Therefore, the exact commit was tested, but it was **not** the same revision as the then-current `origin/main`. No application files were changed. After testing, the worktree was returned to the current `main` branch and remained clean.

The application was started from the required commit with the repository's development server on port 3000. The test used a real Chromium browser through the visible UI. Playwright Core was installed temporarily outside the repository solely to automate the browser and record the session; it was not added to the project. The server required no application-code change: the forwarded host was allowed through a temporary environment variable.

The evidence directory is outside Git at:

`/home/ubuntu/qa-artifacts/task4-2026-11-15/`

It contains the source media metadata, screenshots, browser text/event logs, and Playwright session recordings. No source video or generated media was added to the repository.

## 2. Test source

The test source was downloaded from the same Wikimedia Commons item documented in the repository's Task 4 source record:

- **Title:** H. E. Mr Baron Waqa — speech at Connect Asia-Pacific 2013 Summit
- **File page:** `https://commons.wikimedia.org/wiki/File:HE_Mr_Baron_Waqa,_MP_President,_Nauru_(Republic_of)_-_speech_at_Connect_Asia-Pacific_2013_Summit.webm`
- **Direct file route:** `https://commons.wikimedia.org/wiki/Special:FilePath/HE%20Mr%20Baron%20Waqa%2C%20MP%20President%2C%20Nauru%20%28Republic%20of%29%20-%20speech%20at%20Connect%20Asia-Pacific%202013%20Summit.webm`
- **License recorded in repository:** Creative Commons Attribution 3.0 Unported (CC BY 3.0), with attribution and modification notice requirements.
- **Local test filename:** `source.webm`
- **Local test path:** `/home/ubuntu/qa-artifacts/task4-2026-11-15/source.webm`
- **Duration:** 414.502 seconds (6:54.502)
- **File size:** 71,813,058 bytes
- **Video:** WebM/Matroska, VP8, 1920×1080, 25 fps
- **Audio:** Vorbis, stereo, 44.1 kHz
- **SHA-256:** `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`

The properties above were read from the downloaded source with `ffprobe` and recorded in `source-ffprobe.json` and `source-sha256.txt`. No prepared SRT/VTT file, saved transcript, generated speech, generated video, or paid inference API was used.

## 3. Results summary

| Function | Result | Evidence-based conclusion |
|---|---|---|
| Source import and media analysis | **PASS** | The UI accepted the real WebM, displayed `6:54`, `1920 × 1080`, `audio detected`, and saved the source locally without an application upload. |
| Whisper transcription | **FAIL** | The real Analyze button was used. After approximately 601 seconds, no transcript, timed words, or suggestions appeared; the UI returned to the source state. |
| Transcript-based clip suggestions | **NOT TESTED** | No Whisper transcript was available. A manual 0:00–0:30 clip could be created, but that is not evidence of automatic suggestions. |
| English→Arabic OPUS-MT translation | **NOT TESTED** | The prerequisite Whisper transcript was not produced, so no honest UI translation run was possible. |
| Portrait 9:16 framing | **PARTIAL** | The editor displayed the portrait preview and 9:16 output controls, including 608×1080 source crop / 1080×1920 output choices. No final encoded file was produced to verify the output bytes. |
| Face tracking | **PASS** | The real Find face action ran on the video. The UI reported 25/39 detections, 2 held samples, 12 manual fallbacks, and an 8.8-second longest gap. It explicitly did not identify the speaker. |
| Captions and caption editing | **NOT TESTED** | No transcript/caption lines existed after Whisper failed. No prepared caption file was imported. |
| Final export | **FAIL** | The real export action was attempted for both a 30-second and a 5-second manual clip. The UI reported `Export cancelled. No incomplete file was added to the results.` No final download was produced. |

## 4. Detailed evidence by test

### Test 1 — Import and media analysis: PASS

The visible `/studio` interface accepted `source.webm` through the actual video file input. The source screen displayed:

- `source.webm`
- `68 MB`
- `1920 × 1080`
- `audio detected`
- `6:54`
- `Source saved on this device`
- `IndexedDB local file storage`

The interface also stated that nothing was uploaded. This confirms the import and metadata path for this source in the tested browser session. The source facts independently match the local `ffprobe` record, apart from the UI's rounded human-readable size.

Evidence:

- `screenshots/02-source-loaded.png`
- `ui-after-upload.txt`
- `ui-buttons.json`
- `source-ffprobe.json`
- `source-sha256.txt`
- `recording/48db94857b4b2eec32291323ca6f0dfa.webm`

### Test 2 — Whisper transcription: FAIL

The test clicked the visible `Analyze speech on this device` button after importing the real source. The browser session remained active for approximately 601 seconds. No transcript text, word timings, model completion state, or clip suggestions appeared. The final captured UI had returned to the initial source screen, with only the saved source entry visible. Browser console events contained only Vite connection and React DevTools messages; there was no explicit application error message.

The code configures `Xenova/whisper-base.en` for English and `Xenova/whisper-tiny` for the other source-language path, but the failed run did not produce enough runtime evidence to prove which model completed inference. The result is therefore a runtime failure, not a claim about model quality.

Evidence:

- `screenshots/03-whisper-result.png`
- `whisper-ui.txt`
- `whisper-events.json`
- `recording-whisper/3466a8e309ae894aea29ae2a13d7e935.webm` (approximately 602.8 seconds)

### Test 3 — Automatic clip suggestions: NOT TESTED

The required transcript-driven suggestion test could not proceed because Whisper produced no transcript. The separate manual path did create one editable manual clip from `0:00` to `0:30`; this proves that a manual cut can be entered, but it does not prove automatic suggestions.

Evidence for the manual fallback only:

- `screenshots/04-manual-cut.png`
- `screenshots/05-after-manual-action.png`
- `manual-ui.txt`
- `manual-ui-after-action.txt`
- `manual-events.json`
- `recording-manual/49bd7a214293e4b4552e9fa637124d2c.webm`

### Test 4 — English→Arabic translation: NOT TESTED

The test did not insert a prepared translation or caption file. Because the required source transcript was not produced by Whisper, the OPUS-MT Arabic path could not be exercised honestly. No Arabic translation result or timed translated line is claimed.

### Test 5 — Portrait 9:16 framing: PARTIAL

The manual editing screen displayed `9:16 / PORTRAIT`, portrait framing controls, and the output choices `1080 × 1920` and `720 × 1280`. The interface also stated that the crop uses approximately `608×1080` source pixels for the higher output and cannot restore missing detail. A manual clip was selected and the vertical framing option was applied in the test automation.

This is evidence of the visible preview/control path only. The final encoded output could not be inspected because export failed.

Evidence:

- `screenshots/06-refine-open.png`
- `screenshots/07-face-framing-complete.png`
- `refine-before.txt`
- `refine-after-export.txt`
- `recording-refine/68ea4c63412beb1e3e7ad591360a5f13.webm`

### Test 6 — Face tracking: PASS

The visible `Find face` action was run on the real source and a manual 30-second cut. The application reported:

- 25 detections out of 39 sampled times.
- 2 held samples.
- 12 manual fallbacks.
- Longest detection gap: 8.8 seconds.
- A warning to review the crop.
- An explicit statement that the tracker does not identify who is speaking.

The browser also logged software-WebGL fallback in Chromium. This result proves that the face-detection/framing path ran and produced a reported track with fallback behavior in this test environment; it does not prove consistent tracking on all devices or scenes.

Evidence:

- `screenshots/07-face-framing-complete.png`
- `refine-after-export.txt`
- `refine-events.json`
- `recording-refine/eeffafc68ded1fa05eec09ccadbbd6cb.webm`

### Test 7 — Captions and editing: NOT TESTED

The editor exposed caption controls, SRT/VTT download controls, and the caption workflow selector. However, it displayed `No caption lines yet. Transcribe speech or import an SRT/VTT file.` Since Whisper failed and no prepared caption file was allowed for this verification, actual caption text editing, timing editing, and rendered caption verification were not performed.

### Test 8 — Final export: FAIL

The real `Export selected clip` action was attempted from the delivery screen. It was first attempted on a 30-second manual clip and then on a 5-second manual clip. Both attempts ended with:

`Export cancelled. No incomplete file was added to the results.`

No final file was downloaded or saved, so there is no honest final filename, output SHA-256, `ffprobe` result, or extracted output frame to report. The failure occurred even after reducing the clip duration and disabling the browser File System Access feature in the second attempt. The captured browser events included aborted local `blob:` media requests, but no application error stack was exposed.

Evidence:

- `screenshots/09-export-capture.png`
- `screenshots/10-export-short.png`
- `export-capture-ui.txt`
- `export-capture-events.json`
- `export-short-ui.txt`
- `export-short-events.json`

## 5. Session recording

Real UI sessions were recorded with Playwright and checked with `ffprobe`. The recordings show the actual application, not a mock HTML page. Relevant recordings include:

- Source import: `recording/48db94857b4b2eec32291323ca6f0dfa.webm`
- Whisper attempt: `recording-whisper/3466a8e309ae894aea29ae2a13d7e935.webm`
- Manual cut: `recording-manual/49bd7a214293e4b4552e9fa637124d2c.webm`
- Refinement/face/export attempts: files under `recording-refine/`

A final exported application clip was not recorded because the export operation did not produce one. The browser recordings are stored outside the repository to avoid adding large binary artifacts.

## 6. Final limitations

The tested commit was exact, but it was not the same revision as `origin/main` at preflight because the repository's current `main` had subsequently received documentation commits. The operational result applies to `442f5c6290b92e65112ae150b758f060617c97b4`, not automatically to later revisions.

The results show a working local source-import path and a working face-detection path with reported fallbacks. They do not establish successful Whisper inference, automatic suggestions, Arabic translation, captions, or export for this session. No user, revenue, performance, or production-hosting claims are made.

No application file, model, setting, or UI source was changed. No commit or push was created for this verification task. The working tree was clean after returning to the current `main` branch.
