import { Card } from "./ui/card"

export function EvidenceSection() {
  return (
    <section id="evidence" className="py-16 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-medium mb-4">The evidence speaks</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          Real outcomes from learners who transformed goals into hireable skills
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 text-center bg-background/50 backdrop-blur-sm">
            <div className="text-3xl font-medium mb-2">89%</div>
            <div className="text-muted-foreground">Completion Rate</div>
            <div className="text-sm text-muted-foreground mt-1">vs 15% industry avg</div>
          </Card>
          <Card className="p-6 text-center bg-background/50 backdrop-blur-sm">
            <div className="text-3xl font-medium mb-2">3.2x</div>
            <div className="text-muted-foreground">Interview Success</div>
            <div className="text-sm text-muted-foreground mt-1">compared to bootcamps</div>
          </Card>
          <Card className="p-6 text-center bg-background/50 backdrop-blur-sm">
            <div className="text-3xl font-medium mb-2">47m</div>
            <div className="text-muted-foreground">Daily Engagement</div>
            <div className="text-sm text-muted-foreground mt-1">average session time</div>
          </Card>
        </div>

        <Card className="p-8 max-w-2xl mx-auto bg-background/50 backdrop-blur-sm">
          <blockquote className="text-lg leading-relaxed mb-4">
            "Six months from bartender to React developer. The daily practice and code reviews made all the difference. 
            I felt hireable for the first time in my career."
          </blockquote>
          <div className="text-muted-foreground">
            — Sarah Chen, now at Stripe
          </div>
        </Card>
      </div>
    </section>
  )
}