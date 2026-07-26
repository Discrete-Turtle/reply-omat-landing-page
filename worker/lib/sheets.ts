/**
 * Best-effort mirror of a new signup into a Google Sheet via an Apps Script
 * Web App webhook. Called from the Worker's new-signup branch inside
 * `ctx.waitUntil`, so it runs after the response and never affects the
 * signup. No-ops when the webhook isn't configured.
 */
interface WaitlistRecord {
  name: string
  email: string
  business: string
  maps_url: string
  locations: string
  source: string
  consent: boolean
  submitted_at: string
}

interface SheetsEnv {
  SHEETS_WEBHOOK_URL?: string
  SHEETS_WEBHOOK_SECRET?: string
}

export async function appendSignup(record: WaitlistRecord, env: SheetsEnv): Promise<void> {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_WEBHOOK_SECRET) {
    console.warn("Sheets webhook not configured; skipping Sheet append")
    return
  }
  try {
    const res = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.SHEETS_WEBHOOK_SECRET, ...record }),
    })
    if (!res.ok) {
      console.error(`Sheets webhook returned ${res.status}: ${await res.text()}`)
    }
  } catch (err) {
    console.error("Sheets webhook request failed:", err)
  }
}
