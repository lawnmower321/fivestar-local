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

### Product correction (confirmed with the user 2026-08-02)

`components/site/nfc-card.tsx` renders a **dark credit-card rectangle** (`aspect-[1.586]`,
ID-1 card ratio, `bg-gradient-to-br from-slate-900`). **No such object exists in the product
line.** The real hardware is:

- **NFC cards** — the tap targets themselves
- **A matte-white PVC counter stand** — geometry confirmed from a user-supplied photo
  (2026-08-02): a single sheet with **one bend** — a portrait panel plus a flat base plate
  folding *forward*. An L in profile, not a triangle (the triangle is the negative space
  between the leaning panel and the table). Measured off the photo:

  | Property | Value |
  |---|---|
  | Panel aspect | ~3 : 4.4 **portrait** |
  | Corner radius | ~4–5% of panel width, front panel only |
  | Lean | ~15–18° back from vertical |
  | Base plate | folds forward, depth ≈ 30% of panel height |
  | Material thickness | ~1–2% of panel width (a visible sliver on the right edge) |
  | Shading | fully diffuse — **no specular highlight anywhere on the object** |

  The user's product is the same idea as Amazon B0D1R5M7G5; the stand "looks nicer in some
  spots" than a bare card.

The copy in `lib/content.ts` is already correct and sells both — "NFC cards + a counter
stand" (l.79), "2 NFC cards + counter stand" (l.118), "the cards, stand, and in-person
setup" (l.163). **Only the hero visual is wrong.** No copy changes are needed, and the
no-copy-rewrite non-goal below still holds.

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
- **No WebGL / `three`** — the hero object is matte white PVC; CSS 3D covers it (see The Hero
  Object for the threshold where this would stop being true)
- No phone-tap choreography in Phase 1 — deferred to the Phase 2 candidate list
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
Hero            INK     ← white stand reads only against dark; Cobalt rings glow
How it works    PAPER
Tap sequence    MIST    ← moment
What you get    PAPER
Ranking climb   INK     ← moment
Pricing         MIST
Team note       PAPER
FAQ             MIST
Final CTA       COBALT  (was slate-900 — now brand, not generic dark)
```

**Why the hero is Ink and not Paper:** the hero object is a *matte white* stand. On the
warm Paper ground it would nearly vanish; it needs a dark ground to read at all. Precedent
from the reference survey: TeraWulf opens on dark navy and switches to light content
sections below — the closest analog to this business in the whole survey.

Two dark grounds break the monotony and let Cobalt and Honey actually glow. This single
change does more visible work than any animation in this document.

**This is the decision most worth reviewing at the Phase 1 gate** — opening dark is a
bigger commitment than a mid-page dark band, and it is the one choice that could read as
too heavy for an SMB buyer.

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

## The Hero Object — scroll-rotating counter stand

Replaces the fictional dark credit card. Ink ground, matte-white stand as the focal object,
with an NFC card lying on the table beside it — this is literally the Starter bundle ("2 NFC
cards + counter stand"), so the composition is accurate to what the buyer receives.

**Built in CSS 3D, not WebGL.** The stand is two flat planes joined at a fold; the card is a
flat slab; the table is one plane. All live in a shared `transform-style: preserve-3d` space
under a single `perspective`, with `rotateY` driven by Motion's `useScroll`.

```
container        perspective: 1200px
  table plane    rotateX(~70deg), Ink with a soft radial pool of light
  stand          panel     portrait 3:4.4, rounded corners, rotateX(-17deg)
                 edge      separate thin element (~1.5% of width) — NOT a
                           rounded face; rounding the edge is where cheap
                           CSS 3D gives itself away
                 base      flat plate, folds forward at the crease,
                           depth ~30% of panel height
                 shadow    blurred ellipse, scales + offsets with rotation
  card           flat slab, translateZ above the table, offset beside the stand
