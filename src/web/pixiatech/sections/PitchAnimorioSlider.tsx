'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { Language } from '../../pixiatech-translations';

export interface PitchAnimorioSliderProps {
  pitch: number;
  onPitchChange: (pitch: number) => void;
  lang?: Language;
  unitLabel?: string;
  pixelsLabel?: string;
  applicationLabel?: string;
}

const PRESETS = [0.7, 0.9, 1.2, 1.5, 1.8, 2.5, 2.9, 3.9, 4.8, 6.6, 10];
const TIER_NOTCHES = [0.9, 1.8, 2.5, 3.9];

// Mapping normalized progress (0..1) to pitch value
function progressToPitch(p: number): number {
  const clamped = Math.max(0, Math.min(1, p));
  const segmentCount = PRESETS.length - 1;
  const scaled = clamped * segmentCount;
  const index = Math.floor(scaled);
  if (index >= segmentCount) return PRESETS[segmentCount];
  const frac = scaled - index;
  const val = PRESETS[index] + (PRESETS[index + 1] - PRESETS[index]) * frac;
  return Math.round(val * 10) / 10;
}

// Mapping pitch value to progress (0..1)
function pitchToProgress(val: number): number {
  if (val <= PRESETS[0]) return 0;
  if (val >= PRESETS[PRESETS.length - 1]) return 1;
  const segmentCount = PRESETS.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    if (val >= PRESETS[i] && val <= PRESETS[i + 1]) {
      const frac = (val - PRESETS[i]) / (PRESETS[i + 1] - PRESETS[i]);
      return (i + frac) / segmentCount;
    }
  }
  return 0.5;
}

function pixelsPerM2String(pitch: number, lang: Language = 'FR'): string {
  const mm = pitch <= 0 ? 1 : pitch;
  const px = Math.round(Math.pow(1000 / mm, 2));
  return px.toLocaleString(lang === 'FR' ? 'fr-FR' : 'en-US');
}

function getApplicationName(p: number, lang: Language = 'FR'): string {
  if (p <= 0.9) return lang === 'FR' ? 'Salle de crise & Contrôle' : 'Control Room & Studio';
  if (p <= 1.8) return lang === 'FR' ? "Hall & Lobby d'entreprise" : 'Corporate Lobby & Atrium';
  if (p <= 2.5) return lang === 'FR' ? 'Auditorium & Retail luxe' : 'Auditorium & Luxury Retail';
  if (p <= 3.9) return lang === 'FR' ? 'DOOH intérieur & Événementiel' : 'Indoor DOOH & Events';
  return lang === 'FR' ? 'Grand format & Façade' : 'Large-format & Stadium';
}

function getTierIndex(p: number): number {
  if (p <= 0.9) return 0;
  if (p <= 1.8) return 1;
  if (p <= 2.5) return 2;
  if (p <= 3.9) return 3;
  return 4;
}

/* ── COLOR UTILITIES FOR DYNAMIC THEME GRADIENT ── */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let val = t;
      if (val < 0) val += 1;
      if (val > 1) val -= 1;
      if (val < 1 / 6) return p + (q - p) * 6 * val;
      if (val < 1 / 2) return q;
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function computeThemeGradient(accentHex: string, accentRgb?: string) {
  let r = 74,
    g = 79,
    b = 240;
  if (accentRgb) {
    const parts = accentRgb.split(',').map((p) => parseInt(p.trim(), 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      [r, g, b] = parts;
    }
  } else if (/^#[0-9a-fA-F]{6}$/.test(accentHex)) {
    r = parseInt(accentHex.slice(1, 3), 16);
    g = parseInt(accentHex.slice(3, 5), 16);
    b = parseInt(accentHex.slice(5, 7), 16);
  }

  const [h, s, l] = rgbToHsl(r, g, b);
  // Shift hue by +22 degrees and enhance luminosity for a vibrant second stop
  const h2 = (h + 0.065) % 1;
  const l2 = Math.min(0.85, Math.max(0.28, l * 1.15));
  const s2 = Math.min(1, Math.max(0.4, s * 0.95));
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);

  const start = accentHex.startsWith('#') ? accentHex : `#${accentHex}`;
  const end = `#${r2.toString(16).padStart(2, '0')}${g2.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.38)`;

  return { start, end, glow, rgb: `${r}, ${g}, ${b}` };
}

