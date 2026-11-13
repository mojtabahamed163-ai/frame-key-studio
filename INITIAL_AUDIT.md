# INITIAL_AUDIT — Frame & Key Studio

**تاريخ الفحص:** 2026-11-13  
**المستودع:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**الفرع/النقطة المفحوصة:** `main` عند commit `be977bd` (`docs: combine project reports into one handoff file`)  
**نطاق الفحص:** فحص ساكن وتنفيذي قبل أي إصلاح. لم تُعدّل ملفات التطبيق. التغيير الناتج عن هذه المهمة هو هذا التقرير فقط.

## 1. ملخص تنفيذي

Frame & Key Studio يحتوي على نواة محرر فيديو محلي داخل المتصفح، وليست مجرد واجهة شكلية. توجد مسارات فعلية لقراءة الفيديو والصوت عبر Mediabunny، تفريغ Whisper داخل Web Worker، اقتراح مقاطع من التوقيتات النصية، تحرير الكابتشن واستيراد/تصدير SRT وVTT، القص العمودي، معاينة الفيديو، التصدير عبر Mediabunny، التخزين المحلي، الترجمة المحلية OPUS-MT، وتتبع الوجه الاختياري.

لكن توجد فجوة مهمة بين ما يمكن إثباته من الكود والاختبارات الوحدية وبين ما يمكن عرضه للمشتري كميزة مكتملة ومثبتة على فيديوهات حقيقية. في بيئة هذا الفحص لم يكن هناك متصفح تفاعلي متاح، ولم توجد ملفات فيديو اختبارية داخل المستودع، لذلك **لم أدّعِ تنفيذ رحلة فيديو حقيقية أو نجاح تصدير حقيقي في هذا الفحص**. التقارير التاريخية الموجودة في `docs/` تُحفظ كأدلة تاريخية، لكنها ليست اختباراً جديداً نفذته هذه المهمة.

أخطر النتائج الحالية:

1. `pnpm audit --prod` كشف ثلاث ثغرات عالية في `zod` و`body-parser` و`follow-redirects`.
2. لا يوجد تنفيذ فعلي لـ 15 قالباً قابلاً للتحرير موزعة على خمس فئات؛ الموجود ثلاثة presets فقط في `BrandControls.tsx`.
3. لا يوجد نظام Brand Kits متعدد المجموعات بإنشاء/تعديل/حذف/اختيار. الموجود إعدادات هوية واحدة مع presets وحفظ إعدادات افتراضية.
4. نجاح الاختبارات الحالية يثبت منطقاً ووحدات، وليس رحلة متصفح كاملة على فيديو حقيقي.
5. بناء Studio ينتج chunk بحجم `756,842` بايت، وملف WASM بحجم `26,861,777` بايت قبل الضغط، مع تحذير Vite من chunks أكبر من 500 kB.
6. التصدير يعتمد على WebCodecs؛ إذا لم يتوفر زوج encoder مناسب لا يوجد fallback إلى MediaRecorder، ويظهر للمستخدم أن المتصفح غير مدعوم.
7. الترجمة محدودة إلى English → French/Spanish/German وتحمّل نموذجاً كبيراً عند الطلب؛ ليست ترجمة عامة متعددة اللغات.

## 2. منهجية الفحص والأدلة المنفذة

نفذت الأوامر التالية على checkout نظيف بعد `pnpm install --frozen-lockfile`:

| الأمر | النتيجة الفعلية |
|---|---|
| `pnpm install --frozen-lockfile` | نجح؛ lockfile محدث، مع تحذير pnpm من build scripts غير معتمدة لـ `onnxruntime-node` و`protobufjs` |
| `pnpm check` | نجح، exit code 0 |
| `pnpm test -- --run` | نجح: 13 ملف اختبار، 90 اختباراً، 0 فشل |
| `pnpm build` | نجح، exit code 0، مع تحذير config script وlarge chunks |
| `pnpm audit --prod` | فشل أمنياً: 3 ثغرات عالية |
| `git diff --check` | نجح؛ لا أخطاء whitespace |
| البحث عن ملفات فيديو | لم توجد ملفات `.mp4` أو `.webm` أو `.mov` أو ملفات صوت اختبارية داخل checkout |
| فحص الأسرار النمطية | لم يظهر secret عالي الثقة أو مفتاح خاص أو token حي داخل الملفات المتتبعة التي فُحصت |

