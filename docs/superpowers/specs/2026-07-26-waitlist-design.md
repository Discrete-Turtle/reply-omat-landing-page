# Waitlist page — design spec

**Date:** 2026-07-26
**Branch:** `feat/waitlist` (off `main`, which already includes the merged pricing revamp)
**Source design:** `../design_handoff_waitlist/` (DC prototype — inspiration only; the DC runtime is NOT ported)

## Goal

Add a `replyomat.ai/waitlist` route: a two-column "request an invite" page whose visual system matches the landing page (same tokens, fonts, Header/Footer). Left column pitches the beta; right column is an interactive form that POSTs real signups to a Cloudflare KV store and swaps to a success state. Wire the site's "Get Early Access" buttons to the new route.

## Decisions locked in

1. **Persistence:** real capture via a small Cloudflare **Worker entry in front of the static assets** (the site deploys as a Worker-with-assets; Astro stays fully static, no SSR adapter). `POST /api/waitlist` writes to a `WAITLIST` KV namespace.
2. **Form scope (trimmed):** keep name, email, business, Google Maps link, locations, consent — **plus** "How did you hear about us?" with **no preselected default** (so any value is an intentional answer). **Drop** monthly-reviews and the free-text note.
3. **Implementation:** vanilla Astro + a scoped `<script>` island (matches the entire existing codebase — there are zero React islands; the shadcn `button.tsx` is unused). No React.
4. **CTA wiring:** point the **3** "Get Early Access" buttons (header, hero, CTA band) at `/waitlist`. The pricing cards have no CTA buttons post-revamp.
5. **Branch:** `feat/waitlist` off the up-to-date `main` (pricing revamp already merged — no conflict).

## Files

- Create `src/pages/waitlist.astro` — page shell modeled on `index.astro`: `<head>` SEO + theme-init inline script + fonts, `<Header/>`, `<main>` with the ripple field and the two-column grid, `<Footer/>`.
- Create `src/components/waitlist/WaitlistPitch.astro` — left column.
- Create `src/components/waitlist/WaitlistForm.astro` — right column (form card + success card + scoped `<script>` island).
- Modify `src/styles/global.css` — add `--err` token (light + dark).
- Modify `src/components/Header.astro`, `src/components/Hero.astro`, `src/components/CtaBand.astro` — set the "Get Early Access" CTA `href`/link to `/waitlist`.
- Create `worker/index.ts` (or equivalent entry) — Worker fetch handler: `POST /api/waitlist` handled; all else delegated to `env.ASSETS.fetch(request)`.
- Modify `wrangler.jsonc` — add `main` (the Worker entry) and the `WAITLIST` KV binding.

## Layout

- Two columns `1fr 1.05fr`, `gap: 56px`, `max-width: 1200`, page padding 28px; collapses to a single column at `max-width: 900px` (gap 36px, padding 20px), and the name/email two-up stacks there.
- Ripple field behind the layout at roughly `top:34% left:24%`, `pointer-events:none`, `aria-hidden`, reusing the existing `.ripple-ring` / `@keyframes ripple-ring-anim` utility (3 rings, staggered). Disabled under `prefers-reduced-motion`.

### Left column (max-width 460px)
1. Badge "Invite-only beta" with the pulsing clay dot.
2. `h1` "Join the *waitlist.*" — display serif 500, `clamp(34px,4.4vw,50px)`, with "waitlist." italic in `--primary` (matches the landing headline treatment).
3. Sub-paragraph, 17px, `--t2`.
4. Three perks — 34px rounded clay chip icon + bold title + one line:
   - **Free through the beta** — No card, no commitment. Keep a founding-member rate afterwards.
   - **We set up your voice with you** — A short call to tune the drafts so they actually sound like your place.
   - **Nothing posts without you** — Every reply waits for your approval, in the beta and after.

### Right column
Form card (`--card`, 20px radius, 30px padding, `box-shadow: 0 40px 80px -46px rgba(34,30,25,.5)`) titled "Request an invite" + hint. Swaps to the success card on submit.

## Form spec (trimmed)

