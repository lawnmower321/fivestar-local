import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        {/* Sections added in Tasks 4–7: Hero, HowItWorks, Benefits, Showcase, Testimonials, Stats, Faq, FinalCta */}
      </main>
      <Footer />
    </div>
  );
}
