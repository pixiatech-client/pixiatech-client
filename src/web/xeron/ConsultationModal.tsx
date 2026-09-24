'use client';

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '../xeron-translations';

interface ConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  model: string;
  surfaceM2: string;
  application: string;
  message: string;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  lang?: Language;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  companyName,
  lang = 'FR',
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ConsultationFormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    model: 'IL-FISS-IRWP1.2 Lite',
    surfaceM2: '12',
    application: 'Corporate Lobby / Atrium',
    message: '',
  });

  const t = translations[lang].consultation;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl bg-[#0e0e0d] border border-[#222] p-6 sm:p-8 text-[#f5f4f0] shadow-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#7a7a76] hover:text-white border border-[#222] hover:border-[#444] transition-colors cursor-pointer"
          aria-label={lang === 'FR' ? 'Fermer la fenêtre' : 'Close modal'}
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[#C3F910]/10 border border-[#C3F910] rounded-full flex items-center justify-center mx-auto text-[#C3F910]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">{t.successTitle}</h3>
            <p className="text-[#a3a3a3] max-w-md mx-auto text-sm leading-relaxed">
              {lang === 'FR' ? (
                <>
                  Merci, <strong className="text-white">{formData.fullName}</strong>. Un ingénieur avant-vente de {companyName} examinera votre cahier des charges PXT Fine et vous recontactera sous 24 heures ouvrées.
                </>
              ) : (
                <>
                  Thank you, <strong className="text-white">{formData.fullName}</strong>. An engineering specialist from {companyName} will review your PXT Fine specifications and contact you within 24 hours.
                </>
              )}
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="btn btn-solid px-8 py-3 bg-white text-black font-semibold hover:bg-[#C3F910] hover:text-black transition-colors uppercase tracking-wider text-xs"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] tracking-[0.22em] text-[#C3F910] uppercase font-mono mb-2">
              {t.eyebrow}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              {t.title}
            </h3>
            <p className="text-xs text-[#7a7a76] mb-6">
              {t.subtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={t.namePlaceholder}
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  />
                </div>
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.workEmail} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.companyLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={t.companyPlaceholder}
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  />
                </div>
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 ..."
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.modelPitch}
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  >
                    <option value="IL-FISS-IRWP1.2 Lite">WP 1.2 Lite (1.25 mm)</option>
                    <option value="IL-FISS-IRWP1.2 Flip">WP 1.2 Flip Chip (1.25 mm)</option>
                    <option value="IL-FISS-IRWP1.5 Lite">WP 1.5 Lite (1.56 mm)</option>
                    <option value="IL-FISS-IRWP1.8 Lite">WP 1.8 Lite (1.87 mm)</option>
                    <option value="IL-FISS-IRWP2.3 Lite">WP 2.3 Lite (2.34 mm)</option>
                    <option value="IL-FISS-IRWP2.5 Lite">WP 2.5 Lite (2.50 mm)</option>
                    <option value="IL-FISS-IRWP3.1 Lite">WP 3.1 Lite (3.12 mm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                    {t.estimatedArea}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.surfaceM2}
                    onChange={(e) => setFormData({ ...formData, surfaceM2: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                  {t.appContext}
                </label>
                <select
                  value={formData.application}
                  onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                  className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910]"
                >
                  {t.appOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#a3a3a3] tracking-widest uppercase mb-1.5 font-mono">
                  {t.notesLabel}
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-[#141413] border border-[#262624] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C3F910] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 border border-[#333] text-[#a3a3a3] hover:text-white uppercase font-mono tracking-wider text-[11px]"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-solid px-7 py-3 bg-[#C3F910] text-black font-bold hover:bg-white hover:text-black transition-colors uppercase font-mono tracking-wider text-[11px]"
                >
                  {t.submitBtn}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};