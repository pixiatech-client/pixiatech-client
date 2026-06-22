'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setError('Lien invalide. Vérifiez que vous avez bien copié l\'URL complète.');
      return;
    }

    fetch(`/api/boutique/validate-magic-link?token=${token}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('success');
          setTimeout(() => router.push('/boutique/mon-compte/commandes'), 1500);
        } else {
          setStatus('error');
          setError(data.reason || 'Lien invalide ou expiré.');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Erreur de validation. Veuillez réessayer.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">Validation de votre lien...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Connexion réussie !</h1>
            <p className="text-gray-500">Redirection vers votre espace client...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link href="/boutique/mon-compte/connexion" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Demander un nouveau lien
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
