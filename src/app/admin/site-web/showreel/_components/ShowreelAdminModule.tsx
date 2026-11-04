'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Film,
  Save,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Camera,
  Monitor,
  Image as ImageIcon,
  Layers,
  Settings2,
  Upload,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Redo2,
  AlertCircle,
  Eye,
  ChevronRight,
  ChevronDown,
  Move,
  ZoomIn,
  Radio,
  X,
  Globe,
  Square,
  Sparkles,
  Lock,
  Unlock,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText } from '@/lib/site-web/cms-i18n';
import {
  CameraKeyframe,
  KeyframeEasing,
  ScreenCoords as CameraScreenCoords,
  evaluateCamera,
  parseKeyframesFromCms,
  parseLedKeyframesFromCms,
  parseLedTriggersFromCms,
  LedAnimationTrigger,
  DEFAULT_KEYFRAMES,
  DEFAULT_LED_KEYFRAMES,
  DEFAULT_LED_TRIGGERS,
  DEFAULT_SCREEN_COORDS,
  DEFAULT_MASTER_IMAGE,
  applyEasing,
} from '@/web/pixiatech/sections/camera-engine';
import { MacroLedScene } from '@/web/pixiatech/sections/MacroLedScene';

// ─── Types ───────────────────────────────────────────────────────────────────

type StudioTab = 'media' | 'camera' | 'screen' | 'images' | 'texts';

interface ScreenCoords {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ImageAdjustment {
  posX: number;
  posY: number;
  scale: number;
  width: number;
  height: number;
}

interface CameraSettings {
  speed: number;
  origin1: number;
  origin2: number;
  origin3: number;
}

interface LayerImage {
  key: 'image1Src' | 'image2Src' | 'image3Src' | 'image4Src' | 'image5Src';
  prefix: 'img1' | 'img2' | 'img3' | 'img4' | 'img5';
  screenKey: 'screen1' | 'screen2' | 'screen3' | null;
  label: string;
  sublabel: string;
  defaultSrc: string;
  defaultScreen: ScreenCoords | null;
}

const LAYERS: LayerImage[] = [
  {
    key: 'image1Src',
    prefix: 'img1',
    screenKey: 'screen1',
    label: '01 — Ville lointaine',
    sublabel: 'Skyline + écran distant',
    defaultSrc: '/assets/showreel/ref-1-city-far.webp',
    defaultScreen: { left: 43.66, top: 54.52, width: 12.68, height: 10.84 },
  },
  {
    key: 'image2Src',
    prefix: 'img2',
    screenKey: 'screen2',
    label: '02 — Vue intermédiaire',
    sublabel: 'Plaza + façade écran',
    defaultSrc: '/assets/showreel/ref-2-city-mid.webp',
    defaultScreen: { left: 34.63, top: 34.01, width: 30.5, height: 25.19 },
  },
  {
    key: 'image3Src',
    prefix: 'img3',
    screenKey: 'screen3',
    label: '03 — Façade rapprochée',
    sublabel: 'Écran géant plein cadre',
    defaultSrc: '/assets/showreel/ref-3-facade-screen.webp',
    defaultScreen: { left: 24.76, top: 15.41, width: 50.36, height: 40.7 },
  },
  {
    key: 'image4Src',
    prefix: 'img4',
    screenKey: null,
    label: '04 — Macro LED RGB',
    sublabel: 'Diodes micro-LED (blend screen)',
    defaultSrc: '/assets/showreel/ref-4-led-macro.webp',
    defaultScreen: null,
  },
  {
    key: 'image5Src',
    prefix: 'img5',
    screenKey: null,
    label: '05 — Diode MicroLED',
    sublabel: 'Schéma nanométrique / photo macro',
    defaultSrc: '/assets/showreel/stage-1-micro-diode.jpg',
    defaultScreen: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(49, 76, 120, ${alpha})`;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `rgba(49, 76, 120, ${alpha})`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VideoOutlineColorControl({
  color,
  onChangeColor,
}: {
  color: string;
  onChangeColor: (color: string) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '3px 8px',
      }}
    >
      <label
        title="Ouvrir la palette de couleur"
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: color,
          border: '1.5px solid rgba(255,255,255,0.5)',
          cursor: 'pointer',
          position: 'relative',
          display: 'inline-block',
          flexShrink: 0,
        }}
      >
        <input
          type="color"
          value={color.startsWith('#') && color.length === 7 ? color : '#000000'}
          onChange={(e) => onChangeColor(e.target.value)}
          style={{
            opacity: 0,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
      </label>
      <input
        type="text"
        value={color}
        onChange={(e) => onChangeColor(e.target.value)}
        placeholder="#000000"
        maxLength={7}
        title="Code hexadécimal de la couleur du contour (ex: #000000)"
        style={{
          width: 64,
          background: 'transparent',
          border: 'none',
          color: '#F5F4F0',
          fontSize: 11,
          fontFamily: 'monospace',
          fontWeight: 700,
          outline: 'none',
          padding: '2px 0',
        }}
      />
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {[
          { hex: '#000000', label: 'Bleu ardoise' },
          { hex: '#C3F910', label: 'Vert néon' },
          { hex: '#3B82F6', label: 'Bleu ciel' },
          { hex: '#EF4444', label: 'Rouge' },
          { hex: '#FFFFFF', label: 'Blanc' },
        ].map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChangeColor(c.hex)}
            title={`${c.label} (${c.hex})`}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: c.hex,
              border: color.toLowerCase() === c.hex.toLowerCase() ? '1.5px solid #FFF' : '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 120ms ease',
              transform: color.toLowerCase() === c.hex.toLowerCase() ? 'scale(1.25)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  onChange,
  onReset,
  defaultVal,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  onReset?: () => void;
  defaultVal?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, alignItems: 'center', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <label style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#C3F910', minWidth: 48, textAlign: 'right', fontFamily: 'monospace' }}>
          {value.toFixed(step < 0.1 ? 2 : 1)}{unit}
        </span>
        {onReset && defaultVal !== undefined && (
          <button
            type="button"
            onClick={onReset}
            title="Réinitialiser"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 2, display: 'flex' }}
          >
            <RotateCcw style={{ width: 10, height: 10 }} />
          </button>
        )}
      </div>
      <div style={{ gridColumn: '1 / -1', width: '100%', minWidth: 0 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#C3F910', height: 4, cursor: 'pointer', display: 'block', boxSizing: 'border-box', margin: 0 }}
        />
      </div>
    </div>
  );
}

// ─── Video Upload Panel ────────────────────────────────────────────────────────

function VideoUploadPanel({
  currentVideoUrl,
  onVideoChange,
}: {
  currentVideoUrl: string;
  onVideoChange: (url: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const handleFile = useCallback((file: File) => {
    setUploadError(null);
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.type)) {
      setUploadError(`Format non pris en charge : ${file.type}. Utilisez MP4 ou WebM.`);
      return;
    }
    if (file.size > 512 * 1024 * 1024) {
      setUploadError(`Fichier trop volumineux (${formatBytes(file.size)}). Maximum : 512 Mo.`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreviewUrl(url);
    setPendingDuration(null);

    // Get duration
    const tmp = document.createElement('video');
    tmp.preload = 'metadata';
    tmp.onloadedmetadata = () => {
      setPendingDuration(tmp.duration);
      URL.revokeObjectURL(tmp.src);
    };
    tmp.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile);

      // Simulate progress with XHR for real progress tracking
      const result = await new Promise<{ success: boolean; url?: string; error?: string; message?: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Réponse invalide du serveur.'));
            }
          };
          xhr.onerror = () => reject(new Error('Erreur réseau.'));
          xhr.open('POST', '/api/site-web/upload-video');
          xhr.send(formData);
        }
      );

      if (result.success && result.url) {
        onVideoChange(result.url);
        toast.success('Vidéo téléversée avec succès.');
        // Clean up pending state
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        setPendingFile(null);
        setPendingPreviewUrl(null);
        setPendingDuration(null);
      } else {
        throw new Error(result.message || result.error || 'Téléversement échoué.');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Erreur inconnue.';
      setUploadError(msg);
      toast.error(`Erreur : ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelPending = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPendingDuration(null);
    setUploadError(null);
  };

  const isFirebaseUrl = currentVideoUrl.startsWith('https://');
  const displaySrc = pendingPreviewUrl || currentVideoUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Current / Preview */}
      {displaySrc && (
        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#05070B', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
          <video
            ref={previewVideoRef}
            src={displaySrc}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block', background: '#000' }}
          />
          {pendingFile && (
            <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(195,249,16,0.9)', color: '#05070B', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, fontFamily: 'monospace' }}>
                APERÇU LOCAL
              </span>
            </div>
          )}
        </div>
      )}

