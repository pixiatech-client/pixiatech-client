import React from "react";
import { translations, Language } from "../data/translations";

interface DesignSectionProps {
  lang?: Language;
}

export const DesignSection: React.FC<DesignSectionProps> = ({ lang = "FR" }) => {
  const t = translations[lang].design;

  const installModes = lang === "FR"
    ? [
        {
          num: "01",
          title: "Fixation Murale Affleurante",
          desc: "Support ultra-fin avec seulement 37 mm de profondeur totale. Finition invisible et maintenance 100% avant sans décrocher le panneau.",
        },
        {
          num: "02",
          title: "Totem Mobile Haute Définition",
          desc: "Se transforme en écran mobile haute fidélité. Bordure de protection anti-choc sécurisant les diodes lors des déplacements.",
        },
        {
          num: "03",
          title: "Angles Créatifs à 90°",
          desc: "Configurations d'angles pour espaces en L et enveloppants. Compatible avec la série incurvée PXT Wrap.",
        },
      ]
    : [
        {
          num: "01",
          title: "Wall-mounted",
          desc: "Slim floating bracket. 37mm total depth. Flat, seamless finish — front service access without removing the panel.",
        },
        {
          num: "02",
          title: "Mobile Stand",
          desc: "Transforms into a high-definition mobile display. Anti-collision safety rim protects LEDs in transit.",
        },
        {
          num: "03",
          title: "Creative Corner",
          desc: "Corner-screen configurations for L-shaped and wrap-around spaces. Combine with PXT Wrap for curved installations.",
        },
      ];

  const heading1 = lang === "FR" ? "Conçu comme une pièce d'orfèvrerie." : "Engineered as an object.";
  const heading2 = lang === "FR" ? "Installé comme une surface architecturale." : "Installed as a surface.";
  const cabinetDimLabel = lang === "FR" ? "DIMENSIONS CHÂSSIS" : "CABINET";
  const pitchLabel = lang === "FR" ? "PITCH PIXEL" : "PIXEL PITCH";
  const brightnessLabel = lang === "FR" ? "LUMINOSITÉ" : "BRIGHTNESS";
  const envLabel = lang === "FR" ? "ENVIRONNEMENT" : "ENVIRONMENT";
  const envVal = lang === "FR" ? "INTÉRIEUR" : "INDOOR";
  const fullDataLabel = lang === "FR" ? "DONNÉES TECHNIQUES COMPLÈTES" : "FULL TECHNICAL DATA";
  const specsLink = lang === "FR" ? "SPÉCIFICATIONS ↓" : "SPECIFICATIONS ↓";

  return (
    <section
      id="design"
      className="section theme-dark bg-[#0d0d0c] text-[#f5f4f0] border-t border-[#1f1f1f]"
    >
      <div className="wrap">
        {/* Eyebrow */}
        <div className="text-[11px] tracking-[0.24em] text-[#7a7a76] mb-9 uppercase font-semibold">
          {t.eyebrow}
        </div>

        {/* Heading */}
        <h2 className="text-[clamp(34px,3.8vw,62px)] font-bold tracking-tight leading-[1.06] mb-16 text-[#f5f4f0]">
          {heading1}
          <br />
          <span className="text-[#8a8880]">{heading2}</span>
        </h2>

        {/* 2-Column Technical Diagram & Quick Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-22 items-center">
          {/* Architectural Blueprint Vector SVG */}
          <div className="bg-[#080808] p-6 sm:p-10 border border-[#1f1f1f] rounded-none">
            <svg
              viewBox="0 0 560 282.8"
              className="w-full h-auto block font-mono"
              aria-label="Technical Cabinet & Module Blueprint"
            >
              {/* Cabinet outline */}
              <rect
                x="80"
                y="50"
                width="300"
                height="168.8"
                fill="none"
                stroke="#4A4A46"
                strokeWidth="1.2"
              />
              <line x1="230" y1="50" x2="230" y2="218.8" stroke="#2E2E2C" strokeWidth="0.6" />
              <line x1="80" y1="134.4" x2="380" y2="134.4" stroke="#2E2E2C" strokeWidth="0.6" />

              {/* Highlighted Module */}
              <rect
                x="80"
                y="50"
                width="150"
                height="84.4"
                fill="none"
                stroke="#C3F910"
                strokeWidth="1.4"
              />
              <line x1="155" y1="50" x2="155" y2="26" stroke="#C3F910" strokeWidth="0.8" />
              <text x="140" y="18" fontSize="11" fill="#C3F910" fontWeight="600">
                MODULE — 300 × 168.8 mm
              </text>

              {/* Cabinet Dimension Lines */}
              <line x1="80" y1="238.8" x2="380" y2="238.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="80" y1="230.8" x2="80" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="380" y1="230.8" x2="380" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <text x="80" y="266.8" fontSize="11" fill="#7A7A76">
                CABINET — 600×337.5 mm (16:9 NATIVE)
              </text>

              {/* Side Depth View */}
              <rect
                x="440"
                y="50"
                width="14.8"
                height="168.8"
                fill="none"
                stroke="#4A4A46"
                strokeWidth="1.2"
              />
              <line x1="440" y1="50" x2="440" y2="218.8" stroke="#C3F910" strokeWidth="2.4" />
              <line x1="440" y1="238.8" x2="454.8" y2="238.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="440" y1="230.8" x2="440" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="454.8" y1="230.8" x2="454.8" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
              <text x="415" y="266.8" fontSize="11" fill="#7A7A76">
                DEPTH — 29.5 mm
              </text>

              {/* Labels */}
              <text x="80" y="38" fontSize="11" fill="#4A4A46" letterSpacing="0.1em">
                FRONT ELEVATION
              </text>
              <text x="430" y="38" fontSize="11" fill="#4A4A46" letterSpacing="0.1em">
                SIDE
              </text>
            </svg>
          </div>

          {/* Right Column: Spec rows & photograph */}
          <div>
            <div className="border-t border-[#1f1f1f]">
              <div className="flex justify-between gap-5 py-5 px-1 border-b border-[#1f1f1f]">
                <span className="text-[13px] tracking-[0.14em] text-[#7a7a76] uppercase">
                  {cabinetDimLabel}
                </span>
                <span className="text-[15px] font-semibold text-[#f5f4f0]">600×337.5 mm</span>
              </div>
              <div className="flex justify-between gap-5 py-5 px-1 border-b border-[#1f1f1f]">
                <span className="text-[13px] tracking-[0.14em] text-[#7a7a76] uppercase">
                  {pitchLabel}
                </span>
                <span className="text-[15px] font-semibold text-[#f5f4f0]">1.2–3.1 mm</span>
              </div>
              <div className="flex justify-between gap-5 py-5 px-1 border-b border-[#1f1f1f]">
                <span className="text-[13px] tracking-[0.14em] text-[#7a7a76] uppercase">
                  {brightnessLabel}
                </span>
                <span className="text-[15px] font-semibold text-[#f5f4f0]">800–1,500 nits</span>
              </div>
              <div className="flex justify-between gap-5 py-5 px-1 border-b border-[#1f1f1f]">
                <span className="text-[13px] tracking-[0.14em] text-[#7a7a76] uppercase">
                  {envLabel}
                </span>
                <span className="text-[15px] font-semibold text-[#f5f4f0]">{envVal}</span>
              </div>
              <div className="flex justify-between gap-5 py-5 px-1 border-b border-transparent">
                <span className="text-[13px] tracking-[0.14em] text-[#7a7a76] uppercase">
                  {fullDataLabel}
                </span>
                <a
                  href="#specs"
                  className="text-[13px] font-bold tracking-[0.08em] border-b border-[#C3F910] text-[#C3F910] hover:text-white transition-colors pb-0.5"
                >
                  {specsLink}
                </a>
              </div>
            </div>

            {/* Sub-image */}
            <div className="relative h-[220px] mt-7 overflow-hidden border border-[#1f1f1f] bg-[#0a0a09]">
              <img
                src="/uploads/products/wp/module-3.jpg"
                alt="PXT Fine Module Back Chassis"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://xeron.co/uploads/products/wp/module-3.jpg";
                }}
              />
            </div>
          </div>
        </div>

        {/* 3 Installation Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-18 pt-12 border-t border-[#1f1f1f]">
          {installModes.map((mode) => (
            <div key={mode.title} className="border-t-2 border-[#f5f4f0] pt-5">
              <div className="text-[11px] tracking-[0.2em] text-[#C3F910] mb-2.5 font-mono">
                {mode.num}
              </div>
              <div className="text-[21px] font-bold mb-2 text-[#f5f4f0]">{mode.title}</div>
              <div className="text-[14px] text-[#a3a3a3] leading-[1.6]">{mode.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
