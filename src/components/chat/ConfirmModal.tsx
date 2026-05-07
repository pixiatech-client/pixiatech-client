'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmer", 
  cancelText = "Annuler",
  variant = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0f1113] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] z-10"
          >
            {/* Header / Viseur Style */}
            <div className={cn(
              "p-6 flex items-center gap-4 border-b border-white/5",
              variant === 'danger' ? "bg-red-500/5" : "bg-[#a2ff00]/5"
            )}>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                variant === 'danger' ? "bg-red-500/20 text-red-500" : "bg-[#a2ff00]/20 text-[#a2ff00]"
              )}>
                {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">{title}</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Confirmation requise</p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              <p className="text-white/60 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/40 flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl",
                  variant === 'danger' 
                    ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" 
                    : "bg-[#a2ff00] text-black shadow-[#a2ff00]/20 hover:bg-[#b4ff33]"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
