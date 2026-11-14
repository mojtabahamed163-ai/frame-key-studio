# Task 3 — Stage 4 evidence: real Whisper and OPUS-MT language coverage

Date: 2026-11-14

Using the same 5:25 Obama recording, the app ran Whisper locally on decoded audio with no SRT/VTT input. The completed full English run produced 778 timed words and three candidate clips; the earlier run produced 445 words and three candidates. The UI retained review warnings rather than masking uncertain timestamps.

The selected 0:53–1:17 clip produced 13 source caption lines. OPUS-MT was then run locally on those Whisper-produced lines for each supported target language:

| Language | Actual path | Selected-clip result | Reviewed sample |
|---|---|---:|---|
| English | direct source copy; no translation model needed | 13 lines | `So what,` |
| Arabic | `onnx-community/opus-mt-en-ar` | 13 lines | `So what,` → `لذا ما الذي` |
| French | `onnx-community/opus-mt-en-fr` | 13 lines | `So what,` → `Et alors ?` |
| Spanish | `onnx-community/opus-mt-en-es` | 13 lines | `So what,` → `¿Y qué?` |
| German | `onnx-community/opus-mt-en-de` | 13 lines | `So what,` → `Na und?` |

The full-recording Arabic run also produced 130 translated lines. Arabic was visually reviewed in the browser and in the exported WebM: connected glyphs and RTL order were visible, while the app continued to label the output as machine translation requiring review. The French, Spanish, and German samples were checked for non-empty output and plausible target-language wording; no accuracy guarantee is claimed.

The source transcript, translated tracks, and model progress/results remained available after navigation and mode changes. Translation results were rejected when incomplete or empty by the existing worker merge logic, and the new full-snapshot race guard prevents a late result from overwriting changed timings or word boundaries.
