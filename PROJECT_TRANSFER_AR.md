# Frame & Key Studio — ملف النقل الموحد للحساب الجديد
> هذا الملف يجمع وثائق التسليم والتشغيل والتقارير في ملف واحد. اقرأه كاملًا قبل متابعة المشروع.
> لا يحتوي هذا الملف على مفاتيح API أو كلمات مرور أو رموز وصول.


---

# المصدر المدمج: `HANDOFF.md`

# Frame & Key Studio — ملف التسليم للحساب الجديد

هذا الملف هو نقطة البداية للحساب الجديد. اقرأه قبل تعديل الكود. لا يحتوي على مفاتيح API أو كلمات مرور أو رموز وصول.

## رابط المشروع والحالة

- المستودع: https://github.com/mojtabahamed163-ai/frame-key-studio
- الفرع الأساسي: `main`
- المستودع عام حاليًا.
- التطبيق مبني على React/Vite/TypeScript مع خادم Express/tRPC/Drizzle موروث من القالب.
- الاستوديو المحلي يعالج الفيديو والصوت والتفريغ داخل متصفح المستخدم. لا تضف رفعًا سحابيًا للوسائط.
- لا تضف API مدفوعة أو نظام دفع أو اشتراكات.

## الهدف الحالي

تحسين قص الفيديو الأفقي إلى فيديو عمودي 9:16، مع تقليل قص الشخص أو العنصر المهم، والحفاظ على جودة معقولة، وتوفير وضعين:

1. **Fill portrait frame**: قص الجوانب وملء إطار 9:16.
2. **Show full video / studio background**: عرض الفيديو كاملًا داخل لوحة 9:16 دون تمديد، مع خلفية داكنة في التصدير وخلفية فيديو مموهة في المعاينة.

## التعديلات الموجودة في الكود

- `client/src/pages/Studio.tsx`
  - التحكم في وضع التأطير، تحذير الرفع في الدقة، الإعدادات، والتصدير.
- `client/src/features/studio/components/VideoPreview.tsx`
  - معاينة الوضعين Fill وFull.
- `client/src/features/studio/export/convert-clip.ts`
  - قص 9:16، وضع الفيديو الكامل، حرق العناوين والكابتشن، جودة التصدير، ومهلة منتقي الحفظ.
  - معدل الفيديو: 6 Mbps لـ720p و12 Mbps لـ1080p.
  - إذا كشف المتصفح `showSaveFilePicker` لكنه لم يعرض نافذة الحفظ، ينتظر التطبيق 2.5 ثانية ثم يستخدم BufferTarget بدل البقاء عند 0%.
- `client/src/features/studio/media/face-tracking.ts`
  - MediaPipe Face Detector بنموذج `full`، اختيار أكبر وجه مع الاستمرارية، وتقييد حركة القص عبر `limitSubjectShift`.
  - يوجد fallback واضح إلى الضبط اليدوي عند عدم وجود وجه ثابت.
- `client/src/features/studio/types.ts`
  - أنواع وإعدادات وضع التأطير وتحذير الجودة.
- الاختبارات المرتبطة موجودة في:
  - `client/src/features/studio/export/convert-clip.test.ts`
  - `client/src/features/studio/media/face-tracking.test.ts`

## نتائج التحقق الأخيرة

- `pnpm test -- --run`: **32 اختبارًا ناجحًا في 7 ملفات**.
- `pnpm build`: **ناجح**.
- `git diff --check`: ناجح.
- تقرير التفاصيل: `docs/validation-report-2026-10-15.md`.
- فيديوهات الاختبار الخمسة كانت:
  - close-up speaker
  - moving subject
  - distant lecture
  - landscape with multiple objects
  - screen presentation
- ملفات الاختبار الخام موجودة خارج المستودع في `/home/ubuntu/frame-key-test/diverse/` ولا تُرفع إلى GitHub لأنها ملفات كبيرة وليست جزءًا من التطبيق.
- جميع المصادر الخام 1920×1080 H.264 تقريبًا لمدة 12 ثانية.
- مخرجات سابقة تم التحقق منها:
  - 720×1280 VP9 + Opus
  - 1080×1920 VP9 + Opus

## حدود اكتشاف الوجه

MediaPipe لا ينجح دائمًا مع الوجه الصغير أو المضغوط أو الإضاءة الضعيفة أو الفيديو الاصطناعي. لا تعتبر هذه الحالة فشل تصدير. يجب تحسين الخوارزمية تدريجيًا عبر:

1. رسم الإطار على Canvas ثابت الحجم قبل `estimateFaces`.
2. الاحتفاظ بآخر وجه موثوق لعدة لقطات مفقودة.
3. استخدام عتبات ثقة وتغطية زمنية بدل الفشل عند أقل من keyframes اثنين.
4. تتبع الصندوق كاملًا، لا مركز الوجه فقط، مع IoU واستمرارية الشخص.
5. smoothing متكيف مع الثقة.
6. توسيع صندوق الوجه ليشمل الرأس والكتفين.
7. إعادة التحليل بإطار مكبر فقط عند فشل الكشف.

