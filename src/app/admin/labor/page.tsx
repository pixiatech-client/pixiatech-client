'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLaborSettings } from '@/app/admin/actions';
import { LaborForm } from './_components/labor-form';
import { useAdminT } from '@/hooks/useAdminT';
import type { LaborSettings } from '@/lib/types';

export default function LaborPage() {
  const { t } = useAdminT();
  const [settings, setSettings] = useState<LaborSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    getLaborSettings().then(data => { setSettings(data); setIsLoading(false); });
  }, []);
  if (isLoading || !settings) return null;
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{t('Labor & Installation')}</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          {t('Configure costs and the number of technicians required based on screen area.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <LaborForm initialSettings={settings} />
      </CardContent>
    </Card>
  );
}
