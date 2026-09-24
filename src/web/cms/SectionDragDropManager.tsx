'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';

interface DragDropContextType {
  activeDragKey: string | null;
  targetKey: string | null;
  targetPosition: 'before' | 'after' | null;
  startDrag: (sectionKey: string, e: React.MouseEvent) => void;
  registerSectionRef: (sectionKey: string, el: HTMLElement | null) => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const SectionDragDropProvider: React.FC<{
  children: React.ReactNode;
  allSectionKeys: string[];
}> = ({ children, allSectionKeys }) => {
  const { currentPageData, updateSectionOrder, saveCurrentPage } = useCms();
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [targetPosition, setTargetPosition] = useState<'before' | 'after' | null>(null);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeDragKeyRef = useRef<string | null>(null);
  const targetKeyRef = useRef<string | null>(null);
  const targetPosRef = useRef<'before' | 'after' | null>(null);

  const registerSectionRef = useCallback((sectionKey: string, el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(sectionKey, el);
    } else {
      sectionRefs.current.delete(sectionKey);
    }
  }, []);

  const startDrag = useCallback(
    (sectionKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      activeDragKeyRef.current = sectionKey;
      setActiveDragKey(sectionKey);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      const currentOrder =
        currentPageData?.sectionOrder && Array.isArray(currentPageData.sectionOrder) && currentPageData.sectionOrder.length > 0
          ? [...currentPageData.sectionOrder]
          : [...allSectionKeys];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const mouseY = moveEvent.clientY;
        let closestKey: string | null = null;
        let closestPos: 'before' | 'after' | null = null;
        let minDistance = Infinity;

        // Check each registered section's bounding rect
        sectionRefs.current.forEach((el, key) => {
          if (key === activeDragKeyRef.current) return;
          const rect = el.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;

          // Distance to top border
          const distTop = Math.abs(mouseY - rect.top);
          if (distTop < minDistance) {
            minDistance = distTop;
            closestKey = key;
            closestPos = 'before';
          }

          // Distance to bottom border
          const distBottom = Math.abs(mouseY - rect.bottom);
          if (distBottom < minDistance) {
            minDistance = distBottom;
            closestKey = key;
            closestPos = 'after';
          }
        });

        targetKeyRef.current = closestKey;
        targetPosRef.current = closestPos;
        setTargetKey(closestKey);
        setTargetPosition(closestPos);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();

        window.removeEventListener('mousemove', handleMouseMove, { capture: true });
        window.removeEventListener('mouseup', handleMouseUp, { capture: true });

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const fromKey = activeDragKeyRef.current;
        const toKey = targetKeyRef.current;
        const pos = targetPosRef.current;

        if (fromKey && toKey && fromKey !== toKey && pos) {
          const newOrder = currentOrder.filter((k) => k !== fromKey);
          const targetIndex = newOrder.indexOf(toKey);
          if (targetIndex !== -1) {
            const insertIndex = pos === 'before' ? targetIndex : targetIndex + 1;
            newOrder.splice(insertIndex, 0, fromKey);
            updateSectionOrder(newOrder);
            void saveCurrentPage();
          }
        }

        activeDragKeyRef.current = null;
        targetKeyRef.current = null;
        targetPosRef.current = null;
        setActiveDragKey(null);
        setTargetKey(null);
        setTargetPosition(null);
      };

      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    },
    [allSectionKeys, currentPageData?.sectionOrder, updateSectionOrder, saveCurrentPage]
  );

  return (
    <DragDropContext.Provider
      value={{
        activeDragKey,
        targetKey,
        targetPosition,
        startDrag,
        registerSectionRef,
      }}
    >
      {children}

      {/* Global transparent drag overlay */}
      {activeDragKey && (
        <div
          className="fixed inset-0 z-[9990] cursor-grabbing pointer-events-auto"
          style={{ cursor: 'grabbing' }}
        />
      )}
    </DragDropContext.Provider>
  );
};

export const useSectionDragDrop = () => {
  return useContext(DragDropContext);
};
