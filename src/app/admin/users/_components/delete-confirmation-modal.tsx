'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl z-[101] border border-gray-100"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#fff1f2] rounded-[24px] flex items-center justify-center text-[#ff2d55] mb-8">
                <AlertTriangle size={36} strokeWidth={2.5} />
              </div>

              <h3 className="text-[22px] font-bold text-[#1a1d21] mb-3 tracking-tight">Supprimer l'utilisateur ?</h3>
              <p className="text-[#64748b] text-[15px] leading-relaxed mb-10 px-4">
                Êtes-vous sûr de vouloir supprimer <span className="font-bold text-[#1a1d21]">&quot;{userName}&quot;</span> ? Cette action est irréversible.
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-[#f8f9fa] hover:bg-[#f1f3f5] text-[#495057] rounded-[20px] font-bold text-[15px] transition-all active:scale-[0.98]"
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-4 bg-[#ff2d55] hover:bg-[#f01d45] text-white rounded-[20px] font-bold text-[15px] transition-all shadow-lg shadow-[#ff2d55]/25 active:scale-[0.98]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
