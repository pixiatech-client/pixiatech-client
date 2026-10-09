'use client';

import React, { useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRegisterCmsSection } from '@/web/cms/useRegisterCmsSection';
import { Language } from '../pixiatech-translations';
import { OrbCanvas } from '../components/OrbCanvas';

interface PixiaFooterProps {
  companyName?: string;
  lang?: Language;
  onOpenConsultation?: () => void;
}

const FOOTER_CSS = `
  #site-footer a, #site-footer button, #site-footer input {
    pointer-events: auto !important;
  }
  #site-footer a:hover, #site-footer button:hover {
    color: #C3F910 !important;
    transform: translateX(3px);
  }
  #site-footer .footer-legal-link:hover {
    color: #000000 !important;
    transform: none !important;
  }
`;

export const PixiaFooter: React.FC<PixiaFooterProps> = ({
  companyName = 'PIXIATECH',
  lang = 'FR',
  onOpenConsultation,
}) => {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const isHistorical = pathname.startsWith('/web');
  const webLink = (path: string) => (isHistorical ? (path === '/' ? '/web' : `/web${path}`) : path);

  const footerRootRef = useRef<HTMLElement>(null);
  const scrollTo = (hash: string) => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = isHistorical ? `/web${hash}` : `/${hash}`;
    }
  };

  const handleStartProject = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = 'https://app.pixiatech.com/';
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

  // Racine CMS du footer : le <footer> reste tel quel, on enregistre seulement
  // le nœud pour que les styles d'élément soient calculés et réappliqués.
  useRegisterCmsSection(footerRootRef, 'footer');

  return (
    <footer
      id="site-footer"
      ref={footerRootRef}
      style={{
        position: 'relative',
        background: 'var(--black-4, #050505)',
        color: 'var(--dark-text, #f5f4f0)',
        overflow: 'hidden',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      {/* ── Scoped rule: allow clicking links/buttons while letting canvas catch background mousemove ──
          CSS statique injecté via dangerouslySetInnerHTML : écrit comme enfant
          texte, le rendu serveur peut émettre un <style/> vide, et l'hydratation
          échoue ensuite sur ce nœud texte. En innerHTML, il n'y a plus d'enfant
          texte à comparer entre le HTML serveur et l'arbre client. */}
      <style dangerouslySetInnerHTML={{ __html: FOOTER_CSS }} />

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
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#C3F910',
                marginBottom: 20,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {t.products}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a href={webLink('/product/pxt-fine')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                XR Fine (WP Series)
              </a>
              <a href={webLink('/products')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                XR Vision (MV Series)
              </a>
              <a href={webLink('/products')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                XR Flex (AR MKII)
              </a>
              <a href={webLink('/products')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                XR Studio (VP Series)
              </a>
              <a
                href={webLink('/products')}
                style={{
                  color: '#C3F910',
                  fontWeight: 700,
                  marginTop: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all .2s ease',
                  textDecoration: 'none',
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
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#C3F910',
                marginBottom: 20,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {t.company}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a
                href={webLink('/#manifesto')}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#manifesto');
                }}
                style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}
              >
                {t.about}
              </a>
              <a
                href={webLink('/#projects')}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#projects');
                }}
                style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}
              >
                {t.projects}
              </a>
              <a
                href={webLink('/#technology')}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#technology');
                }}
                style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}
              >
                {t.technology}
              </a>
              <a
                href={webLink('/#experience')}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('#experience');
                }}
                style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}
              >
                {t.experienceCenter}
              </a>
            </div>
          </div>

          {/* Column 3: SUPPORT */}
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#C3F910',
                marginBottom: 20,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {t.support}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <a href={webLink('/contact')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                {t.contact}
              </a>
              <a href={webLink('/contact')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                {t.techSupport}
              </a>
              <a href={webLink('/insights')} style={{ color: 'var(--dark-text-2, #c9c7c1)', transition: 'all .2s ease', textDecoration: 'none' }}>
                {t.resources}
              </a>
              <button
                type="button"
                onClick={handleStartProject}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  textAlign: 'left',
                  color: '#C3F910',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  marginTop: 6,
                  transition: 'all .2s ease',
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
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#C3F910',
                marginBottom: 20,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
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
                gap: 12,
                marginTop: 22,
                fontSize: 11,
                letterSpacing: '.12em',
              }}
            >
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--dark-text-2, #c9c7c1)',
                  textDecoration: 'none',
                  border: '1px solid rgba(195, 249, 16, 0.25)',
                  padding: '6px 12px',
                  borderRadius: 2,
                  transition: 'all .2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C3F910';
                  e.currentTarget.style.color = '#C3F910';
                  e.currentTarget.style.background = 'rgba(195, 249, 16, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(195, 249, 16, 0.25)';
                  e.currentTarget.style.color = 'var(--dark-text-2, #c9c7c1)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                LINKEDIN
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--dark-text-2, #c9c7c1)',
                  textDecoration: 'none',
                  border: '1px solid rgba(195, 249, 16, 0.25)',
                  padding: '6px 12px',
                  borderRadius: 2,
                  transition: 'all .2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C3F910';
                  e.currentTarget.style.color = '#C3F910';
                  e.currentTarget.style.background = 'rgba(195, 249, 16, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(195, 249, 16, 0.25)';
                  e.currentTarget.style.color = 'var(--dark-text-2, #c9c7c1)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                INSTAGRAM
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone Inférieure : Animation Fluid WebGL (OrbCanvas) contenue strictement ici ──
          Le fluide ne doit PAS remonter dans la grille du dessus (PRODUITS /
          ENTREPRISE / SUPPORT / SIEGE SOCIAL) : le canvas est donc un enfant de
          cette zone, pas du <footer>. Il n'est pas visible tant que la zone
          basse n'est pas atteinte, et le curseur n'y réagit qu'une fois dedans. */}
      <div
        className="footer-bottom-zone"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* ── Animated WebGL Fluid background (helloshivam.com) ── */}
        <OrbCanvas />

        {/* Bottom Sub-bar */}
        <div className="wrap" style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
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
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#C3F910',
                  boxShadow: '0 0 8px #C3F910',
                  display: 'inline-block',
                }}
              />
              {t.location}
            </span>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <a
                href="/politique-confidentialite"
                className="footer-legal-link"
                style={{ color: 'inherit', transition: 'color .2s', textDecoration: 'none' }}
              >
                {t.privacy}
              </a>
              <a
                href="/gestion-cookies"
                className="footer-legal-link"
                style={{ color: 'inherit', transition: 'color .2s', textDecoration: 'none' }}
              >
                {t.cookies}
              </a>
              <a
                href="/mentions-legales"
                className="footer-legal-link"
                style={{ color: 'inherit', transition: 'color .2s', textDecoration: 'none' }}
              >
                {t.legal}
              </a>
            </div>
            <span style={{ color: '#C3F910', fontWeight: 700 }}>{lang === 'FR' ? 'FR' : 'EN'}</span>
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
            pointerEvents: 'none',
          }}
        >
          <a
            href="https://pixiatech.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontSize: 'clamp(64px, 12.5vw, 230px)',
              lineHeight: 1,
              letterSpacing: '0.08em',
              color: '#FFFFFF',
              opacity: 0.03,
              textDecoration: 'none',
              transition: 'all .4s ease',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.08';
              e.currentTarget.style.textShadow = '0 0 50px rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.03';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            PIXIATECH
          </a>
        </div>
      </div>
    </footer>
  );
};