```

**The photo confirms the object has no specular highlight at all** — it is fully diffuse
matte PVC. So a driven gradient is not an approximation of the real material; it *is* the
real material's behaviour. This is what settles the WebGL question: there is no light
response to simulate.

Note the panel is **portrait**, not the landscape `aspect-[1.586]` of the card it replaces —
it occupies hero space differently (taller, narrower, sits better in a side column than
centred).

**Where this approach would break down** (documented so the decision is on record): a
physically-tracking specular highlight, environment reflections, refraction, or a contact
shadow that deforms correctly through a full rotation. If the hero later wants a
product-render look, that is a `three` rebuild and a different budget. Matte white does not
warrant it.

**Scope honesty:** an object rotating on scroll is ~60 lines. The staged scene described
here — table, stand, card, shadow — is closer to 250 lines, and most of the time goes into
tuning perspective and shadow until it stops looking like flat cardboard. Phone-tap
choreography (phones flying in on an arc, contact, NFC ripple, retreat) is deliberately
**deferred to Phase 2**: if the object itself does not look convincing, adding phones will
not rescue it, and a well-executed rotating object alone still carries the hero.

## Techniques adopted from the reference survey

Surveyed 2026-08-02: terawulf.com, klimtwine.com, ricardochance.com, prixa.digital.
Adopted (cheap, high-yield, no new dependencies):

| Technique | Source | Applies to |
|---|---|---|
| **Rounded content slabs** — inset containers with generous radius, object bleeding off the edge | TeraWulf | `<Section variant="slab">`; creates rhythm through *shape*, so fewer colours are needed |
| **Scroll-rotating product object** | Klimt (WebGL bottle) | The hero stand, in CSS 3D |
| **Warm ground instead of pure white** | Klimt (`#cfc6bd` taupe) | Paper token warmed off screen-white — one token, outsized payoff |
| **Corner bracket frame** — L-brackets inset at page corners | Ricardo Chance | ~10 lines of CSS; reads as deliberate framing, best against Ink |
| **Hero quick-link strip** — 3-up row pinned to the hero base | TeraWulf | Fixes the measured ~250px hero dead zone: `See pricing →` / `How it works →` / `Book a call →` |
| **Tighter display tracking** (−0.04em, not −0.03em) | TeraWulf (−2.47px @ 61.7px) | Hero `h1` |
| **Serif-italic emphasis clause** | Ricardo Chance | `content.hero.highlight` — a font-style change on an existing span, no new markup |

**Rejected:** oversized Anton display type (too shouty for an SMB buyer), WebGL, full-bleed
video backgrounds (TeraWulf pays 42.3s to networkidle for these — this site loads in 1.52s
and that lead is worth protecting), sticky-stacking cards, `mix-blend-mode` type/media
overlap (needs real photography).

**Structural validation:** TeraWulf runs 39 ScrollTriggers, **all 39 scrubbed and zero
pinned**. This confirms the approach below — both moments are scrub-driven and unpinned, and
the one place sticky behaviour is needed uses CSS `position: sticky` rather than JS pinning.

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
| `components/site/hero.tsx` | Structural rebuild — Ink ground, scale, asymmetry, quick-link strip | L |
| `components/site/nfc-card.tsx` | **Replaced** by `counter-stand.tsx` — the dark credit card is not a real product | — |
| `components/site/counter-stand.tsx` *(new)* | CSS-3D matte-white stand + card on a table plane, scroll-rotated | L |
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

1. **Foundation** — `lib/brand.ts`, tokens in `globals.css`, `<Section>` (with `slab` variant)
2. **Global pass** — all 9 sections adopt `<Section>`, new type scale, retire Google palette
3. **Hero object** — `counter-stand.tsx`, the CSS-3D stand + card on a table plane
4. **Hero** — structural rebuild around it: Ink ground, quick-link strip, corner brackets
5. **Moment 1** — ranking climb + `Odometer`
6. **Moment 2** — tap sequence
7. **Verify** — build, lint, tests, both viewports, both motion settings

**→ GATE: deploy to a Vercel preview, look at it, decide whether Phase 2 is needed.**

Review at the gate, in priority order: (a) does opening on Ink read as premium or as heavy?
(b) does the stand read as a real object or as flat cardboard? (c) is the page still fast?

### Phase 2 — only if Phase 1 is not enough

Candidates, scoped separately after the gate; not committed to now:

- **Phone-tap choreography** on the hero stand — phones arc in, tap, NFC ripple fires,
  retreat. Deferred deliberately (see The Hero Object above).
- Structural rework of the remaining six sections (how-it-works, benefits, pricing,
  team-note, FAQ, final-CTA) rather than restyle.

## Success Criteria

- Cobalt & Honey deployed; zero Google-derived colour remains outside the success state
- Page has four distinct grounds with deliberate cadence, not two alternating
- Hero has no dead zone and reads at a confident scale
- Both moments animate on desktop and degrade correctly on mobile and reduced-motion
- Build clean, tests green, load time not regressed
- Phase 1 ships without requiring Phase 2 to look finished
