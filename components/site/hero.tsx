"use client";

import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";
import { TapDemo } from "@/components/site/tap-demo";
import { motion, useReducedMotion } from "motion/react";

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <section className="relative overflow-hidden bg-white pb-24 pt-32 sm:pt-40">
      <div className="relative mx-auto grid max-w-6xl items-start gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <div className="lg:pt-6">
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
        <motion.div {...fade(0.15)} className="lg:pt-2">
          <TapDemo />
        </motion.div>
      </div>
    </section>
  );
}
