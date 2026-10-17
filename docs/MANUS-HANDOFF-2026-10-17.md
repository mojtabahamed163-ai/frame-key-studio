# ملف تسليم مهمة Frame & Key Studio إلى Manus جديد

**تاريخ آخر تحديث:** 2026-10-17
**المستودع:** `mojtabahamed163-ai/frame-key-studio`
**الفرع المطلوب للمتابعة:** `audit/real-world-repair-2026-10-17`
**الفرع المحظور تعديله:** `main`
**قاعدة مهمة:** لا تدمج الفروع، لا تنشر التطبيق، لا تستخدم force-push، ولا ترفع عينات الفيديو أو ملفات التصدير إلى Git.

## هدف المهمة

المطلوب هو اكتشاف وإصلاح الأخطاء القابلة لإعادة الإنتاج في Frame & Key Studio، وليس فقط معالجة قائمة محددة. يجب مواصلة دورة: فحص السبب الجذري، إصلاح محافظ، اختبار تراجعي، اختبار مرتبط، فحص البناء والتشغيل الواقعي، ثم commit ورفع إلى نفس فرع الإصلاح.

المواصفات الكاملة الأصلية موجودة في ملف المستخدم:

`/home/ubuntu/upload/pasted_content_6.txt`

## الحالة قبل التوقف

آخر commit بعيد قبل التغييرات الجزئية الحالية:

- `a8d1d1c` — `docs: preserve complete audit history`
- الفرع المحلي والبعيد كانا متطابقين قبل بدء الجولة الجديدة.
- `main` عند `062b3bf` ولم يُعدّل.

تم تشغيل خط أساس قبل الجولة الجديدة:

- `pnpm test -- --run`: نجح، 9 ملفات و71 اختبارًا.
- `pnpm check`: نجح.
- `pnpm build`: نجح.
- `git diff --check`: نجح قبل التغييرات الجزئية.
- البناء يطبع تحذيرًا غير مانع عن `/api/platform/config.js` غير module، وتحذير chunks أكبر من 500 kB.

## نتائج التدقيق الشامل

شغّل Workflow قراءة فقط على ست مناطق. النتائج عالية الثقة والقابلة للإعادة:

1. **الرفع/التحليل:** نتيجة `runTranscription` القديمة قد تكتب فوق مصدر أو مشروع جديد؛ لا يوجد generation/revision guard، وواجهة اختيار المصدر والمشاريع لا تمنع التفاعل أثناء التحليل. كما أن `inferMissingWordEnds` كان يأخذ `nextStart` خارج `windowEnd` ويؤدي إلى إسقاط كلمة صحيحة.
2. **التتبع:** نتيجة `runFaceTracking` القديمة قد تستعيد حدودًا قديمة بعد تعديل المقطع أثناء المسح. حقول Start/End كانت متاحة أثناء المسح. وضع full يعرض تذييل FRAME LEFT/RIGHT رغم أنه لا يقص.
3. **التصدير:** بطاقة العنوان كانت تستخدم زمن المصدر بعد ضغط الصمت بدل زمن الإخراج. التصدير الدفعي قد يفقد ملفات عند تكرر العنوان بسبب أسماء ZIP مكررة. وضع full كان يستخدم `fit: "fill"` على لوحة بنسبة غير مطابقة، ما يشوه مصدرًا عموديًا أطول من 9:16.
4. **الكابتشن:** توقيتات الكلمات في التصدير كانت تحتاج حماية تكاملية لمحور الزمن المضغوط. في الكود الحالي من commit سابق تم بالفعل تمرير `mappedTime` إلى `drawCaption` وmapping للكلمات؛ يجب إضافة اختبار تكاملي واضح وعدم التراجع عن ذلك.
5. **تحرير الكابتشن:** تعديل نص cue كان يفرض clamp على توقيته حتى لو لم يتغير التوقيت. تحريك بداية cue كان يزحزح `word.start` دون `word.end` وقد ينتج word غير صالح. الترجمة قد تكتب فوق تعديلات متزامنة، وتغيير اللغة أثناء الترجمة قد يخزن لغة قديمة.
6. **التخزين:** فشل حذف المشروع غير معالج في الواجهة. فشل auto-save كان يغير مؤشر الحالة فقط دون تنبيه قابل للتصرف. فشل فتح ملف OPFS غير صالح كان لا يعيد `pendingProject`، مع أن مسار اختيار المصدر البديل موجود.
7. **هوية المصدر:** التحقق الحالي يعتمد الاسم/الحجم/المدة/الأبعاد؛ لا يستخدم `sourceLastModified` عند اختيار مصدر محفوظ غير OPFS، لذلك قد تُقبل ملفات مختلفة بنفس metadata. هذه لم تُصلح بعد.

## التغييرات الجزئية التي أُجريت بعد آخر commit

