# التقرير النهائي للعرض / Final Buyer Demonstration Report

> هذا الملف يجمع النسختين العربية والإنجليزية في مستند واحد.

# تقرير العرض النهائي للمشتري

**المشروع:** `mojtabahamed163-ai/frame-key-studio`  
**الـ checkout:** `e124451451bf91490a892141d168321073d71540`  
**مجلد الأدلة:** `/home/ubuntu/qa-artifacts/final-buyer-demo-2026-11-15/`  
**الحالة النهائية:** **FAIL / فشل**

## الملخص

تم تنفيذ عرض حقيقي باستخدام Chromium headed على الـ checkout المطلوب، من دون تعديل مصدر التطبيق أو التبعيات أو إعدادات المشروع، ومن دون commit أو push أو نشر. تم التحقق من فيديو المصدر الحقيقي واستيراده داخل التطبيق بنجاح. اكتمل تشغيل Whisper المحلي وأنتج ثلاثة اقتراحات حقيقية مع نص مؤقت وتوقيتات.

بعد ذلك تم تشغيل مسار English-to-Arabic الحقيقي باستخدام نموذج OPUS-MT المحلي. فشلت الترجمة برسالة التطبيق الفعلية:

> Whisper transcription is complete and remains available, but local translation failed: The translation model returned an empty result for caption 10. Review the source or retry translation before export.

تم عرض إطار عمودي 9:16 داخل المحرر، لكن لم يتم التحقق من نجاح تتبع الوجه، ولم يتم تحرير caption فعلي، ولم ينتج تصدير جديد يمكن التحقق منه مستقلًا. ووفق معايير القبول المرفقة، لا يجوز تصنيف هذه النتيجة PASS أو PARTIAL؛ الحالة الصحيحة هي **FAIL** لأن أي تصدير جديد قابل للتحقق لم يُنتج.

## بيئة التشغيل

- Chromium: `156.0.8078.73`
- المسار: `/usr/bin/chromium`
- الوضع: headed (`headless: false`)
- User-Agent: `Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36`
- Xvfb: `1440x1000`، عمق 24-bit في التشغيل المخصص.
- خادم التطبيق شُغّل محليًا على المنفذ 3000.
- بقي checkout نظيفًا ولم تُجرَ أي تغييرات على Git.

## التحقق من المصدر

المصدر المطابق للبصمة المطلوبة وُجد من سجل المصدر الموثق في المشروع ونُسخ إلى مجلد الأدلة.

- الملف: `source.webm`
- SHA-256: `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`
- الحاوية: WebM/Matroska
- الفيديو: VP8، دقة `1920x1080`، بمعدل `25 fps`
- الصوت: Vorbis، استيريو، `44.1 kHz`
- المدة: `414.502 ثانية`
- الحجم: `71,813,058 بايت`

تمت تجربة رابط Obama أولًا، لكنه لم يطابق البصمة المطلوبة، ولذلك لم يُستخدم. ملف `verified-source.webm` وملف `source-verification.txt` يحفظان نتيجة عدم التطابق بوضوح.

## نتائج خطوات العرض

### الاستيراد والواجهة — PASS

فُتحت واجهة `/studio` الإنجليزية، وتم استيراد المصدر الحقيقي عبر عنصر اختيار الملف. عرض التطبيق `source.webm` و`68 MB · 1920 × 1080 · audio detected` والمدة `6:54`، كما أظهر الحفظ المحلي في IndexedDB.

الأدلة: `01-introduction.png` و`02-source-imported.png` و`source-ui.txt`.

### Whisper — PASS مع تحذيرات مراجعة

اكتمل تشغيل Whisper المحلي الحقيقي. أظهر التطبيق `Analysis complete` وأنشأ `3 SUGGESTIONS` من `623 timed words`. ظهرت اقتراحات حقيقية بنطاقات مثل `2:37–3:06` و`6:05–6:25` و`6:26–6:46`. كما نبّه التطبيق إلى أن النص مسودة مولدة آليًا وأن بعض التوقيتات تحتاج مراجعة. لا يوجد ادعاء بدقة مثالية.

الأدلة: `04-whisper-complete.png` و`whisper-complete-ui.txt` و`whisper-complete-states.txt` و`whisper-complete-status.txt`.

### الترجمة English-to-Arabic — FAIL

تم اختيار `Transcription + translation — both lines`، واللغة المصدر English، والهدف Arabic، ثم شُغّل التحليل الحقيقي. اكتمل Whisper، لكن OPUS-MT أعاد نتيجة فارغة عند caption 10. لم يتم عرض ترجمة عربية ناجحة، ولم يُستخدم أي نص عربي مكتوب يدويًا كدليل.

