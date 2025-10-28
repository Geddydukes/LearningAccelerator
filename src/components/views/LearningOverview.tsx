import React, { useMemo } from 'react';
import { Award, Calendar, CheckCircle2, Flame, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

export const LearningOverview: React.FC = () => {
  const streakData = useMemo(
    () => ({
      current: 12,
      goal: 21,
      badges: [
        { id: 'momentum', label: 'Momentum Keeper', description: 'Complete 10 consecutive active days' },
        { id: 'reflector', label: 'Reflective Learner', description: 'Share insights in 3 retrospectives' },
      ],
    }),
    []
  );

  const progressData = useMemo(
    () => [
      {
        id: 'design-foundations',
        title: 'Design Foundations',
        completion: 76,
        focus: 'Hybrid workshop & portfolio artifact',
        dueDate: 'Mar 24',
        accessibilityLabel: 'Design foundations module is 76 percent complete and due March 24th',
      },
      {
        id: 'ai-lab',
        title: 'AI Lab Sprint',
        completion: 42,
        focus: 'Prototype feedback loop with agent support',
        dueDate: 'Mar 28',
        accessibilityLabel: 'AI lab sprint is 42 percent complete and due March 28th',
      },
    ],
    []
  );

  const upcoming = useMemo(
    () => [
      {
        id: 'mentor-sync',
        title: 'Mentor Sync: Apply Socratic insights',
        type: 'Live session',
        startTime: 'Tomorrow • 4:00 PM',
        description: 'Bring the artifact from today\'s mission for peer critique.',
      },
      {
        id: 'community-huddle',
        title: 'Community Huddle: Hybrid idea fair',
        type: 'Community',
        startTime: 'Friday • 11:00 AM',
        description: 'Showcase offline experiments that connect to digital submissions.',
      },
    ],
    []
  );

  const feedbackLoop = useMemo(
    () => ({
      insights: [
        {
          id: 'socratic',
          label: 'Socratic Companion',
          message: 'You unlocked level 5 reasoning yesterday. Schedule a reflective journal to retain it.',
          icon: Lightbulb,
        },
        {
          id: 'workspace',
          label: 'Workspace Review',
          message: 'TA feedback pending for 2 checkpoints. Revisit the rubric before resubmitting.',
          icon: CheckCircle2,
        },
      ],
      xpDelta: 180,
    }),
    []
  );

  return (
    <div className="space-y-8" aria-labelledby="learning-overview-title">
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="learning-overview-title" className="text-xl font-semibold">Today\'s learning posture</h2>
            <p className="text-sm text-muted-foreground">Keep the streak alive while balancing creation, reflection, and assessment.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
            <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{streakData.current} day streak in progress</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 p-6" aria-label="Momentum and streak progress">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Momentum streak</p>
                <p className="mt-1 text-2xl font-semibold">{streakData.current} / {streakData.goal} days</p>
              </div>
              <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <Progress value={(streakData.current / streakData.goal) * 100} className="mt-4" />
            <p className="mt-3 text-sm text-muted-foreground">Keep engaging with at least one mission or reflection to extend your streak.</p>
          </Card>

          <Card className="border-border/60 p-6" aria-label="Achievements unlocked">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-secondary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unlocked badges</p>
                <p className="text-lg font-semibold">Learning heroics</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm" aria-label="Badge descriptions">
              {streakData.badges.map(badge => (
                <li key={badge.id} className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <p className="font-medium">{badge.label}</p>
                  <p className="text-muted-foreground">{badge.description}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-border/60 p-6" aria-label="Feedback summary">
            <p className="text-sm font-medium text-muted-foreground">Feedback loops</p>
            <p className="mt-1 text-2xl font-semibold">+{feedbackLoop.xpDelta} XP today</p>
            <ul className="mt-4 space-y-3" aria-label="Recent insights">
              {feedbackLoop.insights.map(({ id, label, message, icon: Icon }) => (
                <li key={id} className="flex gap-3 rounded-lg border border-border/60 p-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5" aria-labelledby="module-progress-title">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="module-progress-title" className="text-lg font-semibold">Live modules</h3>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Active progression</span>
          </div>
          <ul className="space-y-4" role="list">
            {progressData.map(module => (
              <li key={module.id}>
                <Card className="border-border/60 p-5" aria-label={module.accessibilityLabel}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{module.focus}</p>
                      <p className="text-lg font-semibold">{module.title}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      {module.completion}% complete
                    </div>
                  </div>
                  <Progress value={module.completion} className="mt-4" aria-hidden="true" />
                  <p className="mt-2 text-sm text-muted-foreground">Next milestone due {module.dueDate}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming hybrid moments</h3>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Stay prepared</span>
          </div>
          <ul className="space-y-4" role="list">
            {upcoming.map(event => (
              <li key={event.id}>
                <Card className="border-border/60 p-4" aria-label={`${event.title} scheduled ${event.startTime}`}>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-secondary" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{event.type}</p>
                      <p className="text-base font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.startTime}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="reflection-prompt-title">
        <Card className="border-border/60 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 id="reflection-prompt-title" className="text-lg font-semibold">Reflection prompt</h3>
              <p className="text-sm text-muted-foreground">Capture a quick note on how today\'s mission connects with your long-term goal.</p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Log reflection
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};
