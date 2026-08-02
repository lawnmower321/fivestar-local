# Landing Page Brand Alignment — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Cobalt & Honey across the landing page with a four-ground section rhythm, replace the fictional credit-card hero object with a CSS-3D counter stand seated on a table, convert two sections into scroll-driven moments, and replace the `mailto:` CTA with a real intake form.

**Architecture:** A new `<Section>` wrapper owns ground colour and vertical rhythm so no section hard-codes `bg-*`/`py-*` again. A new `lib/brand.ts` is the single source of colour and easing constants for TS-side consumers (Motion configs, inline styles); `app/globals.css` `@theme` tokens serve the Tailwind class side. The hero object is built from flat divs in one shared `transform-style: preserve-3d` space under a single `perspective` — no WebGL. The intake form follows the repo's existing server-action shape: pure zod schema in `lib/`, injected-client db helper, service-role write.

**Tech Stack:** Next.js 16.2.10 (App Router; `cookies()`/`headers()`/route `params` are async), React 19.2.4 (`useActionState`), Tailwind 4 (`@theme` tokens), Motion 12.42.2 (`useScroll`/`useTransform`/`layout`), Supabase (`@supabase/supabase-js`, service-role only), Zod 4, Vitest 4 (node environment).

## Global Constraints

- **Read `node_modules/next/dist/docs/` before writing Next.js code.** Per `AGENTS.md`: this Next.js version has breaking changes vs. training data. Do not assume App Router APIs match memory.
- **Secrets are server-side only.** Never `NEXT_PUBLIC_`. The browser never talks to Supabase directly.
- **`lib/` stays pure and dependency-injected.** No `next/*` imports anywhere under `lib/`. DB helpers receive a `SupabaseClient` parameter; they never construct one.
- **Every new table: `alter table <name> enable row level security;` with zero policies.** Service-role access only, matching migrations 0001–0006.
- **Google's trademark hexes (`#4285f4`, `#fbbc05`, `#ea4335`, `#34a853` / `gblue` `gyellow` `gred` `ggreen`) may only appear inside the three components that depict real Google UI:** `review-showcase.tsx`, `scan-showcase.tsx`, `tap-demo.tsx`. Never in FiveStar's own chrome. Enforced by the grep in Task 10.
- **`#34a853` (ggreen) is retained only for the literal "Review posted" success state**, where it reads as system feedback rather than brand.
- **Commit isolation:** this plan touches marketing files only. Do not touch `app/admin/**`, `components/admin/**`, `lib/crm/**`, `lib/replydesk/**` (one read-only import exception in Task 9, called out there). The known-stale `g*` classes inside `app/admin/**` are explicitly out of scope.
- **No new dependencies.** No GSAP, no Lenis, no `three`, no testing-library. If a task seems to need one, stop and report.
- **`lib/content.ts` is the only place copy lives.** Tasks may *add* keys; no task rewrites existing marketing copy.
- **Never fabricate social proof.** No invented testimonials, client names, review counts, years in business, cities, or refund promises. See Task 8, which exists partly to enforce this.
- **Reduced motion:** every animated component must check `useReducedMotion()` and degrade to a static or instant state.
- **Mobile:** below 768px, scroll-scrubbed animation degrades to fire-once-on-enter. Scrub-on-touch is unreliable and door-to-door prospects view this on phones.
- **Tests are `tests/**/*.test.ts` in the Vitest `node` environment.** There is no jsdom and no component renderer. Only pure TS is unit-testable; visual work is verified by build + lint + manual check.

## Spec Contradictions Resolved

The spec (`docs/superpowers/specs/2026-08-01-landing-brand-alignment-design.md`) contradicts itself in three places and omits four approved items. These are the binding resolutions; do not re-litigate them mid-task.

| # | Conflict | Resolution |
|---|---|---|
| 1 | Rhythm ladder assigns Tap sequence `MIST`; the Moment 2 section says "on Ink ground" | **Mist wins.** The ladder also states "Two dark grounds," which only holds if the dark ones are Hero + Ranking climb. Moment 2 is Mist. |
| 2 | Palette table says Paper `#ffffff`; adopted-techniques says "Paper token warmed off screen-white" | **Warmed wins** — it was listed as an adopted technique with "outsized payoff." Paper = `#fcfbf9`. Flagged for review at the gate. |
| 3 | File table says `nfc-card.tsx` is "replaced by `counter-stand.tsx`", but never mentions `tap-demo.tsx` — which is what the hero actually renders, and which wraps `NfcCard` | **`tap-demo.tsx` survives and keeps its click-to-simulate review panel** (a deliberate 2026-07-10 feature). Only its inner object swaps: `<NfcCard/>` → `<CounterStand/>`. See Task 3. |
| 4 | Intake form, footer fix, and guarantee badge were approved into Phase 1 but appear nowhere in the spec's file table or architecture | Designed here in Tasks 8 and 9. |
| 5 | Moment 2's choreography (`tap → ripple → phone wakes → stars fill → posted`) describes a **single tap sequence**, but `scan-showcase.tsx` is actually a **six-business carousel** passing through a phone scanner — a different concept the user deliberately sharpened on 2026-07-10 | **Keep the carousel; replace only its driver.** The spec's two stated complaints are both driver problems ("it advances whether or not anyone is watching"; "a reader still processing card 2 gets pulled to card 3") — neither is a complaint about the carousel concept. Scroll-driving it delivers the spec's actual payoff (the reader spends real scroll time watching, so "15 seconds" lands) without discarding working work. See Task 7. |
| 6 | Moment 1 says "rebuild as a scroll-scrubbed sequence", which reads as replacing `review-showcase.tsx` — but that file holds a Mac-browser + iPhone-mock composition built 2026-07-10 | **Keep both mocks.** Only the results list *inside* `BrowserMock` becomes scroll-driven. See Task 6. |

**Standing rule for both moments:** the spec's diagnosis is trusted; its implied demolition is not. Where a spec instruction would delete a working, deliberately-built component to achieve an effect that can be achieved by changing that component's driver, change the driver.

---

### Task 1: Brand foundation — tokens, constants, and the `<Section>` wrapper

Establishes the vocabulary every later task speaks. Nothing visual changes yet except the new tokens existing.

**Files:**
- Create: `lib/brand.ts`
- Create: `components/site/section.tsx`
- Modify: `app/globals.css` (the `@theme` block at lines 132–146)
- Test: `tests/site/brand.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `lib/brand.ts` exports `BRAND` (frozen object with keys `ink`, `cobalt`, `honey`, `paper`, `mist`, `slate`, `hairline`, each a `#rrggbb` string) and `type Ground = "paper" | "mist" | "ink" | "cobalt"`. Nothing else — an `EASE_OUT`/`RIPPLE_MS` pair was considered and cut: no task in this phase consumes them, and Motion's inline easings are already consistent.
  - `components/site/section.tsx` exports `Section`, a server component accepting `{ children: ReactNode; ground?: Ground; id?: string; size?: "sm" | "md" | "lg"; className?: string }`.

**Note on the "slab" technique:** the spec adopts rounded inset slabs from TeraWulf, but no Phase 1 section uses one — the four-ground ladder already supplies the rhythm. Building an unused `variant="slab"` prop would be dead code on day one, so it is deliberately omitted. Slabs are a Phase 2 candidate.

- [ ] **Step 1: Write the failing test**

Create `tests/site/brand.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";

describe("BRAND", () => {
  it("exposes every ground and ink token as a hex string", () => {
    for (const key of ["ink", "cobalt", "honey", "paper", "mist", "slate", "hairline"] as const) {
      expect(BRAND[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("uses the owned Cobalt & Honey values, not Google's trademark hexes", () => {
    expect(BRAND.cobalt).toBe("#2749d6");
    expect(BRAND.honey).toBe("#e8a317");
    expect(BRAND.ink).toBe("#0f1b3d");
  });

  it("keeps Paper warmer than pure white so it never reads as screen-white", () => {
    expect(BRAND.paper).not.toBe("#ffffff");
    const r = parseInt(BRAND.paper.slice(1, 3), 16);
    const b = parseInt(BRAND.paper.slice(5, 7), 16);
    expect(r).toBeGreaterThan(b); // warm = more red than blue
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/site/brand.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/brand"`.

- [ ] **Step 3: Write `lib/brand.ts`**

