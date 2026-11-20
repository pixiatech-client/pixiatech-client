'use client';

/**
 * FullscreenToggle — Bouton plein écran autonome et réutilisable.
 *
 * Usage minimal :
 *   <FullscreenToggle />
 *
 * Usage avec classes personnalisées :
 *   <FullscreenToggle className="h-10 w-10 rounded-lg bg-white" />
 *
 * Usage avec tooltip personnalisé :
 *   <FullscreenToggle labelEnter="Plein écran" labelExit="Quitter" />
 *
 * Compatible : Next.js, React 18+, Tailwind CSS.
 * Dépendances : aucune (SVG custom inline — aucune lib externe requise).
 * Copier-coller friendly : aucune dépendance interne au projet.
 */

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Icône 4 coins "expand" — style viewfinder / cadre photo.
 * Les coins pointent vers l'extérieur (entrer en plein écran).
 */
function IconExpand({ size = 20, className = '' }: { size?: number; className?: string }) {
  const s = 5; // longueur des branches en L
  const p = 3; // padding depuis le bord du SVG
  const dim = 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Coin haut-gauche */}
      <path d={`M ${p + s} ${p} L ${p} ${p} L ${p} ${p + s}`} />
      {/* Coin haut-droit */}
      <path d={`M ${dim - p - s} ${p} L ${dim - p} ${p} L ${dim - p} ${p + s}`} />
      {/* Coin bas-gauche */}
      <path d={`M ${p} ${dim - p - s} L ${p} ${dim - p} L ${p + s} ${dim - p}`} />
      {/* Coin bas-droit */}
      <path d={`M ${dim - p} ${dim - p - s} L ${dim - p} ${dim - p} L ${dim - p - s} ${dim - p}`} />
    </svg>
  );
}

/**
 * Icône 4 coins "compress" — style viewfinder inversé.
 * Les coins pointent vers l'intérieur (quitter le plein écran).
 */
function IconCompress({ size = 20, className = '' }: { size?: number; className?: string }) {
  const s = 5;
  const p = 3;
  const dim = 20;
  const m = p + s; // point d'ancrage intérieur
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Coin haut-gauche (pointe vers l'intérieur ↘) */}
      <path d={`M ${p} ${m} L ${m} ${m} L ${m} ${p}`} />
      {/* Coin haut-droit (pointe vers l'intérieur ↙) */}
      <path d={`M ${dim - p} ${m} L ${dim - m} ${m} L ${dim - m} ${p}`} />
      {/* Coin bas-gauche (pointe vers l'intérieur ↗) */}
      <path d={`M ${p} ${dim - m} L ${m} ${dim - m} L ${m} ${dim - p}`} />
      {/* Coin bas-droit (pointe vers l'intérieur ↖) */}
      <path d={`M ${dim - p} ${dim - m} L ${dim - m} ${dim - m} L ${dim - m} ${dim - p}`} />
    </svg>
  );
}

export interface FullscreenToggleProps {
  /** Classes Tailwind supplémentaires appliquées au bouton */
  className?: string;
  /** Taille de l'icône en px (défaut : 20) */
  iconSize?: number;
  /** Tooltip affiché en mode normal */
  labelEnter?: string;
  /** Tooltip affiché en mode plein écran */
  labelExit?: string;
  /** Élément DOM cible (défaut : document.documentElement = page entière) */
  target?: () => Element;
  /** Callback déclenché à chaque changement d'état */
  onChange?: (isFullscreen: boolean) => void;
}

export function FullscreenToggle({
  className,
  iconSize = 20,
  labelEnter = 'Plein écran',
  labelExit = 'Quitter le plein écran',
  target,
  onChange,
}: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synchronise l'état avec les changements natifs (touche Échap, etc.)
  useEffect(() => {
    const onFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      onChange?.(active);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [onChange]);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = target ? target() : document.documentElement;
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [target]);

  const label = isFullscreen ? labelExit : labelEnter;

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={isFullscreen}
      className={[
        // Styles par défaut — surchargeable via className
        'group relative flex items-center justify-center',
        'h-11 w-11 rounded-xl',
        'bg-white hover:bg-gray-100',
        'shadow-sm transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isFullscreen ? (
        <IconCompress
          size={iconSize}
          className="text-gray-500 group-hover:text-purple-500 transition-colors"
        />
      ) : (
        <IconExpand
          size={iconSize}
          className="text-gray-500 group-hover:text-purple-500 transition-colors"
        />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}
