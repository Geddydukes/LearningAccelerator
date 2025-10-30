import React, { useMemo } from 'react';
import { BookOpenCheck, Boxes, ExternalLink, Map, PenTool } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useDatabase } from '../../hooks/useDatabase';
import type { Resource } from '../../types';

interface TrackSummary {
  id: string;
  title: string;
  description: string;
  modules: string[];
  hybridAnchor: string;
}

export const TrackExplorer: React.FC = () => {
  const { weeks } = useDatabase();

  const { tracks, resources } = useMemo(() => {
    if (weeks.length === 0) {
      return {
        tracks: [
          {
            id: 'getting-started',
            title: 'Activate your first track',
            description: 'Complete onboarding to unlock personalized tracks populated from your weekly notes.',
            modules: ['Orientation', 'Hybrid mission warm-up', 'Community sync-in'],
            hybridAnchor: 'Capture a hybrid observation to unlock custom modules.',
          },
        ],
        resources: [],
      };
    }

    const trackMap = new Map<string, TrackSummary>();
    const resourceMap = new Map<string, Resource>();

    weeks.forEach(week => {
      const moduleTitle = week.clo_briefing_note?.module_title || `Week ${week.week_number}`;
      const description =
        week.clo_briefing_note?.weekly_theme ||
        week.clo_briefing_note?.learning_objectives?.[0] ||
        'Explore the mission focus for this cycle.';
      const hybridAnchor =
        week.brand_strategy_package?.engagement_strategies?.[0] ||
        'Document a physical observation and connect it to your digital artifact.';

      const summary = trackMap.get(moduleTitle) ?? {
        id: `${week.week_number}-${moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: moduleTitle,
        description,
        modules: [],
        hybridAnchor,
      };

      const keyConcepts = week.clo_briefing_note?.key_concepts ?? [];
      summary.modules = Array.from(new Set([...summary.modules, ...keyConcepts]));
      summary.hybridAnchor = hybridAnchor;
      trackMap.set(moduleTitle, summary);

      (week.clo_briefing_note?.resources ?? []).forEach(resource => {
        if (resource.url && !resourceMap.has(resource.url)) {
          resourceMap.set(resource.url, resource);
        }
      });
    });

    return {
      tracks: Array.from(trackMap.values()),
      resources: Array.from(resourceMap.values()),
    };
  }, [weeks]);

  return (
    <div className="space-y-8" aria-labelledby="track-explorer-title">
      <header className="flex flex-col gap-3">
        <h2 id="track-explorer-title" className="text-xl font-semibold">
          Track explorer
        </h2>
        <p className="text-sm text-muted-foreground">
          See how modules ladder up to experiences and where to find scaffolding resources.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Available learning tracks">
        {tracks.map(track => (
          <Card key={track.id} className="border-border/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Map className="h-4 w-4" aria-hidden="true" />
                  Learning pathway
                </p>
                <h3 className="mt-3 text-lg font-semibold">{track.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{track.description}</p>
              </div>
              <Boxes className="mt-1 h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground" aria-label="Modules in this track">
              {track.modules.length === 0 && (
                <li className="flex items-center gap-2 text-muted-foreground/80">
                  <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  Track modules will populate once your weekly notes are generated.
                </li>
              )}
              {track.modules.map(module => (
                <li key={module} className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <span>{module}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
              <PenTool className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />
              {track.hybridAnchor}
            </div>
            <Button type="button" className="mt-4 inline-flex items-center gap-2" variant="secondary">
              Explore modules
            </Button>
          </Card>
        ))}
      </section>

      <section aria-label="Supporting resources" className="grid gap-6 md:grid-cols-2">
        {resources.length === 0 && (
          <Card className="border-border/60 p-6 text-sm text-muted-foreground">
            Once agent-generated notes are available you&apos;ll see curated resources here.
          </Card>
        )}
        {resources.map(resource => (
          <Card key={resource.url} className="border-border/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resource</p>
                <h3 className="mt-1 text-lg font-semibold">{resource.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {resource.type === 'article' ? 'Article' : resource.type === 'video' ? 'Video' : 'Resource'} • {resource.estimated_time} min
                </p>
              </div>
              <ExternalLink className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <Button
              type="button"
              className="mt-6 inline-flex items-center gap-2"
              variant="outline"
              onClick={() => window.open(resource.url, '_blank', 'noopener')}
            >
              Open resource
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
};
