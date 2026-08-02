# FiveStar Local — Landing Page Brand Alignment & Visual Upgrade

**Date:** 2026-08-01
**Status:** Awaiting user approval
**Supersedes (visually):** `2026-07-07-fivestar-local-landing-design.md` color system
**Related:** `docs/brand/fivestar-local-brand-kit.html` (Cobalt & Honey, commit `0a73924`)

## Problem

The landing page reads as generic. The cause is not typography and not motion — both were
verified working — it is that **the brand migrated and the landing page did not follow.**

The July 7 spec specified a Google-inspired palette (Google Blue `#4285F4`, Green `#34A853`,
Yellow `#FBBC05`, Red `#EA4335`). Commits `0a73924` / `529bfee` replaced that with the
**Cobalt & Honey** identity, whose kit states explicitly: *"Honey `#e8a317`, never Google
yellow."* The site still renders the older Google-derived system. A page built to resemble
another company's design language reads as templated by construction.

### Verified evidence (live instrumentation, 2026-08-01, 1440x900)

| Finding | Measurement |
|---|---|
| Bricolage Grotesque **is** applied | `h1` 54.4px / 700 / −1.36px; `h2` 36px / 700 / −0.9px |
| Motion **is** installed and wired | `motion@12.42.2`; `Reveal` (`whileInView`, `once: true`) used in 8 of 9 sections |
| `prefers-reduced-motion` respected | 2 media queries present; `useReducedMotion()` in `hero.tsx`, `reveal.tsx` |
| Page loads fast | 1.52s to networkidle; 0 images, 0 video — all CSS/SVG |
| **Only 2 background values** | 9 sections alternate `bg-white` / `bg-slate-50`, plus one `bg-slate-900` at the end |
| **Honey is unused** | `#e8a317` appears nowhere except star glyphs |
| **Cobalt is generic** | Used as default "primary blue" on buttons/links, not structurally |
| **No layout variation** | Every section: `max-w-6xl`, `py-24`, centered container |
| **Hero underweight** | Section 758px tall; content ~500px; large dead zone bottom-right |

**Conclusion:** the defect is *rhythm and colour deployment*, not craft. That is a cheaper fix
than a redesign, which is why the staged scope below is appropriate.

## Goals

- Page reads as a confident small studio's work — enough that visitors ask who built it
- Trust is preserved for the primary buyer: a local shop owner deciding in under a minute
- Cobalt & Honey fully deployed; all Google-derived colour retired
- Two sections earn genuine attention ("moments"); the rest get consistent lift
- No regression in load time, accessibility, or reduced-motion behaviour

## Non-Goals (YAGNI)

- No GSAP, no Lenis, no smooth-scroll hijacking — Motion 12 is already present and sufficient
- No preloader (actively harmful to conversion; the 1.52s load is an asset)
- No horizontal-scroll section — there is no gallery to justify one
- No hero→sidebar FLIP morph — ~600 lines for a persistent nav across 9 short sections
- No photography sourcing — the synthetic/CSS aesthetic is coherent and free
- No copy rewrite; `lib/content.ts` stays the single source of copy

## Direction — "Commit hard to Cobalt & Honey"

Chosen over tactile-product-first and bold-editorial. Rationale: the distinctive thing already
exists and is decided, so most work is *application*, not invention. It is the highest ratio of
impact to hours and carries the least trust risk with an SMB buyer.

### Palette (from the brand kit — no new colour invented)

| Token | Value | Role |
|---|---|---|
| Ink | `#0f1b3d` | Dark ground sections, headline text |
| Cobalt | `#2749d6` | Structural — primary CTA, rules, active states, NFC rings |
| Honey | `#e8a317` | Deliberate accent — stars, "Top result", one CTA. Never Google yellow |
| Paper | `#ffffff` | Light ground |
| Mist | `#f7f9fc` | Secondary light ground |
| Slate | `#5b6b83` | Body text |
| Hairline | `#e4e9f1` | Borders, dividers |

**Retired:** `#4285f4`, `#fbbc05`, `#ea4335`, `#34a853` and generic `slate-*` chrome.
Green `#34a853` is retained *only* for the literal "Review posted" success state, where it
reads as system feedback rather than brand.

### Section rhythm — the core fix

Replace 2-value alternation with a deliberate 4-beat ladder so the page has cadence:

```
Hero            PAPER   (light, open, confident)
How it works    MIST
Tap sequence    INK     ← moment, dark ground, card glows
What you get    PAPER
Ranking climb   MIST    ← moment
Pricing         INK     (decision moment, dark = weight)
Team note       PAPER
FAQ             MIST
Final CTA       COBALT  (was slate-900 — now brand, not generic dark)
```

Two dark grounds mid-page break the monotony and let Cobalt and Honey actually glow. This
single change does more visible work than any animation in this document.

### Typography

- Hero `h1`: 54px → **72px** desktop (clamp to 40px mobile), weight 700 → **800**, tracking −0.03em
- Section `h2`: 36px → **44px**, weight 800, tracking −0.025em
- Body: `slate-600` → Slate `#5b6b83` at 17px/1.7 for comfortable reading
- Eyebrows keep Geist Mono uppercase tracking — already correct, and a genuine signature

### Layout variation

Break the uniform `max-w-6xl` / `py-24` container:

- Alternate asymmetric splits (60/40, 40/60) instead of even 2-col everywhere
- Vary vertical rhythm: `py-20` / `py-28` / `py-32` by section weight
- Allow two sections to bleed full-width against their ground
- Hero: fill the dead zone — card larger, offset, closer to the headline

## The Two Moments

