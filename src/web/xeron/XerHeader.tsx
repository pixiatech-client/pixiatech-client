'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_PRODUCTS, MEGA_COLUMNS } from './xeron-catalog';
import { Language } from '../xeron-translations';
import { SearchModal } from './SearchModal';
import { Shield } from 'lucide-react';

interface XerHeaderProps {
  companyName?: string;
  onOpenConsultation?: () => void;
  lang?: Language;
  onToggleLang?: () => void;
  forceSolidDark?: boolean;
}

export const XerHeader: React.FC<XerHeaderProps> = ({
  companyName = 'PIXIATECH',
  onOpenConsultation,
  lang = 'EN',
  onToggleLang,
  forceSolidDark = false,
}) => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string>('wp');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<'main' | 'products'>('main');
  const [searchOpen, setSearchOpen] = useState(false);

  const prevScrollRef = useRef(0);

  // Scroll listener matching xeron.co
  useEffect(() => {
    let anim = 0;
    const handleScroll = () => {
      if (!anim) {
        anim = requestAnimationFrame(() => {
          anim = 0;
          const y = window.scrollY;
          setScrolled(y > 40);
          if (megaOpen && Math.abs(y - prevScrollRef.current) > 40) {
            setMegaOpen(false);
          }
          prevScrollRef.current = y;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [megaOpen]);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeProduct =
    CATALOG_PRODUCTS.find((p) => p.slug === hoveredSlug) || CATALOG_PRODUCTS[0];

  // Render-only port: every product series currently resolves to the PXT Fine page.
  const handleProductClick = (slug: string) => {
    setMegaOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    router.push('/web/pxt-fine');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavAnchor = (hash: string) => {
    setMegaOpen(false);
    setMobileMenuOpen(false);
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const isDarkBar = forceSolidDark || scrolled || megaOpen;

  return (
    <>
      <div
        onMouseLeave={() => setMegaOpen(false)}
        style={{
          position: 'fixed',
          top: 'var(--admin-bar-h, 0px)',
          left: 0,
          right: 0,
          zIndex: 200,
        }}
      >
        <style>{`
          .pxt-nav-link {
            font-size: 11.5px;
            letter-spacing: .17em;
            text-transform: uppercase;
            font-weight: 600;
            color: #B9B7B1;
            padding: 10px 0;
            border-bottom: 1px solid transparent;
            white-space: nowrap;
            transition: color .25s ease, border-color .25s ease;
            text-decoration: none;
            cursor: pointer;
          }
          .pxt-nav-link:hover, .pxt-nav-link.active {
            color: #ffffff !important;
            border-bottom-color: #C3F910 !important;
          }
          .mega-card-item:hover .mega-title {
            color: #C3F910 !important;
          }
          @media (max-width: 900px) {
            .nav-desktop-links { display: none !important; }
            .nav-desktop-cta { display: none !important; }
            .nav-burger-btn { display: inline-flex !important; }
          }
        `}</style>

        {/* Top Navbar */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(12px, 2vw, 36px)',
            padding: '0 clamp(16px, 2.8vw, 60px)',
            height: scrolled ? 64 : 88,
            background: isDarkBar ? 'rgba(8,8,8,.84)' : 'transparent',
            backdropFilter: isDarkBar ? 'blur(22px) saturate(1.3)' : 'none',
            WebkitBackdropFilter: isDarkBar ? 'blur(22px) saturate(1.3)' : 'none',
            borderBottom: '1px solid ' + (isDarkBar ? 'rgba(245,244,240,.09)' : 'transparent'),
            transition:
              'background .45s ease, border-color .45s ease, height .45s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {/* Logo / Brand Name */}
          <a
            href="https://pixiatech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-tech text-2xl lg:text-3xl tracking-widest hover:opacity-80 transition-opacity"
          >
            PIXIATECH
          </a>

          {/* Desktop Navigation Links */}
          <div
            className="nav-desktop-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 1.8vw, 34px)',
              minWidth: 0,
              flex: '0 1 auto',
            }}
          >
            {/* Products trigger: hover opens Mega Menu */}
            <span
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((prev) => !prev)}
              className={`pxt-nav-link ${megaOpen ? 'active' : ''}`}
            >
              {lang === 'FR' ? 'PRODUITS' : 'PRODUCTS'} ▾
            </span>

            {/* In-page anchors with smooth scroll */}
            <a
              href="#markets"
              onClick={(e) => {
                e.preventDefault();
                handleNavAnchor('#markets');
              }}
              className="pxt-nav-link"
            >
              {lang === 'FR' ? 'MARCHÉS' : 'MARKETS'}
            </a>

            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                handleNavAnchor('#projects');
              }}
              className="pxt-nav-link"
            >
              {lang === 'FR' ? 'PROJETS' : 'PROJECTS'}
            </a>

            <a
              href="#technology"
              onClick={(e) => {
                e.preventDefault();
                handleNavAnchor('#technology');
              }}
              className="pxt-nav-link"
            >
              {lang === 'FR' ? 'TECHNOLOGIE' : 'TECHNOLOGY'}
            </a>

            <a
              href="#manifesto"
              onClick={(e) => {
                e.preventDefault();
                handleNavAnchor('#manifesto');
              }}
              className="pxt-nav-link"
            >
              {lang === 'FR' ? 'À PROPOS' : 'ABOUT'}
            </a>

            <a
              href="/web/insights"
              onClick={(e) => {
                e.preventDefault();
                setMegaOpen(false);
                setMobileMenuOpen(false);
                router.push('/web/insights');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="pxt-nav-link"
            >
              {lang === 'FR' ? 'RESSOURCES' : 'RESOURCES'}
            </a>
          </div>

          {/* Right Action Icons & CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 1.6vw, 24px)',
              flex: 'none',
            }}
          >
            {/* Administration (accès à l'espace admin) — même icône Shield que l'app */}
            <button
              type="button"
              aria-label="Administration"
              title="Administration"
              onClick={() => {
                setMegaOpen(false);
                setMobileMenuOpen(false);
                router.push('/admin');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'transparent',
                border: 0,
                padding: 4,
                cursor: 'pointer',
                color: '#B9B7B1',
                transition: 'color .25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C3F910';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#B9B7B1';
              }}
            >
              <Shield size={18} strokeWidth={2} />
            </button>

            {/* Language Selector: FR / EN */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                letterSpacing: '.14em',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'FR') onToggleLang?.();
                }}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '4px 2px',
                  cursor: 'pointer',
                  color: lang === 'FR' ? '#F5F4F0' : '#7A7A76',
                }}
              >
                FR
              </button>
              <span style={{ color: '#3F3F3F' }}>/</span>
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'EN') onToggleLang?.();
                }}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '4px 2px',
                  cursor: 'pointer',
                  color: lang === 'EN' ? '#F5F4F0' : '#7A7A76',
                }}
              >
                EN
              </button>
            </div>

            <div
              style={{
                width: 1,
                height: 18,
                background: 'rgba(245,244,240,.16)',
              }}
            />

            {/* Search Button (⌘K) */}
            <button
              type="button"
              aria-label="Recherche"
              title="Recherche (⌘K)"
              onClick={() => {
                setMegaOpen(false);
                setSearchOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'transparent',
                border: 0,
                padding: 4,
                cursor: 'pointer',
                color: '#B9B7B1',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
            </button>

            {/* Start a Project CTA Button */}
            <button
              type="button"
              onClick={() => {
                setMegaOpen(false);
                router.push('/');
              }}
              className="nav-desktop-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                border: '1px solid rgba(245,244,240,.35)',
                background: 'transparent',
                color: '#F5F4F0',
                fontSize: 12,
                letterSpacing: '.12em',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,244,240,.35)';
                e.currentTarget.style.color = '#F5F4F0';
              }}
            >
              {lang === 'FR' ? 'Démarrer un projet' : 'Start a Project'}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setMobileMenuOpen((prev) => !prev);
                setMobileSubMenu('main');
              }}
              className="nav-burger-btn"
              style={{
                display: 'none',
                width: 40,
                height: 40,
                border: '1px solid rgba(245,244,240,.35)',
                background: 'transparent',
                color: '#F5F4F0',
                cursor: 'pointer',
                fontSize: 20,
                lineHeight: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mobileMenuOpen ? '×' : '≡'}
            </button>
          </div>
        </nav>

        {/* Mega Menu Dropdown (Xeron style) */}
        {megaOpen && (
          <div
            className="mega"
            style={{
              background: 'rgba(10,10,10,.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid #1F1F1F',
              maxHeight: 'calc(100vh - 90px)',
              overflowY: 'auto',
              color: '#EDEBE6',
            }}
          >
            <div
              style={{
                maxWidth: 1520,
                margin: '0 auto',
                padding: '44px clamp(24px, 3.4vw, 56px) 52px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1.3fr',
                gap: 48,
              }}
            >
              {/* Columns 1, 2, 3 */}
              {MEGA_COLUMNS.map((col, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '.22em',
                      color: '#7A7A76',
                      marginBottom: 20,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                  >
                    {lang === 'FR' ? col.titleFr : col.titleEn}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {col.slugs.map((slug) => {
                      const prod = CATALOG_PRODUCTS.find((p) => p.slug === slug);
                      if (!prod) return null;
                      const isHovered = hoveredSlug === prod.slug;
                      return (
                        <div
                          key={prod.slug}
                          className="mega-card-item"
                          onMouseEnter={() => setHoveredSlug(prod.slug)}
                          onClick={() => handleProductClick(prod.slug)}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <span
                            className="mega-title"
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: isHovered ? '#C3F910' : '#EDEBE6',
                              transition: 'color .2s ease',
                            }}
                          >
                            {prod.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: isHovered ? '#fff' : '#7A7A76',
                              letterSpacing: '.1em',
                            }}
                          >
                            {prod.menuTag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Column 4: Dynamic Interactive Preview */}
              <div
                style={{
                  borderLeft: '1px solid #1F1F1F',
                  paddingLeft: 44,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: 230,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#050505',
                      border: '1px solid #1c1c1b',
                      marginBottom: 18,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProduct.img}
                      alt={activeProduct.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform .4s ease',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.75)',
                        padding: '4px 8px',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#C3F910',
                        letterSpacing: '.1em',
                      }}
                    >
                      {activeProduct.pitch}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '.22em',
                      color: '#7A7A76',
                      marginBottom: 6,
                      fontFamily: 'monospace',
                    }}
                  >
                    {lang === 'FR' ? 'SÉRIE SÉLECTIONNÉE' : 'FEATURED SERIES'}
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 800, color: '#F5F4F0', marginBottom: 6 }}>
                    {activeProduct.name}
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: '#A3A3A3',
                      margin: '0 0 16px',
                      minHeight: 48,
                    }}
                  >
                    {lang === 'FR' ? activeProduct.shortDescFr : activeProduct.shortDescEn}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleProductClick(activeProduct.slug)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'transparent',
                      border: 0,
                      padding: '6px 0',
                      fontSize: 12.5,
                      letterSpacing: '.1em',
                      fontWeight: 700,
                      color: '#C3F910',
                      cursor: 'pointer',
                      borderBottom: '1px solid #C3F910',
                    }}
                  >
                                        {lang === 'FR'
                      ? `Explorer la série ${activeProduct.name} →`
                      : `Explore ${activeProduct.name} Series →`}
                  </button>

                  {/* ALL PRODUCTS → */}
                  <a
                    href="/web/products"
                    onClick={() => setMegaOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 14,
                      fontSize: 11.5,
                      letterSpacing: '.12em',
                      fontWeight: 700,
                      color: '#C3F910',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color .2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderBottomColor = '#C3F910';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderBottomColor = 'transparent';
                    }}
                  >
                    {lang === 'FR' ? 'TOUS LES PRODUITS →' : 'ALL PRODUCTS →'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Mobile Menu with Drill-down & Back behavior */}
        {mobileMenuOpen && (
          <div
            className="nav-mobile"
            style={{
              background: 'rgba(8,8,8,.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid #1F1F1F',
              padding: '20px clamp(16px, 2.8vw, 60px) 32px',
              maxHeight: 'calc(100vh - 88px)',
              overflowY: 'auto',
              color: '#f5f4f0',
            }}
          >
            {/* Search Input trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(245,244,240,.25)',
                color: '#B9B7B1',
                padding: '12px 14px',
                marginBottom: 18,
                cursor: 'pointer',
                fontSize: 13,
                letterSpacing: '.08em',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B9B7B1" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
              {lang === 'FR' ? 'Recherche de produits ou specs (⌘K)' : 'Search products & specs (⌘K)'}
            </button>

            {mobileSubMenu === 'main' ? (
              /* Level 1: Main Menu */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Trigger into Products Submenu */}
                <button
                  type="button"
                  onClick={() => setMobileSubMenu('products')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid #1F1F1F',
                    padding: '14px 0',
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#C3F910',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{lang === 'FR' ? 'PRODUITS & SÉRIES' : 'PRODUCTS & SERIES'}</span>
                  <span style={{ fontSize: 18 }}>›</span>
                </button>

                <a
                  href="#markets"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavAnchor('#markets');
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#EDEBE6',
                    padding: '14px 0',
                    borderBottom: '1px solid #1F1F1F',
                    textDecoration: 'none',
                  }}
                >
                  {lang === 'FR' ? 'MARCHÉS' : 'MARKETS'}
                </a>

                <a
                  href="#projects"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavAnchor('#projects');
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#EDEBE6',
                    padding: '14px 0',
                    borderBottom: '1px solid #1F1F1F',
                    textDecoration: 'none',
                  }}
                >
                  {lang === 'FR' ? 'PROJETS' : 'PROJECTS'}
                </a>

                <a
                  href="#technology"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavAnchor('#technology');
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#EDEBE6',
                    padding: '14px 0',
                    borderBottom: '1px solid #1F1F1F',
                    textDecoration: 'none',
                  }}
                >
                  {lang === 'FR' ? 'TECHNOLOGIE' : 'TECHNOLOGY'}
                </a>

                <a
                  href="#manifesto"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavAnchor('#manifesto');
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#EDEBE6',
                    padding: '14px 0',
                    borderBottom: '1px solid #1F1F1F',
                    textDecoration: 'none',
                  }}
                >
                  {lang === 'FR' ? 'À PROPOS' : 'ABOUT'}
                </a>

                <a
                  href="/web/insights"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    router.push('/web/insights');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#EDEBE6',
                    padding: '14px 0',
                    borderBottom: '1px solid #1F1F1F',
                    textDecoration: 'none',
                  }}
                >
                  {lang === 'FR' ? 'RESSOURCES' : 'RESOURCES'}
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/');
                  }}
                  style={{
                    marginTop: 20,
                    padding: '14px',
                    background: 'transparent',
                    border: '1px solid #f5f4f0',
                    color: '#f5f4f0',
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'FR' ? 'Démarrer un projet' : 'Start a Project'}
                </button>

                {/* All products quick list */}
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '.22em',
                    color: '#7A7A76',
                    margin: '24px 0 10px',
                    fontFamily: 'monospace',
                  }}
                >
                  {lang === 'FR' ? 'SÉRIES PHARE' : 'FEATURED SERIES'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  {CATALOG_PRODUCTS.slice(0, 6).map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => handleProductClick(p.slug)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: '6px 0',
                        textAlign: 'left',
                        color: '#C9C7C1',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Level 2: Products Submenu with Back button */
              <div>
                {/* Back to main menu button */}
                <button
                  type="button"
                  onClick={() => setMobileSubMenu('main')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#181816',
                    border: '1px solid #333',
                    color: '#C3F910',
                    padding: '12px 16px',
                    width: '100%',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.14em',
                    cursor: 'pointer',
                    marginBottom: 16,
                  }}
                >
                  ← {lang === 'FR' ? 'RETOUR AU MENU PRINCIPAL' : 'BACK TO MAIN MENU'}
                </button>

                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '.22em',
                    color: '#7A7A76',
                    marginBottom: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {lang === 'FR' ? 'CHOISIR UNE SÉRIE D\'AFFICHAGE' : 'SELECT A DISPLAY SERIES'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CATALOG_PRODUCTS.map((p) => (
                    <div
                      key={p.slug}
                      onClick={() => handleProductClick(p.slug)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 12px',
                        background: '#121211',
                        border: '1px solid #1c1c1b',
                        cursor: 'pointer',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={p.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', background: '#000' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.name}</span>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#C3F910' }}>
                            {p.pitch}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#888',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lang === 'FR' ? p.shortDescFr : p.shortDescEn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
        onSelectProduct={(slug) => {
          handleProductClick(slug);
        }}
      />
    </>
  );
};