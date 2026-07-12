# Handoff: ReplyOmat Landing Page redesign

## Overview
A single-page marketing site for **ReplyOmat** (replyomat.ai) — an invite-only-beta tool that
drafts warm, on-brand replies to a business's Google reviews. The owner reviews the draft,
tweaks if they like, and publishes straight to Google in one tap (human-in-the-loop; nothing
posts without approval). Reviews arrive automatically via the **Google Business API** — there
is no "sync" step in the product.

This package redesigns the existing landing page to match the **shipped app's warm "clay"
design system**. The current live page (indigo `#6366f1` / obsidian dark / glassmorphism) is a
generic SaaS template and should be **fully replaced** — not themed on top of.

## About the design file
`ReplyOmat Landing.dc.html` is a **high-fidelity design reference in HTML** (authored in an
in-house prototype runtime — `support.js`, which you do NOT ship). It shows exact layout,
copy, colors, motion, and both light + dark themes. **Recreate it in the existing repo**
(`reply-omat-landing-page`: **Astro + Tailwind v4**, deploys to Cloudflare Workers), replacing
the current section components. It already uses CSS variables, so porting the tokens is direct.

Fidelity: **high**. Match pixel-closely.

## Target repo (already exists)
```
reply-omat-landing-page/
  src/pages/index.astro          ← composes the sections
  src/components/Header.astro Hero.astro Features.astro HowItWorks.astro Pricing.astro Footer.astro
  src/styles/global.css          ← REPLACE the :root tokens here (currently indigo/obsidian)
  tailwind.config.ts
```
Redesign each `.astro` component to the spec below. Move the clay tokens into `global.css`
as CSS variables (light in `:root`, dark under `.dark`); drive Tailwind colors from them.
Delete the old `.obsidian-bg`, `.glass-panel`, `.glow-effect`, `.timeline-line` styles and the
Space Grotesk / Inter Tight / JetBrains Mono font imports.

## Design tokens (CSS variables — copy verbatim)

### Light (`:root`, default presentation)
```
--bg:#f7f3ec; --card:#fffdf9; --inset:#faf6ef; --board:#e9e2d6; --hover:#f1ebe1;
--ink:#221e19; --t1:#3a342c; --t2:#5b5347; --t3:#7a7264; --t4:#8a8175;   /* text ladder */
--primary:#c2693f; --primary-h:#b35c34; --pf:#fff; --accent-tx:#b35a35;
--chip:#fbeee7; --chip-bd:#eac9b6; --ok:#3f8a64; --ok-bg:#e7f0e9; --gold:#e0a82e; --star-off:#ddd5c8;
/* borders are alpha-ink, not gray */
--b06:rgba(34,30,25,.06); --b08:.08; --b12:.12; --b16:.16; --b28:.28;
--pshadow:0 8px 18px -8px rgba(194,105,63,.7);
```
### Dark (`.dark`)
```
--bg:#1e1a15; --card:#28231d; --inset:#2f2922; --board:#141009; --hover:#332d26;
--ink:#f3ede2; --t1:#e7dfd3; --t2:#bbb2a4; --t3:#a79e90; --t4:#978e7f;
--primary:#d57e52; --primary-h:#c2693f; --pf:#28231d; --accent-tx:#e6a679;
--chip:#3a2a21; --chip-bd:#6d4c39; --ok:#74c39a; --ok-bg:#26352c; --gold:#e0a82e; --star-off:#4a443a;
--b06:rgba(255,255,255,.07); --b08:.09; --b12:.13; --b16:.18; --b28:.30;
```
**Theme is toggled by a `dark` class on the page root** (header toggle button; default light).
Note: put the themed background on the root wrapper (or `html`/`body`) so the *whole* page
darkens — scoping the `dark` class to an inner wrapper leaves the body its light color.

### Typography (Google Fonts)
- **Fraunces** (opsz, 400–700) — display serif. Used for hero + section headlines and big
  price numbers. `letter-spacing:-.02em; line-height:1.04; font-weight:500`.
- **Hanken Grotesk** (400–800) — everything else: body, nav, buttons, labels, tiles.
- **Spline Sans Mono** (500–600) — uppercase eyebrow/caption labels only, `letter-spacing:.14em`.

### Shape / depth / motion
- Radii: buttons/inputs 11px, cards 17px, big panels 18–22px, pills 99px.
- Primary button: `background:var(--primary); color:var(--pf); box-shadow:var(--pshadow)`;
  hover lifts `translateY(-2px)` + `--primary-h`.
- Depth = warm layered surfaces (board → card → inset) + hairline alpha borders. **No glass blur, no glow.**
- Motion: ~260ms `cubic-bezier(.22,.61,.36,1)`. Scroll-reveal = fade + 22px rise via
  IntersectionObserver adding an `in` class. Signature motif: slow concentric terracotta
  **ripple rings** (7s ease-out loop, scale+opacity) behind the hero and CTA band.