رسائل الاختبارات التي لا تعني فشل التطبيق: اختبارات `server/leads.test.ts` تطبع أخطاء محكومة لمحاكاة فشل قاعدة البيانات/الإشعار، واختبار المنصة يطبع تحذيراً عند غياب `MANUS_OAUTH_API_URL`. كل الاختبارات بقيت ناجحة.

## 3. مصفوفة الميزات

الحالات المستخدمة هنا:

- **موجودة جزئياً:** يوجد تنفيذ حقيقي، لكن توجد حدود أو لم يثبت المسار الكامل في هذه المهمة.
- **موجودة في الكود وغير مثبتة فيديوياً:** يوجد منطق/اختبارات وحدات، لكن لا يوجد دليل تنفيذي جديد على فيديو حقيقي.
- **غير موجودة:** لم أجد تنفيذ الميزة المطلوبة في الكود.
- **تحتاج خدمة خارجية:** تعتمد على خدمة/حساب/إعداد خارجي، ولو لم تكن معالجة الفيديو نفسها خارجية.

| الميزة | الحكم | الاعتماد الخارجي | الدليل |
|---|---|---|---|
| رفع/اختيار فيديو محلي | موجودة جزئياً وموجودة في الكود | لا تحتاج خادم لمعالجة الوسائط | `Studio.tsx` يستخدم `input type=file` و`acceptFile`; `inspectVideo()` يقرأ `BlobSource(file)` عبر Mediabunny. لم تُنفذ رحلة متصفح جديدة هنا لغياب المتصفح/fixture. |
| قراءة metadata والصوت | موجودة في الكود وغير مثبتة فيديوياً | Mediabunny/WASM/دعم decoder في المتصفح | `analyze-video.ts:152-170` يقرأ video/audio tracks والمدة والأبعاد والـ codecs ويحرر `Input` في `finally`. |
| Whisper transcription | موجودة جزئياً | تنزيل نماذج Hugging Face عند أول استخدام؛ CPU/WASM محلياً | `transcribe.worker.ts` يستخدم `Xenova/whisper-base.en` للإنجليزية و`Xenova/whisper-tiny` لغيرها، مع timeout 180 ثانية. `analyze-video.ts` يقسم الصوت إلى نوافذ 24 ثانية مع overlap 4 ثوانٍ ويلغي worker. اختبارات `analyze-video.test.ts` تختبر الحدود والتوقيت، لا نموذج Whisper الحقيقي. |
| اقتراح المقاطع | موجودة جزئياً وموجودة في الكود | لا تحتاج API؛ تعتمد على transcript | `clip-analysis.ts` يطبق قواعد الجمل، pauses، hook terms، التكرار، ومدة 8–60 ثانية، ويمنع التداخل الزائد. هو ترتيب rule-based وليس تنبؤ أداء. اختبارات 24 اختباراً تغطي المنطق. |
| اختيار وتعديل حدود المقطع | موجودة جزئياً | لا تحتاج خادم | `Studio.tsx` يعرض حقول/ranges للبداية والنهاية و`normalizeClipBounds()` يحافظ على حدود المصدر. لم يُختبر التحكم في متصفح حقيقي خلال هذه المهمة. |
| إنشاء الكابتشن | موجودة في الكود وغير مثبتة فيديوياً | لا تحتاج خادم إذا كان transcript موجوداً | `buildCaptionCues()` يقسم إلى كتل حتى 12 كلمة/4.2 ثوانٍ، و`toWordCues()` يدعم word mode. اختبارات تحليلية موجودة. |
| تعديل الكابتشن والتوقيت | موجودة جزئياً | لا تحتاج خادم | `CaptionCueEditor.tsx` و`Studio.tsx` يتيحان تعديل النص والأوقات؛ التحقق الوحدوي لا يثبت تفاعل UI كاملاً. |
| SRT/VTT استيراد وتصدير | موجودة في الكود ومختبرة وحدياً | لا تحتاج خادم | `subtitles.ts` واختباراته؛ يوجد حد 20 MB لملف الترجمة في `Studio.tsx`. |
| قص 9:16 | موجودة في الكود وغير مثبتة فيديوياً | تعتمد على canvas/decoder | `framing.ts` و`cropForPortrait()`، ومسار التصدير يستخدم `processedWidth/processedHeight` بنسبة 9:16. اختبارات framing هندسية، لا ملف ناتج جديد. |
| المعاينة | موجودة جزئياً | تعتمد على decoder في المتصفح | `VideoPreview.tsx` يعرض المصدر، يطبق `objectPosition`، وضع full/background، logo/title/captions. لا توجد مطابقة بصرية آلية بين preview وexport في الاختبارات. |
| WebM export | موجودة في الكود ومختبرة جزئياً فقط | WebCodecs + Mediabunny؛ لا خادم | `convert-clip.ts` يختار VP9 ثم VP8 مع Opus، ويرسم canvas ويستخدم `WebMOutputFormat`. اختبارات export الحالية حسابية/سلوكية ولا تنشئ ملف WebM حقيقياً. |
| MP4 export | موجودة في الكود ومحدودة | WebCodecs H.264/AAC | الترتيب يبدأ MP4 إذا دعم `avc1` و`mp4a`، وإلا WebM. لا يوجد إثبات متصفح جديد لهذه المسارات. |
| التصدير الفردي | موجودة جزئياً | File System Access اختياري، وإلا ذاكرة | `exportOne()` يستعمل `requestSaveTarget()` عند توفره أو BufferTarget، مع منع تقديري فوق نحو 84 MiB عند غياب writer. لم تنفذ رحلة فعلية هنا. |
| التصدير الدفعي/ZIP | موجودة جزئياً | ذاكرة المتصفح؛ حد ZIP 64 MiB | `exportBatch()` يعمل تسلسلياً ويحافظ على المكتمل، ثم `createZip()` إذا بقيت النتيجة تحت `ZIP_LIMIT`. لا يوجد اختبار فيديو حقيقي جديد. |
| إلغاء التصدير | موجودة في الكود | لا تحتاج خادم | `AbortController`، `conversion.cancel()`، وفحص signal قبل إعادة الملف. توجد ملاحظة أن `requestSaveTarget()` لا يستلم signal من `exportOne()`، لذلك إلغاء المستخدم أثناء حوار save picker ليس مربوطاً بأفضل صورة. |
| حفظ المشروع واستعادته | موجودة جزئياً | IndexedDB، وOPFS اختياري | `project-store.ts` يحفظ metadata/settings/cues في IndexedDB، والمصدر في OPFS فقط عند دعم `navigator.storage.getDirectory`. عند غياب OPFS يجب إعادة اختيار الملف الأصلي. اختبارات التخزين وحدتان فقط؛ لا اختبار متصفح جديد لإعادة فتح المشروع. |
| Brand Controls | موجودة جزئياً | لا تحتاج خادم | `BrandControls.tsx` يوفر اسم/لونين/font/caption timing/logo position ورفع شعار محلياً. الإعدادات الافتراضية تُحفظ في preference واحدة. |
| Brand Kits متعددة | غير موجودة | — | لا توجد أنواع `BrandKit` ولا CRUD ولا قائمة مجموعات ولا store مخصص؛ البحث وجد `BrandControls` و3 presets فقط. |
| 15 قالباً قابلاً للتحرير | غير موجودة | — | لا توجد بيانات templates أو IDs أو فئات أو picker. البحث في `client/src` و`server` لم يجد تنفيذ templates؛ الموجود 3 presets في `BrandControls.tsx` لا تصل إلى 15 ولا تمثل تصميمات مستقلة. |
| الترجمة بين اللغات | موجودة جزئياً | Hugging Face model download عند الطلب | `translate.worker.ts` يدعم فقط `fr/es/de` من الإنجليزية، نموذجاً واحداً لكل لغة، وترجمة كل cue دون word alignment. `translate-cues.ts` يعيد نفس timestamps ويمسح `words`؛ الواجهة تحذر أن التوقيت phrase-level تقريبي. |
| تتبع الوجه | موجودة جزئياً | TensorFlow.js/Face Detection محلياً | `face-tracking.ts` و19 اختباراً هندسياً/منطقياً، مع fallback يدوي وتحذيرات. لا يحدد هوية المتحدث، ولا يوجد اختبار فيديو جديد هنا. |
| post copy | موجودة جزئياً | لا تحتاج API | `clip-analysis.ts` ينشئ عناوين/وصفاً/hashtags/CTA من transcript وقوالب generic؛ ليس نموذجاً دلالياً خارجياً ولا ضماناً تسويقياً. |
| نموذج الاستفسارات/الموقع | موجودة جزئياً وتحتاج خدمة خارجية | Express/tRPC، MySQL/Drizzle، Manus OAuth/Forge/notifications حسب المسار | `server/leads.ts`, `server/db.ts`, `server/_core/*`؛ الاختبارات تمرر placeholders وتتحقق من أخطاء محكومة. لا توجد بيانات تشغيل إنتاجية في المستودع. |

