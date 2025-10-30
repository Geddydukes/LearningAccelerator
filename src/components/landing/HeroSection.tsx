import { Button } from "../ui/Button";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden px-6 pb-24 pt-32 text-center">
      <div className="pointer-events-none absolute -left-32 top-10 h-64 w-64 rounded-full bg-secondary/40 blur-3xl dark:bg-secondary/30" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary/40 blur-3xl dark:bg-primary/30" />
      <div className="relative z-10 space-y-8 rounded-[2.5rem] border border-white/20 bg-background/60 p-12 shadow-xl shadow-primary/10 backdrop-blur-xl dark:border-white/10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary shadow-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          AI-native learning accelerator
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Master ambitious skills
        </h1>
        <h2 className="text-2xl font-medium text-primary md:text-4xl">
          with agents that coach, challenge, and celebrate
        </h2>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl">
          Transform goals into hireable expertise with daily guidance, Socratic conversations, and feedback loops tuned to your
          learning style.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary via-secondary to-primary px-10 text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-primary/40"
            onClick={() => navigate('/auth')}
          >
            Start your plan
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 px-10 text-foreground transition hover:border-primary hover:text-primary"
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            See pricing
          </Button>
        </div>
      </div>

      <div className="relative z-10 mt-14 flex flex-col items-center space-y-2 text-sm font-medium text-muted-foreground">
        <span>Scroll to explore the Wisely method</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </div>
    </section>
  );
}