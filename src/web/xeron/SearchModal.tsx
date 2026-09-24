'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CATALOG_PRODUCTS } from './xeron-catalog';
import { Language } from '../xeron-translations';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  onSelectProduct?: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, lang, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  const quickLinks = [
    { label: 'PXT Fine', action: () => { onSelectProduct?.('wp'); onClose(); } },
    { label: lang === 'FR' ? 'Écran Cinétique' : 'Kinetic Screen', hash: '#featured' },
    { label: 'ColdLED', hash: '#technology' },
    { label: lang === 'FR' ? 'Marchés & Projets' : 'Markets & Projects', hash: '#markets' },
    { label: 'Showreel 3D', hash: '#showreel' },
    { label: lang === 'FR' ? 'Spécifications' : 'Specifications', hash: '#specs' },
  ];

  const filteredProducts = q
    ? CATALOG_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.menuTag.toLowerCase().includes(q) ||
          p.pitch.toLowerCase().includes(q) ||
          p.shortDescFr.toLowerCase().includes(q) ||
          p.shortDescEn.toLowerCase().includes(q)
      )
    : [];

  const handleSelectLink = (hash?: string, action?: () => void) => {
    if (action) {
      action();
    } else if (hash) {
      window.location.hash = hash;
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: 'smooth' });
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(40px, 12vh, 120px) 20px 40px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#0c0c0b',
          border: '1px solid #222',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          color: '#f5f4f0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '20px 24px',
            borderBottom: '1px solid #1a1a19',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7A76" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'FR' ? 'Rechercher un produit, une technologie, un marché...' : 'Search products, technology, markets...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: '#fff',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#666',
              padding: '3px 6px',
              border: '1px solid #262624',
              borderRadius: 3,
            }}
          >
            ESC
          </span>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '65vh', overflowY: 'auto' }}>
          {!q ? (
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.22em',
                  color: '#7A7A76',
                  marginBottom: 12,
                  fontFamily: 'monospace',
                }}
              >
                {lang === 'FR' ? 'ACCÈS RAPIDE' : 'QUICK ACCESS'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {quickLinks.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectLink(item.hash, item.action)}
                    style={{
                      background: '#141413',
                      border: '1px solid #222',
                      color: '#c9c7c1',
                      padding: '8px 14px',
                      fontSize: 12,
                      letterSpacing: '.06em',
                      cursor: 'pointer',
                      transition: 'all .2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C3F910';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#222';
                      e.currentTarget.style.color = '#c9c7c1';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#666' }}>
                  {lang === 'FR' ? `Aucun résultat pour "${query}"` : `No results found for "${query}"`}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '.22em',
                      color: '#7A7A76',
                      marginBottom: 8,
                      fontFamily: 'monospace',
                    }}
                  >
                    {filteredProducts.length} {lang === 'FR' ? 'PRODUITS TROUVÉS' : 'PRODUCTS FOUND'}
                  </div>
                  {filteredProducts.map((p) => (
                    <div
                      key={p.slug}
                      onClick={() => {
                        onSelectProduct?.(p.slug);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '12px 14px',
                        background: '#121211',
                        border: '1px solid #1c1c1b',
                        cursor: 'pointer',
                        transition: 'all .2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#C3F910';
                        e.currentTarget.style.background = '#181816';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1c1c1b';
                        e.currentTarget.style.background = '#121211';
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={p.name}
                        style={{ width: 48, height: 48, objectFit: 'cover', background: '#000' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{p.name}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: '#C3F910',
                              letterSpacing: '.12em',
                            }}
                          >
                            {p.menuTag}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#888',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 2,
                          }}
                        >
                          {lang === 'FR' ? p.shortDescFr : p.shortDescEn}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#666' }}>{p.pitch}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};