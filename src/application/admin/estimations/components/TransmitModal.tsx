'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Truck, CheckCircle2, AlertCircle, Search, Cpu, Info, Mail, ChevronDown } from 'lucide-react';
import { getUsers } from '@/app/admin/actions';
import type { UserProfile } from '@/lib/types';

interface TransmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (supplierId: string, supplierName: string, message: string) => void;
}

export const TransmitModal: React.FC<TransmitModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('[TransmitModal] Opening modal, fetching suppliers...');
      setIsLoading(true);
      setSelectedSupplier('');
      setNotes('');
      setIsDropdownOpen(false);
      setFetchError(null);
      
      getUsers({ limit: 1000 })
        .then((result) => {
          console.log('[TransmitModal] getUsers result:', result);
          const users = result?.users || [];
          
          const filtered = users.filter((u: UserProfile) => {
            const isFournisseur = u.role === 'fournisseur';
            const isApproved = u.status === 'approved' || (u.status as string) === 'active'; // Handle both status types
            return isFournisseur && isApproved;
          });

          console.log('[TransmitModal] Stats:', {
            total: users.length,
            fournisseurs: users.filter(u => u.role === 'fournisseur').length,
            approved: filtered.length
          });

          if (users.length > 0 && filtered.length === 0) {
             console.warn('[TransmitModal] Found users but none match "fournisseur" + "approved". Sample user:', users[0]);
          }

          setSuppliers(filtered);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('[TransmitModal] Error loading suppliers:', err);
          setFetchError('Impossible de charger les fournisseurs. Veuillez réessayer.');
          setSuppliers([]);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const selected = suppliers.find(s => s.uid === selectedSupplier);
    if (!selected) return;
    onConfirm(selected.uid, selected.displayName || selected.email, notes);
  };

  const selectedSupplierData = suppliers.find(s => s.uid === selectedSupplier);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-[#09090b] border border-white/10 rounded-3xl md:rounded-[32px] p-5 md:p-8 shadow-2xl overflow-visible max-h-[90vh] custom-scrollbar flex flex-col"
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-50" />
            
            <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)] shrink-0">
                  <Truck size={24} className="text-[#10b981]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight leading-tight">
                    Transmettre au <span className="text-[#10b981]">Fournisseur</span>
                  </h2>
                  <p className="text-[9px] md:text-[11px] text-zinc-500 font-['JetBrains_Mono'] uppercase tracking-[0.1em] md:tracking-[0.2em] mt-0.5">
                    Sélectionner un prestataire
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-zinc-500 hover:text-white border border-white/5 shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {/* Custom Searchable Dropdown (Liste déroulante) */}
              <div className="space-y-3 relative">
                <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} className="text-[#10b981]" />
                  Choisir un fournisseur
                </label>
                
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between px-5 py-4 bg-black/40 border rounded-2xl transition-all font-['JetBrains_Mono'] text-sm ${
                    isDropdownOpen ? 'border-[#10b981]/50 ring-2 ring-[#10b981]/10' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedSupplierData ? (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-[#10b981]/20 flex items-center justify-center text-[10px] font-bold text-[#10b981]">
                          {selectedSupplierData.displayName?.charAt(0) || 'F'}
                        </div>
                        <span className="text-white">{selectedSupplierData.displayName || selectedSupplierData.email}</span>
                      </>
                    ) : (
                      <span className="text-zinc-600">Sélectionner un fournisseur professionnel...</span>
                    )}
                  </div>
                  <ChevronDown className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl z-[300] overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar"
                    >
                {isLoading ? (
                        <div className="p-8 text-center text-zinc-500 text-xs font-['JetBrains_Mono']">Chargement...</div>
                      ) : fetchError ? (
                        <div className="p-8 text-center text-red-400 text-xs font-['JetBrains_Mono']">{fetchError}</div>
                      ) : suppliers.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <p className="text-zinc-400 text-xs font-['JetBrains_Mono']">Aucun fournisseur approuvé</p>
                          <p className="text-zinc-600 text-[10px] font-['JetBrains_Mono']">Vérifiez que des comptes fournisseurs ont le statut &quot;approuvé&quot; dans la gestion des utilisateurs.</p>
                        </div>
                      ) : (
                        suppliers.map((s) => (
                          <button
                            key={s.uid}
                            onClick={() => {
                              setSelectedSupplier(s.uid);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-4 transition-all text-left group hover:bg-[#10b981]/5 ${
                              selectedSupplier === s.uid ? 'bg-[#10b981]/10 text-white' : 'text-zinc-400'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              selectedSupplier === s.uid ? 'bg-[#10b981] text-white' : 'bg-white/5 text-zinc-500'
                            }`}>
                              {s.photoURL ? (
                                <img src={s.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                (s.displayName || s.email).charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-bold font-['Space_Grotesk'] ${selectedSupplier === s.uid ? 'text-white' : 'text-zinc-200'}`}>
                                {s.displayName || s.email.split('@')[0]}
                              </div>
                              <div className="text-[9px] font-['JetBrains_Mono'] text-zinc-500">{s.email}</div>
                            </div>
                            {selectedSupplier === s.uid && <CheckCircle2 size={16} className="text-[#10b981]" />}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* Technical Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={12} className="text-[#10b981]" />
                    Instructions Techniques
                  </label>
                  <span className="text-[9px] text-zinc-600 font-['JetBrains_Mono'] uppercase">Optionnel</span>
                </div>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Précisez les détails techniques, délais ou contraintes spécifiques..."
                    className="w-full h-32 p-5 bg-black/60 border border-white/5 rounded-[24px] text-sm text-white font-['JetBrains_Mono'] placeholder:text-zinc-700 focus:border-[#10b981]/30 focus:outline-none resize-none transition-all focus:bg-black/80"
                  />
                  <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                    <Cpu size={40} className="text-[#10b981]" />
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Info size={20} className="text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-blue-200/90 font-medium">Information de confidentialité</p>
                  <p className="text-[10px] text-blue-300/50 leading-relaxed font-['JetBrains_Mono']">
                    L'activation du mode fournisseur masquera toutes les informations de prix (client/marge). Seules les spécifications techniques seront transmises.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={onClose}
                className="flex-1 py-5 rounded-[20px] bg-white/[0.02] border border-white/5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:bg-white/5 hover:text-white transition-all font-['Space_Grotesk']"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSupplier || isLoading}
                className="flex-[1.5] py-5 rounded-[20px] bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-['Space_Grotesk'] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                Confirmer l'envoi
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
};

interface ReturnReasonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
}

export const ReturnReasonPopup: React.FC<ReturnReasonPopupProps> = ({ isOpen, onClose, reason }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#09090b] border border-red-500/20 rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-['Space_Grotesk'] font-bold text-white uppercase">
                    Motif du <span className="text-red-500">Retour</span>
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] uppercase">Information fournisseur</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
              <p className="text-sm text-zinc-300 font-['JetBrains_Mono'] whitespace-pre-wrap leading-relaxed">
                {reason || "Aucun motif précisé."}
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
};

interface SimpleMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  subtitle?: string;
  variant?: 'default' | 'alert';
}

