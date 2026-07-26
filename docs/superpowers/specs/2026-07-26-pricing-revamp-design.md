# Pricing revamp — design spec

**Date:** 2026-07-26
**Component:** `src/components/Pricing.astro` (plus one small edit to `src/components/CtaBand.astro`)
**Scope:** Landing-page frontend only. Backend concerns (2,500 counter, limit enforcement, locked-review UI) are out of scope.

## Goal

Replace the current placeholder pricing (Starter €0 / Growth €29 / Enterprise Custom, per-card CTAs) with the real three-plan model: **Starter €5.99/mo**, **Yearly €9.99/mo**, **Lifetime €300 once**. Cards are informational — no per-card CTA; conversion happens via the shared CtaBand directly below.

## Decisions locked in

1. **Early-bird duration:** €5.99 is **permanent for the first 2,500 customers**, then Starter returns to €10.99/mo. The "in your first year" copy from the mockup is dropped everywhere.
2. **Fidelity:** Use the mockup (image #1) as direction, but implement with the existing token system so it matches the rest of the page (clay palette, existing card patterns). Mockup's blue/purple badges are re-mapped to gold/terracotta/neutral.
3. **Card CTA:** No per-card CTA button. Cards are informational; the scroll chevron bridges to the CtaBand ("Get Early Access").

## Section shell

- Keep `#pricing`, the `max-w-[1200px]` container, the `.reveal` IntersectionObserver, and the 900px → single-column breakpoint (`max-width: 440px` centered). Middle card stays highlighted via `.hot` (`--primary` border + terracotta shadow) and the `Most popular` tag.
- New header copy:
  - eyebrow: `Pricing`
  - h2: **Lock in early-bird pricing.**
  - sub: *Two subscriptions and a one-off Lifetime — the €5.99 rate is locked in for our first 2,500 customers.*

## Cards

Order: Starter, Yearly (hot), Lifetime.

### Starter
- Tier: 🌱 icon + `Starter`
- Badge: `Early bird` — gold chip (`--gold` text/accent on `--chip` background family)
- Anchor: ~~€10.99~~ (strike, `--t4`, `line-through`)
- Price: **€5.99** `/mo`
- Sub-line: `cancel anytime`
- Features (tick rows):
  - **100** replies per month
  - **1** business location
  - Reviews up to **60 days** back
  - 💰 (gold coin icon) **Under 20 cents a day**
- Footnote: *€5.99/mo locked in for our first 2,500 customers — then €10.99/mo.*

### Yearly (hot / Most popular)
- Tier: 📅 icon + `Yearly`
- Badge: `Most popular` — terracotta (`--primary` / `--pf`), existing `.ptag` style
- Anchor: ~~€10.99~~ (strike)
- Price: **€9.99** `/mo`
- Sub-line: `billed annually — €119.88`
- Features:
  - **200** replies per month
  - **3** business locations
  - Reviews up to **12 months** back
- No footnote.

### Lifetime
- Tier: ∞ icon + `Lifetime`
- Badge: `One-off payment` — neutral chip (muted `--t3` text, `--b08`/`--inset` background)
- Anchor: — (none)
- Price: **€300** `once`
- Sub-line: `pays for itself in about 30 months`
- Features:
  - **Unlimited** replies\*
  - **5** business locations
  - Reviews all the way back to **day one**
- Footnote: *\*Fair use: up to 1,000 replies per month.*

## Below the grid

- Centered footer line: 🏛 *More than 5 locations?* **Talk to us about an agency plan** — link to `/contact`. Replaces the removed Enterprise tier.
- Round **scroll-down chevron** button centered below the cards, linking to the CtaBand. Implementation: add `id="get-started"` to the CtaBand `<section>` and make the chevron an `<a href="#get-started">` with an `aria-label` (e.g. "Jump to sign-up"). Since cards have no CTA, this is the bridge to the shared "Get Early Access" conversion point.

## Styling notes

Reuse existing `.price` / `.price.hot` / `.ptag` / `.pfeat` / `.pfeat-row` / `.tick` patterns and tokens. New pieces:
- **Strike anchor** — inline span, `--t4`, `text-decoration: line-through`, sized smaller than the price, sitting left of the price number (matches mockup).
- **Tier icons** — small inline SVGs (sprout / calendar / infinity) next to the tier label, tinted `--accent-tx` or `--t3`, sized ~16px, `aria-hidden`.
- **Badge variants** — three: gold (`Early bird`), terracotta (`Most popular`, existing), neutral (`One-off payment`).
- **Coin feature row** — the "Under 20 cents a day" row uses a gold `$`/coin icon instead of the green tick.
- **Footnotes** — small `--t3` text at the bottom of Starter and Lifetime cards; grid stays `items-stretch` so cards remain equal height.
- **Agency line + chevron** — below the grid, centered, using `--t3`/link color for the agency text and a `--card`/`--b16` round button for the chevron.
- Dark mode is automatic via tokens.
- Respect `prefers-reduced-motion` (existing pattern already does).

## Accessibility

- Anchor prices: keep the visible strike but ensure the current price is what's announced clearly; decorative icons `aria-hidden`.
- Chevron link has an `aria-label`; agency link has descriptive text.
- Maintain AA contrast for badges and footnotes against card backgrounds in both themes.

## Out of scope

Server-side early-bird counter, reply/location/age limit enforcement, locked-review greyed-out UI, storing locked-in price on the subscription — all backend, tracked separately in the pricing spec's implementation notes.
