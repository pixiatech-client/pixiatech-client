'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, PlusCircle, Copy, Lock, Trash2, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCustomRole, deleteCustomRole } from '@/app/admin/actions';
import { useRoles } from '@/contexts/RoleContext';

const ROLE_COLORS = [
  "#EAB308", "#8B5CF6", "#06B6D4", "#F43F5E",
  "#14B8A6", "#F97316", "#3B82F6", "#10B981"
];

const TEMPLATE_OPTIONS = [
  { value: 'commercial', label: 'Commercial', color: '#f59e0b', description: 'Accès limité aux devis' },
  { value: 'fournisseur', label: 'Fournisseur', color: '#3b82f6', description: 'Suivi production & livraison' },
  { value: 'admin', label: 'Administrateur', color: '#a855f7', description: 'Accès complet à la plateforme' },
];

interface CreateRoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleCreated: () => void;
}

interface DeleteConfirmState {
  roleId: string;
  roleName: string;
  fallbackName: string;
}

export function CreateRoleDrawer({ isOpen, onClose, onRoleCreated }: CreateRoleDrawerProps) {
  const { roles } = useRoles();

  // Create form state
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultRoles = roles.filter(r => r.isDefault);
  const customRoles = roles.filter(r => !r.isDefault);

  const getAvailableColor = () => {
    const usedColors = roles.map(r => r.color?.toUpperCase());
    return ROLE_COLORS.find(c => !usedColors.includes(c.toUpperCase()))
      || ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)];
  };

  const getFallbackName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    const templateId = role?.roleTemplate || 'commercial';
    return roles.find(r => r.id === templateId)?.name || templateId;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Veuillez entrer un nom pour le rôle.'); return; }
    if (!template) { toast.error('Veuillez choisir un rôle à cloner.'); return; }

    setIsSubmitting(true);
    try {
      const result = await createCustomRole({ name: name.trim(), roleTemplate: template, color: getAvailableColor() });
      if (result.success) {
        toast.success(`Rôle "${name}" créé avec succès.`);
        onRoleCreated();
        setName('');
        setTemplate('');
        setShowCreateForm(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Impossible de créer le rôle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (roleId: string, roleName: string) => {
    setDeleteConfirm({ roleId, roleName, fallbackName: getFallbackName(roleId) });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const result = await deleteCustomRole(deleteConfirm.roleId);
      if (result.success) {
        const migrated = (result as any).migratedCount;
        if (migrated > 0) {
          toast.success(`Rôle supprimé. ${migrated} utilisateur(s) réaffecté(s) à "${deleteConfirm.fallbackName}".`);
        } else {
          toast.success(`Rôle "${deleteConfirm.roleName}" supprimé.`);
        }
        onRoleCreated();
        setDeleteConfirm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Impossible de supprimer le rôle.');
    } finally {
      setIsDeleting(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ ease: 'easeInOut', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0F1115] border-l border-white/10 shadow-2xl z-[80] flex flex-col text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Gestion des rôles</h2>
                  <p className="text-xs text-gray-400 font-medium">{roles.length} rôle(s) au total</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

              {/* Default roles (locked) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={13} className="text-gray-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">Rôles par défaut</p>
                </div>
                {defaultRoles.map(role => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: role.color + '25', color: role.color }}
                      >
                        <Shield size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{role.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Rôle système</p>
                      </div>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1 text-gray-500"
                    >
                      <Lock size={10} />
                      Fixé
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom roles (deletable) */}
              {customRoles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={13} className="text-gray-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Rôles personnalisés</p>
                  </div>
                  {customRoles.map(role => {
                    const baseTemplateName = TEMPLATE_OPTIONS.find(t => t.value === role.roleTemplate)?.label || role.roleTemplate;
                    return (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: role.color + '25', color: role.color }}
                          >
                            <Shield size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{role.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                              Clone de {baseTemplateName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRequest(role.id, role.name)}
                          className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create role toggle */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(v => !v)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                      <PlusCircle size={15} className="text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Créer un nouveau rôle</span>
                  </div>
                  {showCreateForm ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showCreateForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleCreate}
                      className="overflow-hidden"
                    >
                      <div className="space-y-5 pt-2">
                        {/* Template picker */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Copy size={13} className="text-gray-400" />
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                              1. Cloner à partir de <span className="text-rose-500">*</span>
                            </label>
                          </div>
                          <div className="grid gap-2">
                            {TEMPLATE_OPTIONS.map(opt => (
                              <div
                                key={opt.value}
                                onClick={() => setTemplate(opt.value)}
                                className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                                  template === opt.value
                                    ? 'bg-white/10 border-white/30'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: opt.color + '20', color: opt.color }}
                                  >
                                    <Shield size={13} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-white">{opt.label}</p>
                                    <p className="text-[10px] text-gray-500">{opt.description}</p>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${template === opt.value ? 'border-blue-500' : 'border-gray-600'}`}>
                                  {template === opt.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Name input */}
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                            2. Nom du rôle <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Technicien, Conseiller..."
                            className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 focus:ring-white/20 outline-none font-bold bg-[#1A1D24] text-white border-white/10 placeholder:text-gray-600 shadow-inner"
                          />
                        </div>

                        {name && template && (
                          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-gray-300 leading-relaxed">
                            Le rôle <span className="font-bold text-white">"{name}"</span> héritera des accès{' '}
                            <span className="font-bold text-white">{TEMPLATE_OPTIONS.find(t => t.value === template)?.label}</span>.
                            Si supprimé, ses utilisateurs retourneront automatiquement à ce rôle de base.
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting || !name || !template}
                          className="w-full py-3.5 bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <PlusCircle size={16} />
                          )}
                          Créer le rôle
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Delete confirmation modal */}
          <AnimatePresence>
            {deleteConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 z-[90]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-x-4 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-[#1A1D24] border border-white/10 rounded-3xl p-6 z-[100] shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-rose-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Supprimer « {deleteConfirm.roleName} » ?</h3>
                      <p className="text-xs text-gray-400">Cette action est irréversible</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 text-xs text-amber-300 leading-relaxed">
                    Tous les utilisateurs ayant le rôle <span className="font-bold">"{deleteConfirm.roleName}"</span> seront
                    automatiquement réaffectés au rôle <span className="font-bold">"{deleteConfirm.fallbackName}"</span> (rôle de base).
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      disabled={isDeleting}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                      className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
