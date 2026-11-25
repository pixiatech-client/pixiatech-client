'use client';

/**
 * Goo Switch — module partagé, adapté du composant officiel Devigner UI
 * (https://ui.devigner.cc/components/goo-switch) au stack déjà présent :
 * framer-motion v11 + Tailwind v3, sans dépendance supplémentaire.
 *
 * La couleur ON suit le token de marque `--ui-accent`.
 * Les deux cues sonores (ON/OFF) sont ceux du patch `kobra-ui` de Devigner,
 * synthétisés via Web Audio (aucun fichier audio à télécharger).
 */

import * as React from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type Transition,
} from 'framer-motion';
import { cn } from '@/lib/utils';

// Drawn in a 62x32 viewBox; the button scales it with its height.
const W = 62;
const H = 32;
/** Resting pill width as a multiple of the thumb height. */
const PILL_RATIO = 1.6;
/** Pointer travel past the pinned thumb that fully stretches it over the end. */
const PULL = 22;
/** Goo contrast per device pixel per unit. */
const GOO_EDGE = 5;
/** Pointer travel before a press becomes a drag. */
const DRAG_SLOP = 3;
/** How far hover and press wash the track toward the background, in %. */
const LIFT_HOVER = 10;
const LIFT_PRESS = 28;

/** Token de marque unique : jamais de bleu codé en dur. */
const ACCENT = 'var(--ui-accent, #006FFF)';
const TRACK_OFF = '#2B2B28';
const TRACK_BG = '#121211';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_PRESS: Transition = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 };
const SPRING_LAYOUT: Transition = { type: 'spring', stiffness: 360, damping: 32, mass: 0.6 };
const SPRING_GOO: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 1.1 };
const SPRING_MOUSE = { stiffness: 200, damping: 15, mass: 0.3 };

type SoundCue = {
  start: number;
  end: number;
  attack: number;
  decay: number;
  gain: number;
};

/** Devigner `kobra-ui` — exactement les deux cues toggleOn / toggleOff. */
const CUE_ON: SoundCue = {
  start: 520,
  end: 880,
  attack: 0.002,
  decay: 0.085,
  gain: 0.3,
};
const CUE_OFF: SoundCue = {
  start: 780,
  end: 420,
  attack: 0.002,
  decay: 0.085,
  gain: 0.28,
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioContext) sharedAudioContext = new AudioCtor();
  // Le contexte est créé dans un geste utilisateur : le resume() est autorisé.
  if (sharedAudioContext.state === 'suspended') void sharedAudioContext.resume();
  return sharedAudioContext;
}

function playCue(cue: SoundCue): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const end = now + cue.attack + cue.decay;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(cue.start, now);
  osc.frequency.exponentialRampToValueAtTime(cue.end, end);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(cue.gain, now + cue.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(now);
  osc.stop(end + 0.02);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
/** Mirrors an x drawn for the right end onto the left end. */
const side = (x: number, d: number) => (d < 0 ? W - x : x);

function geometry(inset: number) {
  const gap = clamp(inset, 1, 10);
  const th = H - gap * 2;
  const r = th / 2;
  return {
    gap,
    th,
    r,
    pill: th * PILL_RATIO,
    minC: gap + r,
    maxC: W - gap - r,
  };
}
type Geometry = ReturnType<typeof geometry>;

/** Resting thumb center for a state and width: the pill hugs its end. */
const restCenter = (g: Geometry, on: boolean, w: number) =>
  on ? W - g.gap - w / 2 : g.gap + w / 2;

const SIZES = { xs: 'h-4', sm: 'h-6', md: 'h-8', lg: 'h-10' } as const;

/** Local equivalent of devignerui's useReducedMotionPreference(). */
function useReducedMotionPreference() {
  const query = '(prefers-reduced-motion: reduce)';
  const subscribe = React.useCallback((onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    () => false
  );
}

/** Local equivalent of devignerui's useControllableState(). */
function useControllableState<T>({
  value,
  defaultValue,
  onValueChange,
}: {
  value?: T;
  defaultValue: T;
  onValueChange?: (value: T) => void;
}) {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : uncontrolled;
  const currentRef = React.useRef(current);
  const changeRef = React.useRef(onValueChange);
  currentRef.current = current;
  changeRef.current = onValueChange;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const previous = currentRef.current;
      const nextValue = typeof next === 'function' ? (next as (p: T) => T)(previous) : next;
      if (Object.is(previous, nextValue)) return;
      if (!isControlled) setUncontrolled(nextValue);
      changeRef.current?.(nextValue);
    },
    [isControlled]
  );
  return [current, setValue] as const;
}

