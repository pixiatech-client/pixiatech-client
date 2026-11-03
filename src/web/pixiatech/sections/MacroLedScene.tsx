'use client';

import React, { useMemo } from 'react';

export interface MacroLedSceneProps {
  className?: string;
  style?: React.CSSProperties;
  /** Opacité globale de la scène LED (0 à 1) */
  opacity?: number;
  /** Afficher la grille vectorielle des Cabinets 500mm (activée lors du zoom profond) */
  showCabinetGrid?: boolean;
  /** Mode d'inspection (optionnel : 'realistic' | 'grid' | 'thermal') */
  inspectorMode?: 'realistic' | 'grid' | 'thermal';
}

/**
 * SCÈNE VECTORIELLE MACRO-LED HAUTE PRÉCISION (SHOWREEL PIXIATECH)
 *
 * Architecture :
 * - 32 modules LED architecturaux (8 colonnes × 4 rangées > 21 modules requis)
 * - Substrat sombre mat obsidian (#040608) avec micro-particules et bus dorés
 * - Boîtiers métalliques sombres avec cavités optiques biseautées
 * - 3 diodes capsules RGB (Rouge, Vert, Bleu) par module avec émetteurs et halos lumineux
 * - 3 plots de contact dorés (wire bonding) par module
 * - Lignes de raccordement dorées en tirets entre les modules
 * - Cadrage central (Rangée 1, Colonnes 3 & 4) reproduisant fidèlement l'ancienne composition (IMAGE 2)
 */
