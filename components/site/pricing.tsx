import { Check, Nfc, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function Pricing() {
  return (
    <Section id="pricing" ground="mist" size="md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            {content.pricing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-body">{content.pricing.body}</p>
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
                    // Ink, not the retired fictional card's slate gradient —
                    // this is FiveStar's own chrome and belongs to the brand's
                    // dark ground (Task 10 trademark/chrome grep).
                    ? "relative flex flex-col rounded-3xl bg-gradient-to-br from-ink to-[#1a2c5c] p-8 shadow-2xl shadow-ink/30"
                    : "relative flex flex-col rounded-3xl border border-hairline bg-white p-8 shadow-sm"
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-heading text-lg font-bold ${dark ? "text-white" : "text-ink"}`}>
                      {tier.name}
                    </p>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={13} className="fill-star text-star" />
                      ))}
                    </div>
                  </div>
                  <Nfc size={26} className={dark ? "text-brand" : "text-slate-300"} />
                </div>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className={`font-heading text-5xl font-bold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
                    {tier.price}
                  </span>
                  <span className={`font-mono text-sm ${dark ? "text-white/70" : "text-body/70"}`}>
                    {tier.cadence}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${dark ? "text-slate-300" : "text-body"}`}>{tier.blurb}</p>

                <ul className="mt-7 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? "bg-star/20" : "bg-brand/10"}`}>
                        <Check size={13} className={dark ? "text-star" : "text-brand"} strokeWidth={3} />
                      </span>
                      <span className={`text-sm ${dark ? "text-slate-300" : "text-body"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  render={<a href={href} />}
                  nativeButton={false}
                  size="lg"
                  className={
                    dark
                      ? "mt-8 w-full bg-brand text-white hover:bg-brand/90"
                      : "mt-8 w-full border border-slate-300 bg-white text-ink hover:bg-mist"
                  }
                >
                  {tier.cta}
                </Button>
              </Reveal>
            );
          })}
        </div>

        <div className="mx-auto mt-12 flex max-w-xl items-center gap-4 rounded-2xl border border-star/30 bg-star/10 px-6 py-5">
          <ShieldCheck size={28} className="shrink-0 text-star" />
          <div>
            <p className="font-heading font-bold text-ink">{content.pricing.guarantee.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-body">{content.pricing.guarantee.body}</p>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-body/70">
          {content.pricing.finePrint}
        </p>
      </div>
    </Section>
  );
}