لا تحذف الضبط اليدوي؛ يجب أن يبقى آخر fallback صريحًا وصادقًا.

## التشغيل

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

يفتح الاستوديو غالبًا على:

```text
http://localhost:3000/studio
```

لا تشغل أوامر قاعدة البيانات إلا إذا كان هناك إعداد قاعدة بيانات مطلوب. معالجة الفيديو المحلية لا تحتاج قاعدة بيانات.

## الصلاحيات المطلوبة للحساب الجديد

لا توجد صلاحية يمكن نقلها من خلال GitHub أو هذا الملف إلى حساب Manus آخر. يجب على صاحب الحساب الجديد تنفيذ الربط بنفسه.

الصلاحية الأقل المطلوبة لمتابعة الكود هي:

- GitHub repository: **Contents Read and write**.
- Metadata: **Read**.
- Actions: **Read and write** فقط إذا احتاج تشغيل أو تعديل GitHub Actions.
- Pull requests: **Read and write** إذا كان سيستخدم PRs.
- لا تمنحه **Administration** أو تغيير الملكية إلا إذا كان ذلك مقصودًا صراحة.
- لا تشارك Personal Access Token أو `OPENAI_API_KEY` أو أي سر داخل المحادثة أو المستودع.

خطوات الحساب الجديد:

1. سجّل الدخول إلى حساب Manus الجديد.
2. فعّل تكامل GitHub لذلك الحساب.
3. اربط المستودع `mojtabahamed163-ai/frame-key-studio`.
4. اختر الفرع `main`.
5. اقرأ هذا الملف و`README.md` و`TODO.md` و`docs/validation-report-2026-10-15.md`.
6. نفّذ `pnpm install --frozen-lockfile` ثم `pnpm check` و`pnpm test`.
7. لا تعِد بناء التطبيق من الصفر؛ نفّذ إصلاحات مستهدفة فقط.
8. لا تنفذ نشرًا أو تغييرات في الفوترة أو الملكية دون طلب صريح من صاحب الحساب.

## التخزين المحلي

المشاريع والفيديوهات المحفوظة في IndexedDB/OPFS داخل المتصفح القديم لا تنتقل تلقائيًا إلى الحساب أو المتصفح الجديد. يجب إعادة اختيار الفيديو الأصلي في الحساب الجديد. هذا متوقع وليس عطلًا في GitHub.

## قاعدة العمل للحساب الجديد

قبل كل تعديل:

```bash
git status
git log --oneline -5
```

بعد كل تعديل:

```bash
pnpm check
pnpm test
pnpm build
git diff --check
```

اعرض القيود بصدق، ولا تدّعِ أن اكتشاف الوجه مضمون في جميع الفيديوهات.


---

# المصدر المدمج: `README.md`

# Frame & Key Studio — Real Estate Short-Form Video Editing

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.


---

# المصدر المدمج: `TODO.md`

# نتائج تحديث Frame & Key Studio

> كل شرط من الطلب الأصلي محفوظ أدناه ضمن النتيجة التي تخصه. يبقى الموقع الحالي ونموذج الاستفسار قائمين؛ هذه المهام تخص إضافة محرر الفيديو إلى المشروع نفسه، لا إنشاء موقع بديل.

## 1. الحفاظ على المنتج الحالي وشرط المجانية

- [x] «لا تبنِ الموقع من الصفر. افحص المشروع الحالي أولًا، وافهم بنيته ووظائفه، ثم حدّثه وأضف الميزات المطلوبة مع الحفاظ على التصميم والوظائف الموجودة التي تعمل بالفعل. لا تحذف أي ميزة موجودة أو تعِد بناء أجزاء كاملة دون ضرورة تقنية واضحة.»
- [x] «ليس لدي أي ميزانية حاليًا، لذلك يجب أن تكون جميع التحديثات والميزات قابلة للتنفيذ باستخدام أدوات وتقنيات مجانية، دون الحاجة إلى دفع أي أموال.»
- [x] «لا تستخدم أي واجهة برمجية مدفوعة (API) أو خدمة تتطلب شراء رصيد.»
- [x] «لا تعتمد على اشتراكات مدفوعة أو خدمات تتطلب بطاقة بنكية للتفعيل.»
- [x] «لا تعتمد على أرصدة تجريبية محدودة تنتهي لاحقًا.»
- [x] «استخدم المكتبات مفتوحة المصدر والأدوات المجانية قدر الإمكان.»
- [x] «أعطِ الأولوية لمعالجة الفيديو داخل متصفح المستخدم لتجنب تكاليف الخوادم.»
- [x] «استخدم نماذج ذكاء اصطناعي مجانية فعلًا وقابلة للتشغيل في بيئة المشروع.»
- [x] «تحقق من شروط الاستخدام وحدود كل خدمة قبل دمجها.»
- [ ] «لا تضف أي خدمة قد تفرض رسومًا تلقائية أو تكاليف خفية.»
- [x] «إذا تعذّر تنفيذ ميزة مجانًا، فابحث عن بديل مجاني عملي. وإذا لم يوجد، فلا تنفذها بطريقة وهمية ولا تستبدلها بخدمة مدفوعة دون موافقتي.»
- [ ] «تحقق من تكاليف الاستضافة والنشر والتخزين وقواعد البيانات وتسجيل الدخول، كلٌّ على حدة.»
- [x] «لا تدّعِ أن الموقع مجاني بالكامل إذا كانت هناك تكاليف ضرورية لتشغيله أو نشره.»
- [x] «لا تضحِّ بالوظائف الأساسية من أجل إضافة ميزات شكلية.»
- [x] «الهدف هو تطوير الموقع وتشغيله بأقل تكلفة ممكنة، على أن تكون التكلفة صفر دولار قدر الإمكان.»

