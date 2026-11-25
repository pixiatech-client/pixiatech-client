'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { loadPixiaBootstrap } from '@/components/chat/pixia-bootstrap-loader';
import { FloatingChatWidget } from '@/components/pixia-assistant/surfaces/FloatingChatWidget';
import type { BootstrapPayload, Language } from '@/components/pixia-assistant/core/types';
import { useI18n } from '@/lib/i18n';

// Le robot PixiaTech ne doit jamais apparaître dans l'espace utilisateur
// (mon-compte entier : authentification, tableau de bord, commandes, factures…),
// ni sur les paiements, les commandes ou l'administration.
const EXCLUDED_PATHS = [
  '/boutique/paiement',
  '/boutique/commande',
  '/admin',
  '/mon-compte',
];

/**
 * Point d'entrée unique de l'Assistant Bot Pixia dans l'application.
 *
 * Le bootstrap provient exclusivement des services PixiaTech réels via la
 * Server Action. Aucune bascule, aucun assistant de repli, aucune donnée de
 * démonstration : un bootstrap absent ou invalide signifie simplement que le
 * widget n'est pas monté.
 */
export function FloatingChatWrapper() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const initialLang: Language = locale === 'en' ? 'en' : 'fr';
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [resolved, setResolved] = useState(false);

  const shouldShow = !EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!shouldShow) {
      setBootstrap(null);
      setResolved(false);
      return;
    }

    let cancelled = false;
    setResolved(false);
    loadPixiaBootstrap().then((loaded) => {
      if (!cancelled) {
        setBootstrap(loaded);
        setResolved(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shouldShow]);

  if (
    !shouldShow ||
    !resolved ||
    !bootstrap ||
    bootstrap.settings.isWizardBotEnabled === false
  ) {
    return null;
  }

  return (
    <FloatingChatWidget
      bootstrap={bootstrap}
      currentPathname={pathname}
      initialLang={initialLang}
    />
  );
}
