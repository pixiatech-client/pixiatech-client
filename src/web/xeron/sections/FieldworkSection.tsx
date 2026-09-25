'use client';

import React from 'react';
import { translations, Language } from '../../xeron-translations';

interface FieldworkSectionProps {
  companyName: string;
  lang?: Language;
}

export const FieldworkSection: React.FC<FieldworkSectionProps> = ({ companyName, lang = 'FR' }) => {
  const t = translations[lang].fieldwork;

  const projects =
    lang === 'FR'
      ? [
          {
            id: 'westfield-paris',
            title: `${companyName.toUpperCase()}, SCENARCHIE ET BTB AUDIOVISUEL ILLUMINENT WESTFIELD PARIS`,
            countryYear: 'France / 2026',
            img: '/uploads/projects/westfield-paris-retail-led-screen.jpg',
          },
          {
            id: 'saudi-ministry',
            title: `ÉCRANS LED ${companyName.toUpperCase()} POUR LE MINISTÈRE DE LA CULTURE SAOUDIEN`,
            countryYear: 'Arabie Saoudite / 2026',
            img: '/uploads/projects/xeron-led-screens-for-saudi-arabias-ministry-of-culture.jpg',
          },
        ]
      : [
          {
            id: 'westfield-paris',
            title: `${companyName.toUpperCase()}, SCENARCHIE AND BTB AUDIOVISUEL DELIVER NEW DIGITAL IMPACT IN PARIS`,
            countryYear: 'France / 2026',
            img: '/uploads/projects/westfield-paris-retail-led-screen.jpg',
          },
          {
            id: 'saudi-ministry',
            title: `${companyName.toUpperCase()} LED SCREENS FOR SAUDI ARABIA\u2019S MINISTRY OF CULTURE`,
            countryYear: 'Saudi Arabia / 2026',
            img: '/uploads/projects/xeron-led-screens-for-saudi-arabias-ministry-of-culture.jpg',
          },
        ];

  return (
    <section id="fieldwork" className="section theme-light bg-[#f5f4f0] text-[#111110]">
      <div className="wrap">
        <div className="text-[11px] tracking-[0.24em] text-[#8a8880] mb-9 uppercase font-semibold">{t.eyebrow}</div>

        <div className="flex justify-between items-end gap-8 flex-wrap mb-16">
          <h2 className="text-[clamp(34px,3.8vw,62px)] font-bold tracking-tight leading-[1.06] text-[#111110]">
            {t.title1}
            <br />
            {t.title2}
          </h2>
          <a
            href="#hero"
            className="text-[12.5px] font-bold tracking-[0.18em] uppercase text-[#111110] border-b border-[#111110] pb-1 hover:text-[#C3F910] hover:border-[#C3F910] hover:bg-[#111110] px-2 transition-all"
          >
            {t.allProjects} →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj) => (
            <div key={proj.id} className="group">
              <div className="relative h-[min(48vh,460px)] overflow-hidden bg-[#e0ded8] border border-[#dad8d2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proj.img}
                  alt={proj.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="text-[11px] tracking-[0.2em] text-[#8a8880] uppercase mt-[18px] leading-[1.6]">
                <span className="font-semibold text-[#111110]">{proj.title}</span> — {proj.countryYear}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
