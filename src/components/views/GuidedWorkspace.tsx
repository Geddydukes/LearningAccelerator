import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, MessageSquare, Mic, Rocket, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useDatabase } from '../../hooks/useDatabase';
import { useProgression } from '../../hooks/useProgression';
import { DatabaseService } from '../../lib/database';
import type { CompletionStatus, EducationSession, Message } from '../../types';
import toast from 'react-hot-toast';

interface WorkspaceStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'todo' | 'in-progress' | 'done';
  completionKey: keyof CompletionStatus;
}

interface DisplayMessage {
  id: string;
  role: 'agent' | 'learner';
  author: string;
  content: string;
}

const DEFAULT_COMPLETION: CompletionStatus = {
  clo_completed: false,
  socratic_completed: false,
  instructor_completed: false,
  ta_completed: false,
  alex_completed: false,
  brand_completed: false,
  clarifier_completed: false,
  onboarder_completed: false,
  career_match_completed: false,
  portfolio_completed: false,
  overall_progress: 0,
};

const COMPLETION_KEYS: Array<keyof CompletionStatus> = [
  'clo_completed',
  'socratic_completed',
  'instructor_completed',
  'ta_completed',
  'alex_completed',
  'brand_completed',
  'clarifier_completed',
  'onboarder_completed',
  'career_match_completed',
  'portfolio_completed',
];

