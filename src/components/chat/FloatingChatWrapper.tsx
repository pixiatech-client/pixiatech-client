'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations } from '@/app/actions/public-actions';
import type { Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';

// Le robot PixiaTech ne doit jamais apparaître sur les pages d'authentification /
// de validation du compte. Il reste actif sur la boutique et les pages générales.
const EXCLUDED_PATHS = [
  '/boutique/paiement',
  '/admin',
  '/embed',
  '/chat-widget',
  '/mon-compte/connexion',
  '/mon-compte/valider',
];

export function FloatingChatWrapper() {
  const pathname = usePathname();
  const [data, setData] = useState<{
    allProducts: Product[];
    settings: Settings;
    laborSettings: LaborSettings;
    deliverySettings: DeliverySettings;
    locations: Locations | null;
  } | null>(null);
  const [shifted, setShifted] = useState(false);

  const shouldShow = !EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const onShow = () => setShifted(true);
    const onHide = () => setShifted(false);
    window.addEventListener('pixia:overlay-open', onShow);
    window.addEventListener('pixia:overlay-close', onHide);
    return () => {
      window.removeEventListener('pixia:overlay-open', onShow);
      window.removeEventListener('pixia:overlay-close', onHide);
    };
  }, []);

  useEffect(() => {
    if (!shouldShow || data) return;

    let cancelled = false;
    (async () => {
      try {
        const [settings, deliverySettings, laborSettings, productsResult, locations] = await Promise.all([
          getSettings(),
          getDeliverySettings(),
          getLaborSettings(),
          getProducts({ limit: 1000 }),
          getLocations(),
        ]);
        if (!cancelled) {
          setData({
            allProducts: productsResult.products,
            settings,
            laborSettings,
            deliverySettings,
            locations,
          });
        }
      } catch (error) {
        console.error('Failed to load shop data for chatbot:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [shouldShow, data]);

  if (!shouldShow || !data) return null;

  if (data.settings.isWizardBotEnabled === false) return null;

  return (
    <FloatingChatButton
      allProducts={data.allProducts}
      settings={data.settings}
      laborSettings={data.laborSettings}
      deliverySettings={data.deliverySettings}
      locations={data.locations}
      shifted={shifted}
    />
  );
}
