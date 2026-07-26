/**
 * Front-of-assets Worker. Only POST /api/waitlist is handled here; every
 * other request is delegated to the static assets binding, so the Astro
 * site's routing is unchanged. Writes signups to the WAITLIST KV namespace.
 *
 * Field validation + normalization is the shared `waitlistSchema` (zod/mini),
 * the same schema the client form island uses — one source of truth.
 */
import { waitlistSchema } from "../src/lib/waitlist-schema"
import { appendSignup } from "./lib/sheets"

interface Env {
  WAITLIST: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
  ASSETS: { fetch(request: Request): Promise<Response> }
  SHEETS_WEBHOOK_URL?: string
  SHEETS_WEBHOOK_SECRET?: string
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

async function handleWaitlist(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400)
  }

  if (typeof body !== "object" || body === null) {
    return json({ ok: false, error: "Invalid request." }, 400)
  }

  // Honeypot: bots fill the hidden field. Absorb silently with a 200 so
  // they get no signal, and never touch KV. (Not part of the schema — zod
  // strips unknown keys, so this must be checked on the raw body first.)
  const honeypot = (body as { company_website?: unknown }).company_website
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return json({ ok: true })
  }

  // Shared schema: validates lengths/enums/email/consent AND normalizes
  // (trims strings, lowercases email). `parsed.data` is the storable record.
  const parsed = waitlistSchema.safeParse(body)
  if (!parsed.success) {
    return json({ ok: false, error: "Please complete the required fields." }, 400)
  }

  const d = parsed.data
  const record = {
    name: d.name,
    email: d.email,
    business: d.business,
    maps_url: d.maps_url ?? "",
    locations: d.locations ?? "",
    source: d.source ?? "",
    consent: d.consent ?? false,
    submitted_at: new Date().toISOString(),
  }

  // Idempotent dedupe: one record per email; a repeat submit still returns
  // ok (don't leak whether they already signed up).
  const key = `waitlist:${d.email}`
  const existing = await env.WAITLIST.get(key)
  if (!existing) {
    await env.WAITLIST.put(key, JSON.stringify(record))
    // Best-effort mirror to the Google Sheet — after the response, never
    // blocking or failing the signup (KV is the source of truth).
    ctx.waitUntil(appendSignup(record, env))
  }

  return json({ ok: true })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env, ctx)
    }
    return env.ASSETS.fetch(request)
  },
}
