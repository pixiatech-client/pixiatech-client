'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Award, X } from 'lucide-react';
import type { FeaturedProject } from '../data/projects';
import { generateProjectCaptures } from '../utils/projectCaptures';

interface ProjectSheetProps {
  project: FeaturedProject | null;
  prevProject: FeaturedProject | null;
  nextProject: FeaturedProject | null;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

const CAPTURE_LABELS = [
  'Vue principale Pixiatech',
  'Présentation marché LED',
  'Détail & intégration',
  'Affichage grand format & mobile',
];

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function ProjectSheet({
  project,
  prevProject,
  nextProject,
  onClose,
  onNavigate,
}: ProjectSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [captures, setCaptures] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (project) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [project]);

  const loopStateRef = useRef({
    scrollTarget: 0,
    scrollCurrent: 0,
    inertiaVel: 0,
    dragging: false,
    dragStartY: 0,
    dragOrigin: 0,
    lastY: 0,
    lastTime: 0,
  });

  useEffect(() => {
    if (!project) {
      setCaptures([]);
      return;
    }
    let cancelled = false;
    setCaptures([project.heroImage]);
    loopStateRef.current.scrollTarget = 0;
    loopStateRef.current.scrollCurrent = 0;
    loopStateRef.current.inertiaVel = 0;

    generateProjectCaptures(project)
      .then((urls) => {
        if (!cancelled) setCaptures(urls);
      })
      .catch(() => {
        if (!cancelled) setCaptures([project.heroImage]);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  // Duplicate captures so circular wrapping always covers tall viewports seamlessly
  const virtualSlots = useMemo(() => {
    if (captures.length === 0) return [];
    const repeat = captures.length >= 4 ? 2 : 4;
    const result: { src: string; captureIndex: number; slotKey: string }[] = [];
    for (let r = 0; r < repeat; r++) {
      for (let i = 0; i < captures.length; i++) {
        result.push({
          src: captures[i],
          captureIndex: i,
          slotKey: `${project?.slug ?? 'proj'}-r${r}-i${i}`,
        });
      }
    }
    return result;
  }, [captures, project?.slug]);

  // Infinite vertical scroll loop engine (wheel anywhere on sheet + touch/pointer drag + arrows)
  useEffect(() => {
    if (!project || virtualSlots.length === 0) return;

    const sheetEl = sheetRef.current;
    const viewportEl = viewportRef.current;
    if (!sheetEl || !viewportEl) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slotCount = virtualSlots.length;
    const uniqueCount = Math.max(1, captures.length);

    let itemWidth = Math.max(240, viewportEl.clientWidth);
    let itemHeight = itemWidth * (10 / 16);
    let gap = window.innerWidth >= 1024 ? 44 : window.innerWidth >= 640 ? 32 : 22;
    let stride = itemHeight + gap;
    let totalTrack = slotCount * stride;
    let padTop = window.innerWidth >= 1024 ? 36 : 12;

    const syncMetrics = () => {
      const vw = viewportEl.clientWidth;
      if (vw > 0) {
        itemWidth = vw;
        itemHeight = vw * (10 / 16);
        gap = window.innerWidth >= 1024 ? 44 : window.innerWidth >= 640 ? 32 : 22;
        stride = itemHeight + gap;
        totalTrack = slotCount * stride;
        padTop = window.innerWidth >= 1024 ? 36 : 12;
      }
    };
    syncMetrics();

    const ro = new ResizeObserver(syncMetrics);
    ro.observe(viewportEl);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      loopStateRef.current.inertiaVel = 0;
      loopStateRef.current.scrollTarget += e.deltaY;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      loopStateRef.current.dragging = true;
      loopStateRef.current.inertiaVel = 0;
      loopStateRef.current.dragStartY = e.clientY;
      loopStateRef.current.lastY = e.clientY;
      loopStateRef.current.lastTime = performance.now();
      loopStateRef.current.dragOrigin = loopStateRef.current.scrollTarget;
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = loopStateRef.current;
      if (!s.dragging) return;
      const dy = e.clientY - s.dragStartY;
      const now = performance.now();
      const dtMs = Math.max(8, now - s.lastTime);
      const stepDy = e.clientY - s.lastY;
      s.scrollTarget = s.dragOrigin - dy;
      s.inertiaVel = -stepDy / (dtMs / 1000);
      s.lastY = e.clientY;
      s.lastTime = now;
    };

    const onPointerUp = () => {
      loopStateRef.current.dragging = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && nextProject) {
        onNavigate(nextProject.slug);
      } else if (e.key === 'ArrowLeft' && prevProject) {
        onNavigate(prevProject.slug);
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        loopStateRef.current.inertiaVel = 0;
        loopStateRef.current.scrollTarget += e.key === 'PageDown' ? stride : 260;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        loopStateRef.current.inertiaVel = 0;
        loopStateRef.current.scrollTarget -= e.key === 'PageUp' ? stride : 260;
      }
    };

    sheetEl.addEventListener('wheel', onWheel, { passive: false });
    viewportEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    let rafId = 0;
    let lastTs = performance.now();

    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const s = loopStateRef.current;
      if (!s.dragging && Math.abs(s.inertiaVel) > 4) {
        s.scrollTarget += s.inertiaVel * dt;
        s.inertiaVel *= Math.exp(-5.2 * dt);
      } else if (!s.dragging) {
        s.inertiaVel = 0;
      }

      if (prefersReduced) {
        s.scrollCurrent = s.scrollTarget;
      } else {
        s.scrollCurrent = damp(s.scrollCurrent, s.scrollTarget, 9.5, dt);
      }

      const cycleLen = uniqueCount * stride;
      const cyclePos = ((s.scrollCurrent % cycleLen) + cycleLen) % cycleLen;
      const activeCapture = Math.floor((cyclePos + itemHeight * 0.35) / stride) % uniqueCount;
      viewportEl.dataset.scrollY = s.scrollCurrent.toFixed(1);
      viewportEl.dataset.activeCapture = String(activeCapture + 1);

      for (let i = 0; i < slotCount; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;

        const raw = i * stride - s.scrollCurrent;
        const wrappedY =
          ((((raw + stride) % totalTrack) + totalTrack) % totalTrack) - stride;

        el.style.height = `${itemHeight.toFixed(2)}px`;
        el.style.transform = `translate3d(0, ${(padTop + wrappedY).toFixed(2)}px, 0)`;
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      sheetEl.removeEventListener('wheel', onWheel);
      viewportEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, virtualSlots, captures.length, prevProject, nextProject, onClose, onNavigate]);

  if (!project || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-3 sm:p-6 transition-all duration-300 animate-in fade-in"
      style={{ zIndex: 250 }}
    >
      {/* Peeking Previous Project Sheet Edge */}
      {prevProject && (
        <button
          type="button"
          data-cms-ignore="true"
          data-cms-ui="true"
          onClick={() => onNavigate(prevProject.slug)}
          aria-label={`Projet précédent : ${prevProject.title}`}
          className="hidden lg:block fixed inset-y-6 left-0 w-7 -translate-x-1 cursor-pointer rounded-r-[20px] bg-white/30 transition-all duration-300 hover:w-10 hover:bg-white/55 focus:outline-none z-[251]"
        />
      )}

      {/* Main White Floating Case Study Sheet */}
      <article
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto flex h-[calc(100svh-1.5rem)] w-full max-w-[1460px] flex-col overflow-hidden rounded-[16px] bg-white text-black shadow-2xl sm:h-[calc(100svh-2.5rem)] sm:rounded-[20px] lg:flex-row"
      >
        {/* Larger Black Circular Close Button */}
        <button
          type="button"
          data-cms-ignore="true"
          data-cms-ui="true"
          style={{ position: 'absolute' }}
          onClick={onClose}
          aria-label="Fermer la fiche"
          className="absolute bottom-4 right-4 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none sm:bottom-auto sm:right-7 sm:top-7 sm:h-16 sm:w-16"
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
        </button>

        {/* Left Column: Title, Editorial Copy, Live CTA, Tags & Awards */}
        <div className="flex shrink-0 flex-col items-start justify-between px-6 pt-6 pb-4 sm:px-10 sm:pt-10 lg:w-[40%] lg:px-12 lg:py-12">
          <div>
            <h1 className="text-[30px] sm:text-[44px] font-normal leading-none tracking-[-0.05em] text-black">
              {project.title}
            </h1>

            <p className="mt-3 sm:mt-6 max-w-[400px] text-[14px] sm:text-[16px] leading-[1.45] tracking-[-0.03em] text-black/85">
              {project.description}
            </p>

            <div className="mt-5 sm:mt-10 flex flex-wrap items-center gap-3">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Découvrir ${project.title} sur Pixiatech`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 hover:scale-105"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <div className="flex flex-wrap items-center gap-1.5">
                {project.tags.map((tag) =>
                  tag.url ? (
                    <a
                      key={tag.title}
                      href={tag.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pxt-label inline-flex h-8 items-center rounded-full bg-[#eeeeee] px-4 text-black transition-colors duration-200 hover:bg-[#e2e2e2]"
                    >
                      {tag.title}
                    </a>
                  ) : (
                    <span
                      key={tag.title}
                      className="pxt-label inline-flex h-8 items-center rounded-full bg-[#eeeeee] px-4 text-black"
                    >
                      {tag.title}
                    </span>
                  )
                )}

                {project.awards && (
                  <span
                    className="ml-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#d9a441]"
                    title={`${project.awards} awards`}
                  >
                    <Award className="h-4 w-4" />
                    <span>{project.awards} awards</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex w-full items-center gap-6 border-t border-black/10 pt-4 sm:pt-5">
            {prevProject && (
              <button
                type="button"
                onClick={() => onNavigate(prevProject.slug)}
                className="pxt-label cursor-pointer text-black/50 transition-colors hover:text-black focus:outline-none"
              >
                ← {prevProject.title}
              </button>
            )}
            {nextProject && (
              <button
                type="button"
                onClick={() => onNavigate(nextProject.slug)}
                className="pxt-label ml-auto cursor-pointer text-black/50 transition-colors hover:text-black focus:outline-none"
              >
                {nextProject.title} →
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Seamless Infinite Vertical Circular Gallery (1 -> 2 -> 3 -> 4 -> 1 -> ...) */}
        <div
          ref={viewportRef}
          data-infinite-gallery="true"
          data-capture-count={captures.length}
          className="relative mx-6 min-h-0 flex-1 touch-none select-none overflow-hidden sm:mx-10 lg:ml-6 lg:mr-24"
          aria-label={`Galerie infinie ${project.title}`}
        >
          {virtualSlots.map((slot, idx) => (
            <div
              key={slot.slotKey}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              data-capture-index={slot.captureIndex}
              className="absolute left-0 right-0 top-0 overflow-hidden rounded-[14px] bg-[#f4f4f4] will-change-transform sm:rounded-[16px]"
            >
              <img
                src={slot.src}
                alt={`${project.title} — ${
                  CAPTURE_LABELS[slot.captureIndex] || `Capture ${slot.captureIndex + 1}`
                }`}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </article>

      {/* Peeking Next Project Sheet Edge */}
      {nextProject && (
        <button
          type="button"
          data-cms-ignore="true"
          data-cms-ui="true"
          onClick={() => onNavigate(nextProject.slug)}
          aria-label={`Projet suivant : ${nextProject.title}`}
          className="hidden lg:block fixed inset-y-6 right-0 w-7 translate-x-1 cursor-pointer rounded-l-[20px] bg-white/30 transition-all duration-300 hover:w-10 hover:bg-white/55 focus:outline-none z-[251]"
        />
      )}
    </div>,
    document.body
  );
}
