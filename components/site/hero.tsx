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
              scene is a good deal wider than the panel: the loose NFC card
              lies on the table roughly 255px right of the panel's centre and
              the ripple field reaches 230px. Right-alignment alone therefore
              already walks the table past the container's edge; the negative
              margin then carries the whole scene out into the page gutter.
              That margin is derived FROM the gutter — half of (100vw − 72rem),
              less the 79px the scene already overhangs and a 24px breathing
              gap — so the loose card's far corner lands just inside the
              viewport at every width instead of being guillotined by this
              section's overflow-hidden. Clamped at −9rem so an ultra-wide
              display doesn't strand the object out in the margin. */}
          <motion.div
            {...fade(0.15)}
            className="relative flex justify-center lg:justify-end lg:pt-6 xl:mr-[max(-9rem,calc(655px_-_50vw))]"
          >
            {/* Fixed to the review panel's own width from lg up, so opening
                the panel cannot re-centre the stand underneath it. Full width
                below that: the scene is wider than the panel (the loose card
                on the table runs to ~148% of --stand-w), and at 390px a
                352px box is wider than the column, which pushed that card's
                far corner a few pixels off the screen. */}
            <div className="w-full lg:w-[22rem]">
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
