import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="glow-blob animate-blob left-[10%] top-[-30%] h-64 w-64 bg-gblue" />
      <div className="glow-blob animate-blob bottom-[-30%] right-[10%] h-64 w-64 bg-ggreen" style={{ animationDelay: "-6s" }} />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.finalCta.title}
        </h2>
        <p className="mt-4 text-lg text-slate-300">{content.finalCta.body}</p>
        <Button
          render={<a href={`mailto:${content.site.email}`} />}
          size="lg"
          className="mt-8 bg-gblue text-white hover:bg-gblue/90"
        >
          {content.finalCta.cta}
        </Button>
      </Reveal>
    </section>
  );
}
