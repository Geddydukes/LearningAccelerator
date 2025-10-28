import React, { useMemo } from 'react';
import { Activity, Gauge, MessageCircle, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

export const InsightHub: React.FC = () => {
  const metrics = useMemo(
    () => [
      {
        id: 'confidence',
        title: 'Confidence growth',
        value: 72,
        description: 'Self-reported confidence jumped 18% after guided workspace sessions.',
      },
      {
        id: 'mastery',
        title: 'Mastery trajectory',
        value: 64,
        description: 'Rubric scores indicate consistent improvement across criteria.',
      },
      {
        id: 'feedback',
        title: 'Feedback response rate',
        value: 88,
        description: 'You respond to mentor nudges within 4 hours on average.',
      },
    ],
    []
  );

  const feedbackThreads = useMemo(
    () => [
      {
        id: 'thread-1',
        agent: 'Socratic Companion',
        message: 'Your reasoning depth improved when you diagrammed the concept physically first.',
        action: 'Add a visual checkpoint to the next mission.',
      },
      {
        id: 'thread-2',
        agent: 'TA Mentor',
        message: 'Prototype link reviewed. Great accessibility annotations—consider narrating the interaction as well.',
        action: 'Record a quick voice walkthrough for the next submission.',
      },
    ],
    []
  );

  return (
    <div className="space-y-8" aria-labelledby="insight-hub-title">
      <header className="flex flex-col gap-3">
        <h2 id="insight-hub-title" className="text-xl font-semibold">Insight hub</h2>
        <p className="text-sm text-muted-foreground">Track performance trends, spot areas that need support, and take action with timely feedback.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label="Performance indicators">
        {metrics.map(metric => (
          <Card key={metric.id} className="border-border/60 p-6" aria-label={`${metric.title} is at ${metric.value} percent`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{metric.title}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
              <Gauge className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <Progress value={metric.value} className="mt-4" aria-hidden="true" />
            <p className="mt-2 text-lg font-semibold">{metric.value}%</p>
          </Card>
        ))}
        <Card className="border-border/60 p-6" aria-label="Learning health score">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-secondary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Learning health</p>
              <p className="text-xs text-muted-foreground">Balanced momentum across focus areas.</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold">B+</p>
          <p className="text-sm text-muted-foreground">Revisit mission variety to unlock an A grade.</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Feedback threads">
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Actionable insights</h3>
          <ul className="mt-4 space-y-4" role="list">
            {feedbackThreads.map(thread => (
              <li key={thread.id} className="rounded-lg border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-semibold">{thread.agent}</p>
                <p className="mt-1 text-sm text-muted-foreground">{thread.message}</p>
                <p className="mt-2 text-sm font-medium text-primary">Next step: {thread.action}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Trend snapshot</h3>
          <div className="mt-4 flex flex-col gap-4">
            {[{
              id: 'reflection',
              label: 'Reflection cadence',
              value: '5 journals / week',
              description: 'Short reflections increase retention by 23% for your persona.',
            }, {
              id: 'collaboration',
              label: 'Collaboration moments',
              value: '4 peer touchpoints',
              description: 'Keep sharing quick wins to unlock the peer mentor badge.',
            }, {
              id: 'assessment',
              label: 'Assessment readiness',
              value: 'Next checkpoint on Friday',
              description: 'Review the rubric and sample responses before submission.',
            }].map(item => (
              <div key={item.id} className="rounded-lg border border-border/60 p-4">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section aria-label="Request support">
        <Card className="border-border/60 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Need a learning nudge?</h3>
              <p className="text-sm text-muted-foreground">Ping your TA or agent when a concept feels stuck. Quick feedback loops keep momentum high.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Request support
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};
