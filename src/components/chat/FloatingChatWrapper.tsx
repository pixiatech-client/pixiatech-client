'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { FloatingChatWidget } from '@/components/pixia-assistant/surfaces/FloatingChatWidget';
import {
  isNewPixiaAssistantAvailable,
  resolvePixiaBootstrap,
} from '@/components/chat/pixia-assistant-switch';
import type { BootstrapPayload, Language } from '@/components/pixia-assistant/core/types';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations } from '@/app/actions/public-actions';
import type { Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

// Le robot PixiaTech ne doit jamais apparaître dans l'espace utilisateur
// (mon-compte entier : authentification, tableau de bord, commandes, factures…),
// ni sur les paiements, l'admin ou les pages embarquées.
const EXCLUDED_PATHS = [
  '/boutique/paiement',
  '/boutique/commande',
  '/admin',
  '/embed',
  '/chat-widget',
  '/mon-compte',
];

// Cache client persistant entre les navigations pour éviter de relancer
// 5 Server Actions lourdes à chaque changement de page.
let _clientCachedShopData: {
  allProducts: Product[];
  settings: Settings;
  laborSettings: LaborSettings;
  deliverySettings: DeliverySettings;
  locations: Locations | null;
} | null = null;
let _clientLoadPromise: Promise<typeof _clientCachedShopData> | null = null;

export function FloatingChatWrapper() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const initialLang: Language = locale === 'en' ? 'en' : 'fr';
  const [newBootstrap, setNewBootstrap] = useState<BootstrapPayload | null>(null);
  const [bootstrapChecked, setBootstrapChecked] = useState(
    () => !isNewPixiaAssistantAvailable()
  );
  const [data, setData] = useState<{
    allProducts: Product[];
    settings: Settings;
    laborSettings: LaborSettings;
    deliverySettings: DeliverySettings;
    locations: Locations | null;
  } | null>(_clientCachedShopData);
  const [shifted, setShifted] = useState(false);

  const shouldShow = !EXCLUDED_PATHS.some((p) => pathname.startsWith(p));
  const elevated = pathname.startsWith('/web');

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

  // Résolution de la source réelle : tant qu'elle échoue (état actuel), le
  // composant historique reste le seul rendu. Aucune donnée de démonstration
  // ne peut traverser `resolvePixiaBootstrap`.
  useEffect(() => {
    if (!shouldShow) {
      setNewBootstrap(null);
      setBootstrapChecked(false);
      return;
    }
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
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    if (_clientCachedShopData) {
      if (!data) setData(_clientCachedShopData);
      return;
    }

    let cancelled = false;
    if (!_clientLoadPromise) {
      _clientLoadPromise = (async () => {
        try {
          const [settings, deliverySettings, laborSettings, productsResult, locations] = await Promise.all([
            getSettings(),
            getDeliverySettings(),
            getLaborSettings(),
            getProducts({ limit: 1000 }),
            getLocations(),
          ]);
          const loaded = {
            allProducts: productsResult.products,
            settings,
            laborSettings,
            deliverySettings,
            locations,
          };
          _clientCachedShopData = loaded;
          return loaded;
        } catch (error) {
          console.error('Failed to load shop data for chatbot:', error);
          _clientLoadPromise = null;
          return null;
        }
      })();
    }

    _clientLoadPromise.then((loaded) => {
      if (!cancelled && loaded) {
        setData(loaded);
      }
    });

    return () => { cancelled = true; };
  }, [shouldShow, data]);

  if (!shouldShow || !bootstrapChecked) return null;

  // Bascule effective : un seul assistant est monté à la fois. Le nouveau
  // n'apparaît que si un bootstrap réel a été résolu.
  if (newBootstrap && newBootstrap.settings.isWizardBotEnabled !== false) {
    return (
      <FloatingChatWidget
        bootstrap={newBootstrap}
        currentPathname={pathname}
        initialLang={initialLang}
      />
    );
  }

  if (!data) return null;

  if (data.settings.isWizardBotEnabled === false) return null;

  return (
    <FloatingChatButton
      allProducts={data.allProducts}
      settings={data.settings}
      laborSettings={data.laborSettings}
      deliverySettings={data.deliverySettings}
      locations={data.locations}
      shifted={shifted}
      elevated={elevated}
    />
  );
}
