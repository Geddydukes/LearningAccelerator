import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

export function Navigation() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-gradient-to-r from-background/90 via-primary/20 to-background/85 shadow-lg shadow-primary/10 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <div className="text-xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Wisely</span>
          </div>
          <div className="hidden items-center space-x-6 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </a>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-primary/40"
          onClick={() => navigate('/auth')}
        >
          Start your plan
        </Button>
      </div>
    </nav>
  );
} 