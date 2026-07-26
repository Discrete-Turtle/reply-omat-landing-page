# Pricing Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder pricing section with the real three-plan model (Starter €5.99/mo, Yearly €9.99/mo, Lifetime €300 once), informational cards with no per-card CTA, bridged to the CtaBand by a scroll chevron.

**Architecture:** Single Astro component rewrite (`src/components/Pricing.astro`) plus one attribute added to `src/components/CtaBand.astro`. Pure static markup + scoped CSS reusing the existing clay design tokens. No JS behavior changes — the existing `.reveal` IntersectionObserver stays as-is.

**Tech Stack:** Astro 5, Tailwind v4 utility classes + a scoped `<style>` block, CSS custom properties from `src/styles/global.css`. Package manager is **bun**.

## Global Constraints

- Copy — €5.99 is **permanent for the first 2,500 customers** (not "first year"). The phrase "in your first year" must appear nowhere.
- Anchor price **must render**: `€10.99` struck-through on both Starter and Yearly. Lifetime has no anchor.
- Use existing tokens only (`--card`, `--primary`, `--pf`, `--ink`, `--t1`/`--t2`/`--t3`/`--t4`, `--accent-tx`, `--gold`, `--ok`, `--inset`, `--b08`/`--b12`/`--b16`, `--chip`, etc.). The only non-token literals allowed are the theme-independent gold tint rgba values specified below (mirrors the CtaBand precedent of deliberate one-offs).
- Cards have **no per-card CTA button**. Conversion is the shared CtaBand below.
- Internal links are plain root-relative (e.g. `/contact`, `#get-started`) — no `BASE_URL` prefix (assets use `BASE_URL`, links do not).
- Must work in light and dark mode via tokens, and respect `prefers-reduced-motion` (existing pattern already covers the reveal).
- Verification is `bun run build` (catches Astro/TS errors) + visual check in `bun run dev`. There is no unit-test harness for static markup; the "test" step is a build + a concrete visual checklist.

---

### Task 1: Rewrite the pricing cards (header + three-card grid)

Full rewrite of `Pricing.astro` down to (but not including) the below-grid footer, which Task 2 adds. After this task the section renders three complete, correct cards with new copy, badges, strike anchors, tier icons, the coin row, and footnotes.

**Files:**
- Modify (full rewrite): `src/components/Pricing.astro`

**Interfaces:**
- Consumes: design tokens from `src/styles/global.css`; the `.eyebrow` and `.reveal` global classes (already used by the current file).
- Produces: a `<section id="pricing">` containing `.reveal` header + `.price-grid` with three `.price` cards (middle one `.price.hot`). Task 2 appends a sibling `.pricing-foot` block inside the same `.mx-auto` container and links a chevron to `#get-started`.

- [ ] **Step 1: Replace the file contents**

Overwrite `src/components/Pricing.astro` with exactly this (note: the below-grid footer and its styles are intentionally absent — Task 2 adds them):

```astro
---
/**
 * Pricing — 3-tier plan grid (§5 of the design handoff, reworked 2026-07-26).
 *
 * Real pricing: Starter €5.99/mo · Yearly €9.99/mo · Lifetime €300 once.
 * Cards are informational — NO per-card CTA; conversion is the shared
 * CtaBand directly below (the scroll chevron in `.pricing-foot` bridges to
 * it via `#get-started`).
 *
 * `repeat(3,1fr)` above 900px, collapsing to a single centered column
 * (max 440px) below it — this section's breakpoint is 900px, unlike the
 * 860px used by Features/How-it-works. The middle "Yearly" tier is
 * highlighted with a primary border + elevated shadow.
 *
 * The struck `€10.99` anchor MUST render — it is what makes Yearly read as
 * cheaper than Starter. The €5.99 rate is permanent for the first 2,500
 * customers (see the Starter footnote), NOT a first-year promo.
 *
 * `.reveal` elements fade+rise in once via IntersectionObserver, scoped to
 * this section's DOM subtree — see Features.astro for the same pattern.
 */
---

