# Independence Audit — Frame & Key Studio

**التاريخ:** 2026-11-14  
**الهدف:** التحقق من قدرة المشتري على تشغيل مسار التحرير المحلي دون حساب Manus أو Forge أو مفاتيح المطور الأصلي.

## الحكم

**مسار `/studio` مستقل وظيفيًا عن Manus/Forge بعد تثبيت Node وpnpm:** يمكن تشغيل الخادم وفتح `/studio` دون ضبط متغيرات Manus أو قاعدة بيانات. الفيديو والصوت والـtranscription والترجمة وتتبع الوجه والمعاينة والتصدير تتم داخل المتصفح أو WebAssembly/WebCodecs، ولا يوجد endpoint يرفع ملف الوسائط.

**المستودع ككل ليس مستقلًا بالكامل عن المنصة:** الصفحة الرئيسية تحتوي نموذج استفسار قد يحتاج قاعدة بيانات وإشعارًا، والقالب يضم OAuth وForge وMaps وLLM وStorage موروثة. هذه الخدمات اختيارية بالنسبة إلى `/studio`، لكنها مطلوبة إذا أراد المشتري تفعيل تلك الأجزاء الموروثة.

## اختبار النسخة النظيفة

تم استنساخ `origin/main` في `/home/ubuntu/clean-clone-frame-key-studio` من GitHub قبل الإصلاحات الأمنية، ثم نُفذت الخطوات التالية دون ملفات `.env` أو credentials محلية:

- `git clone --depth=1` — نجح.
- `pnpm install --frozen-lockfile --ignore-scripts` — نجح.
- `pnpm check` — نجح.
- `pnpm test --run` — نجح: 19 ملفًا و135 اختبارًا.
- `pnpm build` — نجح.
- `/api/health` — أعاد `{"status":"ok"}`.
- `/studio` — أعاد HTTP 200 وظهر في المتصفح المحلي بعنوان Frame & Key Studio.
- صفحة `/studio` أظهرت بوضوح: “Your media stays on this device”، و“Video and audio are processed in your browser”، و“Open source tools. No media uploads”.

بعد الإصلاحات، أُعيد تشغيل check/tests/build في نسخة العمل ونجحت جميعها. اختبار ربط فيديو حقيقي بمنتقي الملفات لم يكتمل آليًا لأن أداة المتصفح لم تستطع الوصول إلى عنصر `input[type=file]` المخفي؛ لذلك لا يدّعي هذا التقرير نجاح Whisper أو التصدير الفعلي من ذلك الملف.

## تصنيف الاعتمادات

### لا تحتاج حساب المشتري أو Manus/Forge لمسار الاستوديو

| الوظيفة | الدليل | مكان التنفيذ |
|---|---|---|
| رفع الفيديو | `Studio.tsx` يستخدم `File` و`input[type=file]` ولا يوجد upload API | المتصفح |
| قراءة metadata والصوت | `mediabunny` مع `BlobSource(file)` | المتصفح |
| Whisper | `transcribe.worker.ts` يستخدم Transformers.js مع `Xenova/whisper-tiny` أو `Xenova/whisper-base.en` | Web Worker محلي |
| ترجمة OPUS-MT | `translate.worker.ts` يستخدم `onnx-community/opus-mt-en-*` | Web Worker محلي |
| تتبع الوجه | TensorFlow.js/face-detection | المتصفح |
| القص والمعاينة والتعليقات | React/Mediabunny/Canvas/WebCodecs | المتصفح |
| حفظ المشاريع | IndexedDB وOPFS حسب دعم المتصفح | جهاز المشتري |
| التصدير والتنزيل | Mediabunny/WebCodecs وBlob/File System Access أو download fallback | جهاز المشتري |

### اعتماد اختياري خاص بالتطوير

- جامع سجلات Manus في `vite.config.ts` — **اختياري ومعطل افتراضيًا**. لا يعمل إلا مع `MANUS_DEBUG_COLLECTOR=true`. لا يحتاجه البناء أو الاختبارات أو الاستوديو.
- `@builder.io/vite-plugin-jsx-loc` — أداة مواقع JSX للتطوير، وليست اعتماد تشغيل.

### اعتماد اختياري خاص بالاستضافة/الصفحة الموروثة

- `MANUS_PROJECT_ID` و`MANUS_JWT_SECRET` و`MANUS_OAUTH_API_URL` و`MANUS_OAUTH_PORTAL_URL` و`MANUS_API_URL` و`MANUS_API_KEY` و`OWNER_OPEN_ID` — تخص OAuth والجلسات وForge والإشعارات وLLM وMaps وData API.
- `DATABASE_URL` — تخص Drizzle/MySQL ومسار `/api/leads` وترحيلات قاعدة البيانات.
- `MANUS_API_BROWSER_KEY` — قيمة عامة اختيارية لمسار Maps الموروث؛ ليست سرًا خادمياً، لكنها لا تمنح استقلالًا عن مزود الخرائط.
- `/manus-storage/*` و`server/storage.ts` و`server/_core/storageProxy.ts` — تكامل تخزين موروث، غير مستخدم في مسار الاستوديو المحلي.

