import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Volume2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility, type FontScale } from '../../contexts/AccessibilityContext';
import { useDatabase } from '../../hooks/useDatabase';
import type { LearningPreferences } from '../../types';

const DEFAULT_PREFERENCES: LearningPreferences = {
  difficulty_level: 'intermediate',
  focus_areas: ['full-stack-development'],
  learning_pace: 'normal',
  preferred_interaction_style: 'mixed',
  notification_preferences: {
    mentor_feedback: true,
    mission_reminders: true,
    community_digest: false,
  },
  hybrid_frequency: 'weekly',
};

const FOCUS_OPTIONS = [
  { id: 'full-stack-development', label: 'Full-stack development' },
  { id: 'react', label: 'React craftsmanship' },
  { id: 'ai-agents', label: 'AI agent workflows' },
  { id: 'hybrid-learning', label: 'Hybrid learning design' },
];

export const LearnerSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useAccessibility();
  const { user, updateUserProfile, loading } = useDatabase();
  const [voicePreference, setVoicePreference] = useState(user?.voice_preference ?? 'alloy');
  const [preferences, setPreferences] = useState<LearningPreferences>(
    user?.learning_preferences ? { ...DEFAULT_PREFERENCES, ...user.learning_preferences } : DEFAULT_PREFERENCES
  );
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setVoicePreference(user.voice_preference ?? 'alloy');
    setPreferences(user.learning_preferences ? { ...DEFAULT_PREFERENCES, ...user.learning_preferences } : DEFAULT_PREFERENCES);
  }, [user]);

  const handleVoicePreference = async (value: string) => {
    setVoicePreference(value);
    try {
      setSavingField('voice');
      await updateUserProfile({ voice_preference: value });
    } finally {
      setSavingField(null);
    }
  };

  const persistPreferences = async (updates: Partial<LearningPreferences>, field: string) => {
    const next = { ...preferences, ...updates };
    setPreferences(next);
    try {
      setSavingField(field);
      await updateUserProfile({ learning_preferences: next });
    } finally {
      setSavingField(null);
    }
  };

  const notificationPrefs = preferences.notification_preferences ?? DEFAULT_PREFERENCES.notification_preferences;

  const fontScaleOptions: { id: FontScale; label: string; description: string }[] = [
    { id: 'base', label: 'Standard', description: 'Default type scale for most learners.' },
    { id: 'large', label: 'Comfort', description: 'Increase text size for easier reading.' },
    { id: 'xlarge', label: 'Amplify', description: 'Maximize text size for low-vision scenarios.' },
  ];

  const focusSummary = useMemo(() => {
    if (!preferences.focus_areas.length) return 'Select the domains you want to emphasize.';
    return preferences.focus_areas
      .map(area => FOCUS_OPTIONS.find(option => option.id === area)?.label ?? area)
      .join(', ');
  }, [preferences.focus_areas]);

  return (
    <div className="space-y-8" aria-labelledby="learner-settings-title" aria-busy={loading}>
      <header className="flex flex-col gap-3">
        <h2 id="learner-settings-title" className="text-xl font-semibold">Learning preferences</h2>
        <p className="text-sm text-muted-foreground">Personalize accessibility, themes, and sensory support. Your settings sync across devices.</p>
      </header>

      <section aria-label="Theme and accessibility controls" className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 p-6">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-secondary" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold">Theme mode</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark modes for optimal comfort.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-live="polite"
          >
            {theme === 'light' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          </button>
        </Card>

        <Card className="border-border/60 p-6">
          <div className="flex items-center gap-3">
            <Volume2 className="h-6 w-6 text-secondary" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold">Voice preference</p>
              <p className="text-sm text-muted-foreground">Choose the agent voice that pairs best with your learning sessions.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            {['alloy', 'verse', 'sol'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleVoicePreference(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  voicePreference === option ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/60'
                }`}
                aria-pressed={voicePreference === option}
                disabled={savingField === 'voice'}
              >
                {option === 'alloy' ? 'Alloy (balanced)' : option === 'verse' ? 'Verse (expressive)' : 'Sol (calm)'}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section aria-label="Adjust font size">
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Font scale</h3>
          <p className="text-sm text-muted-foreground">Select the typography size that feels best. Changes apply instantly.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {fontScaleOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFontScale(option.id)}
                className={`rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  fontScale === option.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/60'
                }`}
                aria-pressed={fontScale === option.id}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section aria-label="Notification preferences" className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Feedback notifications</h3>
          <p className="text-sm text-muted-foreground">Decide how you want to receive nudges from mentors and agents.</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={notificationPrefs.mentor_feedback}
                  onChange={event =>
                    persistPreferences(
                      {
                        notification_preferences: {
                          ...notificationPrefs,
                          mentor_feedback: event.target.checked,
                        },
                      },
                      'notifications'
                    )
                  }
                />
                Mentor feedback nudges
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={notificationPrefs.mission_reminders}
                  onChange={event =>
                    persistPreferences(
                      {
                        notification_preferences: {
                          ...notificationPrefs,
                          mission_reminders: event.target.checked,
                        },
                      },
                      'notifications'
                    )
                  }
                />
                Daily mission reminders
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={notificationPrefs.community_digest}
                  onChange={event =>
                    persistPreferences(
                      {
                        notification_preferences: {
                          ...notificationPrefs,
                          community_digest: event.target.checked,
                        },
                      },
                      'notifications'
                    )
                  }
                />
                Weekly community digest
              </label>
            </li>
          </ul>
        </Card>

        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Hybrid participation</h3>
          <p className="text-sm text-muted-foreground">Tell us how often you can join physical experiences so we can tailor missions.</p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {([
              { id: 'weekly', label: 'Weekly (recommended for streak bonuses)' },
              { id: 'biweekly', label: 'Twice a month' },
              { id: 'flex', label: 'Flexible / remote-first' },
            ] as const).map(option => (
              <label key={option.id} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="hybrid"
                  className="h-4 w-4"
                  checked={preferences.hybrid_frequency === option.id}
                  onChange={() =>
                    persistPreferences(
                      {
                        hybrid_frequency: option.id,
                      },
                      'hybrid'
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </Card>
      </section>

      <section aria-label="Learning focus areas">
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Focus areas</h3>
          <p className="text-sm text-muted-foreground">Select up to three themes to personalize agent prompts and track recommendations.</p>
          <p className="mt-2 text-xs text-muted-foreground">Currently selected: {focusSummary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FOCUS_OPTIONS.map(option => {
              const checked = preferences.focus_areas.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={event => {
                      const nextAreas = event.target.checked
                        ? Array.from(new Set([...preferences.focus_areas, option.id])).slice(0, 3)
                        : preferences.focus_areas.filter(area => area !== option.id);
                      persistPreferences({ focus_areas: nextAreas }, 'focus-areas');
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </Card>
      </section>

      <section aria-label="Interaction style" className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Preferred interaction</h3>
          <p className="text-sm text-muted-foreground">Choose how you prefer to work with the multi-agent system.</p>
          <div className="mt-4 flex gap-3">
            {(['text', 'voice', 'mixed'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => persistPreferences({ preferred_interaction_style: option }, 'interaction')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  preferences.preferred_interaction_style === option
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/60'
                }`}
                aria-pressed={preferences.preferred_interaction_style === option}
              >
                {option === 'text' ? 'Text-first' : option === 'voice' ? 'Voice-first' : 'Mixed experience'}
              </button>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Difficulty & pace</h3>
          <p className="text-sm text-muted-foreground">Adjust challenge levels to match your current goals.</p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <label className="flex items-center gap-3">
              <span className="w-32 font-semibold">Difficulty</span>
              <select
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2"
                value={preferences.difficulty_level}
                onChange={event =>
                  persistPreferences({ difficulty_level: event.target.value as LearningPreferences['difficulty_level'] }, 'difficulty')
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="flex items-center gap-3">
              <span className="w-32 font-semibold">Learning pace</span>
              <select
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2"
                value={preferences.learning_pace}
                onChange={event =>
                  persistPreferences({ learning_pace: event.target.value as LearningPreferences['learning_pace'] }, 'pace')
                }
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
          </div>
        </Card>
      </section>

      <section aria-label="Screen reader support">
        <Card className="border-border/60 p-6">
          <div className="flex items-center gap-3">
            <Volume2 className="h-6 w-6 text-secondary" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold">Screen reader support</p>
              <p className="text-sm text-muted-foreground">We optimize markup for semantic clarity. Toggle high contrast to enhance assistive tech.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHighContrast}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-pressed={highContrast}
          >
            {highContrast ? 'Disable high contrast' : 'Enable high contrast'}
          </button>
        </Card>
      </section>
    </div>
  );
};
