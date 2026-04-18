// Landing page: single-scroll product showcase for the Helical Bio Explorer demo.

import { LandingHero } from "@/components/landing/LandingHero";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechBadges } from "@/components/landing/TechBadges";
import { CtaFooter } from "@/components/landing/CtaFooter";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingHero />
      <FeatureShowcase />
      <HowItWorks />
      <TechBadges />
      <CtaFooter />
      <LandingFooter />
    </main>
  );
}
