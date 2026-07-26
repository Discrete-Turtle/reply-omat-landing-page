# Waitlist → Google Sheet sync — design spec

**Date:** 2026-07-26
**Branch:** `feat/waitlist` (extends the existing waitlist Worker; ships in PR #2)
**Depends on:** the waitlist Worker (`worker/index.ts`) + `WAITLIST` KV binding already on this branch.

## Goal

Give someone **without Cloudflare account access** an always-current view of waitlist signups by mirroring each new signup into a shared **Google Sheet**. KV remains the durable source of truth; the Sheet is a convenience mirror the owner shares with a stakeholder (view/edit) who never touches Cloudflare.

## Decisions locked in

1. **Method:** Google **Sheets API v4** authenticated as a **service account** (not the Apps Script webhook).
2. **JWT signing:** use **`jose`** (`importPKCS8` + `SignJWT`) — not hand-rolled WebCrypto.
3. **No backfill:** start fresh from the next signup; existing KV rows (e.g. `malik.test`) are not pushed.
4. **Same branch:** implement on `feat/waitlist` (same Worker file), ships in PR #2.
5. KV stays source of truth; Sheet append is best-effort and never affects the signup response.

## Architecture / data flow

```
signup → POST /api/waitlist  (worker/index.ts)
   1. parse + null-guard
   2. honeypot non-empty → silent 200 (no KV, no Sheet)
   3. waitlistSchema.safeParse → 400 on failure
   4. key = waitlist:<email>; if NOT already in KV:
        - KV.put(record)                         ← durable, unchanged
        - ctx.waitUntil( appendSignup(record, env) )   ← async, post-response
   5. return { ok: true }
```

- The Sheet append fires **only in the new-signup branch**, so the Sheet dedupes exactly as KV does (a repeat email is a KV hit → no put, no append).
- It runs inside **`ctx.waitUntil`**, so the user gets `{ok:true}` immediately and a slow/failed Sheets call never delays or fails the signup.
- `appendSignup` **never throws** to the caller — it catches internally and `console.error`s, so `waitUntil` gets a settled promise.

## Files

- **Create `worker/lib/sheets.ts`** — the Sheets client: `appendSignup(record, env)`.
- **Modify `worker/index.ts`** — add `ctx: ExecutionContext` to `fetch`, extend `Env`, call the append via `waitUntil` in the new-signup branch.
- **Modify `wrangler.jsonc`** — add a `vars` block with `SHEET_ID`.
- **Modify `package.json` / `bun.lock`** — add `jose`.
- **Create `.dev.vars.example`** — committed template documenting the required local vars (no real values).
- **Modify `.gitignore`** — ensure `.dev.vars` is ignored (real local secrets).

## Sheets client (`worker/lib/sheets.ts`)

- **Record → row** (append order, all coerced to strings for consistent RAW insertion):
  `submitted_at · name · business · email · locations · source · maps_url · consent`
- **`getAccessToken(env)`**:
  - Normalize the PEM: `env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n")` (handles both real-newline secrets and `\n`-escaped `.dev.vars`).
  - `const key = await importPKCS8(pem, "RS256")`.
  - Build + sign JWT with `new SignJWT({ scope: "https://www.googleapis.com/auth/spreadsheets" }).setProtectedHeader({ alg: "RS256" }).setIssuer(email).setSubject(email).setAudience("https://oauth2.googleapis.com/token").setIssuedAt().setExpirationTime("1h").sign(key)`.
  - Exchange: `POST https://oauth2.googleapis.com/token` with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<jwt>` → `{ access_token, expires_in }`.
  - **Cache:** module-level `{ token, exp }`; reuse while `Date.now() < exp - 60_000`. (Per-isolate; warm isolates skip re-signing.)
- **`appendSignup(record, env)`**:
  - **Config guard:** if `SHEET_ID` / `GOOGLE_SA_EMAIL` / `GOOGLE_SA_PRIVATE_KEY` is missing, `console.warn` and return (feature degrades gracefully — signup still works locally without creds).
  - Get token → `POST https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sheet1!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS` with `Authorization: Bearer <token>` and body `{ values: [row] }`.
  - On non-2xx or thrown error: `console.error` with status/body; do not rethrow.
- **Range:** targets the tab named **`Sheet1`** (the default first-tab name). Documented in setup; if the owner renames the tab, they update the range.

## Worker changes (`worker/index.ts`)

- Add minimal inline type: `interface ExecutionContext { waitUntil(p: Promise<unknown>): void }`.
- `Env` gains: `GOOGLE_SA_EMAIL: string`, `GOOGLE_SA_PRIVATE_KEY: string`, `SHEET_ID: string` (all may be empty when unconfigured).
- `fetch(request, env, ctx)` and pass `ctx` into `handleWaitlist`.
- In the `if (!existing)` block, after `KV.put`: `ctx.waitUntil(appendSignup(record, env))`.

## Secrets & config

- **Worker secrets** (never in git): `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`.
- **`wrangler.jsonc` `vars`:** `SHEET_ID` (identifier; harmless without the key).
- **Local dev:** git-ignored `.dev.vars` holds the same three values; `.dev.vars.example` (committed) documents them.

## Owner one-time setup (documented in the plan)

1. Google Cloud → new project → enable **Google Sheets API**.
2. Create a **service account** → create a **JSON key** (download).
3. Create the Google Sheet; add a header row (`submitted_at, name, business, email, locations, source, maps_url, consent`); ensure the first tab is named **Sheet1**.
4. **Share the Sheet with the service-account email** as **Editor** (skipping this → 403).
5. Copy the **Sheet ID** from the URL into `wrangler.jsonc` `vars.SHEET_ID`.
6. `wrangler secret put GOOGLE_SA_EMAIL` (the `client_email`) and `wrangler secret put GOOGLE_SA_PRIVATE_KEY` (the `private_key` PEM).
7. For local testing, put the same three in `.dev.vars`.

## Verification

- `bun run build` clean (static site unaffected).
- Worker/`sheets.ts` compiles; the config-guard path means a signup with **no** Sheets creds still returns `{ok:true}` and writes KV (verifiable via `wrangler dev --local` as before).
- **Live check (owner-run, needs real SA + Sheet):** with `.dev.vars` populated, `wrangler dev`, submit a signup, confirm a new row appears in the Sheet and `console` shows no error. A full automated E2E isn't possible without the owner's Google credentials.

## Out of scope

Backfilling existing KV rows, an in-app admin page, retry/queue on Sheets failure, per-field Sheet formatting, and multiple-sheet routing. KV remains the recovery source for any row the Sheet misses.
