import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { TickerTape } from "@/components/GlitchText";
import HowItWorks from "@/components/HowItWorks";
import GameExplainer from "@/components/GameExplainer";
import ProductShot from "@/components/ProductShot";
import ZoneDivider from "@/components/ZoneDivider";
import Settlement from "@/components/Settlement";
import Scoring from "@/components/Scoring";
import AntiManip from "@/components/AntiManip";
import WhyItSticks from "@/components/WhyItSticks";
import Roadmap from "@/components/Roadmap";
import FAQ from "@/components/FAQ";
import TokenSelection from "@/components/TokenSelection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />

      {/* === HYPE ZONE === */}
      <Hero />
      <TickerTape />
      <HowItWorks />
      <GameExplainer />
      <ProductShot />

      {/* === TRANSITION === */}
      <ZoneDivider />

      {/* === DEEP DIVE === */}
      <TokenSelection />
      <div className="divider-gradient max-w-content mx-auto" />
      <Settlement />
      <Scoring />
      <div className="divider-gradient max-w-content mx-auto" />
      <AntiManip />
      <div className="divider-gradient max-w-content mx-auto" />
      <WhyItSticks />
      <div className="divider-gradient max-w-content mx-auto" />
      <Roadmap />
      <div className="divider-gradient max-w-content mx-auto" />
      <FAQ />
      <Footer />
    </main>
  );
}
