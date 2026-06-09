'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Mail, Phone, User as UserIcon, Shield, Clock, Lock, Save, UserCircle, PlusCircle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';
import { CustomSelect } from './custom-select';
import getCroppedImg from '@/lib/cropImage';
import type { AdaptedUser } from './user-card';
import { useAdminT } from '@/hooks/useAdminT';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdaptedUser | null;
  onSave: (data: any) => Promise<void>;
  isAddMode?: boolean;
  roles: UserRole[];
  isAdmin: boolean;
}

export function UserProfileDrawer({ isOpen, onClose, user, onSave, isAddMode = false, roles, isAdmin }: UserProfileDrawerProps) {
  const { toast } = useToast();
  const { t } = useAdminT();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const roleOptions = roles.map(r => ({
    value: r.id,
    label: r.name,
    color: r.color || '#6b7280',
  }));

  const statusOptions = [
    { value: 'approved', label: t('Approved'), color: '#00a86b' },
    { value: 'pending', label: t('Pending'), color: '#f97316' },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setPassword('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && !isAddMode) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        phone: user.phone || '',
        photoURL: user.photoURL || '',
        role: user.role,
        status: user.status,
      });
    } else if (isAddMode) {
      setFormData({
        displayName: '',
        email: '',
        phone: '',
        password: '',
        role: roles.find(r => r.isDefault)?.id || roles[0]?.id || '',
        status: 'pending',
      });
    }
  }, [user, isAddMode, isOpen, roles]);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setFormData({ ...formData, photoURL: croppedImage });
          setImageToCrop(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.displayName?.trim()) newErrors.displayName = t('Name is required');
    if (!formData.email?.trim()) newErrors.email = t('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('Invalid email');
    if (isAddMode && !password?.trim()) newErrors.password = t('Password is required');
    if (isAddMode && password && password.length < 6) newErrors.password = t('Minimum 6 characters');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Please fill in all required fields.') });
      return;
    }

    setIsSaving(true);
    try {
      const saveData: any = {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone || undefined,
        photoURL: formData.photoURL || undefined,
        role: formData.role,
        status: formData.status,
      };

      if (isAddMode) {
        saveData.password = password;
      } else if (user) {
        saveData.uid = user.uid;
        if (password) saveData.password = password;
      }

      await onSave(saveData);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-theme-card border-l border-theme-card-border shadow-2xl z-[60] overflow-hidden flex flex-col"
          >
            <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-y-auto custom-scrollbar">
              {/* HEADER IMAGE SECTION */}
              <div
                role="button"
                tabIndex={0}
                className={`relative h-48 w-full group cursor-pointer shrink-0 ${isAddMode ? 'bg-gradient-to-br from-blue-500 to-blue-700' : ''}`}
                onClick={() => bgInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgInputRef.current?.click(); } }}
              >
                {!isAddMode && (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClose(); } }}
                  aria-label={t('Close')}
                  className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* CONTENT SECTION */}
              <div className="px-6 -mt-12 pb-12 relative flex-1">
                <div className="flex justify-between items-end mb-6">
                  <div
                    role="button"
                    tabIndex={0}
                    className="relative inline-block group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-3xl"
                    onClick={() => avatarInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatarInputRef.current?.click(); } }}
                  >
                    <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-theme-card shadow-xl">
                      <img
                        src={formData.photoURL || (user?.photoURL) || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'U')}&background=random&size=96`}
                        alt={t('User avatar')}
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setImageToCrop(url);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <h2 id="drawer-title" className="text-2xl font-bold uppercase tracking-tight text-theme-card-text leading-tight">
                    {isAddMode ? t('ADD A NEW USER') : t('EDIT USER')}
                  </h2>
                  <p className="text-theme-card-text/60 text-sm font-medium">
                    {isAddMode ? t('Create an account that will be pending validation.') : t('Edit user information')}
                  </p>
                </div>

                <div className="space-y-8">
                  {/* BASIC INFO */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-theme-card-border">
                      <UserCircle size={18} className="text-theme-card-text/60" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-theme-card-text">{t('Basic information')}</h3>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="drawer-name" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
                        <UserIcon size={14} className="text-blue-500" />
                        {t('USERNAME')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="drawer-name"
                        type="text"
                        value={formData.displayName || ''}
                        onChange={(e) => { setFormData({ ...formData, displayName: e.target.value }); if (errors.displayName) setErrors({ ...errors, displayName: '' }); }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.displayName ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder={t('E.g. John Doe')}
                        aria-required="true"
                        aria-invalid={!!errors.displayName}
                        aria-describedby={errors.displayName ? 'drawer-name-error' : undefined}
                      />
                      {errors.displayName && <p id="drawer-name-error" className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.displayName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="drawer-email" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
                        <Mail size={14} className="text-purple-500" />
                        {t('EMAIL ADDRESS')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="drawer-email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 text-gray-900 placeholder:text-gray-400 ${errors.email ? 'border-rose-500' : 'border-gray-200'}`}
                        placeholder={t('john@example.com')}
                        disabled={!isAddMode}
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'drawer-email-error' : undefined}
                      />
                      {errors.email && <p id="drawer-email-error" className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="drawer-phone" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
                        <Phone size={14} className="text-emerald-500" />
                        {t('PHONE NUMBER')}
                      </label>
                      <input
                        id="drawer-phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('+1 555 000 0000')}
                        className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* ADMIN ONLY FIELDS */}
                  {isAdmin && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-theme-card-border">
                        <Shield size={18} className="text-indigo-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-theme-card-text">{t('Permissions & Status')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <CustomSelect
                          label={t('Role')}
                          icon={<Shield className="w-3.5 h-3.5 text-theme-card-text/60" />}
                          placeholder={t('Select a role')}
                          options={roleOptions}
                          value={formData.role || ''}
                          onChange={(val) => setFormData({ ...formData, role: val })}
                          isActive={true}
                        />

                        <CustomSelect
                          label={t('Status')}
                          icon={<Clock className="w-3.5 h-3.5 text-theme-card-text/60" />}
                          placeholder={t('Select a status')}
                          options={statusOptions}
                          value={formData.status || ''}
                          onChange={(val) => setFormData({ ...formData, status: val })}
                          isActive={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* SECURITY */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-theme-card-border">
                      <Lock size={18} className="text-rose-500" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-theme-card-text">{t('Security')}</h3>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="drawer-password" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
                        <Lock size={14} className="text-rose-500" />
                        {isAddMode ? t('PASSWORD *') : t('NEW PASSWORD')}
                      </label>
                      <input
                        id="drawer-password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                        placeholder={t('••••••••')}
                        aria-required={isAddMode ? 'true' : undefined}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'drawer-password-error' : undefined}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 ${errors.password ? 'border-rose-500' : ''}`}
                      />
                      {errors.password && <p id="drawer-password-error" className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">{errors.password}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    <div className="w-6 h-6 border-2 border-theme-sidebar-active-text/30 group-hover:border-theme-sidebar-active-text rounded-full flex items-center justify-center transition-all">
                      {isAddMode ? (
                        <PlusCircle size={12} className="text-current" />
                      ) : (
                        <Save size={12} className="text-current" />
                      )}
                    </div>
                    {isSaving ? t('SAVING...') : (isAddMode ? t('ADD USER') : t('SAVE CHANGES'))}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>

          {imageToCrop && (
            <div role="dialog" aria-modal="true" aria-label={t('Crop image')} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
              <div className="relative w-full max-w-lg aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                  <button
                    onClick={() => setImageToCrop(null)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl font-bold transition-all"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
                  >
                    {t('Crop & Apply')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}


