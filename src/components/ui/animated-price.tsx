"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface AnimatedPriceProps {
  value: number;
  currency: string;
  suffix: string;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const DURATION = 0.6;
const STAGGER = 0.06;

type DigitSlot = {
  type: "digit";
  key: string;
  position: number;
  digit: number;
  /** Espace de milliers placé juste après ce chiffre dans la chaîne formatée. */
  groupSpace: string;
};

type TextSlot = { type: "text"; key: string; text: string };
type PriceSlot = DigitSlot | TextSlot;

function isDigit(character: string): boolean {
  return /[0-9]/.test(character);
}

function isGroupSpace(character: string): boolean {
  return character === "\u202f" || character === "\u00a0" || character === " ";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFullPrice(value: number, currency: string, suffix: string): string {
  return `${formatNumber(value)}\u202f${currency}${suffix ? ` ${suffix}` : ""}`;
}

/**
 * Parcourt la chaîne déjà formatée par Intl, caractère par caractère, sans jamais
 * réordonner ni réindexer. La clé d'une colonne est sa position depuis la droite
 * en comptant uniquement les chiffres : 0 = dernier centime, 1 = dixième,
 * 2 = unité, puis dizaine, centaine, millier...
 */
function buildSlots(value: number, currency: string, suffix: string): PriceSlot[] {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formattedNumber = formatNumber(safeValue);
  const characters = Array.from(formattedNumber);
  const totalDigits = characters.filter(isDigit).length;
  const slots: PriceSlot[] = [];

  let digitIndexFromLeft = 0;
  let pendingSpace = "";
  let textIndex = 0;
  let previousDigit: DigitSlot | null = null;

  for (const character of characters) {
    if (isDigit(character)) {
      // L'espace de milliers précède le chiffre suivant : il appartient donc au
      // chiffre précédent, qui disparaît avec lui si le groupechange de taille.
      if (pendingSpace) {
        if (previousDigit) {
          previousDigit.groupSpace += pendingSpace;
        } else {
          slots.push({ type: "text", key: `space-${textIndex++}`, text: pendingSpace });
        }
        pendingSpace = "";
      }

      const position = totalDigits - 1 - digitIndexFromLeft;
      digitIndexFromLeft += 1;

      const digitSlot: DigitSlot = {
        type: "digit",
        key: `digit-${position}`,
        position,
        digit: Number(character),
        groupSpace: "",
      };
      slots.push(digitSlot);
      previousDigit = digitSlot;
      continue;
    }

    if (isGroupSpace(character)) {
      pendingSpace += character;
      continue;
    }

    // Virgule, signe moins, ou tout autre caractère fixe : on le pousse tel quel.
    if (pendingSpace) {
      slots.push({ type: "text", key: `space-${textIndex++}`, text: pendingSpace });
      pendingSpace = "";
    }
    slots.push({ type: "text", key: `text-${textIndex++}`, text: character });
  }

  if (pendingSpace) {
    slots.push({ type: "text", key: `space-${textIndex++}`, text: pendingSpace });
  }

  // L'espace avant € et le suffixe HT restent fixes, hors de la chaîne numérique.
  slots.push({
    type: "text",
    key: "currency-suffix",
    text: `\u202f${currency}${suffix ? ` ${suffix}` : ""}`,
  });

  return slots;
}

/**
 * Prix « compteur kilométrique » : chaque chiffre est une fenêtre d'une ligne
 * contenant une colonne 0-9. Seuls les chiffres bougent ; la ponctuation et les
 * espaces de milliers sont rendus dans l'ordre exact de la chaîne Intl.
 */
export function AnimatedPrice({ value, currency, suffix }: AnimatedPriceProps) {
  const reduce = Boolean(useReducedMotion());
  const fullText = formatFullPrice(value, currency, suffix);
  const slots = buildSlots(value, currency, suffix);

  const transitionFor = (position: number) =>
    reduce
      ? { duration: 0 }
      : { duration: DURATION, ease: EASE, delay: position * STAGGER };

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {fullText}
      </span>

      <span
        data-animated-price=""
        aria-hidden="true"
        className="inline-flex items-end whitespace-nowrap align-baseline"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <AnimatePresence initial={false}>
          {slots.map((slot) => {
            if (slot.type === "text") {
              return (
                <span
                  key={slot.key}
                  style={{ whiteSpace: "pre", height: "1.2em", lineHeight: 1.2 }}
                >
                  {slot.text}
                </span>
              );
            }

            const transition = transitionFor(slot.position);

            return (
              <motion.span
                key={slot.key}
                data-digit-position={slot.position}
                data-digit-value={slot.digit}
                className="inline-flex items-end overflow-hidden align-baseline"
                style={{ height: "1.2em", lineHeight: 1.2, whiteSpace: "nowrap" }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={transition}
              >
                <span
                  data-digit-window=""
                  className="relative block overflow-hidden"
                  style={{ width: "1ch", height: "1.2em", lineHeight: 1.2 }}
                >
                  <motion.span
                    className="flex w-full flex-col"
                    style={{ willChange: "transform" }}
                    initial={{ y: "0%" }}
                    animate={{ y: `${-slot.digit * 10}%` }}
                    exit={{ y: "0%" }}
                    transition={transition}
                  >
                    {DIGITS.map((digit) => (
                      <span
                        key={digit}
                        className="flex w-full items-center justify-center"
                        style={{ height: "1.2em", lineHeight: 1.2 }}
                      >
                        {digit}
                      </span>
                    ))}
                  </motion.span>
                </span>

                {slot.groupSpace ? (
                  <span style={{ whiteSpace: "pre", height: "1.2em", lineHeight: 1.2 }}>
                    {slot.groupSpace}
                  </span>
                ) : null}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </>
  );
}

export default AnimatedPrice;
