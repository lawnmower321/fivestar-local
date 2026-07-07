"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, MapPin, Nfc, PenLine, Star } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const STEP_MS = 3400;
const SLIDE_S = 0.7;
const SPACING = 112; // % of card width between slots

/** Mini FiveStar NFC card that slides along the wire */
function MiniCard({ name }: { name: string }) {
  return (
    <div className="flex aspect-[1.586] w-40 flex-col justify-between rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3.5 shadow-xl shadow-slate-900/25 sm:w-52 sm:p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-white sm:text-sm">{name}</p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={9} className="fill-gyellow text-gyellow" />
            ))}
          </div>
        </div>
        <Nfc className="text-gblue" size={16} />
      </div>
      <p className="text-[9px] text-slate-400 sm:text-[11px]">Tap to review us on Google</p>
    </div>
  );
}

export function ScanShowcase() {
  const reduce = useReducedMotion();
  const items = content.scanItems;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => a + 1), STEP_MS);
    return () => clearInterval(id);
  }, [reduce]);

  // the card at center slot (pos 0) is the one with slot === 2, i.e. index (active + 2)
  const current = items[(active + 2) % items.length];

  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.showcase.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{content.showcase.body}</p>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="relative mt-12 h-[460px] sm:h-[500px]">
          {/* the wire — arc passes through the scan window */}
          <svg
            className="absolute inset-x-0 top-[58px] h-24 w-full text-slate-300 sm:top-[68px]"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0,30 Q720,90 1440,30" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* sliding cards */}
          {items.map((item, i) => {
            const slot = (((i - active) % items.length) + items.length) % items.length;
            const pos = slot - 2; // -2..3; 3 = hidden wrap slot on the far right
            const isWrapping = slot === items.length - 1;
            return (
              <div
                key={item.name}
                className="absolute left-1/2 top-11 -translate-x-1/2"
                style={{ zIndex: pos === 0 ? 5 : 0 }}
              >
                <motion.div
                  animate={{
                    x: `${pos * SPACING}%`,
                    y: (2 - Math.abs(pos)) * 10,
                    rotate: pos * -1.5,
                    scale: pos === 0 ? 1.06 : 1,
                    opacity: isWrapping ? 0 : Math.abs(pos) === 2 ? 0.55 : 1,
                  }}
                  transition={{
                    duration: reduce || isWrapping ? 0 : SLIDE_S,
                    ease: "easeInOut",
                  }}
                >
                  <MiniCard name={item.name} />
                </motion.div>
              </div>
            );
          })}

          {/* fixed phone scanner */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-60 -translate-x-1/2 sm:w-72">
            {/* top of phone */}
            <div className="rounded-t-[2rem] border border-b-0 border-slate-200 bg-white px-5 pb-2 pt-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)]">
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                <span>9:41</span>
                <span className="h-1.5 w-16 rounded-full bg-slate-200" />
                <span>100%</span>
              </div>
            </div>
            {/* transparent scan window — cards pass behind this */}
            <div className="relative h-40 border-x border-slate-200/60 sm:h-44">
              {["left-3 top-2 border-l-2 border-t-2 rounded-tl-lg", "right-3 top-2 border-r-2 border-t-2 rounded-tr-lg", "left-3 bottom-2 border-b-2 border-l-2 rounded-bl-lg", "right-3 bottom-2 border-b-2 border-r-2 rounded-br-lg"].map((c) => (
                <span key={c} className={`absolute h-6 w-6 border-gblue ${c}`} />
              ))}
            </div>
            {/* bottom of phone: extracted review info */}
            <div className="min-h-[210px] rounded-b-[2rem] border border-t-0 border-slate-200 bg-white px-4 pb-5 pt-3 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.3)] sm:px-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active % items.length}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <p className="text-sm font-bold text-slate-900">{current.name}</p>
                  <p className="text-xs text-slate-500">{current.type}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className="fill-gyellow text-gyellow" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {current.rating} · {current.reviews} reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                      <MapPin size={13} className="shrink-0 text-gblue" />
                      Google Business Profile
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                      <PenLine size={13} className="shrink-0 text-gblue" />
                      Leave a review
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-ggreen/30 bg-ggreen/5 px-3 py-2 text-xs font-medium text-ggreen">
                      <CheckCircle2 size={13} className="shrink-0" />
                      Review posted — 15 seconds
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
