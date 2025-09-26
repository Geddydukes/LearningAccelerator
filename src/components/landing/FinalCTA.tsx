import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { useUserStats, formatUserCount } from "../../hooks/useUserStats";

export function FinalCTA() {
  const navigate = useNavigate();
  const { totalUsers, loading: statsLoading } = useUserStats();

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-medium">
          Ready to excel at anything?
        </h2>
        <p className="text-muted-foreground">
          Join {statsLoading ? "thousands" : `${formatUserCount(totalUsers)}+`}{" "}
          building hireable skills with AI agents that actually understand how
          learning works
        </p>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-3"
          onClick={() => navigate("/auth")}
        >
          Build your future
        </Button>
        <div className="text-sm text-muted-foreground">Cancel anytime</div>
      </div>
    </section>
  );
}
