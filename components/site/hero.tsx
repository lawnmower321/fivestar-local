"use client";

import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";
import { NfcCard } from "@/components/site/nfc-card";
import { motion, useReducedMotion } from "motion/react";

/** Concentric NFC ripple field — the tap gesture, drawn as thin rings */
function RippleField() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 text-slate-200"
      viewBox="0 0 720 720"
      fill="none"
      aria-hidden
    >
      {[120, 190, 260, 330].map((r) => (
        <circle key={r} cx="360" cy="360" r={r} stroke="currentColor" strokeWidth="1" />
      ))}
      {/* one blue arc — the tap, mid-broadcast */}
      <circle
        className="ring-pulse"
        cx="360"
        cy="360"
        r={225}
        stroke="#4285f4"
        strokeWidth="1.5"
        strokeDasharray="140 1274"
        strokeDashoffset="-160"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <section className="relative overflow-hidden bg-white pb-24 pt-32 sm:pt-40">
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <motion.p
            {...fade(0)}
            className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500"
          >
            {content.hero.eyebrow}
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="mt-5 font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]"
          >
            {content.hero.headline}{" "}
            <span className="text-gblue">{content.hero.highlight}</span>
          </motion.h1>
          <motion.p {...fade(0.2)} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {content.hero.subhead}
          </motion.p>
          <motion.div {...fade(0.3)} className="mt-9 flex flex-wrap gap-4">
            <Button
              render={<a href="#pricing" />}
              nativeButton={false}
              size="lg"
              className="bg-gblue text-white hover:bg-gblue/90"
            >
              {content.hero.cta}
            </Button>
            <Button render={<a href="#how-it-works" />} nativeButton={false} size="lg" variant="outline">
              {content.hero.ctaSecondary}
            </Button>
          </motion.div>
        </div>
        <div className="relative">
          <RippleField />
          <NfcCard />
        </div>
      </div>
    </section>
  );
}
