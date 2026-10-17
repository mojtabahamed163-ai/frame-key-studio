export interface WorkerProtocolMessage {
  jobId: string;
  type: string;
  message?: string;
}

export interface WorkerRequestOptions<T extends WorkerProtocolMessage> {
  signal?: AbortSignal;
  onProgress?: (message: T) => void;
  terminateOnResult?: boolean;
}

export function requestWorkerResult<T extends WorkerProtocolMessage>(
  worker: Worker,
  jobId: string,
  send: () => void,
  options: WorkerRequestOptions<T> = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.removeEventListener("messageerror", handleMessageError);
      options.signal?.removeEventListener("abort", handleAbort);
    };
    const fail = (error: Error, terminate = true) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (terminate) worker.terminate();
      reject(error);
    };
    const handleAbort = () => fail(new DOMException("Worker operation cancelled.", "AbortError"));
    const handleError = (event: Event) => {
      event.preventDefault();
      const message = "message" in event && typeof event.message === "string" ? event.message : "The local worker stopped unexpectedly.";
      fail(new Error(message));
    };
    const handleMessageError = () => fail(new Error("The local worker returned an unreadable message."));
    const handleMessage = (event: MessageEvent<T>) => {
      const data = event.data;
      if (!data || data.jobId !== jobId) return;
      if (data.type === "model-progress" || data.type === "progress") {
        try { options.onProgress?.(data); }
        catch (cause) { fail(cause instanceof Error ? cause : new Error("Could not update worker progress.")); }
        return;
      }
      if (data.type === "error") {
        fail(new Error(data.message ?? "The local worker operation failed."));
        return;
      }
      settled = true;
      cleanup();
      if (options.terminateOnResult) worker.terminate();
      resolve(data);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.addEventListener("messageerror", handleMessageError);
    options.signal?.addEventListener("abort", handleAbort, { once: true });
    if (options.signal?.aborted) {
      handleAbort();
      return;
    }
    try { send(); }
    catch (cause) { fail(cause instanceof Error ? cause : new Error("Could not send a request to the local worker.")); }
  });
}
