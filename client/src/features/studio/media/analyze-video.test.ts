import { describe, expect, it } from "vitest";
import { nextSampleWithAbort } from "./analyze-video";

describe("abortable media sample reads", () => {
  it("rejects immediately when analysis is already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    const iterator: AsyncIterator<number> = { next: async () => ({ done: false, value: 1 }) };
    await expect(nextSampleWithAbort(iterator, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });

  it("stops waiting for a slow source when analysis is cancelled", async () => {
    const controller = new AbortController();
    let resolveNext: ((result: IteratorResult<number>) => void) | undefined;
    const iterator: AsyncIterator<number> = {
      next: () => new Promise<IteratorResult<number>>((resolve) => { resolveNext = resolve; }),
    };
    const pending = nextSampleWithAbort(iterator, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    resolveNext?.({ done: true, value: undefined });
  });

  it("returns the next sample and removes the abort listener", async () => {
    const controller = new AbortController();
    const iterator: AsyncIterator<number> = { next: async () => ({ done: false, value: 7 }) };
    await expect(nextSampleWithAbort(iterator, controller.signal)).resolves.toEqual({ done: false, value: 7 });
    controller.abort();
  });
});
