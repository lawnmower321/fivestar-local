# FiveStar Local Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a credibility-first, animated, Google-color-themed single-page landing site for FiveStar Local (NFC Google-review tap cards), deployable to Vercel.

**Architecture:** Static Next.js App Router page composed of ten section components under `components/site/`, with all editable copy centralized in `lib/content.ts` and four reusable animation primitives (Reveal, Stars, CountUp, NfcCard). No backend, no forms, no API routes.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui (button, accordion), `motion` (Framer Motion successor), lucide-react.

## Global Constraints

- Colors: Google Blue `#4285F4` (primary CTA), Green `#34A853` (success accents), Yellow `#FBBC05` (stars ONLY), Red `#EA4335` (gradient accent only). Base: white / `#F8FAFC`, text `#1E293B`.
- All copy/testimonials/stats are placeholders; `lib/content.ts` must start with a `// PLACEHOLDER CONTENT — replace with real data` comment.
- Every animation must respect `prefers-reduced-motion` (via `useReducedMotion()` or CSS media query).
- Responsive from 360px up. No horizontal scroll at any width.
- No checkout, forms, CMS, analytics, or extra pages (YAGNI).
- Verification for each task = `npm run build` passes (this is a static UI project; there is no unit-test suite — build + visual check is the test cycle).
- Working directory for all commands: `C:\Users\bmo72\fivestar-local`.

---

### Task 1: Scaffold project and install dependencies

**Files:**
- Create: entire Next.js scaffold (`app/`, `package.json`, etc.) at repo root
- Create: `components.json` (shadcn), `components/ui/button.tsx`, `components/ui/accordion.tsx`

**Interfaces:**
- Produces: working `npm run build` / `npm run dev`; `Button` from `@/components/ui/button`; `Accordion, AccordionContent, AccordionItem, AccordionTrigger` from `@/components/ui/accordion`; `cn` from `@/lib/utils`.

- [ ] **Step 1: Scaffold Next.js into a temp folder** (create-next-app refuses a non-empty dir; `docs/` already exists)

```powershell
npx --yes create-next-app@latest C:\Users\bmo72\fivestar-local-tmp --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Move scaffold into the repo and delete temp folder**

```powershell
robocopy C:\Users\bmo72\fivestar-local-tmp C:\Users\bmo72\fivestar-local /E /MOVE /XD .git node_modules
Set-Location C:\Users\bmo72\fivestar-local
npm install
```

(robocopy exit codes 0–7 are success; ignore nonzero up to 7.)

- [ ] **Step 3: Install animation + icon deps**

```powershell
npm install motion lucide-react
```

- [ ] **Step 4: Init shadcn and add button + accordion**

```powershell
npx --yes shadcn@latest init -y -b neutral
npx --yes shadcn@latest add button accordion -y
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: "Compiled successfully" (or ✓ compiled), exit code 0.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, shadcn, motion, lucide"
```

---

### Task 2: Theme, metadata, content file, and animation primitives

**Files:**
- Modify: `app/globals.css` (append theme colors + hero glow keyframes)
- Modify: `app/layout.tsx` (site metadata)
- Create: `lib/content.ts`
- Create: `components/site/reveal.tsx`
- Create: `components/site/stars.tsx`
- Create: `components/site/count-up.tsx`
- Create: `components/site/nfc-card.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  - Tailwind color utilities `gblue`, `ggreen`, `gyellow`, `gred` (e.g. `bg-gblue`, `fill-gyellow`)
  - CSS classes `glow-blob`, `animate-blob` (hero glow), `nfc-ripple`
  - `Reveal({ children, delay?, className? })` — scroll-reveal wrapper
  - `Stars({ count?, size?, className? })` — animated star row
  - `CountUp({ to, suffix?, duration? })` — in-view number counter
  - `NfcCard()` — CSS card mockup with ripple
  - `content` object from `@/lib/content` with keys: `site`, `nav`, `hero`, `steps`, `benefits`, `showcase`, `testimonials`, `stats`, `faqs`, `finalCta`

- [ ] **Step 1: Append theme + keyframes to `app/globals.css`** (keep whatever shadcn init generated; add this at the end)

```css
@theme {
  --color-gblue: #4285f4;
  --color-ggreen: #34a853;
  --color-gyellow: #fbbc05;
  --color-gred: #ea4335;
}

/* Hero gradient glow blobs */
.glow-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
}
@keyframes blob-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(24px, -32px) scale(1.1); }
  66% { transform: translate(-16px, 20px) scale(0.95); }
}
.animate-blob { animation: blob-drift 14s ease-in-out infinite; }

/* NFC tap ripple */
@keyframes nfc-ripple {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
.nfc-ripple {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 2px solid #4285f4;
  animation: nfc-ripple 2.4s ease-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-blob, .nfc-ripple { animation: none; }
}
```

