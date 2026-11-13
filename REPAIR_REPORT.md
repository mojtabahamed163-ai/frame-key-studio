# Frame & Key Studio — Phase 2 Repair Report

**Date:** 2026-11-13  
**Repository:** `mojtabahamed163-ai/frame-key-studio`  
**Base audit:** [`INITIAL_AUDIT.md`](./INITIAL_AUDIT.md)  
**Scope:** تنفيذ إصلاحات المرحلة الثانية، وليس إعادة تدقيق شامل جديد.

## Executive summary

تم تنفيذ إصلاحات المرحلة الثانية فعلياً على فرع `main` المحلي، مع الحفاظ على التنفيذ المحلي الحالي للتفريغ والترجمة وعدم إضافة mocks أو رسائل نجاح وهمية. أضيف كتالوج من 15 قالباً حقيقياً، وربط اختيار القالب بالمعاينة والتصدير، وأضيفت Brand Kits متعددة مع CRUD واستمرارية محلية عبر IndexedDB. كما تم تحديث الاعتماديات التي كشفها التدقيق الأولي.

لم يتم الادعاء بتشغيل Whisper أو OPUS-MT على فيديو حقيقي في هذه المرحلة؛ الاختبارات الحالية اختبارات وحدات/تكامل محدودة ولا تثبت نجاح نموذج على ملف فيديو فعلي أو تطابقاً pixel-perfect بين المعاينة والتصدير.

## Changes implemented

### 1. Dependency security fixes

تم تحديث:

- `zod` من `^4.1.12` إلى `^4.6.7`، وهو أعلى من الإصدار المصحح `4.6.6`.
- `express` من `^4.21.2` إلى `^4.22.3` لتحديث المسار العابر لـ `body-parser`.
- `axios` من `^1.20.0` إلى `^1.21.1` لتحديث المسار العابر لـ `follow-redirects`.
- تم تحديث `pnpm-lock.yaml`.
- أضيف `fake-indexeddb` كاعتمادية تطويرية لاختبار التخزين المحلي الحقيقي داخل Vitest، وليس كاعتمادية تشغيلية.

نتيجة `pnpm audit --prod` النهائية: **No known vulnerabilities found**.

### 2. Template catalog

تم تنفيذ **15 قالباً بالضبط**، موزعة كالتالي، ثلاثة لكل فئة:

- Real Estate: `estate-hero`, `estate-editorial`, `estate-split`
- Restaurants & Food: `food-menu`, `food-street`, `food-editorial`
- Education: `edu-notes`, `edu-highlight`, `edu-whiteboard`
- Podcasts & Interviews: `podcast-lowerthird`, `podcast-wave`, `podcast-bold`
- Marketing & Business: `marketing-launch`, `marketing-social`, `marketing-report`

كل قالب يحدد ألوان الهوية، نمط وموضع الكابتشن، نمط بطاقة العنوان، الخط، موضع الشعار، وإظهار بطاقة العنوان. أضيف `TemplateControls` للتصفح حسب الفئة والتطبيق مع الحفاظ على بيانات المشروع الأخرى.

### 3. Preview/export integration

تم ربط الإعدادات الجديدة فعلياً:

- `captionPosition` يغير موضع الكابتشن في المعاينة وفي Canvas التصدير: top / middle / bottom.
- `titleStyle` يغير بطاقة العنوان في المعاينة ومسار التصدير: banner / minimal / split / corner.
- إعدادات اللون والخط والشعار الموجودة سابقاً تستمر في العمل.
- تطبيق قالب من الواجهة يمر عبر `changeSettings`، وبالتالي يدخل في إعدادات المشروع والحفظ القائم.

المعاينة والتصدير يشتركان في الدلالات نفسها للإعدادات، لكن لم يتم إجراء مقارنة بصرية pixel-perfect على فيديو fixture حقيقي؛ لذلك لا يُدّعى إثبات التطابق البصري الكامل.

### 4. Brand Kits via IndexedDB

تم رفع نسخة قاعدة IndexedDB المحلية إلى v2 وإضافة object store باسم `brandKits` مع الحفاظ على stores القديمة. أضيفت العمليات:

