'use client';

import { useEffect } from 'react';
import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
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

  useEffect(() => {
    setLocale(lang);
  }, [lang, setLocale]);

  const handleClose = () => {
    // Send message to WordPress parent page to close the widget popup
    if (typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'close-chatbot' }, '*');
    }
  };

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
