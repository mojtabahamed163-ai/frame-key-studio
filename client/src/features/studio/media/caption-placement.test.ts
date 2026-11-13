import { describe, expect, it } from "vitest";
import { resolveCaptionPosition } from "./caption-placement";

describe("caption placement", () => {
  it("keeps the selected position when the tracked face is elsewhere", () => {
    expect(
      resolveCaptionPosition({
        preferred: "bottom",
        faceCenter: { x: 0.5, y: 0.28 },
      })
    ).toBe("bottom");
  });

  it("moves a caption away from a face only when necessary", () => {
    expect(
      resolveCaptionPosition({
        preferred: "bottom",
        faceCenter: { x: 0.5, y: 0.72 },
      })
    ).toBe("top");
    expect(
      resolveCaptionPosition({
        preferred: "top",
        faceCenter: { x: 0.5, y: 0.2 },
      })
    ).toBe("bottom");
  });
});
