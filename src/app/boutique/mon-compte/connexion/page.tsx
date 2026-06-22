'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Email envoyé</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Si cet email est associé à un compte, un lien de connexion vous a été envoyé.
            Vérifiez votre boîte de réception (et vos spams).
          </p>
          <Link href="/boutique" className="mt-6 inline-block text-sm font-semibold text-gray-900 underline underline-offset-2">
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
        <p className="text-sm text-gray-500 mb-6">
          Saisissez votre email pour recevoir un lien de connexion.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Envoyer le lien</>}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6 text-center leading-relaxed">
          Aucun mot de passe requis. Le lien expire après 15 minutes.
        </p>
      </div>
    </div>
  );
}
