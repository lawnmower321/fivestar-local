"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type MotionValue } from "motion/react";
import { CheckCircle2, ChevronDown, Star } from "lucide-react";
import { CounterStand } from "@/components/site/counter-stand";
import { content } from "@/lib/content";

type Stage = "stars" | "typing" | "posted";

const STAR_MS = 260;
const TYPE_MS = 24;

/**
 * Concentric NFC field lines. The radii were set against the old landscape
 * card (320×202) and were NOT re-derived when Task 3 replaced it with the
 * counter stand, so describe what they now actually do: the object is a
 * portrait 260×~469 box (panel plus the marginBottom that reserves flow
 * space for the base plate and its shadow), which puts this field's centre
 * roughly 44px BELOW the panel's optical centre. The innermost ring (r=140)
 * therefore falls inside the silhouette and is hidden by the panel rather
 * than peeking out behind it; the two outer rings clear the object's waist
 * and read as the field. The outermost still shares its radius with the
 * pulsing arc, so the "broadcast" rides the edge of the field by
 * construction rather than by coincidence.
 */
function RippleField() {
  return (
    // Stroke colour is white/20, not a slate token: these are meant to read as
    // faint field lines, and Task 4 put the hero on the Ink ground, where
    // slate-300 stops being faint and turns the field into a bullseye louder
    // than the object it is supposed to be radiating from.
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 text-white/20"
      viewBox="0 0 500 500"
      fill="none"
      aria-hidden
    >
      {[140, 180, 215].map((r) => (
        <circle key={r} cx="250" cy="250" r={r} stroke="currentColor" strokeWidth="1.25" />
      ))}
      {/* one blue arc — the tap, mid-broadcast, riding the outermost ring */}
      <circle
        className="ring-pulse"
        cx="250"
        cy="250"
        r={215}
        stroke="#4285f4"
        strokeWidth="1.75"
        strokeDasharray="134 1218"
        strokeDashoffset="-153"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TapDemo({ scrollProgress }: { scrollProgress?: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("stars");
  const [stars, setStars] = useState(0);
  const [typed, setTyped] = useState(0);
  const fullText = content.demo.reviewText;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (reduce) {
      // skip the theater — show the finished review
      setStars(5);
      setTyped(fullText.length);
      setStage("posted");
    } else {
      setStars(0);
      setTyped(0);
      setStage("stars");
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open || stage !== "stars") return;
    if (stars >= 5) {
      const t = setTimeout(() => setStage("typing"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStars((s) => s + 1), STAR_MS);
    return () => clearTimeout(t);
  }, [open, stage, stars]);

  useEffect(() => {
    if (!open || stage !== "typing") return;
    if (typed >= fullText.length) {
      const t = setTimeout(() => setStage("posted"), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearTimeout(t);
  }, [open, stage, typed, fullText.length]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative isolate">
        {/* the field: absolutely positioned so it never claims layout space
            of its own — it can only ever decay into whitespace the card
            already has, never push later content down */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        >
          <RippleField />
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="tap-demo-panel"
          className="group relative z-10 block cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
        >
          <CounterStand scrollProgress={scrollProgress} />
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-star"
      >
        {content.hero.tapHint}
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="tap-demo-panel"
            initial={reduce ? false : { opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-5 w-[22rem] max-w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10"
          >
            {/* who's posting — mirrors Google's review dialog */}
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gblue/10 text-sm font-semibold text-gblue">
                {content.demo.author.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{content.demo.author}</p>
                <p className="text-xs text-slate-500">{content.demo.posting}</p>
              </div>
            </div>

            {/* stars fill one by one */}
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={reduce ? undefined : { scale: i < stars ? [1.4, 1] : 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Star
                    size={28}
                    className={i < stars ? "fill-gyellow text-gyellow" : "text-slate-300"}
                  />
                </motion.span>
              ))}
            </div>

            {/* the review, typing itself */}
            <div className="mt-4 min-h-[4.5rem] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              {fullText.slice(0, typed)}
              {stage === "typing" && (
                <span className="ml-px inline-block h-4 w-px animate-pulse bg-slate-500 align-middle" />
              )}
            </div>

            <div className="mt-4">
              {stage === "posted" ? (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-ggreen/30 bg-ggreen/5 px-3 py-2.5 text-sm font-medium text-ggreen"
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  {content.demo.posted} — 15 seconds
                </motion.div>
              ) : (
                <span className="inline-flex w-full items-center justify-center rounded-lg bg-gblue/40 px-3 py-2.5 text-sm font-medium text-white">
                  Post
                </span>
              )}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">{content.demo.note}</p>
            {content.site.reviewUrl && (
              <a
                href={content.site.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-gblue hover:underline"
              >
                {content.demo.realLink} →
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
