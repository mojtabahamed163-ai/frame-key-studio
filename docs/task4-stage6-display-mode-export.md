# Task 4 — Stage 6: display-mode export acceptance

Date: 2026-11-14

The same selected `waqa-speech` clip was checked in the live editor and Export screen for all three caption modes. Each mode used the same 29-second clip, same crop, same 608×1080 / 30 fps WebM profile, and the same local source file.

## Mode results

1. **Transcription only** — the preview showed `However,` only. The Export screen preview showed the same source line and a ZIP render completed with `Finished 1 clips` / `Ready`. No Arabic line was visible.
2. **Translation only** — the preview showed `ومع ذلك،` only. The Export screen preview showed the Arabic line without the English source line and a second ZIP render completed with `Finished 1 clips` / `Ready`.
3. **Transcription + translation** — the preview showed `However,` followed by `ومع ذلك،` on a separate line. The dual-track ZIP was rendered earlier and independently inspected with `ffprobe` and a decoded frame; it contained valid VP9 video plus Opus audio and visibly burned bilingual captions.

The mode selector is persisted with the project, and switching modes invalidates prior rendered outputs so an output cannot be mistaken for a render made under a different caption mode. The selected clip, timing, crop, audio, and local-only behavior remained unchanged across the three checks.

## Caption placement evidence

The decoded dual-track frame showed the bilingual caption in a stable lower safe zone while the speaker and important podium content remained visible. The editor did not add an opaque caption bar; text remained readable via the existing outline/shadow treatment. The preview and rendered frame agreed on the placement.

The application still displays the expected human-review warning for machine-generated transcript timing near model-window boundaries. This warning is preserved in the Export screen and does not claim perfect recognition.
