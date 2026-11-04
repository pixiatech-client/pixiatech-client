/**
 * MOTEUR DE CAMÉRA VIRTUELLE À IMAGES CLÉS (KEYFRAMES)
 * Partagé entre le studio administrateur (ShowreelAdminModule)
 * et le moteur de rendu public (ShowreelSection).
 *
 * Architecture :
 * - 1 seule image source haute résolution
 * - 1 seule vidéo calée sur l'écran de cette image
 * - Caméra virtuelle interpolant position X/Y, Zoom, Origine et Easing
 * - Aucune transition, aucun crossfade, zéro saut géométrique
 */

export type KeyframeEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface CameraKeyframe {
  id: string;
  name: string;
  time: number; // Position sur la timeline de 0.00 à 1.00
  zoom: number; // Niveau d'échelle (1.0 = 100%, 2.5 = 250%, etc.)
  x: number; // Panoramique horizontal en % (-50% à +50%)
  y: number; // Panoramique vertical en % (-50% à +50%)
  originX: number; // Centre horizontal du zoom en % (0% à 100%)
  originY: number; // Centre vertical du zoom en % (0% à 100%)
  easing: KeyframeEasing;
}

export interface ScreenCoords {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DEFAULT_SCREEN_COORDS: ScreenCoords = {
  left: 43.66,
  top: 54.52,
  width: 12.68,
  height: 10.84,
};

export const DEFAULT_MASTER_IMAGE = '/assets/showreel/ref-1-city-far.webp';

export const DEFAULT_KEYFRAMES: CameraKeyframe[] = [
  { id: 'kf-1', name: 'Clé 01 — Vue générale', time: 0.00, zoom: 1.00, x: 0.0, y: 0.0, originX: 50.0, originY: 59.9, easing: 'easeInOut' },
  { id: 'kf-2', name: 'Clé 02 — Façade & Écran', time: 0.30, zoom: 1.80, x: 0.0, y: -4.0, originX: 50.0, originY: 59.9, easing: 'easeInOut' },
  { id: 'kf-3', name: 'Clé 03 — Entrée Écran (32 LEDs)', time: 0.60, zoom: 4.20, x: 0.0, y: -8.0, originX: 50.0, originY: 59.9, easing: 'easeInOut' },
  { id: 'kf-4', name: 'Clé 04 — Composition Image 2', time: 0.82, zoom: 7.88, x: 0.0, y: 0.0, originX: 50.0, originY: 59.9, easing: 'easeInOut' },
  { id: 'kf-5', name: 'Clé 05 — Plongée Diodes RGB', time: 1.00, zoom: 15.00, x: -3.5, y: 0.0, originX: 50.0, originY: 59.9, easing: 'easeInOut' },
];

/**
 * Fonctions d'atténuation (Easing)
 */
export function applyEasing(t: number, easing: KeyframeEasing): number {
  const clampT = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return clampT;
    case 'easeIn':
      return clampT * clampT;
    case 'easeOut':
      return clampT * (2 - clampT);
    case 'easeInOut':
    default:
      return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT;
  }
}

export interface InterpolatedCamera {
  zoom: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  activeKeyframeIndex: number;
  nextKeyframeIndex: number;
  localProgress: number;
}

/**
 * Calcule l'état exact de la caméra à tout instant t de la timeline (0.00 -> 1.00)
 */
export function evaluateCamera(
  keyframes: CameraKeyframe[],
  progress: number
): InterpolatedCamera {
  if (!keyframes || keyframes.length === 0) {
    return {
      zoom: 1.0,
      x: 0,
      y: 0,
      originX: 50,
      originY: 50,
      activeKeyframeIndex: 0,
      nextKeyframeIndex: 0,
      localProgress: 0,
    };
  }

  // Trier les clés par ordre chronologique
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const p = Math.max(0, Math.min(1, progress));

  // Avant la première clé
  if (p <= sorted[0].time) {
    const k = sorted[0];
    return {
      zoom: k.zoom,
      x: k.x,
      y: k.y,
      originX: k.originX,
      originY: k.originY,
      activeKeyframeIndex: 0,
      nextKeyframeIndex: 0,
      localProgress: 0,
    };
  }

  // Après la dernière clé
  const lastIdx = sorted.length - 1;
  if (p >= sorted[lastIdx].time) {
    const k = sorted[lastIdx];
    return {
      zoom: k.zoom,
      x: k.x,
      y: k.y,
      originX: k.originX,
      originY: k.originY,
      activeKeyframeIndex: lastIdx,
      nextKeyframeIndex: lastIdx,
      localProgress: 1,
    };
  }

  // Trouver les 2 clés encadrantes
  let idx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (p >= sorted[i].time && p <= sorted[i + 1].time) {
      idx = i;
      break;
    }
  }

  const kA = sorted[idx];
  const kB = sorted[idx + 1];
  const timeSpan = kB.time - kA.time;
  const rawT = timeSpan > 0.00001 ? (p - kA.time) / timeSpan : 0;
  const easedT = applyEasing(rawT, kA.easing);

  return {
    zoom: parseFloat((kA.zoom + (kB.zoom - kA.zoom) * easedT).toFixed(4)),
    x: parseFloat((kA.x + (kB.x - kA.x) * easedT).toFixed(3)),
    y: parseFloat((kA.y + (kB.y - kA.y) * easedT).toFixed(3)),
    originX: parseFloat((kA.originX + (kB.originX - kA.originX) * easedT).toFixed(3)),
    originY: parseFloat((kA.originY + (kB.originY - kA.originY) * easedT).toFixed(3)),
    activeKeyframeIndex: idx,
    nextKeyframeIndex: idx + 1,
    localProgress: rawT,
  };
}

