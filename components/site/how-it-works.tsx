import { Nfc, MessageSquareText, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const icons = [Nfc, MessageSquareText, TrendingUp];
const iconColors = ["text-brand bg-brand/10", "text-star bg-star/10", "text-ink bg-ink/10"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Three steps between you and a five-star reputation.
          </p>
        </Reveal>
        <div className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {/* connecting line through the step icons (desktop) */}
          <div className="absolute left-[16.6%] right-[16.6%] top-7 hidden border-t border-dashed border-slate-300 sm:block" aria-hidden />
          {content.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={step.title} delay={i * 0.15} className="relative text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-8 ring-slate-50 ${iconColors[i]}`}>
                  <Icon size={28} />
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-slate-600">{step.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
