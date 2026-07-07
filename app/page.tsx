import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";

export default function Home() {
  return (
    <div className="bg-white text-slate-800">
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
