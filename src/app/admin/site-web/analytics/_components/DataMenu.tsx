'use client';

import React, { useState } from 'react';
import { Database, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetAnalyticsData, seedAnalyticsData } from './analytics-api';

interface DataMenuProps {
  t: (key: string, params?: Record<string, string | number>) => string;
  onChanged: () => void;
}

export default function DataMenu({ t, onChanged }: DataMenuProps) {
  const g = (k: string, params?: Record<string, string | number>) => t(`admin.siteWeb.analytics.${k}`, params);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'seed' | 'reset' | null>(null);

  const run = async (mode: 'seed' | 'reset') => {
    setBusy(mode);
    try {
      if (mode === 'seed') {
        const r = await seedAnalyticsData();
        toast.success(g('seedDone', { count: r.sessions }));
      } else {
        const r = await resetAnalyticsData();
        toast.success(g('resetDone', { sessions: r.sessionsDeleted }));
      }
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <Database className="h-3.5 w-3.5" />
        {g('dataMenuTitle')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-2xl z-30 p-2 space-y-1">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run('seed')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {busy === 'seed' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> : <Database className="h-3.5 w-3.5 text-emerald-500" />}
              {g('seedTitle')}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run('reset')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {busy === 'reset' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />}
              {g('resetTitle')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}