### أثر قديم/موروث غير مطلوب لمسار الاستوديو

- `server/_core/llm.ts` و`imageGeneration.ts` و`map.ts` و`dataApi.ts` و`notification.ts` وOAuth routes موجودة في قالب الخادم لكنها ليست مستدعَاة من تحرير الوسائط المحلي.
- `client/src/main.tsx` يهيئ عميل tRPC العام، لكن وظائف الاستوديو لا تستخدم API لرفع أو تحليل الفيديو.
- نموذج الصفحة الرئيسية `/api/leads` ليس جزءًا من وظائف التحرير، وقد يفشل حفظه محليًا دون MySQL؛ هذا متوقع ومذكور هنا وليس فشلًا في استقلال `/studio`.

## مصادر النماذج والموارد الخارجية

- Whisper English: `Xenova/whisper-base.en` من Hugging Face، Apache-2.0.
- Whisper multilingual: `Xenova/whisper-tiny` من Hugging Face، Apache-2.0.
- الترجمة: `onnx-community/opus-mt-en-ar/fr/es/de`، مع نسب OPUS-MT/CC BY 4.0 موثقة في `THIRD_PARTY_NOTICES.md` وواجهة الاستوديو.
- Transformers.js ينزل ملفات النموذج عند أول استخدام حسب إعداد pipeline. هذا تنزيل نموذج عام، وليس إرسال فيديو أو صوت إلى Hugging Face.
- Google Fonts في CSS مورد عرض خارجي اختياري؛ توجد fallbacks، لكنه قد لا يكون متاحًا دون إنترنت.
- أزيلت أيقونة Manus CDN من `index.html` و`app.config.ts` واستُبدلت بشعار محلي في `client/public/framekey-platform-mark.svg`.

## دليل بقاء الوسائط محلية

1. `analyze-video.ts` يمرر `new BlobSource(file)` إلى Mediabunny.
2. `transcribe.worker.ts` يستقبل `Float32Array` صوتية من الخيط الرئيسي ولا يبني طلب HTTP للفيديو.
3. `translate.worker.ts` يستقبل نصوص captions فقط بعد transcription المحلي، ويستدعي pipeline المحلي للنموذج.
4. `convert-clip.ts` يستقبل `File` ويرسم ويشفّر محليًا ثم يعيد Blob/ملف تنزيل.
5. لا توجد في `client/src/features/studio` استدعاءات `fetch` لرفع media؛ البحث أظهر روابط مصادر النماذج فقط.
6. الخادم يعرّف bodies بحد 1 MB ولا يعرّف media upload route.

لا يثبت هذا أن المتصفح لا ينشئ أي اتصال شبكي إطلاقًا؛ تنزيل النماذج، خطوط Google، وأصول الصفحة الرئيسية قد تحتاج الشبكة. الادعاء الصحيح هو أن ملف المستخدم لا يُرسل إلى Manus/Forge في مسار الاستوديو كما هو مكتوب في الكود.

## متطلبات المشتري

1. Node.js حديث وpnpm 10.34.9 أو مدير متوافق.
2. `pnpm install --frozen-lockfile --ignore-scripts` ثم `pnpm dev` أو `pnpm build && pnpm start`.
3. متصفح حديث يدعم WebAssembly وWebCodecs/MediaSource وIndexedDB؛ بعض codecs تعتمد على المتصفح.
4. إنترنت أولي لتنزيل نماذج Hugging Face عند استخدام Whisper أو الترجمة. يمكن للمشتري مراجعة/تخزين cache النموذج وفق شروطه، لكن المستودع لا يضم أوزانًا كبيرة.
5. لا يحتاج `/studio` إلى `DATABASE_URL` أو OAuth أو `MANUS_API_KEY` أو حساب Manus/Forge.
6. تفعيل الصفحة الرئيسية/الاستفسارات وخدمات القالب يتطلب credentials مملوكة للمشتري، وليس credentials المطور الأصلي.

## خلاصة الاستقلال

المشتري يستطيع امتلاك الكود وتثبيت التبعيات وفتح `/studio` واستخدام المسار المحلي الأساسي دون حساب المطور الأصلي. أما تسليم الموقع ككل مع نموذج الاستفسار وOAuth والخدمات الموروثة فيحتاج فصلًا تشغيليًا واضحًا أو إعداد credentials مملوكة للمشتري. لا ينبغي وصف الصفحة الرئيسية أو تكاملات القالب بأنها مستقلة عن Manus/Forge دون هذا الإعداد.
