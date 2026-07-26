/**
 * Shared waitlist validation — single source of truth for BOTH the client
 * form island (per-field error messages) and the Cloudflare Worker
 * (`POST /api/waitlist` server revalidation). Built on `zod/mini` (the
 * tree-shakable functional Zod build) so the page bundle stays small.
 *
 * The schema also normalizes: strings are trimmed and email lowercased, so
 * the Worker stores `parsed.data` directly. The honeypot (`company_website`)
 * is intentionally NOT part of this schema — zod strips unknown keys, and
 * the Worker handles the honeypot separately before parsing.
 */
import * as z from "zod/mini"

// Kept identical to the original hand-rolled check so behaviour is unchanged.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allowed segmented-picker values. "" is permitted (source's "Choose one"
// default, and a defensive allowance for locations). The location buckets
// align with the landing pricing tiers — 1 (Starter) / 2-3 (Yearly, ≤3) /
// 4-5 (Lifetime, ≤5) / 6+ (agency plan, >5).
export const LOCATIONS = ["", "1", "2-3", "4-5", "6+"] as const
export const SOURCES = ["", "search", "social", "friend", "event", "other"] as const

export const waitlistSchema = z.object({
  name: z
    .string()
    .check(z.trim(), z.minLength(1, "Please tell us your name."), z.maxLength(200)),
  email: z
    .string()
    .check(
      z.trim(),
      z.toLowerCase(),
      z.maxLength(254),
      z.regex(EMAIL_RE, "Enter a valid email address.")
    ),
  business: z
    .string()
    .check(z.trim(), z.minLength(1, "Please tell us your business name."), z.maxLength(200)),
  maps_url: z.optional(z.string().check(z.trim(), z.maxLength(2048))),
  locations: z.optional(z.enum(LOCATIONS)),
  source: z.optional(z.enum(SOURCES)),
  // Optional marketing opt-in (product updates) — NOT a required gate. The
  // invite email is transactional; ticking this opts into updates too.
  consent: z.optional(z.boolean()),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>

// The required fields that surface a message in the UI. Maps a failed
// parse's issues to `{ field: message }`, keeping only the first issue per
// field. Consent is optional, so it never appears here.
const MESSAGE_FIELDS = ["name", "email", "business"] as const
export type WaitlistFieldErrors = Partial<Record<(typeof MESSAGE_FIELDS)[number], string>>

export function fieldMessages(issues: readonly { path: PropertyKey[]; message: string }[]): WaitlistFieldErrors {
  const out: WaitlistFieldErrors = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if ((key === "name" || key === "email" || key === "business") && !(key in out)) {
      out[key] = issue.message
    }
  }
  return out
}
