import React, { useRef, useEffect } from "react";
import { Language } from "../data/translations";

interface MarketsSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({
  lang = "FR",
  onOpenConsultation,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
            : "Fast to build, safe to tour, impossible to ignore.",
        cta: lang === "FR" ? "EXPLORER RENTAL →" : "EXPLORE RENTAL →",
        img: "/assets/about/market-rental.jpg",
      },
      {
        id: "xr",
        num: "05",
        name: "XR & VIRTUAL PRODUCTION",
        desc:
          lang === "FR"
            ? "Conçu avec une précision millimétrique pour les caméras broadcast et plateaux virtuels."
            : "Precision-built for the camera.",
        cta: lang === "FR" ? "EXPLORER XR →" : "EXPLORE XR →",
        img: "/assets/about/market-xr.jpg",
      },
      {
        id: "sports",
        num: "06",
        name: "STADES & ARENAS",
        desc:
          lang === "FR"
            ? "Écrans géants pour tribunes et rubans de coursives résistant aux intempéries."
            : "High-impact visual systems built for large-scale sports venues.",
        cta: lang === "FR" ? "EXPLORER SPORTS →" : "EXPLORE SPORTS →",
        img: "/assets/about/market-sports.jpg",
      },
    ],
  };

  useEffect(() => {
    let animId = 0;
    let maxDist = 0;

    const measure = () => {
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      const track = trackRef.current;
      if (!wrapper || !sticky || !track) return;

      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        sticky.style.position = "relative";
        sticky.style.height = "auto";
        sticky.style.overflowX = "auto";
        sticky.style.scrollSnapType = "x mandatory";
        wrapper.style.height = "auto";
        track.style.transform = "none";
        maxDist = 0;
        return;
      }

      sticky.style.position = "sticky";
      sticky.style.top = "0";
      sticky.style.height = "100vh";
      sticky.style.overflow = "hidden";
      sticky.style.scrollSnapType = "none";

      // Distance the track needs to scroll: track scroll width minus visible viewport width
      const trackScrollWidth = track.scrollWidth;
      const r = Math.max(trackScrollWidth - window.innerWidth + 80, 0);
      maxDist = r;

      // Expand wrapper height so natural page scrolling drives the pinned horizontal scroll
      wrapper.style.height = `calc(100vh + ${r}px)`;
    };

    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (window.innerWidth <= 768 || maxDist <= 0 || !wrapper || !track) return;

      if (!animId) {
        animId = requestAnimationFrame(() => {
          animId = 0;
          const rect = wrapper.getBoundingClientRect();
          // Progress: when rect.top is 0 (just pinned), progress is 0.
          // When rect.top is -maxDist (scrolled all the way to last card), progress is 1.
          const progress = Math.min(Math.max(-rect.top / maxDist, 0), 1);
          track.style.transform = `translate3d(${-progress * maxDist}px, 0, 0)`;
        });
      }
    };

    measure();
    handleScroll();

    const timer = setTimeout(() => {
      measure();
      handleScroll();
    }, 200);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <span id="markets" style={{ display: "block", height: 0, marginTop: -90, paddingTop: 90 }} />
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          background: "#080808",
          color: "#F5F4F0",
          borderTop: "1px solid #1c1c1b",
        }}
      >
        <div
          ref={stickyRef}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Header Title matching exact screenshot */}
          <div
            style={{
              maxWidth: 1520,
              width: "100%",
              margin: "0 auto",
              padding: "clamp(24px, 4vh, 48px) clamp(16px, 3.5vw, 64px) clamp(16px, 2.5vh, 28px)",
              flex: "none",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".24em",
                color: "#7A7A76",
                marginBottom: 14,
                textTransform: "uppercase",
                fontFamily: "monospace",
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
              }}
            >
              {t.title}
            </h2>
          </div>

          {/* Horizontal Track transformed with translate3d on scroll */}
          <div
            ref={trackRef}
            className="mkt-track"
            style={{
              display: "flex",
              gap: 24,
              padding: "0 clamp(16px, 3.5vw, 64px)",
              willChange: "transform",
            }}
          >
            {t.markets.map((m) => (
              <div
                key={m.id}
                className="mkt-card"
                style={{
                  flex: "none",
                  position: "relative",
                  overflow: "hidden",
                  width: "76vw",
                  maxWidth: 1180,
                  height: "min(58vh, 560px)",
                  minHeight: 360,
                  background: "#0e0e0d",
                  border: "1px solid #1a1a19",
                }}
              >
                <img
                  src={m.img}
                  alt={`${m.name} — PIXIATECH`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Gradient shadow overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "32px 36px",
                    background: "linear-gradient(180deg, transparent 0%, rgba(8,8,8,.88) 100%)",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: ".24em",
                      color: "#C9C7C1",
                      marginBottom: 8,
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {m.num} — {m.name}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(18px, 1.8vw, 24px)",
                      fontWeight: 700,
                      color: "#F5F4F0",
                      marginBottom: 14,
                      lineHeight: 1.3,
                      maxWidth: 820,
                    }}
                  >
                    {m.desc}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      fontSize: 12,
                      letterSpacing: ".14em",
                      fontWeight: 700,
                      color: "#C3F910",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      pointerEvents: "auto",
                      borderBottom: "1px solid #C3F910",
                    }}
                  >
                    {m.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
