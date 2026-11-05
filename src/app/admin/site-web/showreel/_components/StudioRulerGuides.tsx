'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Ruler, Eye, EyeOff, X, Magnet } from 'lucide-react';

export interface CameraTransform {
  x: number;
  y: number;
  zoom: number;
  originX: number;
  originY: number;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  /**
   * Position exprimée en pourcentage (0 à 100%) de l'image / scène.
   * Ainsi, lorsque la caméra zoome ou translate (pan), le guide reste
   * STRICTEMENT calé sur l'élément de l'image (bâtiment, écran, etc.)
   * sans dériver ni se déplacer.
   */
  position: number;
}

interface StudioRulerGuidesProps {
  canvasRect: { left: number; top: number; width: number; height: number } | null;
  cam?: CameraTransform;
  zoom?: number;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  onGuidesChange?: (guides: Guide[]) => void;
}

const RULER_SIZE = 22; // Épaisseur des règles en px

/**
 * Convertit des coordonnées écran (clientX, clientY) en pourcentage (0..100)
 * dans l'espace de la scène / image en appliquant l'inverse de la transformation caméra.
 */
function screenToScenePercent(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  cam: CameraTransform
): { percentX: number; percentY: number } {
  const vx = clientX - rect.left;
  const vy = clientY - rect.top;

  const z = Math.max(0.001, cam.zoom || 1);
  const ox = (rect.width * (cam.originX ?? 50)) / 100;
  const oy = (rect.height * (cam.originY ?? 50)) / 100;
  const tx = (rect.width * (cam.x ?? 0)) / 100;
  const ty = (rect.height * (cam.y ?? 0)) / 100;

  // Calcul inverse de la transformation
  const sx = ox + (vx - tx - ox) / z;
  const sy = oy + (vy - ty - oy) / z;

  return {
    percentX: Math.max(0, Math.min(100, (sx / rect.width) * 100)),
    percentY: Math.max(0, Math.min(100, (sy / rect.height) * 100)),
  };
}

/**
 * Calcule les graduations de la règle synchronisées avec l'espace de la scène.
 */
function generateSceneTicks(
  length: number,
  originPercent: number,
  translatePercent: number,
  zoom: number
): { pos: number; label: string; major: boolean }[] {
  const ticks: { pos: number; label: string; major: boolean }[] = [];
  const z = Math.max(0.001, zoom || 1);
  const o = (length * (originPercent ?? 50)) / 100;
  const t = (length * (translatePercent ?? 0)) / 100;

  // Déterminer le pas selon le zoom pour ne pas encombrer
  let step = 50;
  if (z > 2.5) step = 20;
  else if (z < 0.6) step = 100;

  const count = Math.ceil(length / (step / 5));
  for (let i = 0; i <= count * 2; i++) {
    const sceneVal = (i * step) / 5;
    if (sceneVal > length) break;
    // Projection à l'écran
    const screenPos = o + (sceneVal - o) * z + t;
    if (screenPos >= 0 && screenPos <= length) {
      const isMajor = i % 5 === 0;
      ticks.push({
        pos: screenPos,
        label: isMajor ? String(Math.round(sceneVal)) : '',
        major: isMajor,
      });
    }
  }
  return ticks;
}

