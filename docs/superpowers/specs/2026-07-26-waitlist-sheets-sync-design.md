# Waitlist → Google Sheet sync — design spec

**Date:** 2026-07-26
**Branch:** `feat/waitlist` (extends the existing waitlist Worker; ships in PR #2)
**Depends on:** the waitlist Worker (`worker/index.ts`) + `WAITLIST` KV binding already on this branch.

> **History:** originally spec'd as Sheets API v4 + service account (option 2). Pivoted to the **Google Apps Script webhook (option 1)** because the `replyomat.ai` Google org enforces `iam.disableServiceAccountKeyCreation` (Secure-by-Default) and the owner is locked out of org IAM — so no service-account key can be created there. Apps Script needs no key, no GCP project, and no org-policy change. This can be swapped back to the Sheets API later without touching the Worker's call site.

## Goal

Give someone **without Cloudflare account access** an always-current view of waitlist signups by mirroring each new signup into a shared **Google Sheet**. KV remains the durable source of truth; the Sheet is a convenience mirror the owner shares with a stakeholder (view/edit) who never touches Cloudflare.

## Decisions locked in

1. **Method:** Google **Apps Script Web App webhook** (not the Sheets API / service account).
2. **No new deps:** the Worker just does a `fetch` POST — no `jose`, no JWT, no crypto.
3. **No backfill:** start fresh from the next signup; existing KV rows (e.g. `malik.test`) are not pushed.
4. **Same branch:** implement on `feat/waitlist` (same Worker file), ships in PR #2.
5. KV stays source of truth; the Sheet append is best-effort and never affects the signup response.

## Architecture / data flow

```
signup → POST /api/waitlist  (worker/index.ts)
   1. parse + null-guard
   2. honeypot non-empty → silent 200 (no KV, no Sheet)
   3. waitlistSchema.safeParse → 400 on failure
   4. key = waitlist:<email>; if NOT already in KV:
        - KV.put(record)                              ← durable, unchanged
        - ctx.waitUntil( appendSignup(record, env) )  ← async, post-response
   5. return { ok: true }
                     │
                     ▼  (fetch POST, body = { secret, ...record })
   Apps Script Web App  (…/exec, "Anyone" access, secret-gated)
        - reject if body.secret !== SCRIPT_SECRET
        - SpreadsheetApp … Sheet1.appendRow([...])
                     │
                     ▼
   Shared Google Sheet fills in real time
```

- The append fires **only in the new-signup branch**, so the Sheet dedupes exactly as KV does (a repeat email is a KV hit → no put, no append).
- It runs inside **`ctx.waitUntil`**, so the user gets `{ok:true}` immediately and a slow/failed webhook never delays or fails the signup.
- `appendSignup` **never throws** to the caller — it catches internally and `console.error`s, so `waitUntil` gets a settled promise.

## Files

- **Create `worker/lib/sheets.ts`** — `appendSignup(record, env)`: config-guard + `fetch` POST to the webhook.
- **Modify `worker/index.ts`** — add `ctx: ExecutionContext` to `fetch`, extend `Env`, call the append via `waitUntil` in the new-signup branch.
- **Create `google-apps-script/waitlist-sheet.gs`** — the Apps Script `doPost` the owner pastes into their Sheet's Apps Script editor (committed as reference; not part of the Worker build).
- **Create `.dev.vars.example`** — committed template documenting the required local vars (no real values).
- **Modify `.gitignore`** — ensure `.dev.vars` is ignored (real local secrets).

(No `wrangler.jsonc` `vars` and no npm deps needed — both webhook values are secrets.)

## Worker append (`worker/lib/sheets.ts`)

- **Record → body:** POST JSON `{ secret: env.SHEETS_WEBHOOK_SECRET, submitted_at, name, business, email, locations, source, maps_url, consent }` to `env.SHEETS_WEBHOOK_URL`.
- **Config guard:** if `SHEETS_WEBHOOK_URL` or `SHEETS_WEBHOOK_SECRET` is missing, `console.warn` and return (feature degrades gracefully — signup still works locally/without setup).
- **Best-effort:** `fetch` follows Apps Script's 302→200 redirect by default; on a thrown error or non-2xx, `console.error` the status/body and do not rethrow.

## Apps Script (`google-apps-script/waitlist-sheet.gs`)

- `doPost(e)`: `JSON.parse(e.postData.contents)`; if `data.secret !== SCRIPT_SECRET` → return `{ok:false,error:"unauthorized"}`; else `SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1").appendRow([submitted_at, name, business, email, locations, source, maps_url, String(consent)])`; return `{ok:true}`. Wrap in try/catch returning `{ok:false,error}`.
- `SCRIPT_SECRET` is a constant at the top the owner sets to a random string (must match the Worker's `SHEETS_WEBHOOK_SECRET`).
- Column order (matches the row above): `submitted_at · name · business · email · locations · source · maps_url · consent`.
- Targets the tab named **`Sheet1`** (default first-tab name); documented in setup.

## Worker changes (`worker/index.ts`)

- Add minimal inline type: `interface ExecutionContext { waitUntil(p: Promise<unknown>): void }`.
- `Env` gains: `SHEETS_WEBHOOK_URL: string`, `SHEETS_WEBHOOK_SECRET: string` (may be empty when unconfigured).
- `fetch(request, env, ctx)` and pass `ctx` into `handleWaitlist`.
- In the `if (!existing)` block, after `KV.put`: `ctx.waitUntil(appendSignup(record, env))`.

## Secrets & config

- **Worker secrets** (never in git): `SHEETS_WEBHOOK_URL` (the `…/exec` URL), `SHEETS_WEBHOOK_SECRET` (the shared random string).
- **Local dev:** git-ignored `.dev.vars` holds the same two; `.dev.vars.example` (committed) documents them.

## Owner one-time setup (documented in the plan)

1. Create the Google Sheet; add a header row (`submitted_at, name, business, email, locations, source, maps_url, consent`); ensure the first tab is named **Sheet1**.
2. **Extensions → Apps Script** → paste `waitlist-sheet.gs` → set `SCRIPT_SECRET` to a random string.
3. **Deploy → New deployment → Web app** → *Execute as: Me*, *Who has access: Anyone* → Deploy → authorize → copy the **`/exec` URL**.
4. `wrangler secret put SHEETS_WEBHOOK_URL` (the `/exec` URL) and `wrangler secret put SHEETS_WEBHOOK_SECRET` (the same random string).
5. For local testing, put the same two in `.dev.vars`.
6. Share the Sheet with the stakeholder (view or edit).

## Verification

- `bun run build` clean (static site unaffected).
- `worker/lib/sheets.ts` compiles; the config-guard path means a signup with **no** webhook configured still returns `{ok:true}` and writes KV (verifiable via `wrangler dev --local`).
- **Script check (owner-run):** `curl -X POST <exec-url> -H 'content-type: application/json' -d '{"secret":"…","name":"Test","business":"B","email":"t@x.co","submitted_at":"…"}'` → a row appears in the Sheet; a wrong/missing secret → `{ok:false,error:"unauthorized"}` and no row.
- **Live check (owner-run):** with `.dev.vars` set, `wrangler dev`, submit a signup → new row appears, no `console` error.

## Out of scope

Backfilling existing KV rows, an in-app admin page, retry/queue on webhook failure, Sheet formatting, and multiple-sheet routing. KV remains the recovery source for any row the Sheet misses. (Swapping to the Sheets API later only changes `worker/lib/sheets.ts` + the secrets, not the call site.)
