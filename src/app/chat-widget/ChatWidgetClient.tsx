'use client';

import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations } from '@/lib/types';

interface ChatWidgetClientProps {
  settings: Settings;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
  allProducts: Product[];
  locations: Locations | null;
}

export function ChatWidgetClient({ settings, deliverySettings, laborSettings, allProducts, locations }: ChatWidgetClientProps) {
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
