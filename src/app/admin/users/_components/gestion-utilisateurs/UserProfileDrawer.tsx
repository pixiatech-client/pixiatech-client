import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Mail, Phone, User as UserIcon, Shield, Clock, Calendar, CheckCircle, Image as ImageIcon, Lock, UserCircle, PlusCircle, Save, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { User, UserRole, UserStatus } from './types';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { CustomSelect } from '@/components/ui/custom-select';
import { uploadImage } from '@/lib/uploadImage';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: User) => void;
  isAddMode?: boolean;
}

export function UserProfileDrawer({ isOpen, onClose, user, onSave, isAddMode = false }: UserProfileDrawerProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const roleOptions = [
    { value: UserRole.ADMINISTRATEUR, label: 'Administrateur', color: '#a855f7', bgColor: '#f5f3ff' },
    { value: UserRole.FOURNISSEUR, label: 'Fournisseur', color: '#3b82f6', bgColor: '#eff6ff' },
    { value: UserRole.COMMERCIAL, label: 'Commercial', color: '#f59e0b', bgColor: '#fffbeb' },
  ];

  const statusOptions = [
    { value: UserStatus.APPROUVE, label: 'Approuvé', color: '#00a86b', bgColor: '#e6f7f1' },
    { value: UserStatus.EN_ATTENTE, label: 'En attente', color: '#f97316', bgColor: '#fff7ed' },
    { value: UserStatus.REJETE, label: 'Rejeté', color: '#ef4444', bgColor: '#fef2f2' },
    { value: UserStatus.SUSPENDU, label: 'Suspendu', color: '#8744E0', bgColor: '#f5f3ff' },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && !isAddMode) {
      setFormData({
        ...user,
        backgroundImage: user.backgroundImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop'
      });
    } else if (isAddMode) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        description: '',
        role: UserRole.COMMERCIAL,
        status: UserStatus.EN_ATTENTE,
        avatar: 'https://picsum.photos/seed/new/100/100',
        backgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    }
  }, [user, isAddMode, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Le nom est obligatoire';
    if (!formData.email?.trim()) newErrors.email = 'L\'email est obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave({ ...user, ...formData } as User);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-[60] overflow-hidden flex flex-col transition-colors duration-500"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => {
                if (info.offset.y < -50 && currentPage === 0) setCurrentPage(1);
                if (info.offset.y > 50 && currentPage === 1) setCurrentPage(0);
              }}
              animate={{ y: currentPage === 0 ? '0%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="h-full w-full flex flex-col cursor-grab active:cursor-grabbing"
            >
              {/* PAGE 1 */}
              <div className="h-full w-full flex flex-col shrink-0 relative overflow-hidden">
                {/* Header with Background */}
                <div
                  className={`relative h-48 w-full group cursor-pointer shrink-0 ${isAddMode ? 'bg-gradient-to-br from-blue-500 to-blue-700' : ''}`}
                  onClick={() => bgInputRef.current?.click()}
                >
                  {!isAddMode && (
                    <img
                      src={formData.backgroundImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop'}
                      alt="Profile Background"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
                  >
                    <X size={20} />
                  </button>

                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                      <div className="flex items-center gap-3 text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-bold">Téléchargement...</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all flex items-center gap-2">
                    <Camera size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Changer l'arrière-plan</span>
                  </div>
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploading(true);
                        try {
                          const url = await uploadImage(file);
                          setFormData({ ...formData, backgroundImage: url });
                          toast.success('Image d\'arrière-plan téléchargée');
                        } catch (err) {
                          toast.error('Erreur lors du téléchargement');
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                  />
                </div>

                {/* Profile Info Section */}
                <div className="px-6 -mt-12 relative flex-1 flex flex-col">
                  <div className="flex justify-between items-end">
                    <div
                      className="relative inline-block group cursor-pointer"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-gray-100 shadow-xl transition-colors">
                        <img
                          src={formData.avatar || (user?.avatar || 'https://picsum.photos/seed/new/100/100')}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Camera size={16} />
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploading(true);
                            try {
                              const url = await uploadImage(file);
                              setFormData({ ...formData, avatar: url });
                              toast.success('Avatar téléchargé');
                            } catch (err) {
                              toast.error('Erreur lors du téléchargement');
                            } finally {
                              setIsUploading(false);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
                      {isAddMode ? 'AJOUTER UN NOUVEL UTILISATEUR' : 'MODIFIER L\'UTILISATEUR'}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                      {isAddMode ? 'Créez un compte qui sera en attente de validation.' : 'Modifier les informations et le mot de passe'}
                    </p>
                  </div>

                  <div className="mt-8 space-y-6 flex-1">
                    {/* Informations Section */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <UserCircle size={18} className="text-blue-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Informations</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <UserIcon size={14} className="text-blue-500" />
                        NOM D'UTILISATEUR <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.name ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder="Ex: Jean Dupont"
                      />
                      {errors.name && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <Mail size={14} className="text-purple-500" />
                        ADRESSE EMAIL <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.email ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder="jean@exemple.com"
                      />
                      {errors.email && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <Phone size={14} className="text-emerald-500" />
                        NUMÉRO DE TÉLÉPHONE
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Swipe Up Icon */}
                  <div className="py-6 flex justify-center">
                    <div onClick={() => setCurrentPage(1)}>
                      <SwipeIcon direction="up" />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="h-full w-full flex flex-col shrink-0 px-6 py-8 relative overflow-hidden">
                {/* Swipe Down Icon */}
                <div className="pb-6 flex justify-center">
                  <div onClick={() => setCurrentPage(0)}>
                    <SwipeIcon direction="down" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <FileText size={14} className="text-blue-400" />
                        DESCRIPTION
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Parlez-nous un peu de vous..."
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold resize-none h-24 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {!isAddMode && (
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                          <Calendar size={14} className="text-amber-500" />
                          INSCRIT LE
                        </label>
                        <div className="w-full px-4 py-3 border rounded-2xl font-bold bg-gray-50 border-gray-200 text-gray-500">
                          {user && new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <CustomSelect
                        label="Rôle"
                        icon={<Shield className="w-3.5 h-3.5 text-blue-500" />}
                        placeholder="Sélectionner un rôle"
                        options={roleOptions}
                        value={formData.role || ''}
                        onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                        isActive={true}
                      />

                      <CustomSelect
                        label="Statut"
                        icon={<Clock className="w-3.5 h-3.5 text-purple-500" />}
                        placeholder="Sélectionner un statut"
                        options={statusOptions}
                        value={formData.status || ''}
                        onChange={(val) => setFormData({ ...formData, status: val as UserStatus })}
                        isActive={true}
                      />
                    </div>

                    {/* Mot de passe Section */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Lock size={18} className="text-rose-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">MOT DE PASSE</h3>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                          <Lock size={14} className="text-rose-500" />
                          {isAddMode ? 'MOT DE PASSE' : 'NOUVEAU MOT DE PASSE'}
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button
                      type="submit"
                      className="w-full py-4 bg-blue-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                      <div className="w-6 h-6 border-2 border-white group-hover:border-blue-400 rounded-full flex items-center justify-center transition-all">
                        {isAddMode ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-blue-400 transition-colors">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        ) : (
                          <Save size={12} className="text-white group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>
                      {isAddMode ? 'AJOUTER L\'UTILISATEUR' : 'SAUVEGARDER LES CHANGEMENTS'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const SwipeIcon = ({ direction }: { direction: 'up' | 'down' }) => (
  <motion.div
    animate={{ y: [0, direction === 'up' ? -5 : 5, 0] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
    className="flex flex-col items-center gap-0.5 cursor-pointer"
  >
    {[1, 2, 3].map((i) => (
      <svg
        key={i}
        width="24"
        height="12"
        viewBox="0 0 24 12"
        fill="none"
        className={`${direction === 'down' ? 'rotate-180' : ''}`}
        style={{ opacity: 1 - (i - 1) * 0.3 }}
      >
        <path d="M2 10L12 2L22 10" stroke="#95d230" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ))}
  </motion.div>
);
