# Problem 3 QA Report — Face Tracking and Vertical Framing

**Date:** 2026-10-16
**Branch:** `fix/problem-3-face-tracking` (based on `main`)
**Scope:** Face tracking, subject positioning, and 9:16 framing only. Transcription and clip-selection behavior were not changed.

## Root causes and fixes

- In the reproduced browser case, MediaPipe did not return stable detections when given the `HTMLVideoElement` directly. The scan now waits for the requested decoded frame, renders it into a size-limited canvas, and passes that canvas to the local detector. Bounded ROI scans are used for reacquisition rather than enlarging every full-frame scan.
- The detector could return a high-scoring box over a hand or foreground texture. Box confidence and temporal continuity alone were insufficient to establish that the candidate was a face. Candidate selection now requires MediaPipe's named eye, nose, and mouth landmarks to form a plausible geometric layout; it rejects the hand-like eye/nose pattern reproduced in the real test footage.
- After the 1.35-second hold window, a candidate must reach a confidence score of `0.56` to reacquire. This keeps weak candidates in the manual fallback while allowing the returning real face (confidence `0.571` at `16.5s`) to be reacquired. The score is the tracker's combined geometry/continuity score, not MediaPipe's model probability.
- Face position is smoothed over time. A brief loss holds the last reliable position; the transition to the manual center is interpolated rather than snapped. A reacquired face then resumes the moving crop.
- Preview and export use the same bounded portrait-crop geometry and source-space face center. The crop rectangle is constrained to the source frame. The preview maps the same crop to CSS `object-position`.
- The close-up warning now prioritizes whether the detected face itself fits the crop, rather than rejecting it solely because an expanded headroom margin does not fit.

## Final-code real-browser checks

All final-code checks below used local video files in the browser. The media was not uploaded to the app or a third-party API.

| Scenario | Final-code result |
|---|---|
| Hands covering a face — Pexels `11-man-hands-occlusion.mp4` | `23/51` detected, `2` held, `26` manual; longest detection gap `9.5s`. The false detections at `10.5s` and `14.5s` are now manual-center points (`x=0.5`) instead of shifting the crop to a hand. The face is reacquired at `16.5s` with confidence `0.571`, then detection continues through the returning-face segment. |
| Multiple people — Pexels conference footage | `39/39` detected. Around the tested scene changes, the crop center progresses from `x=0.515` at `9.6s` to `0.583` at `11.2s`, then remains near `0.659` from `28.8s` to `30s`. The largest adjacent sample change was `0.036`; browser preview at `28.8s` kept the presenter in frame after another person entered. |
| Side-to-side speaker movement — Pexels `02-moving-speaker.mp4` | `36/38` detected, `2` brief holds, no manual fallback; longest detection gap `1.6s`. Crop-center range was `0.498–0.647`, with a maximum adjacent sample change of `0.048`. The two misses held the previous position instead of producing a crop jump. |

### Earlier baseline scenarios

These were verified in the first pass, before the final landmark gate and reacquisition threshold were tightened. They are retained as historical baseline evidence and are not represented as reruns of the final code.

| Scenario | Earlier result |
|---|---|
| Close-up speaker | `28/28` detected; no hold/manual points and no unsafe crop points. |
| Approach and apparent size change | `37/37` detected; crop-center range `0.462–0.549`. |
| Subject near frame edge | `37/38` detected and one brief hold; no manual fallback; crop-center range `0.256–0.397`. |
| Empty room | `0/29` detected; the app safely offered manual framing rather than inventing a face track. |

## Preview/export crop parity

A real local export was rendered from the hands-occlusion clip as WebM/VP9 at `1080 × 1920`, 30 fps, for `24.7s`. At `16.5s`, the browser preview used `object-position: 58.6602% 50%`. The shared crop geometry resolved to a source rectangle of `1215 × 2160` at `(left=1690, top=0)` in the `4096 × 2160` source frame, fully within its bounds. The rendered export frame was compared with that same source crop after resizing to `1080 × 1920`; SSIM was `0.979587` overall (R `0.981682`, G `0.983934`, B `0.973147`). Visual subject placement matched. The small pixel difference is expected from VP9's lossy encoding and resampling; this is crop/framing parity, not bit-for-bit image identity.

The export remained local. The temporary rendered file and extracted comparison frames were test artifacts, not project deliverables.

## Automated checks

| Check | Result |
|---|---|
| `pnpm check` | Passed. |
| `pnpm test -- --run` | Passed — `52/52` tests across `8` test files. Includes landmark rejection, long-gap reacquisition, smooth held-to-manual fallback, and crop geometry coverage. |
| `pnpm build` | Passed. Existing non-blocking warnings remain for the platform config script and a large JavaScript chunk. |
| `git diff --check` | Passed. |

## Limitations and remaining risk

- This is face detection and continuity tracking, not face recognition or speaker identification. In a scene with several visible people, the app cannot infer which person the user intends to follow; review the crop before export.
- During real hand occlusion, the face is unavailable for a long interval. The safe fallback stays at the manual center until a sufficiently strong face returns, so it cannot guarantee that a subject off-center during that interval remains centered.
- Extreme close-ups can exceed the physical width of a 9:16 crop. The app warns rather than claiming the full face fits; manual framing or the full-video/studio-background mode may be preferable.
- Landmark geometry reduces the reproduced hand false positives but cannot mathematically guarantee that every unusual pose, severe blur, or occlusion will be classified correctly. The crop remains reviewable and manually adjustable.

## Change boundary

The work stays on the dedicated `fix/problem-3-face-tracking` branch. No merge to `main` or deployment was performed. The final correction is limited to face-candidate validation and its tests, plus this QA report; temporary test videos are excluded from the source changes. Problem 1 was not modified.
