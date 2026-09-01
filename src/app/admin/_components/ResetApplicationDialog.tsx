'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Check, Loader2, RefreshCw, Trash2, Sparkles, AlertCircle } from 'lucide-react';
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
import {
  resetApplication,
  type ResetStep,
  type StepStatus,
  type StepEvent,
} from '@/lib/reset-application';

type Mode = 'manual' | 'version';

const MANUAL_STEPS: ResetStep[] = ['caches', 'storage', 'session', 'reload'];
const VERSION_STEPS: ResetStep[] = ['caches', 'reload'];

interface ResetApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  /** Version actuelle affichée lorsque mode === 'version' */
  currentVersion?: string;
  /** Nouvelle version détectée lorsque mode === 'version' */
  newVersion?: string;
  /** Signature du build cible (évite la boucle de reload en mode "mise à jour") */
  targetSignature?: string;
}

export function ResetApplicationDialog({
  open,
  onOpenChange,
  mode = 'manual',
  currentVersion,
  newVersion,
  targetSignature,
}: ResetApplicationDialogProps) {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const isVersionMode = mode === 'version';
  const displayedSteps = useMemo(
    () => (isVersionMode ? VERSION_STEPS : MANUAL_STEPS),
    [isVersionMode]
  );

  const initialStepStates = useMemo(() => {
    const states: Record<ResetStep, { status: StepStatus; error?: string }> = {
      caches: { status: 'pending' },
      storage: { status: 'pending' },
      session: { status: 'pending' },
      reload: { status: 'pending' },
    };
    return states;
  }, []);

  const [stepStates, setStepStates] = useState(initialStepStates);

  // Réinitialise l'état local du dialogue à chaque ouverture / fermeture
  useEffect(() => {
    if (!open) {
      setRunning(false);
      setOverallError(null);
      setStepStates(initialStepStates);
      runningRef.current = false;
    }
  }, [open, initialStepStates]);

  const handleReset = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setOverallError(null);

    // Initialise toutes les étapes pertinentes en 'pending'
    setStepStates({
      caches: { status: 'pending' },
      storage: { status: 'pending' },
      session: { status: 'pending' },
      reload: { status: 'pending' },
    });

    try {
      await resetApplication(
        {
          radical: !isVersionMode,
          targetSignature: isVersionMode ? targetSignature : undefined,
          redirectTo: '/admin/login',
        },
        ({ step, status, error }: StepEvent) => {
          setStepStates((prev) => ({
            ...prev,
            [step]: { status, error },
          }));
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ResetApplicationDialog] Erreur pendant la réinitialisation:', err);
      setOverallError(message);
      setRunning(false);
      runningRef.current = false;
    }
  };

  const isAllCompleted = displayedSteps.every(
    (step) => stepStates[step]?.status === 'completed'
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      // Bloque la fermeture pendant l'exécution pour garantir la cohérence
      if (running) return;
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-w-md border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                isVersionMode
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              )}
            >
              {isVersionMode ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </span>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isVersionMode
                ? t('admin.reset.newVersionTitle')
                : t('admin.reset.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm text-slate-600 dark:text-slate-400">
            {isVersionMode ? (
              <>
                {t('admin.reset.newVersionDesc')}
                {newVersion && (
                  <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">
                    v{newVersion}
                    {currentVersion ? (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        (actuelle : v{currentVersion})
                      </span>
                    ) : null}
                  </span>
                )}
              </>
            ) : (
              t('admin.reset.desc')
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ── Liste des étapes avec statut visuel réactif ── */}
        <div
          className="flex flex-col gap-2.5 py-2"
          role="status"
          aria-live="polite"
        >
          {displayedSteps.map((step, i) => {
            const state = stepStates[step] || { status: 'pending' };
            const { status } = state;

            const isDone = status === 'completed';
            const isActive = status === 'running';
            const isError = status === 'error';

            return (
              <div
                key={step}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200',
                  isDone && 'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30',
                  isActive && 'border-blue-300 bg-blue-50/80 text-blue-950 shadow-sm ring-1 ring-blue-400/30 dark:border-blue-800 dark:bg-blue-950/30',
                  isError && 'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30',
                  !isDone && !isActive && !isError && 'border-slate-200 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-200',
                      isDone && 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
                      isActive && 'border-blue-600 bg-blue-600 text-white shadow-sm',
                      isError && 'border-rose-600 bg-rose-600 text-white shadow-sm',
                      !isDone && !isActive && !isError && 'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 stroke-[3] animate-in zoom-in-75 duration-200 motion-reduce:animate-none" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    ) : isError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm transition-colors duration-200 leading-snug',
                      isDone && 'font-semibold text-emerald-900 dark:text-emerald-300',
                      isActive && 'font-semibold text-blue-900 dark:text-blue-200',
                      isError && 'font-semibold text-rose-900 dark:text-rose-300',
                      !isDone && !isActive && !isError && 'font-medium text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {step === 'reload' && isVersionMode
                      ? t('admin.reset.step.reload')
                      : step === 'reload'
                        ? t('admin.reset.step.redirect')
                        : t(`admin.reset.step.${step}`)}
                  </span>
                </div>

                <span
                  className={cn(
                    'text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-md transition-colors',
                    isDone && 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
                    isActive && 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 animate-pulse',
                    isError && 'bg-rose-100/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
                    !isDone && !isActive && !isError && 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {t(`admin.reset.status.${status}`)}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Avertissements et garanties ── */}
        {!isVersionMode && (
          <p className="rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {t('admin.reset.disconnectWarning')}
          </p>
        )}

        <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          {t('admin.reset.keepData')}
        </p>

        {overallError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{overallError}</span>
          </div>
        )}

        {/* ── Actions du bas ── */}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running}
            className="rounded-xl"
          >
            {t('admin.reset.cancel')}
          </Button>

          <Button
            onClick={handleReset}
            disabled={running}
            variant={isVersionMode ? 'default' : 'destructive'}
            className={cn(
              'rounded-xl font-semibold shadow-sm transition-all',
              isVersionMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isAllCompleted
                  ? (isVersionMode ? t('admin.reset.reloading') : t('admin.reset.completedRedirect'))
                  : (isVersionMode ? t('admin.reset.reloading') : t('admin.reset.purging'))}
              </>
            ) : (
              <>
                {isVersionMode ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('admin.reset.updateNow')}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('admin.reset.confirmReset')}
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