<section id="pricing" class="w-full py-16 min-[860px]:py-[74px]">
  <div class="mx-auto max-w-[1200px] px-5 min-[860px]:px-7">
    <div class="reveal text-center max-w-[560px] mx-auto mb-11">
      <div class="eyebrow mb-[14px]">Pricing</div>
      <h2 class="text-ink text-[clamp(30px,3.6vw,44px)] mb-3">
        Lock in early-bird pricing.
      </h2>
      <p class="m-0 text-t2 text-[16px]">
        Two subscriptions and a one-off Lifetime — the €5.99 rate is locked
        in for our first 2,500 customers.
      </p>
    </div>

    <div class="price-grid grid grid-cols-1 min-[900px]:grid-cols-3 gap-[18px] items-stretch">
      <!-- Starter -->
      <div class="price reveal flex flex-col">
        <div class="ptier-row">
          <span class="ptier-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>
          </span>
          <span class="ptier">Starter</span>
        </div>
        <span class="pbadge pbadge-gold">Early bird</span>
        <div class="pprice-row">
          <span class="panchor">€10.99</span>
          <span class="pprice">€5.99</span><span class="pmo">/mo</span>
        </div>
        <div class="psub text-t3">cancel anytime</div>
        <div class="pfeat flex-1">
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>100</strong> replies per month</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>1</strong> business location</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span>Reviews up to <strong>60 days</strong> back</span>
          </div>
          <div class="pfeat-row">
            <span class="coin" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
            </span>
            <span><strong>Under 20 cents a day</strong></span>
          </div>
        </div>
        <div class="pfoot">€5.99/mo locked in for our first 2,500 customers — then €10.99/mo.</div>
      </div>

      <!-- Yearly (hot) -->
      <div class="price hot reveal flex flex-col">
        <div class="ptier-row">
          <span class="ptier-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path></svg>
          </span>
          <span class="ptier">Yearly</span>
        </div>
        <span class="pbadge pbadge-pop">Most popular</span>
        <div class="pprice-row">
          <span class="panchor">€10.99</span>
          <span class="pprice">€9.99</span><span class="pmo">/mo</span>
        </div>
        <div class="psub text-t3">billed annually — €119.88</div>
        <div class="pfeat flex-1">
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>200</strong> replies per month</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>3</strong> business locations</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span>Reviews up to <strong>12 months</strong> back</span>
          </div>
        </div>
      </div>

      <!-- Lifetime -->
      <div class="price reveal flex flex-col">
        <div class="ptier-row">
          <span class="ptier-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2-2.7-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.3 6-4Zm0 0c2 2.7 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.3-6 4Z"></path></svg>
          </span>
          <span class="ptier">Lifetime</span>
        </div>
        <span class="pbadge pbadge-neutral">One-off payment</span>
        <div class="pprice-row">
          <span class="pprice">€300</span><span class="pmo">once</span>
        </div>
        <div class="psub text-t3">pays for itself in about 30 months</div>
        <div class="pfeat flex-1">
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>Unlimited</strong> replies*</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span><strong>5</strong> business locations</span>
          </div>
          <div class="pfeat-row">
            <span class="tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </span>
            <span>Reviews all the way back to <strong>day one</strong></span>
          </div>
        </div>
        <div class="pfoot">*Fair use: up to 1,000 replies per month.</div>
      </div>
    </div>
  </div>
</section>

