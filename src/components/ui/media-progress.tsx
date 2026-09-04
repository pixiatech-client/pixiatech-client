'use client';

import { Progress } from '@/components/ui/progress';
import { MediaUploadState } from '@/hooks/use-media-upload';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, FileImage, FileVideo, Upload } from 'lucide-react';
import LiquidLoader from '@/components/LiquidLoader';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface MediaProgressProps {
  state: MediaUploadState;
  className?: string;
  onRetry?: () => void;
}

export function MediaProgress({ state, className, onRetry }: MediaProgressProps) {
  if (state.status === 'idle') return null;

  const savings = state.originalSize > 0 && state.optimizedSize > 0
    ? Math.round(((state.originalSize - state.optimizedSize) / state.originalSize) * 100)
    : 0;

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2', className)}>
      {/* File info header */}
      <div className="flex items-center gap-2 text-sm">
        {state.isVideo ? (
          <FileVideo className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <FileImage className="h-4 w-4 text-slate-400 shrink-0" />
        )}
        <span className="font-medium text-slate-700 truncate">{state.fileName}</span>
        {state.originalSize > 0 && state.status !== 'completed' && (
          <span className="text-slate-400 ml-auto shrink-0">
            Original : {formatBytes(state.originalSize)}
          </span>
        )}
      </div>

      {/* Active: uploading to server */}
      {state.status === 'uploading' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Upload className="h-3.5 w-3.5 animate-pulse" />
            <span>Envoi du fichier...</span>
            <span className="ml-auto text-xs text-slate-400">{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} className="h-1.5" />
        </div>
      )}

      {/* Active: server processing */}
      {state.status === 'processing' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <LiquidLoader size={16} />
            <span>
              {state.isVideo
                ? 'Conversion de la vidéo en WebM...'
                : "Optimisation de l'image..."}
            </span>
            <span className="ml-auto text-xs text-slate-400">{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} className="h-1.5" />
        </div>
      )}

      {/* Completed */}
      {state.status === 'completed' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="font-medium text-green-600">
              {state.isVideo ? 'Vidéo optimisée' : 'Image optimisée'}
            </span>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5 ml-6">
            <div>
              Original : {formatBytes(state.originalSize)}
            </div>
            <div>
              Optimisé : {formatBytes(state.optimizedSize)}
            </div>
            {savings > 0 && (
              <div className="text-green-600 font-medium">
                Réduction : {savings} %
              </div>
            )}
            <div className="text-slate-400">
              Format : {state.isVideo ? 'WebM' : 'WebP'}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Impossible d'optimiser ce fichier.</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs text-blue-500 hover:underline ml-6"
            >
              Réessayer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