## 4. مراجعة مسار الفيديو والصوت

### نقاط جيدة

- الفيديو والصوت يقرآن من `File` محلي؛ README و`client/src/features/studio/media/README.md` يصفان عدم إرسال bytes أو transcript إلى API.
- `Input` و`AudioSampleSink` يحرران الموارد في `finally` في مسار التفريغ والتصدير.
- التفريغ يستخدم windows bounded، downmix إلى mono، resampling إلى 16 kHz، overlap، deduplication، وفحص tail recovery.
- `Worker.terminate()` موجود في `finally` لمسار Whisper، وWorker الترجمة يُنهى بعد النتيجة/الخطأ/الإلغاء.
- الفيديو بلا صوت يحصل على رسالة recovery تسمح بالقص اليدوي بدلاً من انهيار المسار.

### المخاطر/الحدود

- لا يوجد اختبار E2E قابل للتشغيل من المستودع يمرر ملف فيديو حقيقياً من upload حتى output. عدم وجود fixtures يجعل إعادة الإنتاج أمام المشتري أصعب.
- استهلاك الصوت قد يرتفع مع الملفات الطويلة لأن نافذة Whisper الحالية وعمليات التحويل تعمل داخل الذاكرة قبل إرسالها إلى worker؛ التقسيم يحده لكنه لا يجعل العملية streaming بالكامل.
- لا يوجد قياس أو budget موحد للذاكرة أثناء model loading أو face detection أو canvas encoding.
- دعم codecs يعتمد بشدة على المتصفح، وليس على مجرد وجود امتداد الملف.

