'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { SectionResizeHandle } from './SectionResizeHandle';

interface EditableWrapperProps {
  sectionKey: string;
  sectionLabel: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  sectionKey,
  sectionLabel,
  children,
  className = '',
  style,
}) => {
  const {
    isEditing,
    selectedBlockId,
    setSelectedBlockId,
    setActiveTab,
    currentPageData,
    toggleSectionVisibility,
  } = useCms();

  const [isHovered, setIsHovered] = useState(false);
  const [liveMinHeight, setLiveMinHeight] = useState<number | null>(null);
  const [livePaddingBottom, setLivePaddingBottom] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sectionData = currentPageData?.sections?.[sectionKey] as Record<string, unknown> | undefined;
  const layout = (sectionData?.layout as Record<string, unknown> | undefined) || {};

  const pTop =
    sectionData?.paddingTop !== undefined
      ? Number(sectionData.paddingTop)
      : layout.paddingTop !== undefined
      ? Number(layout.paddingTop)
      : undefined;

  const pBottom =
    sectionData?.paddingBottom !== undefined
      ? Number(sectionData.paddingBottom)
      : layout.paddingBottom !== undefined
      ? Number(layout.paddingBottom)
      : undefined;

  const pLeft =
    sectionData?.paddingLeft !== undefined
      ? Number(sectionData.paddingLeft)
      : layout.paddingLeft !== undefined
      ? Number(layout.paddingLeft)
      : undefined;

  const pRight =
    sectionData?.paddingRight !== undefined
      ? Number(sectionData.paddingRight)
      : layout.paddingRight !== undefined
      ? Number(layout.paddingRight)
      : undefined;

  const savedMinHeight =
    sectionData?.minHeight !== undefined && Number(sectionData.minHeight) > 0
      ? Number(sectionData.minHeight)
      : layout.minHeight !== undefined && Number(layout.minHeight) > 0
      ? Number(layout.minHeight)
      : undefined;

  const isVisible =
    sectionData?.visible !== false &&
    layout.visible !== false;

  const isSelected = selectedBlockId === sectionKey;

  // Dynamically apply CMS spacing and height directly to the inner <section> element
  useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const sec = (root.querySelector(':scope > section') || root.querySelector('section')) as HTMLElement | null;
    if (!sec) return;

    if (pTop !== undefined) {
      sec.style.paddingTop = `${pTop}px`;
    }
    const effPb = livePaddingBottom !== null ? livePaddingBottom : pBottom;
    if (effPb !== undefined) {
      sec.style.paddingBottom = `${effPb}px`;
    }
    if (pLeft !== undefined) {
      sec.style.paddingLeft = `${pLeft}px`;
    }
    if (pRight !== undefined) {
      sec.style.paddingRight = `${pRight}px`;
    }
    const effMinH = liveMinHeight !== null ? liveMinHeight : savedMinHeight;
    if (effMinH !== undefined && effMinH > 0) {
      sec.style.minHeight = `${effMinH}px`;
    } else if (effMinH === 0) {
      sec.style.minHeight = '';
    }
  }, [pTop, pBottom, pLeft, pRight, savedMinHeight, livePaddingBottom, liveMinHeight]);

  // ── Mode public (visiteurs) ──
  if (!isEditing) {
    if (!isVisible) return null;

    const hasMinHeight = savedMinHeight !== undefined && savedMinHeight > 0;
    return (
      <div
        ref={wrapperRef}
        className={`${hasMinHeight ? '[&>section]:min-h-[inherit] [&>section]:flex-1 [&>section]:w-full ' : ''}${className}`}
        style={{
          ...style,
          minHeight: hasMinHeight ? `${savedMinHeight}px` : undefined,
          display: hasMinHeight ? 'flex' : undefined,
          flexDirection: hasMinHeight ? 'column' : undefined,
        }}
      >
        {children}
      </div>
    );
  }

  // ── Mode édition (administrateurs) ──
  const effectiveMinHeight = liveMinHeight ?? savedMinHeight;
  const hasMinHeight = effectiveMinHeight !== undefined && effectiveMinHeight > 0;

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setSelectedBlockId(sectionKey);
      }}
      className={`relative transition-[outline,opacity] duration-150 ${
        hasMinHeight ? '[&>section]:min-h-[inherit] [&>section]:flex-1 [&>section]:w-full ' : ''
      }${className}`}
      style={{
        ...style,
        minHeight: hasMinHeight ? `${effectiveMinHeight}px` : undefined,
        display: hasMinHeight ? 'flex' : undefined,
        flexDirection: hasMinHeight ? 'column' : undefined,
        zIndex: isSelected ? 40 : isHovered || liveMinHeight !== null ? 35 : 1,
        outline: isSelected
          ? '2px solid #C3F910'
          : isHovered
          ? '2px dashed rgba(195, 249, 16, 0.7)'
          : !isVisible
          ? '2px dashed rgba(255, 68, 68, 0.5)'
          : 'none',
        outlineOffset: '-2px',
      }}
    >
      {/* Section Action Bar (Top Center/Right) */}
      {(isHovered || isSelected || !isVisible) && (
        <div
          style={{ position: 'absolute', top: 8, right: 16, zIndex: 150, pointerEvents: 'auto' }}
          className="flex items-center gap-1 bg-[#0e0e0d]/95 backdrop-blur-md border border-[#C3F910] rounded-md p-1 shadow-2xl animate-in fade-in duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Section Label / Select */}
          <div
            className="px-2 py-1 text-[#C3F910] hover:text-white font-mono text-[11px] font-bold cursor-pointer transition-colors"
            onClick={() => {
              setSelectedBlockId(sectionKey);
              setActiveTab('content');
            }}
          >
            {sectionLabel.toUpperCase()}
          </div>

          {/* Visibility Eye Button 👁 */}
          <button
            type="button"
            onClick={() => toggleSectionVisibility(sectionKey)}
            className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              isVisible
                ? 'text-[#C3F910] hover:bg-[#C3F910]/20'
                : 'text-[#ff4444] bg-[#ff4444]/20 hover:bg-[#ff4444]/30'
            }`}
            title={isVisible ? 'Masquer cette section sur le site public' : 'Afficher cette section'}
          >
            {isVisible ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910]" />
                <Eye className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4444]" />
                <EyeOff className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Settings / Style Tab Button ⚙ */}
          <button
            type="button"
            onClick={() => {
              setSelectedBlockId(sectionKey);
              setActiveTab('style');
            }}
            className="p-1.5 text-[#9A9A94] hover:text-[#C3F910] hover:bg-[#1a1a17] rounded transition-colors cursor-pointer"
            title="Ouvrir les réglages de style et espacement"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ghost Mask Overlay if Section is Hidden */}
      {!isVisible && (
        <div className="absolute inset-0 bg-[#080808]/75 backdrop-blur-[3px] border-2 border-dashed border-[#ff4444]/60 z-[130] flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
          <div className="flex items-center gap-2 bg-[#171715] border border-[#ff4444] text-[#ff6666] px-4 py-2 rounded-lg font-mono text-xs font-bold shadow-2xl mb-3">
            <EyeOff className="w-4 h-4" />
            <span>SECTION MASQUÉE SUR LE SITE PUBLIC ({sectionLabel.toUpperCase()})</span>
          </div>
          <p className="text-[11px] text-[#9A9A94] max-w-md mb-3 font-sans">
            Cette section n&apos;est pas visible pour les visiteurs. Elle reste éditable et déplaçable dans l&apos;éditeur.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionVisibility(sectionKey);
            }}
            className="flex items-center gap-1.5 bg-[#C3F910] text-black px-4 py-2 rounded-md font-mono text-xs font-bold hover:bg-white transition-colors cursor-pointer shadow-xl"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>RÉAFFICHER LA SECTION</span>
          </button>
        </div>
      )}

      {/* Children Section */}
      <div className={!isVisible ? 'opacity-35 pointer-events-none' : undefined}>
        {children}
      </div>

      {/* Bottom Drag-to-Resize Handle ↕ */}
      {isVisible && (
        <SectionResizeHandle
          sectionKey={sectionKey}
          sectionLabel={sectionLabel}
          targetRef={wrapperRef}
          currentMinHeight={effectiveMinHeight}
          onLiveResize={(h, pb) => {
            setLiveMinHeight(h);
            setLivePaddingBottom(pb);
          }}
          onResizeEnd={(finalH, finalPb) => {
            setLiveMinHeight(finalH);
            setLivePaddingBottom(finalPb);
          }}
        />
      )}
    </div>
  );
};