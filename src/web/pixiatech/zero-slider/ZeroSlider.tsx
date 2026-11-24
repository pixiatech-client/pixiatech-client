'use client';

import { useCallback, useMemo, useState } from 'react';
import './index.css';
import { FEATURED_PROJECTS } from './data/projects';
import { Preloader } from './components/Preloader';
import { WebGLStage } from './components/WebGLStage';
import { HudChrome, type ActiveView } from './components/HudChrome';
import { FullArchiveView } from './components/FullArchiveView';
import { ProjectSheet } from './components/ProjectSheet';

export interface ZeroSliderProps {
  onOpenConsultation?: () => void;
  className?: string;
}

export function ZeroSlider({ onOpenConsultation, className = '' }: ZeroSliderProps) {
  const [view, setView] = useState<ActiveView>('featured');
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const activeProjectIndex = useMemo(
    () => (projectSlug ? FEATURED_PROJECTS.findIndex((p) => p.slug === projectSlug) : -1),
    [projectSlug]
  );

  const activeProject =
    activeProjectIndex >= 0 ? FEATURED_PROJECTS[activeProjectIndex] : null;
  const prevProject =
    activeProjectIndex >= 0
      ? FEATURED_PROJECTS[
          (activeProjectIndex - 1 + FEATURED_PROJECTS.length) % FEATURED_PROJECTS.length
        ]
      : null;
  const nextProject =
    activeProjectIndex >= 0
      ? FEATURED_PROJECTS[(activeProjectIndex + 1) % FEATURED_PROJECTS.length]
      : null;

  const isDimmed = view === 'full' || activeProject !== null;
  const isCarouselInteractive =
    preloaderDone && view === 'featured' && activeProject === null;

  const handleSelectProject = useCallback((slug: string) => {
    setProjectSlug(slug);
  }, []);

  const handleCloseProject = useCallback(() => {
    setProjectSlug(null);
  }, []);

  return (
    <div
      className={`zero-slider-root relative w-full h-[660px] sm:h-[720px] lg:h-[800px] overflow-hidden bg-black text-white select-none ${className}`}
    >
      {!preloaderDone && (
        <Preloader ready={stageReady} onComplete={() => setPreloaderDone(true)} />
      )}

      <WebGLStage
        projects={FEATURED_PROJECTS}
        dimmed={isDimmed}
        interactive={isCarouselInteractive}
        initialIndex={2}
        onReady={() => setStageReady(true)}
        onFirstInteract={() => setHasInteracted(true)}
        onSelectProject={handleSelectProject}
      />

      <FullArchiveView
        active={view === 'full' && activeProject === null}
        dimmed={false}
        onSelectFeatured={handleSelectProject}
        onClose={() => setView('featured')}
      />

      <ProjectSheet
        project={activeProject}
        prevProject={prevProject}
        nextProject={nextProject}
        onClose={handleCloseProject}
        onNavigate={handleSelectProject}
      />

      <HudChrome
        view={view}
        hasInteracted={hasInteracted}
        isSheetOpen={activeProject !== null}
        onSelectView={(nextView) => setView(nextView)}
      />
    </div>
  );
}

export default ZeroSlider;
