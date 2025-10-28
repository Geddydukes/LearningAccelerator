import React, { useMemo, useState } from 'react';
import { Brain, CheckSquare, Compass, Flag, ListChecks, Shield, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

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

const difficultyColor: Record<Mission['difficulty'], string> = {
  foundation: 'bg-secondary text-secondary-foreground',
  challenge: 'bg-primary text-primary-foreground',
  capstone: 'bg-amber-500 text-black',
};

export const MissionControl: React.FC = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Mission['difficulty'] | 'all'>('all');

  const missions = useMemo<Mission[]>(
    () => [
      {
        id: 'mission-1',
        title: 'Design critique relay',
        description: 'Partner with an AI critic and a peer to iterate on a concept in three rounds.',
        difficulty: 'foundation',
        xp: 80,
        progress: 60,
        hybridCue: 'Share a quick sketch photo before round 2 begins.',
        accessibilityLabel: 'Design critique relay mission, foundation difficulty, 60 percent complete',
      },
      {
        id: 'mission-2',
        title: 'Agent pairing lab',
        description: 'Co-design a Socratic prompt and transfer the insight to your TA workspace.',
        difficulty: 'challenge',
        xp: 120,
        progress: 25,
        hybridCue: 'Record a voice reflection after completing the insight transfer.',
        accessibilityLabel: 'Agent pairing lab mission, challenge difficulty, 25 percent complete',
      },
      {
        id: 'mission-3',
        title: 'Community impact pitch',
        description: 'Prototype a learning activity that extends into your local community hub.',
        difficulty: 'capstone',
        xp: 200,
        progress: 10,
        hybridCue: 'Collect two peer signatures during the community showcase.',
        accessibilityLabel: 'Community impact pitch mission, capstone difficulty, 10 percent complete',
      },
    ],
    []
  );

  const filtered = selectedDifficulty === 'all'
    ? missions
    : missions.filter(mission => mission.difficulty === selectedDifficulty);

  return (
    <div className="space-y-8" aria-labelledby="mission-control-title">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="mission-control-title" className="text-xl font-semibold">Mission control</h2>
          <p className="text-sm text-muted-foreground">Gamify your learning plan with quests that blend digital and physical experiences.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter missions by difficulty">
          {([{ id: 'all', label: 'All' }, { id: 'foundation', label: 'Foundation' }, { id: 'challenge', label: 'Challenge' }, { id: 'capstone', label: 'Capstone' }] as const)
            .map(({ id, label }) => (
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
        {filtered.map(mission => (
          <Card key={mission.id} className="border-border/60 p-6" aria-label={mission.accessibilityLabel}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${difficultyColor[mission.difficulty]}`}>
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
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Brain className="h-4 w-4" aria-hidden="true" />
              Launch mission
            </button>
          </Card>
        ))}
      </section>

      <section aria-label="Mission stats" className="grid gap-6 lg:grid-cols-3">
        {[{
          id: 'weekly',
          label: 'Weekly cadence',
          value: '3 missions',
          icon: CheckSquare,
          description: 'Complete at least three missions for your streak bonus.',
        }, {
          id: 'hybrid',
          label: 'Hybrid engagement',
          value: '2 physical checkpoints',
          icon: Flag,
          description: 'Document real-world experimentation with quick uploads.',
        }, {
          id: 'safety',
          label: 'Learning safety net',
          value: 'TA mentor standby',
          icon: Shield,
          description: 'Request guidance if a mission feels blocked for more than 30 minutes.',
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