```ts
// Single source of Cobalt & Honey for TS consumers — Motion configs, inline
// styles, and anything that needs a colour as a *value* rather than a class.
// The Tailwind-class side of the same palette lives in app/globals.css
// @theme. Both must stay in sync; globals.css is the one a designer edits.
//
// Provenance: docs/brand.md / docs/brand/fivestar-local-brand-kit.html.

export const BRAND = Object.freeze({
  ink: "#0f1b3d",      // dark ground, headlines
  cobalt: "#2749d6",   // structural: primary CTA, rules, active states, NFC rings
  honey: "#e8a317",    // deliberate accent: stars, "Top result", one CTA
  paper: "#fcfbf9",    // light ground, warmed off screen-white on purpose
  mist: "#f7f9fc",     // secondary light ground
  slate: "#5b6b83",    // body text
  hairline: "#e4e9f1", // borders, dividers
} as const);

export type Ground = "paper" | "mist" | "ink" | "cobalt";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/site/brand.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the tokens to `app/globals.css`**

Replace the entire `@theme { ... }` block currently at lines 132–146 with:

```css
@theme {
  /* FiveStar Local owned brand — docs/brand.md ("Cobalt & Honey"). Use these
     for everything FiveStar owns: site chrome, buttons, links, the ripple.
     Mirrored as values in lib/brand.ts — keep both in sync. */
  --color-brand: #2749d6;    /* cobalt — primary actions, links, ripple */
  --color-star: #e8a317;     /* honey — stars, highlights */
  --color-ink: #0f1b3d;      /* navy-black — dark grounds, headlines */
  --color-paper: #fcfbf9;    /* light ground, warmed off screen-white */
  --color-mist: #f7f9fc;     /* secondary light ground */
  --color-body: #5b6b83;     /* body text (named 'body' — 'slate' is taken by Tailwind) */
  --color-hairline: #e4e9f1; /* borders, dividers */

  /* Google's trademark palette — ONLY for components that depict real
     Google UI (review-showcase, scan-showcase, tap-demo). Never in
     FiveStar's own chrome (docs/brand.md trademark rule). */
  --color-gblue: #4285f4;
  --color-ggreen: #34a853;
  --color-gyellow: #fbbc05;
  --color-gred: #ea4335;
}
```

Note the token is `--color-body` → class `bg-body`/`text-body`, **not** `--color-slate`: Tailwind already ships a `slate` palette and redefining it would silently break every `text-slate-600` still on the page during the Task 2 migration.

- [ ] **Step 6: Write `components/site/section.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Ground } from "@/lib/brand";

// Owns ground colour and vertical rhythm for every marketing section, so the
// page's cadence is legible in one file instead of scattered across nine
// bg-*/py-* pairs. Sections must not hard-code either any more.

const GROUNDS: Record<Ground, string> = {
  paper: "bg-paper text-body",
  mist: "bg-mist text-body",
  ink: "bg-ink text-slate-300",
  cobalt: "bg-brand text-white",
};

const SIZES = {
  sm: "py-20",
  md: "py-28",
  lg: "py-32",
} as const;

