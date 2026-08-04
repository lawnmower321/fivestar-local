import { IntakeForm } from "@/components/site/intake-form";
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
        {/* intake.body, not finalCta.body: the latter says "Email us your
            business name", which stopped being true the moment this section
            became a form. Both strings are plan-authored copy in content.ts —
            this renders the one that matches what the section now does. */}
        <p className="mt-4 text-[1.0625rem] leading-[1.7] text-white/80">{content.intake.body}</p>
        {/* The submit button is Honey: on a Cobalt ground a Cobalt button would
            vanish. This is the "one CTA" the brand kit allots to Honey. */}
        <div className="mt-10">
          <IntakeForm />
        </div>
        {/* The direct email stays as a fallback: if the DB write path breaks, a
            prospect still has a way to reach us. */}
        {/* /80, not /60: Cobalt is a light enough ground that white/60 measures
            3.53:1 and fails WCAG AA at this size. This is the fallback contact
            path — it has to be readable. */}
        <p className="mt-6 font-mono text-xs tracking-wide text-white/80">
          Or email us directly — {content.site.email}
        </p>
      </Reveal>
    </Section>
  );
}