- [ ] **Step 2: Replace metadata in `app/layout.tsx`**

Replace the exported `metadata` object with:

```tsx
export const metadata: Metadata = {
  title: "FiveStar Local — Turn Happy Customers into 5-Star Google Reviews",
  description:
    "NFC tap cards that make leaving a Google review effortless. One tap, more reviews, better local rankings.",
};
```

Also add `className="scroll-smooth"` to the `<html>` tag.

- [ ] **Step 3: Create `lib/content.ts`** (full file)

```ts
// PLACEHOLDER CONTENT — replace with real data before going live.
// Every string on the site lives here so you only edit this one file.

export const content = {
  site: {
    name: "FiveStar Local",
    email: "hello@fivestarlocal.com", // PLACEHOLDER — replace with real email
  },
  nav: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Benefits", href: "#benefits" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" },
  ],
  hero: {
    badge: "Trusted by local businesses",
    headline: "Turn happy customers into 5-star Google reviews",
    highlight: "with one tap",
    subhead:
      "FiveStar Local NFC cards make leaving a review effortless. Your customer taps the card, their phone opens your Google review page, and your rating climbs.",
    cta: "Get Started",
    ctaSecondary: "See how it works",
  },
  steps: [
    {
      title: "Tap the card",
      body: "Hand your customer the FiveStar card. One tap with any modern phone — no app, no QR hunting.",
    },
    {
      title: "Leave a review",
      body: "Their phone opens your Google review page instantly. Five stars takes about fifteen seconds.",
    },
    {
      title: "Climb the rankings",
      body: "More fresh reviews means better local search visibility — and more customers walking in.",
    },
  ],
  benefits: [
    { title: "More reviews, faster", body: "Businesses using tap cards collect reviews dramatically faster than asking alone." },
    { title: "Better local SEO", body: "Review volume and recency are key local ranking signals on Google." },
    { title: "No app required", body: "Works with the NFC reader built into every modern iPhone and Android." },
    { title: "Works on any phone", body: "QR code on the back covers older phones, so nobody is left out." },
    { title: "Unlimited taps", body: "One card, unlimited reviews. No subscriptions, no per-tap fees." },
    { title: "Set up in minutes", body: "We link your card to your Google Business Profile before it ships." },
  ],
  showcase: {
    title: "One card. Every review.",
    body: "A premium NFC card that lives at your counter. No batteries, no app, no fuss — just tap.",
    bullets: [
      "Premium matte finish with your branding",
      "NFC chip + QR fallback on the back",
      "No batteries, no charging, no maintenance",
      "Re-linkable if your Google profile changes",
    ],
  },
  // PLACEHOLDER testimonials — replace with real customer quotes
  testimonials: [
    { name: "Maria G.", business: "Bella's Bakery", quote: "We went from 40 reviews to over 200 in three months. Customers actually enjoy tapping the card." },
    { name: "James T.", business: "T&J Auto Repair", quote: "Simplest marketing money I've ever spent. We show up first on Google Maps in our area now." },
    { name: "Priya S.", business: "Lotus Nail Studio", quote: "My clients tap it at checkout without me even asking. Reviews just happen now." },
    { name: "Dan R.", business: "Riverside Barbershop", quote: "Setup took five minutes. The card looks great on the counter and it just works." },
    { name: "Kelly M.", business: "Fresh Coat Painting", quote: "We close more jobs because people see 5 stars before they even call us." },
    { name: "Omar H.", business: "Cedar Grill", quote: "Our rating went from 4.1 to 4.7. That half star changed our weekends completely." },
  ],
  // PLACEHOLDER stats — replace with real numbers
  // isRating: true renders value/10 as "4.9 ★" instead of a plain count
  stats: [
    { value: 2000, suffix: "+", label: "Businesses served", isRating: false },
    { value: 500000, suffix: "+", label: "Reviews collected", isRating: false },
    { value: 49, suffix: "", label: "Average rating", isRating: true },
  ],
  faqs: [
    { q: "Do my customers need an app?", a: "No. Tapping the card uses the NFC reader built into every modern smartphone. Older phones can scan the QR code on the back instead." },
    { q: "Is this allowed by Google?", a: "Yes. The card simply makes it easier for customers to reach your public review page — the same link Google gives every business. You should never offer incentives for reviews, and we'll guide you on best practices." },
    { q: "How long does setup take?", a: "Minutes. Tell us your business name, we link the card to your Google Business Profile, and it arrives ready to tap." },
    { q: "What if I move or rebrand?", a: "Cards are re-linkable. If your Google profile changes, we update your card's destination for free." },
    { q: "Does the card need charging?", a: "Never. NFC chips are passive — no battery, no charging, no maintenance. It works for years." },
    { q: "What does it cost?", a: "One flat price per card, no subscriptions and no per-tap fees. Contact us for current pricing and volume discounts." },
  ],
  finalCta: {
    title: "Ready to look like the obvious choice?",
    body: "Join local businesses turning everyday customers into a five-star reputation.",
    cta: "Get Started",
  },
} as const;
```

