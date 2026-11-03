# Frame & Key Studio — Complete Combined Report

**تاريخ التجميع:** 2026-11-03  
**المستودع:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**الغرض:** ملف واحد يجمع تقارير الفحص التجاري والفني، نتائج الاختبارات، وثائق التسليم، وقائمة القبول.

> **ملاحظة مهمة:** القسم الخاص بنتائج 2026-11-03 هو المرجع الحالي للاختبارات الآلية. الأقسام الموسومة تاريخية تحتفظ بنتائجها الأصلية ولا تمثل اختباراً جديداً لكل متصفح أو جهاز.

## المحتويات

1. [التقرير الكامل للفحص الفني والتجاري السابق](#1-التقرير-الكامل-للفحص-الفني-والتجاري-السابق) — تقرير الفحص الأصلي الذي يضم التقييم التجاري، الوظائف، المخاطر، التراخيص، والوصف التجاري الإنجليزي.
2. [README الحالي للمشروع](#2-readme-الحالي-للمشروع) — وثيقة المنتج والتشغيل الحالية.
3. [دليل تسليم المشتري](#3-دليل-تسليم-المشتري) — دليل بنية المشروع والتشغيل ومتطلبات التسليم.
4. [نتائج الاختبارات الحالية — 2026-11-03](#4-نتائج-الاختبارات-الحالية-—-2026-11-03) — نتائج تم تشغيلها فعلياً على النسخة الحالية.
5. [قائمة القبول اليدوي](#5-قائمة-القبول-اليدوي) — إجراءات يستطيع المشتري تنفيذها للتحقق من الوظائف.
6. [قائمة حزمة التسليم](#6-قائمة-حزمة-التسليم) — الملفات التي تدخل أو تستبعد من حزمة التسليم.
7. [تقرير القبول التاريخي — 2026-10-21](#7-تقرير-القبول-التاريخي-—-2026-10-21) — تقرير تاريخي، محفوظ بتاريخ ونتائج تشغيله الأصلية.
8. [تقرير التحقق التاريخي — 2026-10-15](#8-تقرير-التحقق-التاريخي-—-2026-10-15) — تقرير تاريخي، محفوظ بتاريخ ونتائج تشغيله الأصلية.

---



# 1. التقرير الكامل للفحص الفني والتجاري السابق

> **مصدر هذا القسم:** `/home/ubuntu/Frame-Key-Studio-Sale-Due-Diligence-AR.md`  
> **الوصف:** تقرير الفحص الأصلي الذي يضم التقييم التجاري، الوظائف، المخاطر، التراخيص، والوصف التجاري الإنجليزي.

**رابط المستودع:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**تاريخ الفحص:** 2026-11-03  
**نطاق الفحص:** قراءة المستودع والكود والوثائق والاختبارات وتشغيل الفحوص المتاحة دون تعديل أي ملف في المشروع.  
**Commit محل الفحص:** `efb00be5622ccb3517f964f17999c424f6dc9616` — `docs: record complete acceptance validation`  
**حالة المستودع عند الفحص:** عام، والفرع الأساسي `main`، ولم تظهر تغييرات متتبعة بعد التثبيت والفحص.

---

## 1. الخلاصة التنفيذية للمشتري

Frame & Key Studio هو محرر فيديو قصير يعمل أساساً داخل متصفح المستخدم، ومصمم بصورة خاصة لتحويل فيديوهات العقارات أو الفيديوهات الأفقية إلى مقاطع عمودية قابلة للنشر على Reels وTikTok وYouTube Shorts. قوته الأساسية أن الوسائط لا تُرفع إلى خادم المعالجة: الفيديو والصوت والتفريغ والتصدير تتم محلياً داخل المتصفح، مع تنزيل نماذج الذكاء الاصطناعي المفتوحة عند اختيار الوظائف التي تحتاج إليها.

المشروع **ليس مجرد واجهة تجريبية**. يوجد كود فعلي لمعالجة الوسائط، قراءة الصوت، التفريغ، اقتراح المقاطع، الكابتشن، الترجمة الاختيارية، تتبع الوجه، القص العمودي، التصدير، التخزين المحلي، واختبارات وحدات وانحدار. في الفحص الحالي نجحت الفحوص البرمجية التالية:

- `pnpm check`: ناجح.
- `pnpm test -- --run`: **90 اختباراً ناجحاً في 13 ملف اختبار**، دون فشل.
- `pnpm build`: ناجح.
- `git status --short`: لم يظهر تغييرات متتبعة بعد الفحص.

لكن المشروع ليس منتج SaaS جاهزاً للتشغيل التجاري كخدمة مستضافة دون تجهيز. توجد قيود مهمة:

- لا توجد منصة استضافة إنتاجية أو رابط عام موثق داخل المستودع.
- الاستوديو نفسه يعمل محلياً، لكن الصفحة الرئيسية ونموذج الاستفسار يعتمدان على خدمات Manus/Forge وقاعدة بيانات وإعدادات بيئية خارجية.
- اختبارات الوحدات ناجحة، لكنها لا تثبت وحدها نجاح كل رحلة داخل متصفح حقيقي أو على كل الأجهزة.
- توجد تقارير داخل المستودع عن اختبارات وسائط حقيقية ناجحة، لكن هذه الاختبارات ليست كلها قابلة لإعادة التشغيل من المستودع وحده؛ بعض ملفات الوسائط الخام كانت خارج GitHub.
- تتبع الوجه موجود لكنه غير مضمون؛ في اختبار حقيقي موثق فشل الكشف التلقائي على مقطع معين، وعاد التطبيق بصورة صحيحة إلى القص اليدوي.
- الترجمة المحلية محدودة إلى English → French/Spanish/German، وتحتاج تنزيل نموذج كبير لكل لغة.
- حجم حزمة WASM كبير، وتوجد تحذيرات من حجم بعض JavaScript chunks.
- `package.json` يعلن ترخيص MIT للتطبيق، لكن لا يوجد ملف `LICENSE` مستقل ظاهر في المستودع. كما أن MIT لا تمنح ملكية مكتبات ونماذج الطرف الثالث، ولا تنقل حسابات Manus أو خدماتها إلى المشتري.

### التقييم النهائي من منظور مشتري يريد امتلاك المشروع

| البعد | التقدير الواقعي |
|---|---:|
| اكتمال الكود والوظائف الأساسية | 80–85% |
| جاهزية التسليم كمصدر كود قابل للتشغيل | 70% |
| جاهزية التشغيل كخدمة مستضافة جاهزة للعملاء | 50–60% |
| جاهزية البيع كأصل برمجي/مشروع قابل للنقل | 65–70% |
| التقييم الإجمالي المحافظ | **68/100 كأصل برمجي** |

هذا التقييم لا يعتبر غياب الدفع أو الاشتراكات عيباً؛ فالبيع المقصود هنا هو بيع ملكية المشروع. النواقص التي تؤثر على الصفقة هي قابلية التسليم، وضوح الملكية والتراخيص، الاعتماد على منصة خارجية، وإمكانية إعادة تشغيل اختبارات الوسائط أمام المشتري.

---

## 2. ما هو المشروع فعلياً؟

المشروع يتكون من جزأين:

1. **موقع تسويقي/نموذج استفسار** موجّه لخدمة تحرير فيديو للعقارات، مع نموذج يجمع الاسم والبريد والدور والرسالة ويرسلها إلى API الخادم ويحفظها في قاعدة البيانات عند توفر إعدادات Manus.
2. **Studio** داخل المتصفح، وهو الجزء القابل للبيع كمنتج تقني مستقل. يرفع المستخدم الفيديو من جهازه، يحلله، يختار المقاطع، يعدل النص والتأطير والهوية البصرية، ثم يصدّر الملفات محلياً.

المعالجة المحلية تعني أن المشتري يمكنه استخدام قلب الاستوديو دون تشغيل خادم لمعالجة الفيديو. مع ذلك، المشروع الكامل ما زال يحتوي على خادم Express/tRPC وقاعدة بيانات Drizzle لنموذج الاستفسارات وتكاملات القالب والمنصة.

---

## 3. قائمة الوظائف المكتملة فعلياً

هذه الوظائف لها أدلة في الكود، وبعضها مدعوم باختبارات أو تقارير تحقق حقيقية:

### 3.1 إدخال الفيديو وتحليل الملف

- اختيار ملف فيديو من جهاز المستخدم.
- قراءة المدة، الأبعاد، الحجم، معدل الإطارات، وجود الصوت، والمسارات باستخدام Mediabunny.
- معالجة المصدر الأصلي، وليس ملف preview منخفض الجودة.
- عرض تحذير عند عدم وجود صوت، مع السماح بالقص اليدوي والتصدير.
- تمرير الصوت إلى نوافذ زمنية للمعالجة بدلاً من رفع الفيديو كاملاً إلى الخادم.

### 3.2 التفريغ الصوتي

- تشغيل Whisper داخل Web Worker.
- استخدام `Xenova/whisper-base.en` للإنجليزية، و`Xenova/whisper-tiny` للغات الأخرى/الوضع متعدد اللغات.
- الحصول على توقيتات على مستوى الكلمات عند توفرها.
- تقسيم الصوت إلى نوافذ، مع overlap ومحاولات لاستعادة الكلمات في نهاية المصدر.
- إظهار تقدم تحميل النموذج وتقدم التحليل وإلغاء العملية ورسائل الأخطاء.
- إمكانية الاختيار اليدوي عند عدم توفر التفريغ.

### 3.3 اقتراح المقاطع

- تقسيم النص إلى جمل/مجموعات كلمات مؤقتة.
- ترتيب نوافذ مقترحة استناداً إلى اكتمال الجملة، التوقيت، فترات الصمت، وإشارات نصية بسيطة.
- اقتراح ما يصل إلى ثلاثة مقاطع عند توفر محتوى مناسب.
- اقتراح بدايات/Hook مأخوذة من الكلام الموجود في التسجيل، وليس نصاً مختلقاً من خدمة خارجية.
- إظهار أسباب الترتيب وتحذير المراجعة عندما تكون التوقيتات أو جودة النص أقل موثوقية.
- تعديل بداية ونهاية كل مقطع يدوياً.
- إضافة مقطع يدوي عند عدم وجود كلام أو عند رغبة المستخدم.

### 3.4 النصوص والكابتشن

- إنشاء كابتشن من كلمات التفريغ.
- وضع الكلمات أثناء النطق أو عرض كتل قصيرة/جمل.
- تعديل نص الكابتشن وتوقيته يدوياً.
- استيراد ملفات SRT وVTT.
- تصدير SRT وVTT.
- تطبيق أنماط متعددة للكابتشن مثل clean وbold وeditorial.
- حرق الكابتشن داخل الفيديو المصدر عند التصدير.
- ملاحظة صريحة في الواجهة بأن الترجمة الآلية phrase-timed وليست word-aligned بدقة.

### 3.5 الترجمة المحلية

- English → French.
- English → Spanish.
- English → German.
- تشغيل نماذج OPUS-MT محلياً في Web Worker عبر Transformers.js وWASM/CPU.
- تنزيل النموذج فقط عند طلب اللغة.
- إظهار تقدم تحميل النموذج والتقدم لكل سطر.
- الاحتفاظ بالكابتشن الأصلي والمترجم منفصلين.

### 3.6 القص العمودي والتأطير

- قص 9:16 من مصدر أفقي.
- وضع Fill لملء الإطار العمودي بقص الجوانب.
- وضع Show Full Video/Studio Background لإظهار الفيديو الكامل داخل لوحة عمودية دون تمديد، مع خلفية استوديو.
- منزلق تأطير أفقي يدوي.
- معاينة القص قبل التصدير.
- حساب تحذير عندما يتطلب إخراج 1080×1920 تكبير الجزء المتاح من مصدر 1920×1080.
- الحفاظ على حدود القص داخل المصدر.

### 3.7 كشف الوجه

- MediaPipe Face Detector محلياً عبر TensorFlow.js.
- تحليل عينات من الفيديو.
- اختيار الوجه الأكبر مع بعض الاستمرارية والتنعيم.
- منع القفزات المفاجئة في موضع القص.
- التعامل مع عدة وجوه بدرجة محدودة.
- fallback واضح إلى القص اليدوي عند عدم وجود وجه ثابت أو عند فشل النموذج.
- لا يدعي الكود التعرف على هوية المتحدث أو تحديد الشخص الذي يتكلم.

### 3.8 الهوية البصرية

- رفع شعار محلياً.
- اختيار ألوان وخطوط وموقع الشعار.
- إعداد نمط الكابتشن والعنوان.
- حفظ إعدادات الهوية محلياً.
- تطبيق الإعدادات على المقاطع الجديدة.
- عرض عنوان ووصف ووسوم وعبارات تفاعل مستخرجة/مولدة من النص المحلي وقابلة للتعديل.

### 3.9 التصدير والتنزيل

- تصدير المقطع المحدد.
- تصدير عدة مقاطع بالتسلسل.
- إظهار تقدم وحالة كل مقطع.
- WebM VP9/VP8 حسب الدعم.
- MP4 عند توفر H.264/AAC في المتصفح.
- رسم القص والكابتشن والعنوان والشعار على Canvas أثناء التصدير.
- وجود صوت في المخرجات التي تم فحصها سابقاً.
- اختيار 720×1280 أو 1080×1920، مع معدل إطارات 30fps في التقارير السابقة.
- استخدام File System Access/StreamTarget عند دعم المتصفح للتقليل من ضغط الذاكرة.
- fallback إلى BufferTarget للملفات الأصغر أو عند عدم توفر الحفظ المباشر.
- تنزيل مقطع منفرد.
- إنشاء ZIP للمقاطع، مع حد ذاكرة 64MB للـ ZIP داخل المتصفح.
- إلغاء التصدير والتعامل مع فشل الحفظ.

### 3.10 التخزين المحلي

- حفظ المشاريع والإعدادات في IndexedDB.
- حفظ مصدر الفيديو اختيارياً في OPFS إذا دعم المتصفح ذلك.
- عدم حفظ ملف المصدر تلقائياً في قاعدة بيانات الموقع.
- عند عدم دعم OPFS أو عند مسح تخزين المتصفح، يجب اختيار المصدر مرة أخرى.
- منع الكتابات المتداخلة في تخزين المشروع عبر طابور كتابة.

---

## 4. الوظائف الجزئية أو ذات القيود

هذه الوظائف موجودة وتعمل ضمن نطاق محدد، لكنها لا ينبغي عرضها للمشتري كحل مضمون في جميع الحالات:

1. **التفريغ متعدد اللغات:** موجود، لكن دقته وسرعته تعتمد على Whisper Tiny والجهاز وجودة الصوت. الإنجليزية تستخدم Base English الأكثر دقة بحسب توثيق المشروع، بينما اللغات الأخرى تعتمد Tiny.
2. **اقتراح المقاطع:** هو ترتيب قائم على التوقيت والكلمات وقواعد بسيطة، وليس فهماً دلالياً أو تنبؤاً مضموناً بأفضل مقطع أداءً.
3. **تتبع الوجه:** موجود ومختبر في سيناريوهات متعددة وفق تقارير المستودع، لكنه فشل في مسار حقيقي موثق لمقطع محاضرته بعيدة/وجه صغير. الرجوع اليدوي يعمل كحل آمن.
4. **الترجمة:** تعمل محلياً عند نجاح تحميل النموذج، لكنها محدودة بثلاث لغات هدف، وتوقيتاتها تقريبية على مستوى العبارات.
5. **الدقة 1080×1920:** الإخراج مدعوم، لكنه لا يعيد تفاصيل فقدت بسبب قص 9:16 من مصدر 1920×1080. هو حجم تسليم أعلى، وليس استعادة لجودة المصدر.
6. **الملفات الكبيرة:** توجد معالجة متدفقة وتحديدات ذاكرة، لكن لا يوجد ضمان عملي موحد لكل الأجهزة. المتصفح الذي لا يدعم الحفظ المباشر قد يضطر إلى الذاكرة.
7. **النشر الكامل:** البناء المحلي للخادم موجود، لكن إعدادات Manus/Forge/قاعدة البيانات ليست مضمّنة ولا توجد بيئة إنتاج جاهزة.
8. **نموذج الاستفسارات:** الكود موجود ومختبر، لكنه يحتاج قاعدة بيانات وخدمة إشعار وإعدادات بيئية؛ وهذا منفصل عن المعالجة المحلية للفيديو.

---

## 5. الوظائف غير المكتملة أو غير المثبتة

- لا توجد خدمة استضافة إنتاجية موثقة أو URL إنتاجي داخل المستودع.
- لا توجد مزامنة للمشاريع بين الأجهزة؛ التخزين محلي للمتصفح.
- لا يوجد حساب مستقل مطلوب للاستوديو ولا نظام إدارة مشاريع سحابي.
- لا يوجد نظام دفع أو اشتراك، وهذا **ليس نقصاً بالنسبة لصفقة بيع الملكية** لأنه كان خارج النطاق المقصود.
- لا يوجد backend لمعالجة الوسائط أو queue أو worker سحابي؛ هذه ميزة خصوصية وتكلفة، لكنها تحد من قابلية تحويله مباشرة إلى SaaS مركزي.
- لا توجد ترجمة إلى العربية أو لغات أخرى غير الفرنسية والإسبانية والألمانية.
- لا يوجد تعرّف موثوق على هوية المتحدث؛ النظام يتابع وجهاً مرئياً فقط عند نجاح الكشف.
- لا توجد اختبارات شاملة لكل المتصفحات والأجهزة المحمولة الفعلية في المستودع.
- لا توجد اختبارات E2E آلية كاملة لرحلة: رفع ملف → تحميل نموذج → تفريغ → اختيار → ترجمة → تصدير → فتح الناتج.
- لم تُثبت قابلية التصدير إلى MP4 في كل متصفح؛ الكود يختار MP4 عند دعم H.264/AAC وإلا يختار WebM.
- لا توجد ضمانات أداء أو ذاكرة لكل أحجام الفيديو؛ توجد تحذيرات وحدود داخل التطبيق.
- لا يوجد ملف `LICENSE` مستقل رغم إعلان `MIT` في `package.json`.
- لا توجد حزمة تسليم مستقلة تحتوي الأوزان أو ملفات الاختبار الخام؛ النماذج تُحمّل من مستودعات عامة عند الاستخدام.

---

## 6. الاختبارات والنتائج

### 6.1 ما تم تشغيله في هذا الفحص

تم تشغيل الأوامر في نسخة نظيفة من المستودع:

```text
pnpm install --frozen-lockfile       ناجح
pnpm check                           ناجح
pnpm test -- --run                   ناجح: 13 ملفاً / 90 اختباراً
pnpm build                           ناجح
```

نتيجة Vitest الحالية:

- Test Files: **13 passed**.
- Tests: **90 passed**.
- لا توجد اختبارات فاشلة في التشغيل الحالي.
- ظهرت رسائل تحذير متوقعة من اختبارات الخادم عند غياب `MANUS_OAUTH_API_URL`، لكنها لم تفشل الاختبارات.

### 6.2 ما تغطيه الاختبارات الحالية

الاختبارات تغطي وحدات مهمة، منها:

- اقتراح المقاطع وتجميع الجمل.
- التوقيتات وتحويلها.
- SRT/VTT قراءة وكتابة.
- مهلة تحميل النموذج.
- القص العمودي وجودة القص.
- التصدير وحسابات bitrate.
- أسماء الملفات وZIP.
- تحليل الفيديو وحدود نوافذ Whisper.
- كشف الوجه، الاستمرارية، التنعيم، حدود القص والرجوع اليدوي.
- تخزين المشروع المحلي.
- تسجيل الخروج والاستفسارات وفحوص التكامل الأساسية للخادم.

### 6.3 اختبارات الوسائط الحقيقية الموثقة داخل المستودع

التقارير الموجودة في `docs/` وملفات التشخيص توثق نتائج تشغيل حقيقية سابقة، ويجب عرضها للمشتري بهذه الصياغة: **موثقة في المستودع وليست إعادة تشغيل جديدة في هذا الفحص**.

التقارير توثق ما يلي:

- اختبار خمسة فيديوهات تقريباً، كلها 1920×1080 ومدتها نحو 12 ثانية: متحدث قريب، متحدث متحرك، محاضرة بعيدة، مشهد متعدد العناصر، وتسجيل شاشة.
- نجاح معاينة Fill portrait frame.
- نجاح معاينة Show full video/studio background.
- استيراد SRT وظهور العنوان والكابتشن في المعاينة.
- فشل متوقع للكشف التلقائي عن الوجه في مقطع اصطناعي/وجه غير مناسب، مع تشغيل fallback اليدوي.
- نجاح تصدير حقيقي سابق إلى 720×1280 WebM مع VP9/Opus.
- نجاح تصدير حقيقي سابق إلى 1080×1920 WebM مع VP9/Opus.
- فحص مستقل سابق باستخدام `ffprobe` ووجود الصوت والكابتشن في الإخراج.
- نجاح تصدير مقطع فعلي مدته نحو 22.14 ثانية، ونجاح وضع الفيديو الكامل مع خلفية الاستوديو.
- اختبار سابق لمصدر كبير مدته 650.863 ثانية وحجم يقارب 101.6MB؛ تم تصدير مقطع محدد منه بنجاح في تقرير التشخيص.
- فحص ملفات 5 و30 و90 ثانية في تقرير الملفات الكبيرة؛ لكن التقرير يصرّح صراحة بأن تصدير WebCodecs الكامل لم يُقَس في بيئة الطرفية لذلك لا توجد أرقام مخترعة لزمن التصدير أو ذروة الذاكرة.

### 6.4 ما لم يُختبر بما يكفي

- رحلة E2E آلية داخل CI على Chrome/Safari/Firefox.
- جميع أنواع الحاويات والكودكات الممكنة.
- ملفات 4K أو ملفات طويلة جداً على أجهزة RAM منخفضة.
- هواتف حقيقية متعددة، خصوصاً iOS Safari.
- ترجمة كل اللغات في أجهزة بطيئة.
- استعادة المشروع بعد مسح التخزين أو فشل OPFS على أنظمة مختلفة.
- تصدير MP4 في كل بيئة تدعي دعمه.
- التزامن بين عدة تبويبات أو مستخدمين؛ فالاستوديو محلي أساساً.
- مراقبة الأداء والذاكرة في جلسة مستخدم واقعية على جهاز محدود.

---

## 7. الفحص التقني

### 7.1 التقنيات الرئيسية

- React 19.
- TypeScript 5.9.
- Vite 7.
- Express 4.
- tRPC 11.
- Drizzle ORM وMySQL.
- Vitest.
- Tailwind CSS 4 وRadix UI.
- Mediabunny 1.61.4 لمعالجة الوسائط.
- Transformers.js 4.3.1 للنماذج المحلية.
- TensorFlow.js وFace Detection.
- fflate لإنشاء ZIP.
- IndexedDB وOPFS للتخزين المحلي.
- Web Workers لعزل التفريغ والترجمة.
- Dockerfile للبناء والتشغيل.

### 7.2 طريقة معالجة الفيديو والصوت

1. يختار المستخدم ملفاً محلياً.
2. Mediabunny يقرأ البيانات الوصفية وعينات الصوت.
3. يحوّل الصوت إلى mono ويعيد أخذ العينات عند الحاجة.
4. يقسم الصوت إلى نوافذ زمنية ويرسلها إلى Worker التفريغ.
5. Whisper يعيد النص وتوقيتات الكلمات.
6. خوارزميات TypeScript تقترح المقاطع وتبني الكابتشن.
7. Mediabunny يقرأ المقطع المختار من الملف الأصلي.
8. Canvas يرسم القص العمودي والكابتشن والعنوان والشعار.
9. `Conversion` يرمّز الفيديو والصوت ويكتب الناتج إلى StreamTarget أو BufferTarget.

### 7.3 هل المعالجة محلية بالكامل؟

**معالجة الفيديو والصوت والتفريغ والترجمة والتأطير داخل الاستوديو محلية في المتصفح حسب الكود والتوثيق.** لا يرسل الاستوديو bytes الفيديو أو الصوت أو إطارات الفيديو أو transcript إلى `/api` أو object storage.

توجد اتصالات خارجية غير متعلقة بإرسال وسائط الاستوديو:

- تنزيل ملفات النماذج العامة من Hugging Face عند طلب التفريغ أو الترجمة.
- تحميل Google Fonts عند تحميل الواجهة.
- نموذج الاستفسار في الصفحة الرئيسية يرسل بيانات الاسم والبريد والدور والرسالة إلى `/api/leads`، ويحفظها في قاعدة بيانات ويبلغ صاحب المشروع عبر خدمة Manus عند ضبطها.
- الخادم العام يحتوي تكاملات Manus/Forge وOAuth وstorage من القالب، لكنها ليست مسار رفع فيديو في الاستوديو.

### 7.4 النماذج والأحجام

- Whisper Tiny Q8: نحو 41MB لأوزان ONNX المذكورة في إشعار المشروع، قبل ملفات الإعداد والمعالجة.
- Whisper Base English: يستخدم للإنجليزية، والحجم الدقيق لا يثبته `package.json`؛ يتم تنزيله عند الاستخدام ولا يوجد في Git.
- OPUS-MT لكل لغة ترجمة: نحو 214.5–234.8 MiB تقريباً للزوج حسب إشعار المشروع، قبل ملفات الإعداد والمعالجة.
- MediaPipe Face Detection: النموذج المحلي صغير نسبياً، والتقرير يذكر نحو 277KB للنموذج الرسمي المختصر/الإعداد ذي الصلة.
- ONNX Runtime WASM الناتج في build الحالي: حوالي 26.9MB غير مضغوط، وحوالي 6.7MB gzip في build output.
- ملفات Workers الناتجة في build الحالي: حوالي 553KB لكل Worker قبل/مع ضغط gzip الموضح.
- Studio chunk في build الحالي: حوالي 756.84KB غير مضغوط، أو 194.41KB gzip.

الأوزان ليست مضمّنة داخل المستودع، وهذا يقلل حجم التسليم لكنه يجعل أول استخدام معتمداً على اتصال المستخدم بمضيف النماذج، وعلى توفر النموذج ورخصته وقت التسليم.

### 7.5 المتطلبات

للتطوير المحلي:

- Node.js متوافق مع Node 22 كما تشير وثائق التسليم.
- pnpm 10، والمشروع يعلن `pnpm@10.18.0`.
- متصفح حديث يدعم JavaScript وWeb Workers وCanvas وWebCodecs/MediaSource بحسب الوظيفة.
- قاعدة بيانات وإعدادات Manus/Forge فقط إذا أراد المشتري تشغيل كامل الموقع ونموذج الاستفسار؛ قلب الاستوديو المحلي لا يحتاج قاعدة بيانات لمعالجة الفيديو.

للتشغيل الإنتاجي للخادم:

- بناء Vite وخادم Express.
- `MANUS_PROJECT_ID`.
- `MANUS_JWT_SECRET`.
- `DATABASE_URL` لنموذج الاستفسارات/المستخدمين حسب المسارات.
- `MANUS_OAUTH_API_URL` عند استخدام OAuth.
- `MANUS_API_URL` و`MANUS_API_KEY` لتكاملات Forge/الإشعارات/التخزين في القالب.
- `PORT` اختياري، والافتراضي 3000.

### 7.6 المتصفحات والأجهزة

المشروع يملك fallbackات جيدة نسبياً، لكنه لا يقدم مصفوفة دعم رسمية مثبتة لكل جهاز. ما يمكن قوله بأمان:

- المتصفحات الحديثة على سطح المكتب هي البيئة الأكثر ملاءمة.
- File System Access أفضل للملفات الطويلة في المتصفحات التي تدعمه.
- WebAssembly/CPU مطلوب للتفريغ والترجمة حتى دون WebGPU.
- WebGL مفيد لتتبع الوجه، مع fallback يدوي عند تعذره.
- OPFS اختياري، وليس مضموناً في كل المتصفحات.
- الأجهزة محدودة الذاكرة قد تواجه بطئاً أو فشل تصدير عند غياب الحفظ المتدفق أو عند ملفات كبيرة.
- لا ينبغي تسويق دعم iOS/Android كدعم مضمون قبل اختبار أجهزة حقيقية.

---

## 8. الأداء والقيود المعروفة

1. **حجم الحزمة:** build الحالي يحذر من chunks أكبر من 500KB. Studio chunk نحو 756.84KB، وWASM نحو 26.9MB.
2. **زمن أول استخدام:** تنزيل نموذج Whisper أو نموذج ترجمة قد يكون ملحوظاً، خصوصاً على اتصال بطيء.
3. **الذاكرة:** BufferTarget وZIP قد يستهلكان ذاكرة كبيرة؛ التطبيق يضع حد ZIP يبلغ 64MB ويحذر المستخدم.
4. **جودة القص:** قص 9:16 من 16:9 يزيل معظم البكسلات الأفقية. إخراج 1080×1920 لا يعيد التفاصيل التي لم تعد موجودة.
5. **دقة Whisper:** النص الناتج يحتاج مراجعة بشرية، خصوصاً مع لهجات أو ضوضاء أو كلام سريع.
6. **تتبع الوجه:** لا يعمل دائماً مع الوجه الصغير أو المضغوط أو الإضاءة الضعيفة أو المشهد الاصطناعي، والقص اليدوي هو fallback المقصود.
7. **الترجمة:** لا توجد محاذاة word-level للترجمة؛ توقيت العبارات تقريبي.
8. **الاعتماد على CDN/model host:** أول تشغيل للنماذج يحتاج اتصالاً خارجياً، ولا يوجد ضمان offline كامل من المستودع وحده.
9. **التحذير البرمجي الحالي:** Vite يحذر من `<script src="/api/platform/config.js">` لأنه بلا `type="module"`. لا يمنع البناء، لكنه إصلاح مجاني مناسب قبل التسليم.
10. **تحذيرات pnpm:** ظهرت تحذيرات build scripts متجاهلة لـ `onnxruntime-node` و`protobufjs` أثناء التثبيت. لم تمنع الاختبارات أو البناء الحالي، لكن ينبغي للمشتري فهمها إذا احتاج runtime Node خارج المتصفح.

---

## 9. الحقوق والتراخيص والملكية

### 9.1 ترخيص التطبيق

`package.json` يعلن:

```text
"license": "MIT"
```

لكن لا يوجد ملف `LICENSE` مستقل ظاهر في المستودع، وGitHub لم يعرض `licenseInfo` مؤكداً. لذلك لا ينبغي للمشتري الاعتماد على الإعلان وحده؛ يجب قبل البيع إضافة/تسليم نص الترخيص المقصود وتحديد ما هو كود أصلي وما هو موروث من القالب.

### 9.2 التراخيص المذكورة للكود والمكونات

حسب `THIRD_PARTY_NOTICES.md`:

- Mediabunny 1.61.4: MPL-2.0.
- Transformers.js: Apache-2.0.
- TensorFlow.js وFace Detection: Apache-2.0.
- fflate: MIT.
- Whisper Base English وWhisper Tiny من Xenova: Apache-2.0 حسب بطاقات النماذج المذكورة.
- OPUS-MT English→French/Spanish/German: CC BY 4.0، ويجب الحفاظ على الإسناد والالتزام بشروط البطاقة.
- Google Fonts: شروط Google Fonts، والخطوط تُطلب من Google عند تحميل الواجهة.

هذه التراخيص لا تمنع بالضرورة بيع المشروع، لكنها تعني أن البائع لا يستطيع بيع ملكية حصرية لكل مكون خارجي. المشتري يشتري/يستلم حقوق الكود الأصلي وأي أصول يملكها البائع، مع استمرار حقوق والتزامات الجهات الخارجية.

### 9.3 هل يمكن بيع المشروع بالكامل؟

يمكن بيع المشروع كأصل برمجي أو نقل حقوق الكود الأصلي، **مع الاستثناءات التالية**:

- لا يمكن نقل ملكية مكتبات الطرف الثالث كأنها ملكية البائع.
- يجب إبقاء إشعارات MPL وApache وMIT وCC BY عند إعادة التوزيع.
- نماذج Hugging Face ليست داخل Git ويجب مراجعة بطاقاتها الحالية قبل إعادة توزيع الأوزان أو استضافتها ذاتياً.
- حساب Manus أو Forge أو OAuth أو قاعدة البيانات أو التخزين ليس ملكية تنتقل تلقائياً مع المستودع.
- أي شعار أو خط أو فيديو أو موسيقى أو ملفات اختبار خارجية لا يملك البائع حقوقها يجب استثناؤها أو استبدالها.
- لأن المستودع عام حالياً، فإن بيع “الحصرية” يحتاج ترتيباً قانونياً واضحاً: نقل حقوق الكود الأصلي لا يمحو تاريخ GitHub العام أو النسخة العامة الموجودة.

### 9.4 الأسرار والبيانات الحساسة

لم تظهر ملفات `.env` أو مفاتيح API متتبعة ضمن Git. `.gitignore` يستبعد ملفات البيئة. مع ذلك يجب قبل التسليم:

- تدوير أي أسرار كانت مستخدمة خارج Git أو في إعدادات المنصة.
- مراجعة Git history الكامل، وليس shallow clone فقط، باستخدام secret scanner.
- فصل حسابات Manus/Forge وقاعدة البيانات من حسابات البائع.
- عدم تسليم بيانات العملاء أو سجلات leads أو ملفات فيديو اختبارية ما لم توجد حقوق وموافقة.
- إزالة أي مفاتيح أو URLs خاصة من إعدادات النشر أو لقطات الشاشة أو أرشيف التسليم.

---

## 10. المخاطر التي تؤثر على قرار الشراء

| الخطر | الأثر | مستوى الخطر | المعالجة المقترحة |
|---|---|---|---|
| المستودع عام | يضعف الحصرية ويجعل “البيع الكامل” يحتاج صياغة قانونية | مرتفع | بيع حقوق الكود الأصلي مع الإفصاح عن الحالة العامة، أو تنفيذ ترتيب نقل/خصوصية قبل التسويق إن كان ذلك ممكناً |
| لا يوجد LICENSE مستقل | غموض في قابلية إعادة التوزيع | مرتفع | إضافة نص الترخيص المناسب وتحديد ملكية الكود الأصلي قبل التسليم |
| الاعتماد على Manus/Forge | صعوبة تشغيل النسخة خارج المنصة | مرتفع | تسليم runbook وفصل ما هو platform adapter عن قلب الاستوديو |
| نماذج خارجية كبيرة | أول استخدام بطيء ومتأثر بالاتصال والرخص الحالية | متوسط | توثيق الأحجام والروابط والتراخيص، وعدم الوعد بالتشغيل offline |
| تتبع الوجه غير مضمون | قد يضع القص في موضع غير مثالي | متوسط | عرض fallback اليدوي كجزء من التصميم، واختبار مواد المشتري الحقيقية |
| غياب E2E كامل | احتمال وجود أخطاء لا تكشفها اختبارات الوحدات | متوسط | إجراء جلسة قبول متصفح أمام المشتري وتسجيل النتائج |
| chunks وWASM كبيرة | بطء تحميل/ضغط ذاكرة | متوسط | code splitting وتأجيل تحميل الميزات الثقيلة |
| التخزين محلي | لا توجد مزامنة أو استعادة بين الأجهزة | متوسط | تسويق المنتج كأداة privacy-first محلية أو إضافة cloud لاحقاً كعمل مستقل |
| ملفات اختبار غير مرفقة | صعوبة إعادة إنتاج بعض نتائج الوسائط | متوسط | إعداد حزمة اختبار قانونية صغيرة أو جلسة تسليم مباشرة |
| صفحات القالب وخدماته | اعتماد جزء من الموقع على إعدادات خارجية | متوسط | فصل الاستوديو عن الموقع التسويقي في وثائق الصفقة |
| تراخيص OPUS-MT/MediaBunny | التزامات إشعار وإسناد عند التوزيع | متوسط | إبقاء `THIRD_PARTY_NOTICES.md` وتدقيق الترخيص وقت التسليم |

---

## 11. ما يلزم لإتمام البيع

### 11.1 ضروري قبل تسليم المشروع

هذه العناصر أهم من إضافة ميزات جديدة:

1. إعداد وثيقة ملكية توضّح ما هو الكود الأصلي، وما هو القالب أو المكتبات الخارجية، وما لا يدخل في الصفقة.
2. إضافة/تسليم ملف ترخيص واضح للتطبيق، أو اتفاق نقل حقوق بديل يوقّعه الطرفان.
3. إعداد `BUYER_HANDOFF.md` يتضمن المتطلبات، الأوامر، المتغيرات البيئية، حدود المنصة، وخطوات تشغيل الاستوديو.
4. إجراء secret scan على التاريخ الكامل قبل تسليم أرشيف Git.
5. تجهيز نسخة تسليم نظيفة دون `node_modules` و`dist` وملفات مؤقتة، مع `pnpm-lock.yaml`.
6. جلسة قبول أمام المشتري تشمل ملف فيديو قصير، التفريغ، اختيار مقطع، SRT، قص 9:16، تصدير، وفحص الناتج.
7. تحديد أن النماذج تُحمّل عند أول استخدام وأن ملفات الوسائط لا تغادر الجهاز في مسار الاستوديو.
8. توضيح أن نموذج الاستفسار والخادم يحتاجان إعدادات Manus/قاعدة بيانات، بينما قلب الاستوديو يمكن تشغيله محلياً.

### 11.2 تحسينات مجانية مهمة قبل العرض

- إصلاح تحذير `type="module"` في `client/index.html` إن ثبت أنه لا يكسر سلوك منصة القالب.
- إضافة ملف `LICENSE` أو مستند حقوق واضح.
- تحديث README ليصف الاستوديو فعلاً بدلاً من تركيزه على قالب WebDev.
- إضافة جدول Browser Support وحدود واضحة للأحجام والكودكات.
- إضافة تعليمات تشغيل static-only للاستوديو عند عدم الحاجة إلى قاعدة البيانات.
- توحيد التوثيق المتضارب حول أعداد الاختبارات القديمة، واعتماد النتيجة الحالية 90 اختباراً.
- إضافة script تدقيق بسيط يتحقق من عدم وجود أسرار أو ملفات اختبار كبيرة قبل التسليم.
- توثيق متغيرات الخادم المطلوبة وما هو اختياري منها.
- تأجيل تحميل Studio وWorkers وWASM عبر code splitting إن كان الإصلاح لا يغيّر السلوك.
- توضيح في صفحة البيع أن تتبع الوجه “مساعد تأطير اختياري” وليس ضماناً لتحديد المتحدث.
- إضافة ملف رخصة/إسناد مصمم للتوزيع يذكر Mediabunny وOPUS-MT والنماذج.

### 11.3 ما يمكن تركه للمشتري

- نظام حسابات ومزامنة سحابية.
- backend لمعالجة الوسائط أو queue.
- دعم لغات ترجمة إضافية.
- تحسين نماذج الذكاء الاصطناعي أو إضافة نماذج أقوى.
- تطبيقات iOS/Android.
- لوحة تحليلات أو إدارة عملاء.
- استضافة إنتاجية مخصصة.
- تحسينات متقدمة لتتبع الأشخاص والأجسام.
- نظام دفع واشتراكات، لأنه خارج نطاق صفقة بيع المصدر الحالية.

### 11.4 تقدير الوقت

هذه تقديرات عمل، وليست وعداً زمنياً:

| البند | التقدير |
|---|---:|
| إعداد README/Runbook وبيانات الملكية | 2–4 ساعات |
| إضافة/مراجعة LICENSE وإشعارات الطرف الثالث | 1–3 ساعات |
| secret scan وتنظيف حزمة التسليم | 1–2 ساعة |
| إعادة جلسة قبول متصفح وتوثيقها | 2–4 ساعات |
| إصلاح التحذير وتحسين وثائق الدعم | 1–3 ساعات |
| code splitting وتحسين الحزمة، اختياري | 4–8 ساعات |
| تجهيز نسخة تشغيل خارج Manus، إن طلب المشتري | 1–3 أيام أو أكثر حسب البديل |

الحد الأدنى العملي قبل عرض المشروع بجدية: **يوم عمل تقريباً** إذا لم نعد تصميم البنية، أو **2–4 أيام** لتجهيز حزمة بيع احترافية مع جلسة قبول ووثائق واضحة.

---

## 12. طريقة التشغيل أمام المشتري

### تشغيل وفحص الاستوديو محلياً

```bash
git clone https://github.com/mojtabahamed163-ai/frame-key-studio.git
cd frame-key-studio
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

ثم فتح:

```text
http://localhost:3000/studio
```

ينبغي استخدام فيديو قصير مرخّص أو مملوك للمشتري. في العرض:

1. اختيار الفيديو.
2. إظهار metadata.
3. تشغيل التفريغ أو استيراد SRT/VTT.
4. اختيار مقطع مقترح أو إضافة مقطع يدوي.
5. فتح شاشة التعديل.
6. تجربة Fill وShow Full Video.
7. تعديل الكابتشن والعنوان والشعار.
8. تجربة التصدير 720p أولاً.
9. فحص الملف الناتج بـ VLC أو `ffprobe`.
10. تجربة 1080p إذا كان الجهاز يسمح.

### تشغيل الموقع الكامل

يحتاج إلى متغيرات البيئة الخاصة بالمنصة وقاعدة البيانات وOAuth/Forge حسب الأجزاء التي يريدها المشتري. لا ينبغي تقديم تشغيل الصفحة الرئيسية والخادم على أنه مستقل تماماً دون إعداد Manus أو بديل له.

---

## 13. طريقة التسليم المقترحة

1. اتفاق بيع/نقل حقوق يحدد الكود الأصلي والمكونات المستثناة.
2. تسليم رابط مستودع أو أرشيف Git نظيف.
3. تسليم `pnpm-lock.yaml` وREADME وRunbook وThird-party notices.
4. تسليم قائمة المتغيرات البيئية دون قيم سرية.
5. تدوير الأسرار وربط الخدمات بحساب المشتري.
6. جلسة مشاركة شاشة لتشغيل الأوامر والوظائف.
7. تسليم قائمة known limitations ونتائج الاختبارات.
8. فترة دعم قصيرة اختيارية لنقل المعرفة، منفصلة عن ملكية المكتبات الخارجية.
9. عدم تسليم ملفات فيديو أو بيانات leads أو حسابات شخصية إلا إذا كانت مشمولة قانونياً ومصرحاً بها.

---

# Commercial Description — English

## Frame & Key Studio — Privacy-First Browser Video Editing for Real Estate and Short-Form Content

### Overview

Frame & Key Studio is a browser-based short-form video editing studio designed to turn landscape footage into polished vertical clips for Instagram Reels, TikTok, YouTube Shorts, and similar channels. The project is especially suitable for real estate agents, brokerages, marketing agencies, educators, consultants, and content teams that need a faster way to turn longer recordings into publishable short-form videos.

The core editing workflow runs locally in the user’s browser. Video and audio files, generated transcripts, captions, and rendered media are not uploaded to a media-processing backend. Open-weight speech and translation models are downloaded only when the user chooses to use those local features.

### Problem Solved

Traditional video workflows require desktop editing software, manual transcription, repetitive caption work, and time-consuming vertical reframing. Cloud-based AI editors can also create privacy, upload, and infrastructure-cost concerns. Frame & Key Studio addresses these issues with a guided workflow that helps users analyze a local recording, select useful sections, edit captions, apply branding, reframe the video for portrait output, and export the result from the browser.

### Implemented Product Capabilities

- Local video metadata and audio inspection using Mediabunny.
- In-browser Whisper transcription through a Web Worker.
- Word-level timing when returned by the local model.
- Rule-based clip and hook suggestions based on real transcript content, sentence boundaries, pauses, and timing signals.
- Manual clip creation and editable start/end points.
- SRT and VTT import and export.
- Caption editing, timing adjustment, style selection, and burned-in captions.
- Optional local translation from English to French, Spanish, or German.
- Portrait 9:16 framing with manual horizontal control.
- Full-video studio-background mode for preserving the complete landscape scene.
- Optional local face-assisted framing with a manual fallback.
- Title cards, logo placement, brand colors, fonts, and caption styles.
- Individual clip export and sequential multi-clip rendering.
- ZIP download for small batches within a browser memory budget.
- Local project/settings persistence using IndexedDB, with optional OPFS source-file persistence where supported.
- Browser-side processing designed to reduce server-side media costs and improve media privacy.

### Technology Stack

- React 19 and TypeScript.
- Vite 7.
- Express and tRPC for the application shell and inquiry flow.
- Drizzle ORM and MySQL for the server-side lead/inquiry components.
- Mediabunny for media inspection, decoding, canvas processing, and encoding.
- Hugging Face Transformers.js for local Whisper and OPUS-MT inference.
- TensorFlow.js and MediaPipe Face Detection for optional local face-assisted framing.
- Web Workers and WebAssembly for client-side model execution.
- IndexedDB and OPFS for local project persistence.
- Vitest for unit and regression testing.
- fflate for ZIP generation.

### Differentiators

- Privacy-first local media workflow: the studio does not require uploading the user’s source video for editing.
- No paid inference API is required for the core studio workflow.
- Transparent, editable suggestions rather than an opaque “viral score.”
- A practical manual fallback when automatic face framing is not reliable.
- Real export pipeline with captions, branding, audio, portrait framing, and browser download handling.
- Suitable foundation for a standalone desktop-like browser tool, an internal agency workflow, a white-label editing utility, or a future hosted product.
- Open-source and documented third-party dependencies with model attribution already collected in the repository.

### Potential Buyers and Commercial Use Cases

Potential buyers include:

- Real estate technology companies.
- Real estate brokerages and franchise networks.
- Marketing and social-media agencies.
- Video production studios.
- Creator economy tools and content platforms.
- Education and training companies.
- SaaS companies looking for a privacy-focused browser editing component.
- Agencies seeking a branded internal tool for converting property tours and client recordings into vertical content.

Commercial use cases include:

- Turning property tours into social-ready vertical clips.
- Producing short clips from agent interviews and market updates.
- Creating captioned educational snippets from webinars and lectures.
- Preparing branded social content for agencies and brokerages.
- Building a white-label browser editor into an existing marketing platform.
- Providing a local-first editing workflow for clients that cannot upload sensitive footage.

### Current Validation

The repository currently passes TypeScript checking, a production build, and 90 automated tests across 13 test files. Repository validation reports also document real-browser media checks involving portrait framing, full-video studio-background output, caption rendering, local transcription, 720p and 1080p exports, audio preservation, and independent media inspection. These reports should be treated as repository-documented validation; buyers should repeat the acceptance workflow with their own browser and media samples.

### Known Limitations and Transparent Disclosure

- The repository does not include a production hosting environment or a ready-to-use public deployment.
- The studio’s local project storage does not synchronize projects between devices.
- Face-assisted framing is optional and not guaranteed for small, compressed, low-light, or unusual faces; manual framing remains available.
- Whisper output requires human review, particularly for noisy audio, accents, fast speech, or difficult recordings.
- Local translation is currently limited to English-to-French, English-to-Spanish, and English-to-German, with approximate phrase-level timing.
- Translation models can require approximately 215–235 MiB per selected language before additional runtime files and can be slow on modest devices.
- Browser memory and codec support vary. Direct-to-file saving is preferred for larger exports where supported.
- 1080×1920 output does not restore detail lost when a 16:9 source is cropped into a 9:16 region.
- The complete website shell includes Manus/Forge/OAuth/database integrations that require buyer-owned environment configuration.
- The project package declares MIT, but the repository should include a clear standalone license/ownership document before a formal transfer.
- Third-party libraries and model licenses remain applicable and are not transferred as exclusive seller-owned assets.
- No payment or subscription system is included; this is intentional for a source-code/asset sale and is not represented as a completed SaaS billing product.

### Suggested Acquisition Positioning

Frame & Key Studio is best positioned as a working browser-based editing foundation and privacy-first local media product rather than as a fully operated SaaS business. The buyer receives a substantial, tested codebase with a functional local editing workflow and a clear path toward a standalone product, white-label tool, or vertical-specific media application. The buyer should budget for deployment separation, ownership/licensing documentation, browser acceptance testing, and any desired cloud synchronization or hosted processing layer.

---

## 14. قائمة الإصلاحات التي يمكن تنفيذها دون تكلفة مالية

هذه العناصر لا تتطلب شراء API أو اشتراكاً أو خدمة مدفوعة، ويمكن تنفيذها داخل المستودع:

1. إضافة `LICENSE` واضح أو وثيقة حقوق ونقل ملكية.
2. تحديث `README.md` ليشمل وصف المنتج، أوامر التشغيل، حدود المتصفحات، أحجام النماذج، ومسار العرض أمام المشتري.
3. إضافة `BUYER_HANDOFF.md` يشرح التشغيل دون الحاجة إلى معرفة Manus مسبقاً.
4. إصلاح تحذير `type="module"` في `client/index.html` إذا لم يتعارض مع منصة التشغيل.
5. إضافة جدول دعم للمتصفحات والميزات: التفريغ، الترجمة، OPFS، File System Access، WebCodecs.
6. إضافة فحص يمنع تشغيل build تسليمي إذا كانت متغيرات أو مفاتيح حساسة متتبعة.
7. إضافة `pnpm test:all` أو أمر موحد يشغّل check/test/build ويطبع ملخصاً واضحاً.
8. توحيد التقارير القديمة التي تذكر 29 أو 30 أو 32 اختباراً مع النتيجة الحالية 90 اختباراً.
9. إضافة اختبارات للحدود التي يطلبها المشتري غالباً: امتدادات ملفات غير مدعومة، ملف بلا صوت، ملف كبير، تعذر تحميل النموذج، إلغاء التصدير، وفشل File System Access.
10. تحسين code splitting بحيث لا يُحمّل Studio وWorkers وWASM قبل دخول المستخدم إلى الاستوديو.
11. إضافة رسائل UI أوضح لمرحلة “preparing/initializing” قبل ظهور تقدم التصدير.
12. إضافة معلومات إصدار/commit داخل شاشة الدعم لسهولة تسليم النسخة.
13. إضافة صفحة أو قسم “Known limitations” داخل المشروع يذكر صراحة حدود تتبع الوجه والـ1080p والذاكرة.
14. فصل إعدادات الموقع التسويقي/نموذج الاستفسار عن Core Studio في وثائق وبنية أوضح دون تغيير الوظائف.
15. إضافة فحص ترخيص بسيط أو قائمة dependency attribution مرتبطة بـ`THIRD_PARTY_NOTICES.md`.
16. استبدال أي أصول عرض أو صور خارجية غير مملوكة بأصول عامة مرخصة أو placeholders واضحة قبل البيع.
17. إعداد ملفات اختبار اصطناعية صغيرة قابلة لإعادة التوزيع، أو توثيق طريقة إنشائها محلياً بدلاً من تسليم ملفات خارجية غير واضحة الحقوق.
18. إضافة smoke test موثق على Chrome/Chromium مع ملف قصير قانوني، من دون شراء أي خدمة.
19. مراجعة إعدادات CORS/cookies/CSRF في جزء نموذج الاستفسار إذا كان سيُشغّل خارج منصة Manus.
20. إجراء `git diff --check` و`pnpm check` و`pnpm test` و`pnpm build` قبل إنشاء أرشيف التسليم.

### ما لا يمكن إصلاحه مجاناً بمجرد تعديل الكود

- تكلفة أو إعداد استضافة إنتاجية.
- مزود قاعدة بيانات أو تخزين سحابي.
- تشغيل نماذج أكبر على GPU.
- شراء تراخيص لأصول تجارية غير مملوكة.
- نقل ملكية حسابات Manus/Forge أو خدمات خارجية.
- ضمان أداء موحد على كل أجهزة الهاتف.

---

## 15. القرار النهائي

**نعم، المشروع قابل للعرض للبيع كملكية كود/أصل تقني، وليس كمنتج SaaS مكتمل التشغيل.** لديه قيمة حقيقية لأن قلب الاستوديو يعمل محلياً، والاختبارات الحالية خضراء، وتوجد أدلة سابقة على تصدير وسائط حقيقية. لكن يجب تسويقه بصدق على أنه:

> Working, tested, privacy-first browser video editing foundation for vertical short-form content — not a fully hosted production SaaS business.

قبل الإعلان، الأولوية ليست إضافة الدفع أو الاشتراكات. الأولوية هي توثيق الملكية، إضافة الترخيص الواضح، تجهيز Runbook، تنظيف حزمة التسليم، تكرار جلسة قبول متصفح، والإفصاح عن اعتماد الموقع الكامل على إعدادات Manus/Forge وعن حدود النماذج والأجهزة. هذه الخطوات مجانية أو شبه مجانية، وسترفع ثقة المشترين أكثر من إضافة ميزة جديدة غير مختبرة.

---


# 2. README الحالي للمشروع

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/README.md`  
> **الوصف:** وثيقة المنتج والتشغيل الحالية.

Frame & Key Studio is a browser-based short-form video editing studio focused on turning landscape recordings into vertical clips for real-estate marketing, social content, education, and creator workflows.

The Studio workflow runs locally in the user's browser. It reads the selected local video, extracts audio samples, runs optional speech transcription and translation in Web Workers, creates editable clip suggestions and captions, reframes the selected section into a portrait canvas, burns optional captions/title/logo overlays, and exports a local media file. The Studio does not upload video/audio bytes, video frames, generated captions, or transcripts to the application API or object storage.

The repository also contains an Express/tRPC application shell and a public inquiry form. That server-side shell is separate from the local media path and requires external platform configuration when the complete website is run.

## What is implemented

The code and current tests cover local video metadata inspection; audio extraction, downmixing, resampling, cancellation, and bounded analysis windows; browser-side Whisper transcription in a Web Worker; transcript-based clip and hook suggestions; manual clip boundaries; caption editing; SRT/VTT import/export; caption styles; title/logo/brand controls; local English-to-French/Spanish/German translation; portrait 9:16 framing; full-video/studio-background mode; optional face-assisted framing with manual fallback; browser-side export; sequential multi-clip rendering; ZIP creation for small batches; and IndexedDB/optional OPFS project persistence.

The current repository checks are green: `pnpm check`, `pnpm test -- --run` (90 tests in 13 files), and `pnpm build` pass in the reviewed environment. See `docs/test-results-2026-11-03.md` for the exact run and scope.

## Partial capabilities and known limits

Whisper output requires human review. Clip suggestions are rule-based transcript analysis, not a guaranteed engagement prediction. Face-assisted framing tracks visible faces but does not identify the speaker; small, compressed, dark, occluded, synthetic, or unusual faces may fall back to manual framing. Translation currently supports English source text to French, Spanish, or German and uses approximate phrase-level timing. 1080x1920 is an output canvas and cannot restore detail lost by a 16:9-to-9:16 crop. Long exports are safest in browsers with direct-to-file saving; without it, memory-limited fallbacks and a 64 MiB ZIP safety budget apply. Projects are local to the browser and are not synchronized between devices. The repository has no production URL and intentionally contains no payment or subscription system; it is being prepared as a source-code/product asset transfer, not as a completed billing SaaS.

## Technology stack

The project uses React 19, TypeScript 5.9, Vite 7, Express 4, tRPC 11, Drizzle ORM/MySQL, Mediabunny 1.61.4, Transformers.js 4.3.1, TensorFlow.js/Face Detection, Web Workers, WebAssembly, IndexedDB, optional OPFS, Vitest, and fflate.

## Models and first-use downloads

Model weights are not committed to Git. They are fetched from public model repositories only when the relevant feature is used and may be cached by the browser.

| Feature | Model | Scope | Approximate size / note |
|---|---|---|---|
| English transcription | `Xenova/whisper-base.en` | English source speech | Not bundled; download varies by model files/runtime |
| Other-language transcription | `Xenova/whisper-tiny` | Multilingual transcription | Repository notice estimates about 41 MB for selected q8 ONNX weights before auxiliary files |
| Translation | `onnx-community/opus-mt-en-fr`, `en-es`, `en-de` | English to French/Spanish/German | About 214.5–234.8 MiB per selected language before auxiliary/runtime files |
| Face-assisted framing | MediaPipe through TensorFlow.js | Optional local visible-face tracking | Local inference with manual fallback |

Translation uses CPU/WebAssembly and does not require WebGPU. First use may be slow and requires access to the public model host.

## Installation and development

Requirements are a Node.js 22-compatible runtime, pnpm 10, and a modern browser. The local Studio media path does not require a database.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
pnpm dev
```

Open `http://localhost:3000/studio`. Static scripts are available with `pnpm build:static` and `pnpm dev:static`. The complete server shell can be started with `pnpm start` after the required environment configuration; see `BUYER_HANDOFF.md`.

## Testing

```bash
pnpm check
pnpm test -- --run
pnpm build
git diff --check
```

The current canonical automated result is 13 passing test files and 90 passing tests. These are unit/regression and server-route tests, not a substitute for browser media acceptance. Use `docs/manual-acceptance-checklist.md` for the buyer procedure. Historical browser/media reports remain in `docs/` with their original dates.

## External services and privacy boundary

The Studio media path is local. The application shell still has external boundaries: `/api/leads` stores inquiry fields in the configured database and may notify the owner through Manus; OAuth uses the configured Manus OAuth service; inherited platform helpers can use Manus/Forge APIs for platform features; and Google Fonts are requested by the stylesheet. No secret values are committed. Runtime values are read from environment variables and are intended to remain server-side.

## Browser and media limitations

Historical repository reports document Chromium/Sandbox media checks. The current review did not independently test Chrome, Edge, Firefox, or Safari sessions, so the acceptance checklist marks untested combinations as `Needs testing`. Codec support, WebCodecs, File System Access, WebAssembly performance, WebGL, OPFS, and memory vary by browser/device. Use 720p and individual exports first on constrained hardware.

## Third-party notices and transfer boundary

`THIRD_PARTY_NOTICES.md` lists the main libraries and models, including Mediabunny MPL-2.0, Transformers.js/TensorFlow.js/face detection Apache-2.0, fflate MIT, Whisper notices, and OPUS-MT CC BY 4.0 attribution. Keep those notices with redistributed builds and re-check upstream terms before redistributing model weights.

The package declares MIT in `package.json`, but the repository does not currently include a standalone `LICENSE` file. This is an ownership/transfer item and was not silently changed. A buyer receives transferable rights in original project code, not exclusive ownership of third-party libraries, model weights, platform accounts, or external services.

See `BUYER_HANDOFF.md` for the transfer runbook and `docs/test-results-2026-11-03.md` for the current verification record.

---


# 3. دليل تسليم المشتري

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/BUYER_HANDOFF.md`  
> **الوصف:** دليل بنية المشروع والتشغيل ومتطلبات التسليم.

This document describes how to inspect, run, validate, and transfer the repository without assuming access to the seller's platform accounts.

## 1. Product boundary

The Core Studio is the browser-local media editor under `client/src/features/studio/` and `client/src/pages/Studio.tsx`. It reads a local video, optionally transcribes or translates it in browser workers, creates editable clip/caption data, reframes it, and exports locally.

The application shell is the inherited React/Vite + Express/tRPC + Drizzle/MySQL layer. It serves the website, OAuth hooks, health/config routes, and the public inquiry form. It is not the media-processing backend.

The Studio intentionally does not upload video/audio bytes, frames, transcripts, or generated captions to the application API or storage. The first use of local models does make public model-file requests to the model host.

## 2. Important directories

| Path | Purpose |
|---|---|
| `client/src/pages/Studio.tsx` | Studio workflow, state, controls, local persistence calls, translation/tracking/export orchestration |
| `client/src/features/studio/analysis/` | Clip analysis, timing, caption generation, subtitle parsing, transcript-derived post copy |
| `client/src/features/studio/media/` | Mediabunny input/audio inspection, local transcription orchestration, face tracking, framing geometry |
| `client/src/features/studio/workers/` | Whisper and OPUS-MT Web Workers |
| `client/src/features/studio/models/` | Translation worker bridge |
| `client/src/features/studio/export/` | Mediabunny conversion, file saving, ZIP/download helpers |
| `client/src/features/studio/storage/` | IndexedDB and optional OPFS project/source persistence |
| `client/src/features/studio/components/` | Preview, captions, branding, and Studio UI components |
| `server/_core/` | Express startup, platform helpers, OAuth, config, storage, notifications, and inherited integrations |
| `server/leads.ts` | Public inquiry validation, rate limiting, database save, and owner notification |
| `drizzle/` | MySQL/Drizzle schema and checked-in migrations |
| `docs/` | Historical validation reports and the buyer acceptance checklist |
| `THIRD_PARTY_NOTICES.md` | Main third-party library/model attribution and license notes |
| `package.json` | Scripts, runtime dependencies, and package metadata |
| `Dockerfile` | Production build/container instructions for the application shell |

## 3. Local Core Studio run

Requirements: Node.js 22-compatible runtime, pnpm 10, and a modern browser.

```bash
git clone <buyer-repository-url>
cd frame-key-studio
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
pnpm dev
```

Open `http://localhost:3000/studio`. The local media workflow does not need `DATABASE_URL` if only the Studio is being inspected, but the application shell may still expose configuration-dependent routes.

For a static client build:

```bash
pnpm build:static
pnpm dev:static
```

Use a buyer-owned or synthetic video. Do not use private client media in a shared demonstration.

## 4. Full server shell

The production script builds the Vite client and bundles the Express entry point:

```bash
pnpm build
pnpm start
```

The server exposes `/api/health`, `/api/platform/config.js`, `/api/leads`, OAuth callbacks, and tRPC routes. Server-side features require the relevant runtime configuration. Values are read at runtime; do not place secrets in source files or documentation.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `PORT` | Server listen port | Optional; defaults to `3000` |
| `NODE_ENV` | Development/production selection | Use `development` for Vite middleware and `production` for built static files |
| `MANUS_PROJECT_ID` | Platform SDK/project binding | Buyer must create/use a buyer-owned project |
| `MANUS_JWT_SECRET` | Signed/session operations | Keep server-side; rotate on transfer |
| `DATABASE_URL` | Drizzle database and lead persistence | Required for database-backed routes/migrations |
| `MANUS_OAUTH_API_URL` | Manus OAuth | Required only when OAuth login is used |
| `MANUS_API_URL` | Forge/platform API, notification/storage helpers | Required by corresponding platform helpers |
| `MANUS_API_KEY` | Forge/platform authorization | Server-only secret; never expose to the browser |
| `OWNER_OPEN_ID` | Optional legacy owner hint | Not required for the local Studio path |

Do not run `pnpm db:migrate` or `pnpm db:push` against a buyer's production database until the buyer has reviewed the migrations and created backups.

## 5. What requires external services

The following are external/configuration-dependent:

- Manus OAuth callback and session integration.
- Manus/Forge platform helpers used by inherited template features.
- MySQL database for server-side users/leads and migrations.
- Manus notification service for owner inquiry notifications.
- Public model hosting for first-use Whisper and OPUS-MT downloads.
- Google Fonts requested by the stylesheet.

The following are local in the Core Studio:

- Video metadata and audio sampling.
- Whisper transcription after model download.
- Transcript-based clip suggestions.
- Caption editing and SRT/VTT parsing/export.
- OPUS-MT translation after model download.
- Face-assisted framing.
- Canvas overlays and browser media conversion.
- IndexedDB/OPFS project/source persistence.

## 6. Buyer acceptance procedure

Use `docs/manual-acceptance-checklist.md`. The short form is:

1. Open `/studio`.
2. Select a legal local video with audio.
3. Confirm metadata and audio status.
4. Run English transcription and wait for the model to load.
5. Review the transcript and suggested clips.
6. Edit one clip boundary and one caption cue.
7. Try Fill portrait and Full video/studio background.
8. Optionally translate an English caption set to one supported language.
9. Export a short 720p clip first.
10. Inspect the file in a media player or with `ffprobe`.
11. Test one cancellation/error path.
12. Repeat at 1080p or with a larger file only on a device with sufficient memory.

The acceptance checklist distinguishes automated tests from browser/manual results. Do not mark a browser or device as supported unless it has actually been tested.

## 7. Models and download expectations

- English transcription uses `Xenova/whisper-base.en`.
- Other-language transcription uses `Xenova/whisper-tiny`; the repository notice estimates approximately 41 MB for the selected q8 ONNX weights before auxiliary files.
- Translation uses `onnx-community/opus-mt-en-fr`, `en-es`, or `en-de`; the repository notice estimates approximately 214.5–234.8 MiB per selected language before auxiliary/runtime files.
- Face tracking uses TensorFlow.js/MediaPipe locally.

Models are not committed to Git and are downloaded on demand. Offline first use is not guaranteed. Keep `THIRD_PARTY_NOTICES.md` with any distributed build and review the current upstream model cards before redistributing weights.

## 8. Known issues and limitations

- Face tracking is optional and can fail for small, compressed, dark, occluded, synthetic, or unusual faces. Manual framing is the safe fallback.
- Whisper output requires human review.
- Translation is currently English-source only for French, Spanish, and German, with phrase-level timing.
- Browser codec, WebCodecs, File System Access, OPFS, WebGL, WASM speed, and memory vary.
- Long exports without direct-to-file saving may be memory constrained.
- ZIP batches are bounded by a 64 MiB in-browser safety limit.
- Project/source persistence is local to the browser and does not synchronize between devices.
- 1080x1920 cannot restore detail lost by a 16:9-to-9:16 crop.
- The current build still reports a non-blocking Vite warning for `/api/platform/config.js` and large-chunk advisory warnings.
- There is no production deployment or payment/subscription system in this repository.
- The package declares MIT, but a standalone `LICENSE` file is not currently included. Do not change that status without reviewing ownership and third-party terms.

## 9. Transfer preparation

Before delivery, the buyer and seller should agree in writing on:

- Which original code and assets are included.
- Which platform accounts, databases, domains, and external services are excluded or transferred.
- The continuing obligations for MPL-2.0, Apache-2.0, MIT, CC BY 4.0, Google Fonts, and model cards.
- Whether the public GitHub history/repository is part of the transaction; a public repository cannot be made exclusive merely by handing over a clone.
- Who owns any logos, fonts, stock footage, music, screenshots, or external test media.

A clean delivery should include source, lockfile, tests, Dockerfile, migrations, README, this handoff, the acceptance checklist, historical reports, and third-party notices. Exclude `node_modules/`, `dist/`, logs, local `.env` files, personal data, lead records, and media without clear redistribution rights.

Before transfer, run a full-history secret scan, rotate any external credentials, create buyer-owned service credentials, and verify that no buyer handoff document contains secret values.

## 10. Recommended buyer follow-up work

The buyer may later choose to add cloud synchronization, a hosted media queue, more languages, broader browser/device acceptance, code splitting, or a separate deployment adapter. None of those are required to run the local Studio demo, and none is represented as complete in this handoff.

---


# 4. نتائج الاختبارات الحالية — 2026-11-03

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/docs/test-results-2026-11-03.md`  
> **الوصف:** نتائج تم تشغيلها فعلياً على النسخة الحالية.

This record captures the checks actually executed against the reviewed `main` checkout at commit `efb00be5622ccb3517f964f17999c424f6dc9616`.

## Environment

- Node.js: `v22.23.4`
- npm: `10.9.9`
- pnpm: `11.25.0` available in the review environment
- Git: `2.43.0`
- Installation: `pnpm install --frozen-lockfile`
- Working tree before checks: clean
- Working tree after checks: no tracked changes caused by installation/build; ignored dependency/build directories were not part of the delivery

## Results

| Command | Result | Evidence |
|---|---|---|
| `pnpm install --frozen-lockfile` | Passed | Lockfile resolved; dependencies installed |
| `pnpm check` | Passed | TypeScript completed with exit code 0 |
| `pnpm test -- --run` | Passed | **13 test files passed; 90 tests passed; 0 failed** |
| `pnpm build` | Passed | Vite and esbuild completed with exit code 0 |
| `git diff --check` | Not run in this verification command | Run before delivery after any future edits |

## Non-blocking observations

- Vite reports that `/api/platform/config.js` is referenced without a `type="module"` attribute.
- Vite reports advisory warnings for chunks above 500 kB after minification.
- The generated ONNX Runtime WASM asset is approximately 26.9 MB before gzip in this build output.
- The test suite prints expected platform-configuration warnings because real Manus OAuth environment variables are not configured in the isolated review environment. The related tests still pass.
- pnpm reports ignored build scripts for `onnxruntime-node` and `protobufjs`; this did not prevent the current type check, tests, or build.

## Secret-history check

The repository history was fetched in full before scanning. The checkout contains 44 reachable commits and no tags/extra branches from the remote. No tracked environment/credential/private-key filenames were found. No high-confidence AWS/GitHub/OpenAI/Slack/private-key/database-URL patterns were found in the full reachable history. Runtime secret names such as `MANUS_API_KEY`, `MANUS_JWT_SECRET`, and `DATABASE_URL` appear only as environment-variable references or test placeholders; no live values were found.

This is a pattern-based review, not a guarantee against every possible secret format. Rotate any real credentials that may have existed outside Git or in platform settings before transfer.

## Historical results

Older reports in `docs/` contain valid historical acceptance records with earlier test counts such as 32. Those counts describe the repository state and scope at their original dates; they are not replaced or retroactively rewritten. The current canonical automated result for this checkout is 90 passing tests in 13 files.

Historical browser/media reports are also not equivalent to a fresh test on every buyer browser/device. Use `docs/manual-acceptance-checklist.md` for a repeatable acceptance run.

---


# 5. قائمة القبول اليدوي

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/docs/manual-acceptance-checklist.md`  
> **الوصف:** إجراءات يستطيع المشتري تنفيذها للتحقق من الوظائف.

**Purpose:** repeatable buyer-facing browser check.  
**Rule:** mark `Passed` only after performing the step. Mark `Needs testing` when the browser/device was not actually tested. Do not infer browser support from code alone.

## Test record

- Date:
- Tester:
- Browser and version:
- Operating system/device:
- Project commit:
- Source file name and rights:
- Source duration / resolution / codec / size:
- Available memory (if known):

## A. Open and load the Studio

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test -- --run`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm dev`.
- [ ] Open `http://localhost:3000/studio`.
- [ ] Confirm the Studio shell renders without a fatal error.
- [ ] Record any browser console error separately from non-blocking warnings.

**Expected:** the Studio opens. A successful build or unit test does not by itself prove browser media acceptance.

## B. Upload and inspect a video

- [ ] Choose a legal local video with a known duration and resolution.
- [ ] Confirm the UI displays dimensions, duration, file size, and audio status.
- [ ] Confirm the source video is previewable.
- [ ] Repeat once with a no-audio video if available.
- [ ] Confirm the no-audio message allows manual clip selection.

**Expected:** metadata is read locally. No media upload request should be required by the Studio path.

## C. Whisper transcription

- [ ] Select English as the source language.
- [ ] Start transcription.
- [ ] Record model download progress and time to first result.
- [ ] Confirm timed words/captions appear.
- [ ] Confirm the transcript can be reviewed and edited.
- [ ] Cancel a second analysis while it is running, if practical.
- [ ] Repeat with a non-English sample only if the language is supported by the selected Whisper model.

**Expected:** the local worker returns text or a clear error. Transcript accuracy must be reviewed by a human; do not treat a result as ground truth.

## D. Clip suggestions and editing

- [ ] Confirm one or more suggestions appear when the transcript contains enough speech.
- [ ] Review the rationale/warnings for each suggestion.
- [ ] Select a suggestion.
- [ ] Change its start time and end time.
- [ ] Add a manual clip.
- [ ] Preview the selected clip.

**Expected:** all boundaries remain within the source duration and remain editable.

## E. Captions and post copy

- [ ] Edit one caption text line.
- [ ] Edit one caption start/end time.
- [ ] Switch between block and word timing if available.
- [ ] Try each relevant caption style.
- [ ] Import a small valid SRT file.
- [ ] Import a small valid VTT file.
- [ ] Export SRT.
- [ ] Export VTT.
- [ ] If the import is malformed, confirm a controlled error appears.
- [ ] Review title, description, hashtags, and call-to-action copy before using it.

**Expected:** imported/translated captions remain editable and translated timing is treated as approximate.

## F. Portrait framing

- [ ] Try Fill portrait frame.
- [ ] Move the manual horizontal framing control.
- [ ] Try Show full video/studio background.
- [ ] Confirm the preview is not stretched.
- [ ] Run optional face-assisted framing.
- [ ] If face tracking fails, confirm the UI reports the limitation and manual framing remains available.
- [ ] Inspect the crop at the beginning, middle, and end of a moving-subject clip.

**Expected:** the crop stays inside the source frame. Face tracking is an optional helper, not speaker identity recognition.

## G. Optional translation

- [ ] Use English source captions.
- [ ] Select French, Spanish, or German.
- [ ] Start translation.
- [ ] Record first-use model download size/time if visible.
- [ ] Review the translated lines for meaning.
- [ ] Confirm the UI warns that timing is phrase-level/approximate.
- [ ] Cancel translation if the browser/device permits a safe cancellation check.

**Expected:** translation runs locally after the selected model is available. Other target languages are not implied to work.

## H. Export and output inspection

- [ ] Select 720p output first.
- [ ] Export one short clip.
- [ ] Confirm the progress state changes beyond preparation and reaches Ready or a clear error.
- [ ] Download/save the output.
- [ ] Open the output in a media player.
- [ ] Inspect with `ffprobe` if available:

```bash
ffprobe -hide_banner -show_format -show_streams output.webm
```

- [ ] Confirm video dimensions, duration, codec, and audio presence match the selected workflow.
- [ ] Confirm captions/title/logo are visible if enabled.
- [ ] Try 1080p only when the device has sufficient memory.
- [ ] Select more than one clip and test sequential rendering.
- [ ] Test ZIP creation only when the estimated size is below the in-browser safety limit.

**Expected:** the output is non-empty and playable/inspectable. MP4 is conditional on browser codec support; WebM is the normal fallback.

## I. Cancellation and error recovery

- [ ] Cancel transcription during model load or analysis.
- [ ] Cancel translation during model load or line processing.
- [ ] Cancel export during rendering if practical.
- [ ] Try a missing/unsupported media source.
- [ ] Try a browser/device where direct file saving is unavailable.
- [ ] Confirm the UI gives an actionable error rather than silently reporting success.
- [ ] Reload the page and verify the saved project/settings behavior.
- [ ] If OPFS is used, remove or make the source unavailable and confirm recovery asks for the source again.

## J. Browser compatibility evidence matrix

Only change `Needs testing` to `Passed` after running the corresponding workflow. This repository's automated Node/Vitest run is not browser compatibility evidence.

| Feature | Chrome/Chromium | Edge | Firefox | Safari/macOS/iOS | Evidence required |
|---|---|---|---|---|---|
| Open Studio UI | Passed only if tested | Needs testing | Needs testing | Needs testing | Browser/version and date |
| Local metadata/audio inspection | Passed only if tested | Needs testing | Needs testing | Needs testing | Video + visible metadata |
| Whisper Worker transcription | Passed only if tested | Needs testing | Needs testing | Needs testing | Timed transcript and model result |
| SRT/VTT import/export | Passed only if tested | Needs testing | Needs testing | Needs testing | Imported and downloaded files |
| Fill portrait preview | Passed only if tested | Needs testing | Needs testing | Needs testing | Visible crop check |
| Full-video/studio-background preview | Passed only if tested | Needs testing | Needs testing | Needs testing | Visible non-stretched preview |
| Face-assisted framing | Passed only if tested | Needs testing | Needs testing | Needs testing | Detection or explicit fallback |
| Local translation | Passed only if tested | Needs testing | Needs testing | Needs testing | Selected model and translated output |
| 720p export | Passed only if tested | Needs testing | Needs testing | Needs testing | Playable output + ffprobe |
| 1080p export | Passed only if tested | Needs testing | Needs testing | Needs testing | Playable output + ffprobe |
| Direct-to-file saving | Passed only if tested | Needs testing | Needs testing | Needs testing | Chosen file exists |
| IndexedDB project persistence | Passed only if tested | Needs testing | Needs testing | Needs testing | Reload/reopen behavior |
| OPFS source persistence | Passed only if tested | Needs testing | Needs testing | Needs testing | Source survives browser restart |

## Current repository evidence

As of the current code review, automated checks pass with 13 test files and 90 tests. Historical repository reports document successful Chromium/Sandbox media scenarios, including local transcription, portrait framing, exports, audio, and ZIP behavior. Those reports retain their original dates and should not be read as fresh evidence for a browser/device that has not been tested in the current acceptance run.

---


# 6. قائمة حزمة التسليم

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/docs/delivery-manifest.md`  
> **الوصف:** الملفات التي تدخل أو تستبعد من حزمة التسليم.

This manifest defines what should be included in a clean buyer delivery. It is documentation only; it does not create an archive or change repository ownership.

## Include

### Source and build

- `client/`
- `server/`
- `shared/`
- `drizzle/`
- `patches/`
- `public`/asset files at the repository root and under `client/public/`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`
- `drizzle.config.ts`
- `Dockerfile`
- `.dockerignore`
- `app.config.ts`
- `template.json`
- `components.json`
- `.manus-starter-init.json`

### Documentation and legal notices

- `README.md`
- `BUYER_HANDOFF.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/test-results-2026-11-03.md`
- `docs/manual-acceptance-checklist.md`
- `docs/delivery-manifest.md`
- Relevant historical reports under `docs/`
- `PROJECT_TRANSFER_AR.md` and `HANDOFF.md` when the buyer needs historical platform context
- `TODO.md`, `plan.md`, and relevant design/validation notes when the buyer wants project history

### Verification assets

- All `*.test.ts` and `*.test.tsx` files.
- Checked-in SQL migrations and Drizzle metadata.
- Any test fixture included in Git only when its redistribution rights are clear.

## Exclude from a clean delivery

- `node_modules/`
- `dist/`, `build/`, coverage directories, caches, and package-manager stores
- `.env`, `.env.*`, local secret/config files, credentials, tokens, private keys, and local database files
- Logs, shell history, editor metadata, OS files, and temporary files
- Personal lead records, platform account data, cookies, browser profiles, and user uploads
- Videos, audio, stock media, music, logos, screenshots, or fonts without clear redistribution rights
- Local model caches and downloaded model weights unless the buyer has reviewed the current model terms and explicitly wants them included
- Any files generated outside Git that are referenced only by historical reports unless they are legally redistributable and intentionally added to the handoff

## Pre-delivery checks

Run from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
git diff --check
git status --short
```

Then perform a full-history secret scan. Rotate any credentials that may have existed in platform settings or outside Git. Create buyer-owned Manus/Forge/database credentials rather than handing over personal credentials.

## Ownership boundary

The delivery can transfer the seller's rights in original project code according to the signed agreement. It does not transfer exclusive ownership of third-party packages, model weights, public model hosts, Manus/Forge services, domains, accounts, or media assets unless the agreement explicitly and legally covers those items. Keep `THIRD_PARTY_NOTICES.md` with every redistributed build.

---


# 7. تقرير القبول التاريخي — 2026-10-21

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/docs/final-acceptance-report-2026-10-21.md`  
> **الوصف:** تقرير تاريخي، محفوظ بتاريخ ونتائج تشغيله الأصلية.

> **Historical record.** This report preserves the browser acceptance run from 2026-10-21 and its original revision. The current canonical automated verification for the present `main` checkout is recorded in `docs/test-results-2026-11-03.md`: 13 test files and 90 tests passed. Historical counts and browser observations below are not a fresh test of every buyer browser/device.

Date: 2026-10-21  
Candidate branch: `acceptance/release-candidate-2026-10-21`  
Base under review: `origin/main` at `5474a3e`  
Validated application revision: `c006aeaf01b62d1022237a25f5f05bad2a50d065`.

## Candidate establishment

The repository, remote, branch list, working tree, commit graph, package manifest, lockfile, documentation, and test suites were inspected before changes. `main` did not contain the complete task 1–8 line: the unified integration branch and the large-media/export/accessibility branches still contained intended changes not reachable from `main`.

The candidate was created on a dedicated branch. It includes the unified integration baseline, the `main` security/privacy baseline (`ea8ed26` and merge `5474a3e`), large-media and export reliability fixes, and accessibility status improvements. No force-push or merge into `main` was performed.

## Checks executed

- `pnpm install --frozen-lockfile` — passed.
- `pnpm test -- --run` — passed: **13 test files, 90 tests**.
- `pnpm check` — passed.
- `pnpm build` — passed. Vite emitted the existing non-blocking warning about `/api/platform/config.js` lacking `type="module"` and the existing large-chunk warning.
- `git diff --check` — passed.
- `pnpm audit --prod --audit-level=high` — passed: no known vulnerabilities.
- `GET /` — HTTP 200.
- `GET /studio` — HTTP 200 with the application shell.
- `GET /manus-routes.json` — HTTP 200 with the declared `/` and `/studio` routes.

## Actual browser and media acceptance

The local Vite preview was opened in the Sandbox browser at `/studio`. The following real-media scenario was exercised, not mocked:

1. A generated but valid local MP4 fixture was created with FFmpeg: 640×360, H.264 video, AAC audio, 30fps, 8.000 seconds, 875,832 bytes.
2. The file was injected into the browser file input through the page’s own DOM event path. The application displayed `640 × 360 · audio detected`, confirming local metadata inspection.
3. The source was saved as a local project entry in the browser’s IndexedDB-backed project list.
4. The no-transcription recovery path was exercised by choosing “Skip analysis and set a cut manually”. The editor created an 8-second manual clip and displayed the vertical preview.
5. The clip start/end controls, preview, post-copy fields, caption controls, branding controls, framing mode, manual crop slider, and export resolution controls were visible and interactive in the edit stage.
6. The export stage was opened. It displayed the local-only media path, a 9:16 profile, a detected WebM encoder, a single clip queue, and both individual and ZIP actions.
7. Individual export was executed. The UI progressed from `0%` to `Ready` and reported a 5.2 MB `Property-cut-1.webm` output.
8. The output was downloaded through the browser and independently inspected with `ffprobe`: 1080×1920, 30fps, VP9 video plus Opus audio, 8.031 seconds, 5,456,600 bytes. The file was therefore present, playable by container inspection, vertical, and duration-consistent with the selected source interval.
9. A second valid fixture was generated and probed for the no-audio case: 360×640 VP9 WebM, 5.000 seconds, no audio stream. It was uploaded through the browser workflow; the UI correctly displayed `no audio track` and the recovery message `No audio was detected. You can still set clip points manually and export the video.`

## Defects found and fixes

During candidate integration, four merge conflicts were found in the clip-analysis, preview, transcription-worker, and Studio files. They were resolved by retaining the stronger unified integration behavior and carrying over the security, timeout, duplicate-candidate, cancellation, and bounded-source changes from `main`.

The first post-merge test run exposed a malformed manually combined test file: an import was placed inside a `describe` block. This was corrected immediately, Vitest imports were restored, and the full suite was rerun successfully. The final regression coverage includes cancellation of slow media reads, transcription window boundaries, clip boundary accuracy, export/download behavior, face tracking, framing, storage recovery, and server routes.

No reproducible application defect remained after the final checks above.

## Step-by-step status

| Scenario | Result | Evidence |
|---|---|---|
| Open application | Passed | Browser `/studio` rendered successfully |
| Load real video with audio | Passed | MP4 metadata shown in UI |
| Start transcription | Passed | Whisper loaded in-browser and returned 22 timed words from the spoken fixture |
| Review/correct transcript timing | Passed | Three caption lines with in/out times, transcript review, title, description and tags appeared in the browser |
| Generate/inspect suggestions | Passed | One distinct candidate clip was selected from the timed transcript with rationale text |
| Edit clip boundaries | Passed at UI level | Start/end number and range controls exercised/visible |
| Configure captions/title/branding | Controls verified in edit stage; caption burn not independently rendered in this run | UI and automated export tests |
| Select vertical 9:16 | Passed | Preview and export profile showed 1080×1920 |
| Automatic face tracking | Passed | Realistic face fixture returned detections at all 22 sampled times and enabled Auto crop |
| Manual cropping | Passed at UI level | Manual framing control visible and preview rendered |
| Preview selected output | Passed | 9:16 preview rendered in browser |
| Export one clip | Passed | Browser completed export and reported Ready |
| Export multiple clips | Passed | Two clips were queued, encoded, and both reached Ready |
| Download individual output | Passed | Downloaded WebM independently probed |
| Generate/download ZIP | Passed | Browser created and downloaded `face-speech-clips.zip`; archive contained exactly two WebM files |
| Open/play exported file | Passed by browser output readiness and ffprobe stream validation; full external playback was not separately scripted | Downloaded file inspected |
| Validate duration/aspect/audio | Passed for individual output | `ffprobe` result above |
| Reload/reopen persistence | Passed | A full browser navigation was performed; the saved project was reopened and its original source was matched successfully |
| Failure/recovery cases | Passed for required acceptance paths | No-audio recovery, manual clip fallback, source matching, and export completion were exercised; cancellation/error branches also have automated coverage |

No independent tester who did not build the application was available; no independent usability test is claimed.

## Final verdict

All required acceptance scenarios were exercised successfully with real local media, including human speech, a clear human face, a no-audio video, two clips, ZIP generation/download, output inspection, and a full browser reload/reopen. The complete automated suite, type check, production build, diff check, route smoke checks, and production dependency audit also pass.

The Vite build retains two non-blocking warnings already documented in this report: the external config script is intentionally not a module, and some generated chunks are larger than the default advisory threshold. Neither warning caused a runtime failure or an acceptance failure.

**Verdict: ACCEPTED** — no known reproducible defect remains in the required tested scenarios. The validated code revision is `c006aeaf01b62d1022237a25f5f05bad2a50d065`; the final documentation update is committed separately on the release-candidate branch.

---


# 8. تقرير التحقق التاريخي — 2026-10-15

> **مصدر هذا القسم:** `/home/ubuntu/review-frame-key-studio/docs/validation-report-2026-10-15.md`  
> **الوصف:** تقرير تاريخي، محفوظ بتاريخ ونتائج تشغيله الأصلية.

> **تقرير تاريخي.** نتائج هذا الملف تخص فحص 2026-10-15 وتحتفظ بعدد الاختبارات في ذلك الوقت. النتيجة الآلية الحالية للفرع محل التسليم موثقة في `docs/test-results-2026-11-03.md`: 13 ملف اختبار و90 اختباراً ناجحاً. لا تُعامل هذه الملاحظات التاريخية كاختبار جديد لكل متصفح أو جهاز.

التاريخ: 2026-10-15

## النتيجة التنفيذية

تم التحقق من بناء المشروع واختباراته بعد إصلاح مسار التصدير. أُضيفت مهلة 2.5 ثانية لمنتقي الحفظ الأصلي؛ إذا لم يظهر الحوار في متصفح مضمن، يعود التصدير تلقائيًا إلى BufferTarget بدل البقاء عند 0%. لا تُرفع الوسائط إلى خادم التطبيق.

## مصادر الاختبار

| الملف | السيناريو | الأبعاد | المدة | الترميز | معدل الفيديو الخام | الحجم |
|---|---|---:|---:|---|---:|---:|
| `01-closeup-speaker.mp4` | Close-up speaker | 1920×1080 | 12.045s | h264 @ 30000/1001 | 1,177,835 bps | 1,980,615 B |
| `02-moving-subject.mp4` | Moving subject | 1920×1080 | 12.045s | h264 @ 30000/1001 | 1,547,280 bps | 2,536,878 B |
| `03-distant-lecture.mp4` | Distant lecture | 1920×1080 | 12.045s | h264 @ 30000/1001 | 913,530 bps | 1,582,655 B |
| `04-landscape-multiple-objects.mp4` | Landscape / multiple objects | 1920×1080 | 12.045s | h264 @ 30000/1001 | 658,144 bps | 1,198,105 B |
| `05-screen-presentation.mp4` | Screen presentation | 1920×1080 | 12.045s | h264 @ 30000/1001 | 924,179 bps | 1,598,689 B |

## التحقق المقارن

| المسار | حالة التحقق | الملاحظة |
|---|---|---|
| Fill portrait frame | ناجح في المعاينة والكود والاختبارات | قص 9:16 يدوي؛ الوجه القريب بقي ظاهرًا في المعاينة، مع fallback يدوي عندما لم يثبت الكشف التلقائي في هذا الفيديو الاصطناعي. |
| Show full video / studio background | ناجح في المعاينة والكود والاختبارات | إطار الفيديو الكامل داخل لوحة 9:16 دون تمديد؛ الخلفية الداكنة في التصدير والمعاينة المموهة كما هو مصمم. |
| Captions + title overlay | ناجح في المعاينة | تم استيراد سطرين SRT: `Close-up speaker test` و`Frame and Key quality check`، وظهر العنوان في المعاينة. |
| Face tracking | fallback متوقع | MediaPipe full لم يجد وجهًا ثابتًا في close-up الاصطناعي؛ ظهرت رسالة واضحة واشتغل الضبط اليدوي. هذا ليس فشل تصدير. |
| Export stability | أُصلح | سبب 0% كان انتظار نافذة `showSaveFilePicker` غير المرئية لأداة الاختبار؛ أضيفت مهلة fallback. |

## أدلة التحقق

- `pnpm test -- --run`: **7 ملفات، 32 اختبارًا ناجحًا**.
- `pnpm build`: **نجاح**؛ تحذير Vite الموجود عن `config.js` وحجم بعض chunks غير مانع للبناء.
- مخرجات سابقة محققة من مسار التطبيق موجودة في `Downloads/It-s-new-security-standard (1–5).webm` و`frame-key-test/exported-clip.webm`، وتم فحصها سابقًا بـ`ffprobe` واستخراج إطارات منها.
- المصدر الخام لكل الفيديوهات الخمسة هو H.264 ‏1920×1080، وليس 1920×2160؛ ظهور 1920×2160 في واجهة close-up كان قراءة متأثرة ببيانات العرض/الدوران في المتصفح، وليس أبعاد الملف الفعلية.

## الحدود المتبقية

الكشف التلقائي ليس مضمونًا عندما يكون الوجه صغيرًا أو مضغوطًا أو اصطناعي المظهر. لذلك يبقى شريط Manual horizontal framing fallback مقصودًا. كما أن اختيار 1080×1920 يرفع الدقة فقط إذا كان المصدر يملك تفاصيل كافية؛ لا يمكنه استعادة تفاصيل غير موجودة في المصدر.

---
