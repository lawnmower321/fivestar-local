import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { Benefits } from "@/components/site/benefits";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
      </main>
      <Footer />
    </div>
  );
}
