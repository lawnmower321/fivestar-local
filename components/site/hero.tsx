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
            <Button
              render={<a href={`mailto:${content.site.email}`} />}
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
        <NfcCard />
      </div>
    </section>
  );
}
