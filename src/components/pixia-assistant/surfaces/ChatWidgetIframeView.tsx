'use client';

import { useEffect, useState } from 'react';
import { resolveLanguage } from '../core/i18n/translations';
import type { BootstrapPayload } from '../core/types';
import { PixiaChatWorkspace } from '../features/pixia-bot/PixiaChatWorkspace';
import { fetchBootstrap } from '../services/pixia-api';
import { notifyIframeParentClose } from './pixia-events';

export function ChatWidgetIframeView() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = new URLSearchParams(window.location.search);
  const lang = resolveLanguage(search.get('lang'));

  useEffect(() => {
    fetchBootstrap()
      .then(setBootstrap)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load'));
  }, []);

  if (error) {
    return (
      <div className="p-6 text-sm text-[#FB7185] bg-[#17171A] h-screen">
        {error}
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="p-6 text-sm text-[#A1A1AA] bg-[#17171A] h-screen">
        {lang === 'fr' ? 'Chargement de Assistant Bot Pixia…' : 'Loading Assistant Bot Pixia…'}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#17171A]">
      <PixiaChatWorkspace
        bootstrap={bootstrap}
        initialLang={lang}
        compact
        onClose={notifyIframeParentClose}
      />
    </div>
  );
}
