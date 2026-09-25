'use client';

import React, { useState, useEffect } from 'react';
import '@/web/xeron.css';
import { XerHeader } from '@/web/xeron/XerHeader';
import { XerFooter } from '@/web/xeron/XerFooter';
import { RevealRoot } from '@/web/xeron/RevealRoot';
import { BackToTopButton } from '@/web/xeron/BackToTopButton';
import { ConsultationModal } from '@/web/xeron/ConsultationModal';
import { Language } from '@/web/xeron-translations';
import { EditableWrapper } from '@/web/cms/EditableWrapper';
import { useCms } from '@/lib/site-web/cms-context';
import type { LegalPageData, LegalSection } from '@/web/data/legal-pages-content';
import { getLegalPageData } from '@/web/data/legal-pages-content';
import {
  Shield,
  FileText,
  Calendar,
  ChevronRight,
  Printer,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';

interface LegalPageLayoutProps {
  /** Static page data (FR). If pageKey is also given, it takes precedence for lang switching. */
  pageData: LegalPageData;
  /** Registry key used to look up bilingual data (e.g. "mentions_legales"). */
  pageKey?: string;
  isCookiePage?: boolean;
}

export function LegalPageLayout({ pageData, pageKey, isCookiePage = false }: LegalPageLayoutProps) {
  const [lang, setLang] = useState<Language>('FR');
  const [consultOpen, setConsultOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Resolve language-specific data if a pageKey was supplied
  const resolvedPageData: LegalPageData = pageKey ? getLegalPageData(pageKey, lang) : pageData;

  const { setCurrentPageId, currentPageData, isEditing } = useCms();

  useEffect(() => {
    setCurrentPageId(resolvedPageData.id);
  }, [setCurrentPageId, resolvedPageData.id]);

  const toggleLang = () => setLang((l) => (l === 'FR' ? 'EN' : 'FR'));
  const openConsultation = () => setConsultOpen(true);

  // Merge CMS overrides if present
  const cmsSections = (currentPageData?.sections as Record<string, any>) || {};
  const mergedHeader = {
    badge: (cmsSections.header?.badge as string) || resolvedPageData.header.badge,
    title: (cmsSections.header?.title as string) || resolvedPageData.header.title,
    subtitle: (cmsSections.header?.subtitle as string) || resolvedPageData.header.subtitle,
    lastUpdated: resolvedPageData.header.lastUpdated,
  };

  const sectionOrder = resolvedPageData.sectionOrder;

  // Track active section on scroll for TOC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (const key of sectionOrder) {
        const el = document.getElementById(key);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(key);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionOrder]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const openCookiePreferences = () => {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (typeof win.openCookieConsent === 'function') {
        win.openCookieConsent();
      } else {
        const event = new CustomEvent('open-cookie-preferences');
        window.dispatchEvent(event);
      }
    }
  };

  return (
    <RevealRoot className="xer-site" style={{ background: '#080808', color: '#f5f4f0' }}>
      <XerHeader
        companyName="PIXIATECH"
        lang={lang}
        onOpenConsultation={openConsultation}
        onToggleLang={toggleLang}
        forceSolidDark={true}
      />

      <main className="w-full bg-[#080808] text-[#f5f4f0] pt-[120px] pb-24">
        <div className="wrap">
          {/* Breadcrumb / Top metadata */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 text-xs font-mono text-[#7a7a76]">
            <div className="flex items-center gap-2">
              <a href="/web" className="hover:text-white transition-colors">PIXIATECH</a>
              <span>/</span>
              <span className="text-[#C3F910] uppercase">{resolvedPageData.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C3F910]" />
                Mise à jour : {mergedHeader.lastUpdated}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="hover:text-white transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
                title="Imprimer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Copier le lien"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Partager'}</span>
              </button>
            </div>
          </div>

          {/* Hero Header */}
          <EditableWrapper sectionKey="header" sectionLabel="En-tête de la page">
            <header className="mb-14 pb-10 border-b border-[#1f1f1f]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121210] border border-[#262624] text-[11px] font-mono text-[#C3F910] tracking-wider mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910] animate-pulse" />
                {mergedHeader.badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
                {mergedHeader.title}
              </h1>

              <p className="text-base sm:text-lg text-[#a3a3a3] max-w-3xl leading-relaxed">
                {mergedHeader.subtitle}
              </p>

              {/* Special interactive banner for Cookie Management */}
              {isCookiePage && (
                <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#12140d] via-[#10100f] to-[#0c0c0b] border border-[#C3F910]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <SlidersHorizontal className="w-4 h-4 text-[#C3F910]" />
                      <span>Centre de préférences cookies & traceurs</span>
                    </div>
                    <p className="text-xs text-[#a3a3a3] max-w-xl leading-relaxed">
                      Conformément aux délibérations de la CNIL et au RGPD, vous êtes libre d'accepter, de refuser ou de moduler le dépôt de cookies à tout instant.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCookiePreferences}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C3F910] hover:bg-[#b0e20e] text-[#0a0a09] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(195,249,16,0.25)] hover:shadow-[0_0_35px_rgba(195,249,16,0.4)] shrink-0 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Paramétrer mes choix</span>
                  </button>
                </div>
              )}
            </header>
          </EditableWrapper>

          {/* Two-Column Grid: Left Sticky TOC, Right Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Sidebar Table of Contents */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <div className="sticky top-28 space-y-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#7a7a76] pb-2 border-b border-[#1f1f1f]">
                  Sommaire du document
                </div>
                <nav className="space-y-1 text-xs">
                  {sectionOrder.map((secKey) => {
                    const sec = resolvedPageData.sections[secKey];
                    if (!sec) return null;
                    const isActive = activeSection === secKey;
                    return (
                      <a
                        key={secKey}
                        href={`#${secKey}`}
                        className={`group flex items-start gap-2.5 py-2 px-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#151513] text-[#C3F910] font-semibold border-l-2 border-[#C3F910]'
                            : 'text-[#8a8880] hover:text-[#f5f4f0] hover:bg-[#111110]'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-[#555] group-hover:text-[#888] shrink-0 pt-0.5">
                          {sec.badge?.replace('ARTICLE ', 'ART. ') || '•'}
                        </span>
                        <span className="leading-snug line-clamp-2">{sec.title}</span>
                      </a>
                    );
                  })}
                </nav>

                {/* Direct Contact Card */}
                <div className="mt-8 p-4 rounded-xl bg-[#10100f] border border-[#1f1f1f] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Shield className="w-3.5 h-3.5 text-[#C3F910]" />
                    <span>Conformité & Juridique</span>
                  </div>
                  <p className="text-[11px] text-[#7a7a76] leading-relaxed">
                    Une question sur nos conditions ou vos données personnelles ?
                  </p>
                  <a
                    href="mailto:contact@pixiatech.com"
                    className="inline-flex items-center gap-1.5 text-xs text-[#C3F910] font-mono hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    contact@pixiatech.com
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content Articles */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-12">
              {sectionOrder.map((secKey, idx) => {
                const sec = resolvedPageData.sections[secKey];
                if (!sec) return null;

                // CMS dynamic override
                const secCms = (cmsSections[secKey] as Record<string, any>) || {};
                const displayTitle = (secCms.title as string) || sec.title;
                const displayBody = (secCms.description as string) || (secCms.body as string) || sec.body;
                const displayBadge = (secCms.badge as string) || (secCms.eyebrow as string) || sec.badge;

                return (
                  <EditableWrapper
                    key={secKey}
                    sectionKey={secKey}
                    sectionLabel={displayTitle}
                  >
                    <section
                      id={secKey}
                      className="scroll-mt-32 p-6 sm:p-8 rounded-2xl bg-[#0c0c0b] border border-[#1a1a19] hover:border-[#272725] transition-colors relative"
                    >
                      {/* Section Badge */}
                      {displayBadge && (
                        <div className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#C3F910] mb-3">
                          {displayBadge}
                        </div>
                      )}

                      {/* Section Title */}
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-tight">
                        {displayTitle}
                      </h2>

                      {/* Subtitle if any */}
                      {sec.subtitle && (
                        <h3 className="text-sm font-semibold text-[#c9c7c1] mb-3">
                          {sec.subtitle}
                        </h3>
                      )}

                      {/* Body Paragraph */}
                      {displayBody && (
                        <div className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-line mb-4 font-normal">
                          {displayBody}
                        </div>
                      )}

                      {/* Bullets List */}
                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="space-y-3 mt-4">
                          {sec.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-3 text-sm text-[#c9c7c1] leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910] mt-2 shrink-0" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Cards Grid (e.g. Identity info, Browser settings) */}
                      {sec.cards && sec.cards.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                          {sec.cards.map((card, cIdx) => (
                            <div
                              key={cIdx}
                              className="p-4 rounded-xl bg-[#141412] border border-[#222220] hover:border-[#C3F910]/40 transition-colors"
                            >
                              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a76] mb-1">
                                {card.label}
                              </div>
                              <div className="text-sm font-bold text-white">
                                {card.value}
                              </div>
                              {card.sub && (
                                <div className="text-xs text-[#a3a3a3] mt-1 font-mono">
                                  {card.sub}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </EditableWrapper>
                );
              })}

              {/* End of Document Stamp */}
              <div className="p-8 rounded-2xl bg-[#090908] border border-[#1a1a19] text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#151512] border border-[#2a2a26] text-[#C3F910] flex items-center justify-center mx-auto">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Engagement de Conformité PIXIATECH</h4>
                <p className="text-xs text-[#7a7a76] max-w-lg mx-auto leading-relaxed">
                  L'ensemble de nos documents contractuels et politiques de données sont rédigés dans le strict respect de la législation française et des règlements européens (RGPD 2016/679).
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#a3a3a3]">
                  <a href="/mentions-legales" className="hover:text-[#C3F910] transition-colors">Mentions Légales</a>
                  <span>•</span>
                  <a href="/politique-confidentialite" className="hover:text-[#C3F910] transition-colors">Politique de Confidentialité</a>
                  <span>•</span>
                  <a href="/gestion-cookies" className="hover:text-[#C3F910] transition-colors">Gestion des Cookies</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <XerFooter companyName="PIXIATECH" lang={lang} onOpenConsultation={openConsultation} />

      <ConsultationModal
        isOpen={consultOpen}
        onClose={() => setConsultOpen(false)}
        companyName="PIXIATECH"
        lang={lang}
      />

      <BackToTopButton lang={lang} />
    </RevealRoot>
  );
}
