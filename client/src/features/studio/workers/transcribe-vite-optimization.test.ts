import { describe, expect, it } from "vitest";
import viteConfig from "../../../../../vite.config";

describe("Vite dependency optimization for module workers", () => {
  it("pre-bundles Transformers.js before the first Whisper worker starts", () => {
    expect(viteConfig.optimizeDeps?.include).toContain(
      "@huggingface/transformers",
    );
  });
});
