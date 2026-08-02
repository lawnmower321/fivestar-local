import { Check } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function WhatYouGet() {
  return (
    <Section id="what-you-get" ground="paper" size="md">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[5fr_6fr]">
        <Reveal>
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            {content.whatYouGet.title}
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.7] text-body">{content.whatYouGet.body}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-white">
            {content.whatYouGet.items.map((item) => (
              <li key={item} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <Check size={13} className="text-brand" strokeWidth={3} />
                </span>
                <span className="text-body">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