- **Respect `prefers-reduced-motion`** (disable ripple/dot/reveal). Animate transform/opacity only.

### Logo mark
Two offset rounded bars via pseudo-elements: short grey bar top-left (`--star-off`) = review,
wider clay bar bottom-right (`--primary`) = reply. Wordmark: "reply" ink + "omat" clay.

## Sections (redesign all; keep this order)

1. **Header** — sticky, blurred, transparent border that appears on scroll (`.scr`). Logo +
   wordmark; nav Features · How it works · Pricing (hidden < 860px); theme toggle (sun/moon);
   primary "Get Early Access" button.

2. **Hero** — 2-col grid (`1.05fr .95fr`), collapses to 1 col < 860px. Left: "Invite-only beta"
   badge (pulsing dot), Fraunces headline **"Your reviews, answered in your voice."**,
   subhead about drafting a reply the moment a review lands and publishing to Google in one tap,
   primary CTA + ghost "See how it works", and a reassurance line "Nothing is posted without
   your approval." Right: an **animated product card** that cycles: review (5 gold stars, "Maria
   Sousa") → label "Drafting a reply" with spinner → reply text **types in** (typewriter) →
   "Your draft" with **Approve & publish** + Edit → **"Published to Google"** green confirmation,
   then loops. Reserve the action row's height (~44px) so the card doesn't resize between phases.
   A small "Rated 4.8 on Google" chip floats at the card's bottom-right corner. Concentric
   ripple rings animate behind. (Beta caveat: no fake customer logos / trust strip.)

3. **Features** — bento grid (`1.4fr 1fr 1fr`, collapses to 1 col < 860px), varied cell sizes:
   - **Brand tone control** (tall cell) — pencil icon; "pick a voice: warm, brief, formal"; shows 3 tone pills (Warm active).
   - **Approve & publish** — check icon; one tap from draft to live on Google.
   - **Multi-location** — map-pin icon; run every storefront from one place.
   - **Every review, automatically** (wide cell) — inbox icon; connected to the Google Business
     profile so new reviews arrive on their own. **Do not call this "sync"** — reviews are fetched
     automatically via the Google Business API; there is no manual sync in the product.

4. **How it works** — full-width `--board` band; 2-col (`.85fr 1.15fr`), left column sticky.
   Left: eyebrow + Fraunces headline "From new review to posted reply in about ten seconds."
   Right: 3 numbered steps with connecting line — (1) A review lands (connected to Google
   Business profile, flags anything waiting), (2) AI drafts it in your voice (personalized, not a
   template), (3) You approve, it posts to Google (live on the listing instantly).

5. **Pricing** — 3 tiers (`repeat(3,1fr)`, collapse to 1 col < 900px), middle highlighted with
   primary border + "Most popular" tag: **Starter €0** (1 location, 30 replies/mo) · **Growth
   €29/mo** (up to 5 locations, unlimited replies, team roles, priority drafting) · **Enterprise
   Custom** (unlimited, SSO & audit, dedicated support). CTAs "Get Early Access" / "Contact us".
   Fraunces price numbers; green check ticks on feature lists.

6. **CTA band** — full-width rounded panel with a **fixed terracotta gradient**
   (`linear-gradient(135deg,#c2693f,#a5542f,#8f4a2c)`) that reads identically in light and dark
   (do NOT invert to `--ink`, which turns white in dark mode). White headline "Stop dreading your
   reviews.", light subtext, and a **cream** button (`#fffdf9` bg, `#a5542f` text) for contrast.
   Ripple rings in white tint behind.

7. **Footer** — minimal: wordmark, three links (Privacy Policy · Terms of Service · Contact),
   "© 2026 ReplyOmat". Keep it to these; no mega-footer.

## CTA wording
Primary action everywhere is **"Get Early Access"** (request-access, invite-only beta — not a signup).

## Hard constraints
- Fully responsive 320 → 1440+, no horizontal overflow. **Grid columns must be classes** so
  media queries can collapse them (never inline `grid-template-columns` — it can't be overridden).
  Breakpoints used: 900px (pricing → 1 col), 860px (hero/features/how → 1 col, nav hidden),
  520px (footer stacks).
- WCAG AA contrast; visible focus states; reduced-motion fallbacks.
- Every interactive element gets a designed hover/focus state (no library defaults).
- Semantic sections; CSS-variable-driven colors (not one-off hardcoded values) for the Tailwind v4 port.

## Files in this package
- `ReplyOmat Landing.dc.html` — the design reference (open in a browser with `support.js` beside it).
- `support.js` — prototype runtime, needed only to view the .dc.html locally. **Do not ship.**
