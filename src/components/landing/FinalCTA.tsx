import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary/90 via-secondary/80 to-primary/90 py-20 px-6 text-primary-foreground">
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_left,_rgba(255,255,255,0.35),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_right,_rgba(255,255,255,0.25),_transparent_55%)]" />
      <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Ready to excel at anything?</h2>
        <p className="max-w-2xl text-base md:text-lg text-primary-foreground/80">
          Join thousands building hireable skills with agents that challenge, co-create, and keep your streak alive.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-primary-foreground text-primary font-semibold px-12 py-3 shadow-xl shadow-black/30 transition hover:bg-white"
            onClick={() => navigate('/auth')}
          >
            Build your future
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary-foreground/30 bg-transparent px-12 py-3 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate('/landing#pricing')}
          >
            Compare plans
          </Button>
        </div>
        <div className="text-sm uppercase tracking-wide text-primary-foreground/70">Cancel anytime</div>
      </div>
    </section>
  );
}