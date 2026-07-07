import { Reveal } from "@/components/site/reveal";
import { Stars } from "@/components/site/stars";
import { content } from "@/lib/content";

export function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by local businesses
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Owners like you, turning great service into great ratings.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={(i % 3) * 0.1}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Stars size={16} />
              <p className="mt-4 flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gblue/10 font-semibold text-gblue">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.business}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
