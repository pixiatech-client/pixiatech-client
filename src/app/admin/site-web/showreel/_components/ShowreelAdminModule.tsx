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
} from 'lucide-react';
import { toast } from 'sonner';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText } from '@/lib/site-web/cms-i18n';

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
  key: 'image1Src' | 'image2Src' | 'image3Src' | 'image4Src';
  prefix: 'img1' | 'img2' | 'img3' | 'img4';
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

function SingleImageEditor({
  layers,
  imageSrcs,
  imageAdjustments,
  selectedImageIndex,
  onSelectImage,
  onImageChange,
  onAdjustmentChange,
  onResetAdjustment,
}: {
  layers: LayerImage[];
  imageSrcs: string[];
  imageAdjustments: ImageAdjustment[];
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  onImageChange: (key: string, url: string) => void;
  onAdjustmentChange: (prefix: string, key: 'posX' | 'posY' | 'scale' | 'width' | 'height', value: number) => void;
  onResetAdjustment: (prefix: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMedia } = useCms();

  const currentLayer = layers[selectedImageIndex];
  const currentSrc = imageSrcs[selectedImageIndex];
  const currentAdj = imageAdjustments[selectedImageIndex];
  const prefix = currentLayer.prefix;

  const handleFile = async (file: File) => {
    setError(null);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format non pris en charge. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError(`Image trop volumineuse (${formatBytes(file.size)}). Maximum : 30 Mo.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      onImageChange(currentLayer.key, url);
      toast.success(`Photo ${selectedImageIndex + 1} (${currentLayer.label}) remplacée avec succès.`);
    } catch {
      setError('Échec du téléversement. Réessayez.');
      toast.error('Échec du téléversement de la photo.');
    } finally {
      setUploading(false);
    }
  };

  const isCustom = currentSrc !== currentLayer.defaultSrc;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 4 Boutons de sélection : 1 seule image active à la fois */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>
          Images du Showreel
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
          Choisissez une étape pour afficher et régler exclusivement sa photographie de référence.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {layers.map((l, idx) => {
            const isSelected = selectedImageIndex === idx;
            return (
              <button
                key={l.key}
                type="button"
                onClick={() => onSelectImage(idx)}
                style={{
                  padding: '10px 4px',
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? '#C3F910' : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected ? 'rgba(195,249,16,0.14)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#C3F910' : '#9CA3AF',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 180ms ease',
                }}
              >
                Image {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone de travail : UNE SEULE image affichée */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000000',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentSrc}
          alt={currentLayer.label}
          style={{
            width: `${currentAdj.width}%`,
            height: `${currentAdj.height}%`,
            objectFit: 'cover',
            display: 'block',
            backgroundColor: '#000000',
            transform: `translate3d(${currentAdj.posX}%, ${currentAdj.posY}%, 0) scale(${currentAdj.scale})`,
            transformOrigin: 'center center',
            transition: 'transform 100ms ease, width 100ms ease, height 100ms ease',
          }}
        />

        {/* Badge étape */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            padding: '4px 9px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            color: '#C3F910',
            fontFamily: 'monospace',
            border: '1px solid rgba(195,249,16,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>IMAGE 0{selectedImageIndex + 1}</span>
          <span style={{ color: '#6B7280' }}>·</span>
          <span style={{ color: '#D1D5DB' }}>{currentLayer.label}</span>
        </div>

        {isCustom && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#C3F910',
              color: '#05070B',
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 99,
              fontFamily: 'monospace',
            }}
          >
            PERSONNALISÉE
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 11, color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Bouton Remplacer la photo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1,
            minWidth: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 10,
            background: '#C3F910',
            color: '#05070B',
            border: 'none',
            fontSize: 12,
            fontWeight: 800,
            cursor: uploading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(195,249,16,0.25)',
          }}
        >
          {uploading ? (
            <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Téléversement…</>
          ) : (
            <><Upload style={{ width: 14, height: 14 }} /> Remplacer la photo</>
          )}
        </button>

        {isCustom && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Restaurer l'image d'origine pour l'Image ${selectedImageIndex + 1} ?`)) {
                onImageChange(currentLayer.key, currentLayer.defaultSrc);
              }
            }}
            title="Restaurer l'image d'origine de cette étape"
            style={{
              display: 'flex',
              alignItems: 'center',
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
            Par défaut
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Réglages d'ajustement indépendants de l'image sélectionnée */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#D1D5DB' }}>
            Ajustements · Image {selectedImageIndex + 1}
          </span>
          <button
            type="button"
            onClick={() => onResetAdjustment(prefix)}
            title="Réinitialiser la position et l'échelle de cette image"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              fontSize: 10,
              cursor: 'pointer',
              padding: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F4F0')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
          >
            <RotateCcw style={{ width: 10, height: 10 }} />
            Réinitialiser
          </button>
        </div>

        <SliderField
          label="Position horizontale X"
          value={currentAdj.posX}
          min={-50}
          max={50}
          step={0.1}
          unit="%"
          onChange={(v) => onAdjustmentChange(prefix, 'posX', v)}
          onReset={() => onAdjustmentChange(prefix, 'posX', 0)}
          defaultVal={0}
        />
        <SliderField
          label="Position verticale Y"
          value={currentAdj.posY}
          min={-50}
          max={50}
          step={0.1}
          unit="%"
          onChange={(v) => onAdjustmentChange(prefix, 'posY', v)}
          onReset={() => onAdjustmentChange(prefix, 'posY', 0)}
          defaultVal={0}
        />
        <SliderField
          label="Échelle ou zoom"
          value={currentAdj.scale}
          min={0.5}
          max={2.5}
          step={0.01}
          onChange={(v) => onAdjustmentChange(prefix, 'scale', v)}
          onReset={() => onAdjustmentChange(prefix, 'scale', 1)}
          defaultVal={1}
        />
        <SliderField
          label="Largeur (%)"
          value={currentAdj.width}
          min={50}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onAdjustmentChange(prefix, 'width', v)}
          onReset={() => onAdjustmentChange(prefix, 'width', 100)}
          defaultVal={100}
        />
        <SliderField
          label="Hauteur (%)"
          value={currentAdj.height}
          min={50}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onAdjustmentChange(prefix, 'height', v)}
          onReset={() => onAdjustmentChange(prefix, 'height', 100)}
          defaultVal={100}
        />
      </div>
    </div>
  );
}

