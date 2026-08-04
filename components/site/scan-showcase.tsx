"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { CheckCircle2, MapPin, Nfc, PenLine, Star } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

const STEP_MS = 3400;
const SLIDE_S = 0.7;
const SPACING = 112; // % of card width between slots

/** Which business the scroll runway has reached. `Math.min` clamps the last
 *  bucket so p === 1 does not index past the array. */
const bucketAt = (p: number, count: number) => Math.min(count - 1, Math.floor(p * count));

/** Mini FiveStar NFC card that slides along the rail */
function MiniCard({ name }: { name: string }) {
  return (
    <div className="flex aspect-[1.586] w-40 flex-col justify-between rounded-xl bg-gradient-to-br from-white to-[#eef1f5] p-3.5 shadow-xl shadow-slate-900/15 ring-1 ring-hairline sm:w-52 sm:p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-ink sm:text-sm">{name}</p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={9} className="fill-star text-star" />
            ))}
          </div>
        </div>
        <Nfc className="text-brand" size={16} />
      </div>
      <p className="text-[9px] text-body sm:text-[11px]">Tap to review us on Google</p>
    </div>
  );
}

export function ScanShowcase() {
  const reduce = useReducedMotion();
  const items = content.scanItems;

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
  // sticky pin on a small screen traps the scroll (spec §Moment 2). This drives
  // BEHAVIOUR only — it never reaches rendered markup, because both `reduce`
  // and `isNarrow` are false on the server and can be true on the client's
  // first render. The layout branches in CSS instead (see the runway below).
  const useTimer = reduce || isNarrow;

  // Scroll path: the sticky scene spans items.length screens of scroll, so one
  // business locks in per screen.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // ONE owned value that BOTH paths write to, always starting at 0 — the value
  // the server renders and the value the client's first render agrees on, in
  // every motion mode. Keeping the timer and the scrub on the same value is
  // what makes handing control between them safe: there is no second counter to
  // drift. `active` mirrors it into React state because the card slots are a
  // tree change, not just a style.
  const step = useMotionValue(0);
  // `prev` rides along with `active` because the rail has to know which way it
  // just travelled — see the wrap handling in the card map. Keeping the pair in
  // one state object means they can never disagree.
  const [{ active, prev }, setActive] = useState({ active: 0, prev: 0 });

  // The guard keeps a continuously-firing motion value from re-rendering on
  // every frame — `step` only changes six times across the whole runway.
  useMotionValueEvent(step, "change", (v) => {
    setActive((s) => (s.active === v ? s : { active: v, prev: s.active }));
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!useTimer) step.set(bucketAt(p, items.length));
  });

  // Handles the fallback flag in BOTH directions. Switching TO the timer is
  // self-evident; switching away from it is the one that bites — crossing 768px
  // upward (rotating a phone to landscape: 844 >= 768) hands control back to
  // the scrub with `step` stranded wherever the timer left it, and no "change"
  // event rescues it because scrollYProgress is clamped outside the section and
  // so stays silent. Reading .get() here is strictly post-mount, so it never
  // reaches SSR'd markup. This also seeds the right business on a deep reload
  // into the middle of the runway.
  useEffect(() => {
    if (useTimer) {
      const id = setInterval(() => step.set(step.get() + 1), STEP_MS);
      return () => clearInterval(id);
    }
    step.set(bucketAt(scrollYProgress.get(), items.length));
  }, [useTimer, step, scrollYProgress, items.length]);

  // `active` is the index of the business centred in the scanner. The +2 that
  // used to live in this lookup (`items[(active + 2) % length]`, because the
  // centre is slot 2) now lives in the slot expression below, so scroll bucket
  // 0 centres items[0] — "Bella's Bakery", the business the rest of the page
  // follows — instead of starting mid-list on items[2].
  const current = items[active % items.length];

  const infoRows = [
    {
      key: "rating",
      node: (
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
      ),
    },
    {
      key: "profile",
      node: (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
          <MapPin size={13} className="shrink-0 text-gblue" />
          Google Business Profile
        </div>
      ),
    },
    {
      key: "review",
      node: (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
          <PenLine size={13} className="shrink-0 text-gblue" />
          Leave a review
        </div>
      ),
    },
    {
      key: "posted",
      node: (
        <div className="flex items-center gap-2 rounded-lg border border-ggreen/30 bg-ggreen/5 px-3 py-2 text-xs font-medium text-ggreen">
          <CheckCircle2 size={13} className="shrink-0" />
          Review posted — 15 seconds
        </div>
      ),
    },
  ];

  return (
    <Section ground="mist" size="lg">
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

      {/* Scroll runway: one viewport per business on the desktop scrub path. On
          the timer path it collapses so the scene does not sit inside a
          six-screen empty column. The two paths are chosen in CSS, not JS — a
          className derived from `reduce`/`isNarrow` would be a hydration
          mismatch on the biggest element in the section.

          `md:motion-reduce:`, not a bare `motion-reduce:`: Tailwind 4 emits the
          whole `prefers-reduced-motion` block AHEAD of `@media (min-width:48rem)`
          in the stylesheet, so at equal specificity `md:` wins and a bare
          `motion-reduce:h-auto` loses on a reduced-motion desktop — the runway
          would stay 600vh with nothing scrubbing it. Verified in the generated
          CSS; do not "simplify" this back. */}
      <div ref={ref} className="relative mt-12 md:h-[600vh] md:motion-reduce:h-auto">
        <div className="md:sticky md:top-20 md:motion-reduce:static">
          {/* The clipping lives HERE, below the sticky element, not on the
              Section above it: an `overflow: hidden` ancestor establishes a
              scrollport that never scrolls, and a sticky descendant of it
              silently refuses to pin. Only ancestors matter, so clipping the
              scene box itself — which is where the sliding cards need it
              anyway — is free. */}
          <div className="relative h-[460px] overflow-hidden sm:h-[500px]">
            {/* the rail the cards travel on */}
            <div className="absolute inset-x-0 top-[104px] border-t border-hairline sm:top-[118px]" aria-hidden />

            {/* sliding cards */}
            {items.map((item, i) => {
              // +2 folds the centre-slot offset in here (see `active` above),
              // so slot 2 — pos 0, the scanner — holds items[active].
              const slot = (((i - active + 2) % items.length) + items.length) % items.length;
              const pos = slot - 2; // -2..3; 3 = hidden wrap slot on the far right
              const isWrapping = slot === items.length - 1;
              const dist = Math.abs(pos);

              // The rail is a ring, and the hidden slot sits at one end of it,
              // so a card can change position by more than one slot in a single
              // step — it wrapped round rather than slid along. The timer only
              // ever counted up, so that only happened on the way OUT (pos -2 →
              // the hidden slot, already instant via `isWrapping`). Scroll runs
              // both ways: stepping BACK sends the hidden card the whole width
              // of the scene to pos -2, and animating that drags a ghost card
              // straight through the scanner window at ~0.24 opacity. Measured
              // in the browser, not theorised. So x jumps instantly whenever the
              // move is a wrap, while opacity and scale still ease — the card
              // fades in at the edge instead of sweeping across.
              const prevSlot = (((i - prev + 2) % items.length) + items.length) % items.length;
              const teleports = Math.abs(pos - (prevSlot - 2)) > 1;
              return (
                <div
                  key={item.name}
                  className="absolute left-1/2 top-11 -translate-x-1/2"
                  style={{ zIndex: pos === 0 ? 5 : 0 }}
                >
                  <motion.div
                    animate={{
                      x: `${pos * SPACING}%`,
                      scale: pos === 0 ? 1.08 : dist === 1 ? 0.96 : 0.9,
                      opacity: isWrapping ? 0 : dist === 2 ? 0.4 : dist === 1 ? 0.8 : 1,
                    }}
                    transition={{
                      duration: reduce || isWrapping ? 0 : SLIDE_S,
                      ease: [0.32, 0.72, 0.24, 1],
                      ...(teleports ? { x: { duration: 0 } } : null),
                    }}
                  >
                    <MiniCard name={item.name} />
                  </motion.div>
                </div>
              );
            })}

            {/* edge fades — cards dissolve at the borders instead of getting cut off */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[6] w-24 bg-gradient-to-r from-mist to-transparent sm:w-56" aria-hidden />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[6] w-24 bg-gradient-to-l from-mist to-transparent sm:w-56" aria-hidden />

            {/* fixed phone scanner */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-60 -translate-x-1/2 sm:w-72">
              {/* top of phone */}
              <div className="rounded-t-[2rem] border border-b-0 border-hairline bg-white px-5 pb-2 pt-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)]">
                <div className="flex items-center justify-between text-[10px] font-medium text-body">
                  <span>9:41</span>
                  <span className="h-1.5 w-16 rounded-full bg-hairline" />
                  <span>100%</span>
                </div>
              </div>
              {/* transparent scan window — cards pass behind this */}
              <div className="relative h-40 overflow-hidden border-x border-hairline/60 sm:h-44">
                {/* corner brackets flash when a new card locks in — sized to the active card, not the whole window */}
                <motion.div
                  key={`brackets-${active}`}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : SLIDE_S * 0.7 }}
                  className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 sm:h-36 sm:w-56"
                >
                  {["-left-1 -top-1 border-l-2 border-t-2 rounded-tl-lg", "-right-1 -top-1 border-r-2 border-t-2 rounded-tr-lg", "-left-1 -bottom-1 border-b-2 border-l-2 rounded-bl-lg", "-right-1 -bottom-1 border-b-2 border-r-2 rounded-br-lg"].map((c) => (
                    <span key={c} className={`absolute h-6 w-6 border-brand ${c}`} />
                  ))}
                </motion.div>
                {/* scan beam sweeps once per card — rendered unconditionally so
                    the server and a reduced-motion client agree on the element
                    count; under reduced motion the run collapses to zero
                    duration, and the final opacity keyframe is already 0, so it
                    lands invisible rather than leaving a line on screen. */}
                <motion.div
                  key={`beam-${active}`}
                  initial={{ y: 13, opacity: 0 }}
                  animate={{ y: [13, 141], opacity: [0, 0.9, 0] }}
                  transition={{
                    duration: reduce ? 0 : 0.8,
                    delay: reduce ? 0 : SLIDE_S * 0.85,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
                  aria-hidden
                />
              </div>
              {/* bottom of phone: extracted review info */}
              <div className="min-h-[210px] rounded-b-[2rem] border border-t-0 border-hairline bg-white px-4 pb-5 pt-3 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.3)] sm:px-5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active % items.length}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -10 }}
                    transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
                  >
                    <p className="text-sm font-bold text-slate-900">{current.name}</p>
                    <p className="text-xs text-body">{current.type}</p>
                    <div className="mt-3 space-y-2">
                      {infoRows.map((row, i) => (
                        <motion.div
                          key={row.key}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduce ? 0 : 0.3,
                            delay: reduce ? 0 : 0.15 + i * 0.14,
                          }}
                        >
                          {row.node}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