export function Section({
  children,
  ground = "paper",
  size = "md",
  id,
  className,
}: {
  children: ReactNode;
  ground?: Ground;
  size?: keyof typeof SIZES;
  id?: string;
  className?: string;
}) {
  // `className` is merged last so a section can override the default rhythm
  // (the hero needs asymmetric pt/pb); cn() is tailwind-merge, so a later
  // pt-32/pb-20 correctly beats the earlier py-28.
  return (
    <section
      id={id}
      className={cn("relative", GROUNDS[ground], SIZES[size], id && "scroll-mt-16", className)}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 7: Verify the build compiles with the new tokens**

Run: `npm run build`
Expected: PASS. `Section` is unused so far — that is fine, it is not imported anywhere yet and Next does not fail on unused exports.

Run: `npm run lint`
Expected: no new warnings.

- [ ] **Step 8: Commit**

```bash
git add lib/brand.ts components/site/section.tsx app/globals.css tests/site/brand.test.ts
git commit -m "feat(site): brand foundation — Cobalt & Honey tokens, lib/brand.ts, Section wrapper"
```

---

### Task 2: Global pass — every section adopts `<Section>` and the new type scale

The single highest-yield change in the plan. After this task the page has four grounds instead of two.

**Files:**
- Modify: `components/site/how-it-works.tsx`, `benefits.tsx`, `team-note.tsx`, `faq.tsx`, `pricing.tsx`, `final-cta.tsx`, `navbar.tsx`, `footer.tsx`
- Modify: `app/page.tsx`
- Modify: `components/site/scan-showcase.tsx`, `review-showcase.tsx` (outer section shell only — their internals are rebuilt in Tasks 6–7)

**Interfaces:**
- Consumes: `Section`, `Ground` from Task 1.
- Produces: a page where no marketing section hard-codes `bg-*` or `py-*`. Tasks 4/6/7 rely on this.

**The binding ground ladder** (resolution #1 above already applied — Tap sequence is Mist, not Ink):

| Order | Component | Ground | Size |
|---|---|---|---|
| 1 | `Hero` | `ink` | (own layout — Task 4) |
| 2 | `HowItWorks` | `paper` | `md` |
| 3 | `ScanShowcase` (tap sequence) | `mist` | `lg` |
| 4 | `WhatYouGet` | `paper` | `md` |
| 5 | `ReviewShowcase` (ranking climb) | `ink` | `lg` |
| 6 | `Pricing` | `mist` | `md` |
| 7 | `TeamNote` | `paper` | `sm` |
| 8 | `Faq` | `mist` | `md` |
| 9 | `FinalCta` | `cobalt` | `md` |

- [ ] **Step 1: Convert `how-it-works.tsx`**

Replace the outer `<section>` and its container. The old first line was
`<section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-24">`.

```tsx
import { Nfc, MessageSquareText, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

const icons = [Nfc, MessageSquareText, TrendingUp];
const iconColors = ["text-brand bg-brand/10", "text-star bg-star/10", "text-ink bg-ink/10"];

export function HowItWorks() {
  return (
    <Section id="how-it-works" ground="paper" size="md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[1.0625rem] leading-[1.7] text-body">
            Three steps between you and a five-star reputation.
          </p>
        </Reveal>
        <div className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {/* connecting line through the step icons (desktop) */}
          <div className="absolute left-[16.6%] right-[16.6%] top-7 hidden border-t border-dashed border-hairline sm:block" aria-hidden />
          {content.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={step.title} delay={i * 0.15} className="relative text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-8 ring-paper ${iconColors[i]}`}>
                  <Icon size={28} />
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-body/70">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-3 text-body">{step.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Convert `benefits.tsx`**

```tsx
import { Check } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function WhatYouGet() {
  return (
    <Section id="what-you-get" ground="paper" size="md">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[5fr_6fr]">
        <Reveal>
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            {content.whatYouGet.title}
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.7] text-body">{content.whatYouGet.body}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-white">
            {content.whatYouGet.items.map((item) => (
              <li key={item} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <Check size={13} className="text-brand" strokeWidth={3} />
                </span>
                <span className="text-body">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Convert `team-note.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function TeamNote() {
  return (
    <Section ground="paper" size="sm">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-[2rem]">
          {content.team.title}
        </h2>
        <p className="mt-5 text-[1.0625rem] leading-[1.7] text-body">{content.team.body}</p>
      </Reveal>
    </Section>
  );
}
```

- [ ] **Step 4: Convert `faq.tsx`**

Change only the shell and heading; leave the `Accordion` structure alone.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function Faq() {
  return (
    <Section id="faq" ground="mist" size="md">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-12">
          <Accordion multiple={false} className="w-full">
            {content.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold text-ink">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-body">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Convert `pricing.tsx`**

Read the current file first — it is 4.1 KB and this plan does not reproduce it. Apply exactly these substitutions and nothing else:
- Outer `<section id="pricing" className="...">` → `<Section id="pricing" ground="mist" size="md">`, closing `</section>` → `</Section>`; delete the now-duplicated `bg-*`, `py-*`, and `scroll-mt-16` classes from the element you removed.
- `text-slate-900` → `text-ink`
- `text-slate-600`, `text-slate-700` → `text-body`
- `text-slate-500`, `text-slate-400` → `text-body/70`
- `border-slate-200` → `border-hairline`
- `divide-slate-200` → `divide-hairline`
- `bg-slate-50` → `bg-mist`
- Any `h2` gets `text-[2rem] font-extrabold tracking-[-0.025em] sm:text-[2.75rem]` in place of its existing `text-3xl font-bold tracking-tight sm:text-4xl`.
- Leave `bg-white` on the tier cards — white cards on a Mist ground is the intended contrast.

- [ ] **Step 6: Convert `final-cta.tsx` to the Cobalt ground**

```tsx
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function FinalCta() {
  return (
    <Section ground="cobalt" size="md" className="overflow-hidden">
      {/* faint ripple rings — same motif as the hero, radiating from the CTA */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 text-white/10"
        viewBox="0 0 900 900"
        fill="none"
        aria-hidden
      >
        {[180, 270, 360, 440].map((r) => (
          <circle key={r} cx="450" cy="450" r={r} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-white sm:text-[2.75rem]">
          {content.finalCta.title}
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-[1.7] text-white/80">{content.finalCta.body}</p>
        {/* CTA is Honey here: on a Cobalt ground a Cobalt button would vanish.
            This is the "one CTA" the brand kit allots to Honey. */}
        <Button
          render={<a href={`mailto:${content.site.email}?subject=${encodeURIComponent("Set up my business")}`} />}
          nativeButton={false}
          size="lg"
          className="mt-8 bg-star font-semibold text-ink hover:bg-star/90"
        >
          {content.finalCta.cta}
        </Button>
        <p className="mt-4 font-mono text-xs tracking-wide text-white/60">{content.site.email}</p>
      </Reveal>
    </Section>
  );
}
```

The `mailto:` here is replaced by the intake form in Task 9. It stays working until then so the page is never shipped without a contact path.

- [ ] **Step 7: Retire `slate-*` chrome from `navbar.tsx` and `footer.tsx`**

In `navbar.tsx` apply: `border-slate-200/60` → `border-hairline/60`; `bg-white/80` → `bg-paper/80`; `text-slate-900` → `text-ink`; `text-slate-600` → `text-body`; `border-slate-200 bg-white` (mobile drawer) → `border-hairline bg-paper`.

In `footer.tsx` apply: `border-slate-200 bg-white` → `border-hairline bg-paper`; `text-slate-900` → `text-ink`; `text-slate-500` → `text-body`; `text-slate-400` → `text-body/70`. Footer structure is rebuilt in Task 8 — this step is only the colour pass so no stale token survives the commit.

- [ ] **Step 8: Convert the two showcase shells**

In `scan-showcase.tsx` and `review-showcase.tsx`, replace **only** the outermost `<section>` element with `<Section>`:
- `scan-showcase.tsx` → `<Section ground="mist" size="lg">`
- `review-showcase.tsx` → `<Section ground="ink" size="lg">`

Delete the `bg-*`/`py-*` classes from the element you replaced. **Do not touch their internals** — the Google-UI mockups inside legitimately keep their `g*` classes, and Tasks 6–7 rebuild those bodies. `review-showcase.tsx` moving to an Ink ground will make its own light-on-light text unreadable until Task 6; that is expected and is why Task 6 immediately follows.

- [ ] **Step 9: Update the page wrapper**

In `app/page.tsx`, change line 15 from `<div className="bg-white text-slate-800">` to:

```tsx
<div className="bg-paper text-body">
```

- [ ] **Step 10: Verify**

Run: `npm run build`
Expected: PASS.

Run: `npm run lint`
Expected: no new warnings.

Run: `npx vitest run`
Expected: all existing tests still pass (156 + 3 from Task 1).

- [ ] **Step 11: Commit**

```bash
git add components/site app/page.tsx
git commit -m "feat(site): four-ground section rhythm, new type scale, retire slate chrome"
```

---

### Task 3: The counter stand — CSS-3D hero object

Replaces the fictional dark credit card with the real product. This is the highest-risk task in the plan: the failure mode is "reads as flat cardboard," and it is the first thing reviewed at the gate.

**Files:**
- Create: `components/site/counter-stand.tsx`
- Modify: `components/site/tap-demo.tsx` (swap the inner object only — resolution #3)
- Delete: `components/site/nfc-card.tsx`

**Interfaces:**
- Consumes: `BRAND` from Task 1.
- Produces: `CounterStand`, a client component accepting `{ scrollProgress?: MotionValue<number>; className?: string }`. When `scrollProgress` is omitted it renders a static default pose — Task 4 passes a real one.

**Geometry (measured from the user's product photo, spec §Product correction — do not re-derive):**

| Property | Value used |
|---|---|
| Panel width | `--stand-w`: 260px desktop, 190px below 768px |
| Panel aspect | 3 : 4.4 portrait → height = width × 1.4667 |
| Corner radius | 4.5% of panel width, **front panel only** |
| Lean | 17° back from vertical |
| Base plate depth | 30% of panel height, folds **forward** |
| Material thickness | 1.5% of panel width |
| Shading | fully diffuse — **no specular highlight anywhere** |

- [ ] **Step 1: Write `components/site/counter-stand.tsx`**

```tsx
"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Nfc, Star } from "lucide-react";
import { BRAND } from "@/lib/brand";

// The real product: a matte-white PVC counter stand — one sheet, one bend.
// A portrait panel leaning back, plus a base plate folding forward. An "L"
// in profile; the triangle people think they see is the negative space
// between the leaning panel and the table.
//
// Built from flat divs in a single preserve-3d space, not WebGL, because the
// photo shows the material is fully diffuse: there is no specular highlight
// to simulate, so a driven gradient IS the material's real behaviour rather
// than an approximation of it. If this ever needs environment reflections or
// a contact shadow that deforms correctly through a full rotation, that is a
// `three` rebuild and a different budget (spec §The Hero Object).
//
// Axis note: in CSS, +Y points DOWN and rotateX follows the right-hand rule
// about +X, so with transform-origin at the bottom a POSITIVE rotateX tips
// the top AWAY from the viewer. That is why the lean is +17 and the base
// plate is +90.

const PANEL_ASPECT = 4.4 / 3; // portrait
const LEAN_DEG = 17;
const RADIUS_PCT = 4.5;
const THICKNESS_PCT = 1.5;
const BASE_DEPTH_PCT = 30;

export function CounterStand({
  scrollProgress,
  className,
}: {
  scrollProgress?: MotionValue<number>;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // Scroll drives a shallow yaw. ±14° is enough to read as a solid object
  // turning; more starts to expose how thin the side wall really is.
  const fallback = useTransform(() => 0);
  const source = scrollProgress ?? fallback;
  const rotateY = useTransform(source, [0, 1], reduce ? [-8, -8] : [-16, 10]);

  // Diffuse shading that tracks the yaw: as the panel turns away from the
  // key light the gradient slides across it. No highlight, only falloff.
  const panelGradient = useTransform(
    rotateY,
    (r) =>
      `linear-gradient(${115 + r * 0.9}deg, #ffffff 0%, #f6f7f9 46%, #e9edf2 100%)`,
  );
  const shadowScale = useTransform(rotateY, [-16, 10], [1.06, 0.94]);
  const shadowShift = useTransform(rotateY, [-16, 10], [-14, 12]);

  return (
    <div
      className={className}
      style={{ perspective: "1200px", perspectiveOrigin: "50% 42%" }}
    >
      <motion.div
        className="relative mx-auto"
        style={{
          rotateY,
          transformStyle: "preserve-3d",
          width: "var(--stand-w)",
          height: `calc(var(--stand-w) * ${PANEL_ASPECT})`,
        }}
      >
        {/* ---- table plane -------------------------------------------------
            A pool of light, not a slab: it fades to fully transparent, so it
            has no visible edge and its rotation with the scene is
            imperceptible. Sits at the crease and extends forward. */}
        <div
          aria-hidden
          className="absolute left-1/2 top-full h-[220%] w-[320%] -translate-x-1/2"
          style={{
            transform: "rotateX(90deg)",
            transformOrigin: "top center",
            background: `radial-gradient(ellipse 55% 42% at 50% 30%, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 45%, transparent 72%)`,
          }}
        />

        {/* ---- contact shadow ---------------------------------------------
            Lives on the table plane so it stays glued to the object's foot
            through the yaw. */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-full h-[70%] w-[130%] -translate-x-1/2 rounded-[50%]"
          style={{
            transform: "rotateX(90deg)",
            transformOrigin: "top center",
            scaleX: shadowScale,
            x: shadowShift,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0.22) 45%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />

        {/* ---- base plate --------------------------------------------------
            Folds FORWARD from the crease and lies flat. transform-origin at
            its top edge + rotateX(90deg) drops it onto the table. Square
            corners: only the front panel is radiused on the real product. */}
        <div
          aria-hidden
          className="absolute left-0 top-full w-full"
          style={{
            height: `${BASE_DEPTH_PCT}%`,
            transform: "rotateX(90deg)",
            transformOrigin: "top center",
            background: "linear-gradient(180deg, #eef0f3 0%, #dfe4ea 100%)",
          }}
        />

        {/* ---- the leaning panel ------------------------------------------- */}
        <motion.div
          className="absolute inset-0"
          style={{
            transform: `rotateX(${LEAN_DEG}deg)`,
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
          }}
        >
          {/* side wall — a real thin face, deliberately NOT radiused.
              Rounding this edge is where cheap CSS 3D gives itself away. */}
          <div
            aria-hidden
            className="absolute right-0 top-0 h-full"
            style={{
              width: `${THICKNESS_PCT}%`,
              transform: "rotateY(90deg)",
              transformOrigin: "right center",
              background: "linear-gradient(180deg, #d7dce3 0%, #c6ccd6 100%)",
            }}
          />

          {/* front face */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-between px-[9%] py-[11%]"
            style={{
              borderRadius: `${RADIUS_PCT}%`,
              background: panelGradient,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-star text-star" />
                ))}
              </span>
              <p
                className="text-center font-heading text-[0.95rem] font-extrabold leading-tight"
                style={{ color: BRAND.ink }}
              >
                Leave us a<br />Google review
              </p>
            </div>

            {/* NFC target — the thing a customer actually taps */}
            <div className="relative flex h-[26%] w-[26%] items-center justify-center">
              <span className="nfc-ripple" />
              <span className="nfc-ripple" style={{ animationDelay: "1.2s" }} />
              <Nfc size={30} style={{ color: BRAND.cobalt }} />
            </div>

            <p
              className="font-mono text-[0.5rem] uppercase tracking-[0.18em]"
              style={{ color: BRAND.slate }}
            >
              Tap your phone here
            </p>
          </motion.div>
        </motion.div>

        {/* ---- an NFC card on the table beside the stand --------------------
            Literally the Starter bundle: "2 NFC cards + counter stand". */}
        <div
          aria-hidden
          className="absolute left-[86%] top-full w-[62%] rounded-[6px]"
          style={{
            height: `${BASE_DEPTH_PCT * 1.15}%`,
            transform: "rotateX(90deg) translateZ(2px)",
            transformOrigin: "top left",
            background: "linear-gradient(135deg, #ffffff 0%, #eef1f5 100%)",
            boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
          }}
        />
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Add the responsive size variable**

Append to `app/globals.css`:

```css
/* Counter-stand panel width — the one number the whole CSS-3D scene scales
   from (every other dimension in counter-stand.tsx is a % of it). */
:root { --stand-w: 190px; }
@media (min-width: 768px) { :root { --stand-w: 260px; } }
```

- [ ] **Step 3: Point `tap-demo.tsx` at the new object**

Two edits only. Change the import on line 6:

```tsx
import { CounterStand } from "@/components/site/counter-stand";
```

and the render on line 114:

```tsx
<CounterStand />
```

Everything else in `tap-demo.tsx` stays. The click-to-simulate review panel is a deliberate feature (added 2026-07-10) that the spec omitted rather than retired — see resolution #3. Also change the focus ring on line 112 from `focus-visible:ring-gblue` to `focus-visible:ring-brand`: that ring is FiveStar's own chrome, not depicted Google UI, so it falls under the trademark rule.

- [ ] **Step 4: Delete the fictional card**

```bash
git rm components/site/nfc-card.tsx
```

- [ ] **Step 5: Verify no references survive**

Run: `grep -rn "nfc-card\|NfcCard" --include="*.tsx" --include="*.ts" . | grep -v node_modules`
Expected: no output. If anything matches, fix it before continuing.

- [ ] **Step 6: Verify the build and look at it**

Run: `npm run build && npm run lint`
Expected: both clean.

Run: `npm run dev`, open `http://localhost:3000`, and check against the photo criteria:
- The panel is portrait, not landscape.
- The base plate reads as folding forward and lying flat — an L in profile, not a triangle wedge.
- The side wall is a visible sliver on the right, with square corners.
- There is no bright highlight anywhere on the white surface.

**Windows note:** killing `npm run dev`/`start` orphans the node child on port 3000. If the port is stuck: `Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess` then `Stop-Process -Id <pid> -Force`.

- [ ] **Step 7: Commit**

```bash
git add components/site/counter-stand.tsx components/site/tap-demo.tsx app/globals.css
git rm --cached components/site/nfc-card.tsx 2>/dev/null || true
git commit -m "feat(site): CSS-3D counter stand replaces the fictional credit card"
```

---

### Task 4: Hero rebuild — offset composition on Ink

Implements the two decisions made 2026-08-02: **offset composition** (object bleeds past the section edge and overlaps the frame) and **seated on a visible table plane** (already built into `CounterStand` in Task 3).

**Files:**
- Modify: `components/site/hero.tsx`
- Modify: `lib/content.ts` (add `hero.quickLinks`)

**Interfaces:**
- Consumes: `Section` (Task 1), `CounterStand` (Task 3), `TapDemo` (Task 3).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the quick-link copy**

In `lib/content.ts`, inside the `hero` object, after `tapHint`, add:

```ts
    // Pinned to the hero's base — fills the measured ~250px dead zone and
    // gives the three most-asked questions a one-click path.
    quickLinks: [
      { label: "See pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
      { label: "What you get", href: "#what-you-get" },
    ],
```

- [ ] **Step 2: Rebuild `components/site/hero.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";
import { TapDemo } from "@/components/site/tap-demo";
import { Section } from "@/components/site/section";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Drives the stand's yaw from the hero's own scroll span. Passed down
  // through TapDemo so the object turns as the page moves.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <Section ground="ink" className="overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* corner brackets — inset L-rules that frame the hero as a deliberate
          composition rather than a container that happens to end. */}
      <div aria-hidden className="pointer-events-none absolute inset-6 hidden lg:block">
        <span className="absolute left-0 top-0 h-10 w-10 border-l border-t border-white/20" />
        <span className="absolute right-0 top-0 h-10 w-10 border-r border-t border-white/20" />
        <span className="absolute bottom-0 left-0 h-10 w-10 border-b border-l border-white/20" />
        <span className="absolute bottom-0 right-0 h-10 w-10 border-b border-r border-white/20" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Offset, not a clean split: copy takes 55% and the object column
            starts before the copy ends, so the two overlap and the stand
            bleeds past the container's right edge. */}
        <div className="grid items-center gap-y-16 lg:grid-cols-[minmax(0,55%)_minmax(0,45%)]">
          <div className="relative z-10 lg:pr-8">
            <motion.p
              {...fade(0)}
              className="font-mono text-xs uppercase tracking-[0.2em] text-white/50"
            >
              {content.hero.eyebrow}
            </motion.p>
            <motion.h1
              {...fade(0.1)}
              className="mt-5 font-heading text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.04em] text-white sm:text-[3.5rem] lg:text-[4.5rem]"
            >
              {content.hero.headline}{" "}
              {/* Serif-italic emphasis clause (spec, from Ricardo Chance).
                  A system serif stack, not a webfont — the page's 1.52s load
                  is an asset worth protecting and this costs zero bytes. */}
              <span
                className="italic text-star"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {content.hero.highlight}
              </span>
            </motion.h1>
            <motion.p
              {...fade(0.2)}
              className="mt-6 max-w-xl text-[1.0625rem] leading-[1.7] text-white/70"
            >
              {content.hero.subhead}
            </motion.p>
            <motion.div {...fade(0.3)} className="mt-9 flex flex-wrap gap-4">
              <Button
                render={<a href="#pricing" />}
                nativeButton={false}
                size="lg"
                className="bg-star font-semibold text-ink hover:bg-star/90"
              >
                {content.hero.cta}
              </Button>
              <Button
                render={<a href="#how-it-works" />}
                nativeButton={false}
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                {content.hero.ctaSecondary}
              </Button>
            </motion.div>
          </div>

          {/* The object, allowed to break the grid: pulled left to overlap the
              copy column and pushed right past the container edge. */}
          <motion.div
            {...fade(0.15)}
            className="relative lg:-ml-24 lg:mr-[-8%] lg:pt-6"
          >
            <TapDemo scrollProgress={reduce ? undefined : scrollYProgress} />
          </motion.div>
        </div>

        {/* quick-link strip — pinned to the hero's base, where the measured
            dead zone was. */}
        <motion.div
          {...fade(0.45)}
          className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3"
        >
          {content.hero.quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between bg-ink px-5 py-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
              <ArrowRight
                size={15}
                className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-star"
              />
            </a>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Thread the scroll value through `tap-demo.tsx`**

`TapDemo` currently takes no props. Give it one and forward it. Change the signature:

```tsx
export function TapDemo({ scrollProgress }: { scrollProgress?: MotionValue<number> }) {
```

add the type import at the top:

```tsx
import { AnimatePresence, motion, useReducedMotion, type MotionValue } from "motion/react";
```

and forward it at the render site (line ~114):

```tsx
<CounterStand scrollProgress={scrollProgress} />
```

- [ ] **Step 4: Fix the demo panel for the dark ground**

The review panel in `tap-demo.tsx` renders on `bg-white` — correct, it depicts a Google dialog. But the tap hint below the stand (line ~121) is `text-slate-500 hover:text-gblue`, which is FiveStar chrome on an Ink ground. Change it to:

```tsx
className="mt-5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-star"
```

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint && npx vitest run`
Expected: all clean.

Manual, at 1440×900 and 390×844:
- The hero has no dead zone; the quick-link strip closes the base.
- The stand overlaps the copy column and bleeds past the right edge on desktop.
- At 390px the grid stacks and **nothing is clipped or horizontally scrollable** — check `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- Body copy over the Ink ground passes WCAG AA. `text-white/70` on `#0f1b3d` ≈ 9.7:1 — fine; verify nothing sits at `/40` or below.
- With `prefers-reduced-motion: reduce`, the stand holds a static pose and does not yaw on scroll.

- [ ] **Step 6: Commit**

```bash
git add components/site/hero.tsx components/site/tap-demo.tsx lib/content.ts
git commit -m "feat(site): hero rebuilt — offset composition on Ink, quick-link strip, corner brackets"
```

---

### Task 5: Odometer — the digit-roll primitive

Small, pure, and used by Task 6. Its interpolation is genuinely unit-testable, so it gets a real TDD cycle.

**Files:**
- Create: `lib/odometer.ts`
- Create: `components/site/odometer.tsx`
- Test: `tests/site/odometer.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `lib/odometer.ts` exports `odometerValue(from: number, to: number, progress: number, decimals?: number): string`.
  - `components/site/odometer.tsx` exports `Odometer`, a client component taking `{ from: number; to: number; progress: MotionValue<number>; decimals?: number; className?: string }`.

- [ ] **Step 1: Write the failing test**

Create `tests/site/odometer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { odometerValue } from "@/lib/odometer";

describe("odometerValue", () => {
  it("returns the start value at zero progress", () => {
    expect(odometerValue(18, 212, 0)).toBe("18");
  });

  it("returns the end value at full progress", () => {
    expect(odometerValue(18, 212, 1)).toBe("212");
  });

  it("interpolates linearly at the midpoint", () => {
    expect(odometerValue(0, 100, 0.5)).toBe("50");
  });

  it("formats ratings to one decimal", () => {
    expect(odometerValue(3.9, 4.9, 0, 1)).toBe("3.9");
    expect(odometerValue(3.9, 4.9, 1, 1)).toBe("4.9");
  });

  it("clamps progress outside 0..1 rather than overshooting", () => {
    // Motion's useScroll can report slightly out-of-range values at the
    // extremes; an unclamped odometer would briefly show 4.97 stars.
    expect(odometerValue(3.9, 4.9, 1.4, 1)).toBe("4.9");
    expect(odometerValue(3.9, 4.9, -0.3, 1)).toBe("3.9");
  });

  it("rounds rather than truncates", () => {
    expect(odometerValue(0, 10, 0.19)).toBe("2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/site/odometer.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/odometer"`.

- [ ] **Step 3: Write `lib/odometer.ts`**

```ts
// Pure interpolation behind the digit-roll. Kept out of the component so the
// clamping rule is testable in the node environment — Motion's useScroll can
// report values slightly outside 0..1 at the extremes, and an unclamped
// odometer visibly overshoots (4.97 stars) at the top of the scroll.

export function odometerValue(
  from: number,
  to: number,
  progress: number,
  decimals = 0,
): string {
  const p = Math.min(1, Math.max(0, progress));
  return (from + (to - from) * p).toFixed(decimals);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/site/odometer.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write `components/site/odometer.tsx`**

```tsx
"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { odometerValue } from "@/lib/odometer";

// Renders a scroll-driven number. Tabular figures keep the width stable so
// the surrounding layout does not jitter as digits change.
export function Odometer({
  from,
  to,
  progress,
  decimals = 0,
  className,
}: {
  from: number;
  to: number;
  progress: MotionValue<number>;
  decimals?: number;
  className?: string;
}) {
  const text = useTransform(progress, (p) => odometerValue(from, to, p, decimals));
  return (
    <motion.span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </motion.span>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add lib/odometer.ts components/site/odometer.tsx tests/site/odometer.test.ts
git commit -m "feat(site): scroll-driven Odometer with clamped interpolation"
```

---

### Task 6: Moment 1 — the ranking climb

`review-showcase.tsx` currently shows the destination (Bella's already at #1). The journey is the pitch, so scrub it.

**Files:**
- Modify: `components/site/review-showcase.tsx`
- Modify: `lib/content.ts` (`reviewShowcase.search.results` gains start values)

**Interfaces:**
- Consumes: `Section` (Task 1), `Odometer` (Task 5).
- Produces: nothing later tasks depend on.

**What is preserved (resolution #6):** `BrowserMock`, `PhoneMock`, `StarRow`, the Mac window chrome, the edge fades, and the whole two-column layout all stay. Only the **results list inside `BrowserMock`** becomes scroll-driven.

**What is removed:** the `active`/`onSelect` click-to-select interaction. It fights the scrub — a reader cannot both drive the sequence by scrolling and pick a row by clicking, and the rows are now mid-animation. `PhoneMock` shows Bella's (the tracked business) throughout.

**Scrub choreography (from the spec):**

| Progress | State |
|---|---|
| 0% | Bella's at **#3**, 3.9, 18 reviews, muted; Corner Bakehouse on top |
| 0–60% | Rating rolls 3.9 → 4.9; count odometers 18 → 212; stars fill L→R in Honey |
| 40–80% | Rows reorder — Bella's rises past #2, past #1 |
| 80–100% | "Top result" badge scales in (Honey); row highlights Cobalt |

**Two drivers, on purpose.** Continuous values (rating, review count) ride a `MotionValue` through `Odometer` so they never re-render the tree. Discrete values (rank order, filled-star count, badge visibility) go through React state via `useMotionValueEvent`, because Motion's `layout` FLIP reorder needs the array order to actually change. Do not try to drive `order` with a `MotionValue` — CSS `order` is not an animatable transform and Motion will not interpolate it.

- [ ] **Step 1: Give the content a start state**

In `lib/content.ts`, replace the `reviewShowcase.search.results` array with:

```ts
      // `from` values are where the scrub starts; the plain rating/reviews
      // are where it lands. Only the tracked business animates.
      results: [
        {
          name: "Bella's Bakery",
          rating: "4.9",
          reviews: 212,
          fromRating: 3.9,
          fromReviews: 18,
          meta: "Bakery · Open now",
          top: true,
        },
        { name: "Corner Bakehouse", rating: "4.1", reviews: 37, meta: "Bakery · Closes 5 PM", top: false },
        { name: "Daily Loaf Co.", rating: "3.9", reviews: 18, meta: "Bakery · Closes 4 PM", top: false },
      ],
```

- [ ] **Step 2: Convert `StarRow` to take a numeric fill count**

`StarRow` currently derives its filled count from `Math.round(parseFloat(rating))`. The scrub needs to drive that count directly. Change its signature — this is the only edit to the component:

```tsx
function StarRow({
  filled,
  size = 11,
  muted = false,
}: {
  filled: number;
  size?: number;
  muted?: boolean;
}) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < filled
              ? muted
                ? "fill-slate-300 text-slate-300"
                : "fill-gyellow text-gyellow"
              : "text-slate-200"
          }
        />
      ))}
    </span>
  );
}
```

Update its three call sites: in `BrowserMock` pass `filled={...}` (see Step 3), and in `PhoneMock` change `<StarRow rating="5" size={16} />` to `<StarRow filled={5} size={16} />`.

The explicit `role="img"` matters: a bare `<span aria-label>` has an implicit `role="generic"` and assistive tech drops the label — the same defect that was fixed in the admin star rating on 2026-08-01.

- [ ] **Step 3: Make `BrowserMock`'s result list scroll-driven**

Replace `BrowserMock`'s props and its results loop. Everything above the loop (title bar, URL pill, "Local results" line) is unchanged.

```tsx
function BrowserMock({
  progress,
  rank,
  starFill,
  badgeIn,
}: {
  progress: MotionValue<number>;
  rank: number;      // Bella's current slot, 2 → 0
  starFill: number;  // 0 → 5
  badgeIn: boolean;
}) {
  const { query, results } = content.reviewShowcase.search;
  const [tracked, ...rest] = results;

  // Rebuild the display order each render so Motion's `layout` prop has a
  // real DOM order change to FLIP between. CSS `order` is not animatable.
  const ordered = [...rest];
  ordered.splice(rank, 0, tracked);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      {/* title bar — unchanged */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gred/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gyellow/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ggreen/70" />
        </span>
        <span className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-1 font-mono text-[11px] text-slate-500 ring-1 ring-slate-200">
          <Search size={11} className="shrink-0 text-slate-400" />
          google.com/search?q={query.replaceAll(" ", "+")}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          <MapPin size={11} />
          Local results · &ldquo;{query}&rdquo;
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {ordered.map((r) => {
            const isTracked = r.name === tracked.name;
            return (
              <motion.div
                key={r.name}
                layout
                transition={{ type: "spring", stiffness: 220, damping: 30 }}
                className={
                  isTracked
                    ? "rounded-xl border border-gblue/30 bg-gblue/5 px-4 py-3"
                    : "rounded-xl border border-slate-100 px-4 py-3 opacity-70"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${isTracked ? "text-slate-900" : "text-slate-600"}`}>
                    {r.name}
                  </p>
                  {isTracked && badgeIn && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="rounded-full bg-gblue px-2 py-0.5 text-[10px] font-semibold text-white"
                    >
                      Top result
                    </motion.span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className={`font-semibold ${isTracked ? "text-slate-700" : ""}`}>
                    {isTracked ? (
                      <Odometer
                        from={tracked.fromRating}
                        to={Number(tracked.rating)}
                        progress={progress}
                        decimals={1}
                      />
                    ) : (
                      r.rating
                    )}
                  </span>
                  <StarRow
                    filled={isTracked ? starFill : Math.round(parseFloat(r.rating))}
                    muted={!isTracked}
                  />
                  <span>
                    (
                    {isTracked ? (
                      <Odometer from={tracked.fromReviews} to={tracked.reviews} progress={progress} />
                    ) : (
                      r.reviews
                    )}
                    )
                  </span>
                  <span aria-hidden>·</span>
                  <span>{r.meta}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Note the container changed from `space-y-2` to `flex flex-col gap-2`. `space-y-*` applies margins by DOM position and fights a FLIP reorder; `gap` does not.

- [ ] **Step 4: Wire the scrub in `ReviewShowcase`**

```tsx
export function ReviewShowcase() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Scrub-on-touch is unreliable and prospects meet this page on a phone, so
  // below 768px (and under reduced motion) the section shows the settled end
  // state instead of a frozen 3.9/18 (spec §Moment 1, non-negotiable).
  const settled = reduce || isNarrow;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 65%"] });
  const done = useMotionValue(1);
  const progress = settled ? done : scrollYProgress;

  // Discrete state — these must change the React tree, not just a style.
  const [rank, setRank] = useState(settled ? 0 : 2);
  const [starFill, setStarFill] = useState(settled ? 5 : 4);
  const [badgeIn, setBadgeIn] = useState(settled);

  useMotionValueEvent(progress, "change", (p) => {
    setRank(p < 0.4 ? 2 : p < 0.8 ? 1 : 0);
    setStarFill(Math.min(5, Math.round(3.9 + (4.9 - 3.9) * Math.min(1, p / 0.6))));
    setBadgeIn(p >= 0.8);
  });

  useEffect(() => {
    if (!settled) return;
    setRank(0);
    setStarFill(5);
    setBadgeIn(true);
  }, [settled]);

  return (
    <Section ground="ink" size="lg" className="overflow-hidden">
      <div
        ref={ref}
        className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[5fr_6fr]"
      >
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
            {content.reviewShowcase.eyebrow}
          </p>
          <h2 className="mt-4 font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-white sm:text-[2.75rem]">
            {content.reviewShowcase.title}
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.7] text-white/70">
            {content.reviewShowcase.body}
          </p>
          <ul className="mt-7 space-y-3">
            {content.reviewShowcase.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-star/15">
                  <Check size={13} className="text-star" strokeWidth={3} />
                </span>
                <span className="text-white/80">{point}</span>
              </li>
            ))}
          </ul>
          <Button
            render={<a href="#pricing" />}
            nativeButton={false}
            size="lg"
            className="mt-9 bg-star font-semibold text-ink hover:bg-star/90"
          >
            {content.reviewShowcase.cta}
          </Button>
        </Reveal>

        <Reveal delay={0.15} className="relative pb-14 pr-6 sm:pr-10">
          <BrowserMock progress={progress} rank={rank} starFill={starFill} badgeIn={badgeIn} />
          <div className="absolute -bottom-2 right-0 rotate-3">
            <PhoneMock business={content.reviewShowcase.search.results[0]} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
```

Imports needed at the top of the file: `useEffect`, `useRef`, `useState` from `react`; `motion`, `useMotionValue`, `useMotionValueEvent`, `useReducedMotion`, `useScroll`, `type MotionValue` from `motion/react`; `Odometer` and `Section` from `@/components/site/*`. `AnimatePresence` is still used by `PhoneMock`; `CheckCircle2`, `Check`, `MapPin`, `Search`, `Star` all remain in use.

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint && npx vitest run`
Expected: all clean.

Manual at 1440×900: scroll slowly through the section and confirm the rating rolls, the count odometers, the row climbs from third place to the top, and the badge pops last. Scroll back up and confirm it reverses — that is the tell that it is scrubbed rather than triggered. At 390×844 and with reduced motion, confirm it renders the settled end state (4.9, 212, #1, badge lit) immediately rather than a frozen 3.9/18.

- [ ] **Step 6: Commit**

```bash
git add components/site/review-showcase.tsx lib/content.ts
git commit -m "feat(site): moment 1 — scroll-scrubbed ranking climb"
```

---

### Task 7: Moment 2 — the tap sequence

`scan-showcase.tsx` is a six-business carousel: mini NFC cards slide along a rail, pass behind a phone "scanner", and the phone reveals that business's info in four staggered rows ending on "Review posted — 15 seconds". A `setInterval` advances it every 3.4s.

Per resolution #5, the carousel stays. Only its **driver** changes: `setInterval` → scroll. That is precisely what the spec complained about ("it advances whether or not anyone is watching"), and it is what makes the existing "15 seconds" line land — the reader spends real scroll time watching it happen.

**Files:**
- Modify: `components/site/scan-showcase.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the interval with a scroll-derived index**

The component's entire animation already keys off one number: `active`. Every card position, the scan beam, the bracket flash, and the info panel derive from it. So the conversion is genuinely one substitution — `active` stops coming from a timer and starts coming from scroll.

Delete the existing effect:

```tsx
useEffect(() => {
  if (reduce) return;
  const id = setInterval(() => setActive((a) => a + 1), STEP_MS);
  return () => clearInterval(id);
}, [reduce]);
```

and replace it with:

```tsx
const ref = useRef<HTMLDivElement>(null);
const [isNarrow, setIsNarrow] = useState(false);

useEffect(() => {
  const mq = window.matchMedia("(max-width: 767px)");
  const update = () => setIsNarrow(mq.matches);
  update();
  mq.addEventListener("change", update);
  return () => mq.removeEventListener("change", update);
}, []);

// Timer stays as the fallback path: scrub-on-touch is unreliable, and a
// sticky pin on a small screen traps the scroll (spec §Moment 2).
const useTimer = reduce || isNarrow;

useEffect(() => {
  if (!useTimer) return;
  const id = setInterval(() => setActive((a) => a + 1), STEP_MS);
  return () => clearInterval(id);
}, [useTimer]);

// Scroll path: the sticky scene spans items.length screens of scroll, so
// one business locks in per screen.
const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

useMotionValueEvent(scrollYProgress, "change", (p) => {
  if (useTimer) return;
  const i = Math.min(items.length - 1, Math.floor(p * items.length));
  setActive((prev) => (prev === i ? prev : i));
});
```

Two details that matter: the `prev === i ? prev : i` guard keeps `scrollYProgress` from re-rendering on every frame (it fires continuously; `active` only changes six times), and `Math.min` clamps the final bucket so `p === 1` does not index past the array.

- [ ] **Step 2: Pin the scene with CSS sticky**

Wrap the existing scene in a tall spacer with a sticky child. Use CSS `position: sticky`, **not** a JS-measured pin — the spec's reference survey found TeraWulf runs 39 ScrollTriggers with zero pinned, and CSS sticky survives a mid-scroll refresh where a measured pin does not.

Replace the outer `<section className="overflow-hidden bg-white py-24">` with:

```tsx
<Section ground="mist" size="lg" className="overflow-hidden">
  <div className="mx-auto max-w-6xl px-4 sm:px-6">
    <Reveal className="text-center">
      <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
        {content.showcase.title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-[1.0625rem] leading-[1.7] text-body">
        {content.showcase.body}
      </p>
    </Reveal>
  </div>

  {/* Scroll runway: one viewport per business on the desktop scrub path.
      On the timer path it collapses so the scene does not sit inside a
      six-screen empty column. */}
  <div ref={ref} className={useTimer ? "relative mt-12" : "relative mt-12 h-[600vh]"}>
    <div className={useTimer ? "" : "sticky top-20"}>
      <div className="relative h-[460px] sm:h-[500px]">
        {/* ...the existing rail, cards, edge fades, and phone scanner,
            entirely unchanged... */}
      </div>
    </div>
  </div>
</Section>
```

The inner scene — rail, sliding cards, edge fades, phone scanner, info rows — is **copied across unmodified**. It already reads `active`, and `active` now comes from scroll.

- [ ] **Step 3: Repoint the edge fades at the new ground**

The fades hard-code white and will show as light bands on the Mist ground. Change both:

```tsx
<div className="pointer-events-none absolute inset-y-0 left-0 z-[6] w-24 bg-gradient-to-r from-mist to-transparent sm:w-56" aria-hidden />
<div className="pointer-events-none absolute inset-y-0 right-0 z-[6] w-24 bg-gradient-to-l from-mist to-transparent sm:w-56" aria-hidden />
```

- [ ] **Step 4: Retire FiveStar chrome, keep the Google mock**

`g*` classes are legitimate here **only** on the parts depicting Google's own UI — the info rows inside the phone (the rating row's stars, the Business Profile and "Leave a review" rows, the green "Review posted" state). Those stay.

`MiniCard` is FiveStar's own product, not Google UI, so it moves to the brand:
- `fill-gyellow text-gyellow` → `fill-star text-star`
- `<Nfc className="text-gblue" />` → `<Nfc className="text-brand" />`
- The dark `from-slate-900 via-slate-800 to-slate-900` gradient is the retired fictional card's styling. Restyle it as a white NFC card to match the real product now rendered in the hero: `bg-gradient-to-br from-white to-[#eef1f5] ring-1 ring-hairline`, with `text-ink` for the name and `text-body` for the tagline (the existing `text-white`/`text-slate-400` will be invisible on it).

The scanner chrome is also FiveStar's own: `border-gblue` on the corner brackets → `border-brand`, and the scan beam's `via-gblue` → `via-brand`. The phone body's `border-slate-200` → `border-hairline`, `text-slate-500` → `text-body`.

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint && npx vitest run`
Expected: all clean.

Manual at 1440×900: the scene pins, and scrolling advances one business per viewport — six businesses across the runway. Scrolling back up steps backwards through them. The scene releases cleanly at the bottom and does not overlap the next section.

At 390×844 and with reduced motion: the runway collapses, the timer fallback runs, and **the scroll is never trapped** — confirm you can scroll straight past the section at normal speed.

- [ ] **Step 6: Commit**

```bash
git add components/site/scan-showcase.tsx
git commit -m "feat(site): moment 2 — scroll-driven tap sequence replaces the 2s timer"
```

---

### Task 8: Footer rebuild and the guarantee badge

Two of the three approved `recommended-changes.md` items. **This task's main job is refusing to fabricate.**

**Files:**
- Modify: `components/site/footer.tsx`
- Modify: `components/site/pricing.tsx` (badge placement only)
- Modify: `lib/content.ts` (`site.location`, `site.phone`, `site.social`, `pricing.guarantee`)

**Interfaces:**
- Consumes: `content` (Task 1 unchanged), existing `Section`.
- Produces: nothing later tasks depend on.

**Integrity constraints — binding:**
- The `recommended-changes.md` doc suggests a "30-day money-back guarantee" and "if you don't get at least 5 new reviews in 30 days, we'll refund you in full." **Do not write either.** Neither has been agreed to by the founders, and a refund promise on a live page is an enforceable commitment.
- The badge must state only what existing copy already promises: `pricing.body` says "No contracts on either. If you're not getting reviews, you can walk away and keep the cards," and `tiers[1].features` says "Cancel anytime, keep the cards." That is the guarantee.
- The doc also suggests "Based in [City, State]", a phone number, and social links. **Do not invent any of them.** Add the keys as `null` and render each only when it is filled in.

- [ ] **Step 1: Add the new content keys**

In `lib/content.ts`, extend the `site` block:

```ts
  site: {
    name: "FiveStar Local",
    email: "hello@fivestarlocal.pro",
    // Your real Google review link (e.g. https://g.page/r/XXXX/review). null hides it.
    reviewUrl: null as string | null,
    // Footer details. Each renders only when filled — leave null rather than
    // guessing, an unfilled field is invisible but a wrong one is a lie.
    location: null as string | null, // e.g. "Based in Norwalk, CT"
    phone: null as string | null,    // e.g. "(203) 555-0134"
    social: [] as { label: string; href: string }[],
  },
```

and add to the `pricing` block, after `finePrint`:

```ts
    // States only what the tiers already promise — no refund language, which
    // has not been agreed to and would be an enforceable commitment.
    guarantee: {
      title: "No contracts, ever",
      body: "If it isn't bringing you reviews, walk away — and keep the cards.",
    },
```

- [ ] **Step 2: Rebuild `components/site/footer.tsx`**

```tsx
import Link from "next/link";
import { Star } from "lucide-react";
import { content } from "@/lib/content";

export function Footer() {
  const { site, nav } = content;
  return (
    <footer className="border-t border-hairline bg-paper py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-heading font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Star size={18} className="fill-star text-star" />
            </span>
            {site.name}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-body">
            NFC review cards for local businesses — programmed to your Google
            review link and installed in person.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-body/70">Site</p>
          <ul className="mt-4 space-y-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-body transition-colors hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-body/70">Get in touch</p>
          <ul className="mt-4 space-y-2.5 text-sm text-body">
            <li>
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-brand">
                {site.email}
              </a>
            </li>
            {site.phone && (
              <li>
                <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-brand">
                  {site.phone}
                </a>
              </li>
            )}
            {site.location && <li>{site.location}</li>}
            {site.social.length > 0 && (
              <li className="flex gap-4 pt-1">
                {site.social.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-brand"
                  >
                    {s.label}
                  </a>
                ))}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-hairline px-4 pt-8 sm:px-6">
        <p className="text-xs text-body/70">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Add the guarantee badge to `pricing.tsx`**

Immediately after the tier grid closes and before the `finePrint` paragraph, insert:

```tsx
<div className="mx-auto mt-12 flex max-w-xl items-center gap-4 rounded-2xl border border-star/30 bg-star/10 px-6 py-5">
  <ShieldCheck size={28} className="shrink-0 text-star" />
  <div>
    <p className="font-heading font-bold text-ink">{content.pricing.guarantee.title}</p>
    <p className="mt-1 text-sm leading-relaxed text-body">{content.pricing.guarantee.body}</p>
  </div>
</div>
```

and add `ShieldCheck` to the existing `lucide-react` import at the top of the file.

- [ ] **Step 4: Add a `TODO` note for the unfilled fields**

At the top of `lib/content.ts`, extend the existing numbered TODO list with:

```ts
// 6. Footer details: set site.location, site.phone, and site.social when you
//    want them public. Each renders only when non-null — leave them null
//    rather than guessing.
```

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint && npx vitest run`
Expected: all clean.

Manual: the footer renders with three columns and **no empty/placeholder rows** for phone, location, or social (all still null). The guarantee badge sits under the pricing tiers and says nothing about refunds.

- [ ] **Step 6: Commit**

```bash
git add components/site/footer.tsx components/site/pricing.tsx lib/content.ts
git commit -m "feat(site): rebuilt footer and no-contracts guarantee badge"
```

---

### Task 9: Intake form — replacing the `mailto:` CTA

The third approved item, and the only one with a server side. This is the first **publicly reachable, unauthenticated** write path in the codebase — every other action sits behind `requireUser()`. Treat the input as hostile.

**Files:**
- Create: `supabase/migrations/0007_leads.sql`
- Create: `lib/leads/schema.ts`
- Create: `lib/leads/db.ts`
- Create: `lib/leads/CLAUDE.md`
- Create: `app/actions/leads.ts`
- Create: `components/site/intake-form.tsx`
- Modify: `components/site/final-cta.tsx`
- Modify: `lib/content.ts` (`intake` block)
- Test: `tests/leads/schema.test.ts`

**Interfaces:**
- Consumes: `getDb()` from `lib/replydesk/db.ts` (the existing service-role factory — reused rather than duplicated; this is the one sanctioned cross-module import in this plan).
- Produces:
  - `lib/leads/schema.ts` exports `leadSchema` (zod), `isBot(honeypot: string): boolean`, `type LeadInput`, `type LeadResult = { ok: true } | { ok: false; error: string }`.
  - `lib/leads/db.ts` exports `insertLead(db: SupabaseClient, lead: LeadInput): Promise<void>`.
  - `app/actions/leads.ts` exports `submitLeadAction(prev: LeadResult | null, formData: FormData): Promise<LeadResult>`.

- [ ] **Step 1: Write the failing test**

Create `tests/leads/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isBot, leadSchema } from "@/lib/leads/schema";

describe("leadSchema", () => {
  const valid = { businessName: "Bella's Bakery", email: "owner@bellas.com", note: "" };

  it("accepts a minimal valid submission and nulls an empty note", () => {
    const r = leadSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeNull();
  });

  it("trims surrounding whitespace from the business name", () => {
    const r = leadSchema.safeParse({ ...valid, businessName: "  Bella's Bakery  " });
    expect(r.success && r.data.businessName).toBe("Bella's Bakery");
  });

  it("rejects a blank business name", () => {
    expect(leadSchema.safeParse({ ...valid, businessName: "   " }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(leadSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects oversized input rather than writing it to the database", () => {
    expect(leadSchema.safeParse({ ...valid, businessName: "x".repeat(121) }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("isBot", () => {
  it("treats an untouched honeypot as human", () => {
    expect(isBot("")).toBe(false);
    expect(isBot("   ")).toBe(false);
  });

  it("treats any filled honeypot as a bot", () => {
    expect(isBot("http://spam.example")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/leads/schema.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/leads/schema"`.

- [ ] **Step 3: Write `lib/leads/schema.ts`**

```ts
import { z } from "zod";

// The only zod schema on this site a stranger can reach — every other action
// sits behind requireUser(). Assume hostile input: bound every string so a
// scripted submitter cannot write megabytes into the table.

export const MAX_NAME = 120;
export const MAX_EMAIL = 160;
export const MAX_NOTE = 500;

export const leadSchema = z.object({
  businessName: z.string().trim().min(1, "Tell us your business name").max(MAX_NAME),
  email: z.email("That doesn't look like an email address").max(MAX_EMAIL),
  // Empty-string input from an untouched textarea degrades to null.
  note: z.string().trim().max(MAX_NOTE).transform((s) => (s === "" ? null : s)),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type LeadResult = { ok: true } | { ok: false; error: string };

/**
 * Honeypot check. The form renders a visually-hidden "website" field that a
 * human never sees and therefore never fills; a naive bot fills every input
 * it finds. Deliberately separate from leadSchema so the caller can answer a
 * bot with the same success shape a human gets — a validation error would
 * tell an attacker the field is a trap.
 */
export function isBot(honeypot: string): boolean {
  return honeypot.trim().length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/leads/schema.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the migration**

Create `supabase/migrations/0007_leads.sql`:

```sql
-- Public marketing-site intake. Written only by submitLeadAction using the
-- service-role key. RLS on with zero policies, same as every other table
-- here: the publishable key can neither read nor write it, so a scraped
-- anon key exposes no prospect emails.
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  email text not null,
  note text,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
create index leads_created_at_idx on leads (created_at desc);
```

Apply it to the live project (ref `eormybbtnxathltmkbif`) the same way migrations 0001–0006 were applied.

- [ ] **Step 6: Write `lib/leads/db.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadInput } from "./schema";

// Injected client, never constructed here — same rule as lib/crm/db.ts and
// lib/replydesk/db.ts.
export async function insertLead(db: SupabaseClient, lead: LeadInput): Promise<void> {
  const { error } = await db.from("leads").insert({
    business_name: lead.businessName,
    email: lead.email,
    note: lead.note,
    source: "landing",
  });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 7: Write `lib/leads/CLAUDE.md`**

```markdown
# lib/leads — public marketing-site intake

Pure, dependency-injected. Sibling of lib/crm and lib/replydesk, same rules.

INVARIANTS
- Nothing here imports from `next/*` or constructs a Supabase client.
- This is the ONLY input path on the product reachable without auth. Every
  string field is length-bounded in schema.ts; do not relax a bound without
  a matching reason, and never add a field that is written unbounded.
- The honeypot lives in `isBot`, deliberately outside `leadSchema`, so a bot
  can be answered with the same success shape a human gets. Folding it into
  the schema would leak the trap through a validation error.

MAP
- schema.ts — leadSchema (zod), MAX_NAME/MAX_EMAIL/MAX_NOTE, isBot,
  LeadInput, LeadResult.
- db.ts — insertLead(db, lead), injected SupabaseClient.

TESTS: tests/leads/
```

- [ ] **Step 8: Write `app/actions/leads.ts`**

```ts
"use server";

import { getDb } from "@/lib/replydesk/db";
import { insertLead } from "@/lib/leads/db";
import { isBot, leadSchema, type LeadResult } from "@/lib/leads/schema";
import { content } from "@/lib/content";

export async function submitLeadAction(
  _prev: LeadResult | null,
  formData: FormData,
): Promise<LeadResult> {
  // Honeypot first, and answered with success: probing the form teaches an
  // attacker nothing, and nothing is written.
  if (isBot(String(formData.get("website") ?? ""))) return { ok: true };

  const parsed = leadSchema.safeParse({
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  try {
    await insertLead(getDb(), parsed.data);
  } catch {
    // Never surface the DB error — it can carry schema detail. Give the
    // prospect a path that still works if our database is down.
    return { ok: false, error: `Something went wrong on our end. Email us at ${content.site.email} instead.` };
  }

  return { ok: true };
}
```

- [ ] **Step 9: Add the intake copy**

In `lib/content.ts`, add a top-level `intake` block after `finalCta`:

```ts
  intake: {
    title: "Tell us your business name",
    body: "We'll find you on Google, program a card to your review page, and bring it to you.",
    businessLabel: "Business name",
    businessPlaceholder: "Bella's Bakery",
    emailLabel: "Email",
    emailPlaceholder: "you@yourbusiness.com",
    noteLabel: "Anything we should know? (optional)",
    notePlaceholder: "Best time to stop by, what you sell, anything else.",
    submit: "Find me on Google",
    submitting: "Sending…",
    success: "Got it — we'll email you within a day.",
  },
```

- [ ] **Step 10: Write `components/site/intake-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { submitLeadAction } from "@/app/actions/leads";
import type { LeadResult } from "@/lib/leads/schema";
import { content } from "@/lib/content";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-star px-5 py-3 font-semibold text-ink transition-colors hover:bg-star/90 disabled:opacity-60"
    >
      {pending ? content.intake.submitting : content.intake.submit}
    </button>
  );
}

export function IntakeForm() {
  const [state, formAction] = useActionState<LeadResult | null, FormData>(submitLeadAction, null);

  if (state?.ok) {
    return (
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-left">
        <CheckCircle2 size={22} className="shrink-0 text-star" />
        <p className="text-white">{content.intake.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-3 text-left">
      {/* Honeypot: visually hidden, never announced, never tab-reachable.
          A human cannot fill it; a naive bot fills everything. */}
      <div aria-hidden className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-white/80">
          {content.intake.businessLabel}
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          maxLength={120}
          placeholder={content.intake.businessPlaceholder}
          className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80">
          {content.intake.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={160}
          placeholder={content.intake.emailPlaceholder}
          className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-white/80">
          {content.intake.noteLabel}
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder={content.intake.notePlaceholder}
          className="mt-1.5 w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-star focus:outline-none"
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-star">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
```

- [ ] **Step 11: Swap the `mailto:` CTA in `final-cta.tsx`**

Replace the `<Button render={<a href={mailto...} />}>` block and the email paragraph beneath it with:

```tsx
<div className="mt-10">
  <IntakeForm />
</div>
<p className="mt-6 font-mono text-xs tracking-wide text-white/60">
  Or email us directly — {content.site.email}
</p>
```

and add `import { IntakeForm } from "@/components/site/intake-form";` at the top. The direct email stays as a fallback: if the DB write path breaks, a prospect still has a way to reach you.

- [ ] **Step 12: Verify**

Run: `npx vitest run`
Expected: all pass (existing 156 + 3 brand + 6 odometer + 7 leads = 172).

Run: `npm run build && npm run lint`
Expected: clean.

Manual, with `.env.local` populated:
- Submit a real entry; confirm the row lands in the `leads` table via the Supabase MCP or dashboard.
- Submit with a blank business name — inline error, no row written.
- Submit with a malformed email — inline error, no row written.
- In devtools, fill the hidden `website` input and submit — the UI shows success and **no row is written**. This is the honeypot working; verify the row count did not change.
- Tab through the form and confirm focus never lands on the honeypot.

- [ ] **Step 13: Commit**

```bash
git add supabase/migrations/0007_leads.sql lib/leads app/actions components/site/intake-form.tsx components/site/final-cta.tsx lib/content.ts tests/leads
git commit -m "feat(site): intake form replaces the mailto CTA — leads table, honeypot, bounded input"
```

---

### Task 10: Verification pass and gate preparation

No new features. This task proves the phase is done and sets up the decision the gate exists to make.

**Files:** none created or modified except `docs/ROADMAP.md`.

- [ ] **Step 1: Prove no Google trademark colour leaked into FiveStar chrome**

Run:

```bash
grep -rn "gblue\|gyellow\|gred\|ggreen\|4285f4\|fbbc05\|ea4335\|34a853" components/site lib/content.ts app/page.tsx app/globals.css
```

Expected: matches **only** in `review-showcase.tsx`, `scan-showcase.tsx`, `tap-demo.tsx`, and the token definitions in `app/globals.css`. Any hit in another file is a defect — fix it before continuing.

- [ ] **Step 2: Prove no stale slate chrome survives**

Run:

```bash
grep -rn "slate-50\|slate-200\|slate-500\|slate-600\|slate-800\|slate-900" components/site app/page.tsx
```

Expected: matches only inside the three Google-mock components (their mocks legitimately use Google's own greys). Everything else should be `ink`/`body`/`hairline`/`paper`/`mist`.

- [ ] **Step 3: Full test and build gate**

Run: `npx vitest run`
Expected: PASS, 172 tests (156 existing + 16 new: 3 brand, 6 odometer, 7 leads). If the existing count is not 156, report the discrepancy rather than adjusting this number.

Run: `npm run build`
Expected: PASS, no new warnings.

Run: `npm run lint`
Expected: PASS, no new warnings.

- [ ] **Step 4: Measure the load time — the spec protects a 1.52s baseline**

Start the production server (`npm run build && npm run start`), then measure time to networkidle. If it exceeds ~2s, the motion work has regressed the page's biggest asset and that must be reported at the gate, not absorbed silently.

**Windows note:** killing `npm run start` orphans the node child on port 3000. Clean up with `Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess` then `Stop-Process -Id <pid> -Force`.

- [ ] **Step 5: Manual matrix**

Check all four combinations — 1440×900 and 390×844, each with `prefers-reduced-motion` off and on:

| Check | Pass condition |
|---|---|
| Horizontal scroll | `document.documentElement.scrollWidth === clientWidth` at both widths — the hero's bleed must not create a scrollbar |
| Ground ladder | Four distinct grounds visible in order: Ink, Paper, Mist, Paper, Ink, Mist, Paper, Mist, Cobalt |
| Hero dead zone | Gone — quick-link strip closes the base |
| Stand | Portrait, L-fold base, visible square side wall, no specular highlight |
| Moment 1 | Scrubs forward *and* reverses on desktop; settles instantly on mobile/reduced |
| Moment 2 | Sticky pin releases correctly; timer fallback runs on mobile/reduced |
| Contrast | Body text on Ink and Cobalt grounds passes WCAG AA (≥4.5:1) |
| Intake form | Submits, errors inline, honeypot silently absorbs bots |

- [ ] **Step 6: Update the roadmap**

Add a Phase 1 entry to `docs/ROADMAP.md` recording what shipped and that the gate decision (whether Phase 2 is needed) is outstanding.

- [ ] **Step 7: Commit and push the branch**

```bash
git add docs/ROADMAP.md
git commit -m "docs(roadmap): record landing Phase 1"
git push origin design/landing-brand-alignment
```

- [ ] **Step 8: Deploy a preview and hand off to the gate**

Push produces a Vercel preview deployment. **Do not merge to `master`.** Report the preview URL and the three gate questions, in the spec's priority order:

1. Does opening on Ink read as premium, or as heavy for an SMB buyer?
2. Does the stand read as a real object, or as flat cardboard?
3. Is the page still fast? (report the measured number against the 1.52s baseline)

Plus the two flagged-for-review decisions from this plan: the warmed Paper value (`#fcfbf9`), and Honey-on-Cobalt for the final CTA button.

---

## Notes for the executor

**On task independence.** Tasks 1→2 and 3→4 are hard dependencies. Task 5 is independent and can run any time before Task 6. Tasks 8 and 9 touch `lib/content.ts` and `final-cta.tsx`, which Task 2 also touches — run them after Task 2 to avoid conflicts.

**On the two riskiest tasks.** Task 3 (the stand) and Task 7 (the sticky pin) are where this plan is most likely to need judgment beyond what is written. Both have a named failure mode. If the stand reads as cardboard after honest tuning, say so at the gate rather than shipping it and hoping — the spec anticipated this and Phase 2 exists partly for it.

**On what this plan deliberately does not do.** No phone-tap choreography (Phase 2). No structural rework of the six restyle-only sections (Phase 2). No testimonials, case studies, social-proof counter, stats section, newsletter, Google trust logo, or "NFC Forum Certified" badge — those were triaged out on 2026-08-02 as either unearned, untrue, or a trademark problem.
