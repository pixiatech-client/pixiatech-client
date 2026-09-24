import React from "react";
import { translations, Language } from "../data/translations";

interface SiteFooterProps {
  companyName: string;
  lang?: Language;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  companyName,
  lang = "FR",
}) => {
  const t = translations[lang].footer;

  return (
    <footer id="site-footer" className="bg-[#050505] text-[#f5f4f0] overflow-hidden border-t border-[#1a1a1a]">
      <div className="wrap pt-20 pb-12">
        {/* Foot Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-18 border-b border-[#1a1a1a]">
          {/* Products */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.products}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Fine (WP Series)
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Vision
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Flex
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Studio
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.allSeries}
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.company}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <a href="#overview" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.about.replace("PixiaTech", companyName)}
              </a>
              <a href="#fieldwork" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.projects}
              </a>
              <a href="#overview" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.coldLedTech}
              </a>
              <a href="#design" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.experienceCenter}
              </a>
            </div>
          </div>

          {/* Standards & Compliance */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.standards}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <span className="text-[#7a7a76]">CE / EMC Class B</span>
              <span className="text-[#7a7a76]">{t.rohs}</span>
              <span className="text-[#7a7a76]">{t.warranty}</span>
              <span className="text-[#7a7a76]">{t.calibration}</span>
            </div>
          </div>

          {/* Showroom & Contact */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.headquarters}
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#c9c7c1]">
              <div className="font-bold text-white">{companyName} France</div>
              <div>{t.showroom}</div>
              <div className="text-[#7a7a76] text-xs">Saint-Ouen-sur-Seine (Grand Paris)</div>
              <div className="mt-2 text-[#C3F910] font-mono text-xs">
                contact@{companyName.toLowerCase().replace(/\s+/g, "")}.com
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-[11px] tracking-[0.15em] text-[#7a7a76] uppercase font-mono">
          <div>
            © 2026 {companyName.toUpperCase()}. {t.rights}
          </div>
          <div className="flex gap-6">
            <a href="#hero" className="hover:text-white transition-colors">{t.privacy}</a>
            <a href="#hero" className="hover:text-white transition-colors">{t.legal}</a>
            <a href="#specs" className="hover:text-white transition-colors">{t.datasheets}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