export interface GooSwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onChange' | 'value' | 'defaultValue' | 'checked'
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  inset?: number;
  stretch?: boolean;
  sling?: number | false;
  trail?: number;
  /** Joue le cue ON/OFF. Désactivable au cas par cas. */
  sound?: boolean;
}

export const GooSwitch = React.forwardRef<HTMLButtonElement, GooSwitchProps>(function GooSwitch(
  {
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled = false,
    size = 'sm',
    inset = 4,
    stretch = true,
    sling = 0.5,
    trail = 3.2,
    sound = true,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    onPointerLeave,
    onClick,
    ...rest
  },
  forwardedRef
) {
  const [on, setOn] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onValueChange: onCheckedChange,
  });
  const onRef = React.useRef(on);
  onRef.current = on;
  const reduced = useReducedMotionPreference();
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const svg = React.useRef<SVGSVGElement>(null);
  const g = React.useMemo(() => geometry(inset), [inset]);
  const live = React.useRef({ g, trail });
  live.current = { g, trail };
  const press = React.useRef<{ x: number; moved: boolean } | null>(null);
  const uid = React.useId().replace(/:/g, '');
  const [contrast, setContrast] = React.useState(6);

  /** Unique point de changement : le son n'est joué que sur une vraie action. */
  const commit = React.useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const previous = onRef.current;
      const nextValue = typeof next === 'function' ? next(previous) : next;
      if (nextValue !== previous && sound) playCue(nextValue ? CUE_ON : CUE_OFF);
      setOn(nextValue);
    },
    [setOn, sound]
  );

  React.useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const measure = () => {
      const px = (el.getBoundingClientRect().width / W) * (window.devicePixelRatio || 1);
      if (px > 0) setContrast(Math.max(4, GOO_EDGE * px));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = useMotionValue(restCenter(g, on, g.pill));
  const tail = useMotionValue(restCenter(g, on, g.pill));
  const width = useMotionValue(g.pill);
  const pull = useMotionValue(0);
  const dir = useMotionValue(1);
  const onness = useMotionValue(on ? 1 : 0);
  const lift = useMotionValue(0);

  const to = React.useCallback(
    (mv: MotionValue<number>, target: number, transition: Transition) => {
      if (reduced) mv.jump(target);
      // framer-motion v11 exports a broad `Transition` type; the value-level
      // animate() expects the narrower (non-exported) ValueAnimationTransition.
      else animate(mv, target, transition as never);
    },
    [reduced]
  );

  // Settle whenever state, press or drag changes: the head uses the quick
  // layout spring, the tail the heavy goo spring → a trailing droplet.
  React.useEffect(() => {
    const w = pressed ? g.th : g.pill;
    to(width, w, pressed ? SPRING_PRESS : { ...SPRING_PRESS, delay: 0.12 });
    if (dragging) return;
    const c = restCenter(g, on, w);
    to(cx, c, SPRING_LAYOUT);
    to(tail, c, { ...SPRING_GOO, delay: 0.05 });
  }, [g, on, pressed, dragging, to, width, cx, tail]);

  React.useEffect(() => {
    to(onness, on ? 1 : 0, { duration: 0.25, ease: [...EASE_OUT] });
  }, [on, to, onness]);

  React.useEffect(() => {
    to(lift, pressed ? LIFT_PRESS : hovered ? LIFT_HOVER : 0, {
      duration: 0.2,
      ease: [...EASE_OUT],
    });
  }, [pressed, hovered, to, lift]);

  const fill = useTransform(
    [onness, lift],
    ([o, l]: number[]) =>
      `color-mix(in oklab, color-mix(in oklab, ${ACCENT} ${o * 100}%, ${TRACK_OFF}) ${
        100 - l
      }%, ${TRACK_BG})`
  );
  const thumbX = useTransform([cx, width], ([c, w]: number[]) => c - w / 2);
  const shadowRx = useTransform(width, (w) => w / 2 + 2);
  const tailPath = useTransform([cx, tail], ([c, t]: number[]) => {
    const { g: geo, trail: length } = live.current;
    const h = geo.r * 0.9;
    const len = (t - c) * length;
    const s = len < 0 ? -1 : 1;
    const tip = c + len;
    const tr = h * 0.38;
    const m = H / 2;
    return (
      `M${c} ${m - h}` +
      `C${c + len * 0.4} ${m - h} ${tip - s * tr * 1.5} ${m - tr} ${tip} ${m - tr}` +
      `A${tr} ${tr} 0 0 ${s > 0 ? 1 : 0} ${tip} ${m + tr}` +
      `C${tip - s * tr * 1.5} ${m + tr} ${c + len * 0.4} ${m + h} ${c} ${m + h}Z`
    );
  });

  const blobAt = (p: number) => lerp(live.current.g.maxC, W - H / 2, p);
  const blobCx = useTransform([pull, dir], ([p, d]: number[]) => side(blobAt(p), d));
  const blobRx = useTransform(pull, (p) => lerp(live.current.g.r, H / 2 + 3, p));
  const blobRy = useTransform(pull, (p) => lerp(live.current.g.r, H / 2 - 1, p));
  const TONGUE_RX = 31;
  const tongueCx = useTransform([pull, dir], ([p, d]: number[]) => {
    const { maxC, r } = live.current.g;
    return side(lerp(maxC - r - 1, W - 4, p) - TONGUE_RX, d);
  });
  const tongueRy = useTransform(pull, (p) => lerp(live.current.g.r * 0.8, H * 0.55, p));
  const tongueOpacity = useTransform(pull, (p) => (p > 0.001 ? 1 : 0));
  const shadowOpacity = useTransform(pull, (p) => 0.14 * (1 - p));

  const localX = (clientX: number) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return ((clientX - box.left) / box.width) * W;
  };

  const endPress = (commitPress: boolean) => {
    const p = press.current;
    press.current = null;
    setPressed(false);
    setDragging(false);
    const stretched = pull.get();
    if (stretched > 0) {
      const at = side(blobAt(stretched), dir.get());
      cx.jump(at);
      tail.jump(at);
      pull.jump(0);
    }
    if (!commitPress || !p) return;
    if (sling !== false && stretched >= sling) return commit(dir.get() < 0);
    if (!p.moved) commit((v) => !v);
    else commit(cx.get() > W / 2);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-state={on ? 'checked' : 'unchecked'}
      disabled={disabled}
      ref={forwardedRef}
      {...rest}
      style={{ ...style, outlineColor: ACCENT }}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        setHovered(true);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        setHovered(false);
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (e.button !== 0 || disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press.current = { x: localX(e.clientX), moved: false };
        setPressed(true);
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const p = press.current;
        if (!p) return;
        const x = localX(e.clientX);
        if (!p.moved) {
          if (Math.abs(x - p.x) < DRAG_SLOP) return;
          p.moved = true;
          setDragging(true);
        }
        const c = clamp(x, g.minC, g.maxC);
        const over = x > g.maxC ? x - g.maxC : x < g.minC ? x - g.minC : 0;
        if (over !== 0) dir.set(Math.sign(over));
        if (stretch) pull.set(clamp(Math.abs(over) / PULL, 0, 1));
        to(cx, c, { type: 'spring', ...SPRING_MOUSE });
        to(tail, c, SPRING_GOO);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        endPress(true);
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        endPress(false);
      }}
      onClick={(e) => {
        onClick?.(e);
        // Pointer presses toggle on release; detail 0 is Space, Enter or label.
        if (e.detail === 0 && !disabled) commit((v) => !v);
      }}
      className={cn(
        'relative inline-block shrink-0 cursor-pointer touch-none select-none rounded-full',
        'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aspect-[62/32]',
        SIZES[size],
        className
      )}
    >
      <svg
        ref={svg}
        aria-hidden
        viewBox={`0 0 ${W} ${H}`}
        className="block h-full w-full overflow-visible"
      >
        <defs>
          <clipPath id={`${uid}-track`}>
            <rect width={W} height={H} rx={H / 2} />
          </clipPath>
          <filter id={`${uid}-goo`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feColorMatrix
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} ${-contrast / 2}`}
            />
          </filter>
          <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <mask
            id={`${uid}-tongue`}
            maskUnits="userSpaceOnUse"
            x={-W}
            y={-H}
            width={W * 3}
            height={H * 3}
          >
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="white" />
            <motion.ellipse
              cx={tongueCx}
              cy={H / 2}
              rx={TONGUE_RX}
              ry={tongueRy}
              opacity={tongueOpacity}
              fill="black"
            />
          </mask>
        </defs>

        <motion.rect width={W} height={H} rx={H / 2} style={{ fill }} />
        <g clipPath={`url(#${uid}-track)`}>
          <motion.ellipse
            cx={cx}
            cy={H / 2}
            rx={shadowRx}
            ry={g.r + 2}
            fill="black"
            opacity={shadowOpacity}
            filter={`url(#${uid}-soft)`}
          />
        </g>

        <g filter={`url(#${uid}-goo)`}>
          <g mask={`url(#${uid}-tongue)`} fill="white">
            <motion.path d={tailPath} />
            <motion.rect
              x={thumbX}
              y={g.gap}
              width={width}
              height={g.th}
              rx={g.r}
            />
            <motion.ellipse
              cx={blobCx}
              cy={H / 2}
              rx={blobRx}
              ry={blobRy}
              opacity={tongueOpacity}
            />
          </g>
        </g>
      </svg>
    </button>
  );
});

export default GooSwitch;