## 2. رفع الفيديو وتحليله واقتراح المقاطع

- [x] «السماح برفع الفيديو من الجهاز.»
- [x] «تحليل محتوى الفيديو لاكتشاف اللحظات المهمة.»
- [x] «اقتراح عدة مقاطع مستقلة من الفيديو الواحد.»
- [x] «تجنب اقتطاع الجمل في منتصف الكلام أو إفساد المعنى.»
- [x] «السماح للمستخدم بتعديل بداية المقطع ونهايته.»
- [x] «عرض معاينة لكل مقطع قبل تنزيله.»
- [x] «يجب أن تعتمد الميزة على تحليل حقيقي للمحتوى، وليس على اقتطاع أجزاء عشوائية من الفيديو.»

## 3. البدايات الجذابة وتجهيز النصوص

- [x] «اكتشاف الجمل القوية التي تصلح لبداية الفيديو.»
- [x] «اقتراح ثلاثة خيارات مختلفة للبداية عندما يسمح محتوى التسجيل بذلك.»
- [x] «استخدام الكلام الموجود في التسجيل الأصلي دون اختلاق كلام ونسبته إلى المتحدث.»
- [x] «السماح للمستخدم باختيار البداية التي تناسبه.»
- [x] «لكل مقطع، أضف الإمكانات التالية: اقتراح ثلاثة عناوين مختلفة؛ إنشاء وصف مناسب للنشر؛ اقتراح وسوم مرتبطة بمحتوى الفيديو؛ اقتراح عبارات تشجع المشاهد على التفاعل؛ السماح للمستخدم بتعديل النصوص قبل استخدامها.»
- [x] «يجب استخدام أدوات مجانية فعلًا لهذه الوظائف، دون الاعتماد على واجهات برمجية مدفوعة.»

## 4. التفريغ والترجمة المتحركة

- [x] «تحويل الكلام إلى نص تلقائيًا.»
- [x] «مزامنة النص مع الكلام.»
- [x] «تمييز الكلمات أثناء النطق.»
- [x] «توفير تصاميم وألوان وخطوط متعددة.»
- [x] «السماح بتعديل النص والتوقيت يدويًا.»
- [x] «دعم لغات متعددة عند توفر أدوات مجانية مناسبة.»
- [x] «السماح باختيار لغة الترجمة بصورة مستقلة عن لغة الكلام.»
- [x] «يمكن استخدام Whisper مفتوح المصدر أو بديل مجاني مناسب، مع مراعاة إمكانات الأجهزة والقيود التقنية.»

## 5. تحسين الفيديو والقص العمودي

- [x] «إزالة فترات الصمت الطويلة والتوقفات غير الضرورية.»
- [x] «تحسين مستوى الصوت عند الإمكان.»
- [x] «تحويل الفيديو إلى المقاس العمودي 9:16.»
- [x] «ضبط إطار الفيديو لمتابعة المتحدث عند الإمكان.»
- [x] «تجنب قص الوجوه والأجزاء المهمة من المشهد.»
- [x] «توفير إعدادات تصدير مناسبة لـ TikTok وInstagram Reels وYouTube Shorts.»

## 6. الهوية البصرية المخصصة

- [x] «السماح للمستخدم برفع شعاره.»
- [x] «حفظ الألوان والخطوط المفضلة.»
- [x] «حفظ تصميم الترجمة والعناوين.»
- [x] «تحديد موضع الشعار.»
- [x] «تطبيق الإعدادات المحفوظة تلقائيًا على الفيديوهات الجديدة.»
- [x] «توفير عدة قوالب احترافية مجانية.»

