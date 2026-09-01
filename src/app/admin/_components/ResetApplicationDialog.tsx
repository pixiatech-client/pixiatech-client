'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, RefreshCw, Trash2, Sparkles } from 'lucide-react';
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
import { resetApplication, type ResetStep } from '@/lib/reset-application';

type Mode = 'manual' | 'version';

const STEP_ORDER: ResetStep[] = ['caches', 'storage', 'session', 'reload'];

interface ResetApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  /** new version info when mode === 'version' */
  currentVersion?: string;
  newVersion?: string;
  /** signature du build cible (évite la boucle de reload en mode "mise à jour") */
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
  const [activeStep, setActiveStep] = useState<ResetStep | null>(null);
  const [doneSteps, setDoneSteps] = useState<ResetStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setActiveStep(null);
      setDoneSteps([]);
      setError(null);
      runningRef.current = false;
    }
  }, [open]);

  const isVersionMode = mode === 'version';

  const handleReset = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setError(null);
    setDoneSteps([]);

    await resetApplication(
      {
        radical: isVersionMode ? false : true,
        targetSignature: isVersionMode ? targetSignature : undefined,
      },
      (step) => {
        setActiveStep(step);
        setDoneSteps((prev) => (prev.includes(step) ? prev : [...prev]));
      }
    ).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
      runningRef.current = false;
    });
  };

  const allDone = running && doneSteps.length >= STEP_ORDER.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                isVersionMode
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-rose-100 text-rose-600'
              )}
            >
              {isVersionMode ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </span>
            <DialogTitle className="text-lg">
              {isVersionMode ? t('admin.reset.newVersionTitle') : t('admin.reset.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            {isVersionMode ? (
              <>
                {t('admin.reset.newVersionDesc')}
                {newVersion && (
                  <span className="ml-1 font-semibold text-blue-600">
                    v{newVersion}
                    {currentVersion ? (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        (v{currentVersion})
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

        <div className="flex flex-col gap-2 py-1">
          {STEP_ORDER.map((step, i) => {
            const isActive = running && activeStep === step;
            const isDone = doneSteps.includes(step);
            return (
              <div
                key={step}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  isDone
                    ? 'border-emerald-200 bg-emerald-50'
                    : isActive
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                        ? 'border-blue-500 text-blue-500'
                        : 'border-gray-300 text-transparent'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isDone
                      ? 'text-emerald-700'
                      : isActive
                        ? 'text-blue-700'
                        : 'text-muted-foreground'
                  )}
                >
                  {step === 'reload' && isVersionMode
                    ? t('admin.reset.step.reload')
                    : step === 'reload'
                      ? t('admin.reset.step.redirect')
                      : t(`admin.reset.step.${step}`)}
                </span>
              </div>
            );
          })}
        </div>

        {!isVersionMode && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {t('admin.reset.disconnectWarning')}
          </p>
        )}

        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {t('admin.reset.keepData')}
        </p>

        {error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            {t('admin.reset.cancel')}
          </Button>
          <Button
            onClick={handleReset}
            disabled={running}
            variant={isVersionMode ? 'default' : 'destructive'}
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {allDone ? t('admin.reset.reloading') : t('admin.reset.purging')}
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
