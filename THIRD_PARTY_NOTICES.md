# إشعارات البرمجيات والنماذج الخارجية

يستخدم Frame & Key Studio هذه الحزم والنماذج في وظائف الاستوديو المحلي. لا تُرسل ملفات المستخدم أو التفريغ أو المقاطع إلى خدمة استدلال. أوزان النماذج لا تُضمّن في المستودع؛ تُحمّل من مستودعاتها العامة عند اختيار الوظيفة، وقد يستهلك ذلك اتصال المستخدم ومساحة تخزين المتصفح.

## الحزم

- **Mediabunny 1.61.4 — MPL-2.0.** حقوق النشر ومصدر الشيفرة متاحان في [مستودع Mediabunny](https://github.com/Vanilagy/mediabunny). لا تُعدّل ملفات المكتبة داخل المشروع. يُرجى مراجعة نص الرخصة الكامل في المستودع عند إعادة توزيع النسخة.
- **Transformers.js 4.3.1 — Apache-2.0.** [مستودع Transformers.js](https://github.com/huggingface/transformers.js).
- **TensorFlow.js وFace Detection — Apache-2.0.** تشمل الإصدارات المستخدمة `@tensorflow-models/face-detection` 1.0.3 وحزم `@tensorflow/tfjs-*` 4.22.0. [مصدر TensorFlow.js Models](https://github.com/tensorflow/tfjs-models).
- **fflate 0.8.3 — MIT.** [مستودع fflate](https://github.com/101arrowz/fflate).

## النماذج

- **Whisper Tiny ONNX (`Xenova/whisper-tiny`) — Apache-2.0.** بطاقة النموذج وبيانات Hugging Face تعلنان هذه الرخصة وتحددان `openai/whisper-tiny` نموذجًا أساسيًا. أوزان ONNX التي يستخدمها إعداد `q8` تقارب 41 مليون بايت إجمالًا، قبل ملفات الإعداد والمعالجة الصوتية. لا يبدأ تنزيلها إلا عند تشغيل التفريغ. [بطاقة Xenova](https://huggingface.co/Xenova/whisper-tiny)، [بيانات الرخصة والملفات](https://huggingface.co/api/models/Xenova/whisper-tiny)، [بطاقة Whisper Tiny الأصلية](https://huggingface.co/openai/whisper-tiny).
- **Helsinki-NLP OPUS-MT English→French, English→Spanish, English→German — CC BY 4.0.** بطاقات ملفات ONNX تذكر نموذج Helsinki-NLP الأصلي، وتعلن CC BY 4.0. الترجمة اختيارية وتعمل محليًا عبر WASM/CPU بإعداد Q8، دون اشتراط WebGPU؛ تبلغ ملفات وزن زوج المشفّر/المفكك نحو 214.5–234.8 MiB بحسب اللغة، قبل ملفات الإعداد والمعالجة. يُحمّل نموذج لغة واحدة عند طلب الترجمة. الإسناد: نماذج OPUS-MT من Helsinki-NLP، موزعة وفق CC BY 4.0؛ راجع البطاقة الخاصة باللغة قبل إعادة توزيع النموذج أو المخرجات. [French](https://huggingface.co/onnx-community/opus-mt-en-fr)، [Spanish](https://huggingface.co/onnx-community/opus-mt-en-es)، [German](https://huggingface.co/onnx-community/opus-mt-en-de)، [نص رخصة CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **MediaPipe Face Detection short-range** — يستخدم عبر حزمة Face Detection المرخصة Apache-2.0؛ يُستدعى عند اختيار تتبع الوجه، ويمكن الاستمرار بالقص اليدوي. [دليل النموذج](https://github.com/tensorflow/tfjs-models/blob/master/face-detection/README.md).

قد تتغير المستودعات العامة أو أحجام ملفاتها أو شروط إتاحتها لاحقًا. تحقق من البطاقات والرخص الحالية قبل إعادة توزيع ملفات النماذج أو استخدامها تجاريًا.
