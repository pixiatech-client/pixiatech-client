'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages = 0,
  hasMore,
  onPageChange,
  totalItems,
  itemsPerPage,
  className
}) => {
  const showPagination = totalPages > 1 || hasMore;
  if (!showPagination && currentPage === 1) return null;

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {totalItems && itemsPerPage ? (
        <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
          Affichage de <span className="text-zinc-900 mx-1">{startItem}</span> à{' '}
          <span className="text-zinc-900 mx-1">{endItem}</span> sur{' '}
          <span className="text-zinc-900 mx-1">{totalItems}</span>
        </div>
      ) : (
        <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
          Page <span className="text-zinc-900 mx-1">{currentPage}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="join-item btn-square btn-pagination rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          title="Précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Join Group with Radio style buttons - only if totalPages is known */}
        {totalPages > 0 && (
          <div className="join">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "join-item btn-square btn-pagination font-black text-xs",
                  currentPage === page ? "btn-pagination-active" : "bg-white"
                )}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={totalPages > 0 ? currentPage === totalPages : !hasMore}
          className="join-item btn-square btn-pagination rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          title="Suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