const formatDuration = (minutes?: number | null) => {
  if (!minutes || Number.isNaN(minutes)) {
    return '10 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${remaining > 0 ? ` ${remaining}m` : ''}`;
};

const sentenceFromArray = (items?: string[] | null, fallback?: string) => {
  if (!items || items.length === 0) return fallback ?? 'Review the brief and confirm success criteria.';
  if (items.length === 1) return items[0];
  const [first, ...rest] = items;
  return `${first}; ${rest.join('; ')}`;
};

const computeOverall = (status: CompletionStatus) => {
  const total = COMPLETION_KEYS.length;
  const completed = COMPLETION_KEYS.reduce((count, key) => count + (status[key] ? 1 : 0), 0);
  return Math.min(100, Math.round((completed / total) * 100));
};

export const GuidedWorkspace: React.FC = () => {
  const { user, currentWeek, createOrUpdateWeek, loading: dbLoading } = useDatabase();
  const {
    progressState,
    loading: progressionLoading,
    advanceProgress,
  } = useProgression('AI/ML Engineering');
  const [activeStep, setActiveStep] = useState<string>('clo_completed');
  const [educationSessions, setEducationSessions] = useState<EducationSession[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  const completion = currentWeek?.completion_status ?? DEFAULT_COMPLETION;
  const loading = dbLoading || progressionLoading;

  useEffect(() => {
    if (!user) {
      setEducationSessions([]);
      return;
    }
    let active = true;
    DatabaseService.getEducationSessions(user.id)
      .then(data => {
        if (active) setEducationSessions(data);
      })
      .catch(error => {
        console.warn('Failed to load education sessions', error);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const sessionId = currentWeek?.socratic_conversation?.session_id;
    if (!sessionId) {
      setSessionMessages([]);
      return;
    }

    let active = true;
    DatabaseService.getSessionMessages(sessionId)
      .then(messages => {
        if (active) setSessionMessages(messages);
      })
      .catch(error => {
        console.warn('Failed to load Socratic messages', error);
      });

    return () => {
      active = false;
    };
  }, [currentWeek?.socratic_conversation?.session_id]);

  const steps = useMemo<WorkspaceStep[]>(() => {
    const blueprint: Array<Omit<WorkspaceStep, 'status'> & { completionKey: keyof CompletionStatus }> = [
      {
        id: 'clo',
        title: 'Discover the challenge',
        description: sentenceFromArray(
          currentWeek?.clo_briefing_note?.learning_objectives,
          currentWeek?.clo_briefing_note?.key_concepts?.[0]
        ),
        duration: formatDuration(currentWeek?.clo_briefing_note?.estimated_duration ?? null),
        completionKey: 'clo_completed',
      },
      {
        id: 'socratic',
        title: 'Co-design with Socratic Companion',
        description:
          currentWeek?.socratic_conversation?.key_insight ||
          sentenceFromArray(currentWeek?.socratic_conversation?.insights_generated, 'Draft a plan with probing questions.'),
        duration: `${currentWeek?.socratic_conversation?.total_questions ?? 4} prompts`,
        completionKey: 'socratic_completed',
      },
      {
        id: 'ta',
        title: 'Build & document',
        description:
          currentWeek?.ta_session?.help_text ||
          sentenceFromArray(currentWeek?.ta_session?.suggestions, 'Capture evidence from hybrid experimentation.'),
        duration: `${currentWeek?.ta_session?.solution_steps?.length ?? 4} checkpoints`,
        completionKey: 'ta_completed',
      },
      {
        id: 'reflect',
        title: 'Reflect & publish',
        description:
          currentWeek?.brand_strategy_package?.brand_voice_analysis ||
          sentenceFromArray(
            currentWeek?.brand_strategy_package?.engagement_strategies,
            'Record a short reflection and share the win.'
          ),
        duration: formatDuration(currentWeek?.brand_strategy_package?.social_content_suggestions?.length ? 10 : 5),
        completionKey: 'brand_completed',
      },
    ];

    let firstPendingSeen = false;
    return blueprint.map(step => {
      let status: WorkspaceStep['status'] = 'todo';
      if (completion[step.completionKey]) {
        status = 'done';
      } else if (!firstPendingSeen) {
        status = 'in-progress';
        firstPendingSeen = true;
      }
      return { ...step, status };
    });
  }, [completion, currentWeek]);

  useEffect(() => {
    const firstIncomplete = steps.find(step => step.status !== 'done');
    if (firstIncomplete && firstIncomplete.completionKey !== activeStep) {
      setActiveStep(firstIncomplete.completionKey);
    }
  }, [steps, activeStep]);

  const active = steps.find(step => step.completionKey === activeStep) ?? steps[0];

  const stats = useMemo(() => {
    const overall = progressState?.progress ?? completion.overall_progress ?? 0;
    const activeSession = educationSessions.find(session => session.phase !== 'completed');
    const artifacts =
      (currentWeek?.lead_engineer_briefing_note?.technical_debt_items?.length ?? 0) +
      (currentWeek?.portfolio_session?.portfolio_items?.length ?? 0);

    return [
      { label: 'Overall progress', value: `${overall}%` },
      {
        label: 'Active phase',
        value: activeSession ? activeSession.phase.replace(/_/g, ' ') : 'Ready for next milestone',
      },
      {
        label: 'Artifacts logged',
        value: `${artifacts} item${artifacts === 1 ? '' : 's'}`,
      },
    ];
  }, [completion.overall_progress, currentWeek, educationSessions, progressState?.progress]);

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    if (sessionMessages.length > 0) {
      return sessionMessages.map(message => ({
        id: message.id,
        role: message.role === 'assistant' ? 'agent' : 'learner',
        author: message.role === 'assistant' ? 'Socratic Companion' : 'You',
        content: message.content,
      }));
    }

    const fallback = currentWeek?.socratic_conversation?.messages ?? [];
    return fallback.map((message, index) => ({
      id: message.id || `fallback-${index}`,
      role: message.type === 'question' ? 'agent' : 'learner',
      author: message.type === 'question' ? 'Socratic Companion' : 'You',
      content: message.content,
    }));
  }, [currentWeek, sessionMessages]);

  const handleMarkComplete = async (step: WorkspaceStep) => {
    if (!createOrUpdateWeek || savingStep === step.id) return;
    setSavingStep(step.id);

    try {
      const updatedStatus: CompletionStatus = {
        ...completion,
        [step.completionKey]: true,
      };
      updatedStatus.overall_progress = computeOverall(updatedStatus);
      await createOrUpdateWeek({ completion_status: updatedStatus });
      toast.success(`${step.title} marked complete`);
    } catch (error) {
      console.error('Failed to mark step complete', error);
      toast.error('Unable to save progress right now');
    } finally {
      setSavingStep(null);
    }
  };

  const ensureConversationSession = async () => {
    if (currentWeek?.socratic_conversation?.session_id) {
      return currentWeek.socratic_conversation.session_id;
    }
    if (!user || !currentWeek?.id) {
      toast.error('Sign in to sync this conversation.');
      return null;
    }

    try {
      const session = await DatabaseService.createSocraticSession(
        user.id,
        currentWeek.id,
        currentWeek.socratic_conversation?.topic
      );
      await createOrUpdateWeek?.({
        socratic_conversation: {
          ...currentWeek.socratic_conversation,
          session_id: session.id,
        },
      });
      return session.id;
    } catch (error) {
      console.error('Failed to start Socratic session', error);
      toast.error('Unable to start a Socratic session');
      return null;
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageDraft.trim()) return;
    setIsSending(true);

    try {
      const sessionId = await ensureConversationSession();
      if (!sessionId) {
        setIsSending(false);
        return;
      }

      const message = await DatabaseService.addMessage(sessionId, 'user', messageDraft.trim());
      setSessionMessages(prev => [...prev, message]);
      setMessageDraft('');
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Message failed to send');
    } finally {
      setIsSending(false);
    }
  };

  const handleAdvance = async () => {
    if (!progressState?.canAdvance) {
      toast.error('Complete all required agents before advancing.');
      return;
    }

    try {
      await advanceProgress();
      toast.success('Advanced to the next learning moment');
    } catch (error) {
      console.error('Failed to advance progress', error);
      toast.error('Could not advance yet');
    }
  };

  return (
    <div className="space-y-8" aria-labelledby="guided-workspace-title" aria-busy={loading}>
      <header className="flex flex-col gap-3">
        <h2 id="guided-workspace-title" className="text-xl font-semibold">
          Guided workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Move through an intentional flow that balances ideation, building, and feedback. Your progress autosaves.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]" aria-label="Workspace flow">
        <Card className="border-border/60 p-6" aria-label="Learning phases">
          <p className="text-sm font-semibold text-muted-foreground">Learning phases</p>
          <ul className="mt-4 space-y-4" role="list">
            {steps.map(step => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.completionKey)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    activeStep === step.completionKey
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/60'
                  }`}
                  aria-pressed={activeStep === step.completionKey}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{step.title}</span>
                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6" aria-live="polite">
          <Card className="border-border/60 p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BrainCircuit className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Current phase</p>
                  <p className="text-lg font-semibold">{active?.title ?? 'Explore the brief'}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{active?.description}</p>
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <Sparkles className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />
                {currentWeek?.brand_strategy_package?.weekly_intelligence_briefing?.learning_breakthrough ||
                  'Capture hybrid observations as quick audio notes while you build.'}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {stats.map(stat => (
                  <div key={stat.label} className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-semibold text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Completion tracker</p>
                <Progress value={progressState?.progress ?? completion.overall_progress ?? 0} className="mt-2" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="inline-flex items-center gap-2"
                  onClick={handleAdvance}
                  disabled={!progressState?.canAdvance}
                >
                  <Rocket className="h-4 w-4" aria-hidden="true" />
                  {progressState?.canAdvance ? 'Advance to next phase' : 'Complete agents to advance'}
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={() => active && handleMarkComplete(active)}
                  disabled={active?.status === 'done' || savingStep === active?.id}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {active?.status === 'done' ? 'Already complete' : 'Mark evidence complete'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation loop</h3>
              <Button variant="outline" className="inline-flex items-center gap-2" disabled>
                <Mic className="h-4 w-4" aria-hidden="true" />
                Start voice note
              </Button>
            </div>
            <ul className="mt-4 space-y-4" role="log" aria-live="polite">
              {displayMessages.length === 0 && (
                <li className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                  No conversation history yet. Ask the Socratic companion for a prompt to get started.
                </li>
              )}
              {displayMessages.map(message => (
                <li
                  key={message.id}
                  className={`rounded-lg border border-border/60 p-4 ${
                    message.role === 'agent' ? 'bg-primary/5' : 'bg-muted/40'
                  }`}
                >
                  <p className="text-sm font-semibold">{message.author}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{message.content}</p>
                </li>
              ))}
            </ul>
            <form className="mt-4 space-y-3" aria-label="Send a message to your learning agents" onSubmit={handleSendMessage}>
              <label className="text-sm font-semibold" htmlFor="workspace-message">
                Compose response
              </label>
              <textarea
                id="workspace-message"
                className="min-h-[100px] w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm"
                placeholder="Summarize what you tried and what you observed."
                value={messageDraft}
                onChange={event => setMessageDraft(event.target.value)}
                disabled={isSending || loading}
              />
              <Button type="submit" className="inline-flex items-center gap-2" disabled={isSending || loading}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {isSending ? 'Sending…' : 'Send to agents'}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};
