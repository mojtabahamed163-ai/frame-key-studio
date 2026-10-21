import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./promise-timeout";

afterEach(() => vi.useRealTimers());

describe("withTimeout", () => {
  it("rejects a stalled model load with the actionable timeout message", async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<never>(() => undefined), 120_000, "Model download timed out.");
    const rejection = expect(result).rejects.toThrow("Model download timed out.");
    await vi.advanceTimersByTimeAsync(120_000);
    await rejection;
  });

  it("returns a successful result and clears the timer", async () => {
    vi.useFakeTimers();
    await expect(withTimeout(Promise.resolve("ready"), 120_000, "Model download timed out.")).resolves.toBe("ready");
    expect(vi.getTimerCount()).toBe(0);
  });
});
