import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function TeamNote() {
  return (
    <Section ground="paper" size="sm">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-[2rem]">
          {content.team.title}
        </h2>
        <p className="mt-5 text-[1.0625rem] leading-[1.7] text-body">{content.team.body}</p>
      </Reveal>
    </Section>
  );
}
