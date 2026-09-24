import React, { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import { translations, Language } from "../data/translations";

interface SiteHeaderProps {
  companyName: string;
  onOpenConsultation: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  companyName,
  onOpenConsultation,
  lang,
  onToggleLang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const t = translations[lang].header;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.products, href: "#hero", active: true },
    { label: t.nav.overview, href: "#overview" },
    { label: t.nav.design, href: "#design" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.specifications, href: "#specs" },
    { label: t.nav.inTheField, href: "#fieldwork" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(12px, 2vw, 36px)",
          padding: "0 clamp(16px, 2.8vw, 60px)",
          height: scrolled ? "76px" : "88px",
          background: "rgba(8, 8, 8, 0.82)",
          backdropFilter: "blur(22px) saturate(1.3)",
          WebkitBackdropFilter: "blur(22px) saturate(1.3)",
          borderBottom: "1px solid rgba(245, 244, 240, 0.09)",
          transition: "height 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s ease",
        }}
      >
        {/* Brand Logo */}
        <a
          href="#hero"
          className="flex-none flex items-center gap-2 group"
          aria-label={`${companyName} Home`}
        >
          <div className="flex items-center tracking-[0.22em] font-black text-[21px] sm:text-[24px] text-[#f5f4f0] uppercase transition-colors group-hover:text-white">
            <span>{companyName}</span>
            <span className="w-1.5 h-1.5 bg-[#C3F910] rounded-full ml-1 animate-pulse" />
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-7 text-[11.5px] tracking-[0.17em] uppercase font-semibold text-[#b9b7b1]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`py-2 transition-colors duration-200 no-underline ${
                link.active
                  ? "text-white font-bold"
                  : "text-[#b9b7b1] hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-5 flex-none">
          {/* Language Selector */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 text-[11px] tracking-[0.14em] font-mono font-semibold py-1 px-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#a3a3a3] transition-colors cursor-pointer border border-white/10 no-underline select-none"
            style={{ textDecoration: "none" }}
            title="Langue / Language"
          >
            <span className={lang === "FR" ? "text-white font-bold" : "text-[#7a7a76]"}>FR</span>
            <span className="text-[#444] text-[10px]">/</span>
            <span className={lang === "EN" ? "text-white font-bold" : "text-[#7a7a76]"}>EN</span>
          </button>

          <div className="hidden sm:block w-[1px] h-[18px] bg-[rgba(245,244,240,0.16)]" />

          {/* Search Button */}
          <button
            type="button"
            aria-label="Search"
            title={t.searchTitle}
            onClick={() => {
              const el = document.getElementById("specs");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hidden sm:flex p-1.5 text-[#b9b7b1] hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Start a Project CTA Button */}
          <button
            type="button"
            onClick={onOpenConsultation}
            className="btn btn-outline text-[12px] sm:text-[13px] tracking-[0.08em] uppercase py-2.5 px-4 sm:px-6 cursor-pointer border border-[rgba(245,244,240,0.35)] text-[#f5f4f0] hover:border-white hover:text-white transition-colors"
          >
            {t.startProject}
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 border border-[rgba(245,244,240,0.35)] text-[#f5f4f0] hover:border-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0a0a] border-b border-[#222] px-6 py-6 space-y-4 text-[13px] tracking-[0.16em] uppercase font-semibold">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#c9c7c1] hover:text-white border-b border-[#1a1a1a]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full text-center py-3 bg-[#C3F910] text-black tracking-[0.1em] font-bold"
            >
              {t.requestConsultation}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