      {/* File info */}
      {pendingFile && (
        <div style={{ background: 'rgba(195,249,16,0.06)', border: '1px solid rgba(195,249,16,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F4F0' }}>{pendingFile.name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {formatBytes(pendingFile.size)} · {pendingFile.type.replace('video/', '').toUpperCase()}
              {pendingDuration ? ` · ${Math.round(pendingDuration)}s` : ''}
            </div>
          </div>
          <button type="button" onClick={cancelPending} style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Current URL (non-pending) */}
      {!pendingFile && currentVideoUrl && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace', letterSpacing: '.08em', marginBottom: 4 }}>VIDÉO ACTIVE</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {isFirebaseUrl ? currentVideoUrl.split('/o/')[1]?.split('?')[0] || currentVideoUrl : currentVideoUrl}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#C3F910' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 12,
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(195,249,16,0.04)' : 'transparent',
          transition: 'all 200ms ease',
        }}
      >
        <Upload style={{ width: 24, height: 24, color: '#6B7280', margin: '0 auto 10px' }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB' }}>
          Glissez une vidéo ici
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
          MP4, WebM · max 512 Mo
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Progress */}
      {uploading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Téléversement en cours…</span>
            <span style={{ fontSize: 11, color: '#C3F910', fontFamily: 'monospace' }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#C3F910', width: `${uploadProgress}%`, transition: 'width 200ms ease', borderRadius: 99 }} />
          </div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: '#FCA5A5' }}>{uploadError}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {pendingFile && !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10, background: '#C3F910', color: '#05070B',
              fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(195,249,16,0.3)',
            }}
          >
            <Upload style={{ width: 14, height: 14 }} />
            Téléverser la vidéo
          </button>
        )}
        {uploading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(195,249,16,0.1)', color: '#C3F910', fontSize: 12, fontWeight: 700 }}>
            <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            Envoi en cours…
          </div>
        )}
        {currentVideoUrl && !pendingFile && !uploading && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Supprimer la vidéo personnalisée et revenir à la vidéo par défaut ?')) {
                onVideoChange('/youtube-video.mp4');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
            Restaurer la vidéo par défaut
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Single Image Editor (Sélection 1 seule image à la fois + Remplacement + Ajustements) ──


// ═══════════════════════════════════════════════════════════════════════════
// MasterImagePanel – Upload de l'image maître unique
// ═══════════════════════════════════════════════════════════════════════════

function MasterImagePanel({
  currentSrc,
  onImageChange,
}: {
  currentSrc: string;
  onImageChange: (url: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { uploadMedia } = useCms();

  const handleFile = async (file: File) => {
    setError(null);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format non pris en charge. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setError(`Image trop volumineuse (${formatBytes(file.size)}). Maximum : 40 Mo.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      onImageChange(url);
      toast.success('Image maître remplacée avec succès.');
    } catch {
      setError('Échec du téléversement. Réessayez.');
      toast.error('Échec du téléversement de la photo.');
    } finally {
      setUploading(false);
    }
  };

  const isDefault = currentSrc === DEFAULT_MASTER_IMAGE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>
          Image Maître du Showreel
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
          Unique image haute résolution source de toutes les transitions de caméra. La vidéo est positionnée directement sur cette image.
        </div>

        {/* Aperçu */}
        {currentSrc && (
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#05070B', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSrc}
              alt=""
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
            />
            {!isDefault && (
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(195,249,16,0.9)', color: '#05070B', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, fontFamily: 'monospace' }}>
                PERSONNALISÉE
              </div>
            )}
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          <Upload style={{ width: 22, height: 22, color: '#6B7280', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB' }}>Remplacer l'image maître</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>JPEG, PNG, WebP · max 40 Mo</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(195,249,16,0.08)', borderRadius: 10, marginTop: 12 }}>
            <Loader2 style={{ width: 14, height: 14, color: '#C3F910', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#C3F910', fontWeight: 600 }}>Téléversement en cours…</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
            <AlertCircle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: '#FCA5A5' }}>{error}</span>
          </div>
        )}

        {!isDefault && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Restaurer l\'image maître par défaut ?')) {
                onImageChange(DEFAULT_MASTER_IMAGE);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 12,
            }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
            Restaurer l'image par défaut
          </button>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// VirtualCameraStudioCanvas – Studio caméra virtuelle à images clés
// Architecture : 1 image source · 1 vidéo calée · caméra interpolée
// ═══════════════════════════════════════════════════════════════════════════

function VirtualCameraStudioCanvas({
  masterImageSrc,
  videoSrc,
  screen,
  keyframes,
  selectedKeyId,
  onSelectKey,
  onKeyframeChange,
  onAddKeyframe,
  onDeleteKeyframe,
  onScreenChange,
  onSave,
  isSaving,
  hasUnsaved,
  showVideoOutline,
  videoOutlineColor,
  onToggleVideoOutline,
  onChangeVideoOutlineColor,
  lockAspect,
  onToggleLockAspect,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  ledCustomImageSrc = '',
  onLedCustomImageChange,
  onRestoreDefaultLed,
  ledKeyframes,
  selectedLedKeyId,
  onSelectLedKey,
  onLedKeyframeChange,
  onAddLedKeyframe,
  onDeleteLedKeyframe,
  ledTriggers,
  onAddLedTrigger,
  onDeleteLedTrigger,
}: {
  masterImageSrc: string;
  videoSrc: string;
  screen: CameraScreenCoords;
  keyframes: CameraKeyframe[];
  selectedKeyId: string | null;
  onSelectKey: (id: string) => void;
  onKeyframeChange: (id: string, patch: Partial<CameraKeyframe>) => void;
  onAddKeyframe: (atTime: number) => void;
  onDeleteKeyframe: (id: string) => void;
  onScreenChange: (sc: CameraScreenCoords) => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsaved: boolean;
  showVideoOutline: boolean;
  videoOutlineColor: string;
  onToggleVideoOutline: () => void;
  onChangeVideoOutlineColor: (c: string) => void;
  lockAspect: boolean;
  onToggleLockAspect: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  ledCustomImageSrc?: string;
  onLedCustomImageChange?: (url: string) => void;
  onRestoreDefaultLed?: () => void;
  ledKeyframes: CameraKeyframe[];
  selectedLedKeyId: string | null;
  onSelectLedKey: (id: string) => void;
  onLedKeyframeChange: (id: string, patch: Partial<CameraKeyframe>) => void;
  onAddLedKeyframe: (atTime: number) => void;
  onDeleteLedKeyframe: (id: string) => void;
  ledTriggers: LedAnimationTrigger[];
  onAddLedTrigger: (atTime: number) => void;
  onDeleteLedTrigger: (id: string) => void;
}) {
  const ledFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingLedImage, setUploadingLedImage] = React.useState(false);
  const { uploadMedia } = useCms();
  const [keyToDelete, setKeyToDelete] = React.useState<CameraKeyframe | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [simProgress, setSimProgress] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Interaction mode ───────────────────────────────────────────────────────
  // 'camera' = manipulate camera framing rect  |  'led' = independent LED animation  |  'screen' = calibrate video screen rect
  const [studioMode, setStudioMode] = React.useState<'camera' | 'led' | 'screen'>('camera');

  // Sélecteur de déclencheur actif sur la timeline globale
  const [selectedTriggerId, setSelectedTriggerId] = React.useState<string | null>(null);
  const selectedTrigger = React.useMemo(
    () => (ledTriggers || []).find((t) => t.id === selectedTriggerId) || null,
    [ledTriggers, selectedTriggerId]
  );

  // Routage des keyframes selon le mode actif
  const isLedMode = studioMode === 'led';
  const activeKeyframes = isLedMode ? ledKeyframes : keyframes;
  const activeSelectedKeyId = isLedMode ? selectedLedKeyId : selectedKeyId;
  const activeOnSelectKey = isLedMode ? onSelectLedKey : onSelectKey;
  const activeOnKeyframeChange = isLedMode ? onLedKeyframeChange : onKeyframeChange;
  const activeOnAddKeyframe = isLedMode ? onAddLedKeyframe : onAddKeyframe;
  const activeOnDeleteKeyframe = isLedMode ? onDeleteLedKeyframe : onDeleteKeyframe;

  // ── Screen rect drag state ─────────────────────────────────────────────────
  const [dragMode, setDragMode] = React.useState<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | null
  >(null);
  const [dragStart, setDragStart] = React.useState<{
    x: number;
    y: number;
    initial: CameraScreenCoords;
  } | null>(null);

  // ── Dragging keyframe diamond on timeline ──────────────────────────────────
  const [draggingKfId, setDraggingKfId] = React.useState<string | null>(null);
  const [dragKfStartX, setDragKfStartX] = React.useState(0);
  const [dragKfStartTime, setDragKfStartTime] = React.useState(0);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setSimProgress((p) => {
          const next = p + 0.003;
          return next > 1 ? 0 : next;
        });
      }, 50);
    } else {
      if (animRef.current) clearInterval(animRef.current);
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [playing]);

  // ── Evaluate Global Camera at current simProgress ──────────────────────────
  const globalCam = React.useMemo(
    () => evaluateCamera(keyframes, simProgress),
    [keyframes, simProgress]
  );

  // ── Déclencheur actif de Structure LED sur la timeline globale ─────────────
  const activeTrigger = React.useMemo(() => {
    if (!ledTriggers || ledTriggers.length === 0) return null;
    const sortedTrig = [...ledTriggers].sort((a, b) => a.time - b.time);
    const fired = sortedTrig.filter((t) => t.time <= simProgress);
    return fired.length > 0 ? fired[fired.length - 1] : null;
  }, [ledTriggers, simProgress]);

  // Progression de l'animation LED (de 0.00 à 1.00)
  const ledProgress = React.useMemo(() => {
    if (studioMode === 'led') return simProgress;
    if (!activeTrigger) return 0;
    const span = 1.0 - activeTrigger.time;
    if (span <= 0.001) return 1;
    return Math.max(0, Math.min(1, (simProgress - activeTrigger.time) / span));
  }, [studioMode, simProgress, activeTrigger]);

  // Caméra dédiée Structure LED interpolée sur sa progression propre
  const ledCam = React.useMemo(
    () => evaluateCamera(ledKeyframes, ledProgress),
    [ledKeyframes, ledProgress]
  );

  // Opacités de superposition
  const ledOpacity = activeTrigger
    ? Math.min(1, (simProgress - activeTrigger.time) / 0.04)
    : 0;
  const videoOpacity = activeTrigger
    ? Math.max(0, 1 - (simProgress - activeTrigger.time) / 0.06)
    : 1;

  // Caméra active appliquée au viewport
  const cam = studioMode === 'led' ? ledCam : globalCam;

  // ── Jump to keyframe when selected ────────────────────────────────────────
  useEffect(() => {
    const kf = activeKeyframes.find((k) => k.id === activeSelectedKeyId);
    if (kf) {
      setSimProgress(kf.time);
      setPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSelectedKeyId, studioMode]);

  const selectedKf = activeKeyframes.find((k) => k.id === activeSelectedKeyId) || null;
  const sorted = [...activeKeyframes].sort((a, b) => a.time - b.time);

  // ── Screen drag handlers ───────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent, mode: typeof dragMode) => {
    if (studioMode !== 'screen') return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setDragMode(mode);
    setDragStart({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100,
      initial: { ...screen },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (studioMode === 'screen' && dragMode && dragStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * 100;
      const my = (e.clientY - rect.top) / rect.height * 100;
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      const s = { ...dragStart.initial };

      let newL = s.left, newT = s.top, newW = s.width, newH = s.height;
      const minSize = 2;
      const aspect = s.width / Math.max(s.height, 0.01);

      if (dragMode === 'move') {
        newL = Math.max(0, Math.min(100 - s.width, s.left + dx));
        newT = Math.max(0, Math.min(100 - s.height, s.top + dy));
      } else if (dragMode === 'e') {
        newW = Math.max(minSize, s.width + dx);
        if (lockAspect) newH = newW / aspect;
      } else if (dragMode === 'w') {
        const dw = Math.max(minSize, s.width - dx);
        newL = s.left + s.width - dw;
        newW = dw;
        if (lockAspect) newH = newW / aspect;
      } else if (dragMode === 's') {
        newH = Math.max(minSize, s.height + dy);
        if (lockAspect) newW = newH * aspect;
      } else if (dragMode === 'n') {
        const dh = Math.max(minSize, s.height - dy);
        newT = s.top + s.height - dh;
        newH = dh;
        if (lockAspect) newW = newH * aspect;
      } else if (dragMode === 'se') {
        newW = Math.max(minSize, s.width + dx);
        newH = lockAspect ? newW / aspect : Math.max(minSize, s.height + dy);
      } else if (dragMode === 'sw') {
        const dw = Math.max(minSize, s.width - dx);
        newL = s.left + s.width - dw;
        newW = dw;
        newH = lockAspect ? newW / aspect : Math.max(minSize, s.height + dy);
      } else if (dragMode === 'ne') {
        newW = Math.max(minSize, s.width + dx);
        const dh = lockAspect ? newW / aspect : Math.max(minSize, s.height - dy);
        newT = s.top + s.height - dh;
        newH = dh;
      } else if (dragMode === 'nw') {
        const dw = Math.max(minSize, s.width - dx);
        newL = s.left + s.width - dw;
        newW = dw;
        const dh = lockAspect ? newW / aspect : Math.max(minSize, s.height - dy);
        newT = s.top + s.height - dh;
        newH = dh;
      }

      onScreenChange({
        left: parseFloat(newL.toFixed(3)),
        top: parseFloat(newT.toFixed(3)),
        width: parseFloat(newW.toFixed(3)),
        height: parseFloat(newH.toFixed(3)),
      });
    }

    // Timeline KF drag
    if (draggingKfId && timelineRef.current) {
      const tRect = timelineRef.current.getBoundingClientRect();
      const rawT = (e.clientX - tRect.left) / tRect.width;
      const clampedT = Math.max(0, Math.min(1, rawT));
      activeOnKeyframeChange(draggingKfId, { time: parseFloat(clampedT.toFixed(3)) });
      setSimProgress(clampedT);
    }
  };

  const handlePointerUp = () => {
    setDragMode(null);
    setDragStart(null);
    setDraggingKfId(null);
  };

  // ── Scrub timeline ─────────────────────────────────────────────────────────
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingKfId) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSimProgress(t);
    setPlaying(false);
  };

  // ── Nudge keyframe params ──────────────────────────────────────────────────
  const nudge = (key: keyof CameraKeyframe, delta: number) => {
    if (!selectedKf) return;
    const current = selectedKf[key] as number;
    activeOnKeyframeChange(selectedKf.id, { [key]: parseFloat((current + delta).toFixed(3)) });
  };

  const HANDLE_COLOR = '#C3F910';
  const HANDLE_SIZE = 9;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* ── Mode bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setStudioMode('camera')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
              border: studioMode === 'camera' ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
              background: studioMode === 'camera' ? 'rgba(195,249,16,0.15)' : 'rgba(255,255,255,0.05)',
              color: studioMode === 'camera' ? '#C3F910' : '#9CA3AF',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            <Camera style={{ width: 13, height: 13 }} /> Caméra Globale
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('led')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
              border: studioMode === 'led' ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
              background: studioMode === 'led' ? 'rgba(195,249,16,0.15)' : 'rgba(255,255,255,0.05)',
              color: studioMode === 'led' ? '#C3F910' : '#9CA3AF',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            <Sparkles style={{ width: 13, height: 13 }} /> Structure LED (Image 2)
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('screen')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
              border: studioMode === 'screen' ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
              background: studioMode === 'screen' ? 'rgba(195,249,16,0.15)' : 'rgba(255,255,255,0.05)',
              color: studioMode === 'screen' ? '#C3F910' : '#9CA3AF',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            <Monitor style={{ width: 13, height: 13 }} /> Écran Vidéo
          </button>
        </div>

        {/* Boutons Historique : Retour en arrière / en avant (Toujours visibles dans tous les modes) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Retour en arrière (Ctrl+Z)"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 8,
              background: canUndo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: canUndo ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
              color: canUndo ? '#F5F4F0' : '#4B5563',
              fontSize: 11, fontWeight: 700, cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.4,
              transition: 'all 120ms ease',
            }}
          >
            <Undo2 style={{ width: 13, height: 13 }} />
            <span>Retour (Ctrl+Z)</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Retour en avant (Ctrl+Y)"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 8,
              background: canRedo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: canRedo ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
              color: canRedo ? '#F5F4F0' : '#4B5563',
              fontSize: 11, fontWeight: 700, cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.4,
              transition: 'all 120ms ease',
            }}
          >
            <Redo2 style={{ width: 13, height: 13 }} />
            <span>Avancer (Ctrl+Y)</span>
          </button>
        </div>

        {/* Keyframe pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {sorted.map((kf) => {
            const isSelected = activeSelectedKeyId === kf.id;
            const accentColor = isLedMode ? '#38BDF8' : '#C3F910';
            return (
              <button
                key={kf.id}
                type="button"
                onClick={() => { activeOnSelectKey(kf.id); setSimProgress(kf.time); setPlaying(false); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: isSelected ? `1px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                  background: isSelected ? accentColor : 'rgba(255,255,255,0.05)',
                  color: isSelected ? '#05070B' : '#9CA3AF',
                  transition: 'all 120ms',
                }}
              >
                {kf.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Viewport ────────────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        style={{
          position: 'relative', aspectRatio: '16/9', width: '100%',
          borderRadius: 12, overflow: 'hidden',
          backgroundColor: '#000000',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          userSelect: 'none', touchAction: 'none',
        }}
      >
        {/* World scene: camera transforms applied here */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate3d(${cam.x.toFixed(3)}%, ${cam.y.toFixed(3)}%, 0) scale(${cam.zoom.toFixed(4)})`,
            transformOrigin: `${cam.originX.toFixed(2)}% ${cam.originY.toFixed(2)}%`,
            willChange: 'transform',
          }}
        >
          {/* Master image (visible in camera and screen modes) */}
          {studioMode !== 'led' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={masterImageSrc}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* Anchored video screen (recadre strictement la vidéo et les LEDs dans le frame de l'écran) */}
          {studioMode !== 'led' && (
            <div
              style={{
                position: 'absolute',
                left: `${screen.left}%`,
                top: `${screen.top}%`,
                width: `${screen.width}%`,
                height: `${screen.height}%`,
                overflow: 'hidden',
                outline: showVideoOutline ? `2px solid ${hexToRgba(videoOutlineColor, 0.85)}` : 'none',
                outlineOffset: -1,
                boxSizing: 'border-box',
                backgroundColor: '#000000',
              }}
            >
              <video
                src={videoSrc}
                autoPlay loop muted playsInline
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: videoOpacity,
                  transition: 'opacity 150ms ease',
                }}
              />
              {/* Structure LED superposée avec son animation indépendante interpolée via ledCam */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: ledOpacity,
                  pointerEvents: 'none',
                  zIndex: 3,
                  transition: 'opacity 150ms ease',
                  transform: `translate3d(${ledCam.x.toFixed(2)}%, ${ledCam.y.toFixed(2)}%, 0) scale(${ledCam.zoom.toFixed(4)})`,
                  transformOrigin: `${ledCam.originX.toFixed(2)}% ${ledCam.originY.toFixed(2)}%`,
                  willChange: 'transform, opacity',
                }}
              >
                {ledCustomImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ledCustomImageSrc}
                    alt="Structure LED"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <MacroLedScene
                    opacity={1}
                    showCabinetGrid={ledProgress > 0.15}
                    style={{ position: 'absolute', inset: 0 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Mode LED Direct : Espace dédié où l'utilisateur visualise et anime sa Structure LED */}
          {studioMode === 'led' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translate3d(${ledCam.x.toFixed(3)}%, ${ledCam.y.toFixed(3)}%, 0) scale(${ledCam.zoom.toFixed(4)})`,
                transformOrigin: `${ledCam.originX.toFixed(2)}% ${ledCam.originY.toFixed(2)}%`,
                willChange: 'transform',
                zIndex: 5,
              }}
            >
              {ledCustomImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ledCustomImageSrc}
                  alt="Structure LED personnalisée"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <MacroLedScene
                  opacity={1}
                  showCabinetGrid={true}
                  style={{ position: 'absolute', inset: 0 }}
                />
              )}
            </div>
          )}

          {/* Screen calibration handles (only in screen mode) — COMPENSÉS PAR LE ZOOM POUR RESTER FINS ET ÉLÉGANTS */}
          {studioMode === 'screen' && (() => {
            const z = Math.max(0.4, cam.zoom);
            const invZ = 1 / z;
            return (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                style={{
                  position: 'absolute',
                  left: `${screen.left}%`,
                  top: `${screen.top}%`,
                  width: `${screen.width}%`,
                  height: `${screen.height}%`,
                  border: `${Math.max(1, 1.25 * invZ)}px solid #C3F910`,
                  outline: `${Math.max(1, 1 * invZ)}px solid rgba(0,0,0,0.75)`,
                  outlineOffset: -1,
                  boxSizing: 'border-box',
                  cursor: 'move',
                  zIndex: 20,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {/* Info badge : reste parfaitement proportionné et net */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translate(0, calc(-100% - ${6 * invZ}px)) scale(${invZ})`,
                  transformOrigin: 'bottom left',
                  whiteSpace: 'nowrap',
                  background: 'rgba(9, 11, 17, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  color: '#C3F910',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ color: '#9CA3AF', fontSize: 9 }}>ÉCRAN</span>
                  <span>{screen.width.toFixed(1)}% × {screen.height.toFixed(1)}%</span>
                </div>

                {/* Corner handles : 10px nets avec bordure noire (style Figma / Premiere) */}
                {([
                  ['nw', '0%', '0%', 'nwse-resize'],
                  ['ne', '100%', '0%', 'nesw-resize'],
                  ['sw', '0%', '100%', 'nesw-resize'],
                  ['se', '100%', '100%', 'nwse-resize'],
                ] as const).map(([dir, l, t, cur]) => (
                  <div
                    key={dir}
                    onPointerDown={(e) => handlePointerDown(e, dir as typeof dragMode)}
                    style={{
                      position: 'absolute',
                      left: l,
                      top: t,
                      transform: `translate(-50%, -50%) scale(${invZ})`,
                      transformOrigin: 'center center',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #05070B',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                      cursor: cur,
                      zIndex: 22,
                    }}
                  />
                ))}

                {/* Edge handles : pilules fines 14x5px centrées */}
                {([
                  ['n', '50%', '0%', 'ns-resize', 14, 5],
                  ['s', '50%', '100%', 'ns-resize', 14, 5],
                  ['w', '0%', '50%', 'ew-resize', 5, 14],
                  ['e', '100%', '50%', 'ew-resize', 5, 14],
                ] as const).map(([dir, l, t, cur, w, h]) => (
                  <div
                    key={dir}
                    onPointerDown={(e) => handlePointerDown(e, dir as typeof dragMode)}
                    style={{
                      position: 'absolute',
                      left: l,
                      top: t,
                      transform: `translate(-50%, -50%) scale(${invZ})`,
                      transformOrigin: 'center center',
                      width: w,
                      height: h,
                      borderRadius: 999,
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #05070B',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                      cursor: cur,
                      zIndex: 21,
                    }}
                  />
                ))}
              </div>
            );
          })()}
        </div>

        {/* HUD overlays (outside world scene) */}
        {/* Timecode */}
        <div style={{
          position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)',
          color: '#C3F910', fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
          padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)',
          pointerEvents: 'none', zIndex: 30,
        }}>
          {(simProgress * 100).toFixed(1)}%
        </div>

        {/* MODAL DE CONFIRMATION DE SUPPRESSION DESIGN PIXIATECH (REMPLACE LE CONFIRM DU NAVIGATEUR) */}
        {keyToDelete && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(5, 7, 11, 0.82)',
              backdropFilter: 'blur(10px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              userSelect: 'none',
            }}
            onClick={() => setKeyToDelete(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                backgroundColor: '#0D0E12',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                padding: '24px 22px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(239,68,68,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 style={{ width: 20, height: 20, color: '#EF4444' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#F5F4F0', letterSpacing: '-0.01em' }}>
                    Supprimer l&apos;image clé ?
                  </div>
                  <div style={{ fontSize: 11, color: '#C3F910', marginTop: 2, fontFamily: 'monospace' }}>
                    {keyToDelete.name} &bull; Position : {(keyToDelete.time * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.6 }}>
                Voulez-vous supprimer cette image clé de caméra ? Le mouvement de zoom se reconnectera automatiquement et de façon fluide entre les clés restantes.
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#9CA3AF' }}>
                  💡 <strong style={{ color: '#F5F4F0' }}>Sécurité :</strong> Vous pourrez immédiatement annuler cette action en appuyant sur <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(195,249,16,0.15)', color: '#C3F910', fontFamily: 'monospace', fontWeight: 700 }}>Ctrl+Z</kbd>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setKeyToDelete(null)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#D1D5DB',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = keyToDelete.id;
                    setKeyToDelete(null);
                    activeOnDeleteKeyframe(id);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: '#EF4444',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                  }}
                >
                  Supprimer la clé
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10, background: studioMode === 'led'
            ? 'rgba(195,249,16,0.95)' : studioMode === 'camera'
            ? 'rgba(195,249,16,0.85)' : 'rgba(59,130,246,0.85)',
          color: '#05070B', fontSize: 9, fontFamily: 'monospace', fontWeight: 800,
          padding: '3px 8px', borderRadius: 6, pointerEvents: 'none', zIndex: 30, letterSpacing: '.08em',
        }}>
          {studioMode === 'led' ? 'STRUCTURE LED (IMAGE 2)' : studioMode === 'camera' ? 'CAMÉRA GLOBALE' : 'ÉCRAN VIDÉO'}
        </div>

        {/* Telemetry HUD (Style IMAGE 2) */}
        {(studioMode === 'led' || (studioMode === 'camera' && simProgress >= 0.50)) && (
          <div style={{
            position: 'absolute', top: 10, right: 180,
            background: 'rgba(6, 10, 16, 0.88)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '4px 10px', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none', zIndex: 30,
            fontFamily: 'monospace', fontSize: 9,
          }}>
            <span style={{ color: '#9CA3AF' }}>DIST: <strong style={{ color: '#FFFFFF' }}>{simProgress >= 0.70 && simProgress <= 0.88 ? '239 mm' : `${(5.5 - simProgress * 5).toFixed(1)} m`}</strong></span>
            <span style={{ color: '#C3F910', fontWeight: 700 }}>3 Diodes RGB (P0.9)</span>
            <span style={{ color: '#9CA3AF' }}>AU CŒUR DES LEDS</span>
          </div>
        )}

        {/* Barre de contrôle du mode Structure LED (Changer photo / Restaurer code) */}
        {studioMode === 'led' && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            background: 'rgba(9, 11, 17, 0.90)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            zIndex: 35,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}>
            <input
              ref={ledFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !onLedCustomImageChange) return;
                setUploadingLedImage(true);
                try {
                  const url = await uploadMedia(file);
                  onLedCustomImageChange(url);
                  toast.success('Photo personnalisée pour les LEDs appliquée.');
                } catch {
                  toast.error('Échec du téléversement de la photo.');
                } finally {
                  setUploadingLedImage(false);
                }
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: ledCustomImageSrc ? 'rgba(59,130,246,0.15)' : 'rgba(195,249,16,0.15)',
                border: `1px solid ${ledCustomImageSrc ? '#3B82F6' : '#C3F910'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ledCustomImageSrc ? '#3B82F6' : '#C3F910',
              }}>
                <Sparkles style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#F5F4F0' }}>
                  {ledCustomImageSrc ? 'Photo personnalisée active' : 'Création procédurale active (Code 32 modules)'}
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                  {ledCustomImageSrc
                    ? 'Cette photo remplace les LEDs dans le zoom à partir de 90%.'
                    : 'Rendu vectoriel haute précision par défaut (Image 2 historique).'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => ledFileInputRef.current?.click()}
                disabled={uploadingLedImage}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 8, background: '#C3F910', color: '#05070B',
                  fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(195,249,16,0.3)',
                }}
              >
                <Upload style={{ width: 12, height: 12 }} />
                <span>{uploadingLedImage ? 'Téléversement...' : ledCustomImageSrc ? 'Changer la photo' : 'Remplacer par une photo'}</span>
              </button>

              {ledCustomImageSrc && (
                <button
                  type="button"
                  onClick={onRestoreDefaultLed}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                    borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#F5F4F0',
                    fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  }}
                >
                  <RotateCcw style={{ width: 12, height: 12 }} />
                  <span>Restaurer le rendu par défaut (Code)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected KF info in camera mode */}
        {studioMode === 'camera' && selectedKf && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(0,0,0,0.75)',
            color: '#F5F4F0', fontSize: 9, fontFamily: 'monospace',
            padding: '5px 10px', borderRadius: 8, backdropFilter: 'blur(4px)',
            pointerEvents: 'none', zIndex: 30, lineHeight: 1.6,
          }}>
            <span style={{ color: '#C3F910', fontWeight: 800 }}>{selectedKf.name}</span>
            {'  '}zoom: {cam.zoom.toFixed(2)}×{'  '}x: {cam.x.toFixed(1)}%{'  '}y: {cam.y.toFixed(1)}%
          </div>
        )}
      </div>

      {/* ── Premiere-style Timeline ──────────────────────────────────────── */}
      <div style={{ background: '#0D0E12', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

        {/* Transport controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8,
              background: playing ? 'rgba(239,68,68,0.15)' : 'rgba(195,249,16,0.15)',
              border: `1px solid ${playing ? 'rgba(239,68,68,0.4)' : '#C3F910'}`,
              color: playing ? '#EF4444' : '#C3F910', fontWeight: 700, fontSize: 11, cursor: 'pointer',
            }}
          >
            {playing ? <Pause style={{ width: 11, height: 11 }} /> : <Play style={{ width: 11, height: 11 }} />}
            {playing ? 'Pause' : 'Lecture'}
          </button>

          <button type="button" onClick={() => { setSimProgress(0); setPlaying(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9CA3AF', fontSize: 11, cursor: 'pointer' }}>
            <RotateCcw style={{ width: 11, height: 11 }} /> Début
          </button>

          {/* Boutons Historique : Annuler (Ctrl+Z) / Rétablir (Ctrl+Y) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 6, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Annuler la dernière modification (Ctrl+Z)"
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7,
                background: canUndo ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: canUndo ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                color: canUndo ? '#F5F4F0' : '#4B5563',
                fontSize: 11, cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.4,
                transition: 'all 120ms ease',
              }}
            >
              <Undo2 style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 10, fontFamily: 'monospace' }}>Ctrl+Z</span>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Rétablir la modification (Ctrl+Y)"
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7,
                background: canRedo ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: canRedo ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                color: canRedo ? '#F5F4F0' : '#4B5563',
                fontSize: 11, cursor: canRedo ? 'pointer' : 'not-allowed',
                opacity: canRedo ? 1 : 0.4,
                transition: 'all 120ms ease',
              }}
            >
              <Redo2 style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 10, fontFamily: 'monospace' }}>Ctrl+Y</span>
            </button>
          </div>

          {/* Timecode badge */}
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#C3F910', background: 'rgba(195,249,16,0.08)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(195,249,16,0.2)' }}>
            {(simProgress * 100).toFixed(1)}%
          </div>

          <div style={{ flex: 1 }} />

          {/* Add / Delete keyframe */}
          <button
            type="button"
            onClick={() => activeOnAddKeyframe(parseFloat(simProgress.toFixed(3)))}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
              background: isLedMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(195,249,16,0.12)',
              border: isLedMode ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(195,249,16,0.3)',
              color: isLedMode ? '#38BDF8' : '#C3F910',
              fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <ZoomIn style={{ width: 11, height: 11 }} /> + Ajouter une clé
          </button>

          {/* Bouton + Structure LED (uniquement en mode Caméra Globale) */}
          {studioMode === 'camera' && (
            <button
              type="button"
              onClick={() => onAddLedTrigger(parseFloat(simProgress.toFixed(3)))}
              title={`Déclencher l'animation Structure LED à ${(simProgress * 100).toFixed(1)}%`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38BDF8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.15)',
                transition: 'all 120ms ease',
              }}
            >
              <Sparkles style={{ width: 11, height: 11 }} />
              + Structure LED
            </button>
          )}

          {/* Bouton supprimer déclencheur sélectionné */}
          {studioMode === 'camera' && selectedTrigger && (
            <button
              type="button"
              onClick={() => {
                onDeleteLedTrigger(selectedTrigger.id);
                setSelectedTriggerId(null);
              }}
              title={`Supprimer le déclencheur Structure LED (${(selectedTrigger.time * 100).toFixed(1)}%)`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38BDF8',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
              <span>Suppr. déclencheur ({(selectedTrigger.time * 100).toFixed(0)}%)</span>
            </button>
          )}

          {selectedKf && (
            <button
              type="button"
              onClick={() => setKeyToDelete(selectedKf)}
              title={`Supprimer ${selectedKf.name}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8,
              background: hasUnsaved ? '#C3F910' : 'rgba(195,249,16,0.12)',
              color: hasUnsaved ? '#05070B' : '#C3F910',
              border: 'none', fontSize: 11, fontWeight: 800, cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 11, height: 11 }} />}
            Enregistrer
          </button>
        </div>

        {/* Ruler + track */}
        <div style={{ padding: '10px 14px 14px', position: 'relative' }}>
          {/* Time ruler */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, pointerEvents: 'none' }}>
            {[0, 25, 50, 75, 100].map((p) => (
              <span key={p} style={{ fontSize: 9, color: '#4B5563', fontFamily: 'monospace' }}>{p}%</span>
            ))}
          </div>

          {/* Camera track */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            style={{
              position: 'relative', height: 32, background: 'rgba(255,255,255,0.04)',
              borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', cursor: 'crosshair',
            }}
          >
            {/* Track line */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.12)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

            {/* Keyframe diamonds */}
            {sorted.map((kf) => {
              const isSelected = kf.id === activeSelectedKeyId;
              const diamondColor = isLedMode ? '#38BDF8' : '#C3F910';
              return (
                <div
                  key={kf.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    activeOnSelectKey(kf.id);
                    setSimProgress(kf.time);
                    setPlaying(false);
                    setDraggingKfId(kf.id);
                    setDragKfStartX(e.clientX);
                    setDragKfStartTime(kf.time);
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  title={kf.name}
                  style={{
                    position: 'absolute',
                    left: `${kf.time * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: isSelected ? 14 : 10,
                    height: isSelected ? 14 : 10,
                    background: isSelected ? diamondColor : '#6B7280',
                    border: isSelected ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    cursor: 'grab',
                    zIndex: isSelected ? 10 : 5,
                    boxShadow: isSelected ? `0 0 8px ${diamondColor}` : 'none',
                    transition: 'width 100ms, height 100ms, background 100ms',
                  }}
                />
              );
            })}

            {/* Marqueurs bleus des déclencheurs Structure LED (sur la timeline globale) */}
            {studioMode === 'camera' && ledTriggers && ledTriggers.map((trig) => {
              const isTriggerSelected = trig.id === selectedTriggerId;
              return (
                <div
                  key={trig.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTriggerId(isTriggerSelected ? null : trig.id);
                    setSimProgress(trig.time);
                    setPlaying(false);
                  }}
                  title={`Déclencheur Structure LED à ${(trig.time * 100).toFixed(1)}% — Cliquez pour sélectionner/supprimer`}
                  style={{
                    position: 'absolute',
                    left: `${trig.time * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: isTriggerSelected ? 16 : 12,
                    height: isTriggerSelected ? 16 : 12,
                    background: '#38BDF8',
                    border: isTriggerSelected ? '2px solid #FFFFFF' : '1.5px solid rgba(255,255,255,0.7)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    zIndex: isTriggerSelected ? 18 : 12,
                    boxShadow: isTriggerSelected ? '0 0 14px #38BDF8' : '0 0 8px rgba(56, 189, 248, 0.7)',
                    transition: 'all 100ms ease',
                  }}
                />
              );
            })}

            {/* Playhead */}
            <div
              style={{
                position: 'absolute', top: -4, bottom: -4,
                left: `${simProgress * 100}%`,
                width: 2, background: '#EF4444',
                transform: 'translateX(-50%)',
                pointerEvents: 'none', zIndex: 20,
                boxShadow: '0 0 4px rgba(239,68,68,0.5)',
              }}
            >
              {/* Playhead head */}
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 9, height: 9, background: '#EF4444', borderRadius: '0 0 2px 2px', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            </div>
          </div>

          {/* Scrub bar (below track) */}
          <input
            type="range"
            min={0} max={1000} step={1}
            value={Math.round(simProgress * 1000)}
            onChange={(e) => {
              setSimProgress(parseInt(e.target.value, 10) / 1000);
              setPlaying(false);
            }}
            style={{ width: '100%', marginTop: 6, accentColor: '#C3F910', cursor: 'pointer', height: 3 }}
          />
        </div>

        {/* ── Selected keyframe inspector ───────────────────────────────── */}
        {selectedKf && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isLedMode ? '#38BDF8' : '#C3F910', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Crosshair style={{ width: 12, height: 12 }} />
              {isLedMode ? 'Structure LED — ' : 'Caméra Globale — '}{selectedKf.name} — Paramètres
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([
                { key: 'time', label: 'Temps', min: 0, max: 1, step: 0.001, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
                { key: 'zoom', label: 'Zoom', min: 0.5, max: 25, step: 0.01, fmt: (v: number) => `${v.toFixed(2)}×` },
                { key: 'x', label: 'Pan X', min: -100, max: 100, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
                { key: 'y', label: 'Pan Y', min: -100, max: 100, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
                { key: 'originX', label: 'Orig. X', min: 0, max: 100, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
                { key: 'originY', label: 'Orig. Y', min: 0, max: 100, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
              ] as { key: keyof CameraKeyframe; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[]).map(({ key, label, min, max, step, fmt }) => {
                const val = selectedKf[key] as number;
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
                      <span style={{ fontSize: 9, color: '#C3F910', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(val)}</span>
                    </div>
                    <input
                      type="range"
                      min={min} max={max} step={step}
                      value={val}
                      onChange={(e) => activeOnKeyframeChange(selectedKf.id, { [key]: parseFloat(parseFloat(e.target.value).toFixed(3)) })}
                      style={{ accentColor: '#C3F910', cursor: 'pointer' }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Easing selector */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '.06em' }}>Easing</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['linear', 'easeIn', 'easeOut', 'easeInOut'] as KeyframeEasing[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => activeOnKeyframeChange(selectedKf.id, { easing: e })}
                    style={{
                      padding: '3px 9px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                      border: selectedKf.easing === e ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedKf.easing === e ? '#C3F910' : 'rgba(255,255,255,0.05)',
                      color: selectedKf.easing === e ? '#05070B' : '#6B7280',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* D-pad nudge */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#6B7280' }}>Ajust. fin</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => nudge('x', -0.2)} style={dpadBtnStyle}><ArrowLeft style={{ width: 10, height: 10 }} /></button>
                <button type="button" onClick={() => nudge('y', 0.2)} style={dpadBtnStyle}><ArrowUp style={{ width: 10, height: 10 }} /></button>
                <button type="button" onClick={() => nudge('y', -0.2)} style={dpadBtnStyle}><ArrowDown style={{ width: 10, height: 10 }} /></button>
                <button type="button" onClick={() => nudge('x', 0.2)} style={dpadBtnStyle}><ArrowRight style={{ width: 10, height: 10 }} /></button>
                <button type="button" onClick={() => nudge('zoom', 0.05)} style={dpadBtnStyle}><ZoomIn style={{ width: 10, height: 10 }} /></button>
                <button type="button" onClick={() => nudge('zoom', -0.05)} style={{ ...dpadBtnStyle }}>−</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen mode extra controls */}
      {studioMode === 'screen' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 14px', background: '#0D0E12', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }}>
          <button
            type="button"
            onClick={onToggleVideoOutline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: showVideoOutline ? 'rgba(195,249,16,0.12)' : 'rgba(255,255,255,0.05)',
              color: showVideoOutline ? '#C3F910' : '#9CA3AF',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Square style={{ width: 11, height: 11 }} />
            Contour
          </button>
          {showVideoOutline && (
            <VideoOutlineColorControl
              color={videoOutlineColor}
              onChangeColor={onChangeVideoOutlineColor}
            />
          )}
          <button
            type="button"
            onClick={onToggleLockAspect}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${lockAspect ? '#C3F910' : 'rgba(255,255,255,0.1)'}`, background: lockAspect ? 'rgba(195,249,16,0.12)' : 'rgba(255,255,255,0.05)', color: lockAspect ? '#C3F910' : '#9CA3AF', fontSize: 10, fontWeight: 700 }}
          >
            {lockAspect ? <Lock style={{ width: 10, height: 10 }} /> : <Unlock style={{ width: 10, height: 10 }} />}
            Ratio {lockAspect ? 'verrouillé' : 'libre'}
          </button>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6B7280', marginLeft: 'auto' }}>
            L: {screen.left.toFixed(2)}% T: {screen.top.toFixed(2)}% W: {screen.width.toFixed(2)}% H: {screen.height.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
}

const dpadBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#D1D5DB', cursor: 'pointer', fontSize: 11, fontWeight: 700,
};


// ═══════════════════════════════════════════════════════════════════════════
// VideoScreenSettingsPanel – Réglages de l'écran vidéo sur l'image maître
// ═══════════════════════════════════════════════════════════════════════════

function VideoScreenSettingsPanel({
  screen,
  onChange,
  lockAspect,
  onToggleLockAspect,
  showVideoOutline,
  videoOutlineColor,
  onToggleVideoOutline,
  onChangeVideoOutlineColor,
  onResetDefault,
}: {
  screen: CameraScreenCoords;
  onChange: (sc: CameraScreenCoords) => void;
  lockAspect: boolean;
  onToggleLockAspect: () => void;
  showVideoOutline: boolean;
  videoOutlineColor: string;
  onToggleVideoOutline: () => void;
  onChangeVideoOutlineColor: (color: string) => void;
  onResetDefault: () => void;
}) {
  const aspect = screen.width / Math.max(screen.height, 0.01);

  const updateCoord = (key: keyof CameraScreenCoords, val: number) => {
    const newScreen = { ...screen, [key]: parseFloat(val.toFixed(2)) };
    if (lockAspect) {
      if (key === 'width') {
        newScreen.height = parseFloat((val / aspect).toFixed(2));
      } else if (key === 'height') {
        newScreen.width = parseFloat((val * aspect).toFixed(2));
      }
    }
    onChange(newScreen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>
          Cadrage de l'Écran Vidéo
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
          Définissez la position de l'écran vidéo sur l'image maître. La vidéo reste parfaitement ancrée pendant toutes les translations et zooms de caméra.
        </div>
      </div>

      {/* Sliders de position */}
      <div style={{ display: 'grid', gap: 14 }}>
        <SliderField
          label="Position X (gauche)"
          value={screen.left}
          min={0}
          max={90}
          step={0.01}
          unit="%"
          onChange={(v) => updateCoord('left', v)}
          onReset={() => updateCoord('left', DEFAULT_SCREEN_COORDS.left)}
          defaultVal={DEFAULT_SCREEN_COORDS.left}
        />
        <SliderField
          label="Position Y (haut)"
          value={screen.top}
          min={0}
          max={90}
          step={0.01}
          unit="%"
          onChange={(v) => updateCoord('top', v)}
          onReset={() => updateCoord('top', DEFAULT_SCREEN_COORDS.top)}
          defaultVal={DEFAULT_SCREEN_COORDS.top}
        />
        <SliderField
          label="Largeur"
          value={screen.width}
          min={1}
          max={90}
          step={0.01}
          unit="%"
          onChange={(v) => updateCoord('width', v)}
          onReset={() => updateCoord('width', DEFAULT_SCREEN_COORDS.width)}
          defaultVal={DEFAULT_SCREEN_COORDS.width}
        />
        <SliderField
          label="Hauteur"
          value={screen.height}
          min={1}
          max={90}
          step={0.01}
          unit="%"
          onChange={(v) => updateCoord('height', v)}
          onReset={() => updateCoord('height', DEFAULT_SCREEN_COORDS.height)}
          defaultVal={DEFAULT_SCREEN_COORDS.height}
        />
      </div>

      {/* Options contour et ratio */}
      <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Affichage & Options
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            type="button"
            onClick={onToggleLockAspect}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${lockAspect ? '#C3F910' : 'rgba(255,255,255,0.1)'}`,
              background: lockAspect ? 'rgba(195,249,16,0.12)' : 'rgba(255,255,255,0.05)',
              color: lockAspect ? '#C3F910' : '#9CA3AF',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lockAspect ? <Lock style={{ width: 12, height: 12 }} /> : <Unlock style={{ width: 12, height: 12 }} />}
            Ratio {lockAspect ? 'verrouillé' : 'libre'}
          </button>

          <button
            type="button"
            onClick={onToggleVideoOutline}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${showVideoOutline ? '#C3F910' : 'rgba(255,255,255,0.1)'}`,
              background: showVideoOutline ? 'rgba(195,249,16,0.12)' : 'rgba(255,255,255,0.05)',
              color: showVideoOutline ? '#C3F910' : '#9CA3AF',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Square style={{ width: 12, height: 12 }} />
            Contour : {showVideoOutline ? 'Actif' : 'Masqué'}
          </button>
        </div>

        {showVideoOutline && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Couleur du contour</span>
            <VideoOutlineColorControl color={videoOutlineColor} onChangeColor={onChangeVideoOutlineColor} />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onResetDefault}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#9CA3AF',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <RotateCcw style={{ width: 12, height: 12 }} />
        Restaurer le cadrage par défaut
      </button>
    </div>
  );
}

function ScreenSidebarControls({
  layerIndex,
  screen,
  allScreens = [],
  lockAspect,
  onToggleLockAspect,
  showOnionSkin,
  onToggleOnionSkin,
  onionOpacity,
  onChangeOnionOpacity,
  showVideoOutline,
  videoOutlineColor,
  onToggleVideoOutline,
  onChangeVideoOutlineColor,
  onChange,
  onAdaptZoomAndVideo,
  onSave,
  isSaving,
  hasUnsaved,
}: {
  layerIndex: number;
  screen: ScreenCoords;
  allScreens?: (ScreenCoords | null)[];
  lockAspect: boolean;
  onToggleLockAspect: () => void;
  showOnionSkin: boolean;
  onToggleOnionSkin: () => void;
  onionOpacity: number;
  onChangeOnionOpacity: (op: number) => void;
  showVideoOutline: boolean;
  videoOutlineColor: string;
  onToggleVideoOutline: () => void;
  onChangeVideoOutlineColor: (color: string) => void;
  onChange: (sc: ScreenCoords) => void;
  onAdaptZoomAndVideo: (layerIdx: number, sc: ScreenCoords) => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsaved: boolean;
}) {
  const defaultScreen = LAYERS[layerIndex].defaultScreen;
  const prevLayerIndex = layerIndex > 0 ? layerIndex - 1 : null;

  const sl = (key: keyof ScreenCoords, label: string, min: number, max: number) => (
    <SliderField
      label={label}
      value={screen[key]}
      min={min}
      max={max}
      step={0.01}
      unit="%"
      onChange={(v) => onChange({ ...screen, [key]: parseFloat(v.toFixed(2)) })}
      onReset={() => onChange({ ...screen, [key]: defaultScreen?.[key] ?? 0 })}
      defaultVal={defaultScreen?.[key]}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Bouton Enregistrer Principal */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 10,
          border: 'none',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          background: hasUnsaved ? '#C3F910' : 'rgba(195,249,16,0.15)',
          color: hasUnsaved ? '#05070B' : '#C3F910',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: hasUnsaved ? '0 4px 16px rgba(195,249,16,0.25)' : 'none',
          transition: 'all 200ms ease',
        }}
      >
        {isSaving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
        {hasUnsaved ? 'Enregistrer les modifications' : 'Configuration enregistrée'}
      </button>

      {/* Bouton Adapter le zoom et la vidéo */}
      <button
        type="button"
        onClick={() => onAdaptZoomAndVideo(layerIndex, screen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(195, 249, 16, 0.4)',
          background: 'rgba(195, 249, 16, 0.12)',
          color: '#C3F910',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Sparkles style={{ width: 14, height: 14 }} />
        Adapter le zoom & la vidéo
      </button>

      {/* Outils d'alignement et ratio */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Outils de cadrage
        </div>

        <button
          type="button"
          onClick={onToggleLockAspect}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${lockAspect ? '#C3F910' : 'rgba(255,255,255,0.1)'}`,
            background: lockAspect ? 'rgba(195, 249, 16, 0.15)' : 'rgba(255,255,255,0.04)',
            color: lockAspect ? '#C3F910' : '#D1D5DB',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lockAspect ? <Lock style={{ width: 13, height: 13 }} /> : <Unlock style={{ width: 13, height: 13 }} />}
          Ratio d'aspect : {lockAspect ? 'Verrouillé' : 'Libre'}
        </button>

        {prevLayerIndex !== null && (
          <button
            type="button"
            onClick={onToggleOnionSkin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${showOnionSkin ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              background: showOnionSkin ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
              color: showOnionSkin ? '#38BDF8' : '#D1D5DB',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Eye style={{ width: 13, height: 13 }} />
            Superposition Étape 0{prevLayerIndex + 1} : {showOnionSkin ? 'Activée' : 'Désactivée'}
          </button>
        )}

        {showOnionSkin && prevLayerIndex !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 600 }}>Opacité :</span>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={onionOpacity}
              onChange={(e) => onChangeOnionOpacity(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#38BDF8', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#38BDF8' }}>
              {Math.round(onionOpacity * 100)}%
            </span>
          </div>
        )}

        {/* Contour vidéo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <button
            type="button"
            onClick={onToggleVideoOutline}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${showVideoOutline ? videoOutlineColor : 'rgba(255,255,255,0.1)'}`,
              background: showVideoOutline ? hexToRgba(videoOutlineColor, 0.15) : 'rgba(255,255,255,0.04)',
              color: showVideoOutline ? videoOutlineColor : '#9CA3AF',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Square style={{ width: 12, height: 12 }} />
            Contour : {showVideoOutline ? 'Activé' : 'Désactivé'}
          </button>
          {showVideoOutline && (
            <VideoOutlineColorControl
              color={videoOutlineColor}
              onChangeColor={onChangeVideoOutlineColor}
            />
          )}
        </div>
      </div>

      {/* Sliders de position */}
      <div style={{ display: 'grid', gap: 14 }}>
        {sl('left', 'Position X (gauche)', 0, 90)}
        {sl('top', 'Position Y (haut)', 0, 90)}
        {sl('width', 'Largeur', 1, 80)}
        {sl('height', 'Hauteur', 1, 80)}
      </div>

      <button
        type="button"
        onClick={() => defaultScreen && onChange(defaultScreen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#6B7280',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        <RotateCcw style={{ width: 11, height: 11 }} />
        Réinitialiser cette étape
      </button>
    </div>
  );
}

// ─── Texts Panel (simplified) ─────────────────────────────────────────────────

const TEXT_FIELDS = [
  { key: 'label', label: 'Libellé section (haut gauche)', defaultFr: 'PIXIATECH / SHOWREEL EXPÉRIENCE' },
  { key: 'scrollHint', label: 'Indicateur de défilement', defaultFr: 'FAITES DÉFILER — DU LOIN AU CŒUR DES LEDS' },
  { key: 'eyebrow', label: 'Surtitre intro', defaultFr: '02 / SHOWREEL — DU GRAND PAYSAGE AUX DIODES RGB' },
  { key: 'head1', label: 'Titre H1 — Ligne 1', defaultFr: 'AFFICHEZ' },
  { key: 'head2', label: 'Titre H1 — Ligne 2', defaultFr: "L'IMPOSSIBLE." },
  { key: 'lede', label: 'Texte intro', defaultFr: "Faites défiler — la caméra avance de la métropole jusqu'à plonger au cœur des micro-diodes LED.", multiline: true },
  { key: 'ch1Eyebrow', label: 'Étape 01 — Surtitre', defaultFr: '01 / LA MÉTROPOLE' },
  { key: 'ch1TitleLine1', label: 'Étape 01 — Titre L1', defaultFr: "L'Écran à l'Échelle" },
  { key: 'ch1TitleLine2', label: 'Étape 01 — Titre L2', defaultFr: 'de la métropole.' },
  { key: 'ch1Desc', label: 'Étape 01 — Description', defaultFr: "Visible à des kilomètres dans la nuit urbaine, la technologie d'affichage monumental PIXIATECH rayonne avec une luminosité crête de 10,000 nits.", multiline: true },
  { key: 'ch2Eyebrow', label: 'Étape 02 — Surtitre', defaultFr: "02 / L'ATRIUM" },
  { key: 'ch2TitleLine1', label: 'Étape 02 — Titre L1', defaultFr: 'Intégration Façade' },
  { key: 'ch2TitleLine2', label: 'Étape 02 — Titre L2', defaultFr: '& structure de verre.' },
  { key: 'ch2Desc', label: 'Étape 02 — Description', defaultFr: "Châssis architectural affleurant, usiné au micron près.", multiline: true },
  { key: 'ch3Eyebrow', label: 'Étape 03 — Surtitre', defaultFr: '03 / LE MUR DE CABINETS' },
  { key: 'ch3TitleLine1', label: 'Étape 03 — Titre L1', defaultFr: 'Matrice de Micro-LEDs' },
  { key: 'ch3TitleLine2', label: 'Étape 03 — Titre L2', defaultFr: '& trame des sous-pixels.' },
  { key: 'ch3Desc', label: 'Étape 03 — Description', defaultFr: "Approchez-vous du mur : verrous magnétiques d'une planéité submillimétrique.", multiline: true },
  { key: 'ch4Eyebrow', label: 'Étape 04 — Surtitre', defaultFr: '04 / PLONGÉE DANS LE PIXEL' },
  { key: 'ch4TitleLine1', label: 'Étape 04 — Titre L1', defaultFr: 'Au cœur de la diode' },
  { key: 'ch4TitleLine2', label: 'Étape 04 — Titre L2', defaultFr: 'MicroLED P0.9.' },
  { key: 'ch4Desc', label: 'Étape 04 — Description', defaultFr: "Vous entrez dans la matière : diodes microLED liées sur substrat saphir.", multiline: true },
  { key: 'cta', label: 'Bouton CTA (fin)', defaultFr: 'Lancer un projet sur-mesure →' },
];

// ─── Main Module ───────────────────────────────────────────────────────────────

export default function ShowreelAdminModule() {
  const {
    pages,
    setCurrentPageId,
    updateSectionField,
    updateSectionFieldLocalized,
    saveCurrentPage,
    saveStatus,
    restorePageFromServer,
    isAdmin,
    adminChecked,
  } = useCms();

  useEffect(() => {
    setCurrentPageId('home');
  }, [setCurrentPageId]);

  const [activeTab, setActiveTab] = useState<StudioTab>('media');
  const [selectedKeyId, setSelectedKeyId] = React.useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'fr' | 'en'>('fr');
  const [saving, setSaving] = useState(false);
  const [activeScreenLayer, setActiveScreenLayer] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | null>(1);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTextStep, setActiveTextStep] = useState<string | null>('intro');
  const [lockAspect, setLockAspect] = useState<boolean>(false);
  const [showOnionSkin, setShowOnionSkin] = useState<boolean>(false);
  const [onionOpacity, setOnionOpacity] = useState<number>(0.45);

  const cmsData = useMemo(
    () => (pages['home']?.sections?.showreel as Record<string, unknown>) || {},
    [pages]
  );

  // Dérivé directement du CMS (évite toute mutation d'état pendant le rendu)
  const showVideoOutline = cmsData['showVideoOutline'] !== false && cmsData['showVideoOutline'] !== 'false';

  // Multilingual video support
  const videoFr = useMemo(
    () => getCmsText(cmsData, 'videoUrl', 'fr', (cmsData['videoUrl'] as string | undefined) || '/youtube-video.mp4'),
    [cmsData]
  );

  const videoEnRaw = useMemo(
    () => ((cmsData._i18n as Record<string, Record<string, { value?: string }>> | undefined)?.['videoUrl']?.['en']?.value as string | undefined) || '',
    [cmsData]
  );

  const [videoLangMode, setVideoLangMode] = useState<'shared' | 'independent'>(() => {
    const saved = cmsData['videoLangMode'] as string | undefined;
    if (saved === 'shared' || saved === 'independent') return saved;
    return videoEnRaw && videoEnRaw !== videoFr ? 'independent' : 'shared';
  });

  const [selectedVideoLang, setSelectedVideoLang] = useState<'fr' | 'en'>('fr');

  const activeVideoUrl = useMemo(() => {
    if (videoLangMode === 'shared') {
      return videoFr;
    }
    if (selectedVideoLang === 'en') {
      return videoEnRaw || videoFr;
    }
    return videoFr;
  }, [videoLangMode, selectedVideoLang, videoFr, videoEnRaw]);

  // Derived values from CMS (active video based on language/mode)
  const videoSrc = activeVideoUrl;

  // ── Camera Keyframes & Structure LED Independent Animations ─────────────────
  const keyframes: CameraKeyframe[] = React.useMemo(
    () => parseKeyframesFromCms(cmsData['cameraKeyframes']),
    [cmsData]
  );

  const ledKeyframes: CameraKeyframe[] = React.useMemo(
    () => parseLedKeyframesFromCms(cmsData['ledKeyframes']),
    [cmsData]
  );

  const ledTriggers: LedAnimationTrigger[] = React.useMemo(
    () => parseLedTriggersFromCms(cmsData['ledTriggers']),
    [cmsData]
  );

  const [selectedLedKeyId, setSelectedLedKeyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedLedKeyId && ledKeyframes.length > 0) {
      setSelectedLedKeyId(ledKeyframes[0].id);
    }
  }, [ledKeyframes, selectedLedKeyId]);

  const masterImageSrc: string =
    (cmsData['masterImageSrc'] as string | undefined) ||
    (cmsData['image1Src'] as string | undefined) ||
    DEFAULT_MASTER_IMAGE;

  const videoScreen: CameraScreenCoords = {
    left: parseFloat((cmsData['videoScreenLeft'] as string | undefined) || String(DEFAULT_SCREEN_COORDS.left)),
    top: parseFloat((cmsData['videoScreenTop'] as string | undefined) || String(DEFAULT_SCREEN_COORDS.top)),
    width: parseFloat((cmsData['videoScreenWidth'] as string | undefined) || String(DEFAULT_SCREEN_COORDS.width)),
    height: parseFloat((cmsData['videoScreenHeight'] as string | undefined) || String(DEFAULT_SCREEN_COORDS.height)),
  };

  // Ensure selectedKeyId is initialized when keyframes load
  React.useEffect(() => {
    if (!selectedKeyId && keyframes.length > 0) {
      setSelectedKeyId(keyframes[0].id);
    }
  }, [keyframes, selectedKeyId]);

  const handleVideoScreenChange = useCallback(
    (sc: CameraScreenCoords) => {
      updateSectionField('showreel', 'videoScreenLeft', String(sc.left));
      updateSectionField('showreel', 'videoScreenTop', String(sc.top));
      updateSectionField('showreel', 'videoScreenWidth', String(sc.width));
      updateSectionField('showreel', 'videoScreenHeight', String(sc.height));
      markUnsaved();
    },
    [updateSectionField]
  );

  const handleResetDefaultVideoScreen = useCallback(() => {
    handleVideoScreenChange(DEFAULT_SCREEN_COORDS);
    toast.success("Position de l'écran réinitialisée par défaut.");
  }, [handleVideoScreenChange]);


  const handleMasterImageChange = useCallback(
    (url: string) => {
      updateSectionField('showreel', 'masterImageSrc', url);
      markUnsaved();
    },
    [updateSectionField]
  );

  const handleResetKeyframes = useCallback(() => {
    if (!confirm('Réinitialiser toutes les images clés aux valeurs par défaut ?')) return;
    updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(DEFAULT_KEYFRAMES));
    setSelectedKeyId(DEFAULT_KEYFRAMES[0].id);
    markUnsaved();
    toast.success('Images clés réinitialisées.');
  }, [updateSectionField]);


  const imageSrcs = LAYERS.map(
    (l) => (cmsData[l.key] as string | undefined) || l.defaultSrc
  );

  const screens: (ScreenCoords | null)[] = LAYERS.map((l) => {
    if (!l.screenKey) return null;
    const k = l.screenKey;
    return {
      left: parseFloat((cmsData[`${k}Left`] as string | undefined) || String(l.defaultScreen?.left ?? 0)),
      top: parseFloat((cmsData[`${k}Top`] as string | undefined) || String(l.defaultScreen?.top ?? 0)),
      width: parseFloat((cmsData[`${k}Width`] as string | undefined) || String(l.defaultScreen?.width ?? 10)),
      height: parseFloat((cmsData[`${k}Height`] as string | undefined) || String(l.defaultScreen?.height ?? 10)),
    };
  });

  const imageAdjustments: ImageAdjustment[] = useMemo(() => {
    return [1, 2, 3, 4, 5].map((num) => {
      const p = `img${num}`;
      return {
        posX: parseFloat((cmsData[`${p}PosX`] as string | undefined) || '0'),
        posY: parseFloat((cmsData[`${p}PosY`] as string | undefined) || '0'),
        scale: parseFloat((cmsData[`${p}Scale`] as string | undefined) || '1'),
        width: parseFloat((cmsData[`${p}Width`] as string | undefined) || '100'),
        height: parseFloat((cmsData[`${p}Height`] as string | undefined) || '100'),
      };
    });
  }, [cmsData]);

  const markUnsaved = () => setHasUnsaved(true);

  const handleToggleVideoOutline = useCallback(() => {
    const next = !showVideoOutline;
    updateSectionField('showreel', 'showVideoOutline', next);
    markUnsaved();
    toast.success(next ? 'Contour de l\'écran activé' : 'Contour désactivé');
  }, [showVideoOutline, updateSectionField, markUnsaved]);

  const ledCustomImageSrc = (cmsData['ledCustomImageSrc'] as string | undefined) || '';

  const handleLedCustomImageChange = useCallback(
    (url: string) => {
      updateSectionField('showreel', 'ledCustomImageSrc', url);
      markUnsaved();
      toast.success('Photo personnalisée pour les LEDs appliquée.');
    },
    [updateSectionField, markUnsaved]
  );

  const handleRestoreDefaultLed = useCallback(() => {
    updateSectionField('showreel', 'ledCustomImageSrc', '');
    markUnsaved();
    toast.success('Rendu vectoriel des LEDs par défaut restauré.');
  }, [updateSectionField, markUnsaved]);


  // ── Pile d'historique Undo / Redo (Ctrl+Z / Ctrl+Y) ───────────────────────
  const [undoStack, setUndoStack] = React.useState<CameraKeyframe[][]>([]);
  const [redoStack, setRedoStack] = React.useState<CameraKeyframe[][]>([]);

  const pushToHistory = useCallback((currentKeyframes: CameraKeyframe[]) => {
    setUndoStack((prev) => [...prev.slice(-30), currentKeyframes]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, keyframes]);
    updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(previous));
    setSelectedKeyId(previous[0]?.id || null);
    markUnsaved();
    toast.success('Modification annulée (Ctrl+Z)');
  }, [undoStack, keyframes, updateSectionField, markUnsaved]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, keyframes]);
    updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(next));
    setSelectedKeyId(next[0]?.id || null);
    markUnsaved();
    toast.success('Modification rétablie (Ctrl+Y)');
  }, [redoStack, keyframes, updateSectionField, markUnsaved]);

  // Écouteur global des raccourcis clavier Ctrl+Z / Ctrl+Y
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleKeyframeChange = useCallback(
    (id: string, patch: Partial<CameraKeyframe>) => {
      pushToHistory(keyframes);
      const updated = keyframes.map((k) => (k.id === id ? { ...k, ...patch } : k));
      updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(updated));
      markUnsaved();
    },
    [keyframes, updateSectionField, pushToHistory, markUnsaved]
  );

  const handleAddKeyframe = useCallback(
    (atTime: number) => {
      pushToHistory(keyframes);
      const cam = evaluateCamera(keyframes, atTime);

      // Trouver le plus petit numéro de clé disponible (ex: si 01, 02, 04 existent -> crée 03)
      const existingNums = new Set(
        keyframes.map((k) => {
          const m = k.name.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        })
      );
      let nextNum = 1;
      while (existingNums.has(nextNum)) {
        nextNum++;
      }
      const newName = `Clé ${String(nextNum).padStart(2, '0')}`;

      const newKf: CameraKeyframe = {
        id: `kf-${Date.now()}`,
        name: newName,
        time: parseFloat(atTime.toFixed(3)),
        zoom: cam.zoom,
        x: cam.x,
        y: cam.y,
        originX: cam.originX,
        originY: cam.originY,
        easing: 'easeInOut',
      };
      const updated = [...keyframes, newKf].sort((a, b) => a.time - b.time);
      updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(updated));
      setSelectedKeyId(newKf.id);
      markUnsaved();
      toast.success(`Clé "${newKf.name}" ajoutée à ${(atTime * 100).toFixed(1)}%.`);
    },
    [keyframes, updateSectionField, pushToHistory, markUnsaved]
  );

  const handleDeleteKeyframe = useCallback(
    (id: string) => {
      if (keyframes.length <= 1) {
        toast.error('Vous devez conserver au moins une image clé.');
        return;
      }
      pushToHistory(keyframes);
      const deletedKf = keyframes.find((k) => k.id === id);
      const updated = keyframes.filter((k) => k.id !== id);
      updateSectionField('showreel', 'cameraKeyframes', JSON.stringify(updated));
      setSelectedKeyId(updated[0]?.id || null);
      markUnsaved();
      toast.success(`Image clé "${deletedKf?.name || 'Clé'}" supprimée. Appuyez sur Ctrl+Z pour annuler.`);
    },
    [keyframes, updateSectionField, pushToHistory, markUnsaved]
  );

  // ── Handlers Structure LED (Indépendants de la Caméra Globale) ────────────
  const handleLedKeyframeChange = useCallback(
    (id: string, patch: Partial<CameraKeyframe>) => {
      const updated = ledKeyframes.map((k) => (k.id === id ? { ...k, ...patch } : k));
      updateSectionField('showreel', 'ledKeyframes', JSON.stringify(updated));
      markUnsaved();
    },
    [ledKeyframes, updateSectionField]
  );

  const handleAddLedKeyframe = useCallback(
    (atTime: number) => {
      const cam = evaluateCamera(ledKeyframes, atTime);
      const existingNums = new Set(
        ledKeyframes.map((k) => {
          const m = k.name.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        })
      );
      let nextNum = 1;
      while (existingNums.has(nextNum)) {
        nextNum++;
      }
      const newName = `Clé ${String(nextNum).padStart(2, '0')}`;

      const newKf: CameraKeyframe = {
        id: `led-kf-${Date.now()}`,
        name: newName,
        time: parseFloat(atTime.toFixed(3)),
        zoom: cam.zoom,
        x: cam.x,
        y: cam.y,
        originX: cam.originX,
        originY: cam.originY,
        easing: 'easeInOut',
      };
      const updated = [...ledKeyframes, newKf].sort((a, b) => a.time - b.time);
      updateSectionField('showreel', 'ledKeyframes', JSON.stringify(updated));
      setSelectedLedKeyId(newKf.id);
      markUnsaved();
      toast.success(`Clé Structure LED "${newKf.name}" ajoutée à ${(atTime * 100).toFixed(1)}%.`);
    },
    [ledKeyframes, updateSectionField]
  );

  const handleDeleteLedKeyframe = useCallback(
    (id: string) => {
      if (ledKeyframes.length <= 1) {
        toast.error('Vous devez conserver au moins une image clé pour la Structure LED.');
        return;
      }
      const deletedKf = ledKeyframes.find((k) => k.id === id);
      const updated = ledKeyframes.filter((k) => k.id !== id);
      updateSectionField('showreel', 'ledKeyframes', JSON.stringify(updated));
      setSelectedLedKeyId(updated[0]?.id || null);
      markUnsaved();
      toast.success(`Image clé "${deletedKf?.name || 'Clé'}" de Structure LED supprimée.`);
    },
    [ledKeyframes, updateSectionField]
  );

  const handleAddLedTrigger = useCallback(
    (atTime: number) => {
      const clampedTime = parseFloat(Math.max(0, Math.min(1, atTime)).toFixed(3));
      const newTrig: LedAnimationTrigger = {
        id: `trig-${Date.now()}`,
        time: clampedTime,
        label: `Structure LED (${(clampedTime * 100).toFixed(0)}%)`,
      };
      const updated = [...ledTriggers, newTrig].sort((a, b) => a.time - b.time);
      updateSectionField('showreel', 'ledTriggers', JSON.stringify(updated));
      markUnsaved();
      toast.success(`Déclencheur Structure LED placé à ${(clampedTime * 100).toFixed(1)}%`);
    },
    [ledTriggers, updateSectionField]
  );

  const handleDeleteLedTrigger = useCallback(
    (id: string) => {
      const updated = ledTriggers.filter((t) => t.id !== id);
      updateSectionField('showreel', 'ledTriggers', JSON.stringify(updated));
      markUnsaved();
      toast.success('Déclencheur Structure LED supprimé.');
    },
    [ledTriggers, updateSectionField]
  );

  const showCodeLeds = cmsData['showCodeLeds'] !== false && cmsData['showCodeLeds'] !== 'false';

  // ── Interrupteurs CMS persistants (même pattern que showCodeLeds) ─────────────
  // Valeur par défaut : true (rétrocompatibilité — préserve le comportement existant)
  const animationEnabled =
    cmsData['animationEnabled'] !== false && cmsData['animationEnabled'] !== 'false';
  const imagesEnabled =
    cmsData['imagesEnabled'] !== false && cmsData['imagesEnabled'] !== 'false';

  const handleToggleAnimation = useCallback(() => {
    updateSectionField('showreel', 'animationEnabled', !animationEnabled);
    markUnsaved();
  }, [animationEnabled, updateSectionField]);

  const handleToggleImages = useCallback(() => {
    updateSectionField('showreel', 'imagesEnabled', !imagesEnabled);
    markUnsaved();
  }, [imagesEnabled, updateSectionField]);

  const handleVideoChange = useCallback(
    (url: string) => {
      if (videoLangMode === 'shared') {
        updateSectionFieldLocalized('showreel', 'videoUrl', url, 'fr', true);
        updateSectionFieldLocalized('showreel', 'videoUrl', url, 'en', true);
        updateSectionField('showreel', 'videoUrl', url);
        updateSectionField('showreel', 'videoLangMode', 'shared');
      } else {
        updateSectionFieldLocalized('showreel', 'videoUrl', url, selectedVideoLang, true);
        if (selectedVideoLang === 'fr') {
          updateSectionField('showreel', 'videoUrl', url);
        }
        updateSectionField('showreel', 'videoLangMode', 'independent');
      }
      markUnsaved();
    },
    [videoLangMode, selectedVideoLang, updateSectionFieldLocalized, updateSectionField]
  );

  const handleSetVideoLangMode = useCallback(
    (mode: 'shared' | 'independent') => {
      setVideoLangMode(mode);
      updateSectionField('showreel', 'videoLangMode', mode);
      if (mode === 'shared') {
        const urlToShare = activeVideoUrl;
        updateSectionFieldLocalized('showreel', 'videoUrl', urlToShare, 'fr', true);
        updateSectionFieldLocalized('showreel', 'videoUrl', urlToShare, 'en', true);
        updateSectionField('showreel', 'videoUrl', urlToShare);
      }
      markUnsaved();
    },
    [activeVideoUrl, updateSectionFieldLocalized, updateSectionField]
  );

  const handleDuplicateFrToEn = useCallback(() => {
    updateSectionFieldLocalized('showreel', 'videoUrl', videoFr, 'en', true);
    updateSectionField('showreel', 'videoLangMode', 'independent');
    setVideoLangMode('independent');
    setSelectedVideoLang('en');
    markUnsaved();
    toast.success('Vidéo française dupliquée vers la version anglaise.');
  }, [videoFr, updateSectionFieldLocalized, updateSectionField]);

  const handleImageChange = useCallback(
    (key: string, url: string) => {
      updateSectionField('showreel', key, url);
      markUnsaved();
    },
    [updateSectionField]
  );

  const handleImageAdjustmentChange = useCallback(
    (prefix: string, key: 'posX' | 'posY' | 'scale' | 'width' | 'height', value: number) => {
      const fieldKey = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
      updateSectionField('showreel', fieldKey, String(value));
      markUnsaved();
    },
    [updateSectionField]
  );

  const handleResetImageAdjustment = useCallback(
    (prefix: string) => {
      updateSectionField('showreel', `${prefix}PosX`, '0');
      updateSectionField('showreel', `${prefix}PosY`, '0');
      updateSectionField('showreel', `${prefix}Scale`, '1');
      updateSectionField('showreel', `${prefix}Width`, '100');
      updateSectionField('showreel', `${prefix}Height`, '100');
      markUnsaved();
    },
    [updateSectionField]
  );

  const handleScreenChange = useCallback(
    (screenKey: string, sc: ScreenCoords) => {
      updateSectionField('showreel', `${screenKey}Left`, String(sc.left));
      updateSectionField('showreel', `${screenKey}Top`, String(sc.top));
      updateSectionField('showreel', `${screenKey}Width`, String(sc.width));
      updateSectionField('showreel', `${screenKey}Height`, String(sc.height));
      markUnsaved();
    },
    [updateSectionField]
  );

  /**
   * handleAdaptZoomAndVideo — Continuité géométrique complète entre les étapes.
   *
   * Pour chaque étape, on calcule :
   *   • originX / originY  = centre du rectangle calibré (point fixe de zoom)
   *   • scaleMax           = (largeur rect suivant / largeur rect courant) - 1
   *                          = le facteur de grossissement nécessaire pour que le
   *                            rectangle courant devienne aussi grand que le suivant
   *   • XShift / YShift    = translation caméra calculée pour aligner les centres
   *                          sans toucher aux YShift legacy (on ne les écrase pas)
   *
   * Le calcul garantit :  position X, Y, largeur, hauteur, ratio, échelle apparente.
   */
  const handleAdaptZoomAndVideo = useCallback(
    (layerIdx: number, sc: ScreenCoords) => {
      // Centre normalisé du rectangle calibré (= point fixe du zoom)
      const cx = parseFloat((sc.left + sc.width / 2).toFixed(3));
      const cy = parseFloat((sc.top + sc.height / 2).toFixed(3));

      // ── Helpers ──────────────────────────────────────────────────────────────
      /** scaleMax pour que le rect courant (wCur) occupe la même place que le suivant (wNext) */
      const calcScaleMax = (wCur: number, wNext: number): number => {
        if (wCur <= 0 || wNext <= 0) return 1.0;
        return Math.max(0.3, Math.min(4.0, parseFloat(((wNext / wCur) - 1).toFixed(3))));
      };

      // ── Étape 01 ─────────────────────────────────────────────────────────────
      if (layerIdx === 0) {
        updateSectionField('showreel', 'screen1Left', String(sc.left));
        updateSectionField('showreel', 'screen1Top', String(sc.top));
        updateSectionField('showreel', 'screen1Width', String(sc.width));
        updateSectionField('showreel', 'screen1Height', String(sc.height));
        // Origine = centre exact du rectangle calibré image 1
        updateSectionField('showreel', 'l1OriginX', String(cx));
        updateSectionField('showreel', 'l1OriginY', String(cy));

        const s2 = screens[1];
        if (s2 && s2.width > 0) {
          const cx2 = parseFloat((s2.left + s2.width / 2).toFixed(3));
          const cy2 = parseFloat((s2.top + s2.height / 2).toFixed(3));
          const sm = calcScaleMax(sc.width, s2.width);
          updateSectionField('showreel', 'l1ScaleMax', String(sm));
          // Continuité géométrique absolue : déplacement de caméra X & Y pendant le zoom
          // À la fin du zoom (p1=1), le centre (cx, cy) de l'image 1 arrive exactement en (cx2, cy2)
          const travelX = parseFloat((cx2 - cx).toFixed(3));
          const travelY = parseFloat((cy - cy2).toFixed(3)); // yShift est soustrait (cy - travelY = cy2)
          updateSectionField('showreel', 'l1XShift', String(travelX));
          updateSectionField('showreel', 'l1YShift', String(travelY));
          // Neutraliser le décalage initial au repos pour éviter tout saut de cadre en mode statique
          updateSectionField('showreel', 'l1CamPosX', '0');
          updateSectionField('showreel', 'l1CamPosY', '0');
        }

        markUnsaved();
        toast.success(`Étape 01 adaptée — origine (${cx}%, ${cy}%), zoom continu vers étape 02 garanti.`);

      // ── Étape 02 ─────────────────────────────────────────────────────────────
      } else if (layerIdx === 1) {
        updateSectionField('showreel', 'screen2Left', String(sc.left));
        updateSectionField('showreel', 'screen2Top', String(sc.top));
        updateSectionField('showreel', 'screen2Width', String(sc.width));
        updateSectionField('showreel', 'screen2Height', String(sc.height));
        // Origine = centre exact du rectangle calibré image 2
        updateSectionField('showreel', 'l2OriginX', String(cx));
        updateSectionField('showreel', 'l2OriginY', String(cy));

        // Recalculer étape 01 ➔ 02 pour que l'arrivée colle parfaitement au nouveau rectangle 02
        const s1 = screens[0];
        if (s1 && s1.width > 0) {
          const cx1 = parseFloat((s1.left + s1.width / 2).toFixed(3));
          const cy1 = parseFloat((s1.top + s1.height / 2).toFixed(3));
          const sm1 = calcScaleMax(s1.width, sc.width);
          updateSectionField('showreel', 'l1ScaleMax', String(sm1));
          updateSectionField('showreel', 'l1XShift', String(parseFloat((cx - cx1).toFixed(3))));
          updateSectionField('showreel', 'l1YShift', String(parseFloat((cy1 - cy).toFixed(3))));
          updateSectionField('showreel', 'l1CamPosX', '0');
          updateSectionField('showreel', 'l1CamPosY', '0');
        }

        // Calculer étape 02 ➔ 03 pour la transition vers l'étape 03
        const s3 = screens[2];
        if (s3 && s3.width > 0) {
          const cx3 = parseFloat((s3.left + s3.width / 2).toFixed(3));
          const cy3 = parseFloat((s3.top + s3.height / 2).toFixed(3));
          const sm2 = calcScaleMax(sc.width, s3.width);
          updateSectionField('showreel', 'l2ScaleMax', String(sm2));
          updateSectionField('showreel', 'l2XShift', String(parseFloat((cx3 - cx).toFixed(3))));
          updateSectionField('showreel', 'l2YShift', String(parseFloat((cy - cy3).toFixed(3))));
          updateSectionField('showreel', 'l2CamPosX', '0');
          updateSectionField('showreel', 'l2CamPosY', '0');
        }

        markUnsaved();
        toast.success(`Étape 02 adaptée — continuité 01 ➔ 02 ➔ 03 recalculée.`);

      // ── Étape 03 ─────────────────────────────────────────────────────────────
      } else if (layerIdx === 2) {
        updateSectionField('showreel', 'screen3Left', String(sc.left));
        updateSectionField('showreel', 'screen3Top', String(sc.top));
        updateSectionField('showreel', 'screen3Width', String(sc.width));
        updateSectionField('showreel', 'screen3Height', String(sc.height));
        // Origine = centre exact du rectangle calibré image 3
        updateSectionField('showreel', 'l3OriginX', String(cx));
        updateSectionField('showreel', 'l3OriginY', String(cy));

        // Recalculer étape 02 ➔ 03 pour que l'arrivée colle parfaitement au nouveau rectangle 03
        const s2 = screens[1];
        if (s2 && s2.width > 0) {
          const cx2 = parseFloat((s2.left + s2.width / 2).toFixed(3));
          const cy2 = parseFloat((s2.top + s2.height / 2).toFixed(3));
          const sm2 = calcScaleMax(s2.width, sc.width);
          updateSectionField('showreel', 'l2ScaleMax', String(sm2));
          updateSectionField('showreel', 'l2XShift', String(parseFloat((cx - cx2).toFixed(3))));
          updateSectionField('showreel', 'l2YShift', String(parseFloat((cy2 - cy).toFixed(3))));
          updateSectionField('showreel', 'l2CamPosX', '0');
          updateSectionField('showreel', 'l2CamPosY', '0');
        }

        markUnsaved();
        toast.success(`Étape 03 adaptée — continuité 02 ➔ 03 recalculée.`);
      }
    },
    [screens, updateSectionField]
  );

  const handleTextField = useCallback(
    (key: string, value: string) => {
      updateSectionFieldLocalized('showreel', key, value, selectedLang, true);
      markUnsaved();
    },
    [updateSectionFieldLocalized, selectedLang]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveCurrentPage(pages['home']);
      if (ok) {
        toast.success('Showreel 3D Studio enregistré avec succès.');
        setHasUnsaved(false);
      } else {
        toast.error('Échec de l\'enregistrement. Vérifiez votre connexion.');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Restaurer les dernières modifications publiées ? Les changements non enregistrés seront perdus.')) return;
    const ok = await restorePageFromServer();
    if (ok) {
      toast.success('Paramètres restaurés depuis le serveur.');
      setHasUnsaved(false);
    } else {
      toast.error('Impossible de restaurer. Vérifiez votre connexion.');
    }
  };

  if (adminChecked && !isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
        Accès réservé aux administrateurs.
      </div>
    );
  }

  const TABS: { id: StudioTab; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'media', label: 'Vidéo', icon: Film },
    { id: 'screen', label: 'Écran', icon: Monitor },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'camera', label: 'Animation', icon: Camera },
    { id: 'texts', label: 'Textes', icon: Globe },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100vh', width: '100%', background: '#09090B', color: '#F5F4F0', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #C3F910 0%, #8BE800 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Film style={{ width: 18, height: 18, color: '#05070B' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>
              Showreel 3D Studio
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              {hasUnsaved ? (
                <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Radio style={{ width: 8, height: 8 }} /> Modifications en attente
                </span>
              ) : (
                <span style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 style={{ width: 10, height: 10 }} /> Tout est enregistré
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/web#showreel"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB', fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
          >
            <ExternalLink style={{ width: 13, height: 13, color: '#C3F910' }} />
            Voir le Showreel
          </Link>

          <button
            type="button"
            onClick={handleRestore}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Restaurer
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveStatus === 'saving'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10,
              background: hasUnsaved ? '#C3F910' : 'rgba(195,249,16,0.15)',
              color: hasUnsaved ? '#05070B' : '#C3F910',
              border: 'none', fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: hasUnsaved ? '0 4px 20px rgba(195,249,16,0.3)' : 'none',
              opacity: saving ? 0.7 : 1, transition: 'all 200ms ease',
            }}
          >
            {saving || saveStatus === 'saving' ? (
              <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
            ) : (
              <><Save style={{ width: 13, height: 13 }} /> Enregistrer</>
            )}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, minHeight: 0, gap: 0, background: '#09090B' }}>

        {/* ── Left: Fenêtre Principale (Recadrage & Calibration ou Aperçu Animé) ── */}
        <div style={{ padding: 24, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 16, background: '#09090B' }}>
          {/* Barre d'en-tête du Studio : Mode Unique avec Sélection Rapide des Étapes */}
                    <VirtualCameraStudioCanvas
            masterImageSrc={masterImageSrc}
            videoSrc={videoSrc}
            screen={videoScreen}
            keyframes={keyframes}
            selectedKeyId={selectedKeyId}
            onSelectKey={setSelectedKeyId}
            onKeyframeChange={handleKeyframeChange}
            onAddKeyframe={handleAddKeyframe}
            onDeleteKeyframe={handleDeleteKeyframe}
            onScreenChange={handleVideoScreenChange}
            onSave={handleSave}
            isSaving={saving || saveStatus === 'saving'}
            hasUnsaved={hasUnsaved}
            showVideoOutline={showVideoOutline}
            videoOutlineColor={(cmsData['videoOutlineColor'] as string | undefined) || '#000000'}
            onToggleVideoOutline={handleToggleVideoOutline}
            onChangeVideoOutlineColor={(c) => {
              updateSectionField('showreel', 'videoOutlineColor', c);
              markUnsaved();
            }}
            lockAspect={lockAspect}
            onToggleLockAspect={() => setLockAspect((v) => !v)}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            ledCustomImageSrc={ledCustomImageSrc}
            onLedCustomImageChange={handleLedCustomImageChange}
            onRestoreDefaultLed={handleRestoreDefaultLed}
            ledKeyframes={ledKeyframes}
            selectedLedKeyId={selectedLedKeyId}
            onSelectLedKey={setSelectedLedKeyId}
            onLedKeyframeChange={handleLedKeyframeChange}
            onAddLedKeyframe={handleAddLedKeyframe}
            onDeleteLedKeyframe={handleDeleteLedKeyframe}
            ledTriggers={ledTriggers}
            onAddLedTrigger={handleAddLedTrigger}
            onDeleteLedTrigger={handleDeleteLedTrigger}
          />
        </div>

        {/* ── Right: Settings Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0D0E12' }}>

          {/* Tab nav */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 4px' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '12px 4px', border: 'none', background: 'transparent', cursor: 'pointer',
                    color: active ? '#C3F910' : '#6B7280',
                    borderBottom: active ? '2px solid #C3F910' : '2px solid transparent',
                    transition: 'all 180ms ease', fontSize: 10, fontWeight: active ? 700 : 500,
                    letterSpacing: '.04em',
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

            {/* ── MEDIA TAB ── */}
            {activeTab === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Vidéo du Showreel 3D</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                    La vidéo sera intégrée dans l'écran LED sur chaque étape de la démonstration. Formats pris en charge : MP4, WebM.
                  </div>

                  {/* Mode de synchronisation linguistique */}
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Gestion multilingue de la vidéo
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleSetVideoLangMode('shared')}
                        style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          background: videoLangMode === 'shared' ? '#C3F910' : 'rgba(255,255,255,0.06)',
                          color: videoLangMode === 'shared' ? '#05070B' : '#9CA3AF',
                          border: videoLangMode === 'shared' ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
                          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Globe style={{ width: 13, height: 13 }} />
                        🌐 Vidéo commune aux deux langues
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetVideoLangMode('independent')}
                        style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          background: videoLangMode === 'independent' ? '#C3F910' : 'rgba(255,255,255,0.06)',
                          color: videoLangMode === 'independent' ? '#05070B' : '#9CA3AF',
                          border: videoLangMode === 'independent' ? '1px solid #C3F910' : '1px solid rgba(255,255,255,0.1)',
                          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Film style={{ width: 13, height: 13 }} />
                        🌍 Vidéos différentes (FR &amp; EN)
                      </button>
                    </div>

                    {videoLangMode === 'shared' ? (
                      <div style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        Mode unifié actif : la vidéo ci-dessous s'applique automatiquement sur le site en français et en anglais.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Édition active :</span>
                          <button
                            type="button"
                            onClick={() => setSelectedVideoLang('fr')}
                            style={{
                              padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                              background: selectedVideoLang === 'fr' ? '#3B82F6' : 'rgba(255,255,255,0.06)',
                              color: '#FFFFFF',
                              border: selectedVideoLang === 'fr' ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.1)',
                              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            🇫🇷 Version Française {videoFr ? '✓' : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedVideoLang('en')}
                            style={{
                              padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                              background: selectedVideoLang === 'en' ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                              color: '#FFFFFF',
                              border: selectedVideoLang === 'en' ? '1px solid #A78BFA' : '1px solid rgba(255,255,255,0.1)',
                              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            🇬🇧 Version Anglaise {videoEnRaw ? '✓' : '(identique FR)'}
                          </button>
                        </div>

                        {selectedVideoLang === 'en' && !videoEnRaw && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 }}>
                            <span style={{ fontSize: 10, color: '#C4B5FD', flex: 1 }}>
                              Aucune vidéo anglaise dédiée : la vidéo française est utilisée comme repli automatique.
                            </span>
                            <button
                              type="button"
                              onClick={handleDuplicateFrToEn}
                              style={{
                                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                                background: '#8B5CF6', color: '#FFFFFF', border: 'none',
                                fontSize: 10, fontWeight: 700,
                              }}
                            >
                              Dupliquer FR vers EN
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <VideoUploadPanel
                    currentVideoUrl={videoSrc}
                    onVideoChange={handleVideoChange}
                  />
                </div>

                {/* URL directe */}
                <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      URL directe {videoLangMode === 'independent' ? (selectedVideoLang === 'fr' ? '(Français)' : '(Anglais)') : '(Commune)'}
                    </span>
                    {videoLangMode === 'independent' && (
                      <button
                        type="button"
                        onClick={() => handleSetVideoLangMode('shared')}
                        style={{
                          fontSize: 10, color: '#C3F910', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline'
                        }}
                      >
                        Unifier comme vidéo commune
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={videoSrc}
                    onChange={(e) => handleVideoChange(e.target.value)}
                    placeholder="/youtube-video.mp4"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#F5F4F0', fontSize: 11, fontFamily: 'monospace',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 10, color: '#4B5563', marginTop: 6 }}>
                    URL Firebase Storage, chemin relatif public (/youtube-video.mp4) ou URL externe.
                  </div>
                </div>
              </div>
            )}

            {/* ── SCREEN TAB ── */}
            {activeTab === 'screen' && (
              <VideoScreenSettingsPanel
                screen={videoScreen}
                onChange={handleVideoScreenChange}
                lockAspect={lockAspect}
                onToggleLockAspect={() => setLockAspect((v) => !v)}
                showVideoOutline={showVideoOutline}
                videoOutlineColor={(cmsData['videoOutlineColor'] as string | undefined) || '#000000'}
                onToggleVideoOutline={handleToggleVideoOutline}
                onChangeVideoOutlineColor={(c) => {
                  updateSectionField('showreel', 'videoOutlineColor', c);
                  markUnsaved();
                }}
                onResetDefault={handleResetDefaultVideoScreen}
              />
            )}
            {/* ── IMAGES TAB ── */}
            {activeTab === 'images' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <MasterImagePanel
                  currentSrc={masterImageSrc}
                  onImageChange={handleMasterImageChange}
                />
              </div>
            )}

            {/* ── CAMERA TAB ── */}
            {activeTab === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Images Clés de Caméra</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                    Chaque image clé définit la position, le zoom et le mouvement de la caméra virtuelle. Manipulez-les directement sur le canvas.
                  </div>
                </div>

                {/* Animation toggle */}
                <div style={{
                  padding: '12px 16px',
                  background: animationEnabled ? 'rgba(195,249,16,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${animationEnabled ? 'rgba(195,249,16,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: animationEnabled ? '#C3F910' : '#6B7280', marginBottom: 2 }}>Animation activée</div>
                    <div style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.4 }}>
                      {animationEnabled ? 'Le zoom scroll-progressif est actif.' : 'Animation suspendue — les réglages sont conservés.'}
                    </div>
                  </div>
                  <button type="button" onClick={handleToggleAnimation}
                    style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: animationEnabled ? '#C3F910' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 200ms ease' }}>
                    <span style={{ position: 'absolute', top: 3, left: animationEnabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: animationEnabled ? '#05070B' : '#6B7280', transition: 'left 200ms ease' }} />
                  </button>
                </div>

                {/* Keyframe list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...keyframes].sort((a, b) => a.time - b.time).map((kf) => {
                    const isSelected = kf.id === selectedKeyId;
                    return (
                      <div
                        key={kf.id}
                        onClick={() => setSelectedKeyId(kf.id)}
                        style={{
                          padding: '10px 14px',
                          background: isSelected ? 'rgba(195,249,16,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(195,249,16,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 10, cursor: 'pointer', transition: 'all 150ms',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#C3F910' : '#D1D5DB' }}>{kf.name}</span>
                          <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>{(kf.time * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[
                            `zoom: ${kf.zoom.toFixed(2)}×`,
                            `x: ${kf.x.toFixed(1)}%`,
                            `y: ${kf.y.toFixed(1)}%`,
                            kf.easing,
                          ].map((info) => (
                            <span key={info} style={{ fontSize: 9, color: '#6B7280', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{info}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={handleResetKeyframes}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  <RotateCcw style={{ width: 12, height: 12 }} />
                  Réinitialiser les images clés par défaut
                </button>
              </div>

            )}
            {/* ── TEXTS TAB ── */}
            {activeTab === 'texts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Textes &amp; Contenus</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
                    Modifiez tous les textes visibles dans la section Showreel.
                  </div>
                  {/* Lang switcher */}
                  <div style={{ display: 'flex', gap: 6, padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, width: 'fit-content', marginBottom: 16 }}>
                    {(['fr', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLang(lang)}
                        style={{
                          padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: selectedLang === lang ? '#C3F910' : 'transparent',
                          color: selectedLang === lang ? '#05070B' : '#9CA3AF',
                          fontSize: 12, fontWeight: 700,
                        }}
                      >
                        {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accordéon exclusif — Sections de texte */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  {[
                    {
                      id: 'intro',
                      badge: 'INTRO',
                      title: 'Introduction',
                      fields: TEXT_FIELDS.filter((f) => ['label', 'scrollHint', 'eyebrow', 'head1', 'head2', 'lede'].includes(f.key)),
                    },
                    {
                      id: 'ch1',
                      badge: '01',
                      title: 'Étape 01 — La Métropole',
                      fields: TEXT_FIELDS.filter((f) => f.key.startsWith('ch1')),
                    },
                    {
                      id: 'ch2',
                      badge: '02',
                      title: 'Étape 02 — L\'Atrium',
                      fields: TEXT_FIELDS.filter((f) => f.key.startsWith('ch2')),
                    },
                    {
                      id: 'ch3',
                      badge: '03',
                      title: 'Étape 03 — Le Mur LED',
                      fields: TEXT_FIELDS.filter((f) => f.key.startsWith('ch3')),
                    },
                    {
                      id: 'ch4',
                      badge: '04',
                      title: 'Étape 04 — Plongée Pixel',
                      fields: TEXT_FIELDS.filter((f) => f.key.startsWith('ch4')),
                    },
                    {
                      id: 'cta',
                      badge: 'CTA',
                      title: 'Bouton d\'action',
                      fields: TEXT_FIELDS.filter((f) => f.key === 'cta'),
                    },
                  ].map((section) => {
                    const isOpen = activeTextStep === section.id;
                    return (
                      <div
                        key={section.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isOpen ? 'rgba(195,249,16,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 12,
                          overflow: 'hidden',
                          transition: 'border-color 200ms ease, background 200ms ease',
                          boxSizing: 'border-box',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {/* Header accordéon */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveTextStep(isOpen ? null : section.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveTextStep(isOpen ? null : section.id);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            cursor: 'pointer',
                            userSelect: 'none',
                            background: isOpen ? 'rgba(195,249,16,0.05)' : 'transparent',
                            transition: 'background 180ms ease',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                fontFamily: 'var(--font-mono, monospace)',
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: isOpen ? '#C3F910' : 'rgba(255,255,255,0.08)',
                                color: isOpen ? '#05070B' : '#9CA3AF',
                                flexShrink: 0,
                                transition: 'all 180ms ease',
                              }}
                            >
                              {section.badge}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isOpen ? '#F5F4F0' : '#D1D5DB',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {section.title}
                            </span>
                          </div>
                          <span
                            style={{
                              color: isOpen ? '#C3F910' : '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 180ms ease',
                              flexShrink: 0,
                            }}
                          >
                            {isOpen ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
                          </span>
                        </div>

                        {/* Contenu déployé */}
                        {isOpen && (
                          <div
                            style={{
                              padding: '14px 16px 16px',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                              boxSizing: 'border-box',
                              width: '100%',
                              minWidth: 0,
                              overflow: 'hidden',
                              animation: 'accordionIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          >
                            {section.fields.map((field) => {
                              const rawVal = getCmsText(cmsData, field.key, selectedLang);
                              const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : '';
                              const isMultiline = 'multiline' in field && field.multiline;
                              return (
                                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                                    {field.label}
                                  </label>
                                  {isMultiline ? (
                                    <textarea
                                      rows={3}
                                      value={displayVal}
                                      placeholder={field.defaultFr}
                                      onChange={(e) => handleTextField(field.key, e.target.value)}
                                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F4F0', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={displayVal}
                                      placeholder={field.defaultFr}
                                      onChange={(e) => handleTextField(field.key, e.target.value)}
                                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F4F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer save */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, background: '#0D0E12' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saveStatus === 'saving'}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, border: 'none',
                background: hasUnsaved ? '#C3F910' : 'rgba(195,249,16,0.12)',
                color: hasUnsaved ? '#05070B' : '#C3F910',
                fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: hasUnsaved ? '0 4px 20px rgba(195,249,16,0.25)' : 'none',
                opacity: saving ? 0.7 : 1, transition: 'all 200ms ease',
              }}
            >
              {saving || saveStatus === 'saving' ? (
                <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
              ) : (
                <><Save style={{ width: 13, height: 13 }} /> Enregistrer les modifications</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes accordionIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>
    </div>
  );
}