التغييرات التالية موجودة محليًا الآن ولم تُختبر بعد آخر تعديل، ويجب عدم فقدانها:

- `client/src/features/studio/media/analyze-video.ts`
  - تغيير استنتاج نهاية الكلمة إلى `Math.min(nextStart ?? windowEnd, windowEnd)`.
- `client/src/features/studio/media/analyze-video.test.ts`
  - أضيف اختبار تراجعي لنهاية كلمة لاحقة خارج نافذة الصوت.
- `client/src/features/studio/export/convert-clip.ts`
  - بطاقة العنوان أصبحت تعتمد على `outputTime` وتظهر ضمن أول 2.8 ثانية من الخط الزمني الناتج.
  - وضع full يستخدم `sample.drawWithFit(context, { fit: "contain" })` مع خلفية، بدل `fit: "fill"` ولوحة وسيطة مشوهة.
- `client/src/features/studio/components/VideoPreview.tsx`
  - تذييل المعاينة يعرض `FULL FRAME` في وضع full بدل اتجاه قص مضلل.
- `client/src/features/studio/export/download.ts`
  - أضيفت `uniqueFilename(filename, used)` لمنع تصادم أسماء التصدير الدفعي.
- `client/src/features/studio/export/convert-clip.test.ts`
  - أضيف اختبار أسماء الملفات المتكررة. تحقق من أن الاستيراد/الإضافة تمت فعليًا؛ إذا لم يكن موجودًا بسبب توقف الكتابة، أعد إضافته.
- `client/src/pages/Studio.tsx`
  - أضيف `sourceGeneration` و`projectRevision`.
  - `acceptFile` و`openSavedProject` يمنعان تبديل المصدر أثناء عملية مشغولة ويلغيان controllers ذات الصلة.
  - `runTranscription`, `runTranslation`, و`runFaceTracking` تلتقط revision/generation وتتحقق قبل commit من أن النتيجة ما زالت تخص المشروع/المقطع الحاليين.
  - فشل OPFS في `activateSavedProject` يعيد `pendingProject`.
  - `updateCaptionCue` لا يغير توقيت cue عند تعديل النص فقط، ويحرك بداية/نهاية كلمات cue معًا ويحذف الكلمات التي تصبح أقصر من 0.04 ثانية.
  - زر اختيار المصدر، فتح/حذف المشاريع، وحقول حدود المقطع أثناء تتبع الوجه أصبحت معطلة في الحالات المناسبة.
  - فشل auto-save/settings save يعرض `setError` بدل مؤشر صامت.
  - `removeSavedProject` أصبح داخل try/catch.
  - التصدير الدفعي يستخدم `uniqueFilename` عبر `usedFilenames`.

**ملاحظة مهمة:** لم تُجرَ بعد هذه التغييرات الجزئية اختبارات Vitest أو `pnpm check` أو `pnpm build`. يجب فعل ذلك أولًا قبل أي إصلاح إضافي.

## ما يجب على Manus الجديد فعله أولًا

1. نفّذ:

```bash
cd /home/ubuntu/frame-key-studio
git status --short --branch
git diff --check
git diff --stat
```

2. اقرأ هذا الملف ثم افحص diff كاملًا. لا تعِد كتابة التغييرات الجزئية من الصفر.
3. شغّل الاختبارات المتأثرة أولًا:

```bash
pnpm exec vitest run \
  client/src/features/studio/media/analyze-video.test.ts \
  client/src/features/studio/export/convert-clip.test.ts \
  client/src/features/studio/analysis/clip-analysis.test.ts \
  client/src/features/studio/media/face-tracking.test.ts \
  client/src/features/studio/analysis/subtitles.test.ts
pnpm check
```

4. أصلح أي compile/test failure ناتج عن التغييرات الجزئية.
5. أضف الاختبارات الناقصة التالية قبل الجولة النهائية:
   - اختبار race للتحليل: ابدأ promise للتحليل A، بدّل المصدر إلى B، أتمم A، وتحقق أن A لا يكتب فوق B.
   - اختبار race للتتبع: ابدأ tracking ثم غيّر حدود clip، أتمم tracking، وتحقق أن الحدود/keyframes القديمة لا تُستعاد.
   - اختبار بطاقة العنوان مع ranges تبدأ بعد صمت، ويظهر العنوان في output time 0 لا source time.
   - اختبار `mapCaptionCuesToOutput` مع cue يبدأ عند source 10 وكلمة 10.5–10.8 وclip start 10، ثم تحقق من matching عند output 0.6.
   - اختبار full framing هندسيًا لمصدر 720×1440 وخرج 720×1280، ويجب أن يحافظ على نسبة المصدر مع contain/background.
   - اختبار تحرير نص cue عابر لحدود clip لا يغير start/end.
   - اختبار تحريك cue start يحافظ على `word.end > word.start`.
   - اختبار تغيير لغة الترجمة أثناء await لا يخزن النتيجة بلغة قديمة.
   - اختبار فشل حذف المشروع وعودة pendingProject عند فشل OPFS إن أمكن عزل الدوال.
   - اختبار parser يرفض timestamps سالبة أو seconds/minutes خارج 0..59 مثل `00:00:61,000`.
   - اختبار ملفين متساويين في الاسم/الحجم/metadata لكن `lastModified` مختلفان عندما يكون المصدر غير OPFS.

