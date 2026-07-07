import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { NfcCard } from "@/components/site/nfc-card";
import { content } from "@/lib/content";

export function Showcase() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <NfcCard />
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.showcase.title}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{content.showcase.body}</p>
          <ul className="mt-8 space-y-4">
            {content.showcase.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-ggreen" size={22} />
                <span className="text-slate-700">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
