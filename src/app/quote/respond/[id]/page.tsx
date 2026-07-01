'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RespondContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const action = searchParams.get('action');

  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id || !action) {
      setStatus('error');
      setMessage('Lien invalide.');
      return;
    }

    fetch('/api/quote-requests/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setMessage(data.error);
        } else if (action === 'accept') {
          setStatus('redirecting');
          router.push(`/quote/pay/${id}`);
        } else {
          setStatus('redirecting');
          router.push(`/boutique?quote_declined=${id}`);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Une erreur est survenue. Veuillez réessayer ou nous contacter.');
      });
  }, [id, action, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Traitement de votre réponse...</p>
          </div>
        )}
        {status === 'redirecting' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Redirection...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-black text-gray-900">Oups</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuoteRespondPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm font-medium text-gray-600 mt-3">Chargement...</p>
        </div>
      </div>
    }>
      <RespondContent />
    </Suspense>
  );
}