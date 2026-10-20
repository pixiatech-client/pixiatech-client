'use client';

import { useEffect, useState } from 'react';
import { getSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import LiquidLoader from '@/components/LiquidLoader';
import { SiteWebSettingsModule } from './_components/SiteWebSettingsModule';

/**
 * Back-office PixiaTech Web → Paramètres généraux.
 *
 * Page dédiée qui vit DANS l'espace PixiaTech Web (comme Contact, Menu, etc.).
 * Elle réutilise le même système de configuration que le reste de
 * l'administration : lecture via `getSettings()` et écriture via
 * `updateSettings()` (server action existante, doc Firestore `settings/main`).
 * Aucun second stockage n'est introduit.
 */
export default function SiteWebSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LiquidLoader size={32} />
      </div>
    );
  }

  return <SiteWebSettingsModule initialSettings={settings} />;
}