// ─── Screen Position Editor ────────────────────────────────────────────────────

function ScreenPositionEditor({
  layerIndex,
  screen,
  imageSrc,
  videoSrc,
  showVideoOutline,
  videoOutlineColor,
  onToggleVideoOutline,
  onChangeVideoOutlineColor,
  onChange,
}: {
  layerIndex: number;
  screen: ScreenCoords;
  imageSrc: string;
  videoSrc: string;
  showVideoOutline: boolean;
  videoOutlineColor: string;
  onToggleVideoOutline: () => void;
  onChangeVideoOutlineColor: (color: string) => void;
  onChange: (sc: ScreenCoords) => void;
}) {
  const defaultScreen = LAYERS[layerIndex].defaultScreen;

  const sl = (key: keyof ScreenCoords, label: string, min: number, max: number) => (
    <SliderField
      label={label}
      value={screen[key]}
      min={min}
      max={max}
      step={0.01}
      unit="%"
      onChange={(v) => onChange({ ...screen, [key]: v })}
      onReset={() => onChange({ ...screen, [key]: defaultScreen?.[key] ?? 0 })}
      defaultVal={defaultScreen?.[key]}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête avec bouton d'activation du contour et personnalisation couleur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0' }}>
          Position de l'écran · {LAYERS[layerIndex].label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onToggleVideoOutline}
            title="Afficher ou masquer le contour de réglage autour de la vidéo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${showVideoOutline ? videoOutlineColor : 'rgba(255,255,255,0.12)'}`,
              background: showVideoOutline ? hexToRgba(videoOutlineColor, 0.15) : 'rgba(255,255,255,0.04)',
              color: showVideoOutline ? videoOutlineColor : '#9CA3AF',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 180ms ease',
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

      {/* Live preview canvas uniforme noir */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000000',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          aspectRatio: '16/9',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={LAYERS[layerIndex].label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000000' }}
        />

        {/* Video Surface anchored inside the screen bounds */}
        <div
          style={{
            position: 'absolute',
            left: `${screen.left}%`,
            top: `${screen.top}%`,
            width: `${screen.width}%`,
            height: `${screen.height}%`,
            overflow: 'hidden',
            borderRadius: 1.5,
            backgroundColor: '#000000',
            outline: showVideoOutline ? `2px solid ${videoOutlineColor}` : 'none',
            boxShadow: showVideoOutline ? `0 0 16px ${hexToRgba(videoOutlineColor, 0.85)}, inset 0 0 12px ${hexToRgba(videoOutlineColor, 0.3)}` : 'none',
            transition: 'outline 150ms ease, box-shadow 150ms ease',
          }}
        >
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000000' }}
          />

        </div>

        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 99, fontSize: 10, color: '#C3F910', fontFamily: 'monospace', fontWeight: 700 }}>
          POSITIONNEMENT ÉCRAN · {LAYERS[layerIndex].label}
        </div>
      </div>

      {/* Sliders */}
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
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
        }}
      >
        <RotateCcw style={{ width: 11, height: 11 }} />
        Réinitialiser la position
      </button>
    </div>
  );
}