export const MacroLedScene: React.FC<MacroLedSceneProps> = ({
  className,
  style,
  opacity = 1,
  showCabinetGrid = false,
  inspectorMode = 'realistic',
}) => {
  // ── Dimensions géométriques du canevas ───────────────────────────────────
  const VB_WIDTH = 2400;
  const VB_HEIGHT = 1350;

  const COLS = 8;
  const ROWS = 4;
  const W_MOD = 210;
  const H_MOD = 145;
  const GAP_X = 80;
  const GAP_Y = 75;

  const gridW = COLS * W_MOD + (COLS - 1) * GAP_X; // 2240
  const gridH = ROWS * H_MOD + (ROWS - 1) * GAP_Y; // 805
  const left0 = (VB_WIDTH - gridW) / 2; // 80
  const top0 = (VB_HEIGHT - gridH) / 2; // 272.5

  // ── Micro-particules d'ambiance ──────────────────────────────────────────
  const particles = useMemo(() => {
    const pts: { x: number; y: number; r: number; color: string; op: number }[] = [];
    const colors = ['#C5A059', '#38BDF8', '#C3F910', '#FFFFFF'];
    // 48 particules déterministes réparties esthétiquement
    for (let i = 0; i < 48; i++) {
      const seedX = (i * 73 + 17) % VB_WIDTH;
      const seedY = (i * 127 + 29) % VB_HEIGHT;
      const r = 0.8 + ((i * 13) % 15) / 10;
      const color = colors[i % colors.length];
      const op = 0.15 + ((i * 7) % 55) / 100;
      pts.push({ x: seedX, y: seedY, r, color, op });
    }
    return pts;
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity,
        backgroundColor: '#040608',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <defs>
          {/* ── Émetteur Diode Rouge ──────────────────────────────────── */}
          <radialGradient id="macroRedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="18%" stopColor="#FFA090" />
            <stop offset="42%" stopColor="#FF2818" />
            <stop offset="80%" stopColor="#B00800" />
            <stop offset="100%" stopColor="#4A0200" />
          </radialGradient>

          {/* ── Émetteur Diode Verte ─────────────────────────────────── */}
          <radialGradient id="macroGreenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="18%" stopColor="#B5FFD8" />
            <stop offset="42%" stopColor="#18FF68" />
            <stop offset="80%" stopColor="#0B983A" />
            <stop offset="100%" stopColor="#023D14" />
          </radialGradient>

          {/* ── Émetteur Diode Bleue ─────────────────────────────────── */}
          <radialGradient id="macroBlueGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="18%" stopColor="#C8E2FF" />
            <stop offset="42%" stopColor="#2588FF" />
            <stop offset="80%" stopColor="#0D48B5" />
            <stop offset="100%" stopColor="#021A58" />
          </radialGradient>

          {/* ── Halo thermique (mode thermal) ────────────────────────── */}
          <radialGradient id="thermalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#450A0A" />
          </radialGradient>

          {/* ── Filtre de Bloom Optique & Flou de Coeur ──────────────── */}
          <filter id="macroBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="macroCoreBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* Fond Substrat Noir Pur */}
        <rect width={VB_WIDTH} height={VB_HEIGHT} fill="#040608" />

        {/* Micro-particules d'ambiance cosmique / salle noire */}
        <g opacity="0.65">
          {particles.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={p.color}
              opacity={p.op}
            />
          ))}
        </g>

        {/* Circuits et Lignes de Bus Dorées (Traces Nanométriques) */}
        <g stroke="#C5A059" strokeWidth="2.5" opacity="0.32" fill="none">
          {/* Lignes horizontales principales */}
          <line x1="0" y1="180" x2={VB_WIDTH} y2="180" strokeDasharray="16 8" />
          <line x1="0" y1="420" x2={VB_WIDTH} y2="420" strokeDasharray="16 8" />
          <line x1="0" y1="680" x2={VB_WIDTH} y2="680" strokeDasharray="16 8" />
          <line x1="0" y1="940" x2={VB_WIDTH} y2="940" strokeDasharray="16 8" />
          <line x1="0" y1="1180" x2={VB_WIDTH} y2="1180" strokeDasharray="16 8" />

          {/* Traces verticales avec coudes à 45° */}
          <path d="M 220 0 L 220 220 L 260 260 L 260 1350" />
          <path d="M 800 0 L 800 480 L 840 520 L 840 1350" />
          <path d="M 1560 0 L 1560 480 L 1600 520 L 1600 1350" />
          <path d="M 2180 0 L 2180 220 L 2220 260 L 2220 1350" />
        </g>

        {/* Lignes d'alignement horizontales dorées en tirets entre les modules */}
        <g stroke="#C5A059" strokeWidth="3" strokeDasharray="14 10" opacity="0.65">
          {Array.from({ length: ROWS }).map((_, r) => {
            const midY = top0 + r * (H_MOD + GAP_Y) + H_MOD / 2;
            return Array.from({ length: COLS - 1 }).map((_, c) => {
              const x1 = left0 + c * (W_MOD + GAP_X) + W_MOD;
              const x2 = left0 + (c + 1) * (W_MOD + GAP_X);
              return <line key={`line-${r}-${c}`} x1={x1} y1={midY} x2={x2} y2={midY} />;
            });
          })}
        </g>

        {/* Grille de Cabinets 500mm (affichée lors de la dernière étape / zoom profond) */}
        {(showCabinetGrid || inspectorMode === 'grid') && (
          <g stroke="#C3F910" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.45" fill="none">
            <rect x={left0 - 20} y={top0 - 20} width={gridW + 40} height={gridH + 40} />
            <line x1={VB_WIDTH / 2} y1="0" x2={VB_WIDTH / 2} y2={VB_HEIGHT} />
            <line x1="0" y1={VB_HEIGHT / 2} x2={VB_WIDTH} y2={VB_HEIGHT / 2} />
          </g>
        )}

        {/* ── Matrice des 32 Modules LED (8 colonnes × 4 rangées) ───────── */}
        {Array.from({ length: ROWS }).map((_, r) => {
          const py = top0 + r * (H_MOD + GAP_Y);
          return Array.from({ length: COLS }).map((_, c) => {
            const px = left0 + c * (W_MOD + GAP_X);
            const isCenterPair = r === 1 && (c === 3 || c === 4);

            const redFill = inspectorMode === 'thermal' ? 'url(#thermalGlow)' : 'url(#macroRedGlow)';
            const greenFill = inspectorMode === 'thermal' ? 'url(#thermalGlow)' : 'url(#macroGreenGlow)';
            const blueFill = inspectorMode === 'thermal' ? 'url(#thermalGlow)' : 'url(#macroBlueGlow)';

            return (
              <g
                key={`mod-${r}-${c}`}
                id={`module-r${r}-c${c}`}
                filter="url(#macroBloom)"
              >
                {/* Boîtier Châssis Externe (Substrat Sombre Haute Densité) */}
                <rect
                  x={px}
                  y={py}
                  width={W_MOD}
                  height={H_MOD}
                  rx="14"
                  fill="#0A0D15"
                  stroke={isCenterPair ? '#28354D' : '#1C2433'}
                  strokeWidth="3"
                />
                {/* Biseau lumineux subtil intérieur */}
                <rect
                  x={px + 2}
                  y={py + 2}
                  width={W_MOD - 4}
                  height={H_MOD - 4}
                  rx="12"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />

                {/* Cavité Optique Biseautée (Chambre Noire Émettrice) */}
                <rect
                  x={px + 12}
                  y={py + 13}
                  width={W_MOD - 24}
                  height={H_MOD - 26}
                  rx="10"
                  fill="#030509"
                  stroke="#101520"
                  strokeWidth="2"
                />

                {/* 3 Plots de Connexion Dorés (Wire Bonding) au-dessus de chaque diode */}
                <circle cx={px + 41} cy={py + 23} r="3.5" fill="#D4AF37" stroke="#FFEAA0" strokeWidth="0.8" />
                <circle cx={px + 105} cy={py + 23} r="3.5" fill="#D4AF37" stroke="#FFEAA0" strokeWidth="0.8" />
                <circle cx={px + 169} cy={py + 23} r="3.5" fill="#D4AF37" stroke="#FFEAA0" strokeWidth="0.8" />

                {/* ── DIODE 1 : ROUGE (Gauche) ─────────────────────────── */}
                <g>
                  {/* Halo d'ambiance périphérique */}
                  <circle
                    cx={px + 41}
                    cy={py + 80}
                    r="24"
                    fill={inspectorMode === 'thermal' ? '#F59E0B' : '#FF2010'}
                    opacity="0.38"
                    filter="url(#macroCoreBlur)"
                  />
                  {/* Corps de capsule vertical */}
                  <rect
                    x={px + 23}
                    y={py + 34}
                    width="36"
                    height="92"
                    rx="18"
                    fill={redFill}
                  />
                  {/* Coeur émetteur spéculaire haute luminance */}
                  <ellipse
                    cx={px + 41}
                    cy={py + 80}
                    rx="11"
                    ry="17"
                    fill="#FFFFFF"
                    opacity="0.45"
                    filter="url(#macroCoreBlur)"
                  />
                </g>

                {/* ── DIODE 2 : VERTE (Centre) ─────────────────────────── */}
                <g>
                  {/* Halo d'ambiance périphérique */}
                  <circle
                    cx={px + 105}
                    cy={py + 80}
                    r="24"
                    fill={inspectorMode === 'thermal' ? '#F59E0B' : '#10F050'}
                    opacity="0.38"
                    filter="url(#macroCoreBlur)"
                  />
                  {/* Corps de capsule vertical */}
                  <rect
                    x={px + 87}
                    y={py + 34}
                    width="36"
                    height="92"
                    rx="18"
                    fill={greenFill}
                  />
                  {/* Coeur émetteur spéculaire haute luminance */}
                  <ellipse
                    cx={px + 105}
                    cy={py + 80}
                    rx="11"
                    ry="17"
                    fill="#FFFFFF"
                    opacity="0.45"
                    filter="url(#macroCoreBlur)"
                  />
                </g>

                {/* ── DIODE 3 : BLEUE (Droite) ─────────────────────────── */}
                <g>
                  {/* Halo d'ambiance périphérique */}
                  <circle
                    cx={px + 169}
                    cy={py + 80}
                    r="24"
                    fill={inspectorMode === 'thermal' ? '#F59E0B' : '#2080FF'}
                    opacity="0.38"
                    filter="url(#macroCoreBlur)"
                  />
                  {/* Corps de capsule vertical */}
                  <rect
                    x={px + 151}
                    y={py + 34}
                    width="36"
                    height="92"
                    rx="18"
                    fill={blueFill}
                  />
                  {/* Coeur émetteur spéculaire haute luminance */}
                  <ellipse
                    cx={px + 169}
                    cy={py + 80}
                    rx="11"
                    ry="17"
                    fill="#FFFFFF"
                    opacity="0.45"
                    filter="url(#macroCoreBlur)"
                  />
                </g>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};