الأدلة: `06-translation-final.png` و`translation-final-ui.txt` و`translation-integrated-states.txt`.

### الإطار العمودي — PARTIAL

تم اختيار `Vertical 9:16 · crop sides` وظهر المعاين العمودي. أوضحت الواجهة أن القص يستخدم تقريبًا `608×1080` من المصدر، ويمكن تكبيره إلى `1080×1920`. هذا يثبت المعاينة والتحكم، ولا يثبت وجود ملف تصدير بهذه الأبعاد.

الدليل: `09-vertical-preview.png`.

### تتبع الوجه — غير متحقق منه

تم الضغط على `Find face` في سياق مقطع يدوي حقيقي، لكن لم تظهر نتيجة مكتملة قابلة للتوثيق ضمن الأدلة. لذلك لا يُدّعى نجاح تتبع الوجه ولا استمراره عبر الفيديو.

الأدلة: `10-face-tracking.png` و`face-export-ui.txt`.

### تحرير captions — غير متحقق منه

المقطع اليدوي لم يحتوِ على أسطر captions، لأن مسار التحليل تم تجاوزه. أما تشغيل Whisper فنتج captions، لكن الترجمة فشلت قبل إظهار مسار ترجمة صالح للتحرير. لم يتم اصطناع caption أو إدخال نص يدوي لإخفاء ذلك.

### التصدير — FAIL

لم ينجح مسار الحفظ الأصلي عبر native save picker، ولم ينتج ملف جديد. وفي الحالة الملتقطة لمسار القص اليدوي لم يظهر زر `Export selected clip` بعد محاولة تتبع الوجه. لم تُستخدم أي ملفات تاريخية من المستودع كبديل.

لم يُنفّذ fallback BufferTarget لأنه لم توجد محاولة تصدير أصلية مكتملة يمكن الانتقال منها إلى fallback في التشغيل النهائي. لذلك لا توجد بصمة SHA-256 أو FFprobe أو فك ترميز FFmpeg كامل أو دليل تشغيل خارجي لملف جديد.

ملفات تسجيل الشاشة الخام محفوظة، لكنها غير مكتملة؛ إذ إن FFmpeg انتهى قبل كتابة moov atom، وتظهر عليها نتيجة `moov atom not found`. لا تُقدّم هذه الملفات كتسجيلات نهائية صالحة.

## القرار النهائي

**FAIL / فشل.** نجح الاستيراد ونجح Whisper الحقيقي، لكن الترجمة العربية فشلت، وتتبّع الوجه والتحرير لم يُثبتَا، والأهم أنه لم يُنتج أي تصدير جديد قابل للتحقق مستقلًا. لم يتم استبدال الدليل الفاشل بملفات تاريخية ولم يتم إخفاء أي إخفاق.

لم تُعدّل ملفات المشروع، ولم يُنشأ commit، ولم يحدث push أو deployment.


---

# Final Buyer Demonstration Report

**Project:** `mojtabahamed163-ai/frame-key-studio`  
**Checkout:** `e124451451bf91490a892141d168321073d71540`  
**Evidence directory:** `/home/ubuntu/qa-artifacts/final-buyer-demo-2026-11-15/`  
**Final status:** **FAIL**

## Executive summary

A genuine headed Chromium demonstration was performed against the requested checkout without modifying application source, dependencies, project settings, commits, or GitHub. The verified real source video was imported successfully. Local Whisper transcription completed and produced three real clip suggestions with timed transcript data. An English-to-Arabic translation was then attempted through the application’s actual local OPUS-MT workflow and failed honestly: `The translation model returned an empty result for caption 10.`

A portrait 9:16 preview was shown through the application. A five-second-limited face-tracking requirement was not verified: the real `Find face` operation was started on the manual 30-second clip, but no completed success state was observed. Caption editing could not be demonstrated because the manual clip had no caption lines and the translation failed. No newly exported video was independently verified. Under the supplied acceptance criteria, this is **FAIL**, not PASS or PARTIAL, because no newly generated export can be independently verified.

## Environment evidence

- Chromium: `156.0.8078.73`
- Executable: `/usr/bin/chromium`
- Browser mode: headed (`headless: false`)
- Chromium user agent: `Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36`
- Primary headed browser command line was captured from the running Chromium process in the execution log.
- Xvfb verification: `1440x1000`, 24-bit depth was started for the dedicated headed runs.
- The application server was started locally on port 3000 from the requested detached checkout.
- `git status --short` was clean throughout the project checkout; no commit or push was made.

## Source video verification

The exact source required by the supplied SHA-256 was found from the project’s documented Wikimedia source record and downloaded into the new evidence directory.

