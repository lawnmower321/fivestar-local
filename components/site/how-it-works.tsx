import { Nfc, MessageSquareText, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const icons = [Nfc, MessageSquareText, TrendingUp];
const iconColors = ["text-gblue bg-gblue/10", "text-ggreen bg-ggreen/10", "text-gred bg-gred/10"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Three steps between you and a five-star reputation.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {content.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={step.title} delay={i * 0.15} className="text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${iconColors[i]}`}>
                  <Icon size={28} />
                </div>
                <p className="mt-2 text-sm font-semibold text-gblue">Step {i + 1}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-slate-600">{step.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
