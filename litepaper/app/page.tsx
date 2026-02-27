import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { TickerTape } from "@/components/GlitchText";
import HowItWorks from "@/components/HowItWorks";
import ProductShot from "@/components/ProductShot";
import ZoneDivider from "@/components/ZoneDivider";
import Settlement from "@/components/Settlement";
import Scoring from "@/components/Scoring";
import AntiManip from "@/components/AntiManip";
import WhyItSticks from "@/components/WhyItSticks";
import Roadmap from "@/components/Roadmap";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />

      {/* === HYPE ZONE === */}
      <Hero />
      <TickerTape />
      <HowItWorks />
      <ProductShot />

      {/* === TRANSITION === */}
      <ZoneDivider />

      {/* === DEEP DIVE === */}
      <Settlement />
      <Scoring />
      <div className="divider-gradient max-w-content mx-auto" />
      <AntiManip />
      <div className="divider-gradient max-w-content mx-auto" />
      <WhyItSticks />
      <div className="divider-gradient max-w-content mx-auto" />
      <Roadmap />
      <Footer />
    </main>
  );
}
