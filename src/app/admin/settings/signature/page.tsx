'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { SignatureForm } from './signature-form';
import LiquidLoader from '@/components/LiquidLoader';

export default function SignatureSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const s = await getSettings();
        setSettings(s);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LiquidLoader size={32} />
      </div>
    );
  }

  return <SignatureForm initialSettings={settings!} />;
}
