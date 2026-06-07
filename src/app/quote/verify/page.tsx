'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyQuoteToken } from '@/app/admin/actions';
import { verifyQuoteOtp } from '@/app/actions/quote-actions';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, X } from 'lucide-react';

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const otp = searchParams.get('otp');
    const id = searchParams.get('id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');
    const [tabClosed, setTabClosed] = useState(false);

    useEffect(() => {
        async function verify() {
            if (!token && (!otp || !id)) {
                setStatus('error');
                setError('Paramètres de vérification manquants.');
                return;
            }

            try {
                let result;
                if (otp && id) {
                    result = await verifyQuoteOtp(id, otp);
                } else if (token) {
                    result = await verifyQuoteToken(token);
                }

                if (result && result.success) {
                    setStatus('success');
                    // Attempt to close this tab after a brief delay so the user sees the success message
                    setTimeout(() => {
                        try {
                            window.close();
                        } catch (e) {
                            // If window.close() is blocked (e.g., tab wasn't opened by script), show the close instruction
                            setTabClosed(false);
                        }
                    }, 2500);
                } else {
                    setStatus('error');
                    setError(result?.error || 'Erreur lors de la vérification.');
                }
            } catch (err) {
                setStatus('error');
                setError('Une erreur interne est survenue.');
            }
        }

        verify();
    }, [token, otp, id]);

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Logo / Brand */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={16} className="text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight text-slate-900">PIXIATECH</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-widest">Système de vérification sécurisé</p>
            </div>

            <div className="bg-white rounded-[28px] shadow-2xl shadow-slate-200/80 overflow-hidden border border-slate-100">
                <div className="p-8 sm:p-10 text-center">

                    {/* LOADING */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <ShieldCheck size={13} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Vérification en cours…</h1>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Nous validons votre identité. Merci de patienter quelques instants.
                                </p>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: '1.5s' }} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Identité vérifiée !</h1>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Votre code a été validé avec succès.<br />
                                    Vous pouvez <strong className="text-slate-700">fermer cet onglet</strong> et retourner dans la fenêtre de votre estimateur PixiaTech.
                                </p>
                            </div>

                            {/* Success badge */}
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Signature électronique confirmée</p>
                                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Certifiée et authentifiée par PandaDoc Secure Shield</p>
                                </div>
                            </div>

                            {/* Close tab button */}
                            <button
                                onClick={() => window.close()}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <X size={15} />
                                Fermer cet onglet
                            </button>

                            <p className="text-[10px] text-slate-400 font-medium">
                                L'estimateur s'est automatiquement mis à jour dans votre autre onglet.
                            </p>
                        </div>
                    )}

                    {/* ERROR */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center ring-8 ring-rose-50/50">
                                <XCircle className="w-10 h-10 text-rose-500" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Erreur de vérification</h1>
                                <p className="text-rose-500 font-semibold text-sm leading-relaxed">{error}</p>
                                <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                                    Le code a peut-être expiré ou a déjà été utilisé. Retournez dans votre estimateur et demandez un nouveau code.
                                </p>
                            </div>

                            <button
                                onClick={() => window.close()}
                                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-200"
                            >
                                <X size={14} />
                                Fermer cet onglet
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer brand strip */}
                <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-3 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        PIXIATECH © 2026 — Système de vérification OTP sécurisé
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 p-10 text-center flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Chargement…</h1>
                    </div>
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </main>
    );
}
