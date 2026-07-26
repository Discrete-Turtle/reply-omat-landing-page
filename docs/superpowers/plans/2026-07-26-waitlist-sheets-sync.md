# Waitlist → Google Sheet Sync (Apps Script webhook) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror each new waitlist signup into a shared Google Sheet via a secret-gated Apps Script Web App webhook, so someone without Cloudflare access can see signups.

**Architecture:** The existing Worker (`worker/index.ts`), on a genuinely new signup, calls `appendSignup(record, env)` inside `ctx.waitUntil` — a best-effort `fetch` POST to the Apps Script `/exec` URL carrying a shared secret. KV stays the source of truth; the append never blocks or fails the signup, and no-ops when unconfigured. No new npm deps.

**Tech Stack:** Cloudflare Worker (bundled by wrangler), plain `fetch`. Google Apps Script (owner-pasted, not part of the build). Package manager **bun**.

## Global Constraints

- KV remains source of truth; the Sheet append is **best-effort** — it must never delay, block, or fail the `/api/waitlist` response.
- Append fires **only on a new signup** (inside the existing `if (!existing)` KV branch), so the Sheet dedupes exactly as KV does.
- Runs inside `ctx.waitUntil(...)`; `appendSignup` **never throws** to its caller (catches internally, `console.error`s).
- **Config guard:** if `SHEETS_WEBHOOK_URL` or `SHEETS_WEBHOOK_SECRET` is unset, `appendSignup` `console.warn`s and returns — the signup still succeeds and writes KV.
- Secrets: `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET` — Worker secrets, never in git; local values in git-ignored `.dev.vars`.
- No new npm dependencies (no `jose`/JWT — Apps Script needs none).
- Column order everywhere (Worker body spread, Apps Script `appendRow`, header): `submitted_at · name · business · email · locations · source · maps_url · consent`.
- Verification is `bun run build` + `wrangler dev --local`; there is no unit-test harness. The true end-to-end (a row lands in the Sheet) is owner-run with real Apps Script setup.

---

### Task 1: Worker Sheet-append (best-effort webhook call)

Adds the `appendSignup` client and wires it into the Worker's new-signup branch via `waitUntil`, with graceful degradation when unconfigured.

**Files:**
- Create: `worker/lib/sheets.ts`
- Modify: `worker/index.ts`

**Interfaces:**
- Produces: `appendSignup(record, env): Promise<void>` consumed by `worker/index.ts`. `record` is the object already built in `handleWaitlist` (`{ name, email, business, maps_url, locations, source, consent, submitted_at }`); `env` supplies `SHEETS_WEBHOOK_URL?` and `SHEETS_WEBHOOK_SECRET?`.

- [ ] **Step 1: Create the append client**

Create `worker/lib/sheets.ts`:

```ts
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
```

- [ ] **Step 2: Import the client and extend `Env` + add `ExecutionContext`**

In `worker/index.ts`, replace:

```ts
import { waitlistSchema } from "../src/lib/waitlist-schema"

interface Env {
  WAITLIST: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
  ASSETS: { fetch(request: Request): Promise<Response> }
}
```

with:

```ts
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
```

- [ ] **Step 3: Thread `ctx` through and fire the append on new signups**

In `worker/index.ts`, change the `handleWaitlist` signature:

```ts
async function handleWaitlist(request: Request, env: Env): Promise<Response> {
```

to:

```ts
async function handleWaitlist(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
```

Then replace the new-signup KV block:

```ts
  const key = `waitlist:${d.email}`
  const existing = await env.WAITLIST.get(key)
  if (!existing) {
    await env.WAITLIST.put(key, JSON.stringify(record))
  }

  return json({ ok: true })
```

with:

```ts
  const key = `waitlist:${d.email}`
  const existing = await env.WAITLIST.get(key)
  if (!existing) {
    await env.WAITLIST.put(key, JSON.stringify(record))
    // Best-effort mirror to the Google Sheet — after the response, never
    // blocking or failing the signup (KV is the source of truth).
    ctx.waitUntil(appendSignup(record, env))
  }

  return json({ ok: true })
```

