import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function TeamNote() {
  return (
    <section className="bg-slate-50 py-20">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {content.team.title}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">{content.team.body}</p>
      </Reveal>
    </section>
  );
}
