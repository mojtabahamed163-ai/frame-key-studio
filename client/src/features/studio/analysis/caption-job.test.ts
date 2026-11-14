import { describe, expect, it } from "vitest";
import { isCurrentCaptionRun } from "./caption-job";

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
});