## 7. تحرير المقاطع بعد إنشائها

- [x] «معاينة الفيديو داخل الموقع.»
- [x] «تعديل بداية المقطع ونهايته.»
- [x] «تعديل الترجمة وتوقيتها.»
- [x] «تغيير تصميم النصوص.»
- [x] «إعادة معالجة المقطع بعد التعديلات.»
- [x] «تنزيل النسخة النهائية بجودة مناسبة.»

## 8. المعالجة المتعددة

- [x] «استخراج عدة مقاطع من فيديو واحد.»
- [x] «عرض حالة معالجة كل مقطع.»
- [x] «إظهار نسبة تقدم المعالجة.»
- [x] «تنزيل كل مقطع منفردًا.»
- [x] «توفير خيار تنزيل جميع المقاطع في ملف ZIP.»
- [x] «التعامل مع أخطاء المعالجة بطريقة واضحة.»

## 9. الأداء وسهولة الاستخدام والحفظ المحلي

- [x] «الحفاظ على واجهة الموقع الحالية وتحسينها عند الحاجة.»
- [x] «جعل الوظائف سهلة للمستخدم المبتدئ.»
- [x] «عرض مدة الفيديو وحجم الملف قبل المعالجة.»
- [x] «توفير رسائل واضحة عند حدوث الأخطاء.»
- [x] «تجنب استهلاك ذاكرة الجهاز بصورة مفرطة.»
- [x] «مراعاة المستخدمين الذين يمتلكون هواتف محدودة الإمكانات.»
- [x] «حفظ تقدم العمل قدر الإمكان عند إغلاق الصفحة بالخطأ.»
- [x] «افحص إمكانية حفظ المشاريع والإعدادات باستخدام حلول مجانية فعلًا.»
- [x] «إذا كان التخزين السحابي أو إنشاء الحسابات يتطلب رسومًا، فابحث عن بديل مجاني مناسب، مثل حفظ المشاريع محليًا داخل المتصفح في النسخة الأولية.»
- [x] «لا تضف خدمات مدفوعة، ولا تجعل الوظائف الأساسية تعتمد على خدمة مجانية محدودة دون توضيح حدودها.»

## 10. حدود الدفع والاشتراكات

- [x] «لا أريد إضافة نظام اشتراكات أو دفع إلكتروني الآن.»
- [x] «أخطط لتحويل الموقع إلى خدمة باشتراكات مدفوعة في المستقبل، بعد أن يصبح المنتج جاهزًا وتتوفر لدي ميزانية لتطويره وتشغيله.»
- [x] «في المرحلة الحالية: ركّز على تحديث الموقع والوظائف الأساسية.»
- [x] «لا تضف بوابات دفع أو اشتراكات أو خطط أسعار.»
- [x] «لا تضف أنظمة تجريبية مدفوعة أو قيودًا مصطنعة لإجبار المستخدم على الدفع.»
- [x] «حافظ على بنية المشروع قابلة للتطوير مستقبلًا لإضافة الاشتراكات عند الحاجة، دون تنفيذ هذا النظام الآن.»

## 11. الاختبار والصدق في عرض المزايا

- [x] «قبل إجراء أي تعديل: افحص المشروع الحالي وحدد وظائفه الموجودة بالفعل.»
- [x] «حافظ على جميع الوظائف الحالية التي تعمل بصورة صحيحة.»
- [x] «حدد الميزات المطلوبة التي ينقصها المشروع.»
- [x] «اختر تقنيات مجانية مناسبة لكل ميزة.»
- [x] «نفّذ التحديثات على المشروع الحالي بدلًا من إعادة بنائه من الصفر.»
- [x] «اختبر رفع الفيديو ومعالجته والترجمة وتصدير الملفات فعليًا.»
- [x] «تحقق من أن الملفات الناتجة قابلة للتشغيل والتنزيل.»
- [ ] «اختبر التعامل مع الملفات الكبيرة نسبيًا، ضمن الحدود الواقعية للأجهزة.»
- [x] «تأكد من عدم وجود أزرار وهمية أو نتائج تجريبية توحي بأن الوظائف تعمل بينما هي غير منفذة.»
- [x] «وضّح أي قيود تقنية متبقية بصدق.»

## 12. الأولوية وترتيب التنفيذ

- [x] «إذا كانت الموارد المجانية لا تسمح بتنفيذ جميع الميزات معًا، فابدأ بالأهم: 1. اكتشاف المقاطع المناسبة تلقائيًا. 2. إنشاء الترجمة ومزامنتها. 3. قص الفيديو وتغيير أبعاده وتصديره. 4. إنشاء العناوين والأوصاف والوسوم. 5. تخصيص الهوية البصرية. 6. معالجة عدة مقاطع دفعة واحدة. 7. بقية الميزات الإضافية.»
- [x] «النتيجة المطلوبة: تحديث الموقع الحالي وتحسينه ليصبح منتجًا حقيقيًا وقابلًا للاستخدام، مع الحفاظ على وظائفه الحالية، وعدم إنفاق أي أموال على الميزات الجديدة أو الخدمات اللازمة لتشغيلها قدر الإمكان، وتأجيل نظام الاشتراكات إلى مرحلة مستقبلية.»

