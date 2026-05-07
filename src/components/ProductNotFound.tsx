'use client';

import React from 'react';
import { Search, ChevronLeft, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const GhostIllustration = () => (
  <motion.div
    animate={{ y: [0, -15, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="relative"
  >
    <svg width="160" height="200" viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm opacity-90">
      <path 
        d="M10 60C10 32.3858 32.3858 10 60 10C87.6142 10 110 32.3858 110 60V125C110 125 101.5 120 95.5 123.5C89.5 127 82.5 130 75.5 123.5C68.5 117 61.5 117 54.5 123.5C47.5 130 40.5 127 34.5 123.5C28.5 120 20 125 20 125V60" 
        fill="#dce4f2" 
      />
      <circle cx="45" cy="65" r="3.5" fill="#8b9bb4" />
      <circle cx="75" cy="65" r="3.5" fill="#8b9bb4" />
      <ellipse cx="60" cy="142" rx="35" ry="6" fill="#dce4f2" opacity="0.4" />
    </svg>
  </motion.div>
);

export interface ProductNotFoundProps {
  onReset: () => void;
  onBack: () => void;
  pitch?: string;
  environment?: string;
  hideBackButton?: boolean;
}

export function ProductNotFound({ onReset, onBack, pitch, environment, hideBackButton }: ProductNotFoundProps) {
  const { t } = useI18n();
  return (
    <div className="flex-1 flex items-center justify-center p-4 font-sans w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-transparent rounded-[40px] overflow-hidden flex flex-col items-center"
      >
        {/* Illustration */}
        <div className="flex items-center justify-center p-8 mt-4">
          <motion.div
            animate={{ y: [-8, 8, -8] }} 
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          >
            <img src="/no-product.png" alt={t('wizard.products.noMatchTitle').replace(/<br\s*\/?>/gi, ' ')} className="w-80 h-auto object-contain drop-shadow-2xl" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="w-full px-4 pb-8 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0E0D12] mb-3 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: t('wizard.products.noMatchTitle') }}>
          </h1>

          <p className="text-base text-slate-500 leading-relaxed max-w-sm mb-6">
            {t('wizard.products.noMatchDesc', { pitch: pitch || 'N/A', environment: environment || 'N/A' })}
          </p>

          {/* Advice Box */}
          <div className="w-full bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-5 mb-6 text-left">
            <h3 className="font-bold text-[#92400e] mb-2 text-sm">{t('wizard.products.whatToDo')}</h3>
            <ul className="text-[#b45309] text-sm space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                {t('wizard.products.advicePitch')}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                {t('wizard.products.adviceEnv')}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                {t('wizard.products.adviceSupport')}
              </li>
            </ul>
          </div>

          {/* Buttons — all vertical */}
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={onReset}
              className="group w-full bg-[#5536ff] hover:bg-[#0E0D12] text-white py-4 px-6 rounded-full font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98]"
            >
              <span className="group-hover:text-[#bef264] transition-colors">{t('wizard.products.searchAnother')}</span>
              <div className="bg-[#4428e0] group-hover:bg-[#bef264] p-1.5 rounded-full transition-colors shrink-0">
                <Search size={16} strokeWidth={3} className="text-white group-hover:text-[#0E0D12] transition-colors" />
              </div>
            </button>

            {!hideBackButton && (
                <button 
                  onClick={onBack}
                  className="group w-full bg-white/70 backdrop-blur-sm border border-slate-200 py-3.5 rounded-full font-bold text-[#0E0D12] hover:bg-[#0E0D12] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <div className="bg-slate-100 group-hover:bg-[#bef264] p-1.5 rounded-full transition-colors shrink-0">
                    <ChevronLeft size={16} strokeWidth={3} className="text-[#0E0D12] group-hover:text-black transition-colors" />
                  </div>
                  <span>{t('common.back')}</span>
                </button>
            )}

            <button 
              onClick={() => window.open('https://pixiatech.com/contact/', '_blank')}
              className="group w-full bg-white/70 backdrop-blur-sm border border-slate-200 py-3.5 rounded-full font-bold text-[#0E0D12] hover:bg-[#bef264] hover:text-black transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <div className="bg-slate-100 group-hover:bg-[#0E0D12] p-1.5 rounded-full transition-colors shrink-0">
                <MessageCircle size={16} strokeWidth={3} className="text-[#0E0D12] group-hover:text-[#bef264] transition-colors" />
              </div>
              <span>{t('wizard.products.contactSupport')}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
