import { describe, expect, it } from "vitest";
import {
  getAutoTranslationTarget,
  isCurrentCaptionRun,
} from "./caption-job";

describe("caption async run guard", () => {
  it("accepts only the active, non-aborted signal", () => {
    const controller = new AbortController();

    expect(isCurrentCaptionRun(4, 4, controller.signal, controller.signal)).toBe(
      true,
    );
  });

  it("rejects an older run after a newer run replaces it", () => {
    const oldController = new AbortController();
    const newController = new AbortController();

    expect(
      isCurrentCaptionRun(4, 5, oldController.signal, newController.signal),
    ).toBe(false);
  });

  it("rejects a run after its controller is aborted", () => {
    const controller = new AbortController();
    controller.abort();

    expect(isCurrentCaptionRun(4, 4, controller.signal, controller.signal)).toBe(
      false,
    );
  });

  it("uses the latest eligible target after transcription completes", () => {
    expect(
      getAutoTranslationTarget("transcribe-and-translate", "fr", "en"),
    ).toBe("fr");
  });

  it("does not start a stale translation when the latest mode is transcription only", () => {
    expect(getAutoTranslationTarget("transcribe-only", "ar", "en")).toBe(
      null,
    );
  });

  it("does not start a translation if the latest selection has no target", () => {
    expect(
      getAutoTranslationTarget("translate-only", "none", "en"),
    ).toBe(null);
  });

  it("keeps the unsupported source-language path from starting OPUS-MT", () => {
    expect(
      getAutoTranslationTarget("transcribe-and-translate", "de", "fr"),
    ).toBe(null);
  });
});
