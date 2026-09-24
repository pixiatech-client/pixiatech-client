'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '../xeron-translations';
import { OrbCanvas } from '../components/OrbCanvas';

interface XerFooterProps {
  companyName?: string;
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const XerFooter: React.FC<XerFooterProps> = ({
  companyName = 'PIXIATECH',
  lang = 'FR',
  onOpenConsultation,
}) => {
  const router = useRouter();
  const scrollTo = (hash: string) => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/web${hash}`;
    }
  };

  const handleStartProject = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/');
  };

  const t = {
    products: lang === 'FR' ? 'PRODUITS' : 'PRODUCTS',
    company: lang === 'FR' ? 'ENTREPRISE' : 'COMPANY',
    support: lang === 'FR' ? 'SUPPORT' : 'SUPPORT',
    hq: lang === 'FR' ? 'SIÈGE SOCIAL' : 'HEADQUARTERS',
    allSeries: lang === 'FR' ? 'Toutes les séries →' : 'All Series →',
    about: lang === 'FR' ? 'À propos' : 'About',
    projects: lang === 'FR' ? 'Projets' : 'Projects',
    technology: lang === 'FR' ? 'Technologie' : 'Technology',
    experienceCenter: lang === 'FR' ? "Centre d'expérience" : 'Experience Center',
    contact: 'Contact',
    techSupport: lang === 'FR' ? 'Support technique' : 'Technical Support',
    resources: lang === 'FR' ? 'Ressources & Guides' : 'Resources',
    startProject: lang === 'FR' ? 'Démarrer un projet →' : 'Start a Project →',
    location: 'PARIS / FRANCE',
    privacy: lang === 'FR' ? 'CONFIDENTIALITÉ' : 'PRIVACY',
    cookies: 'COOKIES',
    legal: lang === 'FR' ? 'MENTIONS LÉGALES' : 'LEGAL',
  };

  return (
    <footer
      id="site-footer"
      style={{
        position: 'relative',
        background: 'var(--black-4, #050505)',
        color: 'var(--dark-text, #f5f4f0)',
        overflow: 'hidden',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      {/* ── Animated WebGL Fluid background (helloshivam.com) ── */}
      <OrbCanvas />

      {/* ── Scoped rule: allow clicking links/buttons while letting canvas catch background mousemove ── */}
      <style>{`
        #site-footer a, #site-footer button, #site-footer input {
          pointer-events: auto !important;
        }
      `}</style>

      <div className="wrap" style={{ position: 'relative', zIndex: 1, padding: '80px var(--gutter) 0', pointerEvents: 'none' }}>

        {/* Foot Grid: 4 columns matching xeron.co */}
        <div
          className="foot-grid"
          style={{
            display: 'grid',
            gap: 40,
            paddingBottom: 72,
            borderBottom: '1px solid #1A1A1A',
          }}
        >
          {/* Column 1: PRODUCTS */}
          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '.22em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {t.products}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a href="/web/pxt-fine" className="hov-acc" style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>
                XR Fine (WP Series)
              </a>
              <a href="/web/products" className="hov-acc" style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>
                XR Vision (MV Series)
              </a>
              <a href="/web/products" className="hov-acc" style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>
                XR Flex (AR MKII)
              </a>
              <a href="/web/products" className="hov-acc" style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>
                XR Studio (VP Series)
              </a>
              <a
                href="/web/products"
                className="hov-acc"
                style={{
                  color: 'var(--accent, #C3F910)',
                  fontWeight: 700,
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {t.allSeries}
              </a>
            </div>
          </div>

          {/* Column 2: COMPANY */}
          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '.22em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {t.company}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a
                href="/web#manifesto"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#manifesto');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.about}
              </a>
              <a
                href="/web#projects"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#projects');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.projects}
              </a>
              <a
                href="/web#technology"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#technology');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.technology}
              </a>
              <a
                href="/web#experience"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#experience');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.experienceCenter}
              </a>
            </div>
          </div>

          {/* Column 3: SUPPORT */}
          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '.22em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {t.support}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#contact');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.contact}
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#contact');
                }}
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)' }}
              >
                {t.techSupport}
              </a>
              <a href="/web/insights" className="hov-acc" style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>
                {t.resources}
              </a>
              <button
                type="button"
                onClick={handleStartProject}
                className="hov-acc"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  textAlign: 'left',
                  color: 'var(--accent, #C3F910)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  marginTop: 4,
                }}
              >
                {t.startProject}
              </button>
            </div>
          </div>

          {/* Column 4: HEADQUARTERS */}
          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '.22em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {t.hq}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--dark-text-2, #c9c7c1)',
                whiteSpace: 'pre-line',
              }}
            >
              PixiaTech International
              14 Avenue des Champs-Élysées
              75008 Paris / France
            </div>
            <div
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 22,
                fontSize: 12.5,
                letterSpacing: '.1em',
              }}
            >
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)', textDecoration: 'none' }}
              >
                LINKEDIN
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hov-acc"
                style={{ color: 'var(--dark-text-2, #c9c7c1)', textDecoration: 'none' }}
              >
                INSTAGRAM
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            padding: '26px 0',
            fontSize: 11.5,
            letterSpacing: '.14em',
            color: 'var(--dark-muted, #7a7a76)',
            flexWrap: 'wrap',
            fontFamily: 'monospace',
          }}
        >
          <span>{t.location}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#site-footer" className="hov-acc">
              {t.privacy}
            </a>
            <a href="#site-footer" className="hov-acc">
              {t.cookies}
            </a>
            <a href="#site-footer" className="hov-acc">
              {t.legal}
            </a>
          </div>
          <span>{lang === 'FR' ? 'FR' : 'EN'}</span>
        </div>
      </div>

      {/* Footer Giant Text Logo spanning the footer width */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '8px 0 30px',
          overflow: 'hidden',
          userSelect: 'none',
          lineHeight: 0,
        }}
      >
        <a
          href="https://pixiatech.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-tech text-2xl lg:text-3xl tracking-widest hover:opacity-80 transition-opacity"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            fontSize: 'clamp(64px, 12.5vw, 230px)',
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: '#f5f4f0',
            opacity: 0.05,
            textDecoration: 'none',
          }}
        >
          PIXIATECH
        </a>
      </div>
    </footer>
  );
};