- [ ] **Step 4: Create `components/site/reveal.tsx`**

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Create `components/site/stars.tsx`**

```tsx
"use client";

import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function Stars({
  count = 5,
  size = 20,
  className = "",
}: {
  count?: number;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex gap-1 ${className}`} role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, scale: 0.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 15 }}
        >
          <Star
            size={size}
            className={i < count ? "fill-gyellow text-gyellow" : "text-slate-300"}
          />
        </motion.span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `components/site/count-up.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

export function CountUp({
  to,
  suffix = "",
  duration = 1.8,
  format = (n: number) => n.toLocaleString(),
}: {
  to: number;
  suffix?: string;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref}>
      {format(val)}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 7: Create `components/site/nfc-card.tsx`**

```tsx
"use client";

import { Nfc, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function NfcCard() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex items-center justify-center">
      {/* tap ripple rings */}
      <div className="absolute right-6 top-6 h-12 w-12">
        <span className="nfc-ripple" />
        <span className="nfc-ripple" style={{ animationDelay: "1.2s" }} />
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={reduce ? undefined : { rotate: 0, scale: 1.03 }}
        className="relative aspect-[1.586] w-72 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-slate-900/30 sm:w-80"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-white">FiveStar Local</p>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-gyellow text-gyellow" />
              ))}
            </div>
          </div>
          <Nfc className="text-gblue" size={28} />
        </div>
        <p className="absolute bottom-6 left-6 text-sm text-slate-400">
          Tap to review us on Google
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: exit code 0, no type errors.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat: add theme colors, content file, and animation primitives"
```

---

### Task 3: Navbar, Footer, and page skeleton

**Files:**
- Create: `components/site/navbar.tsx`
- Create: `components/site/footer.tsx`
- Modify: `app/page.tsx` (replace entirely)

**Interfaces:**
- Consumes: `content` from `@/lib/content`; `Button` from `@/components/ui/button`; `Stars` from Task 2.
- Produces: `Navbar()`, `Footer()`; `app/page.tsx` renders `<Navbar />`, section placeholders replaced in Tasks 4–7, `<Footer />`. Section ids used by nav anchors: `how-it-works`, `benefits`, `reviews`, `faq`.

- [ ] **Step 1: Create `components/site/navbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Star, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gblue">
            <Star size={18} className="fill-gyellow text-gyellow" />
          </span>
          {content.site.name}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-gblue"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="bg-gblue text-white hover:bg-gblue/90">
            <a href={`mailto:${content.site.email}`}>Get Started</a>
          </Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-slate-600"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full bg-gblue text-white hover:bg-gblue/90">
            <a href={`mailto:${content.site.email}`}>Get Started</a>
          </Button>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create `components/site/footer.tsx`**

```tsx
import Link from "next/link";
import { Star } from "lucide-react";
import { content } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gblue">
            <Star size={18} className="fill-gyellow text-gyellow" />
          </span>
          {content.site.name}
        </div>
        <div className="flex gap-6">
          {content.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-slate-500 hover:text-gblue">
              {item.label}
            </Link>
          ))}
        </div>
        <a href={`mailto:${content.site.email}`} className="text-sm text-slate-500 hover:text-gblue">
          {content.site.email}
        </a>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {content.site.name}. All rights reserved.
      </p>
    </footer>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        {/* Sections added in Tasks 4–7: Hero, HowItWorks, Benefits, Showcase, Testimonials, Stats, Faq, FinalCta */}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build` — Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add navbar, footer, and page skeleton"
