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
2. Record one continuous real Playwright browser session at 1920×1080 with a clearly visible in-page cursor overlay and click indicators — in progress; attempt 1 reached real import, transcription, suggestions, and editor, then stopped on an automation selector error; attempt 2 reached the real caption textarea but its automated typing verification did not persist the value; attempt 3 completed real caption editing, Spanish translation, and 9:16 preview, then stopped on an export-navigation selector mismatch.
3. Verify the actual UI results; stop and document any failed required feature rather than fabricating it — complete: import, transcription, suggestions, caption edit, Spanish translation, and vertical preview passed; WebM export timed out.
4. Convert the same WebM recording to silent MP4 at 1920×1080 and 25 fps — not run because no complete final recording exists.
5. Verify the MP4 with ffprobe/full decode, write the ordered interaction log, update buyer delivery documentation, commit, and push — not applicable for a failed export; this failure checkpoint is committed and pushed. Export-only investigation completed: direct picker path fails before Mediabunny; ZIP fallback succeeds without source changes.

Attempt 1 evidence is preserved at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-1-caption-selector-failure.webm`; attempt 2 at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-2-caption-save-failure.webm`; attempt 3 at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-3-export-navigation-selector-failure.webm`; attempt 4 at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-4-real-export-timeout.webm`. None is a final deliverable. Attempt 1 stopped because the recording script looked for an aria-label that the real caption textarea does not expose. Attempt 2 stopped because the scripted typing/check did not persist the edit in the live React control. Attempt 3 verified the edit, real Spanish translation, and 9:16 preview, then stopped on a selector mismatch. Attempt 4 corrected the selector and reached the real WebM export, but the application did not complete export within 600 seconds; no exported WebM, final MP4, or successful buyer demo is claimed. The in-page cursor overlay is explicitly a recording aid inside the web page, not a claim about the operating-system cursor. No artificial audio or narration will be added.

## Final attempt — ZIP workaround

The final buyer demo will use the verified `Render selected + ZIP` path only. It will not click `Export selected clip`. The final recording and extracted WebM will use new filenames and will preserve all prior evidence. The recording will end only after the actual downloaded ZIP is extracted, the WebM is opened in Chromium, and FFprobe verifies the extracted file.
