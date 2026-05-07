'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyQuoteToken } from '@/app/admin/actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus('error');
                setError('Jeton de vérification manquant.');
                return;
            }

            try {
                const result = await verifyQuoteToken(token);
                if (result.success) {
                    setStatus('success');
                    // Short delay to show the success message before redirecting
                    setTimeout(() => {
                        router.push(`/quote/success?id=${result.quoteId}`);
                    }, 2000);
                } else {
                    setStatus('error');
                    setError(result.error || 'Erreur lors de la vérification.');
                }
            } catch (err) {
                setStatus('error');
                setError('Une erreur interne est survenue.');
            }
        }

        verify();
    }, [token, router]);

    return (
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-10 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 mb-2">Vérification en cours</h1>
                            <p className="text-slate-500">Nous validons votre adresse email...</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 mb-2">Email vérifié !</h1>
                            <p className="text-slate-500">Merci, votre estimation est maintenant accessible. Redirection...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 mb-2">Erreur de vérification</h1>
                            <p className="text-rose-500 font-medium">{error}</p>
                            <button 
                                onClick={() => router.push('/')}
                                className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 pb-8 lg:pb-[20vh]">
            <Suspense fallback={
                <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-10 text-center flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Chargement...</h1>
                    </CardContent>
                </Card>
            }>
                <VerifyContent />
            </Suspense>
        </main>
    );
}
