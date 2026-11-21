"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  className?: string;
}

export interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

export type TabItem = Tab | Separator;

export interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  /** Couleur explicite du disque actif. Par défaut : l'accent du site (--ui-accent). */
  activeColor?: string;
  onChange?: (index: number | null) => void;
  activeIndex?: number | null;
}

/* Géométrie calquée sur « The Notched Tab Bar » (Animorio), réduite pour le mobile.
   La barre d'origine fait 76px de haut pour 400px de large ; ici 58px pour ~290px. */
const BAR_HEIGHT = 58;
const CIRCLE_SIZE = 44;
const CORNER = 15;
const PAD = 21;
const ITEM_WIDTH = 62;
const NOTCH_HALF = 32;
const NOTCH_DEPTH = 26;
/* Le disque est centré 2px au-dessus du bord supérieur de la barre, comme dans la démo. */
const CIRCLE_TOP = -(CIRCLE_SIZE / 2) - 2;
const LABEL_TOP = 36;

const f = (n: number) => n.toFixed(2);

/* L'accent du site est exposé par le CMS et le thème global dans --ui-accent /
   --ui-accent-rgb. On ne lit ces variables qu'après le montage pour éviter tout
   écart d'hydratation, puis on écoute le changement de thème à chaud. */
const FALLBACK_ACCENT_RGB: [number, number, number] = [255, 91, 58];

function readAccentRgb(element: Element | null): [number, number, number] {
  if (typeof window === "undefined" || !element) return FALLBACK_ACCENT_RGB;
  const raw = getComputedStyle(element).getPropertyValue("--ui-accent-rgb").trim();
  const parts = raw.split(",").map((value) => Number(value.trim()));
  return parts.length === 3 && parts.every(Number.isFinite)
    ? (parts as [number, number, number])
    : FALLBACK_ACCENT_RGB;
}

/** Luminance sRGB : un glyphe sombre est plus lisible sur les accents clairs. */
function needsDarkForeground([r, g, b]: [number, number, number]): boolean {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) > 0.35;
}

/**
 * Tracé SVG unique de la barre : une encoche symétrique, raccordée en tangente
 * horizontale, dont la demi-largeur se réduit près des coins arrondis.
 */
function getNotchedPath(width: number, cx: number, half: number, depth: number): string {
  if (width <= 0) return "";
  const h = Math.max(8, Math.min(half, cx - CORNER, width - CORNER - cx));
  const a = cx - h;
  const b = cx + h;

  return `M0 ${CORNER}Q0 0 ${CORNER} 0L${f(a)} 0`
    + `C${f(a + h * 0.42)} 0 ${f(cx - h * 0.64)} ${f(depth)} ${f(cx)} ${f(depth)}`
    + `C${f(cx + h * 0.64)} ${f(depth)} ${f(b - h * 0.42)} 0 ${f(b)} 0`
    + `L${width - CORNER} 0Q${width} 0 ${width} ${CORNER}`
    + `L${width} ${BAR_HEIGHT - CORNER}Q${width} ${BAR_HEIGHT} ${width - CORNER} ${BAR_HEIGHT}`
    + `L${CORNER} ${BAR_HEIGHT}Q0 ${BAR_HEIGHT} 0 ${BAR_HEIGHT - CORNER}Z`;
}

