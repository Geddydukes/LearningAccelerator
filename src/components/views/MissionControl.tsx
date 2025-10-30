import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CheckSquare, Compass, Flag, ListChecks, Shield, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import { useProgression } from '../../hooks/useProgression';
import { useDatabase } from '../../hooks/useDatabase';
import { DatabaseService } from '../../lib/database';
import { calculateModuleProgress } from '../../lib/progression';
import type { ModuleInstance } from '../../types/progression';
import { XP_REWARDS } from '../../lib/gamify/logStreak';
import toast from 'react-hot-toast';

const DEFAULT_TRACK_LABEL = 'AI/ML Engineering';

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'foundation' | 'challenge' | 'capstone';
  xp: number;
  progress: number;
  hybridCue: string;
  accessibilityLabel: string;
}

const DIFFICULTY_XP: Record<Mission['difficulty'], number> = {
  foundation: XP_REWARDS.DAILY_LOGIN * 20,
  challenge: XP_REWARDS.TA_COMPLETION * 12,
  capstone: XP_REWARDS.PORTFOLIO_GIT_PUSH + XP_REWARDS.MONTHLY_ACHIEVEMENT,
};

const determineDifficulty = (week: number): Mission['difficulty'] => {
  if (week <= 1) return 'foundation';
  if (week <= 3) return 'challenge';
  return 'capstone';
};

export const MissionControl: React.FC = () => {
  const { weeks } = useDatabase();
  const { progressState, loading: progressionLoading } = useProgression(DEFAULT_TRACK_LABEL);
  const [moduleInstances, setModuleInstances] = useState<ModuleInstance[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Mission['difficulty'] | 'all'>('all');

  useEffect(() => {
    const trackId = progressState?.track?.id;
    if (!trackId) {
      setModuleInstances([]);
      return;
    }

    let active = true;
    DatabaseService.getModuleInstances(trackId)
      .then(instances => {
        if (active) setModuleInstances(instances);
      })
      .catch(error => {
        console.warn('Failed to load module instances', error);
      });

    return () => {
      active = false;
    };
  }, [progressState?.track?.id]);

  const missions = useMemo<Mission[]>(() => {
    return moduleInstances.map(instance => {
      const difficulty = determineDifficulty(instance.week);
      const progress = calculateModuleProgress(instance);
      const weekNote = weeks.find(week => week.week_number === instance.week);
      const hybridCue =
        weekNote?.brand_strategy_package?.engagement_strategies?.[0] ||
        weekNote?.lead_engineer_briefing_note?.recommendations?.[0]?.description ||
        'Capture a real-world observation and sync it with your mission.';

      return {
        id: instance.id,
        title: `Mission • Week ${instance.week} Day ${instance.day}`,
        description:
          (instance.completion_json?.summary as string | undefined) ||
          weekNote?.clo_briefing_note?.weekly_theme ||
          'Combine digital work and hybrid experimentation to unlock your badge.',
        difficulty,
        xp: DIFFICULTY_XP[difficulty],
        progress,
        hybridCue,
        accessibilityLabel: `Mission for week ${instance.week} day ${instance.day} is ${progress}% complete`,
      };
    });
  }, [moduleInstances, weeks]);

  const filteredMissions = selectedDifficulty === 'all'
    ? missions
    : missions.filter(mission => mission.difficulty === selectedDifficulty);

  const cadenceCount = missions.length;
  const hybridMoments = weeks.reduce((count, week) => {
    const hasHybrid = Boolean(week.brand_strategy_package?.engagement_strategies?.length);
    return count + (hasHybrid ? 1 : 0);
  }, 0);
  const mentorReady = progressState?.canAdvance ?? false;

  const handleLaunch = (mission: Mission) => {
    toast.success(`Mission “${mission.title}” loaded into your workspace`);
  };

  return (
    <div className="space-y-8" aria-labelledby="mission-control-title" aria-busy={progressionLoading}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="mission-control-title" className="text-xl font-semibold">
            Mission control
          </h2>
          <p className="text-sm text-muted-foreground">
            Gamify your learning plan with quests that blend digital and physical experiences.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter missions by difficulty">
          {([
            { id: 'all', label: 'All' },
            { id: 'foundation', label: 'Foundation' },
            { id: 'challenge', label: 'Challenge' },
            { id: 'capstone', label: 'Capstone' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedDifficulty(id as Mission['difficulty'] | 'all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                selectedDifficulty === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-pressed={selectedDifficulty === id}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Mission list">
        {filteredMissions.length === 0 && (
          <Card className="border-border/60 p-6 text-sm text-muted-foreground">
            No missions yet—complete your onboarding prompts and weekly notes to populate this space.
          </Card>
        )}
        {filteredMissions.map(mission => (
          <Card key={mission.id} className="border-border/60 p-6" aria-label={mission.accessibilityLabel}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    mission.difficulty === 'foundation'
                      ? 'bg-secondary text-secondary-foreground'
                      : mission.difficulty === 'challenge'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-amber-500 text-black'
                  }`}
                >
                  {mission.difficulty}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{mission.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{mission.description}</p>
              </div>
              <Trophy className="mt-1 h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                <span>{mission.xp} XP available</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>{mission.hybridCue}</span>
              </div>
            </div>
            <Progress value={mission.progress} className="mt-4" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">Progress: {mission.progress}%</p>
            <Button
              type="button"
              className="mt-4 inline-flex items-center gap-2"
              onClick={() => handleLaunch(mission)}
            >
              <Brain className="h-4 w-4" aria-hidden="true" />
              Launch mission
            </Button>
          </Card>
        ))}
      </section>

      <section aria-label="Mission stats" className="grid gap-6 lg:grid-cols-3">
        {[{
          id: 'weekly',
          label: 'Weekly cadence',
          value: `${cadenceCount} missions`,
          icon: CheckSquare,
          description: 'Complete the current week’s missions to unlock your streak bonus.',
        }, {
          id: 'hybrid',
          label: 'Hybrid engagement',
          value: `${hybridMoments} hybrid touchpoints`,
          icon: Flag,
          description: 'Document real-world experimentation alongside digital deliverables.',
        }, {
          id: 'safety',
          label: 'Learning safety net',
          value: mentorReady ? 'Ready to advance' : 'Agent support pending',
          icon: Shield,
          description: mentorReady
            ? 'All required agents have signed off—advance when you are ready.'
            : 'Work with Socratic, TA, and Alex agents to unlock the next phase.',
        }].map(({ id, label, value, icon: Icon, description }) => (
          <Card key={id} className="border-border/60 p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-lg">{value}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
};