export const PitchAnimorioSlider: React.FC<PitchAnimorioSliderProps> = ({
  pitch,
  onPitchChange,
  lang = 'FR',
  unitLabel = 'mm pas de pixel',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pitchRollRef = useRef<HTMLDivElement>(null);
  const pixelsRollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const ticksContainerRef = useRef<HTMLDivElement>(null);
  const hintLinesRef = useRef<[HTMLSpanElement | null, HTMLSpanElement | null]>([null, null]);

  // Rolling numbers managers
  const pitchRollInstRef = useRef<{ set: (s: string, instant?: boolean) => void } | null>(null);
  const pixelsRollInstRef = useRef<{ set: (s: string, instant?: boolean) => void } | null>(null);

  // Split-flap text state
  const hintStateRef = useRef<{ key: string | null; idx: number }>({ key: null, idx: 0 });

  // Theme accent state: follows Pixiatech CMS theme in real-time
  const [themeTokens, setThemeTokens] = useState(() => computeThemeGradient('#C3F910', '195, 249, 16'));
  const themeTokensRef = useRef(themeTokens);
  themeTokensRef.current = themeTokens;

  // Spring physics variables
  const physicsRef = useRef({
    pos: 0,
    target: 0,
    vel: 0,
    held: false,
    running: false,
    lastTime: 0,
    width: 1,
    tier: getTierIndex(pitch),
  });

  const onPitchChangeRef = useRef(onPitchChange);
  onPitchChangeRef.current = onPitchChange;

  // Listen to Pixiatech theme changes in real time
  useEffect(() => {
    const updateThemeFromDoc = () => {
      if (typeof window === 'undefined') return;
      const computed = getComputedStyle(document.documentElement);
      const acc = computed.getPropertyValue('--accent').trim() || '#C3F910';
      const rgb = computed.getPropertyValue('--accent-rgb').trim() || '195, 249, 16';
      setThemeTokens(computeThemeGradient(acc, rgb));
    };

    updateThemeFromDoc();

    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<{ accent?: string; tokens?: Record<string, string> }>).detail;
      if (detail?.accent) {
        const rgb = detail.tokens?.['--accent-rgb'];
        setThemeTokens(computeThemeGradient(detail.accent, rgb));
      } else {
        updateThemeFromDoc();
      }
    };

    window.addEventListener('pixiatech-theme-change', handleThemeChange);
    return () => window.removeEventListener('pixiatech-theme-change', handleThemeChange);
  }, []);

  // ── EXACT ANIMORIO ROLLING DIGITS ENGINE (from official TeamSeatsSlider.jsx) ──
  const makeRoll = useCallback((el: HTMLElement) => {
    let rollText: string | null = null;
    let rollCols: (HTMLElement | null)[] = [];

    const build = (str: string) => {
      el.textContent = '';
      rollCols = str.split('').map((ch) => {
        if (!/[0-9]/.test(ch)) {
          const f = document.createElement('span');
          f.className = 'roll__fixed';
          f.textContent = ch;
          el.appendChild(f);
          return null;
        }
        const col = document.createElement('span');
        col.className = 'roll__col';
        const strip = document.createElement('span');
        strip.className = 'roll__strip';
        for (let i = 0; i < 10; i += 1) {
          const s = document.createElement('span');
          s.textContent = String(i);
          strip.appendChild(s);
        }
        col.appendChild(strip);
        el.appendChild(col);
        gsap.set(strip, { yPercent: -10 * Number(ch) });
        return strip;
      });
    };

    const set = (str: string, instant = false) => {
      if (str === rollText) return;
      const shape = (s: string) => s.replace(/[0-9]/g, '0');
      if (rollText === null || shape(str) !== shape(rollText)) {
        build(str);
        if (rollText !== null && !instant) {
          gsap.fromTo(
            el,
            { yPercent: 30, opacity: 0.2 },
            { yPercent: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
          );
        }
      } else {
        let k = 0;
        str.split('').forEach((ch, i) => {
          const strip = rollCols[i];
          if (!strip || ch === rollText![i]) return;
          gsap.to(strip, {
            yPercent: -10 * Number(ch),
            duration: instant ? 0 : 0.6,
            ease: 'back.out(1.5)',
            delay: instant ? 0 : k * 0.04,
            overwrite: true,
          });
          k += 1;
        });
      }
      rollText = str;
    };

    return { set };
  }, []);

  // Set Split-Flap Hint for Application Name
  const setApplicationHint = useCallback((text: string, instant = false) => {
    const lines = hintLinesRef.current;
    if (!lines[0] || !lines[1]) return;
    const state = hintStateRef.current;
    if (text === state.key) {
      if (lines[state.idx]) lines[state.idx]!.textContent = text;
      return;
    }

    const outLine = lines[state.idx];
    state.idx = 1 - state.idx;
    const inLine = lines[state.idx];
    if (inLine) inLine.textContent = text;

    if (state.key === null || instant) {
      if (outLine) gsap.set(outLine, { opacity: 0 });
      if (inLine) gsap.set(inLine, { opacity: 1, yPercent: 0 });
    } else {
      if (outLine) {
        gsap.to(outLine, {
          yPercent: -100,
          opacity: 0,
          duration: 0.24,
          ease: 'power2.in',
          overwrite: true,
        });
      }
      if (inLine) {
        gsap.fromTo(
          inLine,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.44, ease: 'back.out(1.8)', delay: 0.04, overwrite: true }
        );
      }
    }
    state.key = text;
  }, []);

  // Tier fuse animation
  const fuseTier = useCallback((tierIdx: number, closing: boolean) => {
    const seal = sealRef.current;
    const fill = fillRef.current;
    const track = trackRef.current;
    if (!seal || !fill || !track) return;

    if (closing) {
      const w = track.clientWidth || 300;
      const targetX = (tierIdx / 4) * w;
      gsap
        .timeline()
        .fromTo(seal, { x: targetX - 50, opacity: 1 }, { x: targetX + 30, duration: 0.5, ease: 'power2.inOut' })
        .to(seal, { opacity: 0, duration: 0.2 }, '-=0.15');
      gsap.fromTo(fill, { filter: 'brightness(1.25)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' });
    }
  }, []);

  // Lens tick marks styling
  const paintTicks = useCallback((pos: number, width: number) => {
    const ticksContainer = ticksContainerRef.current;
    if (!ticksContainer) return;
    const ticks = ticksContainer.children;
    const count = ticks.length;
    const activeColor = themeTokensRef.current.start;

    for (let i = 0; i < count; i++) {
      const tick = ticks[i] as HTMLElement;
      const tickX = (i / (count - 1)) * width;
      const d = tickX - pos;
      // Animorio Lens formula: scaleY(0.4 + 0.6 * 1.3 * exp(-d*d / 420))
      const scale = 0.4 + 0.78 * Math.exp(-(d * d) / 420);
      tick.style.transform = `scaleY(${scale.toFixed(3)})`;
      tick.style.background = tickX <= pos ? activeColor : '#d3d6de';
    }
  }, []);

  // Spring physics loop for the thumb
  const tickPhysics = useCallback(
    (now: number) => {
      const phy = physicsRef.current;
      const dt = Math.min((now - phy.lastTime) / 1000, 1 / 30);
      phy.lastTime = now;

      const stiffness = 280;
      const damping = 24;
      const a = stiffness * (phy.target - phy.pos) - damping * phy.vel;
      phy.vel += a * dt;
      phy.pos += phy.vel * dt;

      const clampedPos = Math.max(0, Math.min(phy.pos, phy.width));
      if (thumbRef.current) {
        const stretch = Math.min(Math.abs(phy.vel) / 4500, 0.12);
        gsap.set(thumbRef.current, { x: clampedPos, scaleX: 1 + stretch, scaleY: 1 - stretch * 0.5 });
      }
      if (fillRef.current) {
        fillRef.current.style.width = `${clampedPos}px`;
      }

      paintTicks(clampedPos, phy.width);

      if (!phy.held && Math.abs(phy.target - phy.pos) < 0.1 && Math.abs(phy.vel) < 1.5) {
        phy.pos = phy.target;
        phy.vel = 0;
        if (thumbRef.current) gsap.set(thumbRef.current, { x: phy.pos, scaleX: 1, scaleY: 1 });
        if (fillRef.current) fillRef.current.style.width = `${phy.pos}px`;
        paintTicks(phy.pos, phy.width);
        phy.running = false;
        return;
      }

      requestAnimationFrame(tickPhysics);
    },
    [paintTicks]
  );

  // Setup DOM and animations
  useEffect(() => {
    if (pitchRollRef.current && !pitchRollInstRef.current) {
      pitchRollInstRef.current = makeRoll(pitchRollRef.current);
    }
    if (pixelsRollRef.current && !pixelsRollInstRef.current) {
      pixelsRollInstRef.current = makeRoll(pixelsRollRef.current);
    }

    // Initial texts
    const formattedPitch = pitch === Math.round(pitch) ? String(pitch) : pitch.toFixed(1);
    pitchRollInstRef.current?.set(formattedPitch, true);
    pixelsRollInstRef.current?.set(pixelsPerM2String(pitch, lang), true);
    setApplicationHint(getApplicationName(pitch, lang), true);

    // Initial track position
    const p = pitchToProgress(pitch);
    const track = trackRef.current;
    const w = track ? track.clientWidth : 320;
    physicsRef.current.width = w;
    physicsRef.current.pos = p * w;
    physicsRef.current.target = p * w;

    if (thumbRef.current) gsap.set(thumbRef.current, { x: p * w });
    if (fillRef.current) fillRef.current.style.width = `${p * w}px`;
    paintTicks(p * w, w);
  }, [makeRoll, setApplicationHint, pitch, lang, paintTicks]);

  // Sync with prop updates
  useEffect(() => {
    const formattedPitch = pitch === Math.round(pitch) ? String(pitch) : pitch.toFixed(1);
    pitchRollInstRef.current?.set(formattedPitch);
    pixelsRollInstRef.current?.set(pixelsPerM2String(pitch, lang));
    setApplicationHint(getApplicationName(pitch, lang));

    const p = pitchToProgress(pitch);
    const w = physicsRef.current.width;
    if (!physicsRef.current.held) {
      physicsRef.current.target = p * w;
      if (!physicsRef.current.running) {
        physicsRef.current.running = true;
        physicsRef.current.lastTime = performance.now();
        requestAnimationFrame(tickPhysics);
      }
    }
  }, [pitch, lang, setApplicationHint, tickPhysics]);

  // Update ticks color on theme change
  useEffect(() => {
    paintTicks(physicsRef.current.pos, physicsRef.current.width);
  }, [themeTokens, paintTicks]);

  // Pointer drag interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    track.setPointerCapture(e.pointerId);

    const rect = track.getBoundingClientRect();
    physicsRef.current.width = rect.width;
    physicsRef.current.held = true;

    if (knobRef.current) {
      gsap.to(knobRef.current, { scale: 0.9, duration: 0.12, ease: 'power2.out' });
    }

    const clientX = e.clientX;
    const norm = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    physicsRef.current.target = norm * rect.width;

    const newPitch = progressToPitch(norm);
    const newTier = getTierIndex(newPitch);
    if (newTier !== physicsRef.current.tier) {
      fuseTier(Math.min(newTier, physicsRef.current.tier), newTier > physicsRef.current.tier);
      physicsRef.current.tier = newTier;
    }

    // Direct immediate roll update during interaction
    const formattedPitch = newPitch === Math.round(newPitch) ? String(newPitch) : newPitch.toFixed(1);
    pitchRollInstRef.current?.set(formattedPitch);
    pixelsRollInstRef.current?.set(pixelsPerM2String(newPitch, lang));
    setApplicationHint(getApplicationName(newPitch, lang));

    onPitchChangeRef.current(newPitch);

    if (!physicsRef.current.running) {
      physicsRef.current.running = true;
      physicsRef.current.lastTime = performance.now();
      requestAnimationFrame(tickPhysics);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!physicsRef.current.held) return;
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const clientX = e.clientX;
    const norm = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    physicsRef.current.target = norm * rect.width;

    const newPitch = progressToPitch(norm);
    const newTier = getTierIndex(newPitch);
    if (newTier !== physicsRef.current.tier) {
      fuseTier(Math.min(newTier, physicsRef.current.tier), newTier > physicsRef.current.tier);
      physicsRef.current.tier = newTier;
    }

    // Direct immediate roll update during drag
    const formattedPitch = newPitch === Math.round(newPitch) ? String(newPitch) : newPitch.toFixed(1);
    pitchRollInstRef.current?.set(formattedPitch);
    pixelsRollInstRef.current?.set(pixelsPerM2String(newPitch, lang));
    setApplicationHint(getApplicationName(newPitch, lang));

    onPitchChangeRef.current(newPitch);
  };

  const handlePointerUp = () => {
    physicsRef.current.held = false;
    if (knobRef.current) {
      gsap.to(knobRef.current, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' });
    }
  };

  // Click on a preset button
  const handleSelectPreset = (p: number) => {
    const track = trackRef.current;
    const w = track ? track.clientWidth : physicsRef.current.width;
    physicsRef.current.width = w;
    const prog = pitchToProgress(p);
    physicsRef.current.target = prog * w;

    const newTier = getTierIndex(p);
    if (newTier !== physicsRef.current.tier) {
      fuseTier(Math.min(newTier, physicsRef.current.tier), newTier > physicsRef.current.tier);
      physicsRef.current.tier = newTier;
    }

    const formattedPitch = p === Math.round(p) ? String(p) : p.toFixed(1);
    pitchRollInstRef.current?.set(formattedPitch);
    pixelsRollInstRef.current?.set(pixelsPerM2String(p, lang));
    setApplicationHint(getApplicationName(p, lang));

    onPitchChangeRef.current(p);

    if (!physicsRef.current.running) {
      physicsRef.current.running = true;
      physicsRef.current.lastTime = performance.now();
      requestAnimationFrame(tickPhysics);
    }
  };

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (trackRef.current) {
        const w = trackRef.current.clientWidth;
        physicsRef.current.width = w;
        const p = pitchToProgress(pitch);
        physicsRef.current.pos = p * w;
        physicsRef.current.target = p * w;
        if (thumbRef.current) gsap.set(thumbRef.current, { x: p * w });
        if (fillRef.current) fillRef.current.style.width = `${p * w}px`;
        paintTicks(p * w, w);
      }
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [pitch, paintTicks]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 'min(540px, 100%)',
        userSelect: 'none',
      }}
    >
      <style>{`
        /* ── ANIMORIO ROLLING DIGITS SYSTEM (OFFICIAL EXACT CSS) ── */
        .roll {
          display: inline-flex;
          vertical-align: top;
          align-items: baseline;
        }

        .roll__col {
          position: relative;
          display: inline-block;
          height: 1.1em;
          line-height: 1.1;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);
          mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);
        }

        .roll__strip {
          display: flex;
          flex-direction: column;
        }

        .roll__strip > span {
          display: block;
          height: 1.1em;
          line-height: 1.1;
          text-align: center;
        }

        .roll__fixed {
          display: inline-block;
          height: 1.1em;
          line-height: 1.1;
          white-space: pre;
        }
        .pitch-track {
          position: relative;
          height: 32px;
          cursor: grab;
          touch-action: none;
          user-select: none;
          display: flex;
          align-items: center;
        }
        .pitch-track:active {
          cursor: grabbing;
        }
        .pitch-track__base {
          position: absolute;
          left: 0;
          right: 0;
          height: 14px;
          border-radius: 999px;
          background: #eceef3;
          box-shadow: inset 0 1px 1.5px rgba(16, 20, 34, 0.08);
        }
        .pitch-track__fill {
          position: absolute;
          left: 0;
          height: 14px;
          border-radius: 999px;
          background: linear-gradient(90deg, ${themeTokens.start}, ${themeTokens.end});
          box-shadow: 0 2px 10px -2px ${themeTokens.glow};
          overflow: hidden;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .pitch-track__notch {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          margin-left: -2px;
          background: #ffffff;
          border-radius: 1px;
          z-index: 2;
          pointer-events: none;
        }
        .pitch-track__seal {
          position: absolute;
          top: -2px;
          bottom: -2px;
          left: 0;
          width: 48px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
          transform: translateX(-60px) skewX(-20deg);
          pointer-events: none;
        }
        .pitch-thumb {
          position: absolute;
          top: 50%;
          left: 0;
          width: 0;
          height: 0;
          pointer-events: none;
          z-index: 3;
        }
        .pitch-thumb__knob {
          position: absolute;
          top: -16px;
          left: -16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(16, 20, 34, 0.12), 0 4px 14px rgba(16, 20, 34, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          cursor: grab;
          transition: box-shadow 0.2s ease;
        }
        .pitch-thumb__knob:active {
          cursor: grabbing;
          box-shadow: 0 1px 3px rgba(16, 20, 34, 0.16), 0 6px 18px rgba(16, 20, 34, 0.16);
        }
        .pitch-thumb__grip {
          display: flex;
          gap: 3px;
          align-items: center;
          justify-content: center;
        }
        .pitch-thumb__grip span {
          width: 2px;
          height: 11px;
          border-radius: 1px;
          background: #d0d4de;
        }
        .pitch-ticks {
          position: absolute;
          left: 0;
          right: 0;
          top: 24px;
          height: 10px;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
        }
        .pitch-ticks > span {
          width: 1.5px;
          height: 8px;
          background: #d3d6de;
          transform-origin: 50% 50%;
          border-radius: 1px;
          transition: background 0.15s ease;
        }
      `}</style>

      {/* ── 1. MAIN NUMBER DISPLAY (EXACT ANIMORIO IMAGE 2: '21 seats') ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          marginBottom: 8,
        }}
      >
        <div
          ref={pitchRollRef}
          className="roll"
          style={{
            fontSize: 'clamp(52px, 10vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-.03em',
            color: '#0e1118',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        />
        <span
          style={{
            fontSize: 'clamp(20px, 3.2vw, 26px)',
            color: '#7a808c',
            fontWeight: 500,
            letterSpacing: '-.01em',
          }}
        >
          {unitLabel}
        </span>
      </div>

      {/* ── 2. SUBTITLE STATS ROW (EXACT ANIMORIO IMAGE 2: '$10.80 per seat / month   $226.80/mo') ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 24,
          minHeight: 24,
        }}
      >
        {/* Left: Pixels Count with Rolling digits + per m2 label */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div
            ref={pixelsRollRef}
            className="roll"
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#0e1118',
              letterSpacing: '-.01em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          />
          <span
            style={{
              fontSize: '14px',
              color: '#7a808c',
              fontWeight: 500,
            }}
          >
            pixels / m²
          </span>
        </div>

        {/* Right: Application Ideale / Destination with Smooth Animated Transition */}
        <div
          style={{
            position: 'relative',
            height: 22,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            textAlign: 'right',
          }}
        >
          <span
            ref={(el) => {
              hintLinesRef.current[0] = el;
            }}
            style={{
              position: 'absolute',
              right: 0,
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#0e1118',
              letterSpacing: '-.01em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          />
          <span
            ref={(el) => {
              hintLinesRef.current[1] = el;
            }}
            style={{
              position: 'absolute',
              right: 0,
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#0e1118',
              letterSpacing: '-.01em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              opacity: 0,
            }}
          />
        </div>
      </div>

      {/* ── 3. INTERACTIVE ANIMORIO TRACK (EXACT IMAGE 2) ── */}
      <div
        ref={trackRef}
        className="pitch-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Base rail: soft grey capsule #eceef3 */}
        <span className="pitch-track__base" />

        {/* Fill: Theme-reactive gradient bar! */}
        <span ref={fillRef} className="pitch-track__fill">
          <span ref={sealRef} className="pitch-track__seal" />
        </span>

        {/* Tier Notches: clean white slits at tier thresholds (Image 2) */}
        {TIER_NOTCHES.map((np) => {
          const prog = pitchToProgress(np);
          return (
            <span
              key={np}
              className="pitch-track__notch"
              style={{ left: `${prog * 100}%` }}
            />
          );
        })}

        {/* Ticks with Lens Effect (turns theme color when covered) */}
        <div ref={ticksContainerRef} className="pitch-ticks">
          {Array.from({ length: 41 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        {/* Thumb Knob with || grip lines (Image 2) */}
        <span ref={thumbRef} className="pitch-thumb">
          <span ref={knobRef} className="pitch-thumb__knob">
            <span className="pitch-thumb__grip">
              <span />
              <span />
            </span>
          </span>
        </span>
      </div>

      {/* ── 4. PRESETS SCALE BELOW TICKS (0.7, 0.9, 1.2, ..., 10) ── */}
      <div
        style={{
          position: 'relative',
          height: 28,
          marginTop: 12,
        }}
      >
        {PRESETS.map((p) => {
          const isNear = Math.abs(pitch - p) < 0.08;
          const prog = pitchToProgress(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectPreset(p)}
              style={{
                position: 'absolute',
                left: `${prog * 100}%`,
                transform: 'translateX(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 2px',
                fontSize: 12,
                letterSpacing: '-.01em',
                fontFamily: 'inherit',
                color: isNear ? '#0e1118' : '#7a808c',
                fontWeight: isNear ? 700 : 500,
                transition: 'color .18s ease, transform .18s ease',
              }}
            >
              {p === Math.round(p) ? p : p.toFixed(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