export const StudioRulerGuides: React.FC<StudioRulerGuidesProps> = ({
  canvasRect,
  cam = { x: 0, y: 0, zoom: 1, originX: 50, originY: 50 },
  snapEnabled = true,
  onToggleSnap,
  onGuidesChange,
}) => {
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const nextId = useRef(1);

  const camTransform = cam || { x: 0, y: 0, zoom: 1, originX: 50, originY: 50 };

  const notifyChange = (newGuides: Guide[]) => {
    setGuides(newGuides);
    onGuidesChange?.(newGuides);
  };

  const addGuide = useCallback(
    (orientation: 'horizontal' | 'vertical', posPercent: number) => {
      const id = `guide_${nextId.current++}`;
      const newGuide: Guide = { id, orientation, position: Number(posPercent.toFixed(2)) };
      const updated = [...guides, newGuide];
      notifyChange(updated);
      return id;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guides]
  );

  const removeGuide = useCallback(
    (id: string) => {
      const updated = guides.filter((g) => g.id !== id);
      notifyChange(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guides]
  );

  const clearAllGuides = useCallback(() => {
    notifyChange([]);
  }, []);

  // Drag depuis la règle horizontale pour créer un guide ancré sur l'image
  const handleHorizontalRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRect) return;
      e.preventDefault();
      e.stopPropagation();

      const { percentY } = screenToScenePercent(e.clientX, e.clientY, canvasRect, camTransform);
      const id = addGuide('horizontal', percentY);
      setActiveGuideId(id);

      const onMouseMove = (ev: MouseEvent) => {
        const coords = screenToScenePercent(ev.clientX, ev.clientY, canvasRect, camTransform);
        setGuides((prev) =>
          prev.map((g) => (g.id === id ? { ...g, position: Number(coords.percentY.toFixed(2)) } : g))
        );
      };

      const onMouseUp = () => {
        setActiveGuideId(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [canvasRect, camTransform, addGuide]
  );

  // Drag depuis la règle verticale pour créer un guide vertical ancré sur l'image
  const handleVerticalRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRect) return;
      e.preventDefault();
      e.stopPropagation();

      const { percentX } = screenToScenePercent(e.clientX, e.clientY, canvasRect, camTransform);
      const id = addGuide('vertical', percentX);
      setActiveGuideId(id);

      const onMouseMove = (ev: MouseEvent) => {
        const coords = screenToScenePercent(ev.clientX, ev.clientY, canvasRect, camTransform);
        setGuides((prev) =>
          prev.map((g) => (g.id === id ? { ...g, position: Number(coords.percentX.toFixed(2)) } : g))
        );
      };

      const onMouseUp = () => {
        setActiveGuideId(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [canvasRect, camTransform, addGuide]
  );

  // Déplacement d'un guide existant (ancré sur l'image)
  const handleGuideDragStart = useCallback(
    (e: React.MouseEvent, guide: Guide) => {
      if (!canvasRect) return;
      e.preventDefault();
      e.stopPropagation();
      setActiveGuideId(guide.id);

      const onMouseMove = (ev: MouseEvent) => {
        const coords = screenToScenePercent(ev.clientX, ev.clientY, canvasRect, camTransform);
        if (guide.orientation === 'vertical') {
          setGuides((prev) =>
            prev.map((g) => (g.id === guide.id ? { ...g, position: Number(coords.percentX.toFixed(2)) } : g))
          );
        } else {
          setGuides((prev) =>
            prev.map((g) => (g.id === guide.id ? { ...g, position: Number(coords.percentY.toFixed(2)) } : g))
          );
        }
      };

      const onMouseUp = () => {
        setActiveGuideId(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [canvasRect, camTransform]
  );

  const hTicks = canvasRect
    ? generateSceneTicks(
        canvasRect.width,
        camTransform.originX ?? 50,
        camTransform.x ?? 0,
        camTransform.zoom ?? 1
      )
    : [];

  const vTicks = canvasRect
    ? generateSceneTicks(
        canvasRect.height,
        camTransform.originY ?? 50,
        camTransform.y ?? 0,
        camTransform.zoom ?? 1
      )
    : [];

  return (
    <>
      {/* Barre d'outils des règles et repères */}
      <div className="flex items-center gap-1.5 bg-[#121211]/95 px-2.5 py-1.5 rounded-lg border border-[#262624] shadow-md select-none">
        <button
          type="button"
          onClick={() => setShowRulers((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
            showRulers
              ? 'bg-[#C3F910]/20 text-[#C3F910] border border-[#C3F910]/40'
              : 'text-[#888] hover:text-[#EDEBE6] hover:bg-[#1a1a18]'
          }`}
          title="Afficher/Masquer les règles graduées"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>RÈGLES</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGuides((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
            showGuides
              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
              : 'text-[#888] hover:text-[#EDEBE6] hover:bg-[#1a1a18]'
          }`}
          title="Afficher/Masquer les repères (guides)"
        >
          {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>GUIDES {guides.length > 0 ? `(${guides.length})` : ''}</span>
        </button>

        {onToggleSnap && (
          <button
            type="button"
            onClick={onToggleSnap}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
              snapEnabled
                ? 'bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/40'
                : 'text-[#888] hover:text-[#EDEBE6] hover:bg-[#1a1a18]'
            }`}
            title="Activer/Désactiver le magnétisme sur les repères"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>SNAP</span>
          </button>
        )}

        {guides.length > 0 && (
          <button
            type="button"
            onClick={clearAllGuides}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-xs font-mono text-[#777] hover:text-[#ff4444] hover:bg-[#201010] transition-colors cursor-pointer"
            title="Effacer tous les repères"
          >
            <X className="w-3.5 h-3.5" />
            <span>EFFACER</span>
          </button>
        )}
      </div>

      {/* Règles et guides superposés sur le canvas */}
      {canvasRect && (
        <>
          {showRulers && (
            <>
              {/* Coin supérieur gauche (intersection) */}
              <div
                style={{
                  position: 'fixed',
                  left: canvasRect.left - RULER_SIZE,
                  top: canvasRect.top - RULER_SIZE,
                  width: RULER_SIZE,
                  height: RULER_SIZE,
                  backgroundColor: '#0c0c0b',
                  border: '1px solid #2a2a28',
                  zIndex: 120,
                  pointerEvents: 'none',
                }}
              />

              {/* Règle Horizontale (haut) */}
              <div
                style={{
                  position: 'fixed',
                  left: canvasRect.left,
                  top: canvasRect.top - RULER_SIZE,
                  width: canvasRect.width,
                  height: RULER_SIZE,
                  backgroundColor: '#0e0e0d',
                  borderBottom: '1px solid #2a2a28',
                  borderTop: '1px solid #2a2a28',
                  zIndex: 110,
                  cursor: 'row-resize',
                  userSelect: 'none',
                  overflow: 'hidden',
                }}
                onMouseDown={handleHorizontalRulerMouseDown}
                title="Cliquer et glisser vers le bas pour créer un repère horizontal"
              >
                <svg width="100%" height={RULER_SIZE}>
                  {hTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={t.pos}
                        y1={t.major ? 4 : 12}
                        x2={t.pos}
                        y2={RULER_SIZE}
                        stroke={t.major ? '#6a6a66' : '#333330'}
                        strokeWidth="1"
                      />
                      {t.major && t.label && (
                        <text
                          x={t.pos + 3}
                          y={11}
                          fill="#888882"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {t.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Règle Verticale (gauche) */}
              <div
                style={{
                  position: 'fixed',
                  left: canvasRect.left - RULER_SIZE,
                  top: canvasRect.top,
                  width: RULER_SIZE,
                  height: canvasRect.height,
                  backgroundColor: '#0e0e0d',
                  borderRight: '1px solid #2a2a28',
                  borderLeft: '1px solid #2a2a28',
                  zIndex: 110,
                  cursor: 'col-resize',
                  userSelect: 'none',
                  overflow: 'hidden',
                }}
                onMouseDown={handleVerticalRulerMouseDown}
                title="Cliquer et glisser vers la droite pour créer un repère vertical"
              >
                <svg width={RULER_SIZE} height="100%">
                  {vTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={t.major ? 4 : 12}
                        y1={t.pos}
                        x2={RULER_SIZE}
                        y2={t.pos}
                        stroke={t.major ? '#6a6a66' : '#333330'}
                        strokeWidth="1"
                      />
                      {t.major && t.label && (
                        <text
                          x={2}
                          y={t.pos + 9}
                          fill="#888882"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {t.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            </>
          )}

          {/* Affichage des repères (Guides) : Ancrés sur l'image et synchronisés avec la caméra */}
          {showGuides && (
            <div
              style={{
                position: 'fixed',
                left: canvasRect.left,
                top: canvasRect.top,
                width: canvasRect.width,
                height: canvasRect.height,
                pointerEvents: 'none',
                zIndex: 115,
                overflow: 'hidden',
              }}
            >
              {/* Conteneur avec la même matrice de transformation que la scène de la caméra */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translate3d(${(camTransform.x ?? 0).toFixed(3)}%, ${(camTransform.y ?? 0).toFixed(3)}%, 0) scale(${(camTransform.zoom ?? 1).toFixed(4)})`,
                  transformOrigin: `${(camTransform.originX ?? 50).toFixed(2)}% ${(camTransform.originY ?? 50).toFixed(2)}%`,
                  pointerEvents: 'none',
                }}
              >
                {guides.map((guide) => {
                  const isHorizontal = guide.orientation === 'horizontal';
                  const z = Math.max(0.2, camTransform.zoom ?? 1);
                  const invZ = 1 / z;
                  const isActive = activeGuideId === guide.id;

                  if (isHorizontal) {
                    return (
                      <div
                        key={guide.id}
                        style={{
                          position: 'absolute',
                          top: `${guide.position}%`,
                          left: '-200%',
                          right: '-200%',
                          height: Math.max(1, 1.25 * invZ),
                          backgroundColor: isActive ? '#00FFFF' : '#00A3FF',
                          boxShadow: isActive ? '0 0 8px rgba(0,255,255,0.9)' : '0 0 4px rgba(0,163,255,0.6)',
                          cursor: 'row-resize',
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => handleGuideDragStart(e, guide)}
                        onDoubleClick={() => removeGuide(guide.id)}
                        title={`Repère horizontal à ${guide.position.toFixed(1)}% de l'image (Double-clic pour supprimer)`}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 2 * invZ,
                            left: `${200 + 4}%`,
                            transform: `scale(${invZ})`,
                            transformOrigin: 'top left',
                            backgroundColor: '#00A3FF',
                            color: '#080808',
                            fontFamily: 'monospace',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Y: {Math.round(guide.position * (canvasRect.height / 100))}px ({guide.position.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={guide.id}
                        style={{
                          position: 'absolute',
                          left: `${guide.position}%`,
                          top: '-200%',
                          bottom: '-200%',
                          width: Math.max(1, 1.25 * invZ),
                          backgroundColor: isActive ? '#00FFFF' : '#00A3FF',
                          boxShadow: isActive ? '0 0 8px rgba(0,255,255,0.9)' : '0 0 4px rgba(0,163,255,0.6)',
                          cursor: 'col-resize',
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => handleGuideDragStart(e, guide)}
                        onDoubleClick={() => removeGuide(guide.id)}
                        title={`Repère vertical à ${guide.position.toFixed(1)}% de l'image (Double-clic pour supprimer)`}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 2 * invZ,
                            top: `${200 + 4}%`,
                            transform: `scale(${invZ})`,
                            transformOrigin: 'top left',
                            backgroundColor: '#00A3FF',
                            color: '#080808',
                            fontFamily: 'monospace',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          X: {Math.round(guide.position * (canvasRect.width / 100))}px ({guide.position.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
