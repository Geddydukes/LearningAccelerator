import React, { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, MessageSquare, Mic, Rocket, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

interface WorkspaceStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'todo' | 'in-progress' | 'done';
}

export const GuidedWorkspace: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>('discover');
  const steps = useMemo<WorkspaceStep[]>(
    () => [
      {
        id: 'discover',
        title: 'Discover the challenge',
        description: 'Review the real-world scenario, clarify success metrics, and surface prior knowledge.',
        duration: '10 min',
        status: 'done',
      },
      {
        id: 'co-design',
        title: 'Co-design with Socratic Companion',
        description: 'Draft your plan with probing questions and build a quick mental model.',
        duration: '15 min',
        status: 'in-progress',
      },
      {
        id: 'build',
        title: 'Build & document',
        description: 'Capture evidence from hybrid work (photos, notes) and upload annotated artifacts.',
        duration: '25 min',
        status: 'todo',
      },
      {
        id: 'reflect',
        title: 'Reflect & submit',
        description: 'Record a short reflection, tag your evidence, and request TA feedback.',
        duration: '10 min',
        status: 'todo',
      },
    ],
    []
  );

  const active = steps.find(step => step.id === activeStep) ?? steps[0];

  const messages = useMemo(
    () => [
      {
        id: 'msg-1',
        role: 'agent',
        author: 'Socratic Companion',
        content: 'Before jumping into solutions, how might accessibility constraints shift this brief?',
      },
      {
        id: 'msg-2',
        role: 'learner',
        author: 'You',
        content: 'Great call. I\'ll map touchpoints that might exclude screen reader users and physical spaces.',
      },
    ],
    []
  );

  return (
    <div className="space-y-8" aria-labelledby="guided-workspace-title">
      <header className="flex flex-col gap-3">
        <h2 id="guided-workspace-title" className="text-xl font-semibold">Guided workspace</h2>
        <p className="text-sm text-muted-foreground">Move through an intentional flow that balances ideation, building, and feedback. Your progress autosaves.</p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]" aria-label="Workspace flow">
        <Card className="border-border/60 p-6" aria-label="Learning phases">
          <p className="text-sm font-semibold text-muted-foreground">Learning phases</p>
          <ul className="mt-4 space-y-4" role="list">
            {steps.map(step => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    activeStep === step.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted/60'
                  }`}
                  aria-pressed={activeStep === step.id}
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
                  <p className="text-lg font-semibold">{active.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{active.description}</p>
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <Sparkles className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />
                Tip: Use quick audio notes to capture hybrid observations while you build.
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[{ label: 'Phase progress', value: '45%' }, { label: 'Time remaining', value: '18 min' }, { label: 'Evidence items', value: '3 of 5' }].map(stat => (
                  <div key={stat.label} className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-semibold text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Completion tracker</p>
                <Progress value={45} className="mt-2" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4" aria-hidden="true" />
                  Advance to next phase
                </Button>
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Mark evidence complete
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation loop</h3>
              <Button variant="outline" className="inline-flex items-center gap-2">
                <Mic className="h-4 w-4" aria-hidden="true" />
                Start voice note
              </Button>
            </div>
            <ul className="mt-4 space-y-4" role="log" aria-live="polite">
              {messages.map(message => (
                <li key={message.id} className={`rounded-lg border border-border/60 p-4 ${
                  message.role === 'agent' ? 'bg-primary/5' : 'bg-muted/40'
                }`}>
                  <p className="text-sm font-semibold">{message.author}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{message.content}</p>
                </li>
              ))}
            </ul>
            <form className="mt-4 space-y-3" aria-label="Send a message to your learning agents">
              <label className="text-sm font-semibold" htmlFor="workspace-message">Compose response</label>
              <textarea
                id="workspace-message"
                className="min-h-[100px] w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm"
                placeholder="Summarize what you tried and what you observed."
              />
              <Button type="submit" className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Send to agents
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};