6. أكمل الإصلاحات التالية التي لم تُنفذ بعد:
   - إضافة guard فعلي لتغيير target language أثناء الترجمة، ويفضل تعطيل select/editor أثناء `isTranslating` أو إلغاء النتيجة عند revision mismatch.
   - تشديد `parseTimestamp` في `client/src/features/studio/analysis/subtitles.ts` لرفض القيم السالبة ومكونات الوقت غير الصالحة.
   - إضافة تحقق source identity باستخدام `sourceLastModified` في مسار إعادة اختيار المصدر غير OPFS دون كسر ملفات OPFS.
   - مراجعة أن `uniqueFilename` مستخدمة في جميع مسارات batch وأن `createZip` لا يسمح بالتصادم إذا استُخدمت مباشرة.
   - مراجعة وتغطية full-frame preview/export بعد تغيير `contain`.

7. شغّل خادم التطوير الموجود أو أعد تشغيله فقط إذا لزم، واختبر في المتصفح:
   - رفع عينة `/home/ubuntu/frame-key-real-tests/kyle-yip-interview-first-60s.webm`.
   - استخراج الكلام المحلي مع ملاحظة التحذيرات دون ادعاء تحسن Whisper بلا baseline.
   - تشغيل اقتراح المقاطع.
   - اختبار الوجه والحركة/الفجوة إن أمكن. نتيجة سابقة موثقة للعينة: 26/42 detections، held 1، manual fallback 15. لا تدّعِ مقارنة جديدة دون تشغيلها فعليًا.
   - تفعيل silence removal وtitle card وcaption export، حفظ WebM باسم مختلف، ثم فحصه بـ`ffprobe` وFFmpeg وفك الفيديو والصوت.
   - اختبار batch بمقطعين لهما نفس العنوان والتحقق من عدد ملفات ZIP بعد فك الضغط.

8. بعد الجولة النهائية:

```bash
pnpm test -- --run
pnpm check
pnpm build
git diff --check
git status --short --branch
```

9. حدّث التقرير العربي الموجود:

`docs/audit-report-2026-10-17-ar.md`

أبقِ التاريخ/النتائج السابقة وألحق جولة التدقيق الجديدة. لا تستبدل التقرير كاملًا باستخدام write overwrite؛ اقرأه ثم استخدم append أو patch.

10. أنشئ commit واضحًا على `audit/real-world-repair-2026-10-17`، ارفع بـ`git push origin audit/real-world-repair-2026-10-17`، ثم تحقق بـ`git ls-remote`. لا ترفع الوسائط الموجودة في `/home/ubuntu/frame-key-real-tests` أو `/home/ubuntu/Downloads`.

## الأدلة الواقعية المتاحة

عينات خارج Git في:

- `/home/ubuntu/frame-key-real-tests/kyle-yip-interview-first-60s.webm` — VP9/Opus، 1920×1080، 60.008 ثانية، 48 kHz، 12 MB.
- `/home/ubuntu/frame-key-real-tests/kyle-yip-interview.webm` — VP9/Opus، 1920×1080، 450.248 ثانية، 48 kHz، 105 MB.
- `/home/ubuntu/frame-key-real-tests/kerry-interview.ogv` — Theora/Vorbis، 320×240، 12.4 ثانية.
- `/home/ubuntu/frame-key-real-tests/aida-nancy-interview.ogv` — Theora/Vorbis، 480×360، 599.466 ثانية.
- `/home/ubuntu/frame-key-real-tests/SOURCES.md` — روابط المصادر والتراخيص.

ملف تصدير سابق مستقل خارج Git:

- `/home/ubuntu/Downloads/Caption-timing-fix.webm` — VP9/Opus، 1080×1920، 32.121 ثانية، 26.5 MB، وفك ترميزه ناجح. هذا الملف أُنشئ قبل التعديلات الجزئية الحالية، فلا يُستخدم كدليل على آخر تغييرات إلا بعد إعادة التصدير.

## آخر نقطة توقف

التنفيذ متوقف عمدًا بناءً على طلب المستخدم بسبب قرب نفاد الرصيد. توجد تغييرات جزئية غير مختبرة محليًا بعد آخر تعديل. الأولوية هي حفظها وفحصها، لا بدء إصلاحات عشوائية جديدة. لا تعتبر المهمة مكتملة حتى تُختبر هذه التغييرات وتُرفع في commit جديد.
