# Task 3 — Stage 3 evidence: quality preservation review

Date: 2026-11-14

This stage reviewed the current `main` code after the asynchronous caption fixes. No export profile, codec selection, source-aware resolution rule, frame-rate rule, audio encoding setting, caption background behavior, or RTL rendering rule was reduced.

## Reviewed behavior

- `convert-clip.ts` keeps the existing browser export path and preserves primary video and audio streams. The output height remains capped at the source height; the selected 1280×720 landscape source therefore yields a 405×720 portrait canvas rather than manufacturing larger detail. Video bitrate remains 6 Mbps at 720-pixel height and 12 Mbps at 1920-pixel height, with 30 fps output. The audio path remains Opus for WebM or AAC for MP4 at 128 kbps, stereo, 48 kHz encoder capability checks.
- Captions remain transparent over the video. The renderer uses a restrained glyph outline and shadow; the Arabic path sets RTL direction and strokes before white fill so the outline does not obscure thin connected glyphs.
- `VideoPreview.tsx` and `caption-placement.ts` keep the preferred zone stable and move away only when tracked face placement would be unsafe. The exporter holds the chosen safe caption position across frames.
- `caption-tracks.ts` composes the source line first and its translation below it in dual mode. It matches by source cue identity, not array order. The two single-track modes select only their respective track. The recent async fix changes which translation result may be committed; it does not clear the saved source or translation track when the user changes modes.

## Regression checks

- `pnpm check` — PASS after the latest code change.
- Full Vitest suite — PASS: 19 files, 132 tests.
- Focused quality/track suite — PASS: 5 files, 52 tests covering export profiles, cropping, captions, placement, clip analysis, and track composition.
- `git diff --check` — PASS.

This stage is a code and regression-test review, not a new visual export acceptance. A fresh full-source browser export after the current fixes is still pending; do not treat earlier exported files as proof of the latest Arabic glyph-rendering or export behavior. The practical re-export will be recorded only after the selected current test video is processed in the app and the resulting media is inspected.
