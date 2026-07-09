import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      {/* faint ripple rings — same motif as the hero, radiating from the CTA */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 text-white/5"
        viewBox="0 0 900 900"
        fill="none"
        aria-hidden
      >
        {[180, 270, 360, 440].map((r) => (
          <circle key={r} cx="450" cy="450" r={r} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.finalCta.title}
        </h2>
        <p className="mt-4 text-lg text-slate-300">{content.finalCta.body}</p>
        <Button
          render={<a href={`mailto:${content.site.email}?subject=${encodeURIComponent("Set up my business")}`} />}
          nativeButton={false}
          size="lg"
          className="mt-8 bg-gblue text-white hover:bg-gblue/90"
        >
          {content.finalCta.cta}
        </Button>
        <p className="mt-4 font-mono text-xs tracking-wide text-slate-500">{content.site.email}</p>
      </Reveal>
    </section>
  );
}
