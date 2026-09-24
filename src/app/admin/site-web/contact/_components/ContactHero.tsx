'use client';
import React from 'react';
import { Mail, Phone, MapPin, Sparkles, ArrowDownRight, Clock } from 'lucide-react';
import type { PageContentConfig } from '@/lib/site-web/types';
import { EditableText } from './EditableText';
import { CardSwitch } from './CardSwitch';

interface ContactHeroProps {
  content: PageContentConfig['hero'];
  visibility: PageContentConfig['visibility'];
  isAdmin: boolean;
  onUpdateHero: (patch: Partial<PageContentConfig['hero']>) => void;
  onUpdateVisibility: (patch: Partial<PageContentConfig['visibility']>) => void;
  onScrollToForm: () => void;
}

export const ContactHero: React.FC<ContactHeroProps> = ({
  content,
  visibility,
  isAdmin,
  onUpdateHero,
  onUpdateVisibility,
  onScrollToForm,
}) => {
  return (
    <section className="relative pt-24 pb-10 sm:pt-32 sm:pb-14 px-4 overflow-hidden">
      {/* Subtle light background ambient flares */}
      <div 
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 rounded-full blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(ellipse at center, #c6ff00 0%, #6366f1 40%, transparent 70%)'
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl relative z-10 text-center">
        {/* Top Feature Surtitre Badge */}
        {(visibility.heroBadge || isAdmin) && (
          <div className={`mb-6 flex flex-col items-center justify-center gap-2 ${!visibility.heroBadge ? 'opacity-50' : ''}`}>
            {isAdmin && (
              <div className="mb-1">
                <CardSwitch
                  label="Badge Surtitre"
                  checked={visibility.heroBadge}
                  onChange={(val) => onUpdateVisibility({ heroBadge: val })}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            )}
            <div className="inline-flex items-center space-x-2 rounded-full bg-white border border-gray-200/80 px-4 py-1.5 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#c6ff00] animate-pulse" />
              <EditableText
                as="span"
                value={content.badgeText}
                onChange={(val) => onUpdateHero({ badgeText: val })}
                isAdmin={isAdmin}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700"
                label="Texte du badge"
              />
              <span className="text-slate-300">•</span>
              <EditableText
                as="span"
                value={content.badgeLocation}
                onChange={(val) => onUpdateHero({ badgeLocation: val })}
                isAdmin={isAdmin}
                className="text-[11px] font-medium text-slate-400 uppercase tracking-wider"
                label="Lieu"
              />
            </div>
          </div>
        )}

        {/* Main Headline */}
        {(visibility.heroTitle || isAdmin) && (
          <div className={`max-w-4xl mx-auto ${!visibility.heroTitle ? 'opacity-50' : ''}`}>
            {isAdmin && (
              <div className="mb-2 flex justify-center">
                <CardSwitch
                  label="Titre Principal"
                  checked={visibility.heroTitle}
                  onChange={(val) => onUpdateVisibility({ heroTitle: val })}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase leading-[1.1]">
              <EditableText
                as="span"
                value={content.titleLine1}
                onChange={(val) => onUpdateHero({ titleLine1: val })}
                isAdmin={isAdmin}
                label="Ligne de titre 1"
              />
              <br className="hidden sm:inline" />{' '}
              <span 
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #7c3aed 0%, #ef4444 50%, #f97316 100%)'
                }}
              >
                <EditableText
                  as="span"
                  value={content.titleHighlight}
                  onChange={(val) => onUpdateHero({ titleHighlight: val })}
                  isAdmin={isAdmin}
                  label="Titre mis en valeur"
                />
              </span>
            </h1>
          </div>
        )}

        {/* Subtitle */}
        {(visibility.heroSubtitle || isAdmin) && (
          <div className={`mt-5 max-w-2xl mx-auto ${!visibility.heroSubtitle ? 'opacity-50' : ''}`}>
            {isAdmin && (
              <div className="mb-1 flex justify-center">
                <CardSwitch
                  label="Sous-titre explicatif"
                  checked={visibility.heroSubtitle}
                  onChange={(val) => onUpdateVisibility({ heroSubtitle: val })}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            )}
            <EditableText
              as="p"
              multiline
              value={content.subtitle}
              onChange={(val) => onUpdateHero({ subtitle: val })}
              isAdmin={isAdmin}
              className="text-base sm:text-lg text-slate-600 leading-relaxed block"
              label="Sous-titre"
            />
          </div>
        )}

        {/* Key Quick Stats Pills */}
        {(visibility.heroStatsPills || isAdmin) && (
          <div className={`mt-8 ${!visibility.heroStatsPills ? 'opacity-50' : ''}`}>
            {isAdmin && (
              <div className="mb-2 flex justify-center">
                <CardSwitch
                  label="Pastilles / Points Clés"
                  checked={visibility.heroStatsPills}
                  onChange={(val) => onUpdateVisibility({ heroStatsPills: val })}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <div className="flex items-center space-x-2 rounded-full bg-white px-4 py-2 border border-gray-100 hover:border-gray-200 shadow-sm text-slate-700 font-medium transition-colors">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <EditableText
                  as="span"
                  value={content.stat1Text}
                  onChange={(val) => onUpdateHero({ stat1Text: val })}
                  isAdmin={isAdmin}
                  label="Pastille 1"
                />
              </div>

              <div className="flex items-center space-x-2 rounded-full bg-white px-4 py-2 border border-gray-100 hover:border-gray-200 shadow-sm text-slate-700 font-medium transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
                <EditableText
                  as="span"
                  value={content.stat2Text}
                  onChange={(val) => onUpdateHero({ stat2Text: val })}
                  isAdmin={isAdmin}
                  label="Pastille 2"
                />
              </div>

              <div className="flex items-center space-x-2 rounded-full bg-white px-4 py-2 border border-gray-100 hover:border-gray-200 shadow-sm text-slate-700 font-medium transition-colors">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <EditableText
                  as="span"
                  value={content.stat3Text}
                  onChange={(val) => onUpdateHero({ stat3Text: val })}
                  isAdmin={isAdmin}
                  label="Pastille 3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {(visibility.heroCtaButton || isAdmin) && (
          <div className={`mt-8 flex flex-col items-center justify-center gap-2 ${!visibility.heroCtaButton ? 'opacity-50' : ''}`}>
            {isAdmin && (
              <CardSwitch
                label="Bouton d'appel à l'action"
                checked={visibility.heroCtaButton}
                onChange={(val) => onUpdateVisibility({ heroCtaButton: val })}
                isAdmin={isAdmin}
                compact
              />
            )}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onScrollToForm}
                className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-8 rounded-xl shadow-xl transition-all duration-200 active:scale-[0.98] text-sm"
              >
                <EditableText
                  as="span"
                  value={content.ctaButtonText}
                  onChange={(val) => onUpdateHero({ ctaButtonText: val })}
                  isAdmin={isAdmin}
                  label="Texte du bouton d'action"
                />
                <ArrowDownRight className="w-4 h-4 text-[#c6ff00]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};