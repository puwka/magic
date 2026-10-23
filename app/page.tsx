import { Hero } from "@/components/hero";
import { ProofStrip } from "@/components/proof-strip";
import { PersonalPreview } from "@/components/personal-preview";
import { Catalog } from "@/components/catalog";
import { ResultSection } from "@/components/result-section";
import { Steps } from "@/components/steps";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="shell">
        <ProofStrip />
        <PersonalPreview />
        <Catalog />
        <ResultSection />
        <Steps />
        <Faq />
        <FinalCta />
      </div>
    </>
  );
}
