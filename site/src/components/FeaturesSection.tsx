import React, { useState, useEffect } from "react";
import { translations, Language } from "../data/translations";

interface FeaturesSectionProps {
  lang?: Language;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ lang = "FR" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const t = translations[lang].features;

  const featureImages = [
    { img: "/uploads/products/wp/feature-1.jpg", fit: "cover" as const },
    { img: "/uploads/products/wp/feature-2.jpg", fit: "contain" as const },
    { img: "/uploads/products/wp/feature-3.jpg", fit: "cover" as const },
    { img: "/uploads/products/wp/feature-4.jpg", fit: "cover" as const },
    { img: "/uploads/products/wp/feature-5.jpg", fit: "cover" as const },
    { img: "/uploads/products/wp/feature-6.jpg", fit: "cover" as const },
    { img: "/uploads/products/wp/feature-7.jpg", fit: "cover" as const },
  ];

  const features = t.items.map((item, idx) => ({
    ...item,
    img: featureImages[idx]?.img || "/uploads/products/wp/feature-1.jpg",
    fit: featureImages[idx]?.fit || ("cover" as const),
  }));

  // Auto rotation every 4.5 seconds if not hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered, features.length]);

  return (
    <section id="features" className="section theme-dark bg-[#080808] text-[#f5f4f0]">
      <div className="wrap">
        {/* Eyebrow */}
        <div className="text-[11px] tracking-[0.24em] text-[#7a7a76] mb-9 uppercase font-semibold">
          {t.eyebrow}
        </div>

        {/* Heading */}
        <h2 className="text-[clamp(34px,3.8vw,62px)] font-bold tracking-tight leading-[1.06] mb-16 text-[#f5f4f0]">
          {t.title1}
          <br />
          {t.title2}
        </h2>

        {/* FStage Component Layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left: Feature Visual Stage with animated cross-fades */}
          <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[580px] bg-[#0d0d0c] border border-[#1f1f1f] overflow-hidden">
            {features.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.title}
                  className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "scale(1) translateX(0)" : "scale(1.05) translateX(3%)",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  aria-hidden={!isActive}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    className={`w-full h-full ${
                      item.fit === "contain" ? "object-contain p-6" : "object-cover"
                    }`}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://xeron.co${item.img}`;
                    }}
                  />
                  {/* Subtle vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              );
            })}

            {/* Bottom active feature label on mobile */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-black/85 border-t border-[#222] text-xs">
              <span className="text-[#C3F910] font-mono mr-2">0{activeIndex + 1}</span>
              <span className="font-semibold text-white">{features[activeIndex].title}</span>
            </div>
          </div>

          {/* Right: Step List */}
          <div className="space-y-4">
            {features.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.title}
                  onClick={() => setActiveIndex(index)}
                  className={`p-5 border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-[#111110] border-[#C3F910] pl-6"
                      : "bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333] opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className={`text-[11px] font-mono tracking-widest ${
                        isActive ? "text-[#C3F910] font-bold" : "text-[#7a7a76]"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <h3
                      className={`text-[17px] sm:text-[19px] font-bold ${
                        isActive ? "text-white" : "text-[#d0cec9]"
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[14px] text-[#a3a3a3] leading-[1.6] pl-7 m-0">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
