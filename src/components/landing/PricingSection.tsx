import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section
      id="pricing"
      className="py-16 px-6 max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-medium mb-4">
          Choose your path
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build fundamentals, turn them into evidence, ship
          faster. Pick the tier that matches your timeline.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="p-6 bg-background/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Learn</h3>
              <p className="text-muted-foreground">
                Build fundamentals
              </p>
            </div>
            <div className="text-3xl font-medium">
              $20
              <span className="text-base text-muted-foreground">
                /month
              </span>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>CLO & Socratic agents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Daily micro-tasks</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background/50 backdrop-blur-sm border-2 border-primary relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
            Most Popular
          </Badge>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Build</h3>
              <p className="text-muted-foreground">
                Turn into evidence
              </p>
            </div>
            <div className="text-3xl font-medium">
              $40
              <span className="text-base text-muted-foreground">
                /month
              </span>
            </div>
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Everything in Learn</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>TA & Instructor agents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Alex code reviews</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Portfolio projects</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Launch</h3>
              <p className="text-muted-foreground">
                Ship faster
              </p>
            </div>
            <div className="text-3xl font-medium">
              $100
              <span className="text-base text-muted-foreground">
                /month
              </span>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Everything in Build</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Career guidance</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Priority support</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
} 