## 13. المستودع والنشر

- [ ] بعد حفظ التغيير على المستودع الأساسي، استكمال نقل canonical repository إلى GitHub وفق بطاقة WebDev الرسمية، مع إبقاء المستودع الجديد خاصًا افتراضيًا وعدم force-push أو حذف تاريخ/فروع.
- [ ] بعد اكتمال النقل فقط، محاولة نشر واحدة إذا لم يترتب عليها رسم. إذا ظهرت تكلفة أو رفض أو عائق صلاحيات، لا تُشترَ خدمة ولا تُعاد محاولة النشر بتجاوز المنصة؛ يذكر بوضوح أن الرابط هو معاينة فقط.


---

# المصدر المدمج: `docs/CONTINUATION_PROMPT_AR.md`

# رسالة جاهزة للحساب الجديد

أنت تتابع مشروع **Frame & Key Studio** من المستودع:

`https://github.com/mojtabahamed163-ai/frame-key-studio`

ابدأ بقراءة:

1. `HANDOFF.md`
2. `README.md`
3. `TODO.md`
4. `docs/validation-report-2026-10-15.md`

المطلوب هو متابعة تحسين محرر الفيديو الحالي، وليس إعادة بناء التطبيق. التطبيق يعمل محليًا داخل المتصفح باستخدام React/Vite/Mediabunny/Whisper Tiny/MediaPipe. لا تستخدم API مدفوعة، ولا ترفع ملفات الفيديو إلى الخادم.

الميزات المهمة الموجودة:

- قص Fill إلى 9:16.
- Show Full Video داخل خلفية استوديو.
- كابتشن مستورد أو مولّد محليًا وحرقه داخل الفيديو.
- عنوان وهوية بصرية.
- تصدير WebM محليًا بدقة 720×1280 أو 1080×1920.
- اكتشاف الوجه محليًا مع fallback يدوي.
- حفظ المشاريع والإعدادات محليًا في المتصفح.

آخر إصلاح مهم: إذا ظهر `showSaveFilePicker` في المتصفح دون أن تظهر نافذة الحفظ، لا يجب أن يبقى التصدير عند 0%. توجد مهلة 2.5 ثانية في `requestSaveTarget` ثم يعود التطبيق إلى BufferTarget.

نتائج الاختبار الأخيرة:

- 32 اختبارًا ناجحًا.
- بناء الإنتاج ناجح.
- تم اختبار خمسة فيديوهات: close-up، حركة، محاضرة بعيدة، عدة عناصر، وتسجيل شاشة.
- MediaPipe قد يفشل مع الوجوه الصغيرة أو الفيديو الاصطناعي؛ لا تحذف الضبط اليدوي. حسّن التتبع عبر Canvas، آخر وجه موثوق، IoU، عتبات الثقة، التغطية الزمنية، وsmoothing متكيف.

نفّذ قبل التعديل:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

ونفّذ بعد التعديل:

```bash
pnpm check
pnpm test
pnpm build
git diff --check
```

صلاحية GitHub المناسبة لمتابعة الكود هي **Contents: Read and write**. لا تحتاج صلاحية Administration أو أسرار API. لا تغيّر ملكية المستودع أو مستوى خصوصيته أو إعدادات الفوترة دون طلب صريح.


---

# المصدر المدمج: `docs/validation-report-2026-10-15.md`

# تقرير تحقق Frame & Key — اختبار التأطير العمودي

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

# المصدر المدمج: `export-diagnosis-2026-10-14.md`

# Frame & Key — Export diagnosis

Date: 2026-10-14

## Result

The export completed successfully in the current Chromium/Sandbox environment after reloading the application and retrying the same real source file and selected clip.

No fake progress or paid API was introduced.

## Diagnostic evidence

Source file:

- `/home/ubuntu/frame-key-test/blockchain-un.webm`
- 101,590,948 bytes
- VP9 video, 1920×1080, 29.97 fps
- Opus audio, 48 kHz stereo
- Duration: 650.863 seconds

Instrumented export log:

- `Conversion.init:start`
- `Conversion.init:done`: `isValid: true`, `discardedTracks: []`
- `Conversion.execute:start`
- `Conversion.execute:done`: output state `finalized`
- `BufferTarget:done`: `8,671,197` bytes

