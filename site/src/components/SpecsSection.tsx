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
  const [activeMobileModelIndex, setActiveMobileModelIndex] = useState<number>(0);
  const [compareModelIndex, setCompareModelIndex] = useState<number | null>(null);
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

        {/* Desktop Specifications Matrix Container with Horizontal Scroll */}
        <div className="hidden md:block border border-[#1f1f1f] bg-[#0a0a09] overflow-hidden">
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

        {/* Targeted Mobile Responsive Specifications Experience */}
        <div className="block md:hidden">
          {/* Mobile Model Selector Tabs */}
          <div className="mb-4">
            <div className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#7a7a76] mb-2">
              {lang === "FR" ? "Sélectionnez le modèle :" : "Select model:"}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 spec-scroll">
              {models.map((m, idx) => {
                const isActive = activeMobileModelIndex === idx;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setActiveMobileModelIndex(idx)}
                    className={`flex-none px-3.5 py-2.5 text-left border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#C3F910] text-black border-[#C3F910] font-bold shadow-lg"
                        : "bg-[#111] text-[#c9c7c1] border-[#222] hover:border-[#444]"
                    }`}
                  >
                    <div className="text-[12px] whitespace-nowrap leading-tight">{m.name}</div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isActive ? "text-black/80 font-bold" : "text-[#7a7a76]"}`}>
                      PITCH {m.specs.pitch?.v || "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Model Summary Header on Mobile */}
          {(() => {
            const currentModel = models[activeMobileModelIndex] || models[0];
            const secondaryModel = compareModelIndex !== null ? models[compareModelIndex] : null;

            return (
              <div className="border border-[#1f1f1f] bg-[#0c0c0b] mb-4">
                <div className="p-4 bg-[#141413] border-b border-[#222] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] tracking-[0.16em] uppercase font-mono text-[#C3F910] font-bold">
                      {lang === "FR" ? "Modèle actif" : "Active model"}
                    </div>
                    <div className="text-[17px] font-bold text-white mt-0.5">
                      {currentModel.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectDatasheet(currentModel as unknown as SpecModel)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] tracking-wider uppercase font-bold text-black bg-[#C3F910] hover:bg-white transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.datasheetBtn}</span>
                  </button>
                </div>

                {/* Compare Selector Bar */}
                <div className="px-4 py-2.5 bg-[#0e0e0d] border-b border-[#1f1f1f] flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#7a7a76] font-mono">
                    {lang === "FR" ? "Mode comparaison :" : "Compare mode:"}
                  </span>
                  <select
                    value={compareModelIndex !== null ? compareModelIndex : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompareModelIndex(val === "" ? null : Number(val));
                    }}
                    className="bg-[#181816] text-[#f5f4f0] text-[11px] font-mono px-2 py-1 border border-[#333] focus:outline-none focus:border-[#C3F910]"
                  >
                    <option value="">{lang === "FR" ? "— Aucun (Vue solo) —" : "— None (Single view) —"}</option>
                    {models.map((m, idx) => {
                      if (idx === activeMobileModelIndex) return null;
                      return (
                        <option key={m.name} value={idx}>
                          VS {m.name} ({m.specs.pitch?.v})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Categories & Parameters Mobile List */}
                <div className="divide-y divide-[#1a1a19]">
                  {filteredGroups.map((group) => (
                    <div key={group.label} className="pt-2">
                      <div className="bg-[#141413] px-4 py-2.5 text-[11px] tracking-[0.2em] font-mono uppercase font-bold text-[#C3F910] border-y border-[#222]">
                        {translateGroupLabel(group.label)}
                      </div>
                      <div className="divide-y divide-[#161615]">
                        {group.rows.map((row) => {
                          const val1 = (currentModel.specs as Record<string, { v: string }>)[row.key]?.v || "—";
                          const val2 = secondaryModel
                            ? (secondaryModel.specs as Record<string, { v: string }>)[row.key]?.v || "—"
                            : null;

                          return (
                            <div key={row.key} className="p-3.5 hover:bg-[#111110] transition-colors">
                              <div className="text-[11px] font-mono tracking-wider text-[#8a8a86] uppercase mb-1">
                                {row.label}
                              </div>
                              {secondaryModel ? (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div className="bg-[#141413] p-2 border border-[#222]">
                                    <div className="text-[9.5px] font-mono text-[#C3F910] mb-0.5 truncate">
                                      {currentModel.name}
                                    </div>
                                    <div className="text-[13px] font-bold text-white">{val1}</div>
                                  </div>
                                  <div className="bg-[#141413] p-2 border border-[#222]">
                                    <div className="text-[9.5px] font-mono text-[#a3a3a3] mb-0.5 truncate">
                                      {secondaryModel.name}
                                    </div>
                                    <div className="text-[13px] font-bold text-white">{val2}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[14px] font-semibold text-white pl-0.5">
                                  {val1}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
