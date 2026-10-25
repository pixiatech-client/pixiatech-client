import React, { useRef, useEffect, useState } from "react";
import { Language } from "../data/translations";

interface MarketsSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

interface MarketItem {
  id: string;
  num: string;
  name: string;
  desc: string;
  cta: string;
  img: string;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({
  lang = "FR",
  onOpenConsultation,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  const t = {
    eyebrow: lang === "FR" ? "03 / MARCHÉS" : "03 / MARKETS",
    title: lang === "FR" ? "Conçu pour chaque environnement." : "Built for every environment.",
    markets: [
      {
        id: "corporate",
        num: "01",
        name: "CORPORATE",
        desc:
          lang === "FR"
            ? "Des écrans de précision pour les espaces où chaque détail compte."
            : "Precision displays for spaces where every detail matters.",
        cta: lang === "FR" ? "EXPLORER CORPORATE →" : "EXPLORE CORPORATE →",
        img: "/assets/about/market-corporate.jpg",
      },
      {
        id: "retail",
        num: "02",
        name: "RETAIL",
        desc:
          lang === "FR"
            ? "Des affichages qui transforment les visiteurs en audiences captivées."
            : "Displays that turn visitors into audiences.",
        cta: lang === "FR" ? "EXPLORER RETAIL →" : "EXPLORE RETAIL →",
        img: "/assets/about/market-retail.jpg",
      },
      {
        id: "dooh",
        num: "03",
        name: "DOOH",
        desc:
          lang === "FR"
            ? "La toile urbaine monumentale — ultra-lumineuse, audacieuse et parée contre les éléments."
            : "The urban canvas — bright, bold and built for the elements.",
        cta: lang === "FR" ? "EXPLORER DOOH →" : "EXPLORE DOOH →",
        img: "/assets/about/market-dooh.jpg",
      },
      {
        id: "rental",
        num: "04",
        name: "RENTAL & TOURING",
        desc:
          lang === "FR"
            ? "Rapide à monter, sûr en tournée, impossible à ignorer sur scène."
            : "Fast to build, safe to tour, impossible to ignore on stage.",
        cta: lang === "FR" ? "EXPLORER RENTAL →" : "EXPLORE RENTAL →",
        img: "/assets/about/market-rental.jpg",
      },
      {
        id: "xr",
        num: "05",
        name: "XR & VIRTUAL PRODUCTION",
        desc:
          lang === "FR"
            ? "Conçu pour la caméra : pitch sub-millimétrique, pas de moiré, pas de compromis."
            : "Camera-ready: sub-millimetre pitch, zero moiré, zero compromise.",
        cta: lang === "FR" ? "EXPLORER XR →" : "EXPLORE XR →",
        img: "/assets/about/market-xr.jpg",
      },
      {
        id: "sports",
        num: "06",
        name: "SPORTS & VENUES",
        desc:
          lang === "FR"
            ? "Des scores aux rubans de bordure, conçus pour l'énergie des foules."
            : "From scoreboards to perimeter ribbons, built for crowd-scale impact.",
        cta: lang === "FR" ? "EXPLORER SPORTS →" : "EXPLORE SPORTS →",
        img: "/assets/about/market-sports.jpg",
      },
      {
        id: "control",
        num: "07",
        name: "SALLES DE CONTRÔLE",
        desc:
          lang === "FR"
            ? "Fiabilité 24/7 pour les opérations où l'échec n'est pas une option."
            : "24/7 reliability for mission-critical operations where failure is not an option.",
        cta: lang === "FR" ? "EXPLORER CONTRÔLE →" : "EXPLORE CONTROL →",
        img: "/assets/about/market-control.jpg",
      },
      {
        id: "creative",
        num: "08",
        name: "CRÉATIF & ARCHITECTURE",
        desc:
          lang === "FR"
            ? "Courbes, colonnes, sols interactifs : quand l'affichage devient architecture."
            : "Curves, columns, interactive floors: display as architectural form.",
        cta: lang === "FR" ? "EXPLORER CRÉATIF →" : "EXPLORE CREATIVE →",
        img: "/assets/about/market-creative.jpg",
      },
    ],
  };

  const row1Markets = t.markets.slice(0, 4);
  const row2Markets = t.markets.slice(4, 8);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          const section = sectionRef.current;
          if (!section) return;

          const rect = section.getBoundingClientRect();
          const winH = window.innerHeight;
          const totalDist = winH + rect.height;
          const currentDist = winH - rect.top;
          const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);

          const shift1 = (progress - 0.5) * -220;
          const shift2 = (progress - 0.5) * 220;

          if (row1Ref.current) {
            row1Ref.current.style.transform = `translate3d(${shift1}px, 0, 0)`;
          }
          if (row2Ref.current) {
            row2Ref.current.style.transform = `translate3d(${shift2}px, 0, 0)`;
          }
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCardClick = () => {
    if (onOpenConsultation) {
      onOpenConsultation();
    }
  };

  const renderCard = (m: MarketItem, index: number, isDuplicate = false) => {
    return (
      <div
        key={`${m.id}-${index}-${isDuplicate ? "dup" : "orig"}`}
        className="mkt-showcase-card"
        onClick={handleCardClick}
        style={{
          flex: "none",
          position: "relative",
          overflow: "hidden",
          width: "clamp(340px, 30vw, 500px)",
          aspectRatio: "16 / 9",
          background: "#0d0d0c",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 14px 34px -8px rgba(0, 0, 0, 0.75), 0 2px 10px rgba(0, 0, 0, 0.5)",
          cursor: "pointer",
          userSelect: "none",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.45s ease",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.img}
          alt={`${m.name} — PIXIATECH`}
          className="mkt-showcase-img"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Floating Top Pill Badge */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            zIndex: 3,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(8, 8, 8, 0.76)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#C3F910",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: ".18em",
              color: "#F5F4F0",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {m.num} — {m.name}
          </span>
        </div>

        {/* Bottom Dark Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "clamp(14px, 2vw, 22px) clamp(16px, 2.2vw, 24px)",
            background: "linear-gradient(180deg, rgba(8, 8, 8, 0) 0%, rgba(8, 8, 8, 0.75) 45%, rgba(8, 8, 8, 0.96) 100%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: "clamp(13px, 1.1vw, 15px)",
              fontWeight: 600,
              color: "#F5F4F0",
              marginBottom: 10,
              lineHeight: 1.35,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            {m.desc}
          </div>

          <div
            className="mkt-cta-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              letterSpacing: ".16em",
              fontWeight: 700,
              color: "#C3F910",
              textTransform: "uppercase",
            }}
          >
            <span>{m.cta}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <span id="markets" style={{ display: "block", height: 0, marginTop: -90, paddingTop: 90 }} />
      <section
        ref={sectionRef}
        style={{
          position: "relative",
          background: "#080808",
          color: "#F5F4F0",
          borderTop: "1px solid #1c1c1b",
          borderBottom: "1px solid #1c1c1b",
          overflow: "hidden",
          padding: "clamp(70px, 9vh, 120px) 0 clamp(80px, 11vh, 130px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 50% 30%, rgba(195, 249, 16, 0.035) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1520,
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(16px, 3.5vw, 64px) clamp(36px, 4.5vh, 56px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".24em",
              color: "#7A7A76",
              marginBottom: 14,
              textTransform: "uppercase",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
            }}
          >
            {t.eyebrow}
          </div>
          <h2
            style={{
              fontSize: "clamp(36px, 3.6vw, 58px)",
              fontWeight: 800,
              letterSpacing: "-.025em",
              color: "#F5F4F0",
              margin: 0,
              maxWidth: 900,
              lineHeight: 1.05,
            }}
          >
            {t.title}
          </h2>
        </div>

        {/* Left & Right Edge Vignettes */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "clamp(40px, 8vw, 140px)",
            background: "linear-gradient(to right, #080808 20%, rgba(8, 8, 8, 0) 100%)",
            zIndex: 8,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "clamp(40px, 8vw, 140px)",
            background: "linear-gradient(to left, #080808 20%, rgba(8, 8, 8, 0) 100%)",
            zIndex: 8,
            pointerEvents: "none",
          }}
        />

        <div className="mkt-slanted-stage">
          <div className="mkt-row-wrapper" ref={row1Ref}>
            <div className="mkt-ribbon-track mkt-track-left">
              {row1Markets.map((m, idx) => renderCard(m, idx, false))}
              {row1Markets.map((m, idx) => renderCard(m, idx + 4, true))}
              {row1Markets.map((m, idx) => renderCard(m, idx + 8, true))}
            </div>
          </div>

          <div className="mkt-row-wrapper" ref={row2Ref}>
            <div className="mkt-ribbon-track mkt-track-right">
              {row2Markets.map((m, idx) => renderCard(m, idx, false))}
              {row2Markets.map((m, idx) => renderCard(m, idx + 4, true))}
              {row2Markets.map((m, idx) => renderCard(m, idx + 8, true))}
            </div>
          </div>
        </div>

        <style>{`
          .mkt-slanted-stage {
            position: relative;
            width: 124vw;
            left: -12vw;
            display: flex;
            flex-direction: column;
            gap: clamp(18px, 2.2vw, 28px);
            transform: rotate(-2.5deg);
            transform-origin: center center;
            padding: 24px 0 36px 0;
            will-change: transform;
          }

          .mkt-row-wrapper {
            position: relative;
            width: 100%;
            overflow: visible;
            will-change: transform;
            transition: transform 0.1s linear;
          }

          .mkt-ribbon-track {
            display: flex;
            gap: clamp(18px, 2vw, 26px);
            width: max-content;
            will-change: transform;
          }

          .mkt-track-left {
            animation: mktScrollLeft 38s linear infinite;
          }

          .mkt-track-right {
            animation: mktScrollRight 38s linear infinite;
          }

          .mkt-ribbon-track:hover {
            animation-play-state: paused;
          }

          .mkt-showcase-card:hover {
            transform: translateY(-8px) scale(1.025);
            border-color: rgba(195, 249, 16, 0.45) !important;
            box-shadow: 0 24px 48px -10px rgba(0, 0, 0, 0.95), 0 0 24px rgba(195, 249, 16, 0.16) !important;
            z-index: 10;
          }

          .mkt-showcase-card:hover .mkt-showcase-img {
            transform: scale(1.06);
          }

          .mkt-showcase-card:hover .mkt-cta-btn {
            color: #ffffff !important;
          }

          @keyframes mktScrollLeft {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(calc(-100% / 3), 0, 0);
            }
          }

          @keyframes mktScrollRight {
            0% {
              transform: translate3d(calc(-100% / 3), 0, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }

          @media (max-width: 768px) {
            .mkt-slanted-stage {
              width: 140vw;
              left: -20vw;
              gap: 16px;
              transform: rotate(-1.8deg);
              padding: 16px 0 24px 0;
            }
            .mkt-track-left {
              animation-duration: 28s;
            }
            .mkt-track-right {
              animation-duration: 28s;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .mkt-track-left,
            .mkt-track-right {
              animation: none;
            }
          }
        `}</style>
      </section>
    </>
  );
};