- `listBrandKits()`
- `saveBrandKit()` مع تحديث `updatedAt`
- `deleteBrandKit()`

واجهة Brand Kits تدعم:

- presets القديمة الثلاثة.
- إنشاء kit باسم.
- الحفظ المحلي.
- العرض بعد إعادة القراءة من IndexedDB.
- التطبيق على إعدادات المشروع.
- تعديل الاسم وتحديث kit.
- الحذف.
- ألوان، خط، نمط وموضع الكابتشن، موضع الشعار، وشعار محلي.

### 5. Tests

أضيفت اختبارات القوالب في `client/src/features/studio/templates.test.ts` للتحقق من:

- وجود 15 قالباً بالضبط.
- وجود ثلاثة قوالب في كل فئة.
- فرادة المعرّفات.
- صحة قيم الألوان ومواضع الكابتشن وأنماط العنوان.
- تطبيق قالب دون فقدان بيانات المشروع غير المتعلقة بالقالب.

تم توسيع `project-store.test.ts` باختبار CRUD كامل لـ Brand Kit باستخدام `fake-indexeddb`، بما في ذلك الإنشاء، القراءة، التحديث، والحذف.

## Validation performed

الأوامر المطلوبة شُغّلت على الحالة النهائية:

| Command | Result |
|---|---|
| `pnpm install` | Passed; lockfile synchronized |
| `pnpm check` | Passed; `tsc --noEmit` بلا أخطاء |
| `pnpm test -- --run` | Passed; **14 test files, 94 tests** |
| `pnpm build` | Passed; Vite + server bundle built |
| `pnpm audit --prod` | Passed; **No known vulnerabilities found** |
| `git diff --check` | Passed; بلا مخرجات |

ملاحظات البناء:

- بقي تحذير Vite المعروف حول `/api/platform/config.js` الذي لا يحمل `type="module"`.
- بقي تحذير chunks أكبر من 500 kB؛ أكبر chunk للـ Studio في هذا البناء حوالي 773 kB قبل الضغط، وملف ONNX WASM حوالي 26.9 MB قبل الضغط. لم أعدّ ذلك تحسناً أداءً مثبتاً.
- ظهرت تحذيرات peer/deprecated موجودة في شجرة الاعتماديات، لكنها لم تفشل البناء أو الاختبارات.

## What was not proven

- لم يُشغّل Whisper على فيديو/صوت حقيقي في هذه المرحلة، ولا توجد نتيجة end-to-end يمكن نسبتها إلى ملف فيديو فعلي.
- لم يُشغّل OPUS-MT على فيديو حقيقي، ولا توجد دعوى نجاح end-to-end له.
- لم يتم اختبار تصدير WebM/MP4 فعلياً داخل متصفح بواجهة WebCodecs في هذه البيئة.
- لم يتم إثبات pixel-perfect equivalence بين preview وexport على fixture حقيقي.
- لم يتم قياس أداء الذاكرة أو زمن النماذج في جلسة متصفح حقيقية.

## Files changed

- `client/src/features/studio/types.ts`
- `client/src/features/studio/templates.ts`
- `client/src/features/studio/templates.test.ts`
- `client/src/features/studio/storage/project-store.ts`
- `client/src/features/studio/storage/project-store.test.ts`
- `client/src/features/studio/components/TemplateControls.tsx`
- `client/src/features/studio/components/BrandControls.tsx`
- `client/src/features/studio/components/VideoPreview.tsx`
- `client/src/features/studio/export/convert-clip.ts`
- `client/src/features/studio/studio.css`
- `client/src/pages/Studio.tsx`
- `package.json`
- `pnpm-lock.yaml`
- `REPAIR_REPORT.md`

## Repository safety and delivery

تم إنشاء النسخة الاحتياطية قبل التعديل كما هو موثق في سياق المهمة:

- Branch: `backup/pre-phase2-2026-11-13`
- Archive: `/home/ubuntu/backups/frame-key-studio-pre-phase2-2026-11-13.tar.gz`

سيتم تسجيل SHA النهائي المحلي وSHA البعيد في رسالة التسليم بعد إنشاء commit والدفع والتحقق من تطابقهما.
