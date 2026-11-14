'use client';

import React, { useEffect, useRef } from 'react';
import { useUnreadCount } from '@/hooks/use-unread-count';

type DynamicFaviconProps = {
  /** Nombre total de notifications non lues à afficher (optionnel, utilise useUnreadCount par défaut) */
  count?: number;
  /** Chemin du favicon original (optionnel) */
  baseHref?: string;
  /** Nombre maximal affiché (99+ par défaut) */
  maxDisplayed?: number;
};

/**
 * Composant React qui modifie dynamiquement le favicon de l'onglet :
 * - Superpose un badge rouge élégant sur l'icône du site quand il y a des notifications non lues.
 * - Restaure instantanément le favicon d'origine dès que les notifications tombent à 0.
 */
export function DynamicFavicon({
  count,
  baseHref,
  maxDisplayed = 99,
}: DynamicFaviconProps) {
  const unread = useUnreadCount();
  const effectiveCount = typeof count === 'number' ? count : (unread?.total || 0);
  const originalFaviconRef = useRef<string | null>(null);

  useEffect(() => {
    // Récupérer le lien favicon existant dans le DOM
    const link = (document.querySelector("link[rel*='icon']") ||
      document.querySelector("link[rel='shortcut icon']")) as HTMLLinkElement | null;
    if (!link) return;

    // Sauvegarder le favicon d'origine dès la première exécution (tant qu'il n'est pas une Data URL)
    if (!originalFaviconRef.current) {
      if (baseHref) {
        originalFaviconRef.current = baseHref;
      } else if (link.href && !link.href.startsWith('data:')) {
        originalFaviconRef.current = link.href;
      } else {
        originalFaviconRef.current = '/favicon.png';
      }
    }

    const defaultHref = baseHref || originalFaviconRef.current || '/favicon.png';

    // 0 notification non lue -> Restaurer IMMÉDIATEMENT le favicon d'origine du site
    if (effectiveCount <= 0) {
      if (link.href !== defaultHref) {
        link.href = defaultHref;
      }
      return;
    }

    const displayedText = effectiveCount > maxDisplayed ? '99+' : String(effectiveCount);

    // Dessiner le badge sur le canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fonction pour dessiner le badge rouge avec le nombre
    const drawBadge = () => {
      const isLarge = displayedText.length > 1;
      const badgeRadius = isLarge ? 8 : 7;
      const badgeX = isLarge ? 22 : 23;
      const badgeY = 9;

      // Cercle rouge de notification
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Bordure blanche fine pour détacher le badge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Texte du chiffre
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${isLarge ? 9 : 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayedText, badgeX, badgeY + 0.5);

      link.href = canvas.toDataURL('image/png');
    };

    // Tenter de charger le favicon d'origine pour superposer le badge par-dessus
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(img, 0, 0, 32, 32);
      drawBadge();
    };
    img.onerror = () => {
      // Fallback si l'image ne charge pas : fond sombre + badge
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();
      drawBadge();
    };
    img.src = defaultHref;
  }, [effectiveCount, baseHref, maxDisplayed]);

  return null;
}