<style>
  @media (max-width: 899.98px) {
    .price-grid {
      max-width: 440px;
      margin: 0 auto;
    }
  }

  .price {
    background: var(--card);
    border: 1px solid var(--b08);
    border-radius: 18px;
    padding: 30px;
    transition: transform 0.26s var(--ease-snap), box-shadow 0.26s;
  }
  .price:hover {
    transform: translateY(-3px);
  }
  .price.hot {
    border-color: var(--primary);
    box-shadow: 0 30px 60px -34px rgba(194, 105, 63, 0.6);
  }

  .ptier-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
  }
  .ptier-icon {
    color: var(--accent-tx);
    line-height: 0;
    flex-shrink: 0;
  }
  .ptier {
    font: 600 14px var(--font-eyebrow);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--t3);
  }

  .pbadge {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    font: 700 11px var(--font-eyebrow);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 5px 11px;
    border-radius: 99px;
    border: 1px solid transparent;
  }
  /* Gold tint is theme-independent (--gold is #e0a82e in both themes), so
     the rgba literals are a deliberate one-off; the text color is a token so
     it still adapts per theme. */
  .pbadge-gold {
    background: rgba(224, 168, 46, 0.15);
    border-color: rgba(224, 168, 46, 0.5);
    color: var(--accent-tx);
  }
  .pbadge-pop {
    background: var(--primary);
    color: var(--pf);
  }
  .pbadge-neutral {
    background: var(--inset);
    border-color: var(--b12);
    color: var(--t3);
  }

  .pprice-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 14px 0 4px;
  }
  .panchor {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--t4);
    text-decoration: line-through;
  }
  .pprice {
    font-family: var(--font-display);
    font-size: 44px;
    font-weight: 500;
    line-height: 1;
    color: var(--ink);
  }
  .pmo {
    font-size: 16px;
    font-family: var(--font-sans);
    font-weight: 400;
    color: var(--t3);
  }

  .psub {
    font-size: 13.5px;
    margin-bottom: 20px;
  }

  .pfeat {
    display: flex;
    flex-direction: column;
    gap: 11px;
    font-size: 14px;
    color: var(--t1);
  }
  .pfeat-row {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }
  .pfeat-row strong {
    font-weight: 700;
    color: var(--ink);
  }
  .tick {
    color: var(--ok);
    flex-shrink: 0;
    line-height: 0;
    margin-top: 3px;
  }
  .coin {
    color: var(--gold);
    flex-shrink: 0;
    line-height: 0;
    margin-top: 3px;
  }

  .pfoot {
    margin-top: 18px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--t3);
  }

  @media (prefers-reduced-motion: reduce) {
    .price {
      transition: none;
    }
    .price:hover {
      transform: none;
    }
  }
</style>

<script>
  ;(function () {
    const root = document.getElementById("pricing")
    if (!root) return
    const reveals = root.querySelectorAll<HTMLElement>(".reveal")
    if (!reveals.length) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in")
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    reveals.forEach((el) => observer.observe(el))
  })()
</script>
```

- [ ] **Step 2: Build to verify no errors**

Run: `bun run build`
Expected: build completes with no errors (exit 0). Astro/TS errors here mean a malformed template — fix before continuing.

- [ ] **Step 3: Visual check in the dev server**

Run: `bun run dev` and open the pricing section (`http://localhost:4321/#pricing`). Confirm:
- Three cards: Starter, Yearly (highlighted with terracotta border + shadow), Lifetime.
- Struck-through `€10.99` shows left of `€5.99` (Starter) and `€9.99` (Yearly); Lifetime shows `€300 once` with no anchor.
- Badges: `Early bird` (gold-tinted), `Most popular` (filled terracotta), `One-off payment` (neutral).
- Tier icons (sprout / calendar / infinity) render tinted next to each tier name.
- Coin row on Starter (`Under 20 cents a day`) uses a gold coin icon, not a green tick.
- Footnotes render at the bottom of Starter and Lifetime; cards stay equal height.
- Toggle dark mode (the header toggle) — text, badges, and footnotes remain legible (AA). If the gold badge or a footnote looks low-contrast in either theme, nudge the badge tint alpha / use `--t2` for the footnote and re-check.
- Narrow the window below 900px — cards stack to one centered column (max 440px).
- The phrase "in your first year" appears nowhere.

- [ ] **Step 4: Commit**

```bash
git add src/components/Pricing.astro
git commit -m "feat: rework pricing to real three-plan model"
```

---

### Task 2: Below-grid agency line + scroll chevron bridge

Adds the "agency plan" line and a scroll chevron that jumps to the CtaBand, since the cards have no CTA. Requires giving the CtaBand an anchor target.

**Files:**
- Modify: `src/components/CtaBand.astro` (add `id="get-started"` to the `<section>`)
- Modify: `src/components/Pricing.astro` (append `.pricing-foot` block inside the container; add its styles)

**Interfaces:**
- Consumes: the `.price-grid`/container markup and tokens from Task 1.
- Produces: an in-page anchor `#get-started` on the CtaBand section; a `.pricing-foot` block with the agency link (`/contact`) and a chevron `<a href="#get-started">`.

- [ ] **Step 1: Add the anchor id to the CtaBand section**

In `src/components/CtaBand.astro`, change the opening section tag:

```astro
<section class="w-full pb-16 min-[860px]:pb-[74px]">
```

to:

```astro
<section id="get-started" class="w-full pb-16 min-[860px]:pb-[74px]">
```

- [ ] **Step 2: Append the below-grid footer to Pricing**

