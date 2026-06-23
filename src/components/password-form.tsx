'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPassword } from '@/app/actions/customer-actions';

export function PasswordForm({ customerId, hasPassword }: { customerId: string; hasPassword: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    if (hasPassword && !currentPassword) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    setSaving(true);
    const result = await setPassword(customerId, currentPassword, newPassword);
    if (result.success) {
      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue.' });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {hasPassword && (
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-gray-700">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
            placeholder="••••••••"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-gray-700">
          {hasPassword ? 'Nouveau mot de passe' : 'Mot de passe'}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
          placeholder="Minimum 6 caractères"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-gray-700">Confirmer le mot de passe</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
          placeholder="Retapez le mot de passe"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !newPassword}
        className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : hasPassword ? 'Modifier' : 'Ajouter le mot de passe'}
      </button>
    </form>
  );
}
