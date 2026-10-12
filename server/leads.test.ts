import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createLeadHandler, type LeadSubmission } from "./leads";

function makeRequest(body: unknown, ip = "test-ip") {
  return { body, ip } as Request;
}

function makeResponse() {
  let statusCode = 200;
  let body: unknown;
  const headers: Record<string, string> = {};
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; return this; },
    setHeader(name: string, value: string) { headers[name] = value; return this; },
  } as unknown as Response;
  return { response, get statusCode() { return statusCode; }, get body() { return body; }, headers };
}

const validPayload = {
  fullName: "Alex Morgan",
  email: "ALEX@example.com",
  role: "agent",
  message: "I record weekly property walk-throughs and need short edits.",
  website: "",
};

async function invoke(handler: ReturnType<typeof createLeadHandler>, body: unknown, ip?: string) {
  const req = makeRequest(body, ip) as Parameters<typeof handler>[0];
  const resState = makeResponse();
  await handler(req, resState.response, (() => undefined) as never);
  return resState;
}

describe("public lead inquiry", () => {
  it("saves a valid inquiry and normalizes its email before replying", async () => {
    const saveLead = vi.fn<(lead: Omit<LeadSubmission, "website">) => Promise<void>>().mockResolvedValue();
    const notifyOwner = vi.fn<(lead: Omit<LeadSubmission, "website">) => Promise<void>>().mockResolvedValue();
    const handler = createLeadHandler({ saveLead, notifyOwner, buckets: new Map() });

    const response = await invoke(handler, validPayload);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ ok: true });
    expect(saveLead).toHaveBeenCalledWith(expect.objectContaining({ email: "alex@example.com" }));
    expect(notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid fields without saving", async () => {
    const saveLead = vi.fn().mockResolvedValue(undefined);
    const notifyOwner = vi.fn().mockResolvedValue(undefined);
    const handler = createLeadHandler({ saveLead, notifyOwner, buckets: new Map() });

    const response = await invoke(handler, { ...validPayload, email: "not-an-email" });

    expect(response.statusCode).toBe(400);
    expect(saveLead).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("silently ignores the honeypot and does not store or notify", async () => {
    const saveLead = vi.fn().mockResolvedValue(undefined);
    const notifyOwner = vi.fn().mockResolvedValue(undefined);
    const handler = createLeadHandler({ saveLead, notifyOwner, buckets: new Map() });

    const response = await invoke(handler, { ...validPayload, website: "spam.example" });

    expect(response.statusCode).toBe(202);
    expect(saveLead).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("returns a controlled error when persistence fails", async () => {
    const saveLead = vi.fn().mockRejectedValue(new Error("database unavailable"));
    const notifyOwner = vi.fn().mockResolvedValue(undefined);
    const handler = createLeadHandler({ saveLead, notifyOwner, buckets: new Map() });

    const response = await invoke(handler, validPayload);

    expect(response.statusCode).toBe(503);
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("keeps a saved inquiry successful if the owner notification is unavailable", async () => {
    const saveLead = vi.fn().mockResolvedValue(undefined);
    const notifyOwner = vi.fn().mockRejectedValue(new Error("notification unavailable"));
    const handler = createLeadHandler({ saveLead, notifyOwner, buckets: new Map() });

    const response = await invoke(handler, validPayload);

    expect(response.statusCode).toBe(201);
    expect(saveLead).toHaveBeenCalledTimes(1);
  });
});
