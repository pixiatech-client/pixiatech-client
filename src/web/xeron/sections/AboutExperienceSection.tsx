'use client';

import React from 'react';
import { Language } from '../../xeron-translations';

interface AboutExperienceSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const AboutExperienceSection: React.FC<AboutExperienceSectionProps> = ({
  lang = 'FR',
  onOpenConsultation,
}) => {
  const t = {
    eyebrow: lang === 'FR' ? '06 / EXPERIENCE CENTER & SHOWROOM' : '06 / EXPERIENCE CENTER & SHOWROOM',
    title:
      lang === 'FR'
        ? 'La lumière prend tout son sens lorsque vous vous tenez devant elle.'
        : 'Pixels make more sense when you stand in front of them.',
    desc:
      lang === 'FR'
        ? "Venez faire l'expérience directe de nos murs d'images ultra-haute résolution, tester les systèmes cinétiques et mesurer la fidélité colorimétrique dans notre showroom d'ingénierie."
        : 'Experience our ultra-high resolution displays, test kinetic visual systems and evaluate chromatic fidelity in our engineering showroom.',
    visitBtn:
      lang === 'FR' ? 'Visiter le PIXIATECH Experience Center →' : 'Visit PIXIATECH Experience Center →',
    demoBtn: lang === 'FR' ? 'Réserver une démo technique →' : 'Book a Technical Demo →',
    location: lang === 'FR' ? 'PARIS & SHOWROOM EUROPÉEN' : 'PARIS & EUROPEAN SHOWROOM',
    processEyebrow: lang === 'FR' ? "07 / PROCESSUS D'INGÉNIERIE" : '07 / ENGINEERING WORKFLOW',
    processTitle:
      lang === 'FR'
        ? "De l'esquisse architecturale à la mise en service."
        : 'From initial survey to final commissioning.',
    steps: [
      {
        num: '01',
        title: lang === 'FR' ? 'Étude & Métrologie' : 'Survey & Site Metrology',
        desc:
          lang === 'FR'
            ? 'Analyse structurelle, étude de charge statique et dynamique, calcul des distances de recul optimales et bilan photométrique précis.'
            : 'Structural load study, viewing distance analysis, optical and power budgeting.',
      },
      {
        num: '02',
        title: lang === 'FR' ? 'Modélisation 3D BIM' : '3D BIM Integration',
        desc:
          lang === 'FR'
            ? 'Conception des sous-structures mécano-soudées sur mesure et intégration parfaite aux maquettes numériques du bâtiment.'
            : 'Custom sub-structure engineering and full architectural BIM coordination.',
      },
      {
        num: '03',
        title: lang === 'FR' ? 'Appairage en Salle Blanche' : 'Cleanroom Binning',
        desc:
          lang === 'FR'
            ? 'Mesure spectrale individuelle de chaque lot de LED pour une cohérence colorimétrique sub-deltaE sur l\u2019ensemble du mur.'
            : 'Individual spectral binning of every LED batch for absolute color uniformity.',
      },
      {
        num: '04',
        title: lang === 'FR' ? 'Installation & Calibration' : 'Deployment & Calibration',
        desc:
          lang === 'FR'
            ? 'Montage certifié par nos ingénieurs et calibration radiométrique sur site avec les processeurs NovaStar COEX / Brompton.'
            : 'Certified installation and full radiometric field calibration.',
      },
      {
        num: '05',
        title: lang === 'FR' ? 'Télé-Surveillance 24/7' : '24/7 Telemetry & Warranty',
        desc:
          lang === 'FR'
            ? 'Diagnostic continu de chaque cabinet via cloud sécurisé, pièces de rechange dédiées et garantie complète de 5 ans.'
            : 'Continuous cabinet-level health monitoring and comprehensive 5-year warranty.',
      },
    ],
  };

  return (
    <>
      <section className="relative min-h-[580px] md:min-h-[720px] bg-[#000] border-t border-[#1f1f1f] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/site/xc-bg.jpg"
            alt="PIXIATECH Experience Center"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-[#080808]/30" />
        </div>

        <div className="relative z-10 wrap pb-20 pt-36">
          <div className="text-[11px] font-mono tracking-[0.24em] text-[#C3F910] uppercase font-bold mb-6">
            {t.eyebrow}
          </div>
          <h2 className="text-[clamp(34px,4.5vw,72px)] font-black tracking-tight leading-[1.04] text-[#f5f4f0] max-w-4xl m-0 mb-8">
            {t.title}
          </h2>

          <p className="text-[16px] md:text-[18px] text-[#c7c5be] max-w-2xl font-light leading-relaxed mb-10">
            {t.desc}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="px-7 py-4 bg-[#C3F910] text-black font-bold text-[13px] tracking-wider uppercase hover:bg-white transition-colors cursor-pointer"
            >
              {t.visitBtn}
            </button>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="px-7 py-4 bg-transparent border border-[#555] text-white font-semibold text-[13px] tracking-wider uppercase hover:border-white transition-colors cursor-pointer"
            >
              {t.demoBtn}
            </button>
          </div>

          <div className="text-[11.5px] font-mono tracking-[0.2em] text-[#7a7a76] uppercase">{t.location}</div>
        </div>
      </section>

      <section id="process" className="theme-dark bg-[#080808] border-t border-[#1f1f1f] py-24 md:py-32">
        <div className="wrap">
          <div className="text-[11px] font-mono tracking-[0.24em] text-[#7a7a76] mb-8 uppercase font-bold">
            {t.processEyebrow}
          </div>

          <h2 className="text-[clamp(32px,3.8vw,58px)] font-black tracking-tight leading-[1.06] text-[#f5f4f0] max-w-3xl m-0 mb-16">
            {t.processTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-[#1f1f1f] border border-[#1f1f1f]">
            {t.steps.map((st) => (
              <div
                key={st.num}
                className="bg-[#0b0b0a] p-7 flex flex-col justify-between hover:bg-[#111110] transition-colors"
              >
                <div>
                  <div className="text-[12px] font-mono tracking-[0.2em] text-[#C3F910] font-bold mb-4">{st.num}</div>
                  <h3 className="text-[18px] font-bold text-white mb-2 leading-snug">{st.title}</h3>
                </div>
                <p className="text-[13px] text-[#8a8a86] leading-relaxed mt-4">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};