export function ExpandableTabs({
  tabs,
  className,
  activeColor,
  onChange,
  activeIndex: controlledIndex,
}: ExpandableTabsProps) {
  const validTabs = React.useMemo(
    () => tabs.filter((t): t is Tab => !("type" in t && t.type === "separator")),
    [tabs]
  );

  const [internalSelected, setInternalSelected] = React.useState<number | null>(
    controlledIndex ?? 0
  );
  const selectedIndex = controlledIndex !== undefined ? controlledIndex : internalSelected;
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [accentRgb, setAccentRgb] = React.useState<[number, number, number]>(
    FALLBACK_ACCENT_RGB
  );

  React.useEffect(() => {
    if (controlledIndex !== undefined) setInternalSelected(controlledIndex);
  }, [controlledIndex]);

  const count = validTabs.length;
  const defaultWidth = PAD * 2 + Math.max(count, 1) * ITEM_WIDTH;
  const defaultCenter = PAD + ITEM_WIDTH / 2;

  const navRef = React.useRef<HTMLElement>(null);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    // On lit la variable sur la barre elle-même : c'est la même valeur que
    // celle utilisée par le disque, y compris quand le CMS la surcharge.
    const sync = () => setAccentRgb(readAccentRgb(navRef.current));
    sync();
    window.addEventListener("pixiatech-theme-change", sync);
    return () => window.removeEventListener("pixiatech-theme-change", sync);
  }, []);

  const [width, setWidth] = React.useState(defaultWidth);
  const widthValue = useMotionValue(defaultWidth);

  React.useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const w = nav.getBoundingClientRect().width || defaultWidth;
      setWidth(w);
      widthValue.set(w);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [defaultWidth, widthValue]);

  const centers = React.useMemo(() => {
    if (count === 0) return [];
    const step = width > 0 ? Math.max(1, (width - 2 * PAD) / count) : ITEM_WIDTH;
    return Array.from({ length: count }, (_, i) => PAD + step * (i + 0.5));
  }, [count, width]);

  /* Ressort unique : il pilote l'encoche, le disque et son label. */
  const x = useSpring(defaultCenter, {
    stiffness: prefersReducedMotion ? 1200 : 360,
    damping: prefersReducedMotion ? 60 : 26,
    mass: 0.75,
  });
  const velocity = useVelocity(x);

  React.useEffect(() => {
    if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= count) return;
    x.set(centers[selectedIndex]);
  }, [centers, count, selectedIndex, x]);

  /* Plus ça va vite, plus l'encoche s'élargit et plus le disque plonge/s'écrase. */
  const pathD = useTransform<number, string>([x, velocity, widthValue], ([cx, v, w]) => {
    const hw = prefersReducedMotion
      ? NOTCH_HALF
      : NOTCH_HALF + Math.min(12, Math.abs(v) * 0.012);
    return getNotchedPath(w, cx, hw, NOTCH_DEPTH);
  });
  const dip = useTransform(velocity, (v) =>
    prefersReducedMotion ? 0 : Math.min(9, Math.abs(v) * 0.009)
  );
  const squash = useTransform(velocity, (v) =>
    prefersReducedMotion ? 0 : Math.min(0.16, Math.abs(v) * 0.00025)
  );
  const scaleX = useTransform(squash, (s) => 1 + s);
  const scaleY = useTransform(squash, (s) => 1 / (1 + s));
  const discX = useTransform(x, (cx) => cx - CIRCLE_SIZE / 2);

  const handleSelect = (idx: number) => {
    setInternalSelected(idx);
    onChange?.(idx);
  };

  const activeTab = selectedIndex !== null ? validTabs[selectedIndex] : null;
  const ActiveIcon = activeTab?.icon;
  const isDanger = Boolean(activeTab?.className?.includes("text-red"));
  const iconOnAccent = isDanger || !needsDarkForeground(accentRgb) ? "#ffffff" : "#080808";

  return (
    <nav
      ref={navRef}
      aria-label="Navigation principale mobile"
      className={cn("relative select-none touch-manipulation", className)}
      style={{ width: `min(${defaultWidth}px, 100%)`, height: BAR_HEIGHT }}
    >
      {/* Coque sombre, tracée en un seul SVG comme dans la démo Animorio. */}
      <svg
        width="100%"
        height={BAR_HEIGHT}
        viewBox={`0 0 ${width} ${BAR_HEIGHT}`}
        className="absolute inset-0 pointer-events-none overflow-visible"
        aria-hidden="true"
      >
        <motion.path d={pathD} fill="#151519" />
      </svg>

      {/* Disque flottant : centré sur l'encoche, il plonge et s'écrase pendant le ressort. */}
      {selectedIndex !== null && ActiveIcon && (
        <motion.div
          className="absolute z-20 flex items-center justify-center rounded-full pointer-events-none will-change-transform"
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            left: 0,
            top: CIRCLE_TOP,
            x: discX,
            y: dip,
            scaleX,
            scaleY,
            backgroundColor: isDanger
              ? "#ef4444"
              : activeColor ?? "var(--ui-accent, #ff5b3a)",
            boxShadow: isDanger
              ? "0 10px 22px -10px rgba(239, 68, 68, 0.6)"
              : "0 10px 22px -10px rgba(var(--ui-accent-rgb, 255, 91, 58), 0.6)",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`active-icon-${selectedIndex}`}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.6, y: 8 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.6, y: -8 }
              }
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="flex items-center justify-center"
              style={{ color: iconOnAccent }}
            >
              <ActiveIcon size={21} strokeWidth={2.2} aria-hidden="true" />
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Onglets interactifs. */}
      <div
        className="relative z-30 flex items-stretch h-full"
        style={{ paddingLeft: PAD, paddingRight: PAD }}
      >
        {validTabs.map((tab, idx) => {
          const isSelected = selectedIndex === idx;
          const Icon = tab.icon;
          const tabIsDanger = Boolean(tab.className?.includes("text-red"));

          return (
            <button
              key={tab.title}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              aria-label={tab.title}
              aria-current={isSelected ? "page" : undefined}
              onClick={() => handleSelect(idx)}
              onKeyDown={(event) => {
                let next: number | null = null;
                if (event.key === "ArrowRight") next = (idx + 1) % count;
                else if (event.key === "ArrowLeft") next = (idx - 1 + count) % count;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = count - 1;
                if (next === null) return;
                event.preventDefault();
                tabRefs.current[next]?.focus();
              }}
              className={cn(
                "relative flex min-w-0 flex-1 basis-0 cursor-pointer select-none flex-col items-center justify-center rounded-xl outline-none transition-transform active:scale-95",
                "[-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-white/70"
              )}
            >
              {/* L'icône de l'onglet actif remonte dans le disque : on masque celle du repos. */}
              <motion.span
                animate={{
                  opacity: isSelected ? 0 : 1,
                  scale: isSelected ? 0.7 : 1,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={cn(
                  "flex items-center justify-center",
                  tabIsDanger ? "text-red-400" : "text-[#8b8b96]"
                )}
              >
                <Icon size={21} strokeWidth={2} aria-hidden="true" />
              </motion.span>

              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.span
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="pointer-events-none absolute whitespace-nowrap text-[11px] font-semibold tracking-wide text-white"
                    style={{ top: LABEL_TOP, left: "50%", x: "-50%" }}
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
