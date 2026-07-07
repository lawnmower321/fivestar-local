import { Rocket, MapPin, Smartphone, QrCode, Infinity, Timer } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { content } from "@/lib/content";

const icons = [Rocket, MapPin, Smartphone, QrCode, Infinity, Timer];

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-16 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why businesses love it
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.benefits.map((b, i) => {
            const Icon = icons[i];
            return (
              <Reveal
                key={b.title}
                delay={(i % 3) * 0.1}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gblue/10 text-gblue transition-colors group-hover:bg-gblue group-hover:text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-slate-600">{b.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
