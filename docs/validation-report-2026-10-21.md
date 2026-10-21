# تقرير تحقق Frame & Key — التتبع والتصدير الواقعي

التاريخ: 2026-10-21

## النتيجة التنفيذية

تم تشغيل المسار الفعلي داخل `/studio` على عينات فيديو حقيقية، وليس على بيانات وهمية. بقيت المعالجة محلية داخل المتصفح، ونجح تتبع الوجه في عينة المتحدث، كما عاد النظام إلى القص اليدوي برسالة واضحة في عينة لا تحتوي وجوهًا. اكتمل تصدير WebM عمودي وحُفظ الملف الناتج وفُحص خارج المتصفح.

## عينات الاختبار

| الملف | السيناريو | المصدر | الأبعاد | المدة | الترميز | الحجم |
|---|---|---|---:|---:|---|---:|
| `01-closeup-speaker.mp4` | متحدث قريب أمام الكاميرا | [Pexels 8048256](https://www.pexels.com/video/man-talking-in-front-of-camera-8048256/) | 1920×1080 | 13.28s | H.264 @ 25fps | 6.3 MB |
| `02-moving-speaker.mp4` | متحدث متحرك | Pexels 8716574 | 1920×1080 | 29.60s | H.264 @ 25fps | 12.0 MB |
| `06-hand-occlusion.mp4` | حجب الوجه باليد | [Pexels 10204154](https://www.pexels.com/video/a-man-covering-his-face-using-his-hands-10204154/) | 2732×1440 | 24.72s | H.264 @ 25fps | 17.1 MB |
| `08-empty-classroom.mp4` | مشهد عمودي بلا وجه | [Pexels 37892573](https://www.pexels.com/video/empty-classroom-with-sunlit-whiteboard-37892573/) | 1440×2560 | 10.47s | H.264 @ 60fps | 7.4 MB |

## نتائج الاختبار داخل المتصفح

| المسار | النتيجة | الدليل المرئي |
|---|---|---|
| اختيار/قراءة ملف حقيقي | ناجح | ظهرت أبعاد الملف وحجمه ومدته ومسار الفيديو داخل الاستوديو، مع بقاء الحالة “لم يُرفع إلى الموقع”. |
| تتبع الوجه — `01-closeup-speaker.mp4` | ناجح | `Face detection returned at all 28 sampled times`، ثم تحولت الحالة إلى `Auto crop on` وأصبح الإطار `FRAME LEFT`. |
| فشل الكشف الآمن — `08-empty-classroom.mp4` | ناجح | ظهرت الرسالة: `MediaPipe did not detect a usable face... Manual horizontal framing remains available`، وبقي زر `Find face` والضبط اليدوي متاحين. |
| معاينة 9:16 | ناجح | بقي المتحدث ظاهرًا داخل المعاينة العمودية بعد التتبع، بينما حافظت عينة الصف على القص الوسطي دون ادعاء تتبع وجه. |
| التصدير العمودي | ناجح | اكتمل التشفير وظهرت الحالة `Ready` والملف `Property-cut-1.webm` بحجم 15 MB داخل الاستوديو. |
| فحص الملف الناتج | ناجح | `ffprobe`: VP9، ‏1080×1920، ‏30fps، ‏13.266s، ‏16,051,383 bytes. الملف موجود في `Downloads/Property-cut-1.webm` وقابل للقراءة. |

## فحوص الكود

- `pnpm vitest run client/src/features/studio/media/face-tracking.test.ts client/src/features/studio/media/framing.test.ts client/src/features/studio/export/convert-clip.test.ts`: **3 ملفات، 31 اختبارًا ناجحًا**.
- `pnpm check`: ناجح.
- `pnpm test -- --run`: ناجح في الفحص السابق بعد الدمج.
- `pnpm build`: ناجح في الفحص السابق بعد الدمج.
- `git diff --check`: بلا أخطاء تنسيق.
- `/manus-routes.json`: يعرض `/` و`/studio`، وطلب `/studio` يعيد HTTP 200.

## القيود المتبقية المعلنة للمستخدم

الكشف التلقائي ليس مضمونًا للوجوه الصغيرة أو المحجوبة أو للمشاهد الخالية من الأشخاص؛ لذلك يبقى `Manual horizontal framing` هو fallback المقصود. تصدير WebM هو المسار المستخدم في متصفح الاختبار، ويُذكر الامتداد للمستخدم. اختبار أحجام ضخمة جدًا يتجاوز هذه الجولة؛ أما ملفات الاختبار الواقعية المستخدمة هنا فتتراوح بين 6.3 و17.1 MB، واكتمل تصدير ملف 15 MB بنجاح.
