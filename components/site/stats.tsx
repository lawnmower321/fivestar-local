"use client";

import { CountUp } from "@/components/site/count-up";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

export function Stats() {
  return (
    <section className="bg-gblue py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 text-center sm:grid-cols-3 sm:px-6">
        {content.stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <p className="text-4xl font-extrabold text-white sm:text-5xl">
              {s.isRating ? (
                <>
                  <CountUp to={s.value} format={(n) => (n / 10).toFixed(1)} />
                  <span className="text-gyellow"> ★</span>
                </>
              ) : (
                <CountUp to={s.value} suffix={s.suffix} />
              )}
            </p>
            <p className="mt-2 text-blue-100">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
