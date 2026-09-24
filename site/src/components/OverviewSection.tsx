import React from "react";
import { translations, Language } from "../data/translations";
import { useCms } from "../context/CmsContext";
import { EditableWrapper } from "./cms/EditableWrapper";

interface OverviewSectionProps {
  companyName: string;
  lang?: Language;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  companyName,
  lang = "FR",
}) => {
  const t = translations[lang].overview;
  const { pages, currentPageId } = useCms();
  const cmsOverview = pages[currentPageId]?.sections?.overview || {};

  const stats = cmsOverview.stats && Array.isArray(cmsOverview.stats) && cmsOverview.stats.length > 0
    ? cmsOverview.stats.map((s: any) => ({ value: s.val, label: s.label }))
    : lang === "FR"
    ? [
        { value: "-50%", label: "d'énergie consommée par rapport aux LED traditionnelles" },
        { value: "29,5 mm", label: "épaisseur totale du châssis – ultra affleurant" },
        { value: "8K", label: "résolution maximale supportée sans perte" },
      ]
    : [
        { value: "50%", label: "less power than standard LED" },
        { value: "29.5 mm", label: "total screen depth – paper thin" },
        { value: "8K", label: "max resolution supported" },
      ];

  const eyebrow = cmsOverview.eyebrow || t.eyebrow;
  const title = cmsOverview.title || `${t.title1} ${t.title2}`;
  const description = (cmsOverview.description || t.description).replace(/PixiaTech|Pixiatec|PIXIATECH/gi, companyName);
  const rightImage = cmsOverview.image || "/uploads/products/wp/module-1.jpg";

  return (
    <EditableWrapper sectionKey="overview" sectionLabel="Aperçu & Châssis (Textes, Stats, Photos)">
      <section id="overview" className="section theme-light bg-[#f5f4f0] text-[#111110]">
        <div className="wrap">
          {/* Eyebrow */}
          <div className="text-[11px] tracking-[0.24em] text-[#8a8880] mb-9 uppercase font-semibold">
            {eyebrow}
          </div>

          {/* Intro Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-24 items-end mb-14">
            <h2
              className="text-[clamp(34px,3.8vw,62px)] font-bold tracking-tight leading-[1.06] text-[#111110]"
              style={cmsOverview.titleFontSize ? { fontSize: `${cmsOverview.titleFontSize}px` } : {}}
            >
              {title}
            </h2>
            <p className="text-[16.5px] leading-[1.65] text-[#4a4a46] m-0">
              {description}
            </p>
          </div>

          {/* Media Visual Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-stretch">
            {/* Left Stage */}
            <div className="relative bg-[#080808] h-[min(58vh,560px)] overflow-hidden flex items-center justify-center border border-[#dad8d2]">
              <video
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/uploads/products/wp/wp-cabinet.jpg"
                aria-label="PXT Fine Cabinet Detail"
              >
                <source src="/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
                <source src="/uploads/products/wp/wp-cabinet.mov" type="video/quicktime" />
                <source src="https://xeron.co/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
              </video>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/75 flex justify-between items-center text-[10.5px] tracking-[0.16em] uppercase font-mono text-[#c9c7c1]">
                <span className="font-semibold text-white">{t.badge}</span>
                <span className="text-[#8a8880]">{t.badgeSpecs}</span>
              </div>
            </div>

            {/* Right Stage: High-detail module photography */}
            <div className="relative bg-[#ebe8e1] h-[min(58vh,560px)] overflow-hidden border border-[#dad8d2]">
              <img
                src={rightImage}
                alt="PXT Fine Module Detail"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://xeron.co/uploads/products/wp/module-1.jpg";
                }}
              />
            </div>
          </div>

          {/* 3-Column Metrics Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#dad8d2] border border-[#dad8d2] mt-6">
            {stats.map((item: { value: string; label: string }) => (
              <div key={item.label} className="bg-[#f5f4f0] p-8">
                <div className="text-[clamp(30px,2.8vw,44px)] font-black tracking-[-0.02em] leading-none text-[#111110]">
                  {item.value}
                </div>
                <div className="text-[13px] leading-[1.4] text-[#7a7870] mt-2.5">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Technologies Inside Section */}
          <div className="mt-18 pt-12 border-t border-[#dad8d2]">
            <div className="text-[11px] tracking-[0.24em] text-[#8a8880] mb-7 uppercase font-semibold">
              {lang === "FR" ? "TECHNOLOGIES EMBARQUÉES" : "TECHNOLOGIES INSIDE"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#dad8d2] border border-[#dad8d2]">
              {[
                {
                  num: "01",
                  title: "ColdLED",
                  desc:
                    lang === "FR"
                      ? "La chaleur est l'ennemi principal des diodes à pas fin. ColdLED l'élimine, prolongeant la durée de vie et maintenant une luminosité éclatante là où les écrans conventionnels faiblissent."
                      : "Heat is the primary enemy of fine-pitch diodes. ColdLED eliminates it — extending lifespan and maintaining peak brightness where conventional displays fade.",
                },
                {
                  num: "02",
                  title: "SolidSkin",
                  desc:
                    lang === "FR"
                      ? "Le nano-revêtement protecteur SolidSkin et son indice IP65 avant protègent chaque micro-LED contre l'humidité, la poussière et les chocs, offrant un confort visuel sans reflets sur toute la surface."
                      : "SolidSkin’s protective nano-layer and IP65 front rating shields every micro-LED against moisture, dust, and physical impact — delivering softer, smoother visuals across the entire display.",
                },
              ].map((tech) => (
                <div key={tech.title} className="bg-[#f5f4f0] p-8">
                  <div className="text-[11px] tracking-[0.2em] text-[#C3F910] bg-[#111] px-2.5 py-0.5 inline-block mb-3.5 font-bold font-mono">
                    {tech.num}
                  </div>
                  <div className="text-[20px] font-bold tracking-[0.06em] uppercase mb-2.5 text-[#111110]">
                    {tech.title}
                  </div>
                  <div className="text-[14px] text-[#6b6a66] leading-[1.6]">
                    {tech.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </EditableWrapper>
  );
};
