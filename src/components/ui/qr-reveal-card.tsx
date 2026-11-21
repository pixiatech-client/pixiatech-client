"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, QrCode, X } from "lucide-react";
import LiquidLoader from "@/components/LiquidLoader";

export interface QrRevealCardProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** URL ou data URL du VRAI QR code généré depuis `url` (Lien à encoder). */
  qrDataUrl: string;
  /** Lien produit brut, encodé dans le QR code et affiché sous celui-ci. */
  url: string;
  /** Libellé accessible du bouton (ex. « Afficher le QR code »). */
  label: string;
  title: string;
  hint: string;
  closeLabel: string;
}

const LAYOUT_ID = "product-qr-reveal";
const SCAN_DELAY = 0.9;
const SCAN_TIME = 2;

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.getClientRects().length > 0);
}

/**
 * Bouton « QR Code » qui s'ouvre en carte, d'après le motif Animorio
 * « Get the app button that reveals a QR code ». Le QR affiché est l'image réelle
 * transmise par la fiche produit : aucun module n'est redessiné ni animé séparément.
 */
export function QrRevealCard({
  open,
  onOpen,
  onClose,
  qrDataUrl,
  url,
  label,
  title,
  hint,
  closeLabel,
}: QrRevealCardProps) {
  const reduce = Boolean(useReducedMotion());
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const morphTransition = reduce
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 380, damping: 24, mass: 0.78 } as const);

  const rowVariants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : {
            delay: 0.14 + index * 0.06,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
          },
    }),
    exit: {
      opacity: 0,
      y: reduce ? 0 : -4,
      transition: reduce ? { duration: 0 } : { duration: 0.16 },
    },
  };

  const qrBoxStyle = {
    "--qr": "180px",
    width: "var(--qr)",
    height: "var(--qr)",
  } as React.CSSProperties;

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(
      () => (closeRef.current ?? cardRef.current)?.focus({ preventScroll: true }),
      reduce ? 0 : 220
    );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable(cardRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      (triggerRef.current ?? previouslyFocused)?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, reduce]);

  return (
    <LayoutGroup id={LAYOUT_ID}>
      <span className="block w-full justify-self-stretch">
        {open ? (
          <span
            aria-hidden="true"
            className="pointer-events-none block min-h-[48px] w-full rounded-xl"
            style={{ borderRadius: 12 }}
          />
        ) : (
          <motion.button
            ref={triggerRef}
            layoutId={LAYOUT_ID}
            type="button"
            onClick={onOpen}
            aria-label={label}
            title={label}
            aria-expanded={false}
            aria-controls="product-qr-reveal-card"
            whileHover={reduce ? undefined : { scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={morphTransition}
            initial={{ borderRadius: 12 }}
            animate={{ borderRadius: 12 }}
            style={{ borderRadius: 12 }}
            onAnimationComplete={() => {
              if (triggerRef.current) {
                triggerRef.current.style.borderRadius = "12px";
              }
            }}
            className="group relative flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#0f172a] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[color:var(--ui-accent,#C3F910)] text-[13px] text-center"
          >
            <QrCode className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="whitespace-nowrap text-[13px] font-semibold tracking-normal">
              QR Code
            </span>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 opacity-55 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </motion.button>
        )}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            key="qr-backdrop"
            aria-hidden="true"
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24 }}
            onClick={onClose}
          />
        )}

        {open && (
          <motion.div
            key="qr-card-layer"
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.div
              ref={cardRef}
              layoutId={LAYOUT_ID}
              id="product-qr-reveal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-qr-reveal-title"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              transition={morphTransition}
              initial={{ borderRadius: 12 }}
              animate={{ borderRadius: 18 }}
              exit={{ borderRadius: 12 }}
              className="pointer-events-auto flex w-[min(272px,calc(100vw-32px))] flex-col gap-3 overflow-visible bg-white p-4 shadow-2xl focus:outline-none"
              style={{
                borderRadius: 18,
                height: "min(352px, calc(100dvh - 32px))",
                boxShadow:
                  "0 24px 48px -18px rgba(10,10,12,0.28), 0 2px 6px rgba(10,10,12,0.08)",
              }}
            >
              <motion.div
                custom={0}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex items-center gap-2.5"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gray-900"
                  style={{ color: "var(--ui-accent, #C3F910)" }}
                  aria-hidden="true"
                >
                  <QrCode className="h-[19px] w-[19px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    id="product-qr-reveal-title"
                    className="block truncate text-[15px] font-bold leading-tight tracking-tight text-neutral-900"
                  >
                    {title}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-neutral-500">
                    {label}
                  </span>
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-accent,#C3F910)]"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </motion.div>

              <motion.div
                custom={1}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative mx-auto grid shrink-0 place-items-center overflow-visible rounded-lg bg-white"
                style={qrBoxStyle}
              >
                {qrDataUrl ? (
                  <>
                    <motion.img
                      src={qrDataUrl}
                      alt="QR code pour accéder au contenu du produit"
                      draggable={false}
                      className="block select-none"
                      style={{
                        width: "var(--qr)",
                        height: "var(--qr)",
                        objectFit: "contain",
                      }}
                      initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : {
                              delay: 0.22,
                              duration: 0.55,
                              ease: [0.34, 1.56, 0.64, 1] as const,
                            }
                      }
                    />

                    <motion.span
                      data-scan=""
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-1 top-0 h-[22%]"
                      style={{
                        borderBottom: "2px solid var(--ui-accent, #C3F910)",
                        background:
                          "linear-gradient(to bottom, rgba(var(--ui-accent-rgb, 195, 249, 16), 0), rgba(var(--ui-accent-rgb, 195, 249, 16), 0.14))",
                      }}
                      initial={{ opacity: 0, y: "-30%" }}
                      animate={
                        reduce
                          ? { opacity: 0, y: "-30%" }
                          : {
                              opacity: [0, 1, 1, 1, 0],
                              y: ["-30%", "80%", "-30%", "80%", "80%"],
                            }
                      }
                      transition={
                        reduce
                          ? { duration: 0 }
                          : {
                              delay: SCAN_DELAY,
                              duration: SCAN_TIME,
                              times: [0, 0.02, 0.5, 0.96, 1],
                              ease: "easeInOut",
                            }
                      }
                    />

                    <motion.svg
                      data-frame=""
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute inset-0 h-full w-full fill-none"
                      style={{ color: "var(--ui-accent, #C3F910)", strokeWidth: 1.6 }}
                      stroke="currentColor"
                      strokeLinecap="round"
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={
                        reduce
                          ? { opacity: 1, scale: 1 }
                          : { opacity: [0, 1, 1, 0.8, 0], scale: [1.06, 1, 1, 0.98, 1] }
                      }
                      transition={
                        reduce
                          ? { duration: 0 }
                          : {
                              delay: SCAN_DELAY,
                              duration: SCAN_TIME,
                              times: [0, 0.02, 0.5, 0.96, 1],
                              ease: "easeInOut",
                            }
                      }
                    >
                      <path d="M2 16V6a4 4 0 0 1 4-4h10M84 2h10a4 4 0 0 1 4 4v10M98 84v10a4 4 0 0 1-4 4H84M16 98H6a4 4 0 0 1-4-4V84" />
                    </motion.svg>
                  </>
                ) : (
                  <span className="absolute inset-0 grid place-items-center">
                    <LiquidLoader size={24} />
                  </span>
                )}
              </motion.div>

              <motion.div
                custom={2}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex min-h-0 flex-col items-center gap-1.5 text-center"
              >
                <motion.p
                  className="text-[13px] font-semibold leading-snug text-neutral-800"
                  animate={reduce ? undefined : { opacity: [1, 0.75, 1], y: [0, -3, 0] }}
                  transition={
                    reduce ? undefined : { delay: SCAN_DELAY + SCAN_TIME * 0.9, duration: 0.5 }
                  }
                >
                  {hint}
                </motion.p>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-full truncate px-2 text-[11px] font-medium text-neutral-600 underline decoration-[color:var(--ui-accent,#C3F910)] underline-offset-2 transition-colors hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-accent,#C3F910)]"
                  >
                    {url}
                  </a>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

export default QrRevealCard;
