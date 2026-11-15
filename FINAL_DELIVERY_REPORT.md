# Frame & Key Studio — Final Delivery Report

Date: 2026-11-16
Branch: `manus/ultimate-buyer-delivery-2026-11-15`
Application commit: `e1ac035a219243bc65c6dd2b4e2273d1edb7434e`

## Result

**PARTIAL — the technically fixable File Picker defect was repaired and the edited-caption export was independently verified. The native save-dialog and complete buyer screen recording remain unverified in this sandbox browser environment.** No missing acceptance item is represented as passed.

## Implemented fix

`requestSaveTarget()` no longer races `showSaveFilePicker()` against a 2.5-second timeout. The previous timeout abandoned a still-active native request; the next export then failed with Chromium's exact `NotAllowedError: File picker already active.` The function now awaits the picker and writable target directly in the trusted export click path. A regression test covers successful writable-target resolution.

Modified files:

- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/export/convert-clip.test.ts`

## Verified in this run

- Required source restored from the documented Wikimedia Commons URL: 71,813,058 bytes.
- Source SHA-256: `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`.
- Real local Whisper analysis completed: 591 timed words and 3 candidate clips.
- A real Whisper-generated caption was edited to `However, VERIFIED EDIT,`, persisted after navigation to Export, and appeared in the editor preview.
- New edited-caption export saved from the application: `edited-caption.webm`.
- Export SHA-256: `71c347cdf93746b2ab65d4a6c7db296a68436a1ca5916d62568edf2695986d70`.
- FFprobe: WebM, VP9 video, Opus audio, 608×1080, 30 fps.
- Complete FFmpeg decode: passed with an empty error log.
- Representative start/middle/end frames were extracted; the first frame visibly contains the edited caption.
- `pnpm check`: passed.
- `pnpm test -- --run`: passed, 21 files / 141 tests.
- `pnpm build`: passed.
- `git diff --check`: passed.

## Native picker result

Before the fix, a real instrumented browser attempt recorded `NotAllowedError: File picker already active.` The stale request was caused by the old timeout race. After the fix, a fresh browser session no longer falls back after 2.5 seconds; it waits for the actual native dialog. The Manus Sandbox browser did not expose a controllable native OS dialog, so saving through the real native dialog could not be completed here. This is recorded as an environment limitation, not a claimed native success.

## Not completed

No new complete buyer screen recording was produced in this run. No native-path output file was claimed. Translation, face-tracking, and full recording evidence from prior runs were not relabeled as new evidence. The available package therefore does not satisfy the original PASS conditions.

## Buyer setup

Run with Node.js and pnpm, then `pnpm install`, `pnpm dev`, and open `/studio` in a headed Chromium browser. The local Whisper and OPUS-MT model files require network access on first use. Media remains browser-local. Native File System Access requires a secure context and a browser that surfaces the native dialog from a trusted user gesture.
