import { Navigation } from "./Navigation";
import { HeroSection } from "./HeroSection";
import { SixPrinciples } from "./SixPrinciples";
import { PricingSection } from "./PricingSection";
import { FinalCTA } from "./FinalCTA";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main>
        <HeroSection />
        <SixPrinciples />
        <PricingSection />
        <FinalCTA />
      </main>

      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-muted-foreground">
            © 2025 Wisely. All rights reserved.
          </div>
          <div className="flex space-x-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}