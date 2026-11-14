# إشعارات البرمجيات والنماذج الخارجية

هذا الملف يصف المكونات الخارجية التي يفحصها المشروع أو يستخدمها في البناء والتشغيل. لا تمنح رخصة المشروع ملكية هذه المكونات، ولا تنقلها إلى المشتري حصريًا. عند توزيع نسخة من المنتج يجب إبقاء إشعارات هذه المكونات وشروطها ذات الصلة.

## مكونات التشغيل المهمة

- **Mediabunny 1.61.4 — MPL-2.0.** مستخدم فعليًا في قراءة الوسائط والتصدير في `client/src/features/studio/media/analyze-video.ts` و`client/src/features/studio/export/convert-clip.ts`. تسمح MPL بالاستخدام التجاري وتوزيع العمل الأكبر، لكنها تشترط إبقاء إشعارات الترخيص وإتاحة مصدر ملفات MPL المغطاة وتعديلات تلك الملفات عند توزيعها. لم تُعدّل ملفات Mediabunny داخل هذا المستودع. [المصدر الرسمي](https://github.com/Vanilagy/mediabunny) · [نص الترخيص](https://github.com/Vanilagy/mediabunny/blob/main/LICENSE).
- **Transformers.js 4.3.1 — Apache-2.0.** مستخدم في عاملي Whisper والترجمة عبر `client/src/features/studio/workers/transcribe.worker.ts` و`client/src/features/studio/workers/translate.worker.ts`. الاستخدام التجاري وإعادة التوزيع مسموحان مع الاحتفاظ بنص الترخيص وإشعارات حقوق النشر وأي `NOTICE` ذي صلة. [المصدر](https://github.com/huggingface/transformers.js) · [الترخيص](https://github.com/huggingface/transformers.js/blob/main/LICENSE).
- **TensorFlow.js 4.22.0 وFace Detection 1.0.3 — Apache-2.0.** مستخدمان لمسار تتبع الوجه، مع `@mediapipe/face_detection` الذي يصل عبر الاعتماديات. الاستخدام التجاري وإعادة التوزيع مسموحان وفق Apache-2.0 مع إبقاء الإشعارات. [TensorFlow.js license](https://github.com/tensorflow/tfjs/blob/master/LICENSE) · [tfjs-models](https://github.com/tensorflow/tfjs-models).
- **Lucide React 0.453.0 — ISC، مع أيقونات مشتقة من Feather تحت MIT.** مستخدم في واجهات React في `client/src/**/*.tsx`. يلزم إبقاء إشعار ISC؛ وبالنسبة للأيقونات المشتقة من Feather يلزم إبقاء إشعار MIT عند انطباقه. [الترخيص الرسمي](https://lucide.dev/license).
- **fflate 0.8.3 — MIT.** مستخدم لإنشاء حزم ZIP في مسار التنزيل. [المصدر](https://github.com/101arrowz/fflate).
- **حزم Radix UI وReact وReact DOM وReact Hook Form وTanStack Query وTRPC وVite وTailwind وغيرها:** الحزم المباشرة والاعتماديات غير المباشرة مفهرسة حسب النسخة والرخصة في `docs/license-audit-package-inventory.md`. الغالبية MIT أو Apache-2.0، وتوجد عائلات BSD وISC و0BSD وUnlicense وBlueOak وشروط متعددة يجب عدم إسقاطها.

## النماذج التي ينزلها التطبيق وقت التشغيل

الأوزان غير مضمّنة في Git. ينزلها المتصفح من Hugging Face عند اختيار الوظيفة، ولذلك يجب على أي موزع الحفاظ على روابط المصدر والإشعارات وعدم تقديم الأوزان كملكية حصرية للمشروع.

- **Whisper Base English — `Xenova/whisper-base.en`.** الإصدار/المعرّف الفعلي المستخدم في `client/src/features/studio/workers/transcribe.worker.ts` هو هذا المستودع، ورخصة بطاقة النموذج الحالية Apache-2.0. بطاقة النموذج تربطه بنموذج `openai/whisper-base.en` وتوضح أنه تحويل ONNX للاستخدام مع Transformers.js. [بطاقة النموذج](https://huggingface.co/Xenova/whisper-base.en) · [الملفات وبيانات النموذج](https://huggingface.co/api/models/Xenova/whisper-base.en).
- **Whisper Tiny — `Xenova/whisper-tiny`.** هو المسار متعدد اللغات الفعلي في الملف نفسه، ورخصة بطاقة النموذج الحالية Apache-2.0، مع الإشارة إلى `openai/whisper-tiny` كنموذج أساس. [بطاقة النموذج](https://huggingface.co/Xenova/whisper-tiny) · [الملفات وبيانات النموذج](https://huggingface.co/api/models/Xenova/whisper-tiny).
- **OPUS-MT المحوّل إلى ONNX — `onnx-community/opus-mt-en-ar`, `onnx-community/opus-mt-en-fr`, `onnx-community/opus-mt-en-es`, `onnx-community/opus-mt-en-de`.** هذه هي المعرّفات الفعلية في `client/src/features/studio/workers/translate.worker.ts`. بطاقات ONNX الحالية تعلن CC BY 4.0 وتشير إلى نماذج Helsinki-NLP المقابلة. CC BY 4.0 تسمح بالاستخدام التجاري وإعادة التوزيع والتعديل، بشرط النسب، ورابط الترخيص، وبيان التعديلات، وعدم الإيحاء بالتأييد. [بطاقة العربية](https://huggingface.co/onnx-community/opus-mt-en-ar) · [بطاقة الفرنسية](https://huggingface.co/onnx-community/opus-mt-en-fr) · [بطاقة الإسبانية](https://huggingface.co/onnx-community/opus-mt-en-es) · [بطاقة الألمانية](https://huggingface.co/onnx-community/opus-mt-en-de) · [نص CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

ملاحظة مهمة: رخصة حزمة التشغيل، مثل Transformers.js، لا تحل محل رخصة وزن النموذج. يجب فحص بطاقة النموذج نفسها عند كل عملية إعادة توزيع.

## الحزم التي كانت Unknown وحُسمت

- `@builder.io/vite-plugin-jsx-loc@0.1.1` تبعية تطوير مباشرة في `vite.config.ts`. صفحة npm الرسمية للإصدار تذكر MIT في README، وتصف الحزمة بأنها أداة تطوير لإضافة مواقع JSX، لذلك يسمح استخدامها التجاري وإعادة توزيعها وفق MIT مع إبقاء الإشعار. [صفحة npm الرسمية](https://www.npmjs.com/package/%40builder.io/vite-plugin-jsx-loc).
- `@builder.io/jsx-loc-internals@0.0.1` تبعية تطوير غير مباشرة للحزمة السابقة. صفحة npm الرسمية للإصدار تذكر MIT وتوضح أنها مكتبة داخلية للتحويل، لذلك يسمح استخدامها التجاري وإعادة توزيعها وفق MIT مع إبقاء الإشعار. [صفحة npm الرسمية](https://www.npmjs.com/package/%40builder.io/jsx-loc-internals).
- `khroma@2.1.0` تبعية إنتاج غير مباشرة عبر `streamdown` ثم `mermaid`. ملف `license` المثبت في وسم `v2.1.0` من المستودع الرسمي هو MIT، ويشمل الاستخدام التجاري وإعادة التوزيع مع إبقاء إشعار MIT. [ملف الترخيص الرسمي للإصدار](https://github.com/fabiospampinato/khroma/blob/v2.1.0/license).

هذه الحزم الثلاث لم تعد حالات ترخيص غير محسومة؛ بقيت في الشجرة لأن وظائفها مطلوبة، ولم تُستبدل أو تُحذف.
- ظهر `@img/sharp-libvips-*` تحت LGPL-3.0-or-later ضمن شجرة الاعتماديات. لم يجد التدقيق استيرادًا مباشرًا لـ`sharp` في كود المنتج؛ يبقى وجوده في بيئة التثبيت مسألة منفصلة عن مخرجات المتصفح، ويجب عدم شحن `node_modules` بلا جرد مناسب.
- لا توجد رسوم أو اشتراكات نموذجية لازمة لمسار التحرير المحلي وفق الكود المفحوص. تبقى خدمات Manus/Forge وOAuth والتخزين وAWS وقاعدة البيانات إعدادات تشغيل خارجية، وليست أصولًا أو تراخيص ينقلها هذا المستودع إلى المشتري.
