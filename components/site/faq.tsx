import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { content } from "@/lib/content";

export function Faq() {
  return (
    <Section id="faq" ground="mist" size="md">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-[2rem] font-extrabold tracking-[-0.025em] text-ink sm:text-[2.75rem]">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="mt-12">
          <Accordion multiple={false} className="w-full">
            {content.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold text-ink">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-body">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
