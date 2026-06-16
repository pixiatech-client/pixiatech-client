'use client';

import { useEffect, useState } from 'react';
import { getSettings } from '@/app/admin/actions';
import { SettingsForm } from '../settings-form';
import type { Settings as AppSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function MessagingSettingsPage() {
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
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return <SettingsForm initialSettings={settings} section="messaging" />;
}
