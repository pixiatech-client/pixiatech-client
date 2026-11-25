'use client';

import { Camera, Check, ImagePlus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { Language } from '../../../core/types';

interface SitePhotoUploadStepProps {
  lang: Language;
  onError: (msg: string | null) => void;
  onComplete: (dataUrl: string | null) => void;
}

export function SitePhotoUploadStep({ lang, onError, onComplete }: SitePhotoUploadStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const rafRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const uaMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      setIsMobileDevice(coarse || uaMobile);
    }
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
    };
  }, []);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      onError(
        lang === 'fr' ? 'Format accepté : JPG, PNG ou WebP.' : 'Accepted formats: JPG, PNG or WebP.'
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError(lang === 'fr' ? 'Taille maximale : 5 Mo.' : 'Maximum file size: 5 MB.');
      return;
    }

    onError(null);
    setFileName(file.name || (lang === 'fr' ? 'photo-site.jpg' : 'site-photo.jpg'));
    setStage('uploading');
    setProgress(0);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const resultUrl = reader.result;
      setPreviewUrl(resultUrl);

      const start = performance.now();
      const durationMs = 1150;

      const tick = (now: number) => {
        const raw = Math.min(1, (now - start) / durationMs);
        // Smooth ease-out curve for realistic reveal
        const eased = 1 - Math.pow(1 - raw, 2.4);
        const pct = Math.round(eased * 100);
        setProgress(pct);

        if (raw < 1) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          setProgress(100);
          setStage('done');
          doneTimerRef.current = window.setTimeout(() => {
            onComplete(resultUrl);
          }, 680);
        }
      };

      rafRef.current = window.requestAnimationFrame(tick);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3">
      {/* Hidden Gallery / File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleFilePicked}
        className="sr-only"
      />

      {/* Hidden Direct Mobile Camera input (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilePicked}
        className="sr-only"
      />

      {/* Progressive Image Reveal Preview While Uploading (Animorio 02 style) */}
      {previewUrl ? (
        <div className="space-y-2.5">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/15 bg-[#121216]">
            {/* Blurred dim background layer visible before scan reaches 100% */}
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20 blur-md scale-105"
            />

            {/* Crisp image revealing progressively from bottom/left to full */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `inset(0 ${Math.max(0, 100 - progress)}% 0 0)`,
              }}
            >
              <img
                src={previewUrl}
                alt={fileName}
                className="h-full w-full object-cover transition-[filter] duration-200"
                style={{
                  filter: `blur(${Math.max(0, (100 - progress) * 0.05)}px)`,
                }}
              />
            </div>

            {/* Glowing Reveal Scan Line during upload */}
            {stage === 'uploading' && progress < 100 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#34D399] shadow-[0_0_16px_3px_rgba(52,211,153,0.85)]"
                style={{ left: `${progress}%` }}
              />
            )}

            {/* Status chip inside preview */}
            <div className="absolute right-2.5 top-2.5">
              {stage === 'done' ? (
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/60 bg-[#064E3B]/85 px-2.5 py-1 text-[11px] font-semibold text-[#A7F3D0] backdrop-blur-xs"
                >
                  <Check className="h-3 w-3" />
                  {t(lang, 'ui.photoUploaded')}
                </motion.span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[11px] font-mono tabular-nums text-white backdrop-blur-xs">
                  <Sparkles className="h-3 w-3 text-[#34D399] animate-pulse" />
                  {progress}%
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="truncate text-[#D4D4D8] max-w-[200px]">{fileName}</span>
              <span className="font-mono tabular-nums text-[#34D399]">
                {stage === 'done' ? '100%' : t(lang, 'ui.uploadingPhoto')}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3f9b78] to-[#34D399] transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* On mobile devices, put direct camera capture right alongside gallery picker */}
          <div className={`grid gap-2 ${isMobileDevice ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="pixia-glass-btn flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white cursor-pointer min-h-[44px]"
            >
              <ImagePlus className="h-4 w-4 text-[#38BDF8] shrink-0" />
              <span className="truncate">{t(lang, 'ui.uploadPhoto')}</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium cursor-pointer min-h-[44px] transition-colors ${
                isMobileDevice
                  ? 'border-[#38BDF8]/50 bg-[#38BDF8]/15 text-[#BAE6FD] hover:bg-[#38BDF8]/25'
                  : 'pixia-glass-btn text-white'
              }`}
            >
              <Camera className="h-4 w-4 text-[#C084FC] shrink-0" />
              <span className="truncate">{t(lang, 'ui.takePhoto')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onError(null);
              onComplete(null);
            }}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] cursor-pointer min-h-[42px]"
          >
            {t(lang, 'bot.skip')}
          </button>
        </div>
      )}
    </div>
  );
}
