import React from "react";
import { translations, Language } from "../data/translations";

interface NextSectionProps {
  onOpenConsultation: () => void;
  lang?: Language;
}

export const NextSection: React.FC<NextSectionProps> = ({
  onOpenConsultation,
  lang = "FR",
}) => {
  const t = translations[lang].next;

  return (
    <section
      id="next"
      className="theme-dark bg-[#080808] text-[#f5f4f0] border-t border-[#1f1f1f]"
      style={{ padding: "clamp(90px, 10vh, 130px) 0" }}
    >
      <div className="wrap">
        {/* Previous & Next Series Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="#hero"
            className="block border border-[#1f1f1f] p-8 transition-colors duration-300 hover:border-[#C3F910] group"
          >
            <div className="text-[10.5px] tracking-[0.2em] text-[#7a7a76] mb-3.5 uppercase font-mono">
              {t.prevSeries}
            </div>
            <div className="text-[clamp(22px,2.2vw,32px)] font-bold text-white group-hover:text-[#C3F910] transition-colors">
              WK Series
            </div>
            <div className="text-[13px] text-[#7a7a76] mt-1.5">
              {t.seriesDesc}
            </div>
          </a>

          <a
            href="#hero"
            className="block border border-[#1f1f1f] p-8 text-left md:text-right transition-colors duration-300 hover:border-[#C3F910] group"
          >
            <div className="text-[10.5px] tracking-[0.2em] text-[#7a7a76] mb-3.5 uppercase font-mono">
              {t.nextSeries}
            </div>
            <div className="text-[clamp(22px,2.2vw,32px)] font-bold text-white group-hover:text-[#C3F910] transition-colors">
              PXT Ultra
            </div>
            <div className="text-[13px] text-[#7a7a76] mt-1.5">
              {t.seriesDesc}
            </div>
          </a>
        </div>

        {/* CTA Consultation Section */}
        <div className="flex justify-between items-center gap-7 flex-wrap border-t border-[#1f1f1f] mt-18 pt-16">
          <h2 className="text-[clamp(34px,3.6vw,58px)] font-bold tracking-tight leading-[1.06] text-[#f5f4f0] m-0">
            {t.ctaTitle1}
            <br />
            {t.ctaTitle2}
          </h2>
          <button
            type="button"
            onClick={onOpenConsultation}
            className="btn btn-solid py-5 px-9 text-[14px] font-semibold text-black bg-white hover:bg-[#C3F910] hover:text-black transition-all cursor-pointer tracking-[0.06em]"
          >
            {t.ctaBtn}
          </button>
        </div>
      </div>
    </section>
  );
};