## 5. مراجعة حدود المقاطع والكابتشن

`normalizeClipBounds()` يحد المقاطع إلى مدة المصدر ويمنع المدة الأقل من الحد الأدنى. `suggestClips()` يضع حدّاً أدنى 8 ثوانٍ وحداً أقصى 60 ثانية، ويوقف النمو عند pause داخلي أطول من 2.5 ثانية، ويمنع تداخل المقاطع المختارة بأكثر من 25% من الأقصر. هذه حماية جيدة من اقتراحات غير صالحة، لكنها لا تثبت جودة دلالية أو جودة تحريرية.

الكابتشن يعالج التوقيتات غير الصالحة والتداخل والكلمات الطويلة، لكن الترجمة تعيد نفس interval لكل نص مترجم. هذا صحيح كـ phrase-level approximation لكنه ليس word-level synchronization.

## 6. التصدير والمعاينة

التصدير يرسم الفيديو إلى Canvas بنسبة 9:16، ويضيف القص، caption، title card، والشعار قبل تحويله إلى WebM أو MP4 عبر Mediabunny. يستخدم `StreamTarget` مع File System Access عند توفره، و`BufferTarget` كبديل.

القيود المهمة:

- `supportedOutputFormat()` يتطلب `VideoEncoder` و`AudioEncoder` ويفحص MP4 ثم VP9 ثم VP8. لا يوجد fallback إلى MediaRecorder؛ متصفحات لا تدعم WebCodecs ستظهر كغير مدعومة.
- عند غياب File System Access، يوجد fallback ذاكرة مع حد تقديري 84 MiB، وحد ZIP 64 MiB. هذا تقدير bytes وليس قياساً موحداً للذاكرة الفعلية.
- `requestSaveTarget()` لديه timeout 2.5 ثانية للحوار المدمج، لكن استدعاء `exportOne()` لا يمرر `AbortSignal` إليه.
- لا يوجد في الاختبارات ملف WebM حقيقي ناتج من `exportClip()`. اختبارات `convert-clip.test.ts` تغطي helpers مثل bitrate/format/limits، لا صحة container الناتج.
- preview وexport يعيدان استخدام مفاهيم القص/overlay، لكن لا توجد لقطة/مقارنة آلية تثبت التطابق البصري pixel-level.