// ─── Live Preview Panel (Fond uniformément noir + Contour vidéo activable) ─────

function LivePreviewPanel({
  videoSrc,
  imageSrcs,
  screens,
  imageAdjustments,
  cmsData,
  showVideoOutline,
  videoOutlineColor,
  onToggleVideoOutline,
  onChangeVideoOutlineColor,
  targetStep,
}: {
  videoSrc: string;
  imageSrcs: string[];
  screens: (ScreenCoords | null)[];
  imageAdjustments: ImageAdjustment[];
  cmsData: Record<string, unknown>;
  showVideoOutline: boolean;
  videoOutlineColor: string;
  onToggleVideoOutline: () => void;
  onChangeVideoOutlineColor: (color: string) => void;
  targetStep?: 1 | 2 | 3 | 4 | null;
}) {
  const [simProgress, setSimProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Jump immediately to the active stage keyframe and pause playback so slider updates are visible
  useEffect(() => {
    if (targetStep === 1) {
      setSimProgress(0.08);
      setPlaying(false);
    } else if (targetStep === 2) {
      setSimProgress(0.35);
      setPlaying(false);
    } else if (targetStep === 3) {
      setSimProgress(0.60);
      setPlaying(false);
    } else if (targetStep === 4) {
      setSimProgress(0.85);
      setPlaying(false);
    }
  }, [targetStep]);

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

  // Mirror ShowreelSection crossfade math
  const sp = simProgress;
  const op1 = Math.max(0, Math.min(1, 1 - (sp - 0.21) / 0.07));
  const op2 = Math.min(Math.max(0, Math.min(1, (sp - 0.21) / 0.07)), Math.max(0, Math.min(1, 1 - (sp - 0.46) / 0.07)));
  const op3 = Math.min(Math.max(0, Math.min(1, (sp - 0.46) / 0.07)), Math.max(0, Math.min(1, 1 - (sp - 0.85) / 0.08)));
  const op4 = Math.min(Math.max(0, Math.min(1, (sp - 0.70) / 0.06)), Math.max(0, Math.min(1, 1 - (sp - 0.86) / 0.08)));

  // Récupération dynamique des paramètres de caméra depuis cmsData
  const l1ScaleMax = parseFloat((cmsData['l1ScaleMax'] as string | undefined) || '1.39');
  const l1OriginX = parseFloat((cmsData['l1OriginX'] as string | undefined) || '49.97');
  const l1OriginY = parseFloat((cmsData['l1OriginY'] as string | undefined) || '59.88');
  const l1XShift = parseFloat((cmsData['l1XShift'] as string | undefined) || '0');
  const l1YShift = parseFloat((cmsData['l1YShift'] as string | undefined) || '14.1');
  const l1CamPosX = parseFloat((cmsData['l1CamPosX'] as string | undefined) || '0');
  const l1CamPosY = parseFloat((cmsData['l1CamPosY'] as string | undefined) || '0');

  const l2ScaleMax = parseFloat((cmsData['l2ScaleMax'] as string | undefined) || '0.66');
  const l2OriginX = parseFloat((cmsData['l2OriginX'] as string | undefined) || '49.85');
  const l2OriginY = parseFloat((cmsData['l2OriginY'] as string | undefined) || '46.55');
  const l2XShift = parseFloat((cmsData['l2XShift'] as string | undefined) || '0');
  const l2YShift = parseFloat((cmsData['l2YShift'] as string | undefined) || '10.0');
  const l2CamPosX = parseFloat((cmsData['l2CamPosX'] as string | undefined) || '0');
  const l2CamPosY = parseFloat((cmsData['l2CamPosY'] as string | undefined) || '0');

  const l3ScaleMax = parseFloat((cmsData['l3ScaleMax'] as string | undefined) || '1.65');
  const l3OriginX = parseFloat((cmsData['l3OriginX'] as string | undefined) || '49.94');
  const l3OriginY = parseFloat((cmsData['l3OriginY'] as string | undefined) || '35.76');
  const l3XShift = parseFloat((cmsData['l3XShift'] as string | undefined) || '0');
  const l3YShift = parseFloat((cmsData['l3YShift'] as string | undefined) || '0');
  const l3CamPosX = parseFloat((cmsData['l3CamPosX'] as string | undefined) || '0');
  const l3CamPosY = parseFloat((cmsData['l3CamPosY'] as string | undefined) || '0');

  const l4ScaleMax = parseFloat((cmsData['l4ScaleMax'] as string | undefined) || '1.35');
  const l4OriginX = parseFloat((cmsData['l4OriginX'] as string | undefined) || '50.0');
  const l4OriginY = parseFloat((cmsData['l4OriginY'] as string | undefined) || '50.0');
  const l4XShift = parseFloat((cmsData['l4XShift'] as string | undefined) || '0');
  const l4YShift = parseFloat((cmsData['l4YShift'] as string | undefined) || '0');
  const l4CamPosX = parseFloat((cmsData['l4CamPosX'] as string | undefined) || '0');
  const l4CamPosY = parseFloat((cmsData['l4CamPosY'] as string | undefined) || '0');

  // Trajectoire et zoom scroll-driven de la caméra
  const p1 = Math.min(1, sp / 0.25);
  const scale1 = 1 + p1 * l1ScaleMax;
  const xShift1 = l1CamPosX + p1 * l1XShift;
  const yShift1 = l1CamPosY - p1 * l1YShift;

  const p2 = Math.max(0, Math.min(1, (sp - 0.25) / 0.25));
  const scale2 = 1 + p2 * l2ScaleMax;
  const xShift2 = l2CamPosX + p2 * l2XShift;
  const yShift2 = l2CamPosY - p2 * l2YShift;

  const p3 = Math.max(0, Math.min(1, (sp - 0.50) / 0.22));
  const p3Deep = Math.max(0, Math.min(1, (sp - 0.72) / 0.13));
  const scale3 = 1 + p3 * l3ScaleMax + p3Deep * 0.70;
  const xShift3 = l3CamPosX + p3 * l3XShift;
  const yShift3 = l3CamPosY - p3 * l3YShift;

  const p4 = Math.max(0, Math.min(1, (sp - 0.72) / 0.28));
  const scale4 = 1 + p4 * l4ScaleMax;
  const xShift4 = l4CamPosX + p4 * l4XShift;
  const yShift4 = l4CamPosY - p4 * l4YShift;

  const currentStage = sp < 0.25 ? 0 : sp < 0.50 ? 1 : sp < 0.74 ? 2 : 3;

  const stageNames = ['01 — Ville lointaine', '02 — Vue intermédiaire', '03 — Façade écran', '04 — Macro LED'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {/* Viewport : Fond noir uniforme absolu sans aucune bande */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000000',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}
      >
        {/* Layer 1 */}
        {op1 > 0.001 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: op1,
              transform: `translate3d(${xShift1.toFixed(2)}%, ${yShift1.toFixed(2)}%, 0) scale(${scale1.toFixed(3)})`,
              transformOrigin: `${l1OriginX}% ${l1OriginY}%`,
              zIndex: 1,
              backgroundColor: '#000000',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrcs[0]}
              alt=""
              style={{
                width: `${imageAdjustments[0].width}%`,
                height: `${imageAdjustments[0].height}%`,
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000000',
                transform: `translate3d(${imageAdjustments[0].posX}%, ${imageAdjustments[0].posY}%, 0) scale(${imageAdjustments[0].scale})`,
              }}
            />
            {screens[0] && (
              <div
                style={{
                  position: 'absolute',
                  left: `${screens[0].left}%`,
                  top: `${screens[0].top}%`,
                  width: `${screens[0].width}%`,
                  height: `${screens[0].height}%`,
                  overflow: 'hidden',
                  borderRadius: 1,
                  backgroundColor: '#000000',
                  outline: showVideoOutline ? `2px solid ${videoOutlineColor}` : 'none',
                  boxShadow: showVideoOutline ? `0 0 16px ${hexToRgba(videoOutlineColor, 0.85)}, inset 0 0 12px ${hexToRgba(videoOutlineColor, 0.3)}` : 'none',
                  transition: 'outline 150ms ease, box-shadow 150ms ease',
                }}
              >
                <video src={videoSrc} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000000' }} />
              </div>
            )}
          </div>
        )}

        {/* Layer 2 */}
        {op2 > 0.001 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: op2,
              transform: `translate3d(${xShift2.toFixed(2)}%, ${yShift2.toFixed(2)}%, 0) scale(${scale2.toFixed(3)})`,
              transformOrigin: `${l2OriginX}% ${l2OriginY}%`,
              zIndex: 2,
              backgroundColor: '#000000',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrcs[1]}
              alt=""
              style={{
                width: `${imageAdjustments[1].width}%`,
                height: `${imageAdjustments[1].height}%`,
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000000',
                transform: `translate3d(${imageAdjustments[1].posX}%, ${imageAdjustments[1].posY}%, 0) scale(${imageAdjustments[1].scale})`,
              }}
            />
            {screens[1] && (
              <div
                style={{
                  position: 'absolute',
                  left: `${screens[1].left}%`,
                  top: `${screens[1].top}%`,
                  width: `${screens[1].width}%`,
                  height: `${screens[1].height}%`,
                  overflow: 'hidden',
                  borderRadius: 1.5,
                  backgroundColor: '#000000',
                  outline: showVideoOutline ? `2px solid ${videoOutlineColor}` : 'none',
                  boxShadow: showVideoOutline ? `0 0 16px ${hexToRgba(videoOutlineColor, 0.85)}, inset 0 0 12px ${hexToRgba(videoOutlineColor, 0.3)}` : 'none',
                  transition: 'outline 150ms ease, box-shadow 150ms ease',
                }}
              >
                <video src={videoSrc} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000000' }} />
              </div>
            )}
          </div>
        )}

        {/* Layer 3 */}
        {op3 > 0.001 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: op3,
              transform: `translate3d(${xShift3.toFixed(2)}%, ${yShift3.toFixed(2)}%, 0) scale(${scale3.toFixed(3)})`,
              transformOrigin: `${l3OriginX}% ${l3OriginY}%`,
              zIndex: 3,
              backgroundColor: '#000000',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrcs[2]}
              alt=""
              style={{
                width: `${imageAdjustments[2].width}%`,
                height: `${imageAdjustments[2].height}%`,
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000000',
                transform: `translate3d(${imageAdjustments[2].posX}%, ${imageAdjustments[2].posY}%, 0) scale(${imageAdjustments[2].scale})`,
              }}
            />
            {screens[2] && (
              <div
                style={{
                  position: 'absolute',
                  left: `${screens[2].left}%`,
                  top: `${screens[2].top}%`,
                  width: `${screens[2].width}%`,
                  height: `${screens[2].height}%`,
                  overflow: 'hidden',
                  backgroundColor: '#000000',
                  outline: showVideoOutline ? `2px solid ${videoOutlineColor}` : 'none',
                  boxShadow: showVideoOutline ? `0 0 16px ${hexToRgba(videoOutlineColor, 0.85)}, inset 0 0 12px ${hexToRgba(videoOutlineColor, 0.3)}` : 'none',
                  transition: 'outline 150ms ease, box-shadow 150ms ease',
                }}
              >
                <video src={videoSrc} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000000' }} />
              </div>
            )}
          </div>
        )}

        {/* Layer 4 */}
        {op4 > 0.001 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: op4,
              transform: `translate3d(${xShift4.toFixed(2)}%, ${yShift4.toFixed(2)}%, 0) scale(${scale4.toFixed(3)})`,
              transformOrigin: `${l4OriginX}% ${l4OriginY}%`,
              mixBlendMode: 'screen',
              zIndex: 5,
              backgroundColor: '#000000',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrcs[3]}
              alt=""
              style={{
                width: `${imageAdjustments[3].width}%`,
                height: `${imageAdjustments[3].height}%`,
                objectFit: 'cover',
                display: 'block',
                backgroundColor: '#000000',
                transform: `translate3d(${imageAdjustments[3].posX}%, ${imageAdjustments[3].posY}%, 0) scale(${imageAdjustments[3].scale})`,
              }}
            />
          </div>
        )}

        {/* HUD overlay */}
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, pointerEvents: 'none' }}>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#C3F910', background: 'rgba(0,0,0,0.8)', padding: '3px 8px', borderRadius: 99, letterSpacing: '.12em' }}>
            APERÇU EN DIRECT
          </span>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#9CA3AF', background: 'rgba(0,0,0,0.8)', padding: '3px 8px', borderRadius: 99 }}>
            {stageNames[currentStage]}
          </span>
        </div>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 95% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none', zIndex: 10 }} />
      </div>

      {/* Controls & Option Contour Vidéo */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: playing ? '#C3F910' : 'rgba(255,255,255,0.08)', border: 'none', color: playing ? '#05070B' : '#D1D5DB', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          {playing ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
          {playing ? 'Pause' : 'Lecture'}
        </button>

        <button
          type="button"
          onClick={() => setSimProgress(0)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9CA3AF', fontSize: 11, cursor: 'pointer' }}
        >
          <RotateCcw style={{ width: 11, height: 11 }} />
          Début
        </button>

        <button
          type="button"
          onClick={onToggleVideoOutline}
          title="Afficher un contour visible autour de la surface vidéo pour faciliter son alignement"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 8,
            border: `1px solid ${showVideoOutline ? videoOutlineColor : 'rgba(255,255,255,0.12)'}`,
            background: showVideoOutline ? hexToRgba(videoOutlineColor, 0.15) : 'rgba(255,255,255,0.05)',
            color: showVideoOutline ? videoOutlineColor : '#9CA3AF',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 180ms ease',
          }}
        >
          <Square style={{ width: 12, height: 12 }} />
          Contour : {showVideoOutline ? 'ON' : 'OFF'}
        </button>

        {showVideoOutline && (
          <VideoOutlineColorControl
            color={videoOutlineColor}
            onChangeColor={onChangeVideoOutlineColor}
          />
        )}

        <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={simProgress}
            onChange={(e) => { setPlaying(false); setSimProgress(parseFloat(e.target.value)); }}
            style={{ width: '100%', accentColor: '#C3F910', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6B7280', fontFamily: 'monospace' }}>
            {stageNames.map((n, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { const fracs = [0.02, 0.32, 0.58, 0.88]; setSimProgress(fracs[i]); setPlaying(false); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: currentStage === i ? '#C3F910' : '#6B7280', fontSize: 9, padding: 0, fontFamily: 'monospace' }}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
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
  const [selectedLang, setSelectedLang] = useState<'fr' | 'en'>('fr');
  const [saving, setSaving] = useState(false);
  const [activeScreenLayer, setActiveScreenLayer] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | null>(1);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showVideoOutline, setShowVideoOutline] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTextStep, setActiveTextStep] = useState<string | null>('intro');

  const cmsData = useMemo(
    () => (pages['home']?.sections?.showreel as Record<string, unknown>) || {},
    [pages]
  );

  // Derived values from CMS
  const videoSrc = (cmsData['videoUrl'] as string | undefined) || '/youtube-video.mp4';

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
    return [1, 2, 3, 4].map((num) => {
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

  const handleVideoChange = useCallback(
    (url: string) => {
      updateSectionField('showreel', 'videoUrl', url);
      markUnsaved();
    },
    [updateSectionField]
  );

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', background: '#09090B', minHeight: '100vh', color: '#F5F4F0', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, minHeight: 0, gap: 0 }}>

        {/* ── Left: Live Preview ── */}
        <div style={{ padding: 24, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', letterSpacing: '.16em', fontFamily: 'var(--font-mono, monospace)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye style={{ width: 12, height: 12 }} />
              PRÉVISUALISATION EN DIRECT
            </div>
            <LivePreviewPanel
              videoSrc={videoSrc}
              imageSrcs={imageSrcs}
              screens={screens}
              imageAdjustments={imageAdjustments}
              cmsData={cmsData}
              showVideoOutline={showVideoOutline}
              videoOutlineColor={(cmsData['videoOutlineColor'] as string | undefined) || '#000000'}
              onToggleVideoOutline={() => setShowVideoOutline((prev) => !prev)}
              onChangeVideoOutlineColor={(c) => { updateSectionField('showreel', 'videoOutlineColor', c); markUnsaved(); }}
              targetStep={
                activeTab === 'camera'
                  ? activeStep
                  : activeTab === 'texts'
                    ? (activeTextStep === 'step1' ? 1 : activeTextStep === 'step2' ? 2 : activeTextStep === 'step3' ? 3 : activeTextStep === 'step4' ? 4 : null)
                    : null
              }
            />
          </div>
        </div>

        {/* ── Right: Settings Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Vidéo du Showreel</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                    La vidéo sera intégrée à l'intérieur de l'écran LED sur chaque image de la démonstration. Formats pris en charge : MP4, WebM.
                  </div>
                  <VideoUploadPanel
                    currentVideoUrl={videoSrc}
                    onVideoChange={handleVideoChange}
                  />
                </div>

                {/* URL directe */}
                <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>Ou entrer une URL directe</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Position de l'écran</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                    Ajustez la position et la taille de la zone vidéo sur chaque image. L'aperçu montre en vert le cadre actuel.
                  </div>
                </div>

                {/* Layer selector */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {LAYERS.filter((l) => l.screenKey !== null).map((layer, i) => (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() => setActiveScreenLayer(i)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        background: activeScreenLayer === i ? '#C3F910' : 'rgba(255,255,255,0.06)',
                        color: activeScreenLayer === i ? '#05070B' : '#9CA3AF',
                      }}
                    >
                      0{i + 1}
                    </button>
                  ))}
                </div>

                {LAYERS[activeScreenLayer].screenKey && screens[activeScreenLayer] && (
                  <ScreenPositionEditor
                    layerIndex={activeScreenLayer}
                    screen={screens[activeScreenLayer]!}
                    imageSrc={imageSrcs[activeScreenLayer]}
                    videoSrc={videoSrc}
                    showVideoOutline={showVideoOutline}
                    videoOutlineColor={(cmsData['videoOutlineColor'] as string | undefined) || '#000000'}
                    onToggleVideoOutline={() => setShowVideoOutline((prev) => !prev)}
                    onChangeVideoOutlineColor={(c) => { updateSectionField('showreel', 'videoOutlineColor', c); markUnsaved(); }}
                    onChange={(sc) => handleScreenChange(LAYERS[activeScreenLayer].screenKey!, sc)}
                  />
                )}

                {LAYERS[activeScreenLayer].screenKey === null && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                    Cette image (Macro LED) n'a pas de zone vidéo intégrée — elle se superpose en mode blend.
                  </div>
                )}
              </div>
            )}

            {/* ── IMAGES TAB ── */}
            {activeTab === 'images' && (
              <SingleImageEditor
                layers={LAYERS}
                imageSrcs={imageSrcs}
                imageAdjustments={imageAdjustments}
                selectedImageIndex={selectedImageIndex}
                onSelectImage={setSelectedImageIndex}
                onImageChange={handleImageChange}
                onAdjustmentChange={handleImageAdjustmentChange}
                onResetAdjustment={handleResetImageAdjustment}
              />
            )}

            {/* ── CAMERA TAB ── */}
            {activeTab === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4F0', marginBottom: 4 }}>Animation & Caméra</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                    Ces paramètres contrôlent les transformations d'échelle et les points de départ/arrivée de chaque étape du zoom.
                  </div>
                </div>

                {/* Accordéon exclusif — Étapes 1, 2, 3 et 4 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  {[
                    { step: 1 as const, title: 'Étape 01 — Ville lointaine', prefix: 'l1', defaults: { scaleMax: 1.39, originX: 49.97, originY: 59.88, xShift: 0, yShift: 14.1, camPosX: 0, camPosY: 0 } },
                    { step: 2 as const, title: 'Étape 02 — Vue intermédiaire', prefix: 'l2', defaults: { scaleMax: 0.66, originX: 49.85, originY: 46.55, xShift: 0, yShift: 10.0, camPosX: 0, camPosY: 0 } },
                    { step: 3 as const, title: 'Étape 03 — Façade écran', prefix: 'l3', defaults: { scaleMax: 1.65, originX: 49.94, originY: 35.76, xShift: 0, yShift: 0, camPosX: 0, camPosY: 0 } },
                    { step: 4 as const, title: 'Étape 04 — Macro LED', prefix: 'l4', defaults: { scaleMax: 1.35, originX: 50.0, originY: 50.0, xShift: 0, yShift: 0, camPosX: 0, camPosY: 0 } },
                  ].map((layer) => {
                    const isOpen = activeStep === layer.step;
                    const scaleMax = parseFloat((cmsData[`${layer.prefix}ScaleMax`] as string | undefined) || String(layer.defaults.scaleMax));
                    const originX = parseFloat((cmsData[`${layer.prefix}OriginX`] as string | undefined) || String(layer.defaults.originX));
                    const originY = parseFloat((cmsData[`${layer.prefix}OriginY`] as string | undefined) || String(layer.defaults.originY));
                    const xShift = parseFloat((cmsData[`${layer.prefix}XShift`] as string | undefined) || String(layer.defaults.xShift));
                    const yShift = parseFloat((cmsData[`${layer.prefix}YShift`] as string | undefined) || String(layer.defaults.yShift));
                    const camPosX = parseFloat((cmsData[`${layer.prefix}CamPosX`] as string | undefined) || String(layer.defaults.camPosX));
                    const camPosY = parseFloat((cmsData[`${layer.prefix}CamPosY`] as string | undefined) || String(layer.defaults.camPosY));

                    return (
                      <div
                        key={layer.prefix}
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
                        {/* Header accordéon cliquable */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveStep(isOpen ? null : layer.step)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveStep(isOpen ? null : layer.step);
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
                              0{layer.step}
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
                              {layer.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {isOpen && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSectionField('showreel', `${layer.prefix}ScaleMax`, String(layer.defaults.scaleMax));
                                  updateSectionField('showreel', `${layer.prefix}OriginX`, String(layer.defaults.originX));
                                  updateSectionField('showreel', `${layer.prefix}OriginY`, String(layer.defaults.originY));
                                  updateSectionField('showreel', `${layer.prefix}XShift`, String(layer.defaults.xShift));
                                  updateSectionField('showreel', `${layer.prefix}YShift`, String(layer.defaults.yShift));
                                  updateSectionField('showreel', `${layer.prefix}CamPosX`, String(layer.defaults.camPosX));
                                  updateSectionField('showreel', `${layer.prefix}CamPosY`, String(layer.defaults.camPosY));
                                  markUnsaved();
                                }}
                                title="Réinitialiser les réglages de cette étape"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6B7280',
                                  fontSize: 10,
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  transition: 'color 150ms ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F4F0')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
                              >
                                <RotateCcw style={{ width: 10, height: 10 }} />
                                <span>Reset</span>
                              </button>
                            )}
                            <span
                              style={{
                                color: isOpen ? '#C3F910' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 180ms ease',
                              }}
                            >
                              {isOpen ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
                            </span>
                          </div>
                        </div>

                        {/* Contenu déployé avec animation fluide */}
                        {isOpen && (
                          <div
                            style={{
                              padding: '14px 16px 16px',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 14,
                              boxSizing: 'border-box',
                              width: '100%',
                              minWidth: 0,
                              overflow: 'hidden',
                              animation: 'accordionIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          >
                            {/* Groupe 1 : Zoom & Cadrage focal */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#C3F910', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                Zoom &amp; Point Focal
                              </div>
                              <SliderField
                                label="Zoom maximum (scale)"
                                value={scaleMax}
                                min={0.1}
                                max={4}
                                step={0.01}
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}ScaleMax`, String(v)); markUnsaved(); }}
                              />
                              <SliderField
                                label="Origine X (point focal %)"
                                value={originX}
                                min={0}
                                max={100}
                                step={0.01}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}OriginX`, String(v)); markUnsaved(); }}
                              />
                              <SliderField
                                label="Origine Y (point focal %)"
                                value={originY}
                                min={0}
                                max={100}
                                step={0.01}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}OriginY`, String(v)); markUnsaved(); }}
                              />
                            </div>

                            {/* Groupe 2 : Mouvement & Position de la Caméra */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#C3F910', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                Mouvement &amp; Position Caméra
                              </div>
                              <SliderField
                                label="Position Caméra X (cadrage initial %)"
                                value={camPosX}
                                min={-50}
                                max={50}
                                step={0.1}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}CamPosX`, String(v)); markUnsaved(); }}
                              />
                              <SliderField
                                label="Position Caméra Y (cadrage initial %)"
                                value={camPosY}
                                min={-50}
                                max={50}
                                step={0.1}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}CamPosY`, String(v)); markUnsaved(); }}
                              />
                              <SliderField
                                label="Mouvement Caméra X (Pan horizontal %)"
                                value={xShift}
                                min={-50}
                                max={50}
                                step={0.1}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}XShift`, String(v)); markUnsaved(); }}
                              />
                              <SliderField
                                label="Mouvement Caméra Y (Travelling vertical / Plongée %)"
                                value={yShift}
                                min={-50}
                                max={50}
                                step={0.1}
                                unit="%"
                                onChange={(v) => { updateSectionField('showreel', `${layer.prefix}YShift`, String(v)); markUnsaved(); }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(195,249,16,0.05)', border: '1px solid rgba(195,249,16,0.15)', fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>
                  <strong style={{ color: '#C3F910' }}>Note :</strong> Ces valeurs modifient le comportement de zoom scroll-driven. L'aperçu se met à jour en direct pour valider le résultat.
                </div>
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
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
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
