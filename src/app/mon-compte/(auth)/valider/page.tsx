'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft, Send, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import LiquidLoader from '@/components/LiquidLoader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

function ValidationPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [apiReason, setApiReason] = useState('');
  const [sending, setSending] = useState<null | 'login' | 'password'>(null);
  const [sentAction, setSentAction] = useState<null | 'login' | 'password'>(null);
  const [resendError, setResendError] = useState('');
  const validatedRef = useRef(false);

  // Prevent any double trigger of the validation (React StrictMode, searchParams
  // identity change, re-render) that would consume the token a second time and
  // display "already used" on first click. The server is also idempotent.
  useEffect(() => {
    if (validatedRef.current) return;
    validatedRef.current = true;

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setError(t('client.validate.invalidLink'));
      return;
    }

    fetch(`/api/boutique/validate-magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('success');
          // If the user came to "create a password", bring them straight to the
          // password page (the server already set the session cookie).
          const setPasswordMode = searchParams.get('set-password') === '1';
          const target = setPasswordMode ? '/mon-compte/parametres/mot-de-passe' : '/mon-compte/commandes';
          setTimeout(() => { window.location.href = target; }, 1200);
        } else {
          setStatus('error');
          setApiReason(data.reason || '');
          setError(data.reason || t('client.validate.expiredLink'));
        }
      })
      .catch(() => {
        setStatus('error');
        setError(t('client.validate.validationError'));
      });
  }, [searchParams, t]);

  // "Get a new link" / "Create a password": resends a fresh magic link. For the
  // password flow the new link carries &set-password=1 so that, after a valid
  // click, the user lands on the password creation page. No session is needed,
  // possession of the mailbox is the proof of identity.
  const handleResend = useCallback(async (action: 'login' | 'password') => {
    const email = searchParams.get('email');
    if (!email || sending) return;
    setSending(action);
    setResendError('');
    setSentAction(null);
    try {
      const res = await fetch('/api/boutique/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, setPassword: action === 'password' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t('client.validate.resendError'));
      }
      setSentAction(action);
    } catch (e: any) {
      setResendError(e?.message || t('client.validate.resendError'));
    } finally {
      setSending(null);
    }
  }, [searchParams, sending, t]);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const canSend = !!token && !!email;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#F5F5F5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_22%)]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 pb-6 pt-8 sm:px-8">
              <div className="mb-6 flex justify-center">
                <img src="/favicon.png" alt="PIXIATECH" className="h-20 w-20 object-contain drop-shadow-lg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {status === 'loading' && t('client.validate.loadingTitle')}
                  {status === 'success' && t('client.validate.successTitle')}
                  {status === 'error' && t('client.validate.linkUnavailable')}
                </h1>
              </div>
            </div>

            <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
              {status === 'loading' && (
                <div className="py-8 text-center">
                  <LiquidLoader size={110} className="mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">{t('client.validate.loading')}</p>
                </div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-slate-500">{t('client.validate.redirecting')}</p>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 text-center"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1.5">{t('client.validate.linkUnavailable')}</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    {t('client.validate.linkUnavailableDesc')}
                  </p>

                  {sentAction ? (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                      <p className="text-sm font-semibold text-emerald-700">
                        {sentAction === 'login' ? t('client.validate.resendLinkDone') : t('client.validate.createPasswordSent')}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-5 space-y-4">
                      <Button
                        onClick={() => handleResend('login')}
                        disabled={!canSend || sending !== null}
                        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-black px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-slate-800 hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {sending === 'login' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {sending === 'login' ? t('client.validate.resending') : t('client.validate.resendLink')}
                      </Button>

                      <Button
                        onClick={() => handleResend('password')}
                        disabled={!canSend || sending !== null}
                        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {sending === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {sending === 'password' ? t('client.validate.resending') : t('client.validate.createPassword')}
                      </Button>

                      <Link href="/mon-compte/connexion">
                        <span className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 active:scale-[0.99]">
                          <ShieldCheck className="h-4 w-4" />
                          {t('client.validate.loginPassword')}
                        </span>
                      </Link>
                    </div>
                  )}

                  {resendError && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 leading-relaxed whitespace-pre-line">
                      {resendError}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 leading-relaxed">{email ? <span className="font-semibold text-slate-500">{email}</span> : null}</p>
                </motion.div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 text-center sm:px-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('client.validate.backToSite')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ValidationPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LiquidLoader size={24} /></div>}>
      <ValidationPage />
    </Suspense>
  );
}