### Moment 1 — Ranking climb (`components/site/review-showcase.tsx`, 185 lines)

Currently shows the *end state*: Bella's Bakery already at #1, 4.9 (212), badge lit. The viewer
sees the destination but never the journey — and the journey is the pitch.

Rebuild as a scroll-scrubbed sequence on Ink ground:

| Progress | State |
|---|---|
| 0% | Bella's at **#3**, 3.9, 18 reviews, muted; Corner Bakehouse on top |
| 0–60% | Rating rolls 3.9 → 4.9; review count odometers 18 → 212; stars fill L→R in Honey |
| 40–80% | Rows reorder — Bella's rises past #2, past #1 |
| 80–100% | "Top result" badge scales in (Honey); row highlights Cobalt; phone slides in |

Implementation: Motion's `useScroll` + `useTransform` on a section-scoped target, plus
`layout` prop on rows for the reorder (Motion handles FLIP natively — no manual measurement).

**Must work on mobile.** Below 768px it degrades to a fire-once sequence on enter rather than
scrub, since scrub-on-touch is unreliable. This is non-negotiable: door-to-door prospects look
the site up on their phone.

### Moment 2 — Tap sequence (`components/site/scan-showcase.tsx`, 209 lines)

Currently auto-rotates on a ~2s timer (verified: cards shift one slot every ~2s, scale
1.08 → 0.96 → 0.9, opacity 1 → 0.8 → 0.4 → 0). Two problems: it advances whether or not
anyone is watching, and a reader still processing card 2 gets pulled to card 3.

Rebuild so scroll drives it, on Ink ground:

```
card taps → NFC ripple (Cobalt, 2.4s ease-out per brand kit)
  → phone wakes → review page loads → stars fill (Honey)
  → "Review posted — 15 seconds"
```

The "15 seconds" claim lands because the reader just spent ~15 seconds of scroll watching it.
A timer cannot produce that.

Uses `position: sticky` + a spacer for the pin — not a JS-measured pin — since section height
is known and CSS sticky is more robust across refresh.

Timer fallback retained for reduced-motion and below 768px.

## Architecture & File Impact

| File | Change | Est. |
|---|---|---|
| `app/globals.css` | Add Cobalt & Honey tokens; retire Google palette | M |
| `lib/brand.ts` *(new)* | Exported colour + easing constants, single source | S |
| `components/site/section.tsx` *(new)* | `<Section ground="paper\|mist\|ink\|cobalt">` wrapper owning rhythm + padding | S |
| `components/site/hero.tsx` | Structural rebuild — scale, asymmetry, dead-zone fix | L |
| `components/site/scan-showcase.tsx` | **Moment 2** — scroll-driven tap sequence | L |
| `components/site/review-showcase.tsx` | **Moment 1** — ranking climb | L |
| `components/site/odometer.tsx` *(new)* | Reusable digit-roll for counts and ratings | M |
| `how-it-works` `benefits` `pricing` `team-note` `faq` `final-cta` `navbar` `footer` | Restyle only — adopt `<Section>` + tokens | S each |
| `components/site/reveal.tsx` | Unchanged — already correct | — |
| `lib/content.ts` | Unchanged — no copy edits | — |

**New components are small and single-purpose:** `Section` owns ground + rhythm; `Odometer`
owns digit rolling; neither knows about the other. Both are independently testable.

## Testing

- `npm run build` must pass clean; `npm run lint` no new warnings
- `npm test` (Vitest) must stay green. Note: the suite covers `admin`, `auth`, `crm`, and
  `replydesk` only — **there is no automated coverage of `components/site/`.** These changes
  are therefore verified by build + lint + deliberate manual checks, not by tests. Adding
  render tests for the landing page is out of scope here and is a reasonable follow-up.
- Manual: 1440x900 and 390x844, both `prefers-reduced-motion` settings
- Verify load stays under ~2s to networkidle (guard against motion bloat)
- Verify contrast on Ink grounds meets WCAG AA for body text

## Risks

| Risk | Mitigation |
|---|---|
| Two dark sections make page feel heavy | Ink used only for the 2 moments + pricing; review at Phase 1 gate |
| Scroll-scrub unreliable on touch | Mobile degrades to fire-once on enter, by design |
| Motion bloat slows load | No new deps; Motion already bundled. Measure before/after |
| Honey reads as "Google yellow" anyway | Kit value `#e8a317` is materially warmer; use on stars + one CTA only |

## Phased Plan

### Phase 1 — approved scope, stop and evaluate

1. **Foundation** — `lib/brand.ts`, tokens in `globals.css`, `<Section>` component
2. **Global pass** — all 9 sections adopt `<Section>`, new type scale, retire Google palette
3. **Hero** — structural rebuild
4. **Moment 1** — ranking climb + `Odometer`
5. **Moment 2** — tap sequence
6. **Verify** — build, lint, tests, both viewports, both motion settings

**→ GATE: deploy to a Vercel preview, look at it, decide whether Phase 2 is needed.**

### Phase 2 — only if Phase 1 is not enough

Structural rework of the remaining six sections (how-it-works, benefits, pricing, team-note,
FAQ, final-CTA) rather than restyle. Scoped separately after the gate; not committed to now.

## Success Criteria

- Cobalt & Honey deployed; zero Google-derived colour remains outside the success state
- Page has four distinct grounds with deliberate cadence, not two alternating
- Hero has no dead zone and reads at a confident scale
- Both moments animate on desktop and degrade correctly on mobile and reduced-motion
- Build clean, tests green, load time not regressed
- Phase 1 ships without requiring Phase 2 to look finished
