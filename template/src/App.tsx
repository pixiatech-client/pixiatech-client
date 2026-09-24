import React, { useState } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { HeroSection } from "./components/HeroSection";
import { OverviewSection } from "./components/OverviewSection";
import { DesignSection } from "./components/DesignSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { SpecsSection } from "./components/SpecsSection";
import { FieldworkSection } from "./components/FieldworkSection";
import { NextSection } from "./components/NextSection";
import { SiteFooter } from "./components/SiteFooter";
import { ConsultationModal } from "./components/ConsultationModal";
import { DatasheetModal } from "./components/DatasheetModal";
import { BackToTopButton } from "./components/BackToTopButton";
import { SpecModel } from "./types";

export function App() {
  const [companyName] = useState<string>("PixiaTech");
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<"EN" | "FR">("FR");

  const toggleLang = () => {
    setLang((prev) => (prev === "EN" ? "FR" : "EN"));
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Sticky Blur Header */}
      <SiteHeader
        companyName={companyName}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        lang={lang}
        onToggleLang={toggleLang}
      />

      {/* Main Product Sections */}
      <main>
        {/* Section 0: Hero & Animated LED Canvas */}
        <HeroSection
          title="PXT Fine"
          onOpenQuote={() => setIsConsultationOpen(true)}
          lang={lang}
        />

        {/* Section 01: Overview (Light Theme) */}
        <OverviewSection
          companyName={companyName}
          lang={lang}
        />

        {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
        <DesignSection
          lang={lang}
        />

        {/* Section 03: Key Features Interactive FStage (Dark Theme) */}
        <FeaturesSection
          lang={lang}
        />

        {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
        <SpecsSection
          onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
          lang={lang}
        />

        {/* Section 05: In The Field Projects (Light Theme) */}
        <FieldworkSection
          companyName={companyName}
          lang={lang}
        />

        {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
        <NextSection
          onOpenConsultation={() => setIsConsultationOpen(true)}
          lang={lang}
        />
      </main>

      {/* Site Footer */}
      <SiteFooter
        companyName={companyName}
        lang={lang}
      />

      {/* Consultation & Quote Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        companyName={companyName}
        lang={lang}
      />

      {/* Datasheet Printable Modal */}
      <DatasheetModal
        model={activeDatasheetModel}
        onClose={() => setActiveDatasheetModel(null)}
        companyName={companyName}
        lang={lang}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton lang={lang} />
    </div>
  );
}

export default App;
