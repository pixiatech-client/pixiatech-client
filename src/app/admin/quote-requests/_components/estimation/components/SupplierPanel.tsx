'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUsers } from '@/app/admin/actions';
import type { UserProfile } from '@/lib/types';
import { useAdminT } from '@/hooks/useAdminT';

interface SupplierPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (supplierId: string, supplierName: string, message: string, notes?: string) => void;
}

export const SupplierPanel: React.FC<SupplierPanelProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t: adt } = useAdminT();
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSelectedSupplier('');
      setNotes('');
      getUsers({ limit: 1000 })
        .then(({ users }) => {
          const filtered = users.filter((u: UserProfile) => 
            u.role !== 'admin' && 
            u.role !== 'commercial' &&
            u.status === 'approved'
          );
          setSuppliers(filtered);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error loading suppliers:', err);
          setSuppliers([]);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const selected = suppliers.find(s => s.uid === selectedSupplier);
    if (!selected) {
      alert(adt('Please select a supplier'));
      return;
    }
    onConfirm(selected.uid, selected.displayName || selected.email, notes, notes);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-3xl p-8 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center">
                  <Truck size={24} className="text-[#10b981]" />
                </div>
                <div>
                  <h2 className="text-xl  font-bold text-white uppercase">
                    {adt('Send to Supplier')}
                  </h2>
                  <p className="text-[10px] text-zinc-500 ">{adt('Select a supplier')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-zinc-500">{adt('Loading suppliers...')}</div>
              ) : suppliers.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-zinc-500">
                  <AlertCircle size={32} className="mb-3 text-red-500" />
                  <p className="text-sm">{adt('No supplier found')}</p>
                  <p className="text-xs text-zinc-600 mt-1">{adt('Check that users with the supplier role exist')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {suppliers.map((s) => (
                    <button
                      key={s.uid}
                      onClick={() => setSelectedSupplier(s.uid)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                        selectedSupplier === s.uid
                          ? 'bg-[#10b981]/10 border-[#10b981]/50 text-white'
                          : 'bg-black/40 border-[#27272a] hover:border-white/20 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s.photoURL ? (
                        <img
                          src={s.photoURL}
                          alt={s.displayName || s.email}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold">
                          {(s.displayName || s.email)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-bold text-sm">{s.displayName || s.email.split('@')[0]}</div>
                        <div className="text-xs text-zinc-500">{s.email}</div>
                      </div>
                      {selectedSupplier === s.uid && (
                        <CheckCircle2 size={20} className="text-[#10b981]" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500  font-bold uppercase tracking-wider">
                  {adt('Notes for the supplier (optional)')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={adt('Technical instructions...')}
                  className="w-full h-28 p-4 bg-black/50 border border-[#27272a] rounded-2xl text-sm text-white  placeholder:text-zinc-600 focus:border-[#3b82f6]/50 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-white/5 transition-all"
              >
                {adt('Cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSupplier}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} /> {adt('Confirm')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};