"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, ChevronDown, Star } from "lucide-react";
import { NfcCard } from "@/components/site/nfc-card";
import { content } from "@/lib/content";

type Stage = "stars" | "typing" | "posted";

const STAR_MS = 260;
const TYPE_MS = 24;

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

export function TapDemo() {
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
      <div className="relative">
        <RippleField />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="tap-demo-panel"
          className="group relative block cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gblue focus-visible:ring-offset-4"
        >
          <NfcCard />
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-gblue"
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
