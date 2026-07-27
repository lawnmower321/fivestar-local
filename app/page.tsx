import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { ScanShowcase } from "@/components/site/scan-showcase";
import { WhatYouGet } from "@/components/site/benefits";
import { ReviewShowcase } from "@/components/site/review-showcase";
import { Pricing } from "@/components/site/pricing";
import { TeamNote } from "@/components/site/team-note";
import { Faq } from "@/components/site/faq";
import { FinalCta } from "@/components/site/final-cta";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ScanShowcase />
        <WhatYouGet />
        <ReviewShowcase />
        <Pricing />
        <TeamNote />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
