'use client';

import { useForm, Controller } from 'react-hook-form';
import type { UserProfile, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/app/admin/actions';
import { useCollection, useMemoFirebase, useUser, useFirestore, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { User as UserIcon, Mail, Phone, Shield, Clock, Save, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '../../_components/custom-select';
import { useI18n } from '@/lib/i18n';

interface UserProfileFormProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export function UserProfileForm({ user, onUpdate }: UserProfileFormProps) {
  const { t } = useI18n();
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
    { value: 'approved', label: t('profile.approved'), color: '#00a86b' },
    { value: 'pending', label: t('profile.pending'), color: '#f97316' },
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
      toast({ title: t('profile.profileUpdated'), variant: 'success' });
      onUpdate({
        displayName: data.displayName,
        phone: data.phone,
        photoURL: result.photoURL || data.photoURL,
        role: data.role,
        status: data.status,
      });
    } else {
      toast({ title: t('profile.error'), description: result.error, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
          <UserIcon size={14} className="text-blue-500" />
          {t('profile.username')}
        </label>
        <Input
          id="displayName"
          aria-required="true"
          {...form.register('displayName')}
          className="font-semibold bg-gray-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
          <Mail size={14} className="text-purple-500" />
          {t('profile.emailAddress')}
        </label>
        <Input
          id="email"
          {...form.register('email')}
          disabled
          className="font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
          <Phone size={14} className="text-emerald-500" />
          {t('profile.phoneNumber')}
        </label>
        <Input
          id="phone"
          placeholder={t('profile.phonePlaceholder')}
          {...form.register('phone')}
          className="font-semibold bg-gray-50"
        />
      </div>

      {!isCurrentUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <CustomSelect
                label={t('profile.role')}
                icon={<Shield className="w-3.5 h-3.5 text-theme-card-text/60" />}
                placeholder={t('profile.selectRole')}
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
                label={t('profile.status')}
                icon={<Clock className="w-3.5 h-3.5 text-theme-card-text/60" />}
                placeholder={t('profile.selectStatus')}
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
        <div role="alert" className="flex items-center gap-3 p-4 bg-theme-card border border-theme-card-border rounded-2xl">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-theme-card-text font-medium">
            {t('profile.cannotModify')}
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
          {form.formState.isSubmitting ? t('profile.saving') : t('profile.saveChanges')}
        </button>
      </div>
    </form>
  );
}
