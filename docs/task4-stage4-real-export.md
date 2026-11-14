# Task 4 — Stage 4: real export acceptance

Date: 2026-11-14

## Browser export

The restored `waqa-speech` project was opened at Export with the first candidate clip selected. Direct single-file export was attempted first, but the isolated browser rejected `showSaveFilePicker` because that API call was no longer inside a user gesture. This is a browser-environment limitation, not a render failure; the UI surfaced the exact failure instead of claiming success.

The documented ZIP fallback was then started through a real browser click. The batch contained one selected clip and completed with `Finished 1 clips`. The browser downloaded `waqa-speech-clips.zip` at approximately 15.4 MB.

## Media inspection

The ZIP contained one WebM file:

`However-there-are-areas-in-which-we-believe-that-collaboration-between.webm`

`ffprobe` verified:

- Container: WebM
- Duration: `28.989` seconds
- Video: VP9, `608 × 1080`, `30/1` fps
- Audio: Opus, `48,000 Hz`, 2 channels
- File size: `16,173,725` bytes

A frame extracted at three seconds was visually inspected at `608 × 1080`. It contains the speaker video plus the timed English source caption and Arabic translation on separate readable lines. The browser preview also showed the same dual-track caption (`However,` / `ومع ذلك،`) before rendering.

The export page correctly labels the output as a truthful `608 × 1080` portrait crop: the original `1920 × 1080` landscape source can supply only about `608 × 1080` source pixels for a centered 9:16 crop, so the larger 1080×1920 option is not falsely reported as native detail.

## Acceptance status

The export path is operational through the ZIP fallback, the resulting media is technically valid, and the burned-in bilingual caption is present in the final frame. The direct-save picker limitation remains an environment-specific warning that the UI already reports. No media was uploaded to a server.