export function sanitizeKeyframeName(name: string, fallbackIndex = 1): string {
  if (!name || typeof name !== 'string') return `Clé ${String(fallbackIndex).padStart(2, '0')}`;
  
  // Supprime toute répétition accidentelle ("Cléééé..."), artefacts UTF-8 ou mojibake
  const clean = name
    .replace(/ClÃ©/g, 'Clé')
    .replace(/Cl\xc3\xa9/g, 'Clé')
    .replace(/Cl[ée]+/gi, 'Clé')
    .trim();

  // Si commence déjà par "Clé XX"
  const match = clean.match(/^Clé\s*(\d+)(.*)$/i);
  if (match) {
    const num = match[1].padStart(2, '0');
    const suffix = match[2] ? match[2].trim() : '';
    return suffix ? `Clé ${num} ${suffix}`.replace(/\s+/g, ' ') : `Clé ${num}`;
  }

  // Si contient un chiffre et commence par cl
  const numMatch = clean.match(/\d+/);
  if (numMatch && clean.toLowerCase().startsWith('cl')) {
    return `Clé ${numMatch[0].padStart(2, '0')}`;
  }

  return clean || `Clé ${String(fallbackIndex).padStart(2, '0')}`;
}

/**
 * Keyframes par défaut pour l'animation dédiée de Structure LED
 */
export const DEFAULT_LED_KEYFRAMES: CameraKeyframe[] = [
  { id: 'led-kf-1', name: 'Clé 01 — Grille globale', time: 0.00, zoom: 1.00, x: 0.0, y: 0.0, originX: 50.0, originY: 50.0, easing: 'easeInOut' },
  { id: 'led-kf-2', name: 'Clé 02 — Cabinets 500mm', time: 0.50, zoom: 2.20, x: 0.0, y: 0.0, originX: 50.0, originY: 50.0, easing: 'easeInOut' },
  { id: 'led-kf-3', name: 'Clé 03 — Diodes RGB', time: 1.00, zoom: 6.00, x: 0.0, y: 0.0, originX: 50.0, originY: 50.0, easing: 'easeInOut' },
];

/**
 * Déclencheur d'animation Structure LED sur la timeline globale
 */
export interface LedAnimationTrigger {
  id: string;
  time: number; // Position de 0.00 à 1.00 sur la timeline globale
  label?: string;
}

export const DEFAULT_LED_TRIGGERS: LedAnimationTrigger[] = [
  { id: 'trig-1', time: 0.60, label: 'Déclencheur Structure LED' },
];

/**
 * Lecture sécurisée des keyframes Structure LED depuis le CMS
 */
export function parseLedKeyframesFromCms(raw: unknown): CameraKeyframe[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((k, i) => ({
      id: String(k.id || `led-kf-${i + 1}`),
      name: sanitizeKeyframeName(String(k.name || ''), i + 1),
      time: typeof k.time === 'number' ? Math.max(0, Math.min(1, k.time)) : i / Math.max(1, raw.length - 1),
      zoom: typeof k.zoom === 'number' ? k.zoom : 1.0,
      x: typeof k.x === 'number' ? k.x : 0,
      y: typeof k.y === 'number' ? k.y : 0,
      originX: typeof k.originX === 'number' ? k.originX : 50,
      originY: typeof k.originY === 'number' ? k.originY : 50,
      easing: (['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(k.easing)
        ? k.easing
        : 'easeInOut') as KeyframeEasing,
    }));
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parseLedKeyframesFromCms(parsed);
      }
    } catch {}
  }

  return DEFAULT_LED_KEYFRAMES;
}

/**
 * Lecture sécurisée des déclencheurs Structure LED depuis le CMS
 */
export function parseLedTriggersFromCms(raw: unknown): LedAnimationTrigger[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((t, i) => ({
      id: String(t.id || `trig-${i + 1}`),
      time: typeof t.time === 'number' ? Math.max(0, Math.min(1, t.time)) : 0.60,
      label: String(t.label || `Structure LED (${((typeof t.time === 'number' ? t.time : 0.60) * 100).toFixed(0)}%)`),
    }));
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parseLedTriggersFromCms(parsed);
      }
    } catch {}
  }

  return DEFAULT_LED_TRIGGERS;
}

/**
 * Lecture sécurisée des keyframes depuis les données CMS (avec rétrocompatibilité)
 */
export function parseKeyframesFromCms(raw: unknown): CameraKeyframe[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((k, i) => ({
      id: String(k.id || `kf-${i + 1}`),
      name: sanitizeKeyframeName(String(k.name || ''), i + 1),
      time: typeof k.time === 'number' ? Math.max(0, Math.min(1, k.time)) : i / Math.max(1, raw.length - 1),
      zoom: typeof k.zoom === 'number' ? k.zoom : 1.0,
      x: typeof k.x === 'number' ? k.x : 0,
      y: typeof k.y === 'number' ? k.y : 0,
      originX: typeof k.originX === 'number' ? k.originX : 50,
      originY: typeof k.originY === 'number' ? k.originY : 50,
      easing: (['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(k.easing)
        ? k.easing
        : 'easeInOut') as KeyframeEasing,
    }));
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parseKeyframesFromCms(parsed);
      }
    } catch {}
  }

  return DEFAULT_KEYFRAMES;
}

