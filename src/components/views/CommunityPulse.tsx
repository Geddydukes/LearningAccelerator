import React, { useEffect, useMemo, useState } from 'react';
import { HeartHandshake, Layers, MessageCircle, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useDatabase } from '../../hooks/useDatabase';
import { DatabaseService } from '../../lib/database';
import type { SocraticSession, Message } from '../../types';

interface Highlight {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
}

interface DiscussionThread {
  id: string;
  title: string;
  author: string;
  replies: number;
  summary: string;
}

export const CommunityPulse: React.FC = () => {
  const { user, weeks } = useDatabase();
  const [sessions, setSessions] = useState<SocraticSession[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    let active = true;
    DatabaseService.getSocraticSessions(user.id, 4)
      .then(data => {
        if (active) setSessions(data);
      })
      .catch(error => {
        console.warn('Failed to load community sessions', error);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (sessions.length === 0) {
      setMessageCounts({});
      return;
    }

    let active = true;
    Promise.all(
      sessions.map(async session => {
        try {
          const messages: Message[] = await DatabaseService.getSessionMessages(session.id);
          return [session.id, messages.length] as const;
        } catch (error) {
          console.warn('Failed to load session messages', error);
          return [session.id, 0] as const;
        }
      })
    ).then(entries => {
      if (active) {
        setMessageCounts(Object.fromEntries(entries));
      }
    });

    return () => {
      active = false;
    };
  }, [sessions]);

  const highlights = useMemo<Highlight[]>(() => {
    const results: Highlight[] = [];
    const latestWeek = weeks[weeks.length - 1];

    if (latestWeek?.brand_strategy_package?.social_content_suggestions?.length) {
      const suggestion = latestWeek.brand_strategy_package.social_content_suggestions[0];
      results.push({
        id: 'brand-highlight',
        title: 'Showcase spotlight',
        description: suggestion.title || suggestion.description,
        linkLabel: 'View showcase',
      });
    }

    if (sessions.length > 0) {
      const session = sessions[0];
      results.push({
        id: session.id,
        title: session.topic || 'Continue the Socratic thread',
        description: 'Pick up your live conversation with the Socratic companion and keep momentum going.',
        linkLabel: 'Resume conversation',
      });
    }

    if (results.length === 0) {
      results.push({
        id: 'start-thread',
        title: 'Start a new community thread',
        description: 'Share a hybrid insight or question to invite peers into your workflow.',
        linkLabel: 'Start a thread',
      });
    }

    return results;
  }, [weeks, sessions]);

  const discussions = useMemo<DiscussionThread[]>(() => {
    return sessions.map(session => {
      const week = weeks.find(candidate => candidate.id === session.week_id);
      const replies = Math.max((messageCounts[session.id] ?? 0) - 1, 0);
      return {
        id: session.id,
        title: session.topic || `Week ${week?.week_number ?? '?'} discussion`,
        author: week ? `Week ${week.week_number}` : 'Socratic Companion',
        replies,
        summary:
          week?.socratic_conversation?.learning_breakthrough ||
          'Add your latest insight or question to keep the discussion flowing.',
      };
    });
  }, [sessions, weeks, messageCounts]);

  const mentorSessions = weeks.filter(week => week.ta_session).length;
  const hybridClubs = weeks.filter(week => week.brand_strategy_package?.engagement_strategies?.length).length;
  const totalReplies = Object.values(messageCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-8" aria-labelledby="community-pulse-title">
      <header className="flex flex-col gap-3">
        <h2 id="community-pulse-title" className="text-xl font-semibold">Community pulse</h2>
        <p className="text-sm text-muted-foreground">
          Tap into peer creativity, grab a mentor nudge, or contribute to showcase moments.
        </p>
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
                <Button type="button" className="mt-4 inline-flex items-center gap-2" variant="secondary">
                  {item.linkLabel}
                </Button>
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
          description: mentorSessions > 0
            ? `${mentorSessions} sessions available this week.`
            : 'Schedule a TA session to unblock a mission.',
        }, {
          id: 'forums',
          icon: MessageCircle,
          title: 'Active discussion threads',
          description: `${totalReplies} messages across your Socratic conversations.`,
        }, {
          id: 'hybrid',
          icon: Layers,
          title: 'Hybrid build clubs',
          description: hybridClubs > 0
            ? `You logged ${hybridClubs} hybrid shares this month.`
            : 'Upload a hybrid artifact to join the build club.',
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
            <Button type="button" variant="outline" className="inline-flex items-center gap-2">
              Start a thread
            </Button>
          </div>
          <ul className="mt-4 space-y-4" role="list">
            {discussions.length === 0 && (
              <li className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                Launch a Socratic session to see your active discussions appear here.
              </li>
            )}
            {discussions.map(thread => (
              <li key={thread.id} className="rounded-lg border border-border/60 p-4">
                <p className="text-base font-semibold">{thread.title}</p>
                <p className="text-sm text-muted-foreground">{thread.summary}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {thread.author} • {thread.replies} replies
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};
