import React, { useMemo } from 'react';
import { BookOpenCheck, Boxes, ExternalLink, Map, PenTool } from 'lucide-react';
import { Card } from '../ui/Card';

export const TrackExplorer: React.FC = () => {
  const tracks = useMemo(
    () => [
      {
        id: 'experience-design',
        title: 'Experience design track',
        description: 'Blend interface craft with inclusive storytelling. Expect weekly hybrid labs.',
        modules: [
          'Story-driven research synthesis',
          'Prototyping for accessibility',
          'Hybrid field study (physical + digital)',
        ],
        hybridAnchor: 'Document a physical observation to unlock the digital blueprint.',
      },
      {
        id: 'ai-learning',
        title: 'AI-powered learning architecture',
        description: 'Design multi-agent learning flows that adapt to learner archetypes.',
        modules: [
          'Responsible prompting workshop',
          'Data sensemaking with dashboards',
          'TA co-pilot integration',
        ],
        hybridAnchor: 'Collect analog artifacts (notes, audio) and pair them with AI insight cards.',
      },
    ],
    []
  );

  const resources = useMemo(
    () => [
      {
        id: 'rubric',
        title: 'Performance rubric library',
        description: 'Understand how mastery is scored with transparent, learner-friendly rubrics.',
        link: '#',
      },
      {
        id: 'playbook',
        title: 'Hybrid workshop playbook',
        description: 'Step-by-step facilitation guides for hands-on sessions that bridge spaces.',
        link: '#',
      },
    ],
    []
  );

  return (
    <div className="space-y-8" aria-labelledby="track-explorer-title">
      <header className="flex flex-col gap-3">
        <h2 id="track-explorer-title" className="text-xl font-semibold">Track explorer</h2>
        <p className="text-sm text-muted-foreground">See how modules ladder up to experiences and where to find scaffolding resources.</p>
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
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Explore modules
            </button>
          </Card>
        ))}
      </section>

      <section aria-label="Supporting resources" className="grid gap-6 md:grid-cols-2">
        {resources.map(resource => (
          <Card key={resource.id} className="border-border/60 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resource</p>
                <h3 className="mt-1 text-lg font-semibold">{resource.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
              </div>
              <ExternalLink className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Open resource
            </button>
          </Card>
        ))}
      </section>
    </div>
  );
};
