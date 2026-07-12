# ReplyOmat Landing Page Clay Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the indigo/obsidian template landing page with the shipped app's warm "clay" design system, per the high-fidelity handoff in `docs/design-handoff/`, plus brand favicon assets and a small set of in-system creative touches.

**Architecture:** Single-page Astro 5 site (`src/pages/index.astro` owns the `<html>` shell and composes seven section components) styled with Tailwind v4 CSS-variable tokens in `src/styles/global.css`. The design source of truth is `docs/design-handoff/ReplyOmat Landing.dc.html` (open in a browser next to `support.js` to view) and `docs/design-handoff/README.md` (verbatim tokens, section specs, breakpoints). The `.dc.html` prototype runtime is NOT shipped — recreate, don't copy.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@tailwindcss/vite`), Bun, vanilla JS for motion (IntersectionObserver, typewriter loop), Google Fonts (Fraunces, Hanken Grotesk, Spline Sans Mono).

## Global Constraints

- Design fidelity: **high** — match `ReplyOmat Landing.dc.html` pixel-closely; all tokens verbatim from `docs/design-handoff/README.md` §Design tokens.
- Primary CTA wording everywhere: **"Get Early Access"**. Never describe review ingestion as "sync" — reviews arrive automatically via the Google Business API.
- Responsive 320 → 1440+, **no horizontal overflow**. Breakpoints: 900px (pricing → 1 col), 860px (hero/features/how → 1 col, nav hidden), 520px (footer stacks). **Grid columns must be classes, never inline styles.**
- Motion: ~260ms `cubic-bezier(.22,.61,.36,1)`; animate transform/opacity only; ALL motion (ripple rings, typewriter card, scroll reveals, pulsing dot) disabled under `prefers-reduced-motion`.
- WCAG AA contrast, visible `:focus-visible` states, designed hover states on every interactive element.
- Theme = `dark` class on `<html>` (header sun/moon toggle, default light, persisted in `localStorage`); themed background must sit on `html`/`body` so the whole page darkens.
- Keep `import.meta.env.BASE_URL` prefix on all `public/` asset URLs (GitHub Pages base-path compatibility). Do not touch deploy configuration.
- Do not ship `support.js` or any `.dc.html` content verbatim; do not add new npm dependencies.
- Old styles to delete entirely: `.obsidian-bg`, `.glass-panel`, `.glow-effect`, `.timeline-line`, indigo/oklch shadcn tokens, and the Space Grotesk / Inter Tight / JetBrains Mono / Material Symbols font imports.
- Verification for every task: `bun run build` passes; visual check against the reference at the task's breakpoints, light AND dark.
- Commit after each task with a conventional-commit message.

---

### Task 1: Foundation — tokens, fonts, page shell, theme toggle

**Files:**
- Modify: `src/styles/global.css` (replace fonts + all `:root`/`.dark` tokens; delete obsidian/glass/glow/timeline styles)
- Modify: `src/pages/index.astro` (head metadata, body classes, inline theme-init script)

**Interfaces:**
- Produces: CSS variables per handoff README §Design tokens (light `:root`, dark `.dark`) exposed to Tailwind v4 via `@theme inline` as `--color-*` slots (map: `--color-bg:var(--bg)`, `--color-card:var(--card)`, `--color-inset:var(--inset)`, `--color-board:var(--board)`, `--color-hover-fill:var(--hover)`, `--color-ink:var(--ink)`, `--color-t1..t4`, `--color-primary`, `--color-primary-h`, `--color-pf`, `--color-accent-tx`, `--color-chip`, `--color-chip-bd`, `--color-ok`, `--color-ok-bg`, `--color-gold`, `--color-star-off`); font vars `--font-sans` (Hanken Grotesk), `--font-display` (Fraunces), `--font-eyebrow` (Spline Sans Mono); easing var `--ease-snap: cubic-bezier(.22,.61,.36,1)`; `--pshadow`. Alpha-ink border ladder `--b06/--b08/--b12/--b16/--b28` as full rgba values (README abbreviates the light ladder — expand each to `rgba(34,30,25,.NN)`, dark to `rgba(255,255,255,.NN)`).
- Produces: `window.__setTheme(dark: boolean)` global from the inline head script; Task 3's header toggle calls it. Script reads `localStorage.theme` ?? `prefers-color-scheme`, sets `dark` class on `<html>` before paint (no flash), persists on change.