export const SimpleMessagePopup: React.FC<SimpleMessagePopupProps> = ({ isOpen, onClose, title, message, subtitle, variant = 'default' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-lg bg-[#09090b] border ${variant === 'alert' ? 'border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]'} rounded-[32px] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${variant === 'alert' ? 'bg-red-500/10 text-red-500' : 'bg-[#3b82f6]/10 text-[#3b82f6]'} flex items-center justify-center`}>
                  {variant === 'alert' ? <AlertCircle size={24} /> : <Mail size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight">
                    {title}
                  </h2>
                  {subtitle && <p className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] uppercase tracking-widest">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar">
              <p className="text-sm text-zinc-300 font-['JetBrains_Mono'] whitespace-pre-wrap leading-relaxed">
                {message || "Aucun message."}
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className={`w-full py-4 rounded-xl font-['Space_Grotesk'] font-bold text-xs uppercase tracking-widest transition-all ${
                  variant === 'alert' 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
};

interface RentalTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string, startTime: string, endTime: string) => void;
}

export const RentalTreatmentModal: React.FC<RentalTreatmentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setStartTime('08:00');
      setEndTime('18:00');
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }
    setError(null);
    onConfirm(startDate, endDate, startTime, endTime);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-[#09090b] border border-white/10 rounded-3xl md:rounded-[32px] p-5 md:p-8 shadow-2xl overflow-visible max-h-[90vh] custom-scrollbar flex flex-col"
          >
            {/* Ambient Glow - Purple for Rental */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-50" />
            
            <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)] shrink-0">
                  <CheckCircle2 size={24} className="text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight leading-tight">
                    Traiter la <span className="text-[#a855f7]">Location</span>
                  </h2>
                  <p className="text-[9px] md:text-[11px] text-zinc-500 font-['JetBrains_Mono'] uppercase tracking-[0.1em] md:tracking-[0.2em] mt-0.5">
                    Définir la période de location
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-zinc-500 hover:text-white border border-white/5 shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-400 text-xs font-['JetBrains_Mono'] items-center">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white text-sm font-['JetBrains_Mono'] focus:border-[#a855f7]/30 focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white text-sm font-['JetBrains_Mono'] focus:border-[#a855f7]/30 focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white text-sm font-['JetBrains_Mono'] focus:border-[#a855f7]/30 focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white text-sm font-['JetBrains_Mono'] focus:border-[#a855f7]/30 focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Info size={20} className="text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-purple-200/90 font-medium">Création de la période bloquante</p>
                  <p className="text-[10px] text-purple-300/50 leading-relaxed font-['JetBrains_Mono']">
                    En validant le traitement, ces dates seront bloquées dans le calendrier de réservation du configurateur pour éviter les doubles réservations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-5 rounded-[20px] bg-white/[0.02] border border-white/5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:bg-white/5 hover:text-white transition-all font-['Space_Grotesk']"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[1.5] py-5 rounded-[20px] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-3 font-['Space_Grotesk'] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /> 
                Valider le traitement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