- Source file: `source.webm`
- SHA-256: `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`
- Container: WebM/Matroska
- Video: VP8, `1920x1080`, `25 fps`
- Audio: Vorbis, stereo, `44.1 kHz`
- Duration: `414.502 seconds`
- Size: `71,813,058 bytes`

An initial Obama source URL was also tested but did not match the required hash and was explicitly not used. Its mismatch is preserved in `source-verification.txt`; the verified source used by the application is `source.webm`.

## Demonstration results

### 1. Application introduction and import — PASS

The English interface was opened at `/studio`. The real source was selected through the file input and the application displayed `source.webm`, `68 MB · 1920 × 1080 · audio detected`, and `6:54`. The source was stored in browser-local IndexedDB according to the visible UI.

Evidence: `01-introduction.png`, `02-source-imported.png`, `source-ui.txt`.

### 2. Whisper transcription — PASS with review warnings

The real local Whisper workflow was run to completion. The UI reported `Analysis complete` and created `3 SUGGESTIONS` from `623 timed words`. The visible suggestions included actual transcript text and ranges such as `2:37–3:06`, `6:05–6:25`, and `6:26–6:46`. The application explicitly warned that the machine-generated transcript is a draft and that some model timestamps required review. No claim of perfect accuracy is made.

Evidence: `04-whisper-complete.png`, `whisper-complete-ui.txt`, `whisper-complete-states.txt`, `whisper-complete-status.txt`.

### 3. English-to-Arabic translation — FAIL

The actual workflow was configured as `Transcription + translation — both lines`, speech language `English`, target language `Arabic`, and analysis was run in the visible headed application. Whisper completed, then local OPUS-MT translation was attempted. The final visible error was:

> Whisper transcription is complete and remains available, but local translation failed: The translation model returned an empty result for caption 10. Review the source or retry translation before export.

No Arabic captions are claimed. No manually typed Arabic text was used as evidence.

Evidence: `06-translation-final.png`, `translation-final-ui.txt`, `translation-integrated-states.txt`.

### 4. Vertical framing — PARTIAL

The application was configured to `Vertical 9:16 · crop sides`. The UI showed the portrait preview and stated that the crop uses approximately `608×1080` source pixels and can be enlarged to `1080×1920`. This proves the visible framing control and preview, not a verified exported 1080×1920 file.

Evidence: `09-vertical-preview.png`, `manual-cut-ui.txt`.

### 5. Face tracking — NOT VERIFIED / FAIL FOR ACCEPTANCE

The real `Find face` control was clicked on the real five-second-limited workflow requirement’s manual clip context. The UI remained at the control state and no completed detection result or bounded five-second success report was captured. Therefore no face-tracking success is claimed.

Evidence: `10-face-tracking.png`, `face-export-ui.txt`.

### 6. Caption editing — NOT VERIFIED

The manual 30-second clip had no caption lines because it bypassed transcript generation. The transcript run produced captions in its own flow, but translation failed before a valid translated caption track could be shown and edited. No fabricated or manually typed caption is presented as proof.

### 7. Export — FAIL

The requested native save-picker export was not successfully completed. In the manual-cut path, the expected `Export selected clip` control was not available in the captured state after the face-tracking attempt. No new output file was produced by this demonstration. The existing historical exports in the repository were not reused or presented as new evidence.

No fallback BufferTarget/download export was attempted because there was no completed native export attempt to fall back from in the final run. No output SHA-256, FFprobe record, full FFmpeg decode, or external playback proof exists for a newly generated file.

The raw screen recordings created during setup are preserved, but both MP4 files are incomplete (`moov atom not found`) because their FFmpeg capture processes were terminated. They are not presented as valid final recordings.

## Acceptance decision

**FAIL.** The source import and real Whisper demonstration succeeded, but the Arabic translation failed, face tracking was not verified, caption editing was not demonstrated, and—most importantly—no newly generated export was independently verified. This report does not substitute historical repository media for a new export.

## Evidence inventory

- `source.webm`
- `verified-source.webm` (hash-mismatched initial candidate, not used)
- `source-verification.txt`
- `verification-manifest.txt`
- `01-introduction.png`
- `02-source-imported.png`
- `03-whisper-result.png`
- `03-whisper-stopped.png`
- `04-whisper-complete.png`
- `05-translation-settings-ready.png` (if present)
- `06-translation-final.png`
- `09-vertical-preview.png`
- `10-face-tracking.png`
- `11-export-result.png` (if present)
- UI text and state logs, browser console log, and FFmpeg/Xvfb logs

No project files were modified. No commit was created. No push or deployment was performed.
