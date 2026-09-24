import React from "react";
import { Language } from "../data/translations";
import { AboutHeroSection } from "./AboutHeroSection";
import { ManifestoSection } from "./ManifestoSection";
import { ShowreelSection } from "./ShowreelSection";
import { MarketsSection } from "./MarketsSection";
import { KineticSection } from "./KineticSection";
import { TechShowcaseSection } from "./TechShowcaseSection";
import { AboutExperienceSection } from "./AboutExperienceSection";
import { FieldworkSection } from "./FieldworkSection";
import { NextSection } from "./NextSection";
import { EditableWrapper } from "./cms/EditableWrapper";

interface AboutPageProps {
  lang: Language;
  onOpenConsultation: () => void;
  onNavigateToProduct: (slug?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  lang,
  onOpenConsultation,
  onNavigateToProduct,
}) => {
  return (
    <div className="w-full bg-[#080808] text-[#f5f4f0]">
      {/* Section 0: Top Hero Section with 3-Slide Carousel, Dots & Telemetry */}
      <AboutHeroSection
        lang={lang}
        onOpenConsultation={onOpenConsultation}
      />

      {/* Section 01: Manifesto with Interactive Reactive Pixel Canvas Grid */}
      <EditableWrapper sectionKey="manifesto" sectionLabel="Manifeste & Vision">
        <ManifestoSection lang={lang} />
      </EditableWrapper>

      {/* Section 02: Interactive 3D Pull-Back Showreel (Sub-millimeter diode to 800m skyline) */}
      <EditableWrapper sectionKey="showreel" sectionLabel="Showreel 3D (Écran LED)">
        <ShowreelSection
          lang={lang}
          onOpenConsultation={onOpenConsultation}
        />
      </EditableWrapper>

      {/* Section 03: Markets Section (#markets) with Horizontal Swipe Track */}
      <EditableWrapper sectionKey="markets" sectionLabel="Marchés & Solutions">
        <MarketsSection
          lang={lang}
          onOpenConsultation={onOpenConsultation}
        />
      </EditableWrapper>

      {/* Section 04: Kinetic Screen Section (#kinetic) with Real-Time 3D Simulation & CAD Blueprint */}
      <EditableWrapper sectionKey="kinetic" sectionLabel="Kinetic SPKI-250 (3D & Diode)">
        <KineticSection
          lang={lang}
          onOpenConsultation={onOpenConsultation}
        />
      </EditableWrapper>

      {/* Section 05: Proprietary Technologies (#technology) with ColdLED, SolidSkin, ArmorLED, CBSF */}
      <TechShowcaseSection
        lang={lang}
        onOpenConsultation={onOpenConsultation}
      />

      {/* Section 06: Process & Experience Showroom (#process & #experience) */}
      <AboutExperienceSection
        lang={lang}
        onOpenConsultation={onOpenConsultation}
      />

      {/* Section 07: Real World Projects & Installations (#projects) */}
      <div id="projects">
        <FieldworkSection
          companyName="PIXIATECH"
          lang={lang}
        />
      </div>

      {/* Section 08: Flagship Product Showcase Banner */}
      <section className="bg-[#0b0b0a] border-t border-[#1f1f1f] py-24 text-center">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: ".24em",
              color: "#7A7A76",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            {lang === "FR" ? "SÉRIE PHARE EN VEDETTE" : "FEATURED FLAGSHIP SERIES"}
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 800,
              color: "#F5F4F0",
              margin: "0 0 20px",
              letterSpacing: "-.02em",
            }}
          >
            {lang === "FR"
              ? "PXT Fine — L'Écran Mural Micro-Pitch"
              : "PXT Fine — The Wallpaper-Thin Micro-Pitch LED"}
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 1.3vw, 19px)",
              color: "#A3A3A3",
              maxWidth: 680,
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            {lang === "FR"
              ? "Ratio 16:9 natif, technologie ColdLED éco-énergétique et surface blindée SolidSkin pour les auditoriums et sièges d'entreprise."
              : "Native 16:9 ratio, ultra-efficient ColdLED thermodynamics and SolidSkin impact protection for landmark boardrooms and auditoriums."}
          </p>
          <button
            type="button"
            onClick={() => onNavigateToProduct("wp")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 36px",
              background: "#C3F910",
              color: "#080808",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              border: 0,
              cursor: "pointer",
              transition: "all .25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#C3F910";
            }}
          >
            <span>{lang === "FR" ? "Explorer le menu du produit PXT Fine →" : "Explore PXT Fine Product Menu →"}</span>
          </button>
        </div>
      </section>

      {/* Section 09: Final Consultation / Contact Banner (#contact) */}
      <div id="contact">
        <NextSection
          lang={lang}
          onOpenConsultation={onOpenConsultation}
        />
      </div>
    </div>
  );
};
