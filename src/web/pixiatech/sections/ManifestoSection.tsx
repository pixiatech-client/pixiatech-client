'use client';

import React, { useEffect, useRef } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface ManifestoSectionProps {
  lang?: Language;
}

export const ManifestoSection: React.FC<ManifestoSectionProps> = ({ lang = 'FR' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.manifesto as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const t = {
    eyebrow: getCmsText(
      cmsData,
      'badge',
      activeLang,
      getCmsText(cmsData, 'eyebrow', activeLang, activeLang === 'fr' ? '01 / MANIFESTE' : '01 / MANIFESTO')
    ),
    line1: getCmsText(
      cmsData,
      'title',
      activeLang,
      activeLang === 'fr' ? 'Nous ne plaçons pas des écrans dans des espaces.' : "We don't place screens into spaces."
    ),
    line2: getCmsText(
      cmsData,
      'titleLine2',
      activeLang,
      activeLang === 'fr' ? 'Nous faisons des écrans' : 'We make screens'
    ),
    line3: getCmsText(
      cmsData,
      'titleLine3',
      activeLang,
      activeLang === 'fr' ? "une partie intégrante de l'espace." : 'part of the space.'
    ),
    body:
      getCmsText(cmsData, 'description', activeLang) ||
      getCmsText(
        cmsData,
        'subtitle',
        activeLang,
        activeLang === 'fr'
          ? 'PIXIATECH combine des technologies LED de pointe, une ingénierie de précision et une vision architecturale pour concevoir des systèmes visuels conçus sur-mesure autour de chaque environnement.'
          : 'PIXIATECH combines advanced LED technologies, engineering and architectural thinking to create visual systems designed around each environment.'
      ),
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mouseX = -9999;
    let mouseY = -9999;
    let animFrame = 0;

    const render = () => {
      animFrame = 0;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);

      for (let y = 30; y < h; y += 30) {
        for (let x = 30; x < w; x += 30) {
          const dist = Math.hypot(x - mouseX, y - mouseY);
          const alpha = dist < 180 ? 0.05 + (1 - dist / 180) * 0.3 : 0.05;
          ctx.fillStyle = `rgba(17,17,16,${alpha.toFixed(3)})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    };

    const scheduleRender = () => {
      if (!animFrame) animFrame = requestAnimationFrame(render);
    };
    scheduleRender();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      scheduleRender();
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      scheduleRender();
    };

    if (!prefersReducedMotion) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    const ro = new ResizeObserver(scheduleRender);
    ro.observe(parent);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      ro.disconnect();
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <section
      id="manifesto"
      className="theme-light"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#f5f4f0',
        color: '#111110',
        borderBottom: '1px solid #e5e4de',
        // CMS overrides
        ...cms.section,
      }}
    >
      <span id="about" style={{ display: 'block', height: 0 }} />
      {/* CMS Background image overlay */}
      {cms.hasOverlay && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: cms.overlayColor, pointerEvents: 'none', zIndex: 0 }} />
      )}
      {/* Interactive Pixel Grid reactive to mouse */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      <div className="wrap sec-manifesto" style={{ position: 'relative', zIndex: 1 }}>
        <div
          data-reveal="true"
          style={{
            fontSize: 11,
            letterSpacing: '.24em',
            color: 'var(--muted)',
            marginBottom: 40,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
        >
          {t.eyebrow}
        </div>

        <h2
          data-reveal="true"
          className="pretty h-manifesto"
          style={{
            margin: '0 0 44px',
            lineHeight: 1.06,
            maxWidth: 1180,
            // CMS typography overrides
            ...cms.title,
          }}
        >
          <span>{t.line1}<br /></span>
          <span>{t.line2} <span style={{ color: 'var(--accent, #C3F910)' }}>{t.line3}</span></span>
        </h2>

        <p
          data-reveal="true"
          className="pretty"
          style={{
            margin: 0,
            maxWidth: 560,
            fontSize: 18,
            lineHeight: 1.65,
            color: 'var(--body, #4a4a46)',
          }}
        >
          {t.body}
        </p>
      </div>
    </section>
  );
};
