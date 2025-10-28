import React from 'react';
import { Moon, Sun, Volume2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility, type FontScale } from '../../contexts/AccessibilityContext';

export const LearnerSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useAccessibility();

  const fontScaleOptions: { id: FontScale; label: string; description: string }[] = [
    { id: 'base', label: 'Standard', description: 'Default type scale for most learners.' },
    { id: 'large', label: 'Comfort', description: 'Increase text size for easier reading.' },
    { id: 'xlarge', label: 'Amplify', description: 'Maximize text size for low-vision scenarios.' },
  ];

  return (
    <div className="space-y-8" aria-labelledby="learner-settings-title">
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
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                Push alerts for mentor feedback
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                Daily mission reminders
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                Weekly community digest
              </label>
            </li>
          </ul>
        </Card>

        <Card className="border-border/60 p-6">
          <h3 className="text-lg font-semibold">Hybrid participation</h3>
          <p className="text-sm text-muted-foreground">Tell us how often you can join physical experiences so we can tailor missions.</p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <label className="flex items-center gap-3">
              <input type="radio" name="hybrid" defaultChecked className="h-4 w-4" />
              Weekly (recommended for streak bonuses)
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="hybrid" className="h-4 w-4" />
              Twice a month
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="hybrid" className="h-4 w-4" />
              Flexible / remote-first
            </label>
          </div>
        </Card>
      </section>
    </div>
  );
};