```

---

### Task 4: Hero section

**Files:**
- Create: `components/site/hero.tsx`
- Modify: `app/page.tsx` (add `<Hero />` inside `<main>`)

**Interfaces:**
- Consumes: `content.hero`, `NfcCard`, `Stars`, `Button`, `Reveal`.
- Produces: `Hero()` rendered first in `<main>`.

- [ ] **Step 1: Create `components/site/hero.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";
import { NfcCard } from "@/components/site/nfc-card";
import { Stars } from "@/components/site/stars";
import { motion, useReducedMotion } from "motion/react";

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <section className="relative overflow-hidden bg-slate-50 pb-20 pt-32 sm:pt-40">
      {/* 4-color gradient glow */}
      <div className="glow-blob animate-blob left-[-10%] top-[-10%] h-72 w-72 bg-gblue" />
      <div className="glow-blob animate-blob right-[-5%] top-[10%] h-64 w-64 bg-gred" style={{ animationDelay: "-4s" }} />
      <div className="glow-blob animate-blob bottom-[-15%] left-[20%] h-64 w-64 bg-gyellow" style={{ animationDelay: "-8s" }} />
      <div className="glow-blob animate-blob bottom-[-10%] right-[25%] h-56 w-56 bg-ggreen" style={{ animationDelay: "-11s" }} />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <motion.div {...fade(0)} className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
            <Stars size={14} />
            {content.hero.badge}
          </motion.div>
          <motion.h1 {...fade(0.1)} className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {content.hero.headline}{" "}
            <span className="bg-gradient-to-r from-gblue via-ggreen to-gblue bg-clip-text text-transparent">
              {content.hero.highlight}
            </span>
          </motion.h1>
          <motion.p {...fade(0.2)} className="mt-6 max-w-xl text-lg text-slate-600">
            {content.hero.subhead}
          </motion.p>
          <motion.div {...fade(0.3)} className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-gblue text-white hover:bg-gblue/90">
              <a href={`mailto:${content.site.email}`}>{content.hero.cta}</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">{content.hero.ctaSecondary}</a>
            </Button>
          </motion.div>
        </div>
        <NfcCard />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add to `app/page.tsx`** — import `Hero` and render as first child of `<main>`:

```tsx
import { Hero } from "@/components/site/hero";
// inside <main>:
<Hero />
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: add hero section with NFC card mockup and gradient glow"
```

---

### Task 5: How It Works + Benefits sections

**Files:**
- Create: `components/site/how-it-works.tsx`
- Create: `components/site/benefits.tsx`
- Modify: `app/page.tsx` (render after `<Hero />`)

**Interfaces:**
- Consumes: `content.steps`, `content.benefits`, `Reveal`.
- Produces: `HowItWorks()` (section id `how-it-works`), `Benefits()` (section id `benefits`).

- [ ] **Step 1: Create `components/site/how-it-works.tsx`**

```tsx
import { Nfc, MessageSquareText, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const icons = [Nfc, MessageSquareText, TrendingUp];
const iconColors = ["text-gblue bg-gblue/10", "text-ggreen bg-ggreen/10", "text-gred bg-gred/10"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Three steps between you and a five-star reputation.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {content.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={step.title} delay={i * 0.15} className="text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${iconColors[i]}`}>
                  <Icon size={28} />
                </div>
                <p className="mt-2 text-sm font-semibold text-gblue">Step {i + 1}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-slate-600">{step.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/site/benefits.tsx`**

```tsx
import { Rocket, MapPin, Smartphone, QrCode, Infinity, Timer } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const icons = [Rocket, MapPin, Smartphone, QrCode, Infinity, Timer];

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why businesses love it
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.benefits.map((b, i) => {
            const Icon = icons[i];
            return (
              <Reveal
                key={b.title}
                delay={(i % 3) * 0.1}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gblue/10 text-gblue transition-colors group-hover:bg-gblue group-hover:text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-slate-600">{b.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Render both in `app/page.tsx`** after `<Hero />`:

```tsx
import { HowItWorks } from "@/components/site/how-it-works";
import { Benefits } from "@/components/site/benefits";
// inside <main>, after <Hero />:
<HowItWorks />
<Benefits />
```

- [ ] **Step 4: Verify build**

Run: `npm run build` — Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add how-it-works and benefits sections"
```

---

### Task 6: Product showcase + Testimonials sections

**Files:**
- Create: `components/site/showcase.tsx`
- Create: `components/site/testimonials.tsx`
- Modify: `app/page.tsx` (render after `<Benefits />`)

**Interfaces:**
- Consumes: `content.showcase`, `content.testimonials`, `NfcCard`, `Stars`, `Reveal`.
- Produces: `Showcase()`, `Testimonials()` (section id `reviews`).

- [ ] **Step 1: Create `components/site/showcase.tsx`**

