'use client';

import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { updatePassword } from '@/app/admin/actions';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

interface UserPasswordFormProps {
  userId: string;
}

const passwordFormSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(1, 'Please confirm the password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export function UserPasswordForm({ userId }: UserPasswordFormProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type PasswordFormData = { password: string; confirmPassword: string };

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema) as any,
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    setError(null);
    setIsSaving(true);
    const result = await updatePassword({ uid: userId, password: data.password });
    setIsSaving(false);

    if (result.success) {
      toast({ title: t('profile.passwordUpdated'), variant: 'success' });
      form.reset();
    } else {
      setError(result.error || t('profile.anErrorOccurred'));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
          <Lock size={14} className="text-rose-500" />
          {t('profile.newPassword')}
        </label>
        <Input
          id="newPassword"
          type="password"
          aria-required="true"
          {...form.register('password')}
          placeholder="••••••••"
          className="font-semibold bg-gray-50"
        />
        {form.formState.errors.password && (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-theme-card-text/60">
          <Lock size={14} className="text-rose-500" />
          {t('profile.confirmPassword')}
        </label>
        <Input
          id="confirmPassword"
          type="password"
          aria-required="true"
          {...form.register('confirmPassword')}
          placeholder="••••••••"
          className="font-semibold bg-gray-50"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 ml-2">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <p className="text-sm text-rose-600 font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3.5 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-2xl text-sm font-bold transition-all shadow-lg hover:opacity-90 flex items-center gap-3 active:scale-[0.98] disabled:opacity-60"
        >
          <Save size={16} />
          {isSaving ? t('profile.saving') : t('profile.updatePassword')}
        </button>
      </div>
    </form>
  );
}
