import React, { useState, useEffect } from "react";
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
import { AboutPage } from "./components/AboutPage";
import { SpecModel } from "./types";
import { CmsProvider, useCms } from "./context/CmsContext";
import { AdminTopBar } from "./components/cms/AdminTopBar";
import { ElementorDrawer } from "./components/cms/ElementorDrawer";
import { AdminLoginModal } from "./components/cms/AdminLoginModal";
import { BackendExportModal } from "./components/cms/BackendExportModal";

function AppContent() {
  const [companyName] = useState<string>("PIXIATECH");
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<"EN" | "FR">("FR");
  const [currentPage, setCurrentPage] = useState<"home" | "product">("home");
  const [activeProductSlug, setActiveProductSlug] = useState<string>("wp");

  // CMS state
  const { isAdmin, isEditing, currentPageId, setCurrentPageId, pages } = useCms();
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Sync CMS current page ID with router
  useEffect(() => {
    const targetId = currentPage === "home" ? "home" : "product_wp";
    if (currentPageId !== targetId) {
      setCurrentPageId(targetId);
    }
  }, [currentPage, currentPageId, setCurrentPageId]);

  // Sync with browser history & URL hash
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setCurrentPage(e.state.page);
      } else {
        const hash = window.location.hash.toLowerCase();
        if (
          hash.includes("product") ||
          hash.includes("overview") ||
          hash.includes("design") ||
          hash.includes("features") ||
          hash.includes("configurator")
        ) {
          setCurrentPage("product");
        } else {
          setCurrentPage("home");
        }
      }
    };

    // Initial check on load
    const hash = window.location.hash.toLowerCase();
    if (
      hash.includes("product") ||
      hash.includes("overview") ||
      hash.includes("design") ||
      hash.includes("features") ||
      hash.includes("configurator")
    ) {
      setCurrentPage("product");
    } else {
      setCurrentPage("home");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const toggleLang = () => {
    setLang((prev) => (prev === "EN" ? "FR" : "EN"));
  };

  const handleNavigate = (page: "home" | "product") => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      window.history.pushState(
        { page },
        "",
        page === "home" ? "#markets" : "#product"
      );
    } catch {
      // ignore
    }
  };

  const handleSelectProduct = (slug?: string) => {
    setActiveProductSlug(slug || "wp");
    handleNavigate("product");
  };

  const currentPageTitle =
    currentPage === "home"
      ? (pages["home"]?.name || "Page d'Accueil & Showreel")
      : (pages["product_wp"]?.name || "Produit PXT Fine");

  return (
    <div className={`min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-[#C3F910]/20 selection:text-[#C3F910] ${isAdmin ? "pt-9" : ""}`}>
      {/* Admin Top Bar (Visible when admin is logged in) */}
      <AdminTopBar
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        currentPageTitle={currentPageTitle}
      />

      {/* Elementor Side Drawer (Visible when editing) */}
      <ElementorDrawer
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
      />

      {/* Dynamic Header with Mega Menu and Product Sub-Nav + Back Button */}
      <SiteHeader
        companyName={companyName}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        lang={lang}
        onToggleLang={toggleLang}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        activeProductSlug={activeProductSlug}
        onSelectProduct={handleSelectProduct}
      />

      {/* Main Content Router */}
      <main>
        {currentPage === "home" ? (
          /* Primary Homepage: Exact reproduction of https://xeron.co/en#markets */
          <AboutPage
            lang={lang}
            onOpenConsultation={() => setIsConsultationOpen(true)}
            onNavigateToProduct={handleSelectProduct}
          />
        ) : (
          /* Product Detail View: Flagship PXT Fine with in-page navigation & Back button */
          <div className="pt-20">
            {/* Top Back Breadcrumb Bar for clear return navigation */}
            <div className="bg-[#0e0e0d] border-b border-[#1c1c1b] py-3.5 px-4 sm:px-12">
              <div className="max-w-[1520px] mx-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleNavigate("home")}
                  className="inline-flex items-center gap-2 text-[12px] font-mono font-bold text-[#C3F910] hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
                >
                  <span className="text-base leading-none">←</span>
                  <span>{lang === "FR" ? "RETOUR À LA PAGE D'ACCUEIL / MENU PRINCIPAL" : "BACK TO HOMEPAGE / MAIN MENU"}</span>
                </button>
                <div className="text-[11px] font-mono text-[#7A7A76] tracking-widest hidden sm:block">
                  PIXIATECH / ARCHITECTURAL LED
                </div>
              </div>
            </div>

            {/* Section 0: Hero & Animated LED Canvas */}
            <div id="overview">
              <HeroSection
                title="PXT Fine"
                onOpenQuote={() => setIsConsultationOpen(true)}
                lang={lang}
              />
            </div>

            {/* Section 01: Overview (Light Theme) */}
            <OverviewSection
              companyName={companyName}
              lang={lang}
            />

            {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
            <div id="design">
              <DesignSection
                lang={lang}
              />
            </div>

            {/* Section 03: Key Features Interactive Stage (Dark Theme) */}
            <div id="features">
              <FeaturesSection
                lang={lang}
              />
            </div>

            {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
            <div id="specs">
              <SpecsSection
                onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
                lang={lang}
              />
            </div>

            {/* Section 05: In The Field Projects (Light Theme) */}
            <div id="fieldwork">
              <FieldworkSection
                companyName={companyName}
                lang={lang}
              />
            </div>

            {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
            <NextSection
              onOpenConsultation={() => setIsConsultationOpen(true)}
              lang={lang}
            />
          </div>
        )}
      </main>

      {/* Site Footer */}
      <SiteFooter
        companyName={companyName}
        lang={lang}
        onNavigate={handleNavigate}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Floating Admin Button (If not logged in, allows direct 1-click admin authentication) */}
      {!isAdmin && (
        <button
          type="button"
          onClick={() => setIsAdminLoginOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-[#141414] hover:bg-[#1f1f1f] text-[#C3F910] hover:text-white border border-[#333] hover:border-[#C3F910]/50 shadow-2xl px-3.5 py-2 rounded-full flex items-center gap-2 text-[11px] font-mono font-semibold transition-all cursor-pointer group"
          title="Connexion Administration / Mode Éditeur Elementor"
        >
          <span className="w-2 h-2 rounded-full bg-[#C3F910] group-hover:scale-125 transition-transform" />
          <span>Éditer cette page (Admin)</span>
        </button>
      )}

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

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />

      {/* Backend & Dev Export Modal */}
      <BackendExportModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <CmsProvider>
      <AppContent />
    </CmsProvider>
  );
}

export default App;
