# Task 4 — Stage 5: language acceptance

Date: 2026-11-14

All language checks used the same restored `waqa-speech` project and the same Whisper-produced caption cues from the selected 29-second clip. No prepared transcript or SRT/VTT was used.

## Results

| Target | Actual path | Live result |
|---|---|---|
| Arabic | OPUS-MT `opus-mt-en-ar` | 10/10 caption lines; preview began `However,` / `ومع ذلك،` |
| French | OPUS-MT `opus-mt-en-fr` | 10/10 caption lines; preview began `However,` / `Toutefois,` |
| Spanish | OPUS-MT `opus-mt-en-es` | 10/10 caption lines; preview began `However,` / `Sin embargo,` |
| German | OPUS-MT `opus-mt-en-de` | 10/10 caption lines; preview began `However,` / `Die` |
| English | explicit source-copy path | preview showed source text twice; no translation model was started |

For the English target, the application deliberately uses `copyEnglishCues` because the source is already English. It does not claim an English→English OPUS-MT model exists and does not download a needless model. The supported OPUS-MT direction in this project is English→Arabic/French/Spanish/German.

All four model-backed runs displayed `Translated 10 caption lines on this device`, retained the source cue IDs/timing, produced non-empty results, and updated the preview without losing the source track. Arabic characters rendered correctly in the preview with the existing caption styling.

The translation UI continues to state that these outputs are phrase-timed to the source and are not word-level aligned. Model quality remains subject to human review; the acceptance evidence verifies execution, line completeness, stable mapping, and display—not perfect linguistic accuracy.
