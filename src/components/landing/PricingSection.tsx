import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="pointer-events-none absolute inset-x-0 top-12 -z-10 h-96 rounded-full bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent blur-3xl" />
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Choose your path</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Build fundamentals, turn them into evidence, and ship faster. Select the track that matches your momentum and support needs.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/70 p-6 shadow-xl shadow-primary/10 backdrop-blur">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10" />
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Learn</h3>
              <p className="text-muted-foreground">Build fundamentals</p>
            </div>
            <div className="text-3xl font-semibold">
              $20
              <span className="text-base text-muted-foreground">/month</span>
            </div>
            <Button
              variant="outline"
              className="w-full border-primary/40 text-foreground hover:border-primary"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              {["CLO & Socratic agents", "Daily micro-tasks", "Progress tracking"].map(feature => (
                <div key={feature} className="flex items-center space-x-2 rounded-xl bg-primary/5 px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-3xl border-2 border-primary/60 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80 p-6 text-primary-foreground shadow-2xl shadow-primary/30">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-foreground/20 text-primary-foreground">
            Most Popular
          </Badge>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Build</h3>
              <p className="text-primary-foreground/80">Turn into evidence</p>
            </div>
            <div className="text-3xl font-semibold">
              $40
              <span className="text-base text-primary-foreground/70">/month</span>
            </div>
            <Button
              className="w-full bg-primary-foreground/90 text-primary shadow-lg shadow-black/20 hover:bg-primary-foreground"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              {["Everything in Learn", "TA & Instructor agents", "Alex code reviews", "Portfolio projects"].map(feature => (
                <div key={feature} className="flex items-center space-x-2 rounded-xl bg-primary-foreground/15 px-3 py-2 text-sm text-primary-foreground">
                  <Check className="h-4 w-4 text-primary-foreground" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/70 p-6 shadow-xl shadow-secondary/10 backdrop-blur">
          <div className="pointer-events-none absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-secondary/30" />
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Launch</h3>
              <p className="text-muted-foreground">Ship faster</p>
            </div>
            <div className="text-3xl font-semibold">
              $100
              <span className="text-base text-muted-foreground">/month</span>
            </div>
            <Button
              variant="outline"
              className="w-full border-secondary/50 text-foreground hover:border-secondary"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              {["Everything in Build", "Career guidance", "Priority support"].map(feature => (
                <div key={feature} className="flex items-center space-x-2 rounded-xl bg-secondary/10 px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-secondary-foreground" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
} 