'use client';

import React, { useEffect } from 'react';
import { useUnreadCount } from '@/hooks/use-unread-count';

type DynamicFaviconProps = {
  /** Nombre total de notifications non lues à afficher (optionnel, utilise useUnreadCount par défaut) */
  count?: number;
  /** Chemin du favicon original (par défaut /favicon.ico) */
  baseHref?: string;
  /** Nombre maximal affiché (99+ par défaut) */
  maxDisplayed?: number;
};

/**
 * Composant React qui modifie dynamiquement le favicon de l'onglet.
 *
 * Fonctionnalités :
 * - Affiche un badge numérique rouge lorsqu'il y a des notifications non lues.
 * - Affiche "99+" si le nombre dépasse maxDisplayed.
 * - Restaure le favicon original lorsque le compteur retombe à 0.
 * - Fonctionne sur Chrome, Brave, Edge (canvas Data URL).
 * - Se met à jour réactivement quand le count change.
 */
export function DynamicFavicon({
  count,
  baseHref = '/favicon.ico',
  maxDisplayed = 99,
}: DynamicFaviconProps) {
  const unread = useUnreadCount();
  const effectiveCount = typeof count === 'number' ? count : (unread?.total || 0);

  useEffect(() => {
    // Sélectionne le lien favicon existant
    const link = (document.querySelector("link[rel*='icon']") || document.querySelector("link[rel='shortcut icon']")) as HTMLLinkElement | null;

    if (effectiveCount === 0) {
      // Restaure le favicon original
      if (link && link.href !== baseHref) {
        link.href = baseHref;
      }
      return;
    }

    const displayedCount = effectiveCount > maxDisplayed ? '99+' : effectiveCount;

    // Crée un canvas avec le badge
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond badge rouge
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fill();

    // Texte chiffre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(displayedCount), 16, 16);

    // Remplace le favicon par une Data URL
    if (link) {
      link.href = canvas.toDataURL('image/png');
    }
  }, [effectiveCount, baseHref, maxDisplayed]);

  return null;
}
