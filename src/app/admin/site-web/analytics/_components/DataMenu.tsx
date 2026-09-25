'use client';

import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetAnalyticsData } from './analytics-api';

interface DataMenuProps {
  t: (key: string, params?: Record<string, string | number>) => string;
  onChanged: () => void;
}

export default function DataMenu({ t, onChanged }: DataMenuProps) {
  const g = (k: string, params?: Record<string, string | number>) => t(`admin.siteWeb.analytics.${k}`, params);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const runReset = async () => {
    setBusy(true);
    try {
      const r = await resetAnalyticsData();
      toast.success(g('resetDone', { sessions: r.sessionsDeleted }));
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {g('resetTitle')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-2xl z-30 p-2 space-y-1">
            <p className="px-2 py-1 text-[11px] text-neutral-500 dark:text-neutral-400">{g('resetConfirm')}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runReset()}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />}
              {g('resetConfirmAction')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}