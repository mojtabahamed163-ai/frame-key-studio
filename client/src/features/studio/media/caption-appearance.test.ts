import { describe, expect, it } from "vitest";
import {
  captionStrokePixels,
  clampCaptionStrokeWidth,
  safeCaptionColor,
} from "./caption-appearance";

describe("caption appearance settings", () => {
  it("accepts only six-digit hex colors and falls back safely", () => {
    expect(safeCaptionColor("#39D353", "#FFFFFF")).toBe("#39D353");
    expect(safeCaptionColor("red", "#FFFFFF")).toBe("#FFFFFF");
    expect(safeCaptionColor(undefined, "#000000")).toBe("#000000");
  });

  it("clamps the user stroke setting and scales it for export height", () => {
    expect(clampCaptionStrokeWidth(-2)).toBe(0);
    expect(clampCaptionStrokeWidth(40)).toBe(10);
    expect(captionStrokePixels({ captionStrokeWidth: 3 }, 1440)).toBe(6);
  });
});
