import React, { useState, useRef } from "react";
import specsData from "../data/specs-data.json";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { SpecModel } from "../types";
import { translations, Language } from "../data/translations";

interface SpecsSectionProps {
  onSelectDatasheet: (model: SpecModel) => void;
  lang?: Language;
}

export const SpecsSection: React.FC<SpecsSectionProps> = ({ onSelectDatasheet, lang = "FR" }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = translations[lang].specs;

  const { models, groups } = specsData;

  const filterTabs = lang === "FR"
    ? [
        { id: "ALL", label: "TOUT" },
        { id: "OPTICAL", label: "OPTIQUE" },
        { id: "PHYSICAL", label: "PHYSIQUE" },
        { id: "ELECTRICAL", label: "ÉLECTRIQUE" },
        { id: "ENVIRONMENTAL", label: "ENVIRONNEMENT" },
      ]
    : [
        { id: "ALL", label: "ALL" },
        { id: "OPTICAL", label: "OPTICAL" },
        { id: "PHYSICAL", label: "PHYSICAL" },
        { id: "ELECTRICAL", label: "ELECTRICAL" },
        { id: "ENVIRONMENTAL", label: "ENVIRONMENTAL" },
      ];

  const filteredGroups =
    selectedGroup === "ALL"
      ? groups
      : groups.filter((g) => g.label.toLowerCase().includes(selectedGroup.toLowerCase()));

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // Group label translation helper
  const translateGroupLabel = (label: string) => {
    if (lang !== "FR") return label;
    switch (label.toUpperCase()) {
      case "OPTICAL":
        return "CARACTÉRISTIQUES OPTIQUES";
      case "PHYSICAL":
        return "SPÉCIFICATIONS MÉCANIQUES & PHYSIQUES";
      case "ELECTRICAL":
        return "SPÉCIFICATIONS ÉLECTRIQUES";
      case "ENVIRONMENTAL":
        return "ENVIRONNEMENT & CERTIFICATIONS";
      default:
        return label;
    }
  };

  return (
    <section id="specs" className="section theme-dark bg-[#080808] text-[#f5f4f0]">
      <div className="wrap">
        {/* Eyebrow */}
        <div className="text-[11px] tracking-[0.24em] text-[#7a7a76] mb-9 uppercase font-semibold">
          {t.eyebrow}
        </div>

        {/* Heading & Intro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-[clamp(34px,3.8vw,62px)] font-bold tracking-tight leading-[1.06] mb-4 text-[#f5f4f0]">
              {t.title}
            </h2>
            <p className="max-w-[580px] text-[15.5px] leading-[1.6] text-[#a3a3a3] m-0">
              {t.description}
            </p>
          </div>

          {/* Group Filter Tabs & Scroll Arrows */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-[#111] p-1 border border-[#222]">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedGroup(tab.id)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors cursor-pointer ${
                    selectedGroup === tab.id
                      ? "bg-white text-black font-bold"
                      : "text-[#7a7a76] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex gap-1 ml-2">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label={lang === "FR" ? "Faire défiler à gauche" : "Scroll specifications table left"}
                className="p-2 border border-[#222] bg-[#111] text-[#a3a3a3] hover:text-white hover:border-[#444] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label={lang === "FR" ? "Faire défiler à droite" : "Scroll specifications table right"}
                className="p-2 border border-[#222] bg-[#111] text-[#a3a3a3] hover:text-white hover:border-[#444] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Specifications Matrix Container with Horizontal Scroll */}
        <div className="border border-[#1f1f1f] bg-[#0a0a09] overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto spec-scroll">
            <div className="min-w-max">
              {/* Header Row: Model names and Datasheet buttons */}
              <div className="flex border-b border-[#1f1f1f] bg-[#0b0b0a] sticky top-0 z-20">
                <div className="flex-[0_0_240px] sticky left-0 z-30 bg-[#0b0b0a] p-5 text-[11px] tracking-[0.2em] text-[#7a7a76] font-mono border-r border-[#1f1f1f] flex items-end">
                  {t.modelCol}
                </div>
                {models.map((model) => (
                  <div
                    key={model.name}
                    className="flex-[0_0_280px] p-5 border-l border-[#161615] flex flex-col justify-between gap-3 bg-[#0b0b0a]"
                  >
                    <div>
                      <div className="text-[14px] font-bold text-[#f5f4f0] leading-snug">
                        {model.name}
                      </div>
                      <div className="text-[10px] text-[#7a7a76] tracking-wider font-mono mt-1">
                        PITCH: {model.specs.pitch?.v || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectDatasheet(model as unknown as SpecModel)}
                      className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase font-bold text-[#C3F910] border border-[#C3F910]/30 hover:bg-[#C3F910] hover:text-black transition-all cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      {t.datasheetBtn}
                    </button>
                  </div>
                ))}
              </div>

              {/* Group Rows and Spec Values */}
              {filteredGroups.map((group) => (
                <div key={group.label}>
                  {/* Category Banner */}
                  <div className="flex border-b border-[#1f1f1f] bg-[#111110]">
                    <div className="flex-[0_0_240px] sticky left-0 z-20 bg-[#111110] py-3 px-5 text-[10.5px] tracking-[0.22em] text-[#C3F910] font-bold border-r border-[#1f1f1f]">
                      {translateGroupLabel(group.label)}
                    </div>
                    <div className="flex-1 py-3 px-5 bg-[#111110]" />
                  </div>

                  {/* Individual Param Rows */}
                  {group.rows.map((row) => (
                    <div
                      key={row.key}
                      className="flex border-b border-[#161615] hover:bg-[#121211] transition-colors"
                    >
                      <div className="flex-[0_0_240px] sticky left-0 z-10 bg-[#0a0a09] py-3.5 px-5 text-[11px] tracking-[0.14em] text-[#7a7a76] border-r border-[#1f1f1f]">
                        {row.label}
                      </div>
                      {models.map((model) => {
                        const valObj = (model.specs as Record<string, { v: string }>)[row.key];
                        const valStr = valObj ? valObj.v : "—";
                        return (
                          <div
                            key={model.name + row.key}
                            className="flex-[0_0_280px] py-3.5 px-5 text-[14px] font-medium text-[#f5f4f0] border-l border-[#161615]"
                          >
                            {valStr}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-4 flex justify-between items-center text-[11px] tracking-[0.14em] text-[#7a7a76] font-mono">
          <span>{t.footnote}</span>
          <span className="hidden sm:inline">NOVASTAR COEX & A10S PRO COMPLIANT</span>
        </div>
      </div>
    </section>
  );
};
