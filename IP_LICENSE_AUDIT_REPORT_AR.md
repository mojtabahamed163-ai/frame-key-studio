# تقرير تدقيق الملكية الفكرية والتراخيص

**المشروع:** Frame & Key Studio  
**المستودع:** `mojtabahamed163-ai/frame-key-studio`  
**الفرع:** `main`  
**نطاق الفحص:** commit `27f2ab8` قبل تغييرات هذا التدقيق، ثم التحقق من التعديلات الجديدة  
**التاريخ:** 2026-11-14

## النتيجة العامة

**ناجح مع تحفظات.** جرى فحص الشيفرة المتعقبة، ملفات `package.json` و`pnpm-lock.yaml`، شجرة 707 إدخالات حزم محلولة، مراجع Whisper وOPUS-MT الفعلية، الخطوط والأيقونات، والوسائط المتعقبة. أصبحت حدود الملكية والتراخيص موثقة في ملفات مستقلة، لكن لا يجوز إعلان حرية إعادة بيع مطلقة لأن `qa-artifacts/phase4/` يحتوي مخرجات وسائط لا يثبت المستودع مصدرها وترخيصها بصورة كافية، ولأن ثلاث حزم بناء ظهرت بترخيص `Unknown`.

## ما فُحص وكيف ثبت الاستخدام

الشيفرة الأصلية ومسارات الاستخدام مثبتة في `client/src/features/studio/` و`client/src/pages/Studio.tsx`. يستخدم التطبيق `mediabunny` في `media/analyze-video.ts` و`export/convert-clip.ts`، ويستخدم `@huggingface/transformers` في `workers/transcribe.worker.ts` و`workers/translate.worker.ts`. تستورد الواجهة أيقونات Lucide في `client/src/**/*.tsx`، وتستدعي Google Fonts في `client/src/index.css`.

المعرّف الفعلي لـWhisper English هو `Xenova/whisper-base.en`، والمُعرّف متعدد اللغات هو `Xenova/whisper-tiny`، كما يثبت `client/src/features/studio/workers/transcribe.worker.ts`. المعرّفات الفعلية للترجمة هي `onnx-community/opus-mt-en-ar`, `en-fr`, `en-es`, و`en-de`، كما يثبت `client/src/features/studio/workers/translate.worker.ts`. الأوزان لا توجد في Git، بل تُنزّل وقت التشغيل من Hugging Face.

## المكونات المهمة ونتيجة الترخيص

| المكون | الإصدار/المعرّف | الترخيص المثبت | تجاري/إعادة توزيع | الالتزام والمسار |
|---|---|---|---|---|
| كود المشروع الأصلي | `package.json` 1.0.0 | MIT معلن في الحزمة، ونص مستقل أُضيف في `LICENSE` | نعم، للأجزاء التي يملكها صاحب المشروع فقط | الاحتفاظ بالنص؛ لا يشمل الطرف الثالث |
| Mediabunny | 1.61.4 | MPL-2.0 | نعم | إشعارات ومصدر ملفات MPL وتعديلات تلك الملفات؛ `analyze-video.ts`, `convert-clip.ts` |
| Transformers.js | 4.3.1 | Apache-2.0 | نعم | الاحتفاظ بالترخيص وNOTICE؛ عاملا Whisper والترجمة |
| TensorFlow.js / Face Detection | 4.22.0 / 1.0.3 | Apache-2.0 | نعم | إشعارات Apache؛ مسار تتبع الوجه |
| Lucide React | 0.453.0 | ISC؛ بعض الأيقونات الموروثة MIT من Feather | نعم | إبقاء إشعارات ISC/MIT؛ `client/src/**/*.tsx` |
| fflate | 0.8.3 | MIT | نعم | إشعار MIT؛ مسار ZIP |
| Whisper Base English | `Xenova/whisper-base.en` | Apache-2.0 وفق بطاقة النموذج | نعم بحسب البطاقة، مع شروط Apache | لا تُخلط رخصة الوزن مع رخصة المشغل |
| Whisper Tiny | `Xenova/whisper-tiny` | Apache-2.0 وفق بطاقة النموذج | نعم بحسب البطاقة، مع شروط Apache | الأوزان خارج Git وتُنزل وقت التشغيل |
| OPUS-MT ONNX | `onnx-community/opus-mt-en-{ar,fr,es,de}` | CC BY 4.0 وفق البطاقات | نعم | النسب والرابط وبيان التعديلات وعدم الإيحاء بالتأييد |
| Google Fonts | DM Sans وPlayfair Display عبر CSS | رخصة كل عائلة؛ Google تؤكد الاستخدام التجاري | نعم وفق رخصة العائلة | لا توجد ملفات محلية أو نسخة/إصدار مثبت؛ لا ادعاء ملكية |
| تبعيات غير مباشرة | 707 إدخالات محلولة | الجرد الكامل في `docs/license-audit-package-inventory.md` | بحسب كل رخصة | توجد عائلات MIT/Apache/BSD/ISC وغيرها |

المصادر الرسمية التي بُني عليها هذا الجدول هي بطاقات النماذج، مستودعات Mediabunny وTransformers.js وTensorFlow.js، صفحة ترخيص Lucide، ونص CC BY 4.0. روابطها محفوظة أيضًا في `THIRD_PARTY_NOTICES.md`.

## الأصول المرئية والوسائط

