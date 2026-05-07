'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, User, Users, Send, FileText, History, Box, Truck, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Estimation } from '../types';

interface EstimationDetailsProps {
  estimation: Estimation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EstimationDetails: React.FC<EstimationDetailsProps> = ({ estimation, isOpen, onClose }) => {
  if (!estimation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#fef9c3] z-[101] shadow-2xl overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-zinc-600" />
                    </button>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Détails de l'estimation</h2>
                        <span className="text-zinc-400 font-bold tracking-wide text-[10px] uppercase">{estimation.number}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-zinc-100 transition-all">
                    <User className="w-3.5 h-3.5" />
                    Client
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-zinc-100 transition-all">
                    <Users className="w-3.5 h-3.5" />
                    Fournisseur
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-bold uppercase tracking-wide text-zinc-400 hover:bg-zinc-100 transition-all">
                    <Truck className="w-3.5 h-3.5" />
                    Transmettre
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-zinc-100 relative">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Client</h3>
                    <FileText className="absolute right-4 top-4 w-4 h-4 text-blue-500 cursor-pointer" />
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-zinc-900">Nom:</span>
                      <span className="text-zinc-600">{estimation.client}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-zinc-900">Email:</span>
                      <span className="text-zinc-600">{estimation.email || '-'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-zinc-900">Téléphone:</span>
                      <span className="text-zinc-600">{estimation.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Historique</h3>
                  </div>
                  <div className="flex items-center justify-center h-20 text-center">
                    <p className="text-zinc-400 text-xs italic">Aucun historique.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Produits</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-zinc-400 text-xs mb-4">Total initial: {estimation.totalPurchase.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>

                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Remise Produits (%)</label>
                      <input
                        type="number"
                        defaultValue={0}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">Nouveau total:</span>
                      <span className="font-bold text-zinc-900 text-sm">{estimation.totalPurchase.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Livraison</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Coût de livraison (€)</label>
                    <input
                      type="number"
                      defaultValue={0}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Remise Livraison (%)</label>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">Nouveau total:</span>
                        <span className="font-bold text-zinc-900 text-sm">0,00 €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Main d'oeuvre</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Coût de main d'oeuvre (€)</label>
                    <input
                      type="number"
                      defaultValue={0}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">Remise Main d'oeuvre (%)</label>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">Nouveau total:</span>
                        <span className="font-bold text-zinc-900 text-sm">0,00 €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#e9d5ff] rounded-xl p-4 shadow-sm border border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide">Total Initial (HT)</span>
                      <span className="text-lg font-bold text-zinc-900">{estimation.totalPurchase.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide">Total Final (HT)</span>
                      <span className="text-lg font-bold text-zinc-900">{estimation.totalPurchase.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide">TVA (%):</span>
                      <div className="bg-white/50 px-4 py-1 rounded-lg font-bold text-zinc-900 text-sm">20</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide">Total Final (TTC)</span>
                      <span className="text-xl font-bold text-zinc-900">{(estimation.totalPurchase * 1.2).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
