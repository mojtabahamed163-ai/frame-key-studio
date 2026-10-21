import { describe, expect, it } from "vitest";
import { formatEditableTime } from "./clip-time";

describe("editable clip time formatting", () => {
  it("preserves boundary precision instead of rounding 1.75 to an invalid 1.8", () => {
    expect(formatEditableTime(1.75)).toBe("1.75");
    expect(formatEditableTime(2)).toBe("2.00");
  });

  it("clamps non-finite values to a safe display value", () => {
    expect(formatEditableTime(Number.NaN)).toBe("0.00");
    expect(formatEditableTime(-1)).toBe("0.00");
  });
});
