# FiveStar Local — Landing Page Design

**Date:** 2026-07-07
**Status:** Approved by user

## Purpose

A credibility-first marketing/brochure landing page for **FiveStar Local**, a business selling NFC tap cards that let customers leave Google reviews with one tap. No hard conversion funnel — the page exists to look professional and trustworthy when prospects visit. Soft CTA only ("Get Started" → mailto contact).

## Goals & Success Criteria

- Looks modern, premium, and credible on both desktop and mobile
- Smooth, tasteful animations throughout (no jank, no gimmicks)
- Clear Google-inspired color identity
- Testimonial/review section builds social proof
- Deploys cleanly to Vercel free tier
- All content is realistic placeholder copy, clearly swappable for real data

## Stack

- **Next.js (App Router) + TypeScript** — static single page, no backend, no database
- **Tailwind CSS v4** — styling
- **shadcn/ui** — Button, Card, Accordion primitives
- **Framer Motion (`motion`)** — scroll reveals, counters, hover/tap animations
- **lucide-react** — icons
- Deploys to **Vercel** (free tier); custom domain can be attached later

## Color System (Google-inspired)

- Base: white / very light gray (`#F8FAFC`), dark slate text (`#1E293B`)
- **Google Blue `#4285F4`** — primary CTA + links
- **Google Green `#34A853`** — success accents, checkmarks
- **Google Yellow `#FBBC05`** — star ratings ONLY
- **Google Red `#EA4335`** — sparing accent (gradient only)
- Subtle 4-color gradient glow behind hero; blue-dominant elsewhere

## Page Structure (single page, top → bottom)

1. **Sticky navbar** — logo ("FiveStar Local" with star mark), anchor links (How it works, Benefits, Reviews, FAQ), "Get Started" button
2. **Hero** — headline "Turn happy customers into 5-star Google reviews — with one tap", subhead, primary CTA, floating NFC card mockup with animated tap-ripple + animated star row, soft 4-color gradient glow
3. **How it works** — 3 steps with icons, scroll-animated: Tap the card → Customer leaves a review → You climb Google rankings
4. **Benefits grid** — 4–6 cards: more reviews, better local SEO, no app needed, works on any phone, unlimited taps, setup in minutes
5. **Product showcase** — NFC card visual with feature callouts
6. **Testimonials** — grid of 5-star review cards from placeholder business owners (marked as placeholders in code comments)
7. **Stats band** — animated count-up: businesses served, reviews collected, avg rating (placeholder numbers)
8. **FAQ** — accordion, 5–6 objection-handling questions
9. **Final CTA band** — closing call-to-action
10. **Footer** — logo, anchor links, contact email

## Animations

- Scroll-reveal fade/slide-up on all sections (Framer Motion `whileInView`, once)
- Animated star-fill in hero and testimonial cards
- Count-up numbers in stats band
- Card hover lift on benefit/testimonial cards
- NFC "tap ripple" pulse on hero card mockup
- Slow animated gradient glow behind hero
- Respect `prefers-reduced-motion`

## Content Policy

All copy, testimonials, stats, and names are **realistic placeholders**, marked with code comments (`// PLACEHOLDER — replace with real data`) so the owner can swap in real content later. Nothing presented as verified real data.

## Error Handling / Edge Cases

- Static page — no runtime data, no forms, no API routes, so no server error states
- Responsive from 360px mobile up to wide desktop
- Reduced-motion users get content without animation

## Testing / Verification

- `npm run build` passes with no errors
- Visual check of every section at mobile + desktop widths
- Lighthouse-reasonable: optimized fonts, no giant images (card mockup is CSS/SVG, not a photo)

## Out of Scope (YAGNI)

- Checkout / Stripe, lead-capture forms, CMS, blog, auth, analytics, multi-page routing
