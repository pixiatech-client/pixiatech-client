'use client';

import { useForm, Controller } from 'react-hook-form';
import type { UserProfile, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/app/admin/actions';
import { useCollection, useMemoFirebase, useUser, useFirestore, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { User as UserIcon, Mail, Phone, Shield, Clock, Save, AlertCircle } from 'lucide-react';
import { CustomSelect } from '../../_components/custom-select';

interface UserProfileFormProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export function UserProfileForm({ user, onUpdate }: UserProfileFormProps) {
  const { toast } = useToast();
  const { userProfile: currentAdminUser, isUserLoading } = useUser();
  const auth = useAuth();

  const firestore = useFirestore();
  const rolesQuery = useMemoFirebase(
    () => firestore && auth.currentUser && !isUserLoading ? query(collection(firestore, 'roles'), orderBy('name')) : null,
    [firestore, auth.currentUser, isUserLoading]
  );
  const { data: allRoles } = useCollection<UserRole>(rolesQuery, { suppressPermissionError: true });

  const form = useForm<UserProfile>({ defaultValues: user });
  const isCurrentUser = currentAdminUser?.uid === user.uid;

  const roleOptions = (allRoles || []).map(r => ({
    value: r.id,
    label: r.name,
    color: r.color || '#6b7280',
  }));

  const statusOptions = [
    { value: 'approved', label: 'Approuvé', color: '#00a86b' },
    { value: 'pending', label: 'En attente', color: '#f97316' },
  ];

  const onProfileSubmit = async (data: UserProfile) => {
    const result = await updateUser({
      uid: data.uid,
      displayName: data.displayName,
      phone: data.phone,
      photoURL: data.photoURL,
      role: data.role,
      status: data.status,
    });

    if (result.success) {
      toast({ title: 'Profil mis à jour', variant: 'success' });
      onUpdate({
        displayName: data.displayName,
        phone: data.phone,
        photoURL: data.photoURL,
        role: data.role,
        status: data.status,
      });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500">
          <UserIcon size={14} className="text-blue-500" />
          NOM D'UTILISATEUR
        </label>
        <input
          {...form.register('displayName')}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 text-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500">
          <Mail size={14} className="text-purple-500" />
          ADRESSE EMAIL
        </label>
        <input
          {...form.register('email')}
          disabled
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500">
          <Phone size={14} className="text-emerald-500" />
          NUMÉRO DE TÉLÉPHONE
        </label>
        <input
          {...form.register('phone')}
          placeholder="+33 6 00 00 00 00"
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-semibold bg-gray-50 text-gray-900"
        />
      </div>

      {!isCurrentUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <CustomSelect
                label="Rôle"
                icon={<Shield className="w-3.5 h-3.5 text-blue-500" />}
                placeholder="Sélectionner un rôle"
                options={roleOptions}
                value={field.value || ''}
                onChange={field.onChange}
                isActive={true}
              />
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <CustomSelect
                label="Statut"
                icon={<Clock className="w-3.5 h-3.5 text-purple-500" />}
                placeholder="Sélectionner un statut"
                options={statusOptions}
                value={field.value || ''}
                onChange={field.onChange}
                isActive={true}
              />
            )}
          />
        </div>
      )}

      {isCurrentUser && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700 font-medium">
            Vous ne pouvez pas modifier votre propre rôle ou statut.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="px-8 py-3.5 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-2xl text-sm font-bold transition-all shadow-lg hover:opacity-90 flex items-center gap-3 active:scale-[0.98] disabled:opacity-60"
        >
          <Save size={16} />
          {form.formState.isSubmitting ? 'Sauvegarde...' : 'Sauvegarder les changements'}
        </button>
      </div>
    </form>
  );
}
