import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function FinalCta() {
  return (
    <Section ground="cobalt" size="md" className="overflow-hidden">
      {/* faint ripple rings — same motif as the hero, radiating from the CTA */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 text-white/10"
        viewBox="0 0 900 900"
        fill="none"
        aria-hidden
      >
        {[180, 270, 360, 440].map((r) => (
          <circle key={r} cx="450" cy="450" r={r} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-white sm:text-[2.75rem]">
          {content.finalCta.title}
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-[1.7] text-white/80">{content.finalCta.body}</p>
        {/* CTA is Honey here: on a Cobalt ground a Cobalt button would vanish.
            This is the "one CTA" the brand kit allots to Honey. */}
        <Button
          render={<a href={`mailto:${content.site.email}?subject=${encodeURIComponent("Set up my business")}`} />}
          nativeButton={false}
          size="lg"
          className="mt-8 bg-star font-semibold text-ink hover:bg-star/90"
        >
          {content.finalCta.cta}
        </Button>
        <p className="mt-4 font-mono text-xs tracking-wide text-white/60">{content.site.email}</p>
      </Reveal>
    </Section>
  );
}
