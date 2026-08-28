'use client';

import { Loader2, RefreshCw, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export type VideoUploadPhase = 'idle' | 'uploading' | 'processing' | 'error';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Mo';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1)).toString().replace('.', ',')} ${sizes[i]}`;
}

interface VideoUploadOverlayProps {
  status: VideoUploadPhase;
  progress: number;
  originalSize?: number;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function VideoUploadOverlay({
  status,
  progress,
  originalSize = 0,
  errorMessage,
  onRetry,
  className,
}: VideoUploadOverlayProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const loadedBytes = Math.round((originalSize * clamped) / 100);

  return (
    <div
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-[2px]',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-3 px-5 text-center">
        {status === 'uploading' && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Upload className="h-5 w-5 text-white" />
          </div>
        )}
        {status === 'processing' && (
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        )}
        {status === 'error' && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-400/30">
            <AlertTriangle className="h-5 w-5 text-red-300" />
          </div>
        )}

        <p className="text-xs font-black uppercase tracking-widest text-white">
          {status === 'uploading' && "Téléversement de la vidéo…"}
          {status === 'processing' && 'Traitement de la vidéo…'}
          {status === 'error' && "Échec du téléversement"}
        </p>

        {status !== 'error' && (
          <>
            <div className="w-full">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-medium text-white/70">
                  {status === 'uploading' && originalSize > 0
                    ? `${formatBytes(loadedBytes)} / ${formatBytes(originalSize)}`
                    : 'En cours'}
                </span>
                <span className="text-[10px] font-black tabular-nums text-white/90">
                  {clamped} %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-[width] duration-200 ease-out"
                  style={{ width: `${clamped}%` }}
                />
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            {errorMessage && (
              <p className="text-[10px] font-medium text-white/60">{errorMessage}</p>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg transition-all active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}