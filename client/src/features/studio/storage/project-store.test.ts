import { afterEach, describe, expect, it, vi } from "vitest";
import { saveProject } from "./project-store";
import type { StudioProject } from "../types";

afterEach(() => vi.unstubAllGlobals());

describe("local project transactions", () => {
  it("does not resolve a save until the IndexedDB write transaction commits", async () => {
    const openRequest: { result?: unknown; onsuccess?: (() => void) | null; onerror?: (() => void) | null; onupgradeneeded?: (() => void) | null } = {};
    const writeRequest: { result?: unknown; error?: DOMException | null; onsuccess?: (() => void) | null; onerror?: (() => void) | null } = {};
    const transaction: {
      error: DOMException | null;
      oncomplete?: (() => void) | null;
      onabort?: (() => void) | null;
      onerror?: (() => void) | null;
      objectStore: () => { put: (value: unknown) => typeof writeRequest };
      abort: () => void;
    } = {
      error: null,
      objectStore: () => ({ put: () => writeRequest }),
      abort: vi.fn(),
    };
    const database = { transaction: vi.fn(() => transaction), close: vi.fn() };
    const indexedDb = { open: vi.fn(() => {
      queueMicrotask(() => {
        openRequest.result = database;
        openRequest.onsuccess?.();
      });
      return openRequest;
    }) };
    vi.stubGlobal("window", { indexedDB: indexedDb });
    vi.stubGlobal("indexedDB", indexedDb);

    let completed = false;
    const saving = saveProject({ id: "project-1", updatedAt: 1 } as StudioProject).then(() => { completed = true; });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(completed).toBe(false);

    writeRequest.result = "project-1";
    writeRequest.onsuccess?.();
    await Promise.resolve();
    expect(completed).toBe(false);

    transaction.oncomplete?.();
    await saving;
    expect(completed).toBe(true);
    expect(database.close).toHaveBeenCalledOnce();
  });
});
