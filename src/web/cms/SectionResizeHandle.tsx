'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { MoveVertical } from 'lucide-react';

interface SectionResizeHandleProps {
  sectionKey: string;
  sectionLabel: string;
  targetRef: React.RefObject<HTMLDivElement | null>;
  currentMinHeight?: number;
  onLiveResize?: (height: number, paddingBottom: number) => void;
  onResizeEnd?: (finalHeight: number, finalPaddingBottom: number) => void;
}

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 2000;

export const SectionResizeHandle: React.FC<SectionResizeHandleProps> = ({
  sectionKey,
  sectionLabel,
  targetRef,
  currentMinHeight,
  onLiveResize,
  onResizeEnd,
}) => {
  const { isEditing, selectedBlockId, setSelectedBlockId, setActiveTab, updateSectionField, saveCurrentPage } =
    useCms();

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draftHeight, setDraftHeight] = useState<number | null>(null);
  const [deltaY, setDeltaY] = useState<number>(0);

  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const startPaddingBottomRef = useRef<number>(0);

  const isSelected = selectedBlockId === sectionKey;

  // Cleanup on unmount if dragging
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Select section in CMS
      setSelectedBlockId(sectionKey);

      // Measure current DOM rendered height & current padding
      const sec = targetRef.current?.querySelector('section') || targetRef.current;
      const currentRect = targetRef.current?.getBoundingClientRect();
      const initialHeight = currentRect?.height
        ? Math.round(currentRect.height)
        : currentMinHeight && currentMinHeight > 0
        ? currentMinHeight
        : 600;

      const currentPaddingBottom = sec ? parseFloat(window.getComputedStyle(sec).paddingBottom) || 0 : 0;

      startYRef.current = e.clientY;
      startHeightRef.current = initialHeight;
      startPaddingBottomRef.current = Math.round(currentPaddingBottom);

      setIsDragging(true);
      setDraftHeight(initialHeight);
      setDeltaY(0);

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        const diff = moveEvent.clientY - startYRef.current;
        const rawNewHeight = startHeightRef.current + diff;
        const clampedHeight = Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, rawNewHeight)));
        const newPaddingBottom = Math.max(0, Math.round(startPaddingBottomRef.current + diff));

        setDeltaY(diff);
        setDraftHeight(clampedHeight);
        if (onLiveResize) {
          onLiveResize(clampedHeight, newPaddingBottom);
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();

        window.removeEventListener('mousemove', handleMouseMove, { capture: true });
        window.removeEventListener('mouseup', handleMouseUp, { capture: true });

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const finalDiff = upEvent.clientY - startYRef.current;
        const finalClampedHeight = Math.round(
          Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeightRef.current + finalDiff))
        );
        const finalPaddingBottom = Math.max(0, Math.round(startPaddingBottomRef.current + finalDiff));

        setIsDragging(false);
        setDraftHeight(null);
        setDeltaY(0);

        if (onResizeEnd) {
          onResizeEnd(finalClampedHeight, finalPaddingBottom);
        }

        // Persist both minHeight and paddingBottom to CMS
        updateSectionField(sectionKey, 'minHeight', finalClampedHeight);
        updateSectionField(sectionKey, 'paddingBottom', finalPaddingBottom);
        void saveCurrentPage();
      };

      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    },
    [
      sectionKey,
      targetRef,
      currentMinHeight,
      setSelectedBlockId,
      onLiveResize,
      onResizeEnd,
      updateSectionField,
      saveCurrentPage,
    ]
  );

  if (!isEditing) return null;

  const currentDisplayHeight =
    draftHeight ??
    (currentMinHeight && currentMinHeight > 0
      ? currentMinHeight
      : targetRef.current?.getBoundingClientRect().height
      ? Math.round(targetRef.current.getBoundingClientRect().height)
      : null);

  const shouldHighlight = isDragging || isHovered || isSelected;

  return (
    <>
      {/* Global overlay during drag to prevent iframe / canvas interference */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[9999] cursor-ns-resize pointer-events-auto"
          style={{ cursor: 'ns-resize' }}
        />
      )}

      {/* Resize Handle Container */}
      <div
        className="section-resize-handle absolute left-0 right-0 z-[160] flex items-center justify-center transition-all group"
        style={{
          bottom: -10,
          height: 20,
          cursor: 'ns-resize',
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBlockId(sectionKey);
          setActiveTab('style');
        }}
        title={`Glisser verticalement pour ajuster la hauteur de : ${sectionLabel}`}
      >
        {/* Horizontal Guide Line */}
        <div
          className="w-full transition-all duration-150"
          style={{
            height: isDragging ? 3 : shouldHighlight ? 2 : 1,
            backgroundColor: isDragging
              ? '#C3F910'
              : shouldHighlight
              ? '#C3F910'
              : 'rgba(195, 249, 16, 0.25)',
            boxShadow: isDragging
              ? '0 0 16px rgba(195, 249, 16, 0.9), 0 0 4px #C3F910'
              : shouldHighlight
              ? '0 0 10px rgba(195, 249, 16, 0.6)'
              : 'none',
          }}
        />

        {/* Center Pill Handle */}
        <div
          className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold shadow-2xl transition-all duration-150 select-none"
          style={{
            backgroundColor: isDragging ? '#C3F910' : '#0e0e0d',
            color: isDragging ? '#000000' : '#C3F910',
            border: isDragging ? '1px solid #C3F910' : '1px solid rgba(195, 249, 16, 0.6)',
            boxShadow: isDragging
              ? '0 0 20px rgba(195, 249, 16, 0.8), 0 4px 12px rgba(0, 0, 0, 0.8)'
              : '0 4px 14px rgba(0, 0, 0, 0.7)',
            transform: isDragging ? 'scale(1.08)' : isHovered ? 'scale(1.03)' : 'scale(1)',
          }}
        >
          <MoveVertical className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isDragging
              ? `${draftHeight}px`
              : shouldHighlight && currentDisplayHeight
              ? `${currentDisplayHeight}px`
              : '↕ HAUTEUR'}
          </span>

          {/* Quick Delta Indicator while dragging */}
          {isDragging && deltaY !== 0 && (
            <span
              className="text-[9px] px-1 py-0.5 rounded font-mono font-normal ml-0.5"
              style={{
                backgroundColor: deltaY > 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.2)',
                color: '#000000',
              }}
            >
              {deltaY > 0 ? `+${Math.round(deltaY)}` : `${Math.round(deltaY)}`}px
            </span>
          )}
        </div>

        {/* Floating Tooltip during drag */}
        {isDragging && (
          <div
            className="absolute -top-10 flex items-center gap-2 px-3 py-1 bg-black/95 border border-[#C3F910] text-[#C3F910] rounded-md shadow-2xl text-[11px] font-mono font-bold animate-in fade-in zoom-in-95 pointer-events-none"
            style={{ zIndex: 170 }}
          >
            <span>SECTION : {sectionLabel.toUpperCase()}</span>
            <span className="text-white">→</span>
            <span className="text-[#C3F910] bg-[#1a1a17] px-1.5 py-0.5 rounded">
              {draftHeight}px
            </span>
          </div>
        )}
      </div>
    </>
  );
};
