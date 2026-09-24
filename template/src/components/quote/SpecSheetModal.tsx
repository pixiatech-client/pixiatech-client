import React from 'react';
import { X, Download, Printer, CheckCircle2, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';

export const SpecSheetModal: React.FC = () => {
  const { isSpecSheetModalOpen, setIsSpecSheetModalOpen, data, showToast } = useProduct();

  if (!isSpecSheetModalOpen) return null;

  const handleDownload = () => {
    window.print();
    showToast('Impression / Export PDF lancé', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0e111a] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base text-white tracking-wide">Fiche Technique Certifiée PixiaTech</h3>
              <p className="text-xs text-slate-400">Écrans LED Transparents Vitrine • Série WP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c6ff00] text-black font-tech text-xs font-bold hover:bg-[#b5eb00] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={() => setIsSpecSheetModalOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#090b10] text-slate-200 print:bg-white print:text-black">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-tech font-black text-2xl text-white">PIXIATECH</span>
                <span className="w-2 h-2 rounded-full bg-[#c6ff00]" />
              </div>
              <p className="text-xs font-mono text-slate-400">LABORATOIRE & R&D SAINT-OUEN (GRAND PARIS)</p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-[#c6ff00] font-bold block">REF: FT-WP-2026-V4</span>
              <span className="text-slate-400">Date : Septembre 2026</span>
            </div>
          </div>

          {/* Product Identification */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <h4 className="font-tech text-base font-bold text-white mb-2">
              SÉRIE WP • ÉCRANS TRANSPARENTS HAUTE LUMINOSITÉ (5500 - 7000 NITS)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              La série WP est une solution modulaire d'affichage dynamique conçue pour les baies vitrées de magasins, showrooms automobiles et verrières architecturales, offrant jusqu'à 85% de perméabilité à la lumière naturelle et un refroidissement 100% passif ColdLED™.
            </p>
          </div>

          {/* Key certified specs list */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-slate-400">TRANSPARENCE</div>
              <div className="font-tech text-lg font-bold text-[#c6ff00]">Jusqu'à 85%</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-slate-400">LUMINOSITÉ</div>
              <div className="font-tech text-lg font-bold text-[#c6ff00]">6 500 nits</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-slate-400">RAFRAÎCHISSEMENT</div>
              <div className="font-tech text-lg font-bold text-[#c6ff00]">3 840 Hz</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-slate-400">DURÉE DE VIE</div>
              <div className="font-tech text-lg font-bold text-[#c6ff00]">≥ 100 000 h</div>
            </div>
          </div>

          {/* Detailed Matrix in preview */}
          <div className="space-y-3">
            <h5 className="font-tech text-xs uppercase tracking-wider text-slate-400">
              Matrice des spécifications par pitch
            </h5>
            <table className="w-full text-xs border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5 text-slate-300 font-mono">
                <tr>
                  <th className="p-2.5 text-left">Paramètre</th>
                  <th className="p-2.5 text-left text-[#c6ff00]">WP P2.8</th>
                  <th className="p-2.5 text-left text-[#c6ff00]">WP P3.91</th>
                  <th className="p-2.5 text-left text-[#c6ff00]">WP P7.82</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {data.specifications.rows.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 text-slate-300">{r.param}</td>
                    <td className="p-2 text-slate-400">{r.p28}</td>
                    <td className="p-2 text-slate-400">{r.p39}</td>
                    <td className="p-2 text-slate-400">{r.p78}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compliance & Standards */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#c6ff00]" />
              <span>Normes CE (LVD 2014/35/EU, EMC 2014/30/EU), RoHS 2011/65/EU</span>
            </div>
            <span className="text-[#c6ff00]">GARANTIE 3 ANS PIXIATECH</span>
          </div>
        </div>
      </div>
    </div>
  );
};
