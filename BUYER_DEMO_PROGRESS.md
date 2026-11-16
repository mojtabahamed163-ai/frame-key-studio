# Buyer Demo Progress

## Stage 1 — preflight complete

- Branch: `buyer-delivery-2026-11-16`
- Starting commit: `44b56e3` (`Improve buyer demo cursor visibility`)
- Application source: unchanged; no files under `client/src` or application logic modified.
- Existing demo videos and buyer delivery files: preserved.
- Real source video: `BUYER_DELIVERY/SOURCE/Frame-and-Key-Studio-Original-Source.webm`
- Source SHA-256: `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`
- Source media: VP8 WebM, 1920×1080, 25 fps, 414.502 seconds, audio present.
- Application: started locally from this branch and opened at `/studio`.
- Playwright: available outside the repository for browser recording; Chromium available at `/usr/bin/chromium`.

## Planned stages

1. Preflight and preserve existing delivery files — complete.
2. Record one continuous real Playwright browser session at 1920×1080 with a clearly visible in-page cursor overlay and click indicators — in progress; attempt 1 reached real import, transcription, suggestions, and editor, then stopped on an automation selector error.
3. Verify the actual UI results; stop and document any failed required feature rather than fabricating it — pending.
4. Convert the same WebM recording to silent MP4 at 1920×1080 and 25 fps — pending.
5. Verify the MP4 with ffprobe/full decode, write the ordered interaction log, update buyer delivery documentation, commit, and push — pending.

Attempt 1 evidence is preserved at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-1-caption-selector-failure.webm`; it is not a final deliverable. The stop was caused by the recording script looking for an aria-label that the real caption textarea does not expose. The in-page cursor overlay is explicitly a recording aid inside the web page, not a claim about the operating-system cursor. No artificial audio or narration will be added.
