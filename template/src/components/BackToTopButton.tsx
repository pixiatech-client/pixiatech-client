import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Language } from "../data/translations";

interface BackToTopButtonProps {
  lang?: Language;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ lang = "FR" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button once user scrolls past 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const ariaLabel = lang === "FR" ? "Retourner en haut de page" : "Back to top";

  return (
    <button
      type="button"
      id="back-to-top-btn"
      onClick={scrollToTop}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`fixed bottom-6 right-6 z-40 group w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#0d0d0c]/90 backdrop-blur-md border border-[#2b2b28] text-[#f5f4f0] hover:border-[#C3F910] hover:text-[#C3F910] hover:shadow-[0_0_24px_rgba(195,249,16,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl cursor-pointer select-none no-underline ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
};

