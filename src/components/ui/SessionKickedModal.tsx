'use client';

import { LogIn, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionKickedModalProps {
  open: boolean;
  sessionCreatedAt: number | null;
  onConfirm: () => void;
}

export function SessionKickedModal({ open, sessionCreatedAt, onConfirm }: SessionKickedModalProps) {
  const formattedDate = sessionCreatedAt
    ? new Date(sessionCreatedAt).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop — transparent + blurred so the app interface is visible behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full mx-4 overflow-hidden"
            style={{ maxWidth: '420px' }}
          >
            {/* Card */}
            <div
              className="rounded-3xl px-8 pt-8 pb-8 flex flex-col items-center text-center"
              style={{ background: '#f8f5f2', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}
            >
              {/* Shield Icon with wave rings */}
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                {/* Wave rings — scale-based for smooth GPU animation */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      border: '2px solid rgba(232, 73, 15, 0.3)',
                    }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                      scale: [1, 1.65],
                      opacity: [0.45, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.55,
                      ease: [0.25, 0.1, 0.25, 1],
                      repeatDelay: 0.2,
                    }}
                  />
                ))}
                {/* Icon container */}
                <div
                  className="w-20 h-20 rounded-[20px] flex items-center justify-center relative z-10"
                  style={{
                    background: 'linear-gradient(145deg, #ff8c42 0%, #e8490f 100%)',
                    boxShadow: '0 8px 28px rgba(232, 73, 15, 0.5)',
                  }}
                >
                  {/* Shield SVG */}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-extrabold text-slate-900 mb-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                Connexion Interrompue
              </h2>

              {/* Subtitle badge */}
              <p
                className="font-bold uppercase mb-5"
                style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: '#e8490f' }}
              >
                SESSION DOUBLE DÉTECTÉE
              </p>

              {/* Description */}
              <p className="text-slate-500 mb-5 leading-relaxed" style={{ fontSize: '0.9rem' }}>
                Votre session a été fermée car votre compte a été connecté
                sur un autre appareil ou navigateur.
              </p>

              {/* Date row */}
              {formattedDate && (
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: '#f0a500' }} />
                  <p className="text-slate-800" style={{ fontSize: '0.9rem' }}>
                    Nouvelle connexion le <strong>{formattedDate}</strong>
                  </p>
                </div>
              )}

              {/* Security note */}
              <p className="text-slate-400 mb-7 leading-relaxed" style={{ fontSize: '0.78rem' }}>
                Par mesure de sécurité, la plateforme n'autorise qu'une seule session active
                par utilisateur. Si vous n'êtes pas à l'origine de cette connexion, nous vous
                conseillons de changer immédiatement votre mot de passe.
              </p>

              {/* CTA Button */}
              <button
                onClick={onConfirm}
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
                  e.currentTarget.style.borderColor = 'rgba(251,146,60,0.35)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(251,146,60,0.15), 0 0 0 1px rgba(251,146,60,0.1)';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <LogIn className="w-5 h-5 text-orange-400 transition-all duration-300" style={{ filter: 'drop-shadow(0 0 0 transparent)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fb923c'; e.currentTarget.style.filter = 'drop-shadow(0 0 6px rgba(251,146,60,0.4))'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.filter = ''; }}
                />
                Se reconnecter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
