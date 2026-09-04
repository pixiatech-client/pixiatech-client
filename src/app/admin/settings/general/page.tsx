'use client';

import { useEffect, useState } from 'react';
import { getSettings } from '@/app/admin/actions';
import { SettingsForm } from '../settings-form';
import type { Settings as AppSettings } from '@/lib/types';
import LiquidLoader from '@/components/LiquidLoader';

export default function GeneralSettingsPage() {
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

  return <SettingsForm initialSettings={settings} section="general" />;
}
