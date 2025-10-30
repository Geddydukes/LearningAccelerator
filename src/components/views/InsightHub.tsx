import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Gauge, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import { useDatabase } from '../../hooks/useDatabase';
import { useGamificationMetrics } from '../../hooks/useGamificationMetrics';
import { DatabaseService } from '../../lib/database';
import type { KPIMetricRecord } from '../../types';

const DEFAULT_TREND = [
  {
    id: 'reflection',
    label: 'Reflection cadence',
    value: 'Set your first reflection',
    description: 'Log a quick reflection after each hybrid mission to track retention.',
  },
  {
    id: 'collaboration',
    label: 'Collaboration moments',
    value: 'Connect with a peer mentor',
    description: 'Share wins in community channels to unlock collaborative prompts.',
  },
  {
    id: 'assessment',
    label: 'Assessment readiness',
    value: 'Review the next rubric',
    description: 'Preview your rubric to understand how mastery is measured.',
  },
];

export const InsightHub: React.FC = () => {
  const { user, weeks } = useDatabase();
  const { snapshot, loading: gamificationLoading } = useGamificationMetrics();
  const [metrics, setMetrics] = useState<KPIMetricRecord[]>([]);
  const loading = gamificationLoading;

  useEffect(() => {
    if (!user) {
      setMetrics([]);
      return;
    }

    let active = true;
    DatabaseService.getKPIMetrics(user.id)
      .then(data => {
        if (active) setMetrics(data);
      })
      .catch(error => {
        console.warn('Failed to fetch KPI metrics', error);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const metricSummaries = useMemo(() => {
    if (metrics.length === 0) {
      return [
        {
          id: 'confidence',
          title: 'Confidence growth',
          value: 65,
          description: 'Connect with agents to unlock live performance metrics.',
        },
      ];
    }
    return metrics.map(metric => ({
      id: metric.id,
      title: metric.metric_name,
      value: Math.round(metric.current_value ?? 0),
      description: `Target ${metric.target_value ?? metric.current_value}${metric.unit ?? ''} • Updated ${format(
        new Date(metric.recorded_at),
        'MMM d'
      )}`,
    }));
  }, [metrics]);

  const feedbackThreads = useMemo(() => {
    const threads: Array<{ id: string; agent: string; message: string; action: string }> = [];
    const latestWeeks = [...weeks].slice(-2).reverse();

    latestWeeks.forEach(week => {
      if (week.socratic_conversation?.insights_generated?.length) {
        threads.push({
          id: `${week.id}-socratic`,
          agent: 'Socratic Companion',
          message: week.socratic_conversation.insights_generated[0],
          action: week.socratic_conversation.insights_generated[1] || 'Schedule a quick debrief to apply this insight.',
        });
      }
      if (week.ta_session?.feedback) {
        threads.push({
          id: `${week.id}-ta`,
          agent: 'TA Mentor',
          message: week.ta_session.feedback,
          action: week.ta_session.next_steps?.[0] || 'Submit an updated artifact once you apply the feedback.',
        });
      }
    });

    if (threads.length === 0) {
      threads.push({
        id: 'default-thread',
        agent: 'Learning companion',
        message: 'Ask your TA for feedback on your latest mission to unlock targeted coaching.',
        action: 'Open a TA session and add your questions.',
      });
    }

    return threads;
  }, [weeks]);

  const trendSnapshot = useMemo(() => {
    if (!snapshot || weeks.length === 0) {
      return DEFAULT_TREND;
    }

    const reflections = weeks.reduce((count, week) => (week.socratic_conversation ? count + 1 : count), 0);
    const collaborations = weeks.reduce(
      (count, week) =>
        count + (week.brand_strategy_package?.engagement_strategies?.length ? 1 : 0),
      0
    );
    const assessments = weeks.reduce((count, week) => (week.ta_session?.is_completed ? count + 1 : count), 0);

    return [
      {
        id: 'reflection',
        label: 'Reflection cadence',
        value: `${reflections} journals logged`,
        description: 'Short reflections improve retention and fuel the Brand strategist.',
      },
      {
        id: 'collaboration',
        label: 'Collaboration moments',
        value: `${collaborations} hybrid shares`,
        description: 'Keep sharing hybrid artifacts to unlock community prompts.',
      },
      {
        id: 'assessment',
        label: 'Assessment readiness',
        value: assessments > 0 ? 'Feedback in progress' : 'Request mentor feedback',
        description: assessments > 0
          ? 'Review the rubric and incorporate mentor notes before resubmitting.'
          : 'Kick off a TA session to validate your approach before the deadline.',
      },
    ];
  }, [snapshot, weeks]);

  const learningHealth = useMemo(() => {
    if (!snapshot) return 'B';
    const streakScore = Math.min(snapshot.streaks.length * 2, 6);
    const xpScore = Math.min(Math.floor(snapshot.xp / 250), 4);
    const total = streakScore + xpScore;
    if (total >= 8) return 'A';
    if (total >= 6) return 'B+';
    if (total >= 4) return 'B';
    return 'C+';
  }, [snapshot]);

  return (
    <div className="space-y-8" aria-labelledby="insight-hub-title" aria-busy={loading}>
      <header className="flex flex-col gap-3">
        <h2 id="insight-hub-title" className="text-xl font-semibold">
          Insight hub
        </h2>
        <p className="text-sm text-muted-foreground">
          Track performance trends, spot areas that need support, and take action with timely feedback.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label="Performance indicators">
        {metricSummaries.map(metric => (
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
          <p className="mt-4 text-3xl font-semibold">{learningHealth}</p>
          <p className="text-sm text-muted-foreground">Use hybrid missions and reflections to raise your grade.</p>
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
            {trendSnapshot.map(item => (
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
              <p className="text-sm text-muted-foreground">
                Ping your TA or agent when a concept feels stuck. Quick feedback loops keep momentum high.
              </p>
            </div>
            <Button
              type="button"
              className="inline-flex items-center gap-2"
              onClick={() => window.open('mailto:mentor@learningaccelerator.dev', '_blank')}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Request support
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};
