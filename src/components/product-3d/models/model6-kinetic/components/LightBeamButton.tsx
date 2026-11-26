'use client';
import { ReactNode, useState } from 'react';
import { motion } from 'motion/react';

/**
 * LightBeamButton (inspiré d'Animorio Light Beam Button)
 * - Aucune lueur externe (zéro box-shadow diffus autour du bouton).
 * - Deux contours lumineux contrarotatifs qui parcourent la bordure SVG.
 * - Effet d'arc électrique net sur les deux contours au clic et au survol.
 *
 * Thème : ce composant lit automatiquement `var(--tessera-accent)` et
 * `var(--tessera-accent-light)` définies dans `src/index.css` (ou sur `:root`
 * dans votre application hôte).
 */
interface LightBeamButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function LightBeamButton({
  onClick,
  children,
  className = '',
}: LightBeamButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [sparkCount, setSparkCount] = useState(0);

  const triggerSpark = () => {
    setSparkCount((c) => c + 1);
  };

  return (
    <motion.button
      type="button"
      onPointerDown={triggerSpark}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.975 }}
      className={`group relative inline-flex items-center justify-center rounded-xl tessera-glass !shadow-none px-5 py-2.5 text-xs font-semibold text-[#F4F4F5] transition-colors cursor-pointer overflow-hidden whitespace-nowrap ${className}`}
    >
      {/* Contour statique discret sans aucune lueur externe */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl border border-white/15"
      />

      {/* Double contour lumineux animé en SVG (2 faisceaux opposés + impulsion électrique au clic) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Contour 1 : faisceau principal suivant la couleur du thème */}
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="11"
          ry="11"
          fill="none"
          pathLength={100}
          stroke="var(--tessera-accent, #E87A24)"
          strokeWidth={hovered ? 1.75 : 1.4}
          strokeLinecap="round"
          strokeDasharray="22 78"
          animate={{ strokeDashoffset: [0, -100] }}
          transition={{
            duration: hovered ? 1.8 : 3.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Contour 2 : second faisceau contrarotatif haute intensité */}
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="11"
          ry="11"
          fill="none"
          pathLength={100}
          stroke="var(--tessera-accent-light, #FFF3D6)"
          strokeWidth={hovered ? 1.45 : 1.15}
          strokeLinecap="round"
          strokeDasharray="14 86"
          animate={{ strokeDashoffset: [50, 150] }}
          transition={{
            duration: hovered ? 2.1 : 3.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Impulsion électrique double sur tout le périmètre au clic */}
        {sparkCount > 0 && (
          <>
            <motion.rect
              key={`spark-a-${sparkCount}`}
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="11"
              ry="11"
              fill="none"
              pathLength={100}
              stroke="#FFFFFF"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeDasharray="12 18 6 64"
              initial={{ strokeDashoffset: 0, opacity: 1 }}
              animate={{ strokeDashoffset: -100, opacity: 0 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            />
            <motion.rect
              key={`spark-b-${sparkCount}`}
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="11"
              ry="11"
              fill="none"
              pathLength={100}
              stroke="var(--tessera-accent, #E87A24)"
              strokeWidth={2.0}
              strokeLinecap="round"
              strokeDasharray="16 24 8 52"
              initial={{ strokeDashoffset: 50, opacity: 1 }}
              animate={{ strokeDashoffset: 150, opacity: 0 }}
              transition={{ duration: 0.46, ease: 'easeOut' }}
            />
          </>
        )}
      </svg>

      {/* Décharge électrique interne rapide au clic (sans déborder hors du bouton) */}
      {sparkCount > 0 && (
        <motion.span
          key={`flash-${sparkCount}`}
          aria-hidden="true"
          initial={{ opacity: 0.55, scaleX: 0.35 }}
          animate={{ opacity: 0, scaleX: 1.05 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(var(--tessera-accent-rgb, 232, 122, 36), 0.35) 50%, transparent 100%)',
          }}
        />
      )}

      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
