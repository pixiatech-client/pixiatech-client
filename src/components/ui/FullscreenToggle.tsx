'use client';

/**
 * FullscreenToggle — Bouton plein écran autonome et réutilisable.
 *
 * Usage minimal :
 *   <FullscreenToggle />
 *
 * Usage avec couleur de survol personnalisée :
 *   <FullscreenToggle hoverColor="#FF2E93" />
 *
 * Compatible : Next.js, React 18+, Tailwind CSS.
 * Dépendances : aucune (SVG custom inline — zéro lib externe).
 * Copier-coller friendly : aucune dépendance interne au projet.
 */

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Icône 4 coins "expand" — style viewfinder / cadre photo.
 * Les coins pointent vers l'extérieur (entrer en plein écran).
 * Un réticule central s'allume au survol ("dans lui une couleur").
 */
function IconExpand({
  size = 20,
  strokeColor,
  isHovered,
}: {
  size?: number;
  strokeColor: string;
  isHovered: boolean;
}) {
  const s = 5; // longueur des branches en L
  const p = 3; // padding depuis le bord du SVG
  const dim = 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
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

      {/* Point de visée central à l'intérieur du cadre ("dans lui") */}
      <circle
        cx="10"
        cy="10"
        r="1.5"
        fill={strokeColor}
        stroke="none"
        style={{
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'scale(1)' : 'scale(0.5)',
          transformOrigin: 'center',
        }}
      />
    </svg>
  );
}

/**
 * Icône 4 coins "compress" — style viewfinder inversé.
 * Les coins pointent vers l'intérieur (quitter le plein écran).
 * Un réticule central s'allume au survol ("dans lui une couleur").
 */
function IconCompress({
  size = 20,
  strokeColor,
  isHovered,
}: {
  size?: number;
  strokeColor: string;
  isHovered: boolean;
}) {
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
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
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

      {/* Point de visée central à l'intérieur du cadre ("dans lui") */}
      <circle
        cx="10"
        cy="10"
        r="1.5"
        fill={strokeColor}
        stroke="none"
        style={{
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'scale(1)' : 'scale(0.5)',
          transformOrigin: 'center',
        }}
      />
    </svg>
  );
}

export interface FullscreenToggleProps {
  /** Classes Tailwind supplémentaires appliquées au bouton */
  className?: string;
  /** Taille de l'icône en px (défaut : 20) */
  iconSize?: number;
  /** Couleur au survol — distincte des autres boutons du header (défaut : #FF2E93 Rose Néon / Fuchsia Laser) */
  hoverColor?: string;
  /** Couleur par défaut au repos (défaut : #9CA3AF gris) */
  defaultColor?: string;
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
  className = '',
  iconSize = 20,
  hoverColor = '#FF2E93', // Rose Fuchsia Néon unique & éclatant (différent de bleu, indigo, vert et orange)
  defaultColor = '#9CA3AF',
  labelEnter = 'Plein écran',
  labelExit = 'Quitter le plein écran',
  target,
  onChange,
}: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  const activeColor = isHovered ? hoverColor : defaultColor;

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={label}
      aria-label={label}
      aria-pressed={isFullscreen}
      className={[
        'group relative flex items-center justify-center',
        'h-11 w-11 rounded-xl',
        'bg-white shadow-sm transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        boxShadow: isHovered
          ? `0 0 14px rgba(255, 46, 147, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)`
          : undefined,
        borderColor: isHovered ? 'rgba(255, 46, 147, 0.35)' : undefined,
      }}
    >
      {isFullscreen ? (
        <IconCompress
          size={iconSize}
          strokeColor={activeColor}
          isHovered={isHovered}
        />
      ) : (
        <IconExpand
          size={iconSize}
          strokeColor={activeColor}
          isHovered={isHovered}
        />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}
