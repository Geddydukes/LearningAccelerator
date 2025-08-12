import { Button } from "../ui/Button";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-24 pb-16 px-6 max-w-4xl mx-auto text-center">
      <div className="space-y-8">
        <h1 className="text-4xl md:text-6xl font-medium leading-tight">
          Wisely
        </h1>
        <h2 className="text-2xl md:text-4xl font-medium">
          Excel at Everything
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform goals into hireable skills with AI agents
          that create mastery through deliberate practice
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            onClick={() => navigate('/auth')}
          >
            Start your plan
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8"
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

      <div className="mt-16 flex flex-col items-center space-y-2 text-muted-foreground">
        <span>Discover the six principles</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
} 