| Field | name | Type | Required | Notes |
|---|---|---|---|---|
| Your name | `name` | text | ✅ | two-up with email on desktop |
| Work email | `email` | email | ✅ | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| Business name | `business` | text | ✅ | |
| Google Maps link | `maps_url` | url | — | hint: "Speeds up your setup. We use it to find your reviews." |
| How many locations? | `locations` | segmented radio | — | `1` (default) / `2-5` / `6-20` / `20+` |
| How did you hear about us? | `source` | select | — | **no default** — placeholder "Choose one"; options: search / social / friend / event / other |
| Consent | `consent` | checkbox | ✅ | row is the label; links `/privacy` |
| _Honeypot_ | `company_website` | text | — | visually hidden, off-screen, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden`; must be empty |

### Validation
- Errors are hidden until the first submit attempt (`touched` flag). After that, invalid required fields get `.bad` (error border + 7% error tint via `color-mix`) and a 12.5px message below; validate live so errors clear as the user types.
- Messages: name → "Please tell us your name." · email → "Enter a valid email address." · business → "Please tell us your business name." · consent → "Please tick this so we can email you your invite."

### Submit
- Full-width button; while sending it is `disabled` and shows a spinner + "Sending…".
- On click: set `touched`; if any required field invalid, show errors and stop. Else `fetch('/api/waitlist', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)})`.
- On `{ok:true}`: swap the whole card for the success state. On failure/network error: re-enable the button and show a single non-field error line ("Something went wrong — please try again."). (This error affordance is an addition over the prototype, which could not fail.)

### Success state
- Card scales in (`pop`, 0.5s; disabled under reduced-motion).
- 76px `--ok-bg` circle with a 36px `--ok` checkmark.
- `h2` "You're on the list." (display serif, 29px), `role="status"`, receives focus on mount.
- "Thanks **{firstName}**. We'll email **{email}** as soon as a spot opens up, usually within a week." — `firstName = name.trim().split(/\s+/)[0]`.
- Inset "WHAT HAPPENS NEXT" panel with three numbered lines (verbatim from the design).
- Secondary button back to `/`.

## Accessibility
- Every input has a real `<label for>`.
- Errored inputs get `aria-invalid="true"` and `aria-describedby` pointing at their error message id.
- The two segmented pickers are single-select **radio groups** (`role="radiogroup"` with radio children), not buttons — keyboard + SR friendly. `locations` defaults to `1`; `source`/select has no default.
- Consent is a real `<input type="checkbox">` with the whole row as its `<label>`.
- On success, focus moves to the success heading and it announces via `role="status"`.
- Ripples and the pulsing dot are disabled under `prefers-reduced-motion: reduce`.

## Backend — Worker + KV

- The site is a Cloudflare **Worker with static assets** (`wrangler.jsonc` `assets.directory: ./dist`, `nodejs_compat`). Add a Worker `main` entry that: for `POST /api/waitlist` handles the request; otherwise returns `env.ASSETS.fetch(request)` so all static routing is unchanged.
- Handler logic:
  1. Parse JSON body.
  2. **Honeypot:** if `company_website` is non-empty → return `200 {ok:true}` without storing (silently absorb bots).
  3. Re-validate the four required fields server-side (name/business non-empty, email matches regex, consent === true). On failure → `400 {ok:false, error}`.
  4. Normalise: `email = email.trim().toLowerCase()`; trim strings.
  5. **Dedupe:** key `waitlist:<email>`. If present, still return `{ok:true}` (idempotent — don't leak whether they already signed up).
  6. `put` the record: `{ name, email, business, maps_url, locations, source, consent:true, submitted_at: <ISO> }`.
  7. Return `200 {ok:true}`.
- KV binding named `WAITLIST`. Namespace creation is account-specific (owner runs `wrangler kv namespace create WAITLIST` and pastes the id into `wrangler.jsonc`).
- Suggested payload matches the record shape above.

## CTA wiring
- Set the "Get Early Access" links/buttons in `Header.astro`, `Hero.astro`, and `CtaBand.astro` to navigate to `/waitlist`. (These are currently inert.) Internal link is plain root-relative `/waitlist`.

## SEO
- `title: Join the waitlist — ReplyOmat`
- `description: Request an invite to the ReplyOmat beta. AI-drafted replies to your Google reviews, approved by you.`
- Indexable (no `noindex`).

## Verification
- Page/UI: `astro dev` — visual (light/dark/mobile), validation flow, success swap, keyboard/radiogroup behaviour.
- Endpoint: `wrangler dev` against `dist` — POST valid/invalid/honeypot/dedupe cases; confirm KV writes. (Owner supplies the KV namespace id for a live run; logic is verifiable against a local KV.)
- `bun run build` clean.

## Dropped (DC cruft — not ported)
`support.js`, `x-dc` / `<sc-if>` / `{{ }}` bindings, the fake 1.1s `setTimeout`, all inline styles (→ tokens + scoped styles), and the design's inline header/footer (→ reuse the real `Header.astro` / `Footer.astro`). Also dropped from the form: monthly-reviews and the note textarea.

## Out of scope
Email delivery / invite automation, Turnstile/captcha (honeypot only, per the handoff's "keep it invisible"), an admin view of signups, and rate limiting beyond the honeypot.
