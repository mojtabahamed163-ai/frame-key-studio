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
    ).toBe("middle");
  });

  it("keeps the previous safe position instead of oscillating as a face moves", () => {
    expect(
      resolveCaptionPosition({
        preferred: "bottom",
        previousPosition: "top",
        faceCenter: { x: 0.5, y: 0.5 },
      })
    ).toBe("top");
  });

  it("moves from the previous zone when the face makes it unsafe", () => {
    expect(
      resolveCaptionPosition({
        preferred: "bottom",
        previousPosition: "top",
        faceCenter: { x: 0.5, y: 0.2 },
      })
    ).toBe("middle");
  });
});
