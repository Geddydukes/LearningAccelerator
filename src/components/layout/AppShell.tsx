import React, { useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BrainCircuit,
  ChevronRight,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility, type FontScale } from '../../contexts/AccessibilityContext';
import { LearningOverview } from '../views/LearningOverview';
import { MissionControl } from '../views/MissionControl';
import { TrackExplorer } from '../views/TrackExplorer';
import { InsightHub } from '../views/InsightHub';
import { CommunityPulse } from '../views/CommunityPulse';
import { LearnerSettings } from '../views/LearnerSettings';
import { GuidedWorkspace } from '../views/GuidedWorkspace';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface NavItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAVIGATION: NavItem[] = [
  {
    id: 'overview',
    label: 'Learning Overview',
    description: 'Progress, momentum, and next actions',
    path: 'overview',
    icon: LayoutDashboard,
  },
  {
    id: 'workspace',
    label: 'Guided Workspace',
    description: 'Active session with agents and resources',
    path: 'workspace',
    icon: BrainCircuit,
  },
  {
    id: 'missions',
    label: 'Mission Control',
    description: 'Gamified learning quests and streaks',
    path: 'missions',
    icon: Target,
  },
  {
    id: 'tracks',
    label: 'Track Explorer',
    description: 'Modules, resources, and hybrid activities',
    path: 'tracks',
    icon: ShieldCheck,
  },
  {
    id: 'analytics',
    label: 'Insight Hub',
    description: 'Performance analytics and feedback loops',
    path: 'analytics',
    icon: BarChart3,
  },
  {
    id: 'community',
    label: 'Community Pulse',
    description: 'Collaborate with peers and mentors',
    path: 'community',
    icon: Users,
  },
  {
    id: 'settings',
    label: 'Learning Settings',
    description: 'Preferences, accessibility, and theme',
    path: 'settings',
    icon: Sparkles,
  },
];

const FontScaleToggle: React.FC = () => {
  const { fontScale, setFontScale } = useAccessibility();
  const options: { id: FontScale; label: string }[] = [
    { id: 'base', label: 'A' },
    { id: 'large', label: 'A+' },
    { id: 'xlarge', label: 'A++' },
  ];

  return (
    <div className="flex items-center gap-1" aria-label="Adjust font size">
      {options.map(option => (
        <button
          key={option.id}
          type="button"
          onClick={() => setFontScale(option.id)}
          className={`rounded-md px-2 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
            fontScale === option.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          aria-pressed={fontScale === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const HighContrastToggle: React.FC = () => {
  const { highContrast, toggleHighContrast } = useAccessibility();
  return (
    <button
      type="button"
      onClick={toggleHighContrast}
      className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      aria-pressed={highContrast}
    >
      {highContrast ? 'Disable high contrast' : 'High contrast'}
    </button>
  );
};

export default function AppShell() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => {
    const found = NAVIGATION.find(item => location.pathname.includes(item.path));
    return found?.id ?? 'overview';
  }, [location.pathname]);

  const userInitials = user?.name
    ?.split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') ?? 'WL';

  const renderNavLinks = (onNavigate?: () => void) => (
    <ul className="space-y-1" role="list">
      {NAVIGATION.map(item => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;

        return (
          <li key={item.id}>
            <NavLink
              to={item.path}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
              className={({ isActive: routeActive }) =>
                `group flex w-full flex-col rounded-lg border border-transparent p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  routeActive || isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background text-foreground hover:border-border hover:bg-muted/60'
                }`
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    isActive
                      ? 'bg-primary-foreground/10 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-none">{item.label}</p>
                    <p className={`mt-1 text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} aria-hidden="true" />
              </div>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop navigation */}
      <aside className="hidden w-[320px] flex-shrink-0 border-r border-border/60 bg-sidebar/80 px-6 py-8 lg:block" aria-label="Primary navigation">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Learning Accelerator</p>
            <h1 className="mt-1 text-lg font-semibold">Wisely Nexus</h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {userInitials}
          </span>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Navigate learning spaces that mirror the pedagogy of your track. Everything you need is structured around action.
        </p>
        <nav className="mt-8 space-y-8" aria-label="Main">
          {renderNavLinks()}
        </nav>
      </aside>

      {/* Mobile navigation */}
      <div className="lg:hidden">
        <button
          type="button"
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
            <div className="absolute inset-y-0 right-0 w-80 bg-background p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Navigate</h2>
                  <p className="text-sm text-muted-foreground">Choose your learning space</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                {renderNavLinks(() => setMobileOpen(false))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <h2 className="text-2xl font-semibold leading-tight">{NAVIGATION.find(item => item.id === activeItem)?.label ?? 'Learning Overview'}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FontScaleToggle />
              <HighContrastToggle />
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="border-border text-sm"
                aria-label="Toggle theme"
              >
                Switch to {theme === 'light' ? 'dark' : 'light'} mode
              </Button>
              <Button
                variant="ghost"
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                Sign out
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Streak active', value: '12 days', context: 'Learning momentum', accent: 'bg-primary/10 text-primary' },
              { title: 'Focus for today', value: 'Project checkpoint', context: 'Hybrid: build & reflect', accent: 'bg-secondary text-secondary-foreground' },
              { title: 'Feedback loops', value: '2 pending reviews', context: 'Socratic + TA', accent: 'bg-accent text-accent-foreground' },
            ].map((item) => (
              <Card key={item.title} className="border-border/60">
                <div className={`rounded-lg ${item.accent} px-3 py-2 text-xs font-semibold uppercase tracking-wide`}>{item.context}</div>
                <div className="px-3 pb-4 pt-3">
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="mt-1 text-xl font-semibold">{item.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background px-4 py-8 lg:px-8">
          <Routes>
            <Route index element={<Navigate to={PATHS.overview.replace('/home/', '')} replace />} />
            <Route path="overview" element={<LearningOverview />} />
            <Route path="workspace" element={<GuidedWorkspace />} />
            <Route path="missions" element={<MissionControl />} />
            <Route path="tracks" element={<TrackExplorer />} />
            <Route path="analytics" element={<InsightHub />} />
            <Route path="community" element={<CommunityPulse />} />
            <Route path="settings" element={<LearnerSettings />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
