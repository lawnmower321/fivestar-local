"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Check, CheckCircle2, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Odometer } from "@/components/site/odometer";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

type SearchResult = (typeof content.reviewShowcase.search.results)[number];

// `filled` is driven from outside now (the scrub owns it), not derived from the
// rating string. The explicit role="img" matters: a bare <span aria-label> has
// an implicit role="generic" and assistive tech drops the label.
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
          className={`transition-colors duration-300 motion-reduce:transition-none ${
            i < filled
              ? muted
                ? "fill-slate-300 text-slate-300"
                : "fill-gyellow text-gyellow"
              : "text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

/** Mac-style browser window showing the local search your business wins */
function BrowserMock({
  progress,
  rank,
  starFill,
  badgeIn,
}: {
  progress: MotionValue<number>;
  rank: number; // Bella's current slot, 2 → 0
  starFill: number; // 4 → 5
  badgeIn: boolean;
}) {
  const reduce = useReducedMotion();
  const { query, results } = content.reviewShowcase.search;
  const [tracked, ...rest] = results;

  // The roll finishes at 60% of the scrub, not at 100%. `starFill` upstream is
  // literally Math.round() of this same ramp (`3.9 + 1.0 * min(1, p / 0.6)`),
  // so feeding the Odometer raw progress desynchronises the two: at p = 0.38
  // the row read "4.3" next to five filled stars. Remapping here keeps the
  // number and the stars describing the same rating on every frame, and it
  // matches the choreography table's 0–60% band — which also leaves the badge
  // at 80% as the genuinely last beat instead of the digits still ticking
  // after the payoff has landed.
  const roll = useTransform(progress, [0, 0.6], [0, 1]);

  // Rebuild the display order each render so Motion's `layout` prop has a
  // real DOM order change to FLIP between. CSS `order` is not animatable.
  const ordered: SearchResult[] = [...rest];
  ordered.splice(rank, 0, tracked);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      {/* title bar */}
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

      {/* local results */}
      <div className="p-4 sm:p-5">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          <MapPin size={11} />
          Local results · &ldquo;{query}&rdquo;
        </p>
        {/* `gap`, not `space-y-*`: space-y applies margins by DOM position and
            fights a FLIP reorder. */}
        <div className="mt-3 flex flex-col gap-2">
          {ordered.map((r) => {
            // `top` is the content's own flag for the tracked row — a string
            // compare on the name would break silently on a duplicate name.
            const isTracked = r.top;
            // The payoff lands at 80%: until then Bella's is just another
            // mediocre result, so the highlight and the dark name are gated on
            // the same threshold as the badge.
            const crowned = isTracked && badgeIn;
            return (
              <motion.div
                key={r.name}
                layout
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 30 }
                }
                className={
                  crowned
                    ? "rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 transition-[background-color,border-color,opacity] duration-300 motion-reduce:transition-none"
                    : "rounded-xl border border-slate-100 px-4 py-3 opacity-70 transition-[background-color,border-color,opacity] duration-300 motion-reduce:transition-none"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold transition-colors duration-300 motion-reduce:transition-none ${
                      crowned ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {r.name}
                  </p>
                  {crowned && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 22 }
                      }
                      className="rounded-full bg-star px-2 py-0.5 text-[10px] font-semibold text-ink"
                    >
                      Top result
                    </motion.span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  {isTracked ? (
                    <>
                      <span
                        className={`font-semibold transition-colors duration-300 motion-reduce:transition-none ${
                          crowned ? "text-slate-700" : ""
                        }`}
                      >
                        <Odometer
                          from={tracked.fromRating}
                          to={Number(tracked.rating)}
                          progress={roll}
                          decimals={1}
                        />
                      </span>
                      {/* The row keeps its stars muted until the fifth one
                          lights — that beat (p ≈ 0.36) is the "now you are a
                          five-star business" moment, and it stages the colour
                          ahead of the climb instead of piling on to the badge. */}
                      <StarRow filled={starFill} muted={starFill < 5} />
                      <span>
                        (
                        <Odometer
                          from={tracked.fromReviews}
                          to={tracked.reviews}
                          progress={roll}
                        />
                        )
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{r.rating}</span>
                      <StarRow filled={Math.round(parseFloat(r.rating))} muted />
                      <span>({r.reviews})</span>
                    </>
                  )}
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

/** iPhone-style frame with the tracked business's review, mid-post */
function PhoneMock({ business }: { business: SearchResult }) {
  return (
    <div className="w-44 rounded-[1.8rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/25 sm:w-52">
      <div className="flex items-center justify-between px-1 text-[9px] font-medium text-slate-500">
        <span>9:41</span>
        <span className="h-1 w-10 rounded-full bg-slate-200" />
        <span>100%</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={business.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-2.5 rounded-xl bg-slate-50 p-3"
        >
          <p className="text-xs font-bold text-slate-900">{business.name}</p>
          <p className="text-[10px] text-slate-500">Rate &amp; review</p>
          <div className="mt-2">
            <StarRow filled={5} size={16} />
          </div>
          <div className="mt-2.5 space-y-1.5" aria-hidden>
            <div className="h-1.5 w-full rounded bg-slate-200" />
            <div className="h-1.5 w-4/5 rounded bg-slate-200" />
            <div className="h-1.5 w-3/5 rounded bg-slate-200" />
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-ggreen/30 bg-ggreen/5 px-2 py-1.5 text-[10px] font-medium text-ggreen">
            <CheckCircle2 size={11} className="shrink-0" />
            Review posted
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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

  // ONE owned value, always starting at 0 — the value the server renders and
  // the value the client's first render agrees on, in every motion mode. Both
  // modes reach their real value from an effect AFTER mount, which is a
  // post-mount transition rather than a hydration mismatch.
  const progress = useMotionValue(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!settled) progress.set(p);
  });

  // Discrete state — these must change the React tree, not just a style, so
  // they must also start at the unsettled values on both server and client.
  const [rank, setRank] = useState(2);
  const [starFill, setStarFill] = useState(4);
  const [badgeIn, setBadgeIn] = useState(false);

  useMotionValueEvent(progress, "change", (p) => {
    setRank(p < 0.4 ? 2 : p < 0.8 ? 1 : 0);
    setStarFill(Math.min(5, Math.round(3.9 + (4.9 - 3.9) * Math.min(1, p / 0.6))));
    setBadgeIn(p >= 0.8);
  });

  // Both directions, not just the settling one. `settled` false → true pushes
  // the end state; true → false must hand the scrub back to the real scroll
  // position, or crossing 768px upward (rotating a phone to landscape: 844 ≥
  // 768) strands `progress` at 1 and the moment plays backwards — and no
  // "change" event can rescue it, because scrollYProgress is clamped at 0 above
  // the section and so never fires. Reading .get() here is strictly post-mount,
  // so it stays out of SSR'd markup. This also seeds the value on a deep
  // reload, which removes the one-frame 3.9/18 flash.
  useEffect(() => {
    progress.set(settled ? 1 : scrollYProgress.get());
  }, [settled, progress, scrollYProgress]);

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
