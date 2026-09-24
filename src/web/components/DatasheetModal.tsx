import React from "react";
import { X, Printer } from "lucide-react";
import { SpecModel } from "../types";
import specsData from "../data/specs-data.json";
import { Language } from "../data/translations";

interface DatasheetModalProps {
  model: SpecModel | null;
  onClose: () => void;
  companyName: string;
  lang?: Language;
}

export const DatasheetModal: React.FC<DatasheetModalProps> = ({
  model,
  onClose,
  companyName,
  lang = "FR",
}) => {
  if (!model) return null;

  const { groups } = specsData;

  const handlePrint = () => {
    window.print();
  };

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

  const printBtnText = lang === "FR" ? "IMPRIMER / PDF" : "PRINT / PDF";
  const certifiedSheetText = lang === "FR" ? "FICHE TECHNIQUE OFFICIELLE CERTIFIÉE" : "OFFICIAL CERTIFIED DATASHEET";
  const engineeringDeptText = lang === "FR" ? `DÉPARTEMENT TECHNIQUE ${companyName.toUpperCase()}` : `${companyName.toUpperCase()} ENGINEERING`;
  const platformSubtitle = lang === "FR" ? "Plateforme PXT Fine · Format natif 16:9 · Technologie basse consommation ColdLED™" : "PXT Fine Platform · Native 16:9 Aspect Ratio · ColdLED™ Low Power Technology";
  const measuredFooter = lang === "FR" ? "MESURÉ CONFORMÉMENT À LA DIRECTIVE CE / CEM 2014/30/UE" : "MEASURED IN ACCORDANCE WITH CE / EMC DIRECTIVE 2014/30/EU";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-3xl bg-[#0b0b0a] border border-[#222] p-6 sm:p-10 text-[#f5f4f0] shadow-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Actions */}
        <div className="absolute top-5 right-5 flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333] text-xs font-mono tracking-wider text-[#a3a3a3] hover:text-white hover:border-white transition-colors cursor-pointer"
            title={lang === "FR" ? "Imprimer ou enregistrer au format PDF" : "Print or Save as PDF"}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{printBtnText}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7a7a76] hover:text-white border border-[#222] hover:border-[#444] transition-colors cursor-pointer"
            aria-label={lang === "FR" ? "Fermer la fiche technique" : "Close datasheet"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Datasheet Header */}
        <div className="border-b border-[#222] pb-6 mb-6">
          <div className="flex items-center justify-between text-[10px] tracking-[0.22em] text-[#C3F910] uppercase font-mono mb-2">
            <span>{certifiedSheetText}</span>
            <span className="text-[#7a7a76]">{engineeringDeptText}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
            {model.name}
          </h2>
          <p className="text-xs text-[#a3a3a3] font-mono">
            {platformSubtitle}
          </p>
        </div>

        {/* Technical Specification Matrix */}
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label} className="border border-[#1f1f1f] bg-[#0e0e0d]">
              <div className="bg-[#141413] px-4 py-2 border-b border-[#1f1f1f] text-[10.5px] tracking-[0.2em] font-bold text-[#C3F910] uppercase font-mono">
                {translateGroupLabel(group.label)}
              </div>
              <div className="divide-y divide-[#181817]">
                {group.rows.map((row) => {
                  const valObj = (model.specs as Record<string, { v: string }>)[row.key];
                  const val = valObj ? valObj.v : "—";
                  return (
                    <div key={row.key} className="flex justify-between items-center px-4 py-2.5 text-xs">
                      <span className="text-[#7a7a76] tracking-wider uppercase font-mono">
                        {row.label}
                      </span>
                      <span className="font-semibold text-white text-right">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[#1f1f1f] flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#7a7a76] font-mono gap-2">
          <span>{measuredFooter}</span>
          <span>© 2026 {companyName.toUpperCase()} LABS</span>
        </div>
      </div>
    </div>
  );
};
