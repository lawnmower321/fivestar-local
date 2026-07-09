import { Check } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function WhatYouGet() {
  return (
    <section id="what-you-get" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[5fr_6fr]">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.whatYouGet.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{content.whatYouGet.body}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {content.whatYouGet.items.map((item) => (
              <li key={item} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ggreen/10">
                  <Check size={13} className="text-ggreen" strokeWidth={3} />
                </span>
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
