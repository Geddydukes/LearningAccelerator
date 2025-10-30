import React, { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, CheckCircle2, Flame, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { useDatabase } from '../../hooks/useDatabase';
import { useProgression } from '../../hooks/useProgression';
import { useGamificationMetrics } from '../../hooks/useGamificationMetrics';
import { DatabaseService } from '../../lib/database';
import { calculateModuleProgress } from '../../lib/progression';
import type { ModuleInstance } from '../../types/progression';

const DEFAULT_TRACK_LABEL = 'AI/ML Engineering';

const BADGE_METADATA: Record<string, { label: string; description: string }> = {
  'Momentum Keeper': {
    label: 'Momentum Keeper',
    description: 'Sustain a seven-day streak across agents.',
  },
  'TA Collaborator': {
    label: 'TA Collaborator',
    description: 'Meet with your TA three times in a week.',
  },
  'Hybrid Builder': {
    label: 'Hybrid Builder',
    description: 'Capture two real-world artifacts and sync them in workspace.',
  },
};

export const LearningOverview: React.FC = () => {
  const { currentWeek, weeks } = useDatabase();
  const { progressState, loading: progressionLoading } = useProgression(DEFAULT_TRACK_LABEL);
  const { snapshot, achievements, loading: gamificationLoading } = useGamificationMetrics();
  const [moduleInstances, setModuleInstances] = useState<ModuleInstance[]>([]);

  const loading = progressionLoading || gamificationLoading;

  useEffect(() => {
    const trackId = progressState?.track?.id;
    if (!trackId) {
      setModuleInstances([]);
      return;
    }

    let active = true;
    DatabaseService.getModuleInstances(trackId)
      .then(data => {
        if (active) setModuleInstances(data);
      })
      .catch(error => {
        console.warn('Failed to load module instances', error);
      });

    return () => {
      active = false;
    };
  }, [progressState?.track?.id]);

  const streakDays = useMemo(
    () => snapshot?.streaks.reduce((total, entry) => total + entry.current_streak_days, 0) ?? 0,
    [snapshot]
  );
  const streakGoal = 21;
  const streakBadges = achievements.map(id => BADGE_METADATA[id] ?? { label: id, description: 'Unlocked milestone' });

  const progressData = useMemo(() => {
    const startDate = progressState?.track?.start_date ? parseISO(progressState.track.start_date) : new Date();
    const validStartDate = isValid(startDate) ? startDate : new Date();

    return moduleInstances.slice(0, 3).map(instance => {
      const completion = calculateModuleProgress(instance);
      const focusValue = instance.completion_json?.focus;
      const focus =
        typeof focusValue === 'string'
          ? focusValue
          : currentWeek?.clo_briefing_note?.weekly_theme ||
            'Apply the mission insight to your artifact.';
      const dueDate = format(addDays(validStartDate, (instance.week - 1) * 7 + (instance.day - 1)), 'MMM d');

      return {
        id: instance.id,
        title: `Week ${instance.week} · Day ${instance.day}`,
        completion,
        focus,
        dueDate,
        accessibilityLabel: `Module for week ${instance.week} day ${instance.day} is ${completion}% complete and due ${dueDate}`,
      };
    });
  }, [moduleInstances, currentWeek, progressState?.track?.start_date]);

  const upcomingEvents = useMemo(() => {
    const events: Array<{ id: string; title: string; type: string; startTime: string; description: string }> = [];
    if (currentWeek?.instructor_lesson) {
      events.push({
        id: `lesson-${currentWeek.instructor_lesson.lesson_id}`,
        title: currentWeek.instructor_lesson.title,
        type: 'Instructor session',
        startTime: `Day ${currentWeek.instructor_lesson.day_number}`,
        description: currentWeek.instructor_lesson.objectives.join(', '),
      });
    }
    if (currentWeek?.ta_session) {
      events.push({
        id: `ta-${currentWeek.ta_session.session_id}`,
        title: 'TA mentor review',
        type: 'Mentor',
        startTime: currentWeek.ta_session.is_completed ? 'Completed' : 'Pending feedback',
        description:
          currentWeek.ta_session.suggestions?.[0] || 'Work through the rubric checkpoints before submitting.',
      });
    }
    if (currentWeek?.clarifier_session) {
      events.push({
        id: `clarifier-${currentWeek.clarifier_session.session_id}`,
        title: 'Clarifier alignment',
        type: 'Clarifier',
        startTime: currentWeek.clarifier_session.is_completed ? 'Wrapped' : 'Coordinate this week',
        description: currentWeek.clarifier_session.priorities.join(', '),
      });
    }

    if (events.length === 0 && weeks.length > 0) {
      events.push({
        id: 'community-check',
        title: 'Document hybrid evidence',
        type: 'Hybrid',
        startTime: 'Anytime this week',
        description: 'Capture a photo, note, or reflection from your offline build to unlock your badge.',
      });
    }

    return events.slice(0, 3);
  }, [currentWeek, weeks]);

  const xpDelta = snapshot ? snapshot.recentActivities * 10 : 0;

  const feedbackInsights = useMemo(() => {
    const insights: Array<{ id: string; label: string; message: string; icon: React.ComponentType<any> }> = [];
    if (currentWeek?.socratic_conversation?.learning_breakthrough) {
      insights.push({
        id: 'socratic',
        label: 'Socratic Companion',
        message: currentWeek.socratic_conversation.learning_breakthrough,
        icon: Lightbulb,
      });
    } else if (currentWeek?.socratic_conversation?.insights_generated?.length) {
      insights.push({
        id: 'socratic',
        label: 'Socratic Companion',
        message: currentWeek.socratic_conversation.insights_generated[0],
        icon: Lightbulb,
      });
    }

    if (currentWeek?.ta_session?.feedback) {
      insights.push({
        id: 'ta',
        label: 'TA mentor',
        message: currentWeek.ta_session.feedback,
        icon: CheckCircle2,
      });
    }

    if (currentWeek?.brand_strategy_package?.engagement_strategies?.length) {
      insights.push({
        id: 'brand',
        label: 'Brand strategist',
        message: currentWeek.brand_strategy_package.engagement_strategies[0],
        icon: Sparkles,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'default',
        label: 'Learning companion',
        message: 'Check in with your agents to unlock new feedback.',
        icon: Lightbulb,
      });
    }

    return insights;
  }, [currentWeek]);

  const reflectionPrompt = useMemo(() => {
    if (currentWeek?.portfolio_session?.optimization_suggestions?.length) {
      return currentWeek.portfolio_session.optimization_suggestions[0];
    }
    if (currentWeek?.brand_strategy_package?.content_themes?.length) {
      return `Share a quick update about: ${currentWeek.brand_strategy_package.content_themes[0]}.`;
    }
    return 'Capture one tangible takeaway from this week and how you applied it in the real world.';
  }, [currentWeek]);

  return (
    <div className="space-y-8" aria-labelledby="learning-overview-title" aria-busy={loading}>
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="learning-overview-title" className="text-xl font-semibold">
              Today&apos;s learning posture
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep the streak alive while balancing creation, reflection, and assessment.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
            <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{streakDays} day streak in progress</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 p-6" aria-label="Momentum and streak progress">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Momentum streak</p>
                <p className="mt-1 text-2xl font-semibold">{streakDays} / {streakGoal} days</p>
              </div>
              <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <Progress value={(streakDays / streakGoal) * 100} className="mt-4" />
            <p className="mt-3 text-sm text-muted-foreground">
              Log one meaningful learning action today to keep your streak growing.
            </p>
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
              {streakBadges.length === 0 && (
                <li className="rounded-lg border border-border/60 bg-muted/50 p-3 text-muted-foreground">
                  Complete agent sessions and hybrid moments to unlock your next badge.
                </li>
              )}
              {streakBadges.map(badge => (
                <li key={badge.label} className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <p className="font-medium">{badge.label}</p>
                  <p className="text-muted-foreground">{badge.description}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-border/60 p-6" aria-label="Feedback summary">
            <p className="text-sm font-medium text-muted-foreground">Feedback loops</p>
            <p className="mt-1 text-2xl font-semibold">+{xpDelta} XP today</p>
            <ul className="mt-4 space-y-3" aria-label="Recent insights">
              {feedbackInsights.map(({ id, label, message, icon: Icon }) => (
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
            <h3 id="module-progress-title" className="text-lg font-semibold">
              Live modules
            </h3>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Active progression</span>
          </div>
          <ul className="space-y-4" role="list">
            {progressData.length === 0 && (
              <li>
                <Card className="border-border/60 p-5">
                  <p className="text-sm text-muted-foreground">
                    Once you begin a track, your active modules will appear here with real-time progress.
                  </p>
                </Card>
              </li>
            )}
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
            {upcomingEvents.map(event => (
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 id="reflection-prompt-title" className="text-lg font-semibold">
                Reflection prompt
              </h3>
              <p className="text-sm text-muted-foreground">
                Capture a quick reflection to reinforce this week&apos;s learning momentum.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
              {reflectionPrompt}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
