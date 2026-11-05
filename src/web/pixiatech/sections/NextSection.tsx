'use client';

import React, { useState } from 'react';
import { translations, Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface NextSectionProps {
  onOpenConsultation?: () => void;
  lang?: Language;
}

export const NextSection: React.FC<NextSectionProps> = ({ onOpenConsultation, lang = 'FR' }) => {
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.contact as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const t = translations[lang].next;
  const [hovCard1, setHovCard1] = useState(false);
  const [hovCard2, setHovCard2] = useState(false);
  const [hovBtn, setHovBtn] = useState(false);

  return (
    <section
      id="next"
      className="theme-dark bg-[#080808] text-[#f5f4f0] border-t border-[#1f1f1f]"
      style={{
        position: 'relative',
        paddingTop: 'clamp(90px, 10vh, 130px)',
        paddingBottom: 'clamp(90px, 10vh, 130px)',
        paddingLeft: 0,
        paddingRight: 0,
        ...cms.section,
      }}
    >
      {cms.hasOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: cms.overlayColor,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="#hero"
            className="block border p-8 transition-colors duration-300"
            style={{
              borderColor: hovCard1 ? 'var(--accent, #C3F910)' : '#1f1f1f',
            }}
            onMouseEnter={() => setHovCard1(true)}
            onMouseLeave={() => setHovCard1(false)}
          >
            <div className="text-[10.5px] tracking-[0.2em] text-[#7a7a76] mb-3.5 uppercase font-mono">{t.prevSeries}</div>
            <div
              className="text-[clamp(22px,2.2vw,32px)] font-bold transition-colors"
              style={{ color: hovCard1 ? 'var(--accent, #C3F910)' : '#ffffff' }}
            >
              WK Series
            </div>
            <div className="text-[13px] text-[#7a7a76] mt-1.5">{t.seriesDesc}</div>
          </a>

          <a
            href="#hero"
            className="block border p-8 text-left md:text-right transition-colors duration-300"
            style={{
              borderColor: hovCard2 ? 'var(--accent, #C3F910)' : '#1f1f1f',
            }}
            onMouseEnter={() => setHovCard2(true)}
            onMouseLeave={() => setHovCard2(false)}
          >
            <div className="text-[10.5px] tracking-[0.2em] text-[#7a7a76] mb-3.5 uppercase font-mono">{t.nextSeries}</div>
            <div
              className="text-[clamp(22px,2.2vw,32px)] font-bold transition-colors"
              style={{ color: hovCard2 ? 'var(--accent, #C3F910)' : '#ffffff' }}
            >
              PXT Ultra
            </div>
            <div className="text-[13px] text-[#7a7a76] mt-1.5">{t.seriesDesc}</div>
          </a>
        </div>

        <div className="flex justify-between items-center gap-7 flex-wrap border-t border-[#1f1f1f] mt-[72px] pt-16">
          <h2
            className="text-[clamp(34px,3.6vw,58px)] font-bold tracking-tight leading-[1.06] text-[#f5f4f0] m-0"
            style={{ ...cms.title }}
          >
            {t.ctaTitle1}
            <br />
            {t.ctaTitle2}
          </h2>
          <button
            type="button"
            data-href="/web/contact"
            onClick={(e) => {
              if (document.body.classList.contains('cms-editing')) return;
              window.location.href = '/web/contact';
            }}
            className="btn btn-solid py-5 px-9 text-[14px] font-semibold tracking-[0.06em] transition-all cursor-pointer"
            style={{
              backgroundColor: hovBtn ? 'var(--accent, #C3F910)' : '#ffffff',
              color: '#000000',
              borderColor: hovBtn ? 'var(--accent, #C3F910)' : '#ffffff',
            }}
            onMouseEnter={() => setHovBtn(true)}
            onMouseLeave={() => setHovBtn(false)}
          >
            {t.ctaBtn}
          </button>
        </div>
      </div>
    </section>
  );
};
