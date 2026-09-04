'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, RefreshCw, Rocket } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import { APP_VERSION, BUILD_COMMIT, BUILD_TIME } from '@/lib/build-info';
import { isVersionNewer } from '@/lib/version';
import LiquidLoader from '@/components/LiquidLoader';

interface AboutApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Version réellement installée (bundle chargé). */
  currentVersion: string;
  /** Nouvelle version détectée, si une mise à jour est disponible. */
  newVersion?: string;
  /** Indique qu'une vérification de version est en cours. */
  isChecking: boolean;
  /** Timestamp (ms) de la dernière vérification réussie. */
  lastCheckedAt?: number | null;
  /** True si la dernière vérification a échoué (serveur injoignable). */
  checkFailed?: boolean;
  /** Déclenche une vérification manuelle (réutilise le mécanisme existant). */
  onCheckUpdate: () => void;
  /** Lance la mise à jour via ResetApplicationDialog (mode 'version'). */
  onUpdateNow: () => void;
}

export function AboutApplicationDialog({
  open,
  onOpenChange,
  currentVersion,
  newVersion,
  isChecking,
  lastCheckedAt,
  checkFailed,
  onCheckUpdate,
  onUpdateNow,
}: AboutApplicationDialogProps) {
  const { t, locale } = useI18n();

  // À l'ouverture : n'effectue un check automatique que si l'état partagé est
  // inconnu ou trop ancien (> 60 s). Sinon on réutilise l'état existant
  // (auto-check 60 s déjà en cours). Le bouton "Vérifier" force toujours.
  useEffect(() => {
    if (!open) return;
    const stale = lastCheckedAt == null || Date.now() - lastCheckedAt > 60_000;
    if (stale && !isChecking) onCheckUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateAvailable = isVersionNewer(newVersion, currentVersion);

  const buildDate = (() => {
    try {
      const date = new Date(BUILD_TIME);
      return `${IntlHelpers.formatDate(date, locale, { day: 'numeric', month: 'long', year: 'numeric' })} — ${IntlHelpers.formatDateTime(date, locale)}`;
    } catch {
      return BUILD_TIME;
    }
  })();

  const lastCheckedLabel = lastCheckedAt
    ? `${t('admin.about.lastChecked')} : ${IntlHelpers.formatDate(new Date(lastCheckedAt), locale)} ${IntlHelpers.formatDateTime(new Date(lastCheckedAt), locale)}`
    : '';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isChecking) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-sm border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Info className="h-5 w-5" />
            </span>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('admin.about.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-sm text-slate-600 dark:text-slate-400">
            {t('admin.about.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* ── Informations du build ── */}
        <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="col-span-2 space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('admin.about.appName')}
            </p>
            <p className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">PixiaTech</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('admin.about.version')}
            </p>
            <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{currentVersion}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('admin.about.build')}
            </p>
            <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{BUILD_COMMIT}</p>
          </div>
          <div className="col-span-2 space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('admin.about.buildDate')}
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{buildDate}</p>
          </div>
        </div>

        {/* ── État de la version ── */}
        <div role="status" aria-live="polite">
          {isChecking ? (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-3 text-sm font-semibold text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
              <LiquidLoader size={16} />
              {t('admin.about.checking')}
            </div>
          ) : checkFailed ? (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-3 text-sm font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
              {t('admin.about.serverError')}
            </div>
          ) : updateAvailable ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-3.5 dark:border-amber-700 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-black text-amber-900 dark:text-amber-100">
                  {t('admin.about.newVersionAvailable')}
                </p>
              </div>
              <p className="mt-1 text-xs font-medium text-amber-800/90 dark:text-amber-200/90">
                {t('admin.about.newVersionDesc')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-amber-200 bg-white/60 px-3 py-2 dark:border-amber-800 dark:bg-slate-900/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('admin.about.currentVersion')}
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{currentVersion}</p>
                </div>
                <div className="rounded-lg border border-amber-300 bg-amber-100/60 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-300">
                    {t('admin.about.newVersion')}
                  </p>
                  <p className="font-mono text-sm font-black text-amber-700 dark:text-amber-200">{newVersion}</p>
                </div>
              </div>
              <Button
                onClick={onUpdateNow}
                className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 font-black text-white shadow-sm transition-all hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('admin.about.updateNow')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                  {t('admin.about.upToDate')}
                </p>
                {lastCheckedLabel && (
                  <p className="truncate text-[11px] font-medium text-emerald-800/80 dark:text-emerald-200/80">
                    {lastCheckedLabel}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2.5 pt-1">
          <Button
            variant="outline"
            onClick={onCheckUpdate}
            disabled={isChecking}
            className={cn('rounded-xl')}
          >
            {isChecking ? (
              <>
                <LiquidLoader size={16} />
                {t('admin.about.checking')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('admin.about.checkUpdates')}
              </>
            )}
          </Button>
        </div>

        <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          {t('admin.about.keepData')}
        </p>
      </DialogContent>
    </Dialog>
  );
}