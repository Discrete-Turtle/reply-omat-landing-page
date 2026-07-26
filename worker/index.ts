/**
 * Front-of-assets Worker. Only POST /api/waitlist is handled here; every
 * other request is delegated to the static assets binding, so the Astro
 * site's routing is unchanged. Writes signups to the WAITLIST KV namespace.
 */
interface Env {
  WAITLIST: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

async function handleWaitlist(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400)
  }

  const str = (v: unknown) => (typeof v === "string" ? v : "")

  // Honeypot: bots fill the hidden field. Absorb silently with a 200 so
  // they get no signal, and never touch KV.
  if (str(body.company_website).trim() !== "") {
    return json({ ok: true })
  }

  const name = str(body.name).trim()
  const email = str(body.email).trim().toLowerCase()
  const business = str(body.business).trim()
  const consent = body.consent === true

  if (!name || !business || !EMAIL_RE.test(email) || !consent) {
    return json({ ok: false, error: "Please complete the required fields." }, 400)
  }

  const record = {
    name,
    email,
    business,
    maps_url: str(body.maps_url).trim(),
    locations: str(body.locations),
    source: str(body.source),
    consent: true,
    submitted_at: new Date().toISOString(),
  }

  // Idempotent dedupe: one record per email; a repeat submit still returns
  // ok (don't leak whether they already signed up).
  const key = `waitlist:${email}`
  const existing = await env.WAITLIST.get(key)
  if (!existing) {
    await env.WAITLIST.put(key, JSON.stringify(record))
  }

  return json({ ok: true })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}
