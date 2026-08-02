"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

type SearchResult = (typeof content.reviewShowcase.search.results)[number];

function StarRow({ rating, size = 11, muted = false }: { rating: string; size?: number; muted?: boolean }) {
  const full = Math.round(parseFloat(rating));
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full
              ? muted
                ? "fill-slate-300 text-slate-300"
                : "fill-gyellow text-gyellow"
              : "text-slate-200"
          }
        />
      ))}
    </span>
  );
}

/** Mac-style browser window showing the local search your business wins */
function BrowserMock({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  const { query, results } = content.reviewShowcase.search;
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
        <div className="mt-3 space-y-2">
          {results.map((r, i) => {
            const isActive = i === active;
            return (
              <button
                key={r.name}
                type="button"
                onClick={() => onSelect(i)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "w-full cursor-pointer rounded-xl border border-gblue/30 bg-gblue/5 px-4 py-3 text-left transition-colors"
                    : "w-full cursor-pointer rounded-xl border border-slate-100 px-4 py-3 text-left opacity-70 transition-colors hover:border-slate-200 hover:opacity-100"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                    {r.name}
                  </p>
                  {r.top && (
                    <span className="rounded-full bg-gblue px-2 py-0.5 text-[10px] font-semibold text-white">
                      Top result
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className={`font-semibold ${isActive ? "text-slate-700" : ""}`}>{r.rating}</span>
                  <StarRow rating={r.rating} muted={!isActive} />
                  <span>({r.reviews})</span>
                  <span aria-hidden>·</span>
                  <span>{r.meta}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** iPhone-style frame with the selected result's review, mid-post */
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
            <StarRow rating="5" size={16} />
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
  const [active, setActive] = useState(0);
  const results = content.reviewShowcase.search.results;

  return (
    <Section ground="ink" size="lg" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[5fr_6fr]">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            {content.reviewShowcase.eyebrow}
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.reviewShowcase.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{content.reviewShowcase.body}</p>
          <ul className="mt-7 space-y-3">
            {content.reviewShowcase.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ggreen/10">
                  <Check size={13} className="text-ggreen" strokeWidth={3} />
                </span>
                <span className="text-slate-700">{point}</span>
              </li>
            ))}
          </ul>
          <Button
            render={<a href="#pricing" />}
            nativeButton={false}
            size="lg"
            className="mt-9 bg-gblue text-white hover:bg-gblue/90"
          >
            {content.reviewShowcase.cta}
          </Button>
        </Reveal>

        <Reveal delay={0.15} className="relative pb-14 pr-6 sm:pr-10">
          <BrowserMock active={active} onSelect={setActive} />
          <div className="absolute -bottom-2 right-0 rotate-3">
            <PhoneMock business={results[active]} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
