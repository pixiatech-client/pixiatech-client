'use client';

import { useEffect, useState } from 'react';
import { resolveLanguage } from '../core/i18n/translations';
import type { BootstrapPayload, Language } from '../core/types';
import { PixiaChatWorkspace } from '../features/pixia-bot/PixiaChatWorkspace';
import { notifyIframeParentClose } from './pixia-events';

interface ChatWidgetIframeViewProps {
  /**
   * Bootstrap réel transmis par l'hôte Next.js. Ce composant ne sait pas
   * charger de données lui-même : aucun fallback de démonstration n'est possible.
   */
  bootstrap: BootstrapPayload;
  onClose?: () => void;
}

export function ChatWidgetIframeView({
  bootstrap,
  onClose = notifyIframeParentClose,
}: ChatWidgetIframeViewProps) {
  // Valeur serveur déterministe : la langue de l'iframe est lue après montage.
  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setLang(resolveLanguage(search.get('lang')));
  }, []);

  return (
    <div className="pixia-assistant-root h-screen w-screen bg-[#17171A]">
      <PixiaChatWorkspace
        bootstrap={bootstrap}
        initialLang={lang}
        compact
        onClose={onClose}
      />
    </div>
  );
}