In `src/components/Pricing.astro`, insert this block immediately after the closing `</div>` of `.price-grid` and before the closing `</div>` of the `.mx-auto` container (i.e. as the last child of `<div class="mx-auto max-w-[1200px] ...">`):

```astro
      <div class="pricing-foot reveal">
        <p class="agency">
          <span class="agency-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h18"></path><path d="M6 18v-7"></path><path d="M10 18v-7"></path><path d="M14 18v-7"></path><path d="M18 18v-7"></path><path d="M4 11l8-6 8 6"></path></svg>
          </span>
          More than 5 locations? <a href="/contact">Talk to us about an agency plan</a>
        </p>
        <a href="#get-started" class="scroll-cue" aria-label="Jump to sign-up">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
        </a>
      </div>
```

- [ ] **Step 3: Add the footer styles**

In the `<style>` block of `src/components/Pricing.astro`, add these rules immediately before the closing `@media (prefers-reduced-motion: reduce)` block:

```css
  .pricing-foot {
    margin-top: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }
  .agency {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14.5px;
    color: var(--t2);
    text-align: center;
  }
  .agency-icon {
    color: var(--t3);
    line-height: 0;
    flex-shrink: 0;
  }
  .agency a {
    color: var(--accent-tx);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .agency a:hover {
    color: var(--primary);
  }
  .scroll-cue {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 99px;
    background: var(--card);
    border: 1px solid var(--b16);
    color: var(--t2);
    transition: transform 0.26s var(--ease-snap), border-color 0.22s, background 0.22s;
  }
  .scroll-cue:hover {
    transform: translateY(2px);
    border-color: var(--b28);
    background: var(--hover);
  }
```

Then, in the existing `@media (prefers-reduced-motion: reduce)` block of the same `<style>`, add `.scroll-cue` to the transition-none rule and a no-transform hover so the reduced-motion set reads:

```css
  @media (prefers-reduced-motion: reduce) {
    .price,
    .scroll-cue {
      transition: none;
    }
    .price:hover,
    .scroll-cue:hover {
      transform: none;
    }
  }
```

- [ ] **Step 4: Build to verify no errors**

Run: `bun run build`
Expected: build completes with no errors (exit 0).

- [ ] **Step 5: Visual check**

Run: `bun run dev` and at the pricing section confirm:
- Below the cards: a centered line "🏛 More than 5 locations? **Talk to us about an agency plan**" with the linked text underlined; the link points to `/contact` (click it → contact page loads).
- A round chevron-down button is centered below the agency line.
- Clicking the chevron smooth/instant-scrolls down to the "Stop dreading your reviews." CtaBand (the `#get-started` anchor).
- Both elements fade in with the section (`.reveal`), and look correct in light and dark mode.

- [ ] **Step 6: Commit**

```bash
git add src/components/Pricing.astro src/components/CtaBand.astro
git commit -m "feat: add agency-plan line and scroll-to-CTA chevron to pricing"
```

---

## Self-Review

**Spec coverage** (against `2026-07-26-pricing-revamp-design.md`):
- Section shell / header copy → Task 1 Step 1. ✓
- All three cards (icons, badges, anchor, price, sub-line, features, footnotes) → Task 1 Step 1. ✓
- Anchor renders on Starter + Yearly, none on Lifetime → Task 1 markup + `.panchor` style. ✓
- "in your first year" dropped; 2,500 permanence in Starter footnote + section sub → Task 1. ✓
- Badge re-map to gold/terracotta/neutral → `.pbadge-*` styles. ✓
- Coin row → `.coin` + Starter markup. ✓
- No per-card CTA → cards contain no button. ✓
- Agency line → `/contact` → Task 2. ✓
- Scroll chevron → `#get-started` on CtaBand → Task 2. ✓
- Dark mode + reduced-motion → tokens + reduced-motion media block. ✓
- Out-of-scope backend items → not touched. ✓

**Placeholder scan:** No TBD/TODO; every code step contains full markup/CSS. ✓

**Type/name consistency:** Class names used in markup (`.pbadge-gold/-pop/-neutral`, `.ptier-row`, `.ptier-icon`, `.pprice-row`, `.panchor`, `.coin`, `.pfoot`, `.pricing-foot`, `.agency`, `.agency-icon`, `.scroll-cue`) each have a matching style rule. The `#get-started` anchor produced in Task 2 Step 1 matches the `href="#get-started"` in Task 2 Step 2. ✓
