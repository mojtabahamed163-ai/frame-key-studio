import { describe, expect, it, vi } from "vitest";
import { requestWorkerResult } from "./worker-request";

class FakeWorker extends EventTarget {
  terminated = false;
  onSend: (() => void) | null = null;
  postMessage() { this.onSend?.(); }
  terminate() { this.terminated = true; }
}

const request = (worker: FakeWorker, signal?: AbortSignal) => requestWorkerResult<{ jobId: string; type: string; message?: string }>(
  worker as unknown as Worker,
  "job-1",
  () => worker.postMessage(),
  { signal },
);

describe("worker request failure handling", () => {
  it("rejects on a worker runtime error and terminates the crashed worker", async () => {
    const worker = new FakeWorker();
    worker.onSend = () => queueMicrotask(() => {
      const event = Object.assign(new Event("error"), { message: "model crashed" });
      worker.dispatchEvent(event);
    });

    await expect(request(worker)).rejects.toThrow("model crashed");
    expect(worker.terminated).toBe(true);
  });

  it("rejects on an unreadable message and terminates the worker", async () => {
    const worker = new FakeWorker();
    worker.onSend = () => queueMicrotask(() => worker.dispatchEvent(new Event("messageerror")));

    await expect(request(worker)).rejects.toThrow("unreadable message");
    expect(worker.terminated).toBe(true);
  });

  it("cleans up and terminates when postMessage throws", async () => {
    const worker = new FakeWorker();
    const spy = vi.spyOn(worker, "terminate");
    await expect(requestWorkerResult(worker as unknown as Worker, "job-1", () => { throw new Error("clone failed"); }))
      .rejects.toThrow("clone failed");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("terminates on abort instead of leaving the caller pending", async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    worker.onSend = () => controller.abort();

    await expect(request(worker, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminated).toBe(true);
  });

  it("does not terminate a reusable worker after a successful result unless requested", async () => {
    const worker = new FakeWorker();
    worker.onSend = () => queueMicrotask(() => worker.dispatchEvent(new MessageEvent("message", { data: { jobId: "job-1", type: "result" } })));

    await expect(request(worker)).resolves.toMatchObject({ jobId: "job-1", type: "result" });
    expect(worker.terminated).toBe(false);
  });
});
