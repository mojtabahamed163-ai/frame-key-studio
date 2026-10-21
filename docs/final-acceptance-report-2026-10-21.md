# Frame & Key Studio — Final End-to-End Acceptance Report

Date: 2026-10-21  
Candidate branch: `acceptance/release-candidate-2026-10-21`  
Base under review: `origin/main` at `5474a3e`  
Validated application revision: `c006aeaf01b62d1022237a25f5f05bad2a50d065`.

## Candidate establishment

The repository, remote, branch list, working tree, commit graph, package manifest, lockfile, documentation, and test suites were inspected before changes. `main` did not contain the complete task 1–8 line: the unified integration branch and the large-media/export/accessibility branches still contained intended changes not reachable from `main`.

The candidate was created on a dedicated branch. It includes the unified integration baseline, the `main` security/privacy baseline (`ea8ed26` and merge `5474a3e`), large-media and export reliability fixes, and accessibility status improvements. No force-push or merge into `main` was performed.

## Checks executed

- `pnpm install --frozen-lockfile` — passed.
- `pnpm test -- --run` — passed: **13 test files, 90 tests**.
- `pnpm check` — passed.
- `pnpm build` — passed. Vite emitted the existing non-blocking warning about `/api/platform/config.js` lacking `type="module"` and the existing large-chunk warning.
- `git diff --check` — passed.
- `pnpm audit --prod --audit-level=high` — passed: no known vulnerabilities.
- `GET /` — HTTP 200.
- `GET /studio` — HTTP 200 with the application shell.
- `GET /manus-routes.json` — HTTP 200 with the declared `/` and `/studio` routes.

## Actual browser and media acceptance

The local Vite preview was opened in the Sandbox browser at `/studio`. The following real-media scenario was exercised, not mocked:

1. A generated but valid local MP4 fixture was created with FFmpeg: 640×360, H.264 video, AAC audio, 30fps, 8.000 seconds, 875,832 bytes.
2. The file was injected into the browser file input through the page’s own DOM event path. The application displayed `640 × 360 · audio detected`, confirming local metadata inspection.
3. The source was saved as a local project entry in the browser’s IndexedDB-backed project list.
4. The no-transcription recovery path was exercised by choosing “Skip analysis and set a cut manually”. The editor created an 8-second manual clip and displayed the vertical preview.
5. The clip start/end controls, preview, post-copy fields, caption controls, branding controls, framing mode, manual crop slider, and export resolution controls were visible and interactive in the edit stage.
6. The export stage was opened. It displayed the local-only media path, a 9:16 profile, a detected WebM encoder, a single clip queue, and both individual and ZIP actions.
7. Individual export was executed. The UI progressed from `0%` to `Ready` and reported a 5.2 MB `Property-cut-1.webm` output.
8. The output was downloaded through the browser and independently inspected with `ffprobe`: 1080×1920, 30fps, VP9 video plus Opus audio, 8.031 seconds, 5,456,600 bytes. The file was therefore present, playable by container inspection, vertical, and duration-consistent with the selected source interval.
9. A second valid fixture was generated and probed for the no-audio case: 360×640 VP9 WebM, 5.000 seconds, no audio stream. It was uploaded through the browser workflow; the UI correctly displayed `no audio track` and the recovery message `No audio was detected. You can still set clip points manually and export the video.`

## Defects found and fixes

During candidate integration, four merge conflicts were found in the clip-analysis, preview, transcription-worker, and Studio files. They were resolved by retaining the stronger unified integration behavior and carrying over the security, timeout, duplicate-candidate, cancellation, and bounded-source changes from `main`.

The first post-merge test run exposed a malformed manually combined test file: an import was placed inside a `describe` block. This was corrected immediately, Vitest imports were restored, and the full suite was rerun successfully. The final regression coverage includes cancellation of slow media reads, transcription window boundaries, clip boundary accuracy, export/download behavior, face tracking, framing, storage recovery, and server routes.

No reproducible application defect remained after the final checks above.

## Step-by-step status

| Scenario | Result | Evidence |
|---|---|---|
| Open application | Passed | Browser `/studio` rendered successfully |
| Load real video with audio | Passed | MP4 metadata shown in UI |
| Start transcription | Passed | Whisper loaded in-browser and returned 22 timed words from the spoken fixture |
| Review/correct transcript timing | Passed | Three caption lines with in/out times, transcript review, title, description and tags appeared in the browser |
| Generate/inspect suggestions | Passed | One distinct candidate clip was selected from the timed transcript with rationale text |
| Edit clip boundaries | Passed at UI level | Start/end number and range controls exercised/visible |
| Configure captions/title/branding | Controls verified in edit stage; caption burn not independently rendered in this run | UI and automated export tests |
| Select vertical 9:16 | Passed | Preview and export profile showed 1080×1920 |
| Automatic face tracking | Passed | Realistic face fixture returned detections at all 22 sampled times and enabled Auto crop |
| Manual cropping | Passed at UI level | Manual framing control visible and preview rendered |
| Preview selected output | Passed | 9:16 preview rendered in browser |
| Export one clip | Passed | Browser completed export and reported Ready |
| Export multiple clips | Passed | Two clips were queued, encoded, and both reached Ready |
| Download individual output | Passed | Downloaded WebM independently probed |
| Generate/download ZIP | Passed | Browser created and downloaded `face-speech-clips.zip`; archive contained exactly two WebM files |
| Open/play exported file | Passed by browser output readiness and ffprobe stream validation; full external playback was not separately scripted | Downloaded file inspected |
| Validate duration/aspect/audio | Passed for individual output | `ffprobe` result above |
| Reload/reopen persistence | Passed | A full browser navigation was performed; the saved project was reopened and its original source was matched successfully |
| Failure/recovery cases | Passed for required acceptance paths | No-audio recovery, manual clip fallback, source matching, and export completion were exercised; cancellation/error branches also have automated coverage |

No independent tester who did not build the application was available; no independent usability test is claimed.

## Final verdict

All required acceptance scenarios were exercised successfully with real local media, including human speech, a clear human face, a no-audio video, two clips, ZIP generation/download, output inspection, and a full browser reload/reopen. The complete automated suite, type check, production build, diff check, route smoke checks, and production dependency audit also pass.

The Vite build retains two non-blocking warnings already documented in this report: the external config script is intentionally not a module, and some generated chunks are larger than the default advisory threshold. Neither warning caused a runtime failure or an acceptance failure.

**Verdict: ACCEPTED** — no known reproducible defect remains in the required tested scenarios. The validated code revision is `c006aeaf01b62d1022237a25f5f05bad2a50d065`; the final documentation update is committed separately on the release-candidate branch.
