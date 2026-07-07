import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { Benefits } from "@/components/site/benefits";
import { ScanShowcase } from "@/components/site/scan-showcase";
import { Testimonials } from "@/components/site/testimonials";
import { Stats } from "@/components/site/stats";
import { Faq } from "@/components/site/faq";
import { FinalCta } from "@/components/site/final-cta";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <ScanShowcase />
        <Testimonials />
        <Stats />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
