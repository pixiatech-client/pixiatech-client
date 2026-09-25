'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_PRODUCTS, MEGA_COLUMNS, type CatalogProduct } from './xeron-catalog';
import { Language } from '../xeron-translations';
import { SearchModal } from './SearchModal';
import { Shield } from 'lucide-react';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import type { ProductRecord, MegaMenu, MegaMenuItem } from '@/lib/products/types';
import { trackProductClick } from '@/lib/analytics/tracker';

interface XerHeaderProps {
  companyName?: string;
  onOpenConsultation?: () => void;
  lang?: Language;
  onToggleLang?: () => void;
  forceSolidDark?: boolean;
}

export const XerHeader: React.FC<XerHeaderProps> = (props) => (
  <ProductsProvider>
    <XerHeaderContent {...props} />
  </ProductsProvider>
);

interface MenuItemModel {
  id: string;
  label: string;
  tag: string;
  clickable: boolean;
  productSlug: string | null;
  catalogSlug: string | null;
  product: ProductRecord | null;
  legacy: CatalogProduct | null;
  img: string | null;
  descEn: string;
  descFr: string;
}

interface MenuColumnModel {
  id: string;
  titleEn: string;
  titleFr: string;
  items: MenuItemModel[];
}

function productImg(p: ProductRecord | null): string | null {
  return p?.media?.photos?.find((ph) => ph.url)?.url ?? p?.hero?.image ?? null;
}

function makeModel(
  item: MegaMenuItem,
  productBySlug: Map<string, ProductRecord>,
  legacyBySlug: Map<string, CatalogProduct>
): MenuItemModel {
  const product = item.productSlug ? productBySlug.get(item.productSlug) ?? null : null;
  const legacy = item.catalogSlug ? legacyBySlug.get(item.catalogSlug) ?? null : null;
  const clickable = !!product && product.status === 'published';
  return {
    id: item.id,
    label: item.label || product?.name || legacy?.name || '',
    tag: legacy?.menuTag ?? product?.hero?.tags?.[0] ?? '',
    clickable,
    productSlug: item.productSlug ?? null,
    catalogSlug: item.catalogSlug ?? null,
    product,
    legacy,
    img: productImg(product) ?? legacy?.img ?? null,
    descEn: product?.description?.shortEn ?? legacy?.shortDescEn ?? '',
    descFr: product?.description?.shortFr ?? legacy?.shortDescFr ?? '',
  };
}

function buildMenuModel(
  menu: MegaMenu | null,
  products: ProductRecord[]
): { columns: MenuColumnModel[]; flat: MenuItemModel[] } {
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const legacyBySlug = new Map(CATALOG_PRODUCTS.map((p) => [p.slug, p]));
  const configured =
    menu && Array.isArray(menu.columns) && menu.columns.length > 0 ? menu.columns : null;
  let columns: MenuColumnModel[];
  if (configured) {
    columns = configured
      .filter((c) => c && typeof c === 'object' && Array.isArray(c.items))
      .map((c) => ({
        id: c.id || 'col',
        titleEn: c.titleEn ?? '',
        titleFr: c.titleFr ?? '',
        items: c.items
          .filter((i) => i && typeof i === 'object')
          .filter((i) => i.visible !== false)
          .map((i) => makeModel(i, productBySlug, legacyBySlug))
          .filter((m) => m.label),
      }));
  } else {
    columns = MEGA_COLUMNS.map((col, ci) => ({
      id: `legacy-col-${ci}`,
      titleEn: col.titleEn,
      titleFr: col.titleFr,
      items: col.slugs
        .map((slug) =>
          makeModel(
            {
              id: `legacy-${slug}`,
              label: legacyBySlug.get(slug)?.name ?? slug,
              productSlug: productBySlug.has(slug) ? slug : null,
              catalogSlug: slug,
              visible: true,
            },
            productBySlug,
            legacyBySlug
          )
        )
        .filter((m) => m.label),
    }));
  }
  const flat = columns.flatMap((c) => c.items);
  return { columns, flat };
}

