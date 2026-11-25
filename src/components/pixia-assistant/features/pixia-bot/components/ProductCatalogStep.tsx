'use client';

import { Check, Expand, Monitor, Scale, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { t } from '../../../core/i18n/translations';
import { computeDemoTestEstimate, formatDemoEuro } from '../../../core/pricing/demo-test-pricing';
import type { ConfigState, Language, Product } from '../../../core/types';

interface ProductCatalogStepProps {
  lang: Language;
  products: Product[];
  isPriceHidden: boolean;
  demoShowPrices?: boolean;
  configState?: ConfigState;
  initialSelectedId?: string | null;
  onSelect: (product: Product) => void;
}

const ACCENT = '#3f9b78';
const FLIGHT_SEC = 0.92;
const ARC_FACTOR = 1;
const SPRING_K = 1;
const ADVANCE_DELAY_SEC = 1.15;

function springEase(t: number): number {
  if (t >= 1) return 1;
  const w = 7 + 9 * SPRING_K;
  const d = 5.2 + 2 / (0.35 + SPRING_K);
  return 1 - Math.exp(-d * t) * Math.cos(w * t);
}

function cubicBezier(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

export function ProductCatalogStep({
  lang,
  products,
  isPriceHidden,
  demoShowPrices = false,
  configState,
  initialSelectedId = null,
  onSelect,
}: ProductCatalogStepProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparator, setShowComparator] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [activeFlyId, setActiveFlyId] = useState<string | null>(null);
  const [flyImageUrl, setFlyImageUrl] = useState<string | null>(null);

  const busyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const timelinesRef = useRef<Array<gsap.core.Tween | gsap.core.Timeline>>([]);
  const picRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const photoRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const glintRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const btnBodyRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const sheenRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const addWordRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const doneWordRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const checkPathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const wellRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const bagRefs = useRef<Record<string, SVGSVGElement | null>>({});
  const handleRefs = useRef<Record<string, SVGPathElement | null>>({});
  const countBadgeRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const digitsRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const flyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      for (const tl of timelinesRef.current) {
        tl.kill();
      }
      timelinesRef.current = [];
    };
  }, []);

  const track = <T extends gsap.core.Tween | gsap.core.Timeline>(anim: T): T => {
    timelinesRef.current.push(anim);
    return anim;
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const sweepElement = (el: HTMLElement | null, from: number, to: number, dur: number) => {
    if (!el) return;
    track(gsap.fromTo(el, { xPercent: from }, { xPercent: to, duration: dur, ease: 'power2.inOut', overwrite: true }));
  };

  const handleHoverOn = (id: string) => {
    if (busyRef.current || selectedId === id) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const body = btnBodyRefs.current[id];
    const sheen = sheenRefs.current[id];
    if (body) track(gsap.to(body, { y: -1.5, duration: 0.35, ease: 'power3.out', overwrite: 'auto' }));
    sweepElement(sheen, -130, 260, 0.85);
  };

  const handleHoverOff = (id: string) => {
    const body = btnBodyRefs.current[id];
    if (body) track(gsap.to(body, { y: 0, scale: 1, duration: 0.5, ease: springEase, overwrite: 'auto' }));
  };

  const handlePressOn = (id: string) => {
    if (busyRef.current) return;
    const body = btnBodyRefs.current[id];
    if (body) track(gsap.to(body, { scale: 0.965, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }));
  };

  const handlePressOff = (id: string) => {
    const body = btnBodyRefs.current[id];
    if (body) track(gsap.to(body, { scale: 1, duration: 0.55, ease: springEase, overwrite: 'auto' }));
  };

  const handleSelectWithGsap = (product: Product) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setActiveFlyId(product.id);
    setFlyImageUrl(product.images[0] ?? null);

    const id = product.id;
    const ridotto =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const picEl = picRefs.current[id];
    const photoEl = photoRefs.current[id];
    const glintEl = glintRefs.current[id];
    const bodyEl = btnBodyRefs.current[id];
    const sheenEl = sheenRefs.current[id];
    const addW = addWordRefs.current[id];
    const doneW = doneWordRefs.current[id];
    const checkEl = checkPathRefs.current[id];
    const wellEl = wellRefs.current[id];
    const bagEl = bagRefs.current[id];
    const handleEl = handleRefs.current[id];
    const badgeEl = countBadgeRefs.current[id];
    const digitsEl = digitsRefs.current[id];

    const triggerLanding = () => {
      setSelectedId(id);

      if (addW) {
        track(
          gsap.to(addW, {
            yPercent: -100,
            opacity: 0,
            duration: 0.42,
            ease: 'power3.in',
            overwrite: true,
          })
        );
      }

      if (doneW) {
        track(
          gsap.fromTo(
            doneW,
            { yPercent: 90, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.7,
              ease: springEase,
              delay: 0.08,
              overwrite: true,
            }
          )
        );
      }

      if (checkEl) {
        track(
          gsap.fromTo(
            checkEl,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.42,
              ease: 'power2.out',
              delay: 0.22,
              overwrite: true,
            }
          )
        );
      }

      if (badgeEl) {
        track(
          gsap.fromTo(
            badgeEl,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.45,
              ease: springEase,
              overwrite: true,
            }
          )
        );
      }

      if (digitsEl) {
        track(
          gsap.fromTo(
            digitsEl,
            { yPercent: 0 },
            {
              yPercent: -10,
              duration: 0.72,
              ease: springEase,
              delay: 0.05,
              overwrite: true,
            }
          )
        );
      }

      if (bodyEl) {
        track(
          gsap
            .timeline()
            .to(bodyEl, { scale: 1.045, duration: 0.12, ease: 'power2.out' })
            .to(bodyEl, { scale: 1, duration: 0.85, ease: springEase })
        );
      }

      if (bagEl) {
        track(
          gsap
            .timeline()
            .to(bagEl, {
              scaleY: 0.86,
              scaleX: 1.08,
              y: 1.5,
              duration: 0.1,
              ease: 'power2.out',
              transformOrigin: '50% 100%',
            })
            .to(bagEl, { scaleY: 1, scaleX: 1, y: 0, duration: 0.7, ease: springEase })
        );
      }

      if (handleEl) {
        track(
          gsap
            .timeline()
            .to(handleEl, { y: -1.6, duration: 0.12, ease: 'power2.out' })
            .to(handleEl, { y: 0, duration: 0.8, ease: springEase })
        );
      }

      sweepElement(sheenEl, -130, 260, 0.9);

      track(
        gsap.delayedCall(ADVANCE_DELAY_SEC, () => {
          onSelectRef.current(product);
        })
      );
    };

    if (ridotto || !picEl || !wellEl) {
      triggerLanding();
      return;
    }

    // Wait 1 animation frame so the portaled fly element has the current product image rendered
    window.requestAnimationFrame(() => {
      const flyEl = flyRef.current;
      if (!flyEl) {
        triggerLanding();
        return;
      }

      const p0 = picEl.getBoundingClientRect();
      const startCX = p0.left + p0.width / 2;
      const startCY = p0.top + p0.height / 2;
      const S = Math.min(p0.height * 0.72, p0.width * 0.5);

      gsap.set(flyEl, {
        left: 0,
        top: 0,
        x: startCX,
        y: startCY,
        xPercent: -50,
        yPercent: -50,
        width: S,
        height: S,
        borderRadius: 14,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visibility: 'visible',
      });

      if (photoEl) {
        track(
          gsap
            .timeline()
            .to(photoEl, { scale: 0.975, duration: 0.14, ease: 'power2.out' })
            .to(photoEl, { scale: 1, duration: 0.8, ease: springEase })
        );
      }
      sweepElement(glintEl, -120, 380, 1.05);

      const prog = { p: 0 };
      const updateFlight = () => {
        const t = prog.p;
        const aRect = picEl.getBoundingClientRect();
        const wRect = wellEl.getBoundingClientRect();

        const sx = aRect.left + aRect.width / 2;
        const sy = aRect.top + aRect.height / 2;
        const ex = wRect.left + wRect.width / 2;
        const ey = wRect.top + wRect.height / 2 + 1;

        const lift = Math.max(36, Math.abs(ey - sy) * 0.55) * ARC_FACTOR;
        const c1x = sx + (ex - sx) * 0.15;
        const c1y = sy - lift;
        const c2x = ex + (ex > sx ? 18 : -18) * ARC_FACTOR;
        const c2y = ey - lift * 1.15;

        const endScale = (wRect.width * 0.62) / S;
        const k = gsap.parseEase('power2.in')(Math.min(1, t * 1.05));
        const sc = 1 + (endScale - 1) * k;
        const half = (S * sc) / 2 + 4;
        const vw = window.innerWidth;
        const rawX = cubicBezier(sx, c1x, c2x, ex, t);
        const x = Math.min(vw - half, Math.max(half, rawX));
        const y = cubicBezier(sy, c1y, c2y, ey, t);
        const rot = Math.sin(t * Math.PI) * -9;
        const radius = 14 + (S / 2 - 14) * Math.min(1, t * 1.6);

        gsap.set(flyEl, {
          x,
          y,
          scale: sc,
          rotation: rot,
          borderRadius: radius,
        });
      };

      track(
        gsap
          .timeline()
          .to(flyEl, {
            y: '-=8',
            scale: 1.05,
            duration: 0.18,
            ease: 'power2.out',
            boxShadow:
              '0 0 0 1.5px rgba(255,255,255,0.65), 0 14px 26px -8px rgba(0,0,0,0.65), 0 30px 46px -14px rgba(63,155,120,0.38)',
          })
          .to(
            prog,
            {
              p: 1,
              duration: FLIGHT_SEC,
              ease: 'power1.inOut',
              onUpdate: updateFlight,
            },
            '>-0.04'
          )
          .add(triggerLanding, '>-0.02')
          .to(flyEl, { scale: '*=0.32', opacity: 0, duration: 0.16, ease: 'power2.in' }, '<')
          .set(flyEl, { visibility: 'hidden' })
      );
    });
  };

  const comparedProducts = products.filter((p) => compareIds.includes(p.id));
  const priceDisplay = isPriceHidden ? t(lang, 'ui.priceHidden') : t(lang, 'ui.onQuote');
  const getCardPriceLabel = (product: Product) => {
    if (!demoShowPrices || !configState) return priceDisplay;
    const est = computeDemoTestEstimate({
      configState,
      includeDelivery: null,
      includeInstallation: null,
      productOverride: product,
    });
    return `${formatDemoEuro(est.productGlobalPrice, lang)}`;
  };

  const flyPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={flyRef}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[240] overflow-hidden bg-[#17171A] border border-white/40"
            style={{ visibility: 'hidden' }}
          >
            {flyImageUrl ? (
              <img
                src={flyImageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#202025] text-[#3f9b78]">
                <Monitor className="h-8 w-8" />
              </div>
            )}
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.36) 0%, transparent 55%)',
              }}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-3.5 pb-1">
      {flyPortal}

      {compareIds.length >= 2 && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-[#202025] px-3.5 py-2.5">
          <p className="text-xs text-[#E4E4E7]">
            {lang === 'fr'
              ? `${compareIds.length} modèles à comparer`
              : `${compareIds.length} models to compare`}
          </p>
          <button
            type="button"
            onClick={() => setShowComparator(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Scale className="h-3.5 w-3.5" />
            {t(lang, 'ui.comparedCount', { count: compareIds.length })}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5">
        {products.map((product) => {
          const isCompared = compareIds.includes(product.id);
          const primaryImage = product.images[0];
          const isSelectedThis = selectedId === product.id;
          const isMuted = Boolean(activeFlyId && activeFlyId !== product.id);

          return (
            <article
              key={product.id}
              className={`rounded-[24px] border bg-[#1B1B20] p-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.42)] transition-all duration-300 ${
                isSelectedThis
                  ? 'border-[#3f9b78]/80 ring-1 ring-[#3f9b78]/40 shadow-[0_14px_34px_rgba(0,0,0,0.5),0_0_28px_rgba(63,155,120,0.22)]'
                  : isMuted
                    ? 'border-white/10 opacity-45 scale-[0.985] pointer-events-none'
                    : 'border-white/10'
              }`}
            >
              {/* Product Image Frame matching approved Image 1 */}
              <div
                ref={(el) => {
                  picRefs.current[product.id] = el;
                }}
                className="relative aspect-[16/10] w-full rounded-[16px] bg-[#101014] overflow-hidden"
              >
                <span
                  ref={(el) => {
                    photoRefs.current[product.id] = el;
                  }}
                  className="block h-full w-full"
                >
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#71717A]">
                      <Monitor className="h-8 w-8" />
                    </div>
                  )}
                </span>

                {/* GSAP Glint Sweep across photo on lift */}
                <span
                  ref={(el) => {
                    glintRefs.current[product.id] = el;
                  }}
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-y-6 left-0 w-1/3 -skew-x-12"
                  style={{
                    transform: 'translateX(-120%)',
                    background:
                      'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.46) 50%, transparent 100%)',
                  }}
                />

                {/* Top-left Pitch Badge */}
                <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                  {product.pitch !== null ? `P${product.pitch}` : product.ipRating}
                </span>

                {/* Top-right Zoom & Compare Controls */}
                <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleCompare(product.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-xs transition-colors cursor-pointer ${
                      isCompared
                        ? 'border-[#38BDF8]/70 bg-[#38BDF8]/20 text-[#BAE6FD]'
                        : 'border-white/20 bg-black/55 text-white/90 hover:bg-black/75'
                    }`}
                  >
                    {isCompared ? <Check className="h-3 w-3" /> : <Scale className="h-3 w-3" />}
                    {t(lang, 'ui.compare')}
                  </button>

                  {primaryImage && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ src: primaryImage, title: product.name })}
                      aria-label={t(lang, 'ui.zoomImage')}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/90 backdrop-blur-xs hover:bg-black/75 transition-colors cursor-pointer"
                    >
                      <Expand className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clean Product Info Split (Title Left / Price Right) */}
              <div className="px-1.5 pt-3 pb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8E8E98] font-mono tabular-nums">
                    {product.sku} · {product.ipRating}
                  </p>
                  <h4 className="mt-0.5 text-[15px] font-bold text-white leading-snug truncate">
                    {product.name}{' '}
                    <span className="font-normal text-[#A1A1AA] text-xs">
                      · {product.brightnessNits} nits
                    </span>
                  </h4>
                  <p className="mt-0.5 text-xs text-[#9E9EA8] line-clamp-1">
                    {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
                  </p>
                </div>

                <div className="text-right shrink-0 pt-0.5">
                  <span
                    className={`text-xs font-bold tabular-nums whitespace-nowrap ${
                      demoShowPrices ? 'text-[#34D399] font-mono' : 'text-[#93C5FD]'
                    }`}
                  >
                    {getCardPriceLabel(product)}
                  </span>
                  <span className="block text-[10px] font-mono text-[#71717A] tabular-nums mt-0.5">
                    {product.tileWidthMm}×{product.tileHeightMm} mm
                  </span>
                </div>
              </div>

              {/* Animorio Capsule CTA Button */}
              <button
                type="button"
                onClick={() => handleSelectWithGsap(product)}
                onPointerEnter={() => handleHoverOn(product.id)}
                onPointerLeave={() => handleHoverOff(product.id)}
                onPointerDown={() => handlePressOn(product.id)}
                onPointerUp={() => handlePressOff(product.id)}
                onPointerCancel={() => handlePressOff(product.id)}
                className="relative block w-full cursor-pointer focus:outline-none"
              >
                <span
                  ref={(el) => {
                    btnBodyRefs.current[product.id] = el;
                  }}
                  className={`relative flex w-full h-[52px] rounded-full px-5 items-center justify-center overflow-visible transition-colors duration-300 ${
                    isSelectedThis
                      ? 'border border-[#3f9b78]/80 bg-gradient-to-b from-[#17352A] via-[#0F241D] to-[#0A1813] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_10px_28px_rgba(63,155,120,0.34)]'
                      : 'border border-white/15 bg-gradient-to-b from-[#2C2C33] via-[#1B1B20] to-[#101013] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(0,0,0,0.48)]'
                  }`}
                >
                  {/* Clipped inner sheen layer so outer badge is never cropped */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full overflow-hidden"
                  >
                    {/* Static diagonal glass highlight */}
                    <span
                      className="pointer-events-none absolute inset-0 opacity-35"
                      style={{
                        background:
                          'linear-gradient(115deg, transparent 58%, rgba(255,255,255,0.14) 68%, transparent 74%)',
                      }}
                    />

                    {/* Dynamic GSAP Sheen Sweep */}
                    <span
                      ref={(el) => {
                        sheenRefs.current[product.id] = el;
                      }}
                      className="pointer-events-none absolute -inset-y-2 left-0 w-1/3 -skew-x-12"
                      style={{
                        transform: 'translateX(-130%)',
                        background:
                          'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)',
                      }}
                    />
                  </span>

                  {/* Sliding Label Stack ("Sélectionner ce modèle" -> "✓ Produit sélectionné") */}
                  <span
                    aria-hidden="true"
                    className="relative z-10 h-6 w-full pr-9 overflow-hidden flex items-center justify-center"
                  >
                    <span
                      ref={(el) => {
                        addWordRefs.current[product.id] = el;
                      }}
                      className="absolute inset-0 flex items-center justify-center pr-9 text-[13.5px] font-semibold text-white whitespace-nowrap"
                    >
                      {lang === 'fr' ? 'Sélectionner ce modèle' : 'Add to bag'}
                    </span>

                    <span
                      ref={(el) => {
                        doneWordRefs.current[product.id] = el;
                      }}
                      className="absolute inset-0 flex items-center justify-center gap-1.5 pr-9 text-[13.5px] font-semibold text-[#A7F3D0] whitespace-nowrap"
                      style={{ transform: 'translateY(100%)', opacity: 0 }}
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth={2.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          ref={(el) => {
                            checkPathRefs.current[product.id] = el;
                          }}
                          pathLength={1}
                          strokeDasharray={1}
                          strokeDashoffset={1}
                          d="M3.2 8.6l3 3 6.6-7"
                        />
                      </svg>
                      <span>{lang === 'fr' ? 'Produit sélectionné' : 'Added to bag'}</span>
                    </span>
                  </span>

                  {/* Animorio Circular Bag Well with Handle Bounce & Rolling Digit Strip */}
                  <span
                    ref={(el) => {
                      wellRefs.current[product.id] = el;
                    }}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                      isSelectedThis
                        ? 'border-[#3f9b78]/80 bg-[#3f9b78]/25 text-[#A7F3D0]'
                        : 'border-white/15 bg-white/[0.07] text-white/90'
                    }`}
                  >
                    <svg
                      ref={(el) => {
                        bagRefs.current[product.id] = el;
                      }}
                      className="h-4 w-4 overflow-visible"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path
                        ref={(el) => {
                          handleRefs.current[product.id] = el;
                        }}
                        d="M8.6 9.2V7.4a3.4 3.4 0 0 1 6.8 0v1.8"
                      />
                      <path d="M5.4 8.6h13.2l-0.9 10.6a1.6 1.6 0 0 1-1.6 1.5H7.9a1.6 1.6 0 0 1-1.6-1.5z" />
                      <path d="M5.6 8.6h12.8" />
                    </svg>

                    {/* Rolling 0..9 Digit Counter Badge */}
                    <span
                      ref={(el) => {
                        countBadgeRefs.current[product.id] = el;
                      }}
                      style={{ transform: 'scale(0)', opacity: 0 }}
                      className="absolute -right-0.5 -top-0.5 z-20 flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full bg-[#3f9b78] ring-2 ring-[#101013] text-[10.5px] font-bold text-white shadow-[0_2px_8px_rgba(63,155,120,0.7)] tabular-nums"
                    >
                      <span
                        ref={(el) => {
                          digitsRefs.current[product.id] = el;
                        }}
                        className="flex flex-col items-center self-start leading-[18px]"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className="block h-[18px] leading-[18px]">
                            {n}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </article>
          );
        })}
      </div>

      {/* Product Comparator Modal */}
      {showComparator && comparedProducts.length >= 2 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl rounded-2xl border border-white/15 bg-[#17171A] text-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {lang === 'fr' ? 'Comparateur technique LED' : 'LED Technical Comparison'}
              </h3>
              <button
                type="button"
                onClick={() => setShowComparator(false)}
                className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4 text-xs font-medium text-[#A1A1AA]">
                      {lang === 'fr' ? 'Caractéristique' : 'Specification'}
                    </th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="py-3 px-3 font-semibold text-white">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-mono tabular-nums text-xs">
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">Pitch</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.pitch !== null ? `P${p.pitch}` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Distance conseillée' : 'Recommended distance'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.distance ?? '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Luminosité' : 'Brightness'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.brightnessNits} nits
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Fréquence' : 'Refresh rate'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.refreshRateHz} Hz
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Indice IP' : 'IP Rating'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.ipRating}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Poids / m²' : 'Weight / m²'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-white">
                        {p.weightKgPerSqm} kg
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans text-[#A1A1AA]">
                      {lang === 'fr' ? 'Tarif' : 'Pricing'}
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        className={`py-3 px-3 font-semibold ${
                          demoShowPrices ? 'font-mono text-[#34D399]' : 'font-sans text-[#93C5FD]'
                        }`}
                      >
                        {getCardPriceLabel(p)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4" />
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setShowComparator(false);
                            handleSelectWithGsap(p);
                          }}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] cursor-pointer whitespace-nowrap"
                        >
                          {t(lang, 'ui.selectProduct')}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl bg-[#17171A] overflow-hidden border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-lg p-1.5 text-[#A1A1AA] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[75vh] object-contain bg-[#0D0D10]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
