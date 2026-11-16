# تقرير التحقيق في مهلة تصدير WebM — 2026-11-16

## النتيجة المختصرة

المشكلة ليست في معالجة الفيديو أو الذاكرة أو عامل التصدير. التصدير المباشر يفشل قبل بدء `exportClip`، عند مسار File System Access API (`showSaveFilePicker`) في Chromium headless المستخدم مع Playwright. الدليل: سجل console لمسار التصدير المباشر لا يحتوي أي رسائل `[Frame & Key export]` مثل `Conversion.init:start` أو `Conversion.execute:start`، وتظهر الواجهة `Export cancelled. No incomplete file was added to the results.`

## الأدلة

- تسجيل المحاولة الأصلية: `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/attempt-4-real-export-timeout.webm`.
- اللقطة الأخيرة من التسجيل بقيت على شاشة التحرير/التصدير، ولم تظهر لوحة `Your finished files.`.
- سجل المسار المباشر: `EXPORT-INVESTIGATION-2026-11-16/direct-console.log`.
- نص واجهة المسار المباشر: `EXPORT-INVESTIGATION-2026-11-16/direct-ui.txt`.
- المتصفح يعرّف `showSaveFilePicker` كدالة، لكنه يعمل كـ `HeadlessChrome/156.0.0.0` ولا يوفّر تفاعل نافذة حفظ أصلية مستقرًا في هذا السياق.
- لا يوجد ملف WebM مخفي من المسار المباشر؛ لم يبدأ التحويل ولم تظهر رسائل `BufferTarget:done`.

## اختبار عزل التصدير فقط

تم استيراد المصدر الحقيقي، إنشاء قص يدوي مدته 5 ثوانٍ، اختيار WebM/VP9 + Opus والمعاينة العمودية، ثم اختبار مسارين فقط دون تسجيل شاشة ودون إعادة التفريغ أو الترجمة:

| المسار | النتيجة | الدليل |
|---|---|---|
| `Export selected clip` | فشل/إلغاء قبل بدء المحول | `direct-console.log` لا يحتوي مراحل Mediabunny، والواجهة تعرض `Export cancelled` |
| `Render selected + ZIP` | نجاح | `zip-console.log` يحتوي `Conversion.init:done` و`Conversion.execute:done` و`BufferTarget:done` |

ملف ZIP الناتج احتوى WebM حقيقيًا صالحًا:

- `Property-cut-1.webm`
- VP9، ‏608×1080، ‏30 FPS
- Opus، مدة 5.027 ثانية
- الحجم 2,829,717 بايت
- FFprobe وُضع في `zip-output-ffprobe.json`
- SHA-256 وُضع في `zip-output-sha256.txt`

## تحديد المسؤولية التقنية

- **Video processing / Mediabunny:** يعمل؛ مسار ZIP وصل إلى `Conversion.execute:done`.
- **Browser memory:** ليس سبب الاختبار القصير؛ WebM الذاكري أُنشئ بنجاح داخل ZIP.
- **Export worker:** لا توجد دلالة على فشل worker؛ لا تبدأ هذه المرحلة في المسار المباشر.
- **Application UI:** يعرض الإلغاء العام بصورة صحيحة لكنه لا يميز أن الإلغاء حدث في منتقي الحفظ قبل بدء التشفير.
- **File System Access / native save picker:** السبب المؤكد للمسار المباشر في بيئة Chromium headless/Playwright.

## أصغر حل دون تعديل التطبيق

استخدام `Render selected + ZIP` بدل `Export selected clip` في بيئة Playwright headless، ثم الضغط على `Save file` أو تنزيل ZIP. هذا يستعمل تنفيذ التطبيق الحقيقي نفسه، ويجنب `showSaveFilePicker`، وقد ثبت نجاحه في هذا التحقيق.

لا حاجة إلى تعديل كود التطبيق لإصلاح هذه الحالة البيئية. إذا كان المطلوب دعم التصدير المباشر داخل بيئة headless تحديدًا، فسيكون ذلك تغييرًا منفصلًا في سياسة اختيار مسار الحفظ، لكنه لم يُنفذ بناءً على طلب المستخدم.

## حدود التحقيق

لم يُسجل ديمو جديد، ولم تُكرر رحلة التفريغ أو الترجمة، ولم تُعدل ملفات مصدر التطبيق أو منطق التصدير. جميع الفيديوهات وملفات التسليم السابقة محفوظة.
