# Cursor Visibility Enhancement Notes

Date: 2026-11-16

## Source and preservation

The enhanced video was derived from the existing `DEMO/Frame-and-Key-Studio-Complete-Buyer-Demo.mp4` only. The untouched source was copied byte-for-byte to `DEMO/Backup/Original-Complete-Buyer-Demo-UNCHANGED.mp4`; both files have SHA-256 `69c2906303d5ec4630987b9583cd14ec36ed73f4da68e19a31f0849af78c6120`.

## Evidence and treatment

The source screen capture contains a native hand-pointer captured at the same screen location in inspected frames. A small stationary halo makes that observed pointer easier to notice. The source does not contain dependable pointer-motion or click-event telemetry; no cursor path, movement, or exact click coordinate has been reconstructed or invented. Brief `VISIBLE STEP` callouts are synchronized to visible application-state transitions and describe what becomes visible, not a claimed click action:

- 00:01:54 — transcript review / moments are visible.
- 00:02:46 — selected-clip editor is visible.
- 00:03:04 — export settings are visible.
- 00:03:24 — application-generated export preview is visible.
- 00:03:37 — return to the Studio editor is visible.

The callouts provide orientation at screen-state changes; they do not assert a specific mouse gesture. No application code, recording content, audio, or test suite was changed or regenerated.

## Output validation

`DEMO/Frame-and-Key-Studio-Complete-Buyer-Demo-Cursor-Enhanced.mp4` is H.264, 1920×1080, 25 fps, 300.920 seconds, video-only/silent. Full decode completed successfully. The source and backup remain unchanged. Output SHA-256: `f06fb41cefa8c31d32e65f52b909179179a063a5f2944f22562be09450080d4c`.
