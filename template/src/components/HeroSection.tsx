import React from "react";
import { LedCanvasText } from "./LedCanvasText";
import { translations, Language } from "../data/translations";

interface HeroSectionProps {
  onOpenQuote: () => void;
  title?: string;
  lang?: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenQuote,
  title = "PXT Fine",
  lang = "FR",
}) => {
  const t = translations[lang].hero;

  const breadcrumbAll = lang === "FR" ? "TOUS LES PRODUITS" : "ALL PRODUCTS";
  const breadcrumbCat = lang === "FR" ? "ÉCRAN LED INTÉRIEUR" : "INDOOR LED DISPLAY";
  const subtitle = lang === "FR" ? "Écran LED fin pitch intérieur" : "Indoor LED display";

  return (
    <section
      id="hero"
      className="theme-dark relative"
      style={{
        padding: "calc(var(--nav-h) + clamp(50px, 7vh, 90px)) 0 0",
        background: "radial-gradient(110% 80% at 50% 0%, #101010 0%, #080808 60%)",
      }}
    >
      <div className="wrap">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3.5 text-[11px] tracking-[0.2em] text-[#7a7a76] mb-10 uppercase">
          <a href="#hero" className="hover:text-white transition-colors">
            {breadcrumbAll}
          </a>
          <span className="text-[#3a3a3a]">/</span>
          <span className="text-[#c9c7c1]">{breadcrumbCat}</span>
        </div>

        {/* Dynamic Animated LED Canvas Headline */}
        <LedCanvasText label={title} />

        {/* Sub-header & Action Buttons */}
        <div className="flex justify-between items-end gap-8 flex-wrap mt-8">
          <div>
            <div className="text-[clamp(20px,1.9vw,28px)] font-bold mb-3 text-[#f5f4f0]">
              {subtitle}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {t.tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-[11px] tracking-[0.16em] uppercase px-3.5 py-1.5 border transition-colors ${
                    i === 0
                      ? "border-white/40 text-white font-semibold"
                      : "border-[#1f1f1f] text-[#7a7a76] hover:border-[#3a3a3a]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenQuote}
              className="btn btn-solid px-7 py-4 text-[14px] font-semibold text-black bg-white hover:bg-[#C3F910] hover:text-black transition-all cursor-pointer tracking-[0.06em]"
            >
              {t.ctaQuote} →
            </button>
            <a
              href="#specs"
              className="btn btn-outline px-6 py-4 text-[14px] font-medium text-[#f5f4f0] border border-[#333] hover:border-white transition-colors tracking-[0.06em]"
            >
              {t.ctaSpecs} ↓
            </a>
          </div>
        </div>

        {/* 4-Column Metric Bar */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1f1f1f] border border-[#1f1f1f] mt-14"
        >
          {t.specs.map((item) => (
            <div key={item.label} className="bg-[#080808] p-5 sm:p-6">
              <div className="text-[11px] tracking-[0.18em] text-[#7a7a76] uppercase mb-2">
                {item.label}
              </div>
              <div className="text-[clamp(17px,1.4vw,22px)] font-bold text-[#f5f4f0]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Hero Video Stage */}
        <div className="mt-8 relative overflow-hidden bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl">
          <div className="relative w-full h-[min(64vh,640px)] flex items-center justify-center">
            <video
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/uploads/products/wp/wp-cabinet.jpg"
              aria-label="PixiaTech PXT Fine Cabinet 3D"
            >
              <source src="/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
              <source src="/uploads/products/wp/wp-cabinet.mov" type="video/quicktime" />
              <source src="https://xeron.co/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
            </video>

            {/* Video overlay caption badge */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-center text-[11px] tracking-[0.18em] text-[#c9c7c1] uppercase font-mono">
              <span className="font-semibold text-white">
                {t.badge}
              </span>
              <span className="hidden sm:inline text-[#7a7a76]">
                {t.badgeSpecs}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
