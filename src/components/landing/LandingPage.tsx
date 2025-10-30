import { Navigation } from "./Navigation";
import { HeroSection } from "./HeroSection";
import { SixPrinciples } from "./SixPrinciples";
import { PricingSection } from "./PricingSection";
import { FinalCTA } from "./FinalCTA";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/20 text-foreground dark:from-background dark:via-primary/20 dark:to-secondary/10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_60%)]" />
      <Navigation />

      <main>
        <HeroSection />
        <SixPrinciples />
        <PricingSection />
        <FinalCTA />
      </main>

      <footer className="relative mt-20 border-t border-border/40 bg-background/70 py-8 px-6 backdrop-blur">
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