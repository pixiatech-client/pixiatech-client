'use client';

import { useEffect, useState } from 'react';
// Enregistre la source de bootstrap réelle avant toute résolution de la bascule.
import '@/components/chat/pixia-bootstrap-loader';
import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
import { ChatWidgetIframeView } from '@/components/pixia-assistant/surfaces/ChatWidgetIframeView';
import {
  isNewPixiaAssistantAvailable,
  resolvePixiaBootstrap,
} from '@/components/chat/pixia-assistant-switch';
import type { BootstrapPayload } from '@/components/pixia-assistant/core/types';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface ChatWidgetClientProps {
  settings: Settings;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
  allProducts: Product[];
  locations: Locations | null;
  lang: 'fr' | 'en';
}

export function ChatWidgetClient({ settings, deliverySettings, laborSettings, allProducts, locations, lang }: ChatWidgetClientProps) {
  const { setLocale } = useI18n();
  const [newBootstrap, setNewBootstrap] = useState<BootstrapPayload | null>(null);
  const [bootstrapChecked, setBootstrapChecked] = useState(
    () => !isNewPixiaAssistantAvailable()
  );

  useEffect(() => {
    setLocale(lang);
  }, [lang, setLocale]);

  // Le widget WordPress reste sur le parcours historique tant qu'aucun bootstrap
  // réel n'a été résolu. `ChatWidgetIframeView` n'a pas de fallback fictif.
  useEffect(() => {
    if (!isNewPixiaAssistantAvailable()) {
      setBootstrapChecked(true);
      return;
    }

    let cancelled = false;
    setBootstrapChecked(false);
    resolvePixiaBootstrap().then((bootstrap) => {
      if (!cancelled) {
        setNewBootstrap(bootstrap);
        setBootstrapChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    // Send message to WordPress parent page to close the widget popup
    if (typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'close-chatbot' }, '*');
    }
  };

  if (!bootstrapChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#17171A] text-sm text-[#A1A1AA]">
        {lang === 'fr' ? 'Chargement de Assistant Bot Pixia…' : 'Loading Assistant Bot Pixia…'}
      </div>
    );
  }

  if (newBootstrap) {
    return <ChatWidgetIframeView bootstrap={newBootstrap} />;
  }

  return (
    <WizardBotFlow
      onClose={handleClose}
      allProducts={allProducts}
      settings={settings}
      laborSettings={laborSettings}
      deliverySettings={deliverySettings}
      locations={locations}
    />
  );
}
