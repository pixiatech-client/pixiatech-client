import React, { useState } from "react";
import { Language } from "../data/translations";

interface TechShowcaseSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const TechShowcaseSection: React.FC<TechShowcaseSectionProps> = ({
  lang = "FR",
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const t = {
    eyebrow: lang === "FR" ? "05 / TECHNOLOGIES PROPRIÉTAIRES" : "05 / PROPRIETARY TECHNOLOGY",
    title: lang === "FR" ? "La technologie au cœur de chaque pixel." : "Technology inside every pixel.",
    desc:
      lang === "FR"
        ? "Cinq technologies fondamentales développées dans nos laboratoires pour garantir un rendement photonique maximal, une durabilité éprouvée et une efficience exemplaire."
        : "Five proprietary display technologies delivering exceptional performance, proven reliability and enhanced sustainability.",
    techs: [
      {
        id: "coldled",
        name: "COLDLED",
        desc:
          lang === "FR"
            ? "La chaleur est l'ennemi de la performance LED. ColdLED l'élimine — prolongeant la durée de vie et maintenant la luminosité là où d'autres faiblissent."
            : "Heat is the enemy of LED performance. ColdLED eliminates it — extending lifespan and maintaining brightness where others fade.",
        img: "/assets/about/tech-coldled.jpg",
      },
      {
        id: "solidskin",
        name: "SOLIDSKIN",
        desc:
          lang === "FR"
            ? "Une couche de surface nano-renforcée qui protège les modules LED — améliorant la résistance aux impacts, la longévité et le contraste optique."
            : "A reinforced surface layer that protects LED modules — boosting impact resistance, durability and long-term visual performance.",
        img: "/assets/about/tech-solidskin.jpg",
      },
      {
        id: "armorled",
        name: "ARMORLED",
        desc:
          lang === "FR"
            ? "Les connexions de soudure renforcées multiplient la résistance mécanique par 3 à 5× pour des écrans plus robustes et d'une fiabilité totale."
            : "Reinforced LED soldering connections improve impact resistance by 3–5× for tougher, more reliable displays.",
        img: "/assets/about/tech-armorled.jpg",
      },
      {
        id: "cbsf",
        name: "CBSF",
        desc:
          lang === "FR"
            ? "Harmonise les performances sur chaque pixel — éliminant tout décalage colorimétrique et assurant une parfaite uniformité sous tous les angles de vision."
            : "Harmonizes performance across every pixel — minimizing color shift and brightness inconsistency across a wide viewing angle.",
        img: "/assets/about/tech-cbsf.jpg",
      },
    ],
  };

  return (
    <section
      id="technology"
      className="theme-dark sec-lg"
      style={{
        background: "#080808",
        borderTop: "1px solid #1c1c1b",
        padding: "clamp(90px, 12vh, 150px) 0",
      }}
    >
      <div style={{ maxWidth: 1720, margin: "0 auto", padding: "0 clamp(16px, 3.5vw, 64px)" }}>
        {/* Header */}
        <div style={{ marginBottom: 54 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".24em",
              color: "#7A7A76",
              marginBottom: 20,
              textTransform: "uppercase",
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            {t.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 32,
            }}
          >
            <h2
              style={{
                fontSize: "clamp(34px, 4.2vw, 68px)",
                fontWeight: 800,
                letterSpacing: "-.025em",
                lineHeight: 1.04,
                color: "#F5F4F0",
                maxWidth: 820,
                margin: 0,
              }}
            >
              {t.title}
            </h2>
            <p
              style={{
                fontSize: 15.5,
                lineHeight: 1.6,
                color: "#8A8A86",
                maxWidth: 480,
                margin: 0,
              }}
            >
              {t.desc}
            </p>
          </div>
        </div>

        {/* Signature Xeron Accordion flex row */}
        <div
          data-reveal="true"
          className="tech-row"
          style={{
            display: "flex",
            gap: 6,
            height: "min(64vh, 620px)",
            minHeight: 440,
          }}
        >
          {t.techs.map((tech, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <div
                key={tech.id}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  flex: isSelected ? "2.8 1 0%" : "1 1 0%",
                  transition: "flex .65s cubic-bezier(.2,.8,.2,1)",
                  minWidth: 0,
                  cursor: "pointer",
                  border: "1px solid #1f1f1e",
                  background: "#0e0e0d",
                }}
              >
                <div style={{ position: "absolute", inset: 0 }}>
                  <img
                    src={tech.img}
                    alt={tech.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform .8s ease",
                      transform: isSelected ? "scale(1.04)" : "scale(1)",
                    }}
                  />
                </div>

                {/* Shading overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(8,8,8,.6) 0%, rgba(8,8,8,.12) 42%, rgba(8,8,8,.85) 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Top Label */}
                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    left: 24,
                    right: 24,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: ".14em",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: isSelected ? "#C3F910" : "#7A7A76",
                      transition: "color .4s ease",
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      letterSpacing: ".2em",
                      fontWeight: 700,
                      color: "#F5F4F0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "monospace",
                    }}
                  >
                    {tech.name}
                  </span>
                </div>

                {/* Bottom expandable description */}
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    right: 24,
                    bottom: 24,
                    pointerEvents: "none",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      color: "#E5E3DE",
                      maxWidth: 420,
                      opacity: isSelected ? 1 : 0,
                      transform: isSelected ? "translateY(0)" : "translateY(12px)",
                      transition: "opacity .5s ease .12s, transform .5s ease .12s",
                    }}
                  >
                    {tech.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