- [ ] **Step 4: Pass `ctx` from the fetch handler**

In `worker/index.ts`, replace the default export:

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}
```

with:

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env, ctx)
    }
    return env.ASSETS.fetch(request)
  },
}
```

- [ ] **Step 5: Build**

Run: `bun run build`
Expected: exit 0 (static site unaffected; the Worker is bundled by wrangler at dev/deploy, but the build must stay clean).

- [ ] **Step 6: Verify graceful degradation via `wrangler dev`**

The Sheet webhook is NOT configured in this test (no `.dev.vars` webhook values), which must leave signups fully working.

```bash
bunx wrangler dev --local --port 8790 &
```
Wait ~5s, then:
```bash
# signup still succeeds with no webhook configured (append no-ops)
curl -s -X POST http://localhost:8790/api/waitlist -H 'content-type: application/json' \
  -d '{"name":"Sheet Test","email":"sheet-test@example.com","business":"B","consent":true}'
```
Expected: `{"ok":true}`. (The Worker log shows `Sheets webhook not configured; skipping Sheet append` — the graceful path.) Then:
```bash
pkill -f "wrangler dev" || true
```

- [ ] **Step 7: Commit**

```bash
git add worker/lib/sheets.ts worker/index.ts
git commit -m "feat: mirror new waitlist signups to a Google Sheet webhook (best-effort)"
```

---

### Task 2: Apps Script + local-vars template + setup doc

Adds the owner-facing artifacts: the Apps Script to paste, the `.dev.vars.example` template, and a short setup README.

**Files:**
- Create: `google-apps-script/waitlist-sheet.gs`
- Create: `google-apps-script/README.md`
- Create: `.dev.vars.example`

**Interfaces:**
- The `.gs` `doPost` consumes the JSON the Worker sends in Task 1 (`{ secret, submitted_at, name, business, email, locations, source, maps_url, consent }`) and gates on `secret`.

- [ ] **Step 1: Create the Apps Script**

Create `google-apps-script/waitlist-sheet.gs`:

```javascript
/**
 * Waitlist → Sheet webhook (paste into your Sheet's Apps Script editor).
 *
 * Setup:
 *  1. Open your Google Sheet → Extensions → Apps Script.
 *  2. Paste this file; set SCRIPT_SECRET below to a long random string.
 *  3. Deploy → New deployment → Web app:
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Deploy, authorize, and copy the "/exec" Web App URL.
 *  4. In the Worker: `wrangler secret put SHEETS_WEBHOOK_URL` (the /exec URL)
 *     and `wrangler secret put SHEETS_WEBHOOK_SECRET` (the SAME random string).
 *
 * The "Anyone" access is required because the Worker calls this server-to-
 * server with no Google login — the SCRIPT_SECRET check is the real gate.
 */
const SCRIPT_SECRET = 'REPLACE_WITH_A_LONG_RANDOM_SECRET'; // must match SHEETS_WEBHOOK_SECRET
const SHEET_TAB = 'Sheet1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SCRIPT_SECRET) {
      return _json({ ok: false, error: 'unauthorized' });
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB);
    sheet.appendRow([
      data.submitted_at || new Date().toISOString(),
      data.name || '',
      data.business || '',
      data.email || '',
      data.locations || '',
      data.source || '',
      data.maps_url || '',
      String(data.consent),
    ]);
    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 2: Create the setup README**

Create `google-apps-script/README.md`:

```markdown
# Waitlist → Google Sheet sync

Mirrors each new waitlist signup into a Google Sheet via a secret-gated Apps
Script Web App. KV stays the source of truth; this Sheet is a shareable view
for people without Cloudflare access.

## One-time setup

1. **Create the Sheet.** Add a header row in the first tab (named `Sheet1`):
   `submitted_at | name | business | email | locations | source | maps_url | consent`
2. **Add the script.** Extensions → Apps Script → paste `waitlist-sheet.gs`.
   Set `SCRIPT_SECRET` to a long random string (e.g. `openssl rand -hex 24`).