```tsx
import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { NfcCard } from "@/components/site/nfc-card";
import { content } from "@/lib/content";

export function Showcase() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <NfcCard />
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.showcase.title}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{content.showcase.body}</p>
          <ul className="mt-8 space-y-4">
            {content.showcase.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-ggreen" size={22} />
                <span className="text-slate-700">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/site/testimonials.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Stars } from "@/components/site/stars";
import { content } from "@/lib/content";

export function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by local businesses
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Owners like you, turning great service into great ratings.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={(i % 3) * 0.1}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Stars size={16} />
              <p className="mt-4 flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gblue/10 font-semibold text-gblue">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.business}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Render both in `app/page.tsx`** after `<Benefits />`:

```tsx
import { Showcase } from "@/components/site/showcase";
import { Testimonials } from "@/components/site/testimonials";
// inside <main>, after <Benefits />:
<Showcase />
<Testimonials />
```

- [ ] **Step 4: Verify build**

Run: `npm run build` — Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: add showcase and testimonials sections"
```

---

### Task 7: Stats band, FAQ, and Final CTA

**Files:**
- Create: `components/site/stats.tsx`
- Create: `components/site/faq.tsx`
- Create: `components/site/final-cta.tsx`
- Modify: `app/page.tsx` (render after `<Testimonials />`)

**Interfaces:**
- Consumes: `content.stats`, `content.faqs`, `content.finalCta`, `CountUp`, `Reveal`, shadcn `Accordion`, `Button`.
- Produces: `Stats()`, `Faq()` (section id `faq`), `FinalCta()`. Completes the page.

- [ ] **Step 1: Create `components/site/stats.tsx`**

Note: the "Average rating" stat stores `49` and formats as `4.9` with a `★`.

```tsx
import { CountUp } from "@/components/site/count-up";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function Stats() {
  return (
    <section className="bg-gblue py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 text-center sm:grid-cols-3 sm:px-6">
        {content.stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <p className="text-4xl font-extrabold text-white sm:text-5xl">
              {s.isRating ? (
                <>
                  <CountUp to={s.value} format={(n) => (n / 10).toFixed(1)} />
                  <span className="text-gyellow"> ★</span>
                </>
              ) : (
                <CountUp to={s.value} suffix={s.suffix} />
              )}
            </p>
            <p className="mt-2 text-blue-100">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/site/faq.tsx`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {content.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/site/final-cta.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="glow-blob animate-blob left-[10%] top-[-30%] h-64 w-64 bg-gblue" />
      <div className="glow-blob animate-blob bottom-[-30%] right-[10%] h-64 w-64 bg-ggreen" style={{ animationDelay: "-6s" }} />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.finalCta.title}
        </h2>
        <p className="mt-4 text-lg text-slate-300">{content.finalCta.body}</p>
        <Button asChild size="lg" className="mt-8 bg-gblue text-white hover:bg-gblue/90">
          <a href={`mailto:${content.site.email}`}>{content.finalCta.cta}</a>
        </Button>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Render all three in `app/page.tsx`** after `<Testimonials />` (final `<main>` order: Hero, HowItWorks, Benefits, Showcase, Testimonials, Stats, Faq, FinalCta):

```tsx
import { Stats } from "@/components/site/stats";
import { Faq } from "@/components/site/faq";
import { FinalCta } from "@/components/site/final-cta";
// inside <main>, after <Testimonials />:
<Stats />
<Faq />
<FinalCta />
```

- [ ] **Step 5: Verify build**

Run: `npm run build` — Expected: exit 0.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: add stats band, FAQ accordion, and final CTA"
```

---

### Task 8: Visual verification and polish

**Files:**
- Modify: any file needing fixes found during visual check

**Interfaces:**
- Consumes: the complete page from Tasks 1–7.
- Produces: verified, polished final page.

- [ ] **Step 1: Run dev server and take screenshots**

```powershell
npm run dev
```

Open http://localhost:3000. Check every section at desktop width AND ~375px mobile width (browser devtools). Verify:
- No horizontal scrollbar at 360px
- Navbar mobile menu opens/closes
- All anchor links scroll to correct sections
- Star animations, count-up, ripple, and glow blobs animate
- Text is readable over all backgrounds

- [ ] **Step 2: Fix any visual issues found** (spacing, overflow, contrast). Re-check after each fix.

- [ ] **Step 3: Final production build**

Run: `npm run build` — Expected: exit 0, all pages static (`○` markers).

- [ ] **Step 4: Commit any fixes**

```powershell
git add -A
git commit -m "fix: visual polish from responsive verification"
```
