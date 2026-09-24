import React, { useState, useEffect } from "react";
import { Language } from "../data/translations";
import { useCms } from "../context/CmsContext";
import { EditableWrapper } from "./cms/EditableWrapper";

interface AboutHeroSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const AboutHeroSection: React.FC<AboutHeroSectionProps> = ({
  lang = "FR",
  onOpenConsultation,
}) => {
  const { pages } = useCms();
  const cmsHero = pages["home"]?.sections?.hero || {};

  const [activeSlide, setActiveSlide] = useState(0);

  const heroPrimaryImage = cmsHero.primaryImage || cmsHero.heroImage || "/assets/hero/hero-1.jpg";

  const slides = [
    {
      img: heroPrimaryImage,
      alt: "LED installation — architectural lobby with illuminated structure",
    },
    {
      img: "/assets/hero/hero-2.jpg",
      alt: "LED installation — atrium with immersive LED display",
    },
    {
      img: "/assets/hero/hero-3.jpg",
      alt: "LED installation — curved panoramic LED wall",
    },
  ];

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const t = {
    eyebrow: cmsHero.badge || "PIXIATECH / VISUAL TECHNOLOGY",
    h1Line1: cmsHero.title || (lang === "FR" ? "L'INGÉNIERIE" : "ENGINEERED"),
    h1Line2: cmsHero.tagline || (lang === "FR" ? "DU VISUEL." : "TO BE SEEN."),
    sub:
      cmsHero.subtitle ||
      (lang === "FR"
        ? "Systèmes d'affichage LED de haute précision conçus pour l'architecture, l'entreprise et les expériences visuelles inoubliables."
        : "Professional LED display systems engineered for architecture, business and unforgettable visual experiences."),
    cta1: cmsHero.ctaText || (lang === "FR" ? "Explorer les Marchés →" : "Explore Solutions →"),
    cta2: lang === "FR" ? "Démarrer un Projet →" : "Start a Project →",
    city: lang === "FR" ? "PARIS · MONDE" : "PARIS · GLOBAL PROJECTS",
    scroll: lang === "FR" ? "DÉFILEZ POUR DÉCOUVRIR ↓" : "SCROLL TO DISCOVER ↓",
    tagline: lang === "FR" ? "SYSTÈMES D'AFFICHAGE LED" : "LED DISPLAY SYSTEMS",
  };

  return (
    <EditableWrapper sectionKey="hero" sectionLabel="Hero d'Accueil (Textes & Photos)">
      <section
        id="top"
        className="hero"
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 680,
          overflow: "hidden",
          background: "#080808",
          color: "#F5F4F0",
        }}
      >
      {/* Background Slides with smooth fade & Ken Burns zoom */}
      {slides.map((s, idx) => {
        const isActive = idx === activeSlide;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive ? "scale(1.05)" : "scale(1)",
              transition: "opacity .9s ease, transform 6s cubic-bezier(.2,.8,.2,1)",
              willChange: "transform, opacity",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            <img
              src={s.img}
              alt={s.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        );
      })}

      {/* Vignette & Contrast Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,8,8,.55) 0%, rgba(8,8,8,.18) 40%, rgba(8,8,8,.84) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top right slide indicator dots */}
      <div
        style={{
          position: "absolute",
          top: 104,
          right: "clamp(16px, 3.5vw, 60px)",
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSlide(i)}
            style={{
              background: i === activeSlide ? "#C3F910" : "rgba(255,255,255,0.2)",
              color: i === activeSlide ? "#000" : "#a3a3a3",
              border: 0,
              fontSize: 10,
              fontFamily: "monospace",
              fontWeight: 700,
              padding: "4px 8px",
              cursor: "pointer",
              transition: "all .3s ease",
            }}
          >
            0{i + 1}
          </button>
        ))}
      </div>

      {/* Hero Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          maxWidth: 1520,
          margin: "0 auto",
          padding: "0 clamp(16px, 3.5vw, 60px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: "clamp(40px, 6vh, 60px)",
        }}
      >
        <div style={{ maxWidth: 1100 }}>
          {/* Eyebrow */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".24em",
              color: "#C3F910",
              marginBottom: 20,
              fontFamily: "monospace",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {t.eyebrow}
          </div>

          {/* Huge H1 Headline */}
          <h1
            style={{
              fontSize: "clamp(44px, 7.2vw, 112px)",
              fontWeight: 900,
              letterSpacing: "-.03em",
              lineHeight: 0.94,
              color: "#F5F4F0",
              margin: "0 0 28px",
              textTransform: "uppercase",
            }}
          >
            <span style={{ display: "block" }}>{t.h1Line1}</span>
            <span style={{ display: "block", color: "#C3F910" }}>{t.h1Line2}</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(16px, 1.4vw, 21px)",
              lineHeight: 1.55,
              color: "#C9C7C1",
              maxWidth: 620,
              margin: "0 0 36px",
              fontWeight: 400,
            }}
          >
            {t.sub}
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 54 }}>
            <a
              href="#markets"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 32px",
                background: "#C3F910",
                color: "#080808",
                fontWeight: 800,
                fontSize: 12.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "all .25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#C3F910";
              }}
            >
              {t.cta1}
            </a>

            <button
              type="button"
              onClick={onOpenConsultation}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 32px",
                background: "transparent",
                border: "1px solid rgba(245,244,240,.4)",
                color: "#F5F4F0",
                fontWeight: 700,
                fontSize: 12.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all .25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ffffff";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,244,240,.4)";
                e.currentTarget.style.color = "#F5F4F0";
              }}
            >
              {t.cta2}
            </button>
          </div>
        </div>

        {/* Hero Bottom Telemetry Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            paddingTop: 24,
            borderTop: "1px solid rgba(245,244,240,.15)",
            fontSize: 11,
            letterSpacing: ".18em",
            fontFamily: "monospace",
            color: "#7A7A76",
          }}
        >
          <span>{t.city}</span>
          <span style={{ color: "#C3F910", animation: "pulse 2.5s infinite" }}>
            {t.scroll}
          </span>
          <span>{t.tagline}</span>
        </div>
      </div>
    </section>
    </EditableWrapper>
  );
};
