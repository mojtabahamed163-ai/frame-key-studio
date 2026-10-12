/// <reference lib="webworker" />
import { pipeline } from "@huggingface/transformers";

const MODELS: Record<string, string> = {
  fr: "onnx-community/opus-mt-en-fr",
  es: "onnx-community/opus-mt-en-es",
  de: "onnx-community/opus-mt-en-de",
};
type TranslationResult = Array<{ translation_text?: string }>;
type TranslationPipeline = (text: string, options: Record<string, unknown>) => Promise<TranslationResult>;
let translator: TranslationPipeline | null = null;
let activeLanguage = "";

interface TranslateRequest { jobId: string; language: "fr" | "es" | "de"; texts: string[] }

self.onmessage = async (event: MessageEvent<TranslateRequest>) => {
  const { jobId, language, texts } = event.data;
  try {
    const model = MODELS[language];
    if (!model) throw new Error("Choose French, Spanish, or German for this local translation model.");
    if (!translator || activeLanguage !== language) {
      translator = await pipeline("translation", model, {
        dtype: "q8",
        progress_callback: (progress: { status?: string; progress?: number; file?: string }) => {
          self.postMessage({ jobId, type: "model-progress", status: progress.status ?? "loading", progress: progress.progress ?? 0, file: progress.file ?? "" });
        },
      }) as unknown as TranslationPipeline;
      activeLanguage = language;
    }
    const translated: string[] = [];
    for (let index = 0; index < texts.length; index += 1) {
      const output = await translator(texts[index], { max_new_tokens: 180 });
      translated.push(output[0]?.translation_text?.trim() ?? "");
      self.postMessage({ jobId, type: "progress", completed: index + 1, total: texts.length });
    }
    self.postMessage({ jobId, type: "result", translated });
  } catch (error) {
    self.postMessage({ jobId, type: "error", message: error instanceof Error ? error.message : "Translation could not run in this browser. You can import an SRT/VTT instead." });
  }
};