The successful run took approximately 22 seconds inside `Conversion.execute()` for the 22.12-second clip. The earlier visible 0% state was therefore not evidence that encoding had not started: the UI only receives its first meaningful progress after the conversion setup and Mediabunny progress calculation. The earlier failure could not be reproduced after a clean reload; no rejected promise, WebCodecs incompatibility, memory exhaustion, or discarded track was observed in the successful reproduction.

## Independent output verification

Output file:

- `/home/ubuntu/frame-key-test/exported-clip.webm`
- 8,671,197 bytes
- `ffprobe` format: Matroska/WebM
- Duration: 22.141 seconds
- Encoder tag: Mediabunny v1.61.4

Streams reported by `ffprobe`:

- Video: VP9, 720×1280, 9:16, 30 fps, yuv420p
- Audio: Opus, 48 kHz, 2 channels

An independent frame was extracted with FFmpeg at 1.2 seconds:

- `/home/ubuntu/frame-key-test/exported-frame.png`
- 360×640 PNG
- The burned-in caption `It's new security standard.` is visibly present.

## Code change

Changed file:

- `client/src/features/studio/export/convert-clip.ts`
  - Added phase-level `console.log` diagnostics around peak measurement, `Conversion.init`, `Conversion.execute`, output finalization, and failures.
  - The diagnostics are observational only; encoding, progress calculation, cancellation, output format, and memory behavior were not altered.

## Regression checks

- `pnpm check`: passed
- `pnpm test`: passed previously with 29 tests; the final diagnostic-only edit is type-safe and does not change tested behavior.
- `pnpm build`: passed
- Existing local upload, Whisper analysis, candidate extraction, clip editing, captions, 9:16 settings, and title/audio settings remained usable during the export test.

## Remaining limitation

The earlier 0% hang remains transient and was not reproducible after a clean application reload. The UI can still appear at 0% during the preparation/init window because no meaningful conversion progress has been emitted yet. The new logs make that boundary observable in the browser console. A future UX improvement could expose a dedicated preparation status, but this was not added as part of the targeted diagnosis because it would not fix a demonstrated encoding failure.


---

# المصدر المدمج: `portrait-framing-quality-report-2026-10-15.md`

# Frame & Key — Portrait framing and quality report

Date: 2026-10-15

## Final conclusion

Two separate causes were confirmed:

1. **Framing risk:** converting a 16:9 source to 9:16 necessarily removes most horizontal pixels. A fixed center crop can miss a moving subject. The project already had an optional local face-tracking path; I improved its motion stability and preserved the manual horizontal crop fallback.
2. **Softness:** the source is already compressed and the portrait crop contains only about 608×1080 source pixels for a 1920×1080 input. A 1080×1920 output therefore enlarges that crop by about 1.78×. Increasing output dimensions cannot restore source detail. The existing 720p profile also had a relatively conservative 4 Mbps target; it was raised to 6 Mbps, while 1080p was raised from 8 Mbps to 12 Mbps to reduce unnecessary compression headroom loss.

The final real export completed successfully. The real face detector test did **not** produce reliable detections on this particular video, so the final tested export used the stable manual/center fallback. I do not claim automatic subject tracking succeeded on this clip.

## Implementation changes

### `client/src/features/studio/media/face-tracking.ts`

- Changed MediaPipe Face Detector from the `short` model to the `full` model to better support smaller/distant faces.
- Added `limitSubjectShift()` and applied it between sampled detections to prevent abrupt crop jumps.
- Kept largest-face ranking, confidence scoring, interpolation, framing bounds, and the manual fallback.
- The detector remains local and optional; no paid API or external encoding service was added.

### `client/src/features/studio/export/convert-clip.ts`

- Added `portraitCropQuality()` to calculate source crop dimensions, output dimensions, and whether enlargement is required.
- Kept the original-file path, 9:16 crop, canvas processing, captions, audio, timing, cancellation, VP9/AVC selection, and bitrate profiles.
- The existing bitrate adjustment remains centralized through `videoBitrateForHeight()`:
  - 720×1280: 6 Mbps
  - 1080×1920: 12 Mbps

### `client/src/pages/Studio.tsx`

- Added a quality warning in the edit screen when the selected portrait output enlarges the available source crop.
- The warning explicitly states that a larger output cannot restore missing source detail.
- The existing preview remains the correction surface: the horizontal manual slider is available, and its normalized center is used by both preview and export.

### Tests

- `client/src/features/studio/export/convert-clip.test.ts`: added crop-enlargement and bitrate-profile tests.
- `client/src/features/studio/media/face-tracking.test.ts`: added a test preventing abrupt subject-center jumps.

## Real source and exports

Source:

- `/home/ubuntu/frame-key-test/blockchain-un.webm`
- 1920×1080 VP9, 29.97 fps, Opus audio
- approximately 1.25 Mbps container bitrate

Previous 720p export:

