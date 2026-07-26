# Waitlist → Google Sheet sync

Mirrors each new waitlist signup into a Google Sheet via a secret-gated Apps
Script Web App. KV stays the source of truth; this Sheet is a shareable view
for people without Cloudflare access.

## One-time setup

1. **Create the Sheet.** Rename the first tab to `Signups` (must match `SHEET_TAB` in the script), and add a header row:
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