const XerHeaderContent: React.FC<XerHeaderProps> = ({
  companyName = 'PIXIATECH',
  onOpenConsultation,
  lang = 'EN',
  onToggleLang,
  forceSolidDark = false,
}) => {
  const router = useRouter();
  const { products, menu } = useProducts();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string>('wp');
  const [previewImgFailed, setPreviewImgFailed] = useState(false);
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

  const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  const model = useMemo(() => buildMenuModel(menu, products), [menu, products]);

  const hoveredItem =
    model.flat.find((m) => m.id === hoveredItemId) ?? model.flat.find((m) => m.clickable) ?? null;

  const preview = hoveredItem;
  const previewName = preview?.label ?? '';
  const previewImgRaw = preview?.img ?? null;
  useEffect(() => setPreviewImgFailed(false), [previewImgRaw]);
  const previewImg = previewImgRaw && !previewImgFailed ? previewImgRaw : null;
  const previewPitch = preview?.legacy?.pitch ?? '';
  const previewDesc = lang === 'FR' ? preview?.descFr ?? '' : preview?.descEn ?? '';

  const navigateTo = (target: { clickable: boolean; productSlug: string | null }) => {
    if (!target.clickable || !target.productSlug) return;
    setMegaOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    trackProductClick(target.productSlug);
    router.push(`/web/product/${target.productSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateBySlug = (slug: string) => {
    const p = productBySlug.get(slug);
    if (p && p.status === 'published') {
      navigateTo({ clickable: true, productSlug: p.slug });
    }
  };

  const handleNavAnchor = (hash: string) => {
    setMegaOpen(false);
    setMobileMenuOpen(false);
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === 'published')
        .map((p) => ({
          slug: p.slug,
          name: p.name,
          tag: p.hero?.tags?.[0] ?? '',
          shortEn: p.description?.shortEn ?? '',
          shortFr: p.description?.shortFr ?? '',
          img: productImg(p) ?? '',
        })),
    [products]
  );

  const clickableCount = model.flat.filter((m) => m.clickable).length;

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
              aria-label={lang === 'FR' ? 'Recherche' : 'Search'}
              title={lang === 'FR' ? 'Recherche (⌘K)' : 'Search (⌘K)'}
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
              {model.columns.map((col) => (
                <div key={col.id}>
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
                    {col.items.map((m) => {
                      const isHovered = hoveredItem?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          className="mega-card-item"
                          onMouseEnter={() => setHoveredItemId(m.id)}
                          onClick={() => navigateTo(m)}
                          style={{
                            cursor: m.clickable ? 'pointer' : 'default',
                            opacity: m.clickable ? 1 : 0.45,
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
                            {m.label}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: isHovered ? '#fff' : '#7A7A76',
                              letterSpacing: '.1em',
                            }}
                          >
                            {m.tag || (m.clickable ? '' : lang === 'FR' ? 'INDISPONIBLE' : 'UNAVAILABLE')}
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
                    {previewImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImg}
                        alt={previewName}
                        onError={() => setPreviewImgFailed(true)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform .4s ease',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontFamily: 'monospace',
                          letterSpacing: '.22em',
                          textTransform: 'uppercase',
                          color: '#3F3F3F',
                          padding: 20,
                          textAlign: 'center',
                        }}
                      >
                        {previewName || '—'}
                      </div>
                    )}
                    {previewPitch && (
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
                        {previewPitch}
                      </div>
                    )}
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
                    {previewName || '—'}
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
                    {previewDesc}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => preview && navigateTo(preview)}
                    disabled={!preview?.clickable}
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
                      cursor: preview?.clickable ? 'pointer' : 'default',
                      opacity: preview?.clickable ? 1 : 0.4,
                      borderBottom: preview?.clickable ? '1px solid #C3F910' : '1px solid #3b4526',
                    }}
                  >
                    {preview?.clickable
                      ? lang === 'FR'
                        ? `Explorer la série ${preview.label} →`
                        : `Explore ${preview.label} Series →`
                      : lang === 'FR'
                        ? 'Série indisponible pour le moment'
                        : 'Series currently unavailable'}
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
                  {model.flat
                    .filter((m) => m.clickable)
                    .slice(0, 6)
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => navigateTo(m)}
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
                        {m.label}
                      </button>
                    ))}
                </div>
                {clickableCount === 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#7A7A76',
                      padding: '6px 0',
                    }}
                  >
                    {lang === 'FR'
                      ? 'Aucune série disponible pour le moment.'
                      : 'No series available at the moment.'}
                  </p>
                )}
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

                {model.columns.map((col) => (
                  <div key={col.id} style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: 10.5,
                        letterSpacing: '.22em',
                        color: '#7A7A76',
                        marginBottom: 8,
                        fontFamily: 'monospace',
                      }}
                    >
                      {lang === 'FR' ? col.titleFr : col.titleEn}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {col.items.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => navigateTo(m)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 12px',
                            background: '#121211',
                            border: '1px solid #1c1c1b',
                            cursor: m.clickable ? 'pointer' : 'default',
                            opacity: m.clickable ? 1 : 0.5,
                          }}
                        >
                          {m.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.img}
                              alt={m.label}
                              style={{ width: 44, height: 44, objectFit: 'cover', background: '#000' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#181816',
                                border: '1px solid #242423',
                                fontSize: 9,
                                fontFamily: 'monospace',
                                letterSpacing: '.1em',
                                color: '#7A7A76',
                              }}
                            >
                              {m.label.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.label}</span>
                              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#C3F910' }}>
                                {m.tag}
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
                              {lang === 'FR' ? m.descFr : m.descEn}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
        products={searchProducts}
        onSelectProduct={(slug) => {
          navigateBySlug(slug);
        }}
      />
    </>
  );
};