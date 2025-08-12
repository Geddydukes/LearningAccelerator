import { Button } from "./ui/button"

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="text-xl font-medium">Wisely</div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Start your plan
        </Button>
      </div>
    </nav>
  )
}