## 7. الأداء والذاكرة

نتيجة `pnpm build` الفعلية:

- `Studio-Bku77qtu.js`: `756,842` bytes.
- `index-BqWJmivl.js`: `589,360` bytes.
- `transcribe.worker`: `553,121` bytes.
- `translate.worker`: `552,850` bytes.
- ONNX WASM: `26,861,777` bytes قبل الضغط، `6,690,350` bytes gzip تقريباً.
- Vite أصدر تحذيراً بأن بعض chunks أكبر من 500 kB.

نقطة إيجابية: `App.tsx` يستخدم `lazy(() => import("./pages/Studio"))`، لذلك Studio لا يُحمّل في الصفحة الرئيسية قبل فتح المسار. لكن داخل Studio يتم تضمين مسارات ثقيلة نسبياً؛ workers والنماذج نفسها تُحمّل عند استخدام الوظيفة، وهذا lazy جزئي وليس code splitting كاملاً لكل feature.

المخاطر العملية:

- نماذج OPUS-MT المذكورة في `THIRD_PARTY_NOTICES.md` نحو 214.5–234.8 MiB لكل لغة قبل ملفات الإعداد والمعالجة.
- Whisper Tiny نحو 41 MB للأوزان q8 المقدرة في notices، وWhisper Base/المرفقات قد تختلف.
- face detection وWASM وcanvas buffers تتنافس على ذاكرة الجهاز.
- ملفات الفيديو الكبيرة لا تملك ضماناً موحداً عبر الأجهزة؛ التطبيق يعرض تحذيراً ويقترح 720p/clip أقصر.

الأولوية: تقسيم ميزات Studio الثقيلة، قياس memory pressure، تحميل النماذج عند الطلب فقط مع progress/cancel أقوى، وتوفير acceptance fixtures قابلة لإعادة التشغيل.

## 8. توافق المتصفحات وواجهات النظام

المسار يعتمد على:

- WebCodecs (`VideoEncoder`, `AudioEncoder`) للتصدير.
- File System Access (`showSaveFilePicker`) للحفظ المباشر الاختياري.
- IndexedDB للمشاريع والإعدادات.
- OPFS (`navigator.storage.getDirectory`) لحفظ المصدر اختيارياً.
- Web Workers وmodule workers.
- Canvas 2D و`createImageBitmap`.
- WASM/Transformers.js وTensorFlow.js.

توجد guards مناسبة لبعض الواجهات: غياب File System Access يرجع إلى BufferTarget، وغياب OPFS يرجع إلى إعادة اختيار المصدر، وغياب WebCodecs يجعل output format `null`. لكن لا يوجد مصفوفة دعم متصفحات منفذة في هذه المهمة، ولا يمكن إعلان Chrome/Edge/Firefox/Safari أو iOS/Android مدعوماً بناءً على الكود وحده.

تحذير البناء الحالي: `index.html` يذكر `/api/platform/config.js` بدون `type="module"`; Vite يطبع ذلك كتحذير غير حاجب.

## 9. الخدمات الخارجية والتكاليف التشغيلية

### Studio المحلي

- لا توجد معالجة فيديو سحابية أو API مدفوع في المسار الأساسي.
- توجد اتصالات تنزيل عامة لنماذج Hugging Face عند أول استخدام، وطلبات Google Fonts من stylesheet.
- التكلفة المباشرة لكل فيديو في الخادم تساوي تقريباً صفراً للمسار المحلي، لكن التكلفة تنتقل إلى CPU/RAM/طاقة جهاز المستخدم، وnetwork egress/cache لتنزيل النماذج.
- الأداء لأول استخدام يتأثر بحجم النموذج وسرعة الاتصال.