- [ ] **Step 1: Replace font imports in `global.css`** — remove the four old `@import url(...)` font lines; add one Google Fonts import for `Fraunces:opsz,wght@9..144,400..700` + `Hanken+Grotesk:wght@400..800` + `Spline+Sans+Mono:wght@500;600` with `display=swap`.
- [ ] **Step 2: Replace tokens** — copy the light and dark token blocks verbatim from `docs/design-handoff/README.md` §Design tokens into `:root` and `.dark` (expanding the abbreviated border-ladder entries to full rgba values); rewrite `@theme inline` to expose the mapping in Produces; delete every leftover indigo/oklch token, `--primary-dark`, sidebar/chart tokens, and the `.obsidian-bg`/`.glass-panel`/`.glow-effect`/`.timeline-line` rules.
- [ ] **Step 3: Base styles** — `body { background:var(--bg); color:var(--t1); font-family:var(--font-sans); }`; headline elements default `font-display`; add `.eyebrow` utility (Spline Sans Mono, 500–600, uppercase, `letter-spacing:.14em`, color `--accent-tx`); add `.ripple-ring` keyframes (scale+opacity, 7s ease-out loop, per the app's pattern in the reference) with a `prefers-reduced-motion` kill switch; add `.reveal`/`.in` scroll-reveal classes (fade + 22px rise, 260ms `--ease-snap`), also killed under reduced motion.
- [ ] **Step 4: Page shell in `index.astro`** — title `ReplyOmat — Your reviews, answered in your voice.`; add `<meta name="description">` (one sentence: AI drafts on-brand replies to your Google reviews; you approve, it publishes to Google); OG + Twitter-card tags (`og:title`, `og:description`, `og:url` `https://replyomat.ai`, `og:type` `website`); replace body classes with clay equivalents (`bg` background, `t1` text, `overflow-x-hidden`); add the inline theme-init script (Interfaces above) in `<head>` before CSS paint-sensitive content.
- [ ] **Step 5: Verify** — `bun install && bun run build` → exits 0. `bun run dev`, open page: clay `#f7f3ec` background, no indigo anywhere (sections will still look broken — fine). Toggle `document.documentElement.classList.add('dark')` in console: whole page (including body backdrop) turns `#1e1a15`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: clay design tokens, fonts, theme toggle foundation"`

### Task 2: Brand assets — logo mark + favicon set

**Files:**
- Create: `src/components/Logo.astro` (replace existing logo usage; check `src/components/` for a current Logo import in `Header.astro` and update)
- Replace: `public/favicon.svg`, `public/favicon.ico`
- Create: `public/apple-touch-icon.png` (180×180)
- Modify: `src/pages/index.astro` (head: apple-touch-icon link; keep `BASE_URL` prefix pattern)

**Interfaces:**
- Consumes: token values from Task 1 (hardcode the hex values inside the SVG assets — favicons can't read CSS vars from the page).
- Produces: `<Logo />` component rendering the mark + wordmark ("reply" in `--ink`, "omat" in `--primary`); Task 3's header and footer consume it.

- [ ] **Step 1: Logo component** — per README §Logo mark: two offset rounded bars (short `--star-off` bar top-left = review, wider `--primary` bar bottom-right = reply) + wordmark. Match the reference's proportions (inspect the `.dc.html` header in a browser).
- [ ] **Step 2: favicon.svg** — standalone SVG of the two-bar mark on transparent background, hexes hardcoded (`#ddd5c8` + `#c2693f`); embed a `@media (prefers-color-scheme: dark)` style block inside the SVG swapping the bars to `#4a443a` + `#d57e52` so the favicon adapts to browser theme.
- [ ] **Step 3: favicon.ico + apple-touch-icon.png** — render the SVG to 32×32 ICO and a 180×180 PNG on cream `#fffdf9` rounded background (use whatever local tooling is available, e.g. `rsvg-convert`/`sips`/Playwright screenshot of the SVG; no new npm deps).
- [ ] **Step 4: Wire in head** — add `<link rel="apple-touch-icon" href={`${import.meta.env.BASE_URL}apple-touch-icon.png`}/>`; keep existing svg/ico links (paths unchanged, files replaced).
- [ ] **Step 5: Verify** — `bun run dev`; browser tab shows the clay mark in light and dark OS theme; `bun run build` passes.
- [ ] **Step 6: Commit** — `git commit -am "feat: clay logo mark and favicon set"`

### Task 3: Header + Footer

**Files:**
- Modify: `src/components/Header.astro` (full rewrite)
- Modify: `src/components/Footer.astro` (full rewrite)

**Interfaces:**
- Consumes: `<Logo />` (Task 2), `window.__setTheme` (Task 1).
- Produces: nav anchor targets `#features`, `#how-it-works`, `#pricing` — Tasks 4–6 sections must carry these ids.

- [ ] **Step 1: Header** — per README §Sections 1: sticky, blurred backdrop, transparent bottom border that becomes visible on scroll (scroll listener toggling a `.scr` class); `<Logo />`; nav Features · How it works · Pricing (hidden < 860px via class); sun/moon theme toggle button (aria-label, calls `__setTheme`, swaps icon); primary "Get Early Access" pill button (`--pshadow`, hover lift `translateY(-2px)` + `--primary-h`).
- [ ] **Step 2: Footer** — per §7: wordmark, Privacy Policy · Terms of Service · Contact links, "© 2026 ReplyOmat"; stacks < 520px. No mega-footer.
- [ ] **Step 3: Verify** — build passes; compare against reference header/footer at 1440/860/320, light + dark; keyboard-tab shows designed focus rings; theme toggle persists across reload.
- [ ] **Step 4: Commit** — `git commit -am "feat: clay header with theme toggle and minimal footer"`

### Task 4: Hero with animated product card

**Files:**
- Modify: `src/components/Hero.astro` (full rewrite; co-located `<script>` for the card loop)

**Interfaces:**
- Consumes: `.eyebrow`, `.ripple-ring`, tokens (Task 1).
- Produces: `#hero` section; the "See how it works" ghost button links `#how-it-works`.

- [ ] **Step 1: Layout + copy** — per §2: 2-col `1.05fr .95fr` grid (class-based, 1 col < 860px). Left: "Invite-only beta" badge with pulsing dot, Fraunces headline **"Your reviews, answered in your voice."**, subhead (drafts the moment a review lands, publish to Google in one tap), primary CTA + ghost "See how it works", reassurance line "Nothing is posted without your approval." Ripple rings behind.
- [ ] **Step 2: Animated product card** — right column card cycling: review (5 `--gold` stars, "Maria Sousa", review text) → "Drafting a reply" + spinner → reply text typewriters in → "Your draft" with **Approve & publish** (primary) + Edit (ghost) → green `--ok` "Published to Google" confirmation → loop. Reserve the action row height (~44px) so the card never resizes. Floating "Rated 4.8 on Google" chip at bottom-right. Vanilla JS state machine in the component `<script>`; under reduced motion, render the static "Your draft" phase with no cycling.
- [ ] **Step 3: Verify** — build passes; watch two full loop cycles (no layout shift, no overflow at 320); check dark mode colors; emulate reduced motion (`playwright-cli` or devtools) → static card, no rings.
- [ ] **Step 4: Commit** — `git commit -am "feat: clay hero with animated draft-to-published product card"`

### Task 5: Features bento + How it works band

**Files:**
- Modify: `src/components/Features.astro` (full rewrite)
- Modify: `src/components/HowItWorks.astro` (full rewrite)

**Interfaces:**
- Consumes: `.reveal` scroll-reveal, `.eyebrow`, tokens.
- Produces: section ids `#features`, `#how-it-works`.

- [ ] **Step 1: Features bento** — per §3: `1.4fr 1fr 1fr` bento (classes; 1 col < 860px), varied cell sizes: Brand tone control (tall; pencil icon; three tone pills, Warm active in chip colors) · Approve & publish (check icon) · Multi-location (map-pin icon) · Every review, automatically (wide; inbox icon; Google Business profile copy — no "sync" wording). Inline SVG icons (reuse lucide paths already in deps or hand-inline; no icon font).
- [ ] **Step 2: How it works** — per §4: full-width `--board` band; `.85fr 1.15fr` 2-col, left sticky (eyebrow + Fraunces "From new review to posted reply in about ten seconds."); right: 3 numbered steps with connecting line — review lands / AI drafts in your voice / you approve, it posts to Google.
- [ ] **Step 3: Verify** — build passes; scroll-reveals fire once per section (and not under reduced motion); compare vs reference at 1440/860/320 light+dark; sticky column behaves (and un-sticks < 860px).
- [ ] **Step 4: Commit** — `git commit -am "feat: features bento and how-it-works board band"`

### Task 6: Pricing + CTA band

**Files:**
- Modify: `src/components/Pricing.astro` (full rewrite)
- Create: `src/components/CtaBand.astro`
- Modify: `src/pages/index.astro` (insert `<CtaBand />` between `<Pricing />` and `<Footer />`)

**Interfaces:**
- Consumes: `.ripple-ring` (white-tint variant), `.reveal`, tokens.
- Produces: `#pricing` id.

- [ ] **Step 1: Pricing** — per §5: 3 tiers `repeat(3,1fr)` (classes; 1 col < 900px), middle "Growth €29/mo" highlighted (primary border + "Most popular" tag): Starter €0 (1 location, 30 replies/mo) · Growth (up to 5 locations, unlimited replies, team roles, priority drafting) · Enterprise Custom (unlimited, SSO & audit, dedicated support). Fraunces price numbers; `--ok` check ticks; CTAs "Get Early Access" / "Contact us".
- [ ] **Step 2: CTA band** — per §6: full-width rounded panel, **fixed terracotta gradient** `linear-gradient(135deg,#c2693f,#a5542f,#8f4a2c)` identical in both themes (never `--ink`); white Fraunces headline "Stop dreading your reviews.", light subtext, cream button (`#fffdf9` bg, `#a5542f` text); white-tint ripple rings behind.
- [ ] **Step 3: Verify** — build passes; CTA band reads identically light vs dark; contrast of cream-on-gradient button AA; 320px no overflow.
- [ ] **Step 4: Commit** — `git commit -am "feat: pricing tiers and terracotta CTA band"`

### Task 7: Creative touches (in-system polish)

**Files:**
- Modify: `src/styles/global.css`, `src/components/Hero.astro`, `src/components/HowItWorks.astro`, `src/components/CtaBand.astro`

**Interfaces:** none new — purely additive polish; every touch stays inside the clay token system.

- [ ] **Step 1: `::selection`** — chip colors: light `background:#fbeee7; color:#b35a35`, dark `background:#3a2a21; color:#e6a679`.
- [ ] **Step 2: Paper grain** — subtle SVG turbulence noise overlay (inline data-URI, `opacity ≤ .04`, `pointer-events:none`) on the How-it-works `--board` band and the CTA band, both themes — atmosphere per the clay direction, invisible at a glance, warmer up close.
- [ ] **Step 3: Headline accent** — in the hero headline, set "in your voice." in Fraunces *italic* with a hand-drawn star-gold (`--gold`) underline swash (inline SVG path under the text, `stroke-width` ~3, draws in via `stroke-dashoffset` on load; static when reduced motion).
- [ ] **Step 4: Focus rings** — global `:focus-visible` style: 2px `--primary` ring with 2px offset (`--pf`-colored offset on the gradient band).
- [ ] **Step 5: Verify** — build passes; each touch visible-but-quiet in both themes; underline swash static under reduced motion; AA contrast unaffected.
- [ ] **Step 6: Commit** — `git commit -am "feat: selection, grain, headline swash, focus polish"`

### Task 8: Full verification pass

**Files:** none (verification only; fixes loop back into the owning task's files)

- [ ] **Step 1: Build** — `bun run build` → exits 0, no warnings introduced by this work.
- [ ] **Step 2: Breakpoint screenshots** — with `playwright-cli` against `bun run dev`: capture 320, 375, 768, 860±1, 1024, 1440 in light AND dark (12+ shots). Check each against the reference `.dc.html` side by side.
- [ ] **Step 3: Overflow check** — at each width: `document.documentElement.scrollWidth <= window.innerWidth`.
- [ ] **Step 4: Reduced motion** — emulate `prefers-reduced-motion: reduce`: no ripple, no card cycling, no reveals, no swash draw-in, no pulsing dot.
- [ ] **Step 5: Keyboard pass** — tab through header → hero CTAs → tone pills → pricing CTAs → footer; every stop shows the designed focus ring; theme toggle operable via keyboard.
- [ ] **Step 6: Copy audit** — grep the built `dist/` for banned/stale strings: `grep -riE "sync|copy.?paste|AI Review Response|Start Free Trial|\\$29|\\$79" dist/` → no hits (prices are €); every primary CTA says "Get Early Access".
- [ ] **Step 7: Commit any fixes** — `git commit -am "fix: verification pass fixes"` (only if changes).
