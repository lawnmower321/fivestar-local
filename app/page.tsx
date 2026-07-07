import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { Benefits } from "@/components/site/benefits";
import { Showcase } from "@/components/site/showcase";
import { Testimonials } from "@/components/site/testimonials";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Showcase />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
