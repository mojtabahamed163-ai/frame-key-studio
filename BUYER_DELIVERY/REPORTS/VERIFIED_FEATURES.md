# Verified Features

Status is based on repository code, prior QA evidence, and independently repeated command checks in the seller checkout. It is not a promise of universal browser compatibility.

| Feature | Status | Evidence basis |
|---|---|---|
| Local source import and metadata inspection | PASS | Prior real-media reports and included source ffprobe |
| Local Whisper transcription | PASS with review warnings | Prior real-browser QA reports; repository worker/tests |
| Transcript-derived clip suggestions | PASS | Prior buyer-demo reports and analysis tests |
| Editable captions and clip boundaries | PASS in prior QA | Prior stage reports and unit tests |
| Portrait 9:16 preview/framing | PASS in prior QA | Included vertical exports and inspection frames |
| Local English→Spanish translation workflow | PASS with review warnings | Repeated in the real Studio UI on the preserved source; the UI reported local OPUS-MT translation complete for 110 timed caption lines |
| Spanish captions in an application-exported WebM | PASS with scope limitation | `EXPORTS/Frame_and_Key_Studio_Translated_ES_Export.webm` is a genuine 608×1080 VP9/Opus export of the selected 28.989-second clip; the extracted frame visibly shows `Sin embargo,` beneath `However,` |
| Local WebM export | PASS in historical QA | `Verified-Bilingual-Arabic-Export.webm`, ffprobe/decode evidence |
| Source-language-caption export | PASS as historical export | `Original-Source-Language-Export.webm`, ffprobe/decode evidence |
| Audio preservation in export | PASS in verified Arabic export | VP9 video + Opus stereo audio |
| Face tracking | PARTIAL / NOT UNIVERSAL | Code/tests and prior limited QA; do not generalize |
| Production hosting/SaaS | NOT VERIFIED / NOT INCLUDED | No production URL or managed service is present |
