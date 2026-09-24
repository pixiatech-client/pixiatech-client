import React from "react";
import { translations, Language } from "../data/translations";

interface SiteFooterProps {
  companyName: string;
  lang?: Language;
  onNavigate?: (page: "home" | "product") => void;
  onOpenAdminLogin?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  companyName,
  lang = "FR",
  onNavigate,
  onOpenAdminLogin,
}) => {
  const t = translations[lang].footer;

  return (
    <footer id="site-footer" className="bg-[#050505] text-[#f5f4f0] overflow-hidden border-t border-[#1a1a1a]">
      <div className="wrap pt-20 pb-12">
        {/* Foot Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-18 border-b border-[#1a1a1a]">
          {/* Products */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.products}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("product")}
                className="text-left text-[#c9c7c1] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                PXT Fine (WP Series)
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("product")}
                className="text-left text-[#c9c7c1] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                PXT Ultra Micro-Pitch
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate && onNavigate("home");
                  setTimeout(() => {
                    document.getElementById("kinetic")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-left text-[#C3F910] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 font-medium"
              >
                {lang === "FR" ? "SPKI-250 Cinétique 3D →" : "SPKI-250 Kinetic 3D →"}
              </button>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.company}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("home")}
                className="text-left text-[#c9c7c1] hover:text-[#C3F910] transition-colors cursor-pointer bg-transparent border-none p-0 font-semibold"
              >
                {lang === "FR" ? "Page d'accueil & Showreel 3D" : "Home & 3D Showreel"}
              </button>
              <a
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate("home");
                  setTimeout(() => {
                    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-[#c9c7c1] hover:text-white transition-colors"
              >
                {t.projects}
              </a>
              <a
                href="#technology"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate("home");
                  setTimeout(() => {
                    document.getElementById("technology")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-[#c9c7c1] hover:text-white transition-colors"
              >
                {lang === "FR" ? "Technologies ColdLED & ArmorLED" : "ColdLED & ArmorLED Technologies"}
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.resources}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <a
                href="#specs"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate("product");
                  setTimeout(() => {
                    document.getElementById("specs")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-[#c9c7c1] hover:text-white transition-colors"
              >
                {lang === "FR" ? "Matrice des Spécifications" : "Specifications Matrix"}
              </a>
              <a
                href="#showreel"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate("home");
                  setTimeout(() => {
                    document.getElementById("showreel")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-[#c9c7c1] hover:text-white transition-colors"
              >
                {lang === "FR" ? "Showreel 3D (Sub-diode)" : "3D Showreel (Sub-diode)"}
              </a>
            </div>
          </div>

          {/* Contact & Headquarters */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.headquarters}
            </div>
            <p className="text-[13px] text-[#888] leading-relaxed mb-4">
              {companyName} International<br />
              14 Avenue des Champs-Élysées<br />
              75008 Paris, France
            </p>
            <p className="text-[13px] text-[#c9c7c1] font-mono">
              contact@pixiatech.com<br />
              +33 (0)1 42 68 55 00
            </p>
          </div>
        </div>

        {/* Foot Meta */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-[#555]">
          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-widest">{companyName}</span>
            <span>· SCIENCE BEHIND THE LED</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              © {new Date().getFullYear()} {companyName}. {lang === "FR" ? "Tous droits réservés." : "All rights reserved."}
            </span>
            {onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 text-[10.5px] text-[#7a7a76] hover:text-[#C3F910] border border-[#222] hover:border-[#C3F910]/40 px-2.5 py-1 rounded transition-colors cursor-pointer"
                title="Accès Administration & Éditeur Elementor (Pixel Tech Web)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910]" />
                <span>Administration · Pixel Tech Web</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
