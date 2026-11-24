'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { ARCHIVE_PROJECTS, type ArchiveItem } from '../data/projects';

interface FullArchiveViewProps {
  active: boolean;
  dimmed: boolean;
  onSelectFeatured: (slug: string) => void;
  onClose?: () => void;
}

export function FullArchiveView({
  active,
  dimmed,
  onSelectFeatured,
  onClose,
}: FullArchiveViewProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<ArchiveItem | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, cx: 0, cy: 0, vx: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (active) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [active]);

  useEffect(() => {
    if (!active) {
      setHovered(null);
      return;
    }

    let raf = 0;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      const p = pointerRef.current;
      const prevX = p.cx;
      p.cx += (p.x - p.cx) * 0.14;
      p.cy += (p.y - p.cy) * 0.14;
      p.vx = p.cx - prevX;

      if (previewRef.current) {
        const tilt = prefersReduced ? 0 : Math.max(-6, Math.min(6, p.vx * 0.45));
        previewRef.current.style.transform = `translate3d(${p.cx + 24}px, ${
          p.cy - 96
        }px, 0) rotate(${tilt.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active || !mounted) return null;

  return createPortal(
    <main
      aria-label="Catalogue complet Pixiatech"
      onPointerMove={(e) => {
        pointerRef.current.x = e.clientX;
        pointerRef.current.y = e.clientY;
      }}
      className={`fixed inset-0 z-[250] flex items-center justify-center overflow-y-auto bg-black/92 backdrop-blur-2xl px-6 py-24 sm:px-14 transition-opacity duration-500 ${
        dimmed ? 'pointer-events-none opacity-20' : 'pointer-events-auto opacity-100'
      }`}
      style={{ zIndex: 250 }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la vue complète"
          className="cursor-pointer fixed top-6 right-6 sm:top-10 sm:right-10 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8 sm:gap-y-4">
        {ARCHIVE_PROJECTS.map((item, idx) => {
          const isInternal = Boolean(item.featuredSlug);
          const isMuted = hovered !== null && hovered.slug !== item.slug;

          return (
            <span key={item.slug} className="inline-flex items-center gap-x-6 sm:gap-x-8">
              {isInternal ? (
                <button
                  type="button"
                  onMouseEnter={() => setHovered(item)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(item)}
                  onBlur={() => setHovered(null)}
                  onClick={() => item.featuredSlug && onSelectFeatured(item.featuredSlug)}
                  className={`cursor-pointer whitespace-nowrap text-[20px] sm:text-[30px] font-normal leading-none tracking-[-0.05em] text-white transition-opacity duration-300 focus:outline-none ${
                    isMuted ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {item.title}
                </button>
              ) : (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHovered(item)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(item)}
                  onBlur={() => setHovered(null)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap text-[20px] sm:text-[30px] font-normal leading-none tracking-[-0.05em] text-white transition-opacity duration-300 ${
                    isMuted ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <span>{item.title}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-45" />
                </a>
              )}

              {idx < ARCHIVE_PROJECTS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`text-[7px] text-white/50 transition-opacity duration-300 ${
                    hovered ? 'opacity-20' : 'opacity-55'
                  }`}
                >
                  ●
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Cursor-following floating visual preview for hovered archive row */}
      <div
        ref={previewRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden md:block w-[270px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl transition-opacity duration-300 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ aspectRatio: '16 / 10' }}
      >
        {hovered && (
          <div className="relative h-full w-full">
            <img
              src={hovered.previewImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3.5 pb-2.5 pt-6">
              <span className="text-[12px] font-medium tracking-tight text-white">
                {hovered.title}
              </span>
              {hovered.year && (
                <span className="pxt-label text-white/65">{hovered.year}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </main>,
    document.body
  );
}
