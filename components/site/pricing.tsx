import { Check, Nfc, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {content.pricing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{content.pricing.body}</p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
          {content.pricing.tiers.map((tier, i) => {
            const dark = tier.featured;
            const href =
              tier.href ??
              `mailto:${content.site.email}?subject=${encodeURIComponent(
                `${tier.name} plan — set me up`
              )}`;
            return (
              <Reveal
                key={tier.name}
                delay={i * 0.12}
                className={
                  // each tier is styled like the card itself — the thing you're buying
                  dark
                    ? "relative flex flex-col rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl shadow-slate-900/30"
                    : "relative flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-heading text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                      {tier.name}
                    </p>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={13} className="fill-gyellow text-gyellow" />
                      ))}
                    </div>
                  </div>
                  <Nfc size={26} className={dark ? "text-gblue" : "text-slate-300"} />
                </div>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className={`font-heading text-5xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
                    {tier.price}
                  </span>
                  <span className={`font-mono text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {tier.cadence}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tier.blurb}</p>

                <ul className="mt-7 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? "bg-ggreen/20" : "bg-ggreen/10"}`}>
                        <Check size={13} className="text-ggreen" strokeWidth={3} />
                      </span>
                      <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  render={<a href={href} />}
                  nativeButton={false}
                  size="lg"
                  className={
                    dark
                      ? "mt-8 w-full bg-gblue text-white hover:bg-gblue/90"
                      : "mt-8 w-full border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  }
                >
                  {tier.cta}
                </Button>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          {content.pricing.finePrint}
        </p>
      </div>
    </section>
  );
}
