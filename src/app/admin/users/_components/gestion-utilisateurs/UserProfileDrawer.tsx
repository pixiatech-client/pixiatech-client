'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Mail, Phone, User as UserIcon, Shield, Clock, Calendar, CheckCircle, Image as ImageIcon, Lock, UserCircle, PlusCircle, Save, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { User, UserRole, UserStatus } from './types';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { CustomSelect } from '@/components/ui/custom-select';
import { uploadImage } from '@/lib/uploadImage';
import { useRoles } from '@/contexts/RoleContext';
import { CreateRoleDrawer } from './CreateRoleDrawer';
import { useAdminT } from '@/hooks/useAdminT';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: User) => void;
  isAddMode?: boolean;
  onRoleChanged?: () => void;
}

export function UserProfileDrawer({ isOpen, onClose, user, onSave, isAddMode = false, onRoleChanged }: UserProfileDrawerProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const { roles } = useRoles();
  const { t } = useAdminT();

  const roleOptions = roles.map(r => ({
    value: r.id,
    label: r.name,
    color: r.color,
    bgColor: r.color + '20' // 20% opacity for background
  }));

  const statusOptions = [
    { value: UserStatus.APPROVED, label: t('Approved'), color: '#00a86b', bgColor: '#e6f7f1' },
    { value: UserStatus.PENDING, label: t('Pending'), color: '#f97316', bgColor: '#fff7ed' },
    { value: UserStatus.REJECTED, label: t('Rejected'), color: '#ef4444', bgColor: '#fef2f2' },
    { value: UserStatus.SUSPENDED, label: t('Suspended'), color: '#8744E0', bgColor: '#f5f3ff' },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
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
        role: 'commercial',
        status: UserStatus.PENDING,
        avatar: 'https://picsum.photos/seed/new/100/100',
        backgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    }
  }, [user, isAddMode, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = t('Name is required');
    if (!formData.email?.trim()) newErrors.email = t('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('Invalid email');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t('Please fill in all required fields'));
      return;
    }
    onSave({ ...user, ...formData } as User);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
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
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-[60] overflow-hidden flex flex-col"
          >
            <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-y-auto custom-scrollbar">
              {/* HEADER IMAGE SECTION */}
              <div
                className={`relative h-48 w-full group cursor-pointer shrink-0 ${isAddMode ? 'bg-gradient-to-br from-blue-500 to-blue-700' : ''}`}
                onClick={() => bgInputRef.current?.click()}
              >
                {!isAddMode && (
                  <img
                    src={formData.backgroundImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop'}
                    alt={t('Profile Background')}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-theme-sidebar-active-bg backdrop-blur-md rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                    <div className="flex items-center gap-3 text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-bold">{t('Uploading...')}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 p-2 bg-black/20 hover:bg-theme-sidebar-active-bg backdrop-blur-md rounded-full text-white transition-all flex items-center gap-2">
                  <Camera size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{t('Change background')}</span>
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
                        toast.success(t('Background image uploaded'));
                      } catch (err) {
                        toast.error(t('Upload error'));
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                />
              </div>

              {/* CONTENT SECTION */}
              <div className="px-6 -mt-12 pb-12 relative flex-1">
                <div className="flex justify-between items-end mb-6">
                  <div
                    className="relative inline-block group cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-gray-100 shadow-xl transition-colors">
                      <img
                        src={formData.avatar || (user?.avatar || 'https://picsum.photos/seed/new/100/100')}
                        alt={t('Avatar')}
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
                            toast.success(t('Avatar uploaded'));
                          } catch (err) {
                            toast.error(t('Upload error'));
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
                    {isAddMode ? t('ADD A NEW USER') : t('EDIT USER')}
                  </h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {isAddMode ? t('Create an account that will be pending validation.') : t('Edit information and password')}
                  </p>
                </div>

                <div className="space-y-10">
                  {/* BASIC INFO */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <UserCircle size={18} className="text-blue-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t('Basic information')}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <UserIcon size={14} className="text-blue-500" />
                        {t('USERNAME')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.name ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder={t('E.g. John Doe')}
                      />
                      {errors.name && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <Mail size={14} className="text-purple-500" />
                        {t('EMAIL ADDRESS')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.email ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder={t('john@example.com')}
                      />
                      {errors.email && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <Phone size={14} className="text-emerald-500" />
                        {t('PHONE NUMBER')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('+1 555 000 0000')}
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <FileText size={14} className="text-blue-400" />
                        {t('DESCRIPTION')}
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t('Tell us about yourself...')}
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold resize-none h-24 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* ADMIN FIELDS */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Shield size={18} className="text-indigo-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t('Roles & Status')}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateRoleOpen(true)}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                      >
                        <PlusCircle size={14} />
                        {t('Add role')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <CustomSelect
                        label={t('Role')}
                        icon={<Shield className="w-3.5 h-3.5 text-blue-500" />}
                        placeholder={t('Select a role')}
                        options={roleOptions}
                        value={formData.role || ''}
                        onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                        isActive={true}
                      />

                      <CustomSelect
                        label={t('Status')}
                        icon={<Clock className="w-3.5 h-3.5 text-purple-500" />}
                        placeholder={t('Select a status')}
                        options={statusOptions}
                        value={formData.status || ''}
                        onChange={(val) => setFormData({ ...formData, status: val as UserStatus })}
                        isActive={true}
                      />
                    </div>
                  </div>

                  {/* SECURITY */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Lock size={18} className="text-rose-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">{t('Security')}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <Lock size={14} className="text-rose-500" />
                        {isAddMode ? t('PASSWORD') : t('NEW PASSWORD')}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('••••••••')}
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="mt-12">
                  <button
                    type="submit"
                    className="w-full py-4 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-3 group"
                  >
                    {isAddMode ? (
                      <PlusCircle size={18} className="text-current" />
                    ) : (
                      <Save size={18} className="text-current" />
                    )}
                    {isAddMode ? t('Add') : t('Save')}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    <CreateRoleDrawer 
      isOpen={isCreateRoleOpen}
      onClose={() => setIsCreateRoleOpen(false)}
      onRoleCreated={() => { onRoleChanged?.(); }}
    />
    </>
  );
}


