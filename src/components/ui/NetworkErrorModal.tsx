'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkErrorModalProps {
  open: boolean;
  onRetry: () => void;
}

export function NetworkErrorModal({ open, onRetry }: NetworkErrorModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full mx-4 overflow-hidden"
            style={{ maxWidth: '420px' }}
          >
            <div
              className="rounded-3xl px-8 pt-8 pb-8 flex flex-col items-center text-center"
              style={{ background: '#f8f5f2', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}
            >
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-[20px]"
                    style={{ border: '2px solid rgba(100, 116, 139, 0.3)' }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.65], opacity: [0.45, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.55,
                      ease: [0.25, 0.1, 0.25, 1],
                      repeatDelay: 0.2,
                    }}
                  />
                ))}
                <div
                  className="w-20 h-20 rounded-[20px] flex items-center justify-center relative z-10"
                  style={{
                    background: 'linear-gradient(145deg, #94a3b8 0%, #475569 100%)',
                    boxShadow: '0 8px 28px rgba(71, 85, 105, 0.5)',
                  }}
                >
                  <WifiOff className="w-10 h-10 text-white/90" />
                </div>
              </div>

              <h2 className="font-extrabold text-slate-900 mb-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                Connexion Perdue
              </h2>

              <p
                className="font-bold uppercase mb-5"
                style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: '#64748b' }}
              >
                PROBLÈME DE RÉSEAU
              </p>

              <p className="text-slate-500 mb-7 leading-relaxed" style={{ fontSize: '0.9rem' }}>
                Impossible de se connecter aux serveurs. Veuillez vérifier votre connexion internet et réessayer.
              </p>

              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-3 font-bold text-white transition-all duration-300"
                style={{
                  background: '#000000',
                  borderRadius: '14px',
                  height: '52px',
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#181818';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(148,163,184,0.15), 0 0 0 1px rgba(148,163,184,0.1)';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <RefreshCw className="w-5 h-5 text-slate-400 transition-all duration-300"
                  onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.filter = 'drop-shadow(0 0 6px rgba(148,163,184,0.4))'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.filter = ''; }}
                />
                Réessayer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
