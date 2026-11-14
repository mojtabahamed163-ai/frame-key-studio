# Task 4 — Stage 3: caption modes and persistence acceptance

Date: 2026-11-14

## Product fix

After restoring a saved project, the editor previously showed the resulting caption track but did not expose the caption workflow selector. That made it impossible to verify or change the three supported modes without uploading the source again. The captions panel now exposes the persisted `Caption workflow` selector with:

- Transcription only — source line
- Translation only — translated line
- Transcription + translation — both lines

Changing the selector only changes the displayed track; it does not delete the saved source transcript or translated cues.

## Live five-cycle result

Using the restored `waqa-speech` project, the browser UI ran five complete cycles through all three modes (15 mode transitions total):

- `transcribe-only`: the first three visible cues remained English source text and the preview showed `However,`.
- `translate-only`: the first three visible cues changed to Arabic (`ومع ذلك،`, `وهناك مجالات نعتقد فيها أنه`, `يمكن أن يقوم التعاون بين الدول والجهات الفاعلة غير الحكومية بما يلي:`) and the preview showed the Arabic line.
- `transcribe-and-translate`: the first three source cues remained available, and the preview showed both `However,` and `ومع ذلك،` on separate lines.

After the fifth cycle, the project was returned to the dual-track mode, the source step was opened, the saved `waqa-speech` project was reopened, Pick moments was opened, and the selected clip was opened again in Refine edit. The restored selector was `transcribe-and-translate`, the preview showed both tracks, and the saved Arabic translation remained visible. The transcript remained available at 623 timed words.

## Checks

`pnpm check`, all 19 Vitest files / 132 tests, `pnpm build:static`, and `git diff --check` passed. The build has only the existing non-blocking warning about the platform config script and large chunks.

The remaining acceptance item is a real media export from this restored project, followed by `ffprobe` inspection of the generated file and a clean GitHub commit.