3. **Deploy.** Deploy → New deployment → Web app → *Execute as: Me*,
   *Who has access: Anyone* → Deploy → authorize → copy the `/exec` URL.
4. **Give the Worker the secrets** (run from the repo root):
   ```bash
   bunx wrangler secret put SHEETS_WEBHOOK_URL      # paste the /exec URL
   bunx wrangler secret put SHEETS_WEBHOOK_SECRET   # paste the SAME random string
   ```
   For local `wrangler dev`, copy `.dev.vars.example` → `.dev.vars` and fill both in.
5. **Share the Sheet** with whoever needs it (view or edit).

## Test the script directly

```bash
curl -s -X POST "<your /exec URL>" -H 'content-type: application/json' \
  -d '{"secret":"<your secret>","submitted_at":"2026-01-01T00:00:00Z","name":"Test","business":"B","email":"t@x.co","locations":"1","source":"","maps_url":"","consent":true}'
```
Expect `{"ok":true}` and a new row. A wrong/missing `secret` → `{"ok":false,"error":"unauthorized"}` and no row.

## Notes

- If the append fails, the signup still succeeds and KV keeps the record — no
  data is lost. Recover a missed row from KV if needed.
- To swap to the Sheets API later, only `worker/lib/sheets.ts` + the secrets
  change; the Worker's call site stays the same.
```

- [ ] **Step 3: Create `.dev.vars.example`**

Create `.dev.vars.example`:

```
# Local-only vars for `wrangler dev`. Copy to `.dev.vars` (git-ignored) and fill in.
# Google Apps Script Web App webhook for mirroring signups to a Sheet.
# Leave BOTH unset to disable the Sheet append — signups still work + write to KV.
SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/XXXXXXXX/exec"
SHEETS_WEBHOOK_SECRET="the-same-random-secret-as-in-the-apps-script"
```

- [ ] **Step 4: Build (sanity — these files don't affect the build)**

Run: `bun run build`
Expected: exit 0. Also confirm `.dev.vars.example` is committable and `.dev.vars` stays ignored: `git check-ignore .dev.vars` prints `.dev.vars`, and `git check-ignore .dev.vars.example` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add google-apps-script/waitlist-sheet.gs google-apps-script/README.md .dev.vars.example
git commit -m "docs: Apps Script webhook + local-vars template for Sheet sync"
```

---

## Self-Review

**Spec coverage** (against `2026-07-26-waitlist-sheets-sync-design.md`):
- `worker/lib/sheets.ts` `appendSignup` with config-guard + best-effort fetch → Task 1 Steps 1. ✓
- `ExecutionContext` type, `Env` additions, `ctx` threading, `waitUntil` on new-signup-only → Task 1 Steps 2–4. ✓
- Apps Script `doPost` secret-gated, `Sheet1`, correct column order → Task 2 Step 1. ✓
- `.dev.vars.example` + gitignore already handles `.dev.vars` → Task 2 Step 3 + verified in Step 4. ✓
- Setup steps documented → Task 2 Step 2 (README). ✓
- KV source of truth / graceful degradation / no new deps → constraints honored (append is additive, guarded, dep-free). ✓
- Out-of-scope (backfill, admin page, retries) → not implemented. ✓

**Placeholder scan:** No TBD/TODO in the shipped code. The `REPLACE_WITH_A_LONG_RANDOM_SECRET` / example URL are intentional owner-filled template values, documented as such.

**Type/name consistency:** `appendSignup(record, env)` signature matches its call site; `WaitlistRecord` fields match the `record` object built in `handleWaitlist`; env var names `SHEETS_WEBHOOK_URL`/`SHEETS_WEBHOOK_SECRET` are identical across `sheets.ts`, `worker/index.ts` `Env`, `.dev.vars.example`, and the README; the JSON keys the Worker sends match what the `.gs` `doPost` reads; column order matches across Worker body, `appendRow`, and the header row. ✓
