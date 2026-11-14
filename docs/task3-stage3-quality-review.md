# Task 3 — Stage 3 evidence: quality preservation review

Date: 2026-11-14

The quality review was performed against the current `main` checkout after the caption-run fix. No export profile, codec, frame-rate, source-aware resolution rule, caption background behavior, or RTL rendering rule was downgraded.

## Reviewed implementation

- `client/src/features/studio/export/convert-clip.ts` still selects WebM through the existing browser export path, preserves video and audio streams, and derives the portrait canvas from the source-aware effective height rather than blindly upscaling.
- Caption drawing remains transparent over the video. The Arabic path draws a restrained outline first and the white glyph fill second, preserving connected Arabic letters and contrast without a covering rectangle.
- `client/src/features/studio/components/VideoPreview.tsx` and `caption-placement.ts` still resolve a stable preferred caption zone and move only when the tracked face would be covered.
- `caption-tracks.ts` still composes source first and translated line second for the dual mode. It selects only the requested track for the two single-track modes.
- The new async guard changes only which stale result may commit; it does not mutate a saved source or translation track when display settings change.

## Automated evidence

- `pnpm check` — PASS.
- Full `pnpm test -- --run` — PASS: 19 files, 128 tests.
- Baseline `pnpm build` and `pnpm audit --prod` — PASS before the stage 2 code change; the stage 2 change is typechecked and covered by the full test run.
- `git diff --check` — PASS.

The browser media run did not produce a new post-fix export from the full 5:25 source in this sandbox. Therefore this stage records preservation by code review and regression tests, not a new visual acceptance claim. Historical WebM/VP9/Opus export evidence remains in `PHASE7_REAL_MEDIA_ACCEPTANCE_REPORT.md` and `MISSION3_HANDOFF_TO_NEW_MANUS_AR.md` with its original commit and limitations.