### Shell/الموقع

المشروع يحتوي على Express/tRPC وDrizzle/MySQL وتكاملات Manus/Forge/OAuth/notifications/storage في أجزاء منفصلة. هذه المسارات تحتاج secrets/config خارجية مثل `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `DATABASE_URL`, `MANUS_OAUTH_API_URL`, `MANUS_API_URL`, `MANUS_API_KEY` عند استخدام الميزات المقابلة. لا توجد أسعار أو deployment account داخل المستودع؛ لا يمكن إعطاء رقم تكلفة موثوق قبل معرفة منصة الاستضافة، حجم قاعدة البيانات، حركة leads، وحجم استخدام Forge/notifications.

## 10. الأمن والأسرار

نتيجة البحث النمطي في الملفات المتتبعة:

- لم أجد مفاتيح AWS/GitHub/OpenAI/Slack حية، private key، أو token عالي الثقة.
- أسماء المتغيرات السرية تظهر كقراءة من environment أو placeholders في الاختبارات، وليس كقيم إنتاجية.
- `.env` محلياً ليس ضمن tracked files التي فُحصت.
- `THIRD_PARTY_NOTICES.md` يذكر حدود الخصوصية: ملفات الفيديو والصوت/transcripts لا تُرفع لمسار Studio، لكن model downloads وخدمات shell الخارجية تبقى حدوداً خارجية.

هذا فحص pattern-based وليس ضماناً مطلقاً. قبل الاستحواذ يجب تشغيل secret scanner مخصص على كامل Git history، تدوير أي secrets خارج Git، والتحقق من إعدادات GitHub/Manus/قاعدة البيانات خارج المستودع.

## 11. المكتبات والنماذج والتراخيص

المراجع الموجودة في `THIRD_PARTY_NOTICES.md` و`package.json` تشمل:

- Mediabunny `1.61.4` — MPL-2.0.
- Transformers.js `4.3.1` — Apache-2.0.
- TensorFlow.js/Face Detection — Apache-2.0 حسب الإشعارات.
- fflate `0.8.3` — MIT.
- Whisper Base English وWhisper Tiny — notices تشير إلى Apache-2.0.
- OPUS-MT English→French/Spanish/German — CC BY 4.0 مع نسب Helsinki-NLP.
- Google Fonts — يجب مراجعة شروطها عند إعادة التوزيع أو الاستضافة الذاتية.
- `package.json` يعلن MIT للمشروع، لكن الفحص السابق للcheckout لم يجد ملف `LICENSE` مستقلاً؛ يجب حسم ملكية/ترخيص الكود قبل الصفقة وعدم الخلط بين كود المشروع وحقوق الطرف الثالث أو الحسابات.

## 12. الاعتماديات والثغرات الحالية

الإصدارات المثبتة في checkout:

- `zod 4.1.12`.
- `express 4.21.2` → `body-parser 1.20.8`.
- `axios 1.20.0` → `follow-redirects 1.16.1`.

نتيجة `pnpm audit --prod`:

| الحزمة | المسار | الشدة | الإصدار المصحح حسب audit |
|---|---|---:|---:|
| zod | direct | High | `>=4.6.6` |
| body-parser | `express` | High | `>=1.20.9` |
| follow-redirects | `axios` | High | `>=1.16.2` |

لم أُجرِ تحديثاً في هذه المرحلة. يجب اختيار تحديثات متوافقة، تشغيل `pnpm install` ثم `pnpm check`, `pnpm test -- --run`, `pnpm build`, و`pnpm audit --prod` مرة أخرى، وعدم اعتبار التحذيرات مغلقة قبل ظهور نتيجة audit نظيفة أو تفسير موثق.

## 13. طريقة التشغيل والنشر

التشغيل المحلي المعلن في `README.md` و`BUYER_HANDOFF.md`:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
pnpm dev
```

`pnpm build` يبني Vite client ثم bundles `server/_core/index.ts` إلى `dist/index.js`. توجد أيضاً `pnpm build:static` و`pnpm dev:static`. فتح `/studio` لا يحتاج قاعدة بيانات لمسار التحرير المحلي، لكن الموقع الكامل ومسارات leads/OAuth/platform تعتمد على environment variables وخدمات خارجية.

