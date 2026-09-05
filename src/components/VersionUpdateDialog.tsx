'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { APP_VERSION } from '@/lib/build-info';
import { isVersionNewer } from '@/lib/version';
import {
  resetApplication,
  type ResetStep,
  type StepStatus,
  type StepEvent,
} from '@/lib/reset-application';
import LiquidLoader from '@/components/LiquidLoader';

const UPDATE_STEPS: ResetStep[] = ['caches', 'storage', 'session', 'reload'];

export function VersionUpdateDialog() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [latestSignature, setLatestSignature] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissedUntilRef = useRef<number>(0);
  const checkingRef = useRef(false);

  const [stepStates, setStepStates] = useState<Record<ResetStep, { status: StepStatus; error?: string }>>({
    caches: { status: 'pending' },
    storage: { status: 'pending' },
    session: { status: 'pending' },
    reload: { status: 'pending' },
  });

  const checkVersion = useCallback(async () => {
    if (checkingRef.current || isUpdating) return;
    checkingRef.current = true;
    try {
      const res = await fetch('/api/app/version', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = String(data.version || '');
      const serverSignature = String(data.signature || '');

      if (isVersionNewer(serverVersion, APP_VERSION)) {
        setLatestVersion(serverVersion);
        setLatestSignature(serverSignature);

        // Si l'utilisateur n'a pas reporté temporairement
        if (Date.now() > dismissedUntilRef.current) {
          setIsOpen(true);
        }
      }
    } catch {
      /* réseau temporairement indisponible */
    } finally {
      checkingRef.current = false;
    }
  }, [isUpdating]);

  useEffect(() => {
    // Premier check après 3s
    const initialTimer = setTimeout(() => {
      checkVersion();
    }, 3000);

    // Intervalle régulier de 60s
    const interval = setInterval(() => {
      checkVersion();
    }, 60000);

    // Vérification lorsque l'onglet redevient actif
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setError(null);

    setStepStates({
      caches: { status: 'pending' },
      storage: { status: 'pending' },
      session: { status: 'pending' },
      reload: { status: 'pending' },
    });

    try {
      await resetApplication(
        {
          radical: false,
          disconnect: true,
          targetSignature: latestSignature || undefined,
        },
        ({ step, status, error: stepErr }: StepEvent) => {
          setStepStates((prev) => ({
            ...prev,
            [step]: { status, error: stepErr },
          }));
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[VersionUpdateDialog] Erreur pendant la mise à jour:', err);
      setError(msg);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    // Reporter de 5 minutes
    dismissedUntilRef.current = Date.now() + 5 * 60 * 1000;
    setIsOpen(false);
  };

  if (!latestVersion) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (isUpdating) return;
        if (!nextOpen) handleDismiss();
        else setIsOpen(true);
      }}
    >
      <DialogContent
        className="max-w-md border-blue-200 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-blue-900/50 dark:bg-slate-900/95 sm:rounded-2xl"
        onPointerDownOutside={(e) => {
          if (isUpdating) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {t('admin.updatePopup.title') || 'Nouvelle mise à jour disponible !'}
              </DialogTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  v{APP_VERSION}
                </span>
                <span className="text-xs text-slate-400">→</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  v{latestVersion}
                </span>
              </div>
            </div>
          </div>
          <DialogDescription className="pt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t('admin.updatePopup.subtitle') ||
              'Une nouvelle version de l’application est disponible. Faites-la tout de suite pour profiter des dernières nouveautés et corrections.'}
          </DialogDescription>
        </DialogHeader>

        {/* Détails de ce qui va se passer */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <p className="font-semibold">
            {t('admin.updatePopup.actionNotice') ||
              'En cliquant ci-dessous, vous allez être déconnecté, les caches seront vidés et l’application sera mise à jour.'}
          </p>
        </div>

        {/* Liste des étapes pendant l'exécution */}
        {isUpdating && (
          <div className="flex flex-col gap-2 py-1" role="status" aria-live="polite">
            {UPDATE_STEPS.map((step, i) => {
              const state = stepStates[step] || { status: 'pending' };
              const { status } = state;
              const isDone = status === 'completed';
              const isActive = status === 'running';
              const isError = status === 'error';

              const stepLabels: Record<ResetStep, string> = {
                caches: t('admin.updatePopup.stepCaches') || 'Vidage des caches navigateur',
                storage: t('admin.updatePopup.stepStorage') || 'Nettoyage du stockage local',
                session: t('admin.updatePopup.stepSession') || 'Déconnexion et purge de session',
                reload: t('admin.updatePopup.stepReload') || 'Chargement de la nouvelle version',
              };

              return (
                <div
                  key={step}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition-all duration-200',
                    isDone && 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200',
                    isActive && 'border-blue-300 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-400/30 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
                    isError && 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200',
                    !isDone && !isActive && !isError && 'border-slate-200/60 bg-slate-50/40 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-all',
                        isDone && 'bg-emerald-600 text-white',
                        isActive && 'bg-blue-600 text-white',
                        isError && 'bg-rose-600 text-white',
                        !isDone && !isActive && !isError && 'border border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                      )}
                    >
                      {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : isActive ? <LiquidLoader size={12} /> : i + 1}
                    </span>
                    <span className="font-medium">{stepLabels[step]}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {t(`admin.reset.status.${status}`) || status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {!isUpdating && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {t('admin.updatePopup.later') || 'Plus tard'}
            </Button>
          )}

          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 sm:flex-none"
          >
            {isUpdating ? (
              <>
                <LiquidLoader size={16} />
                <span className="ml-2">
                  {t('admin.updatePopup.updating') || 'Mise à jour en cours…'}
                </span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('admin.updatePopup.updateNow') || 'Mettre à jour tout de suite'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
