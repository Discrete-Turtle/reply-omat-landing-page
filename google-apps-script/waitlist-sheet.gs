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
const SHEET_TAB = 'Signups'; // the tab name inside your Sheet — rename the tab to match

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
