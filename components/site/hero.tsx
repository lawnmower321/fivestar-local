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
  // through TapDemo so the object turns as the page moves. Handed over
  // unconditionally: CounterStand already collapses its own yaw range to a
  // constant under reduced motion, so gating this prop on `reduce` would only
  // add a second, redundant reduced-motion branch to keep in sync.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // `initial` must NOT depend on `reduce`. useReducedMotion() is false during
  // SSR and true on a reduced-motion user's first client render, so a
  // conditional initial ships one inline style from the server and a different
  // one from the client — a real hydration mismatch (the same defect that was
  // fixed in counter-stand.tsx). Reduced motion suppresses the MOTION, not the
  // rendered state: the states stay put and the duration/delay collapse to 0,
  // so the element simply arrives already there.
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0 : 0.6,
      delay: reduce ? 0 : delay,
      ease: "easeOut" as const,
    },
  });

  return (
    <Section ground="ink" className="overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* corner brackets — inset L-rules that frame the hero as a deliberate
          composition rather than a container that happens to end. Top inset is
          24 rather than 6: the hero is the first thing in <main> and starts at
          document y=0, so a 24px top inset puts the upper pair underneath the
          fixed 64px-tall navbar, where they are simply invisible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-6 top-24 hidden lg:block"
      >
        <span className="absolute left-0 top-0 h-10 w-10 border-l border-t border-white/20" />
        <span className="absolute right-0 top-0 h-10 w-10 border-r border-t border-white/20" />
        <span className="absolute bottom-0 left-0 h-10 w-10 border-b border-l border-white/20" />
        <span className="absolute bottom-0 right-0 h-10 w-10 border-b border-r border-white/20" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Offset, not a clean split: the copy takes 55% and the object column
            reaches back across the gutter into it, so the two tracks overlap
            and the object is free to run off the right-hand side. */}
        <div className="grid items-center gap-y-16 lg:grid-cols-[minmax(0,62%)_minmax(0,38%)]">
          <div className="relative z-10 lg:pr-8">
            <motion.p
              {...fade(0)}
              className="font-mono text-xs uppercase tracking-[0.2em] text-white/50"
            >
              {content.hero.eyebrow}
            </motion.p>
            <motion.h1
              {...fade(0.1)}
              className="mt-5 font-heading text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.04em] text-white sm:text-[3.5rem] lg:text-[4rem]"
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

          {/* The object, allowed to break the frame.
              Right-aligned in its track rather than centred in it, because the
              scene is a good deal wider than the panel: measured off the live
              render, the loose NFC card's far corner sits 84px past this
              wrapper's own right edge at rest — and 119px past it at the far
              end of the yaw, because the stand keeps turning for the whole of
              the hero's scroll span. Every number below is derived from the
              119, not the 84: the resting pose is NOT the worst case, and
              treating it as one is what let the card get guillotined by this
              section's overflow-hidden across most laptop widths.

              The margin is derived FROM the gutter — half of (100vw − 72rem),
              less that overhang and a ~12px breathing gap — and is clamped at
              BOTH ends. max() clamped only the negative end, and the inner
              value crosses zero just above the xl breakpoint, where it then
              evaluated POSITIVE and nudged the object inward: the exact
              opposite of the intent. clamp() closes that off — −9rem so an
              ultra-wide display doesn't strand the object out in the margin,
              0px so the derived value can never become a positive inward push.

              Below xl the gutter has run out (at 1024 the container IS the
              viewport, with 24px of padding and nothing beyond it), so that
              band gets the same expression with a deliberately POSITIVE
              ceiling: +52px, the measured distance the object has to come in
              for the card's corner to clear the screen edge there. It still
              crosses the container's own content edge by ~12px, so the bleed
              survives — token, as it must be when there is no gutter to bleed
              into.

              1380 is where the object stops needing help and goes back to
              full size, so it gets a third constant. The un-scaled object
              wants a margin of (682.7 − viewport/2)px; that stops being
              POSITIVE — i.e. the gutter finally covers the overhang on its
              own — at viewport 1365, which is 1380 once the scrollbar is
              counted. Above it, 690px − 50vw lands the corner 12px inside the
              screen at full size; below it, no margin the 0px ceiling permits
              can do the job and the scale on the box takes over. The two
              bands are continuous where they meet: at 1379 the corner sits
              12.3px inside, at 1380 11.8px.

              These three are `min-[…]` and not `lg:`/`xl:` on purpose.
              Tailwind 4 emits every arbitrary min-width variant AHEAD of the
              named breakpoints, so an `xl:` rule beats a `min-[1380px]:` one
              at 1920 — the ladder silently collapses to its middle rung.
              Keeping the whole ladder in one variant family keeps it sorted
              by width, which is the only thing making the cascade correct
              here. */}
          <motion.div
            {...fade(0.15)}
            className="relative flex justify-center lg:justify-end lg:pt-6 min-[1024px]:mr-[clamp(0px,634px_-_50vw,52px)] min-[1280px]:mr-[clamp(-9rem,634px_-_50vw,0px)] min-[1380px]:mr-[clamp(-9rem,690px_-_50vw,0px)]"
          >
            {/* Fixed to the review panel's own width from lg up, so opening
                the panel cannot re-centre the stand underneath it. Full width
                below that: the scene is wider than the panel (the loose card
                on the table runs to ~148% of --stand-w), and at 390px a
                352px box is wider than the column, which pushed that card's
                far corner a few pixels off the screen.

                The scales are the only lever that shortens the overhang
                itself, and a uniform scale is the one lever that cannot
                disturb the counter stand's locked geometry: --stand-w and
                every proportion derived from it are untouched, the whole
                projected scene is simply resolved smaller. Margin alone
                could not do this job — at 1024 the object would have had to
                come in ~107px, which walks the panel underneath the headline.

                1024–1379 0.88, origin left: the left edge is where the object
                meets the copy, so anchoring there keeps the panel off the
                headline (35px of clearance at 1024) while pulling the far
                corner in by 56px — the amount that band is short. From 1380
                the gutter is wide enough on its own and the object goes back
                to full size; it is never scaled at a width that does not need
                it.

                base 0.8, origin centre (the default): below 480px the scene
                is 211px wide to the right of its own centre while the
                viewport gives it only half its width, so the card ran off the
                edge as the yaw scrubbed. That 211 is what sets the number,
                and it is unforgiving: the corner clears a 375px screen at
                0.888 with ZERO breathing room, and 0.95 — which looks like a
                gentler instrument — still leaves it 13px off the screen. For
                the ~12px gap the rest of this file is built to, the ceiling
                is 0.832 at 375px and 0.796 at 360px, the narrowest mainstream
                phone. 0.8 is that number, not a round one picked by eye.

                Scaling about the centre is also the cheaper instrument, which
                is not obvious: shifting the object left instead costs 2px of
                review-panel width per 1px of clearance (the padding comes
                straight off the panel) against 1.55px for the scale, and it
                decentres the panel as well. Nothing here can move the stand
                without moving the panel — tap-demo.tsx centres them in the
                same column — so a centred, slightly smaller demo is the best
                available trade. Cost: the panel's 14px body copy resolves at
                11.2px on a phone.

                shrink-0 is load-bearing, not decoration: this is a flex item,
                and once the margin above turns positive the track it sits in
                is narrower than 22rem, so without it the box quietly shrinks
                to the track and takes the stand's centring and the review
                panel's width down with it. */}
            <div className="w-full shrink-0 scale-[0.8] min-[480px]:scale-100 lg:w-[22rem] min-[1024px]:origin-left min-[1024px]:scale-[0.88] min-[1380px]:scale-100">
              <TapDemo scrollProgress={scrollYProgress} />
            </div>
          </motion.div>
        </div>

        {/* quick-link strip — pinned to the hero's base, where the measured
            dead zone was. */}
        <motion.div
          {...fade(0.45)}
          className="relative z-10 mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3"
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