لا يوجد deployment production URL مثبت في المستودع، ولا توجد قاعدة بيانات/حسابات buyer ضمن checkout. Dockerfile موجود، لكنه لا يثبت وحده جاهزية بنية الإنتاج أو تكاليفها.

## 14. مشكلات مؤكدة وأولويات الإصلاح

### P0 — قبل عرض المشروع للمشتري

1. تحديث الثغرات الثلاث: zod/body-parser/follow-redirects مع إعادة تشغيل كامل الفحوص.
2. عدم وصف المشروع بأنه يحتوي 15 قالباً؛ القوالب غير موجودة فعلياً.
3. عدم وصف Brand Controls الحالية بأنها Brand Kits؛ لا يوجد CRUD لمجموعات متعددة.
4. إعداد فيديوهات fixtures قانونية ومصفوفة browser acceptance قابلة لإعادة التشغيل لإثبات upload → Whisper → captions → preview → WebM → ffprobe.

### P1 — جودة المنتج والاعتماد

1. إضافة 15 قالباً حقيقياً ببيانات تصميم تصل إلى preview/export معاً، واختبارات تطبيق/استعادة.
2. بناء Brand Kits محلية متعددة مع logo/colors/fonts/caption style وCRUD واختبارات IndexedDB.
3. إضافة E2E/browser tests أو runbook موثق بفيديوهات synthetic، مع ffprobe للـ WebM الناتج.
4. حل مسار WebCodecs للمتصفحات غير المدعومة أو توضيح compatibility matrix رسمية.
5. تمرير signal إلى save picker ومعالجة cancellation في هذه المرحلة بوضوح.
6. إضافة مقارنة preview/export أو اختبار بصري/لقطات للـ overlays.

### P2 — الأداء والتسليم

1. تقسيم bundle Studio وworkers/face detection، وقياس أثر ذلك.
2. قياس الذاكرة للملفات الطويلة، التصدير، Whisper، OPUS-MT، وZIP.
3. توثيق browser/device support الفعلي، لا النظري.
4. حسم ملف `LICENSE` وحقوق النماذج والخطوط والحسابات الخارجية.
5. إضافة secret scan كامل للتاريخ قبل النقل.
6. إصلاح تحذير config script إن كان لاستخدام module ضرورياً، أو توثيق سبب إبقائه.

## 15. ما لم أستطع إثباته في هذه المهمة

- لم أشغّل متصفحاً تفاعلياً أو أرفع فيديو حقيقياً، لأن بيئة الفحص الحالية لا توفر متصفحاً تفاعلياً متاحاً لهذه المهمة.
- لم أنزّل نموذج Whisper أو OPUS-MT ولم أشغله على صوت حقيقي.
- لم أنشئ WebM/MP4 جديداً ولم أفحصه بـ `ffprobe`.
- لم أختبر Chrome/Edge/Firefox/Safari أو أجهزة الهاتف.
- لم أختبر استعادة مشروع بعد reload في متصفح حقيقي.
- لم أتحقق من حسابات Manus/Forge/MySQL أو تكلفة نشر فعلية.
- لم أعتبر التقارير التاريخية في `docs/` دليلاً على اختبار جديد؛ هي مرجع تاريخي فقط.

## 16. الخلاصة

التقييم التقني الواقعي هو: **نواة تحرير محلي حقيقية ومتماسكة جزئياً، لكنها ليست جاهزة لتقديم ادعاءات كاملة عن 15 قالباً أو Brand Kits أو توافق شامل قبل تنفيذ تلك الميزات وإثباتها.** الاختبارات الوحدية الحالية جيدة نسبياً لمنطق التحليل والتوقيت والتصدير المساعد، لكن فجوة الاختبار الفيديوي القابل لإعادة الإنتاج هي أهم فجوة في due diligence.

لا ينبغي إرسال وصف للمشتري يقول إن القوالب الخمسة عشر أو Brand Kits موجودة حالياً. الوصف الدقيق هو أن المشروع يملك local browser editor مع transcription/translation/caption/framing/export code، مع قيود browser/model/memory، وأن القوالب المتقدمة وBrand Kits متعددة غير موجودة في النسخة المفحوصة.
