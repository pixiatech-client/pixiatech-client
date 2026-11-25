'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ConfigState, Language } from '../../../core/types';

interface AiCatalogCommandPaletteProps {
  lang: Language;
  configState: ConfigState;
}

/**
 * Automatic non-interactive AI search bar shown for ~2s while compatible LED
 * screens are retrieved. No clickable "Lancer" button and no extra list below.
 */
export function AiCatalogCommandPalette({
  lang,
  configState,
}: AiCatalogCommandPaletteProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = window.setTimeout(() => setPhase(1), 650);
    const t2 = window.setTimeout(() => setPhase(2), 1350);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const pitchText = `P${configState.pixelPitch ?? 2.5}`;
  const sizeText = `${configState.width ?? 4}×${configState.height ?? 2.5}m`;

  const statusLabel =
    phase === 0
      ? lang === 'fr'
        ? 'Analyse configuration'
        : 'Analyzing configuration'
      : phase === 1
        ? lang === 'fr'
          ? 'Recherche catalogue'
          : 'Searching catalog'
        : lang === 'fr'
          ? 'Sélection optimale'
          : 'Selecting matches';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      className="relative w-full rounded-[16px] p-[1.5px] shadow-[0_0_28px_rgba(56,189,248,0.2),0_12px_30px_rgba(0,0,0,0.62)]"
    >
      {/* Always-active rotating perimeter light contour (no hover required) */}
      <span aria-hidden="true" className="pixia-thinking-ring z-10" />

      <div className="relative z-0 flex items-center justify-between gap-2.5 rounded-[14.5px] bg-gradient-to-r from-[#1A1A26]/95 via-[#181B29]/95 to-[#16161C]/95 px-2.5 py-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Frosted Sparkles AI Icon Box */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#38BDF8]/55 bg-gradient-to-br from-[#6366F1]/45 via-[#A855F7]/35 to-[#38BDF8]/40 text-white shadow-[0_0_16px_rgba(56,189,248,0.34)]">
            <Sparkles className="h-4 w-4 animate-pulse text-[#BAE6FD]" />
          </span>

          {/* Dynamic Search Text + Highlighted Configuration Query */}
          <div className="min-w-0 flex-1 truncate text-[13px] font-medium">
            <span className="text-[#E4E4E7]">{statusLabel} </span>
            <span className="bg-gradient-to-r from-[#C4B5FD] via-[#7DD3FC] to-[#F5D0FE] bg-clip-text text-transparent font-semibold">
              « {pitchText} · {sizeText} »
            </span>
          </div>
        </div>

        {/* Subtle AI live indicator (no clickable button) */}
        <div className="flex items-center gap-1.5 pr-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider text-[#93C5FD]">AI</span>
        </div>
      </div>
    </motion.div>
  );
}