- `/home/ubuntu/frame-key-test/exported-clip-baseline-4mbps.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 8,671,197 bytes
- 3,133,082 bps container bitrate

Higher-bitrate 720p export:

- `/home/ubuntu/frame-key-test/exported-clip-high-bitrate.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 10,917,453 bytes
- 3,944,700 bps container bitrate

Higher-bitrate 1080p export:

- `/home/ubuntu/frame-key-test/exported-clip-1080-high-bitrate.webm`
- 1080×1920, 30 fps, VP9 + Opus, 48 kHz stereo audio
- 22.141 seconds, 20,218,110 bytes
- 7,305,220 bps container bitrate

Final export after the framing changes:

- `/home/ubuntu/frame-key-test/final-export-after-framing.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 10,917,453 bytes
- 3,944,700 bps container bitrate

The final file was independently checked with `ffprobe`, and frames were extracted at 1.0, 11.0, and 21.0 seconds.

## Visual inspection

The final frames are available at:

- `/home/ubuntu/frame-key-test/final-frame-1.0.png`
- `/home/ubuntu/frame-key-test/final-frame-11.0.png`
- `/home/ubuntu/frame-key-test/final-frame-21.0.png`

The speaker remains visible at the beginning, middle, and end. The crop does not jump excessively because the tested fallback is stable. Captions remain readable and positioned inside the portrait frame.

The 4 Mbps versus 6 Mbps 720p comparison showed a higher output bitrate and file size, but representative frames were visually very similar; therefore no dramatic sharpness improvement is claimed. The source compression and the 16:9-to-9:16 crop remain the limiting factors.

## Face-detection test and repair cycle

The first real face-tracking test on the selected 22-second source clip ended with:

> A stable face was not detected in this clip. Manual framing remains available.

This was a genuine detector failure, not a UI or export failure. The first attempted repair changed MediaPipe from the `short` model to the `full` model because the speaker is relatively small in the 1920×1080 frame. The same real clip was tested again, and the full model also failed to produce a stable face track in this browser session. Because this remained unreliable, the application correctly kept auto-framing off and preserved the manual/center fallback instead of applying an unverified crop.

The final export was then rerun after that failure and completed successfully. This confirms that the detector failure does not break export or download.

## Preview/export consistency

The preview and exporter both use the same normalized center values from `faceCenterAt()` and the same 9:16 geometry from `cropForPortrait()`. The preview uses browser `object-fit: cover` and `object-position`; the exporter uses the equivalent source crop drawn onto the encoding canvas. Crop geometry therefore matches. Caption and title rendering are implemented separately in HTML for preview and Canvas for export, so their typography is not pixel-identical, but their placement logic remains aligned.

## Validation

- `pnpm check`: passed
- `pnpm test`: passed — 32 tests
- `pnpm build`: passed
- Real 720p export after final changes: passed
- Real 1080p export: passed
- Independent `ffprobe` checks: passed
- Audio present in final files: passed
- Captions readable in representative frames: passed
- Download path exercised from the actual browser UI: passed

## Remaining limitations

Automatic detection currently identifies faces only, not arbitrary objects. On the tested video, both the short and full local MediaPipe face models failed to produce a stable track, likely because the face is relatively small and the scene is a distant lecture recording. The safe behavior is manual/center fallback, and the UI reports the failure instead of pretending that tracking succeeded.

The warning about enlargement is intentional. 1080×1920 is supported and correctly encoded, but it cannot recover detail lost in the source recording or in the required portrait crop.

## Mode B validation — full landscape preserved

A second real browser export was completed after adding `framingMode`:

- UI mode: **Show full video · studio background**
- The preview showed the full landscape scene inside the 9:16 canvas.
- System save picker was disabled only in the browser test session so the in-memory output could be captured and inspected; the product's normal save path remains unchanged.
- Result: **Ready**, 7.0 MB.
- `ffprobe`: VP9 video `720×1280`, `30/1` fps; Opus audio; duration `22.141 s`; size `7,330,204 bytes`.
- The extracted 10-second frame showed the complete speaker, seated participant, presentation screen and readable caption. No important subject was cropped and the landscape image was not stretched.

The final Full-mode export uses a same-as-source-ratio intermediate canvas centered on a dark portrait studio background. This avoids the browser hang caused by the system save picker and keeps the full-video render reliable on the tested browser.


---

# المصدر المدمج: `quality-diagnosis-2026-10-15.md`

# Frame & Key — Export quality diagnosis

Date: 2026-10-15

## Executive result

The export pipeline remained stable. I inspected the source, the implementation, and real exported files before changing anything.

The main quality constraint is not an accidentally low-resolution proxy. The source is a 1920×1080 VP9 recording with an average container bitrate of about 1.25 Mbps, and the portrait workflow crops a 608×1080 region from that source before fitting it into a 9:16 canvas. At 720×1280 the crop is downscaled; at 1080×1920 the same source crop is necessarily upscaled. Raising resolution cannot recreate detail that is absent from the cropped source.

The previous 720p video profile used a 4 Mbps target. I increased this conservatively to 6 Mbps for 720p and 12 Mbps for 1080p. This provides more compression headroom while preserving the existing browser-only VP9/Opus pipeline, captions, timing, crop logic, cancellation, and download behavior.

This change measurably increased the encoded file bitrate and size. However, frame-by-frame visual inspection showed that the 4 Mbps and 6 Mbps 720p frames are very similar; therefore I do not claim a dramatic visible improvement. The source quality and portrait crop remain the dominant limits.

## Code inspection findings

`client/src/features/studio/export/convert-clip.ts` uses the original `File` through Mediabunny `BlobSource`; it does not use a preview or proxy. The video path explicitly sets `copy: false`, decodes the source, crops with `cropForPortrait`, draws to the target canvas, burns captions/title graphics, and encodes with WebM VP9 or MP4 AVC depending on browser support. The frame rate remains 30 fps.

The prior encoder targets were 4,000,000 bps for 720p and 8,000,000 bps for 1080p. The canvas and crop dimensions were already correct for 9:16 output. No unnecessary intermediate video file was found.

## Exact changes

- `client/src/features/studio/export/convert-clip.ts`
  - Added the shared `videoBitrateForHeight()` profile.
  - Changed the target from 4 Mbps to 6 Mbps at 720×1280.
  - Changed the target from 8 Mbps to 12 Mbps at 1080×1920.
  - Reused the same profile for WebCodecs capability detection and the in-memory size estimate.
  - Existing diagnostic phase logs remain observational only.

- `client/src/pages/Studio.tsx`
  - Reused the shared bitrate profile when estimating batch ZIP size, preventing the UI estimate from becoming stale after the quality change.

- `client/src/features/studio/export/convert-clip.test.ts`
  - Added a regression test for the 6 Mbps and 12 Mbps profiles.

## Real export evidence

The same real source file and the same selected 22.12-second clip were exported before and after the 720p bitrate change.

| File | Resolution | FPS | Codec | Duration | Size | Container bitrate |
|---|---:|---:|---|---:|---:|---:|
| `exported-clip-baseline-4mbps.webm` | 720×1280 | 30 | VP9 + Opus | 22.141 s | 8,671,197 B | 3,133,082 bps |
| `exported-clip-high-bitrate.webm` | 720×1280 | 30 | VP9 + Opus | 22.141 s | 10,917,453 B | 3,944,700 bps |
| `exported-clip-1080-high-bitrate.webm` | 1080×1920 | 30 | VP9 + Opus | 22.141 s | 20,218,110 B | 7,305,220 bps |

The output files contain both picture and audio. The 1080p file reports VP9 video, Opus audio at 48 kHz stereo, 1080×1920, and 30 fps.

The 720p baseline and higher-bitrate files were compared with FFmpeg's SSIM filter across the encoded image sequences. The final-frame SSIM was approximately 0.9985, and representative frames were visually almost identical. This supports an honest conclusion: the bitrate increase adds encoding headroom and reduces the risk of unnecessary compression, but it does not restore detail lost to the source recording and portrait crop.

Representative frame files:

- `/home/ubuntu/frame-key-test/baseline-frame.png`
- `/home/ubuntu/frame-key-test/high-frame.png`
- `/home/ubuntu/frame-key-test/frame-1080.png`

All three frames show the expected portrait crop and readable burned-in caption.

## Validation

- `pnpm check`: passed
- `pnpm test`: passed — 30 tests
- `pnpm build`: passed
- 720p export completed in Chromium/Sandbox and was independently checked with `ffprobe`.
- 1080p export completed in Chromium/Sandbox and was independently checked with `ffprobe`.
- Both output sizes are non-empty and include video plus audio.
- Captions remain readable and correctly positioned.
- No unexpected crop, timing change, audio loss, or download regression was observed.

## Remaining limitations

The source recording itself is relatively compressed and the 16:9-to-9:16 conversion discards most horizontal pixels. The 1080×1920 mode is therefore a higher-resolution delivery canvas, not a recovery of missing source detail. On constrained devices, 720×1280 remains the practical option and now uses a 6 Mbps target with a correspondingly larger memory estimate.


---

# تعليمات أخيرة للحساب الجديد

ابدأ من هذا الملف وحده، ثم افحص الكود عند الحاجة. لا تعِد بناء التطبيق من الصفر. نفّذ إصلاحات مستهدفة فقط، ولا تستخدم خدمات AI مدفوعة أو ترفع الفيديوهات إلى الخادم. قبل وبعد أي تعديل شغّل `pnpm check` و`pnpm test` و`pnpm build` و`git diff --check`. صلاحية GitHub المطلوبة هي Contents Read and write، ولا تمنح Administration أو أسرار API دون حاجة واضحة.
