# New Buyer Demo Status — 2026-11-16

The new Playwright recording was stopped honestly at the real WebM export step. The actual application session successfully showed the real source import, local transcription, suggested clips, caption editing, Spanish translation, and vertical 9:16 preview. Playwright recorded the real mouse movements and clicks using a visible in-page cursor overlay; the overlay is not claimed to be the operating-system cursor.

The real `Export selected clip` action was clicked. The application reported WebM as the supported format, but `Your finished files.` did not appear within 600 seconds. Therefore no successful application WebM was downloaded, no final recording MP4 was produced, and no successful new buyer demo is claimed. The stopped recording is preserved only as failure evidence at `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-4-real-export-timeout.webm`.

## Watch the recorded evidence

Public viewing URL for ChatGPT or a reviewer:

<https://files.manuscdn.com/user_upload_by_module/session_file/310519663978170894/bmagtxirMdGztNAy.webm>

This URL points to the same 456.040-second, silent 1920×1080/25 fps Playwright recording preserved in the repository. It is evidence of the real workflow up to the export timeout, not a successful final buyer demo.

Existing demo videos and buyer delivery files were preserved. No application source, logic, or design files were modified. No artificial audio, narration, fabricated cursor path, fabricated click, or fabricated export result was added.

## Export investigation

A targeted export-only investigation found that direct `showSaveFilePicker` export is cancelled before `exportClip` starts in Chromium headless/Playwright. The existing ZIP path completes the same real WebM conversion successfully without application changes. See [the technical investigation report](EXPORT_TIMEOUT_INVESTIGATION_2026-11-16_AR.md).


## Final status update — ZIP workaround completed

The earlier timeout checkpoint above remains preserved as historical evidence. It is now superseded for delivery by the final continuous ZIP-workaround recording:

- Final MP4: `../DEMO/Frame-and-Key-Studio-Complete-Buyer-Demo-ZIP-2026-11-16.mp4` — H.264, 1920×1080, 25 fps, 163.400 seconds; full decode passed.
- Raw capture: `../DEMO/Playwright-Raw-2026-11-16/Frame-and-Key-Studio-Buyer-Demo-ZIP-2026-11-16.webm`.
- Downloaded ZIP: `../EXPORTS/Frame-and-Key-Studio-Buyer-Demo-ZIP-2026-11-16.zip` — 30,045,285 bytes.
- Extracted canonical WebM: `../EXPORTS/Frame-and-Key-Studio-Buyer-Demo-ZIP-2026-11-16.webm` — VP9/Opus, 608×1080, 30 fps, 28.989 seconds; FFprobe and full decode passed.

The final recording visibly reaches `Render selected + ZIP`, waits for the real finished-files state, clicks `Download all as ZIP`, preserves the actual download, extracts the WebM files, and opens an extracted WebM in Chromium. The direct `Export selected clip` path was not used, and application source remains unchanged.
