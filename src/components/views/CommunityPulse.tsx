import React, { useMemo } from 'react';
import { Broadcast, HeartHandshake, Layers, MessageCircle, Sparkles, Users } from 'lucide-react';
import { Card } from '../ui/Card';

export const CommunityPulse: React.FC = () => {
  const highlights = useMemo(
    () => [
      {
        id: 'showcase',
        title: 'Showcase spotlight',
        description: 'Ariana transformed her analog collage into an interactive prototype—see the hybrid gallery walkthrough.',
        linkLabel: 'View showcase',
      },
      {
        id: 'study-group',
        title: 'Study group forming',
        description: 'Join the Saturday sprint circle focused on responsible AI design patterns.',
        linkLabel: 'Join the circle',
      },
    ],
    []
  );

  const discussions = useMemo(
    () => [
      {
        id: 'thread-1',
        title: 'How do you document hybrid experiments?',
        author: 'Kai • Mentor',
        replies: 14,
        summary: 'Share tips for connecting real-world activities with digital submissions.',
      },
      {
        id: 'thread-2',
        title: 'Gamifying formative assessments',
        author: 'Priya • Learner',
        replies: 9,
        summary: 'Looking for inspiration on quick feedback loops that feel energizing.',
      },
    ],
    []
  );

  return (
    <div className="space-y-8" aria-labelledby="community-pulse-title">
      <header className="flex flex-col gap-3">
        <h2 id="community-pulse-title" className="text-xl font-semibold">Community pulse</h2>
        <p className="text-sm text-muted-foreground">Tap into peer creativity, grab a mentor nudge, or contribute to showcase moments.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Highlights">
        {highlights.map(item => (
          <Card key={item.id} className="border-border/60 p-6">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  {item.linkLabel}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Community spaces">
        {[{
          id: 'mentors',
          icon: HeartHandshake,
          title: 'Mentor office hours',
          description: 'Reserve a 15-minute slot to unblock a mission or validate your approach.',
        }, {
          id: 'forums',
          icon: MessageCircle,
          title: 'Active discussion threads',
          description: `${discussions.reduce((acc, thread) => acc + thread.replies, 0)} replies today across cohorts.`,
        }, {
          id: 'hybrid',
          icon: Layers,
          title: 'Hybrid build clubs',
          description: 'Coordinate local meetups that sync with digital deliverables.',
        }].map(({ id, icon: Icon, title, description }) => (
          <Card key={id} className="border-border/60 p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section aria-label="Discussion threads">
        <Card className="border-border/60 p-6">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Active discussions</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Start a thread
            </button>
          </div>
          <ul className="mt-4 space-y-4" role="list">
            {discussions.map(thread => (
              <li key={thread.id} className="rounded-lg border border-border/60 p-4">
                <p className="text-base font-semibold">{thread.title}</p>
                <p className="text-sm text-muted-foreground">{thread.summary}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{thread.author} • {thread.replies} replies</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};
