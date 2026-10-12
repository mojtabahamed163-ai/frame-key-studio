import type { Express, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { leads } from "../drizzle/schema";
import { getDb } from "./db";

export const leadSubmissionSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  role: z.enum(["agent", "investor-educator", "brokerage-team", "other"]),
  message: z.string().trim().min(10).max(1200),
  website: z.string().max(250).optional().default(""),
}).strict();

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
type PersistedLead = Omit<LeadSubmission, "website">;

type LeadHandlerDependencies = {
  saveLead: (lead: PersistedLead) => Promise<void>;
  notifyOwner: (lead: PersistedLead) => Promise<void>;
  now?: () => number;
  buckets?: Map<string, number[]>;
};

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const defaultBuckets = new Map<string, number[]>();

function isRateLimited(ip: string, now: number, buckets: Map<string, number[]>) {
  const recent = (buckets.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    buckets.set(ip, recent);
    return true;
  }
  recent.push(now);
  buckets.set(ip, recent);
  if (buckets.size > 500) {
    for (const [key, values] of buckets) {
      if (!values.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) buckets.delete(key);
    }
  }
  return false;
}

export function createLeadHandler(dependencies: LeadHandlerDependencies): RequestHandler {
  const now = dependencies.now ?? Date.now;
  const buckets = dependencies.buckets ?? defaultBuckets;

  return async (req: Request, res: Response) => {
    const raw = req.body as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return res.status(400).json({ error: "Please check the required fields and try again." });
    }

    // Quietly accept the honeypot without saving or notifying about bot submissions.
    if (typeof raw.website === "string" && raw.website.trim().length > 0) {
      return res.status(202).json({ ok: true });
    }

    const parsed = leadSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please check the required fields and try again." });
    }

    const ip = req.ip || "unknown";
    if (isRateLimited(ip, now(), buckets)) {
      res.setHeader("Retry-After", "600");
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const { website: _honeypot, ...lead } = parsed.data;
    try {
      await dependencies.saveLead(lead);
    } catch (error) {
      console.error("[Leads] Could not save inquiry", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "We couldn't save your request right now. Please try again shortly." });
    }

    try {
      await dependencies.notifyOwner(lead);
    } catch (error) {
      // The inquiry is already saved; a notification outage must not lose it or block success.
      console.warn("[Leads] Owner notification failed", error instanceof Error ? error.message : "unknown error");
    }

    return res.status(201).json({ ok: true });
  };
}

async function saveLead(lead: PersistedLead) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is unavailable");
  await db.insert(leads).values({
    fullName: lead.fullName,
    email: lead.email,
    role: lead.role,
    message: lead.message,
  });
}

async function notifyOwner(lead: PersistedLead) {
  const apiUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiUrl || !apiKey) throw new Error("Owner notification service is not configured");

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/webdevtoken.v1.WebDevService/SendNotification`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "connect-protocol-version": "1",
    },
    body: JSON.stringify({
      title: "New Frame & Key inquiry",
      content: `Name: ${lead.fullName}\nEmail: ${lead.email}\nType: ${lead.role}\n\nRequest:\n${lead.message}`,
    }),
  });

  const result = await response.json().catch(() => ({})) as { error?: unknown };
  if (!response.ok || result.error) throw new Error(`Owner notification returned HTTP ${response.status}`);
}

export function registerLeadRoutes(app: Express) {
  app.post("/api/leads", createLeadHandler({ saveLead, notifyOwner }));
}