`framekey-platform-mark.svg` يبدو أصلاً هندسيًا أصليًا للمشروع ولا يحتوي رابط مصدر خارجي، لذلك أدرجته ضمن نطاق `LICENSE` فقط بقدر ما يملك صاحبه حق ترخيصه. لا يثبت الفحص ملكية حصرية للاسم التجاري أو الشعار.

خطوط Google والأيقونات الخارجية ليست ملكية حصرية. ملفات `acceptance/task9/` مشتقة من فيديو Jason Hickel المنشور باسم GreensEFA تحت CC BY 3.0؛ يمكن استخدامها وفق النسب وبيان التعديل، لا بيعها كأصل حصري. ملفات `deliverables/mission2/` مشتقة من فيديو Obama الذي تصفه صفحة Wikimedia بأنه Public Domain كعمل حكومي فدرالي أمريكي؛ تبقى مسائل الصورة والخصوصية والاختلاف بين الولايات القضائية قائمة. أما `qa-artifacts/phase4/` فمصدر الوسائط وترخيصها غير محسومان من الملفات المتاحة، ولذلك يجب عدم شحنها تجاريًا دون إثبات إضافي أو استبدالها.

مقاطع Pexels المذكورة في وثائق اختبارات تتبع الوجه ليست ملفات متعقبة في Git، فلا تُعامل على أنها أصول مضمّنة. كما أن فيديو Waqa المرخص CC BY 3.0 موثق في وثائق مهمة سابقة، لكن وجود الوثيقة وحده لا يثبت أن كل ملف اختبار حالي مشتق منه.

## الإصلاحات المنفذة

أُضيف `LICENSE` مستقل بنطاق صريح يقتصر على الأجزاء التي يحق لصاحب المشروع ترخيصها، دون إعادة ترخيص مكونات الطرف الثالث. حُدّث `THIRD_PARTY_NOTICES.md` لربط كل مكون مهم بمسار استخدامه ومصدره الرسمي وشروطه، مع تسجيل الحالات غير المحسومة. أُضيف `ASSET_LICENSES.md` لتوثيق الخطوط والأيقونات والوسائط وحدود إعادة توزيعها. أُضيف `OWNERSHIP.md` لشرح ما يشتريه المشتري وما لا يشتريه. وأُضيف `docs/license-audit-package-inventory.md` لجرد كل التبعيات المباشرة وغير المباشرة التي حلها lockfile.

لم تُحذف أو تُستبدل أي مكتبة أو نموذج أو ميزة، ولم تُمنح رخصة للمكونات الخارجية. لم تُضمّن أوزان النماذج، ولم تُنشأ خدمة مدفوعة أو يُنشر الموقع.

## الفحوص بعد التعديل

- `pnpm install --frozen-lockfile --ignore-scripts` — نجح، وثبّت 741 حزمة فعلية وحلّل 707 إدخالات ترخيص.
- `pnpm check` — يجب تشغيله في بيئة التسليم؛ لم يطرأ تغيير على TypeScript أو runtime code في هذا التدقيق.
- `pnpm test` و`pnpm build` — لم تُعد دون سبب لأن التعديلات وثائقية فقط؛ تقارير القبول الحالية داخل المستودع تسجل نجاحها قبل هذا التدقيق.
- `git diff --check` — سيُعاد تشغيله بعد تثبيت الملفات النهائية.

## قرار التسليم للمشتري

يمكن تسليم الشيفرة الأصلية مع هذه الوثائق، بشرط تأكيد البائع ملكيته الفعلية، والمحافظة على إشعارات الطرف الثالث. لا يمكن تسليم `qa-artifacts/phase4/` بوصفه أصلًا تجاريًا آمنًا قبل حسم مصدره. ولا تنتقل حسابات Manus/Forge/GitHub أو مفاتيح OAuth أو خدمات AWS وقواعد البيانات إلى المشتري من خلال هذا المستودع.

هذا تقرير تدقيق مستندي وتقني، وليس رأيًا قانونيًا. تتغير بطاقات النماذج وشروط الخدمات، لذا يجب إعادة التحقق منها عند تاريخ التوزيع النهائي.

## References

[1]: https://huggingface.co/Xenova/whisper-base.en "Xenova Whisper Base English model card"
[2]: https://huggingface.co/Xenova/whisper-tiny "Xenova Whisper Tiny model card"
[3]: https://huggingface.co/onnx-community/opus-mt-en-ar "ONNX Community OPUS-MT English Arabic model card"
[4]: https://creativecommons.org/licenses/by/4.0/ "Creative Commons Attribution 4.0 International"
[5]: https://github.com/Vanilagy/mediabunny/blob/main/LICENSE "Mediabunny MPL-2.0 license"
[6]: https://github.com/huggingface/transformers.js/blob/main/LICENSE "Transformers.js Apache-2.0 license"
[7]: https://github.com/tensorflow/tfjs/blob/master/LICENSE "TensorFlow.js Apache-2.0 license"
[8]: https://lucide.dev/license "Lucide license"
[9]: https://fonts.google.com/faq "Google Fonts FAQ"
[10]: https://commons.wikimedia.org/wiki/File:BeyondGrowth_2023_Conference_-_Jason_Hickel_%28talk_on_degrowth_or_economics_beyond_%27GDP-growth%27%29.webm "Beyond Growth source video and CC BY 3.0 metadata"
[11]: https://commons.wikimedia.org/wiki/File:Raw_Video-_President_Obama_in_Omaha.webm "Obama source video and public-domain metadata"
