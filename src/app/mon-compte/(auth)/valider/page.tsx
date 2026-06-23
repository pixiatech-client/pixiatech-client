'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

function ValidationPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setError(t('client.validate.invalidLink'));
      return;
    }

    fetch(`/api/boutique/validate-magic-link?token=${token}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('success');
          setTimeout(() => { window.location.href = '/mon-compte/commandes'; }, 1500);
        } else {
          setStatus('error');
          setError(data.reason || t('client.validate.expiredLink'));
        }
      })
      .catch(() => {
        setStatus('error');
        setError(t('client.validate.validationError'));
      });
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f9fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_22%)]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 pb-6 pt-8 sm:px-8">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-black shadow-lg shadow-slate-200/50">
                  <Sparkles className="h-9 w-9 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {status === 'loading' && t('client.validate.loadingTitle')}
                  {status === 'success' && t('client.validate.successTitle')}
                  {status === 'error' && t('client.validate.errorTitle')}
                </h1>
              </div>
            </div>

            <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
              {status === 'loading' && (
                <div className="py-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-400 mb-4" />
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
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-slate-500 mb-6">{error}</p>
                  <Button asChild className="h-12 rounded-2xl bg-black text-sm font-bold text-white shadow-lg hover:opacity-90 px-8">
                    <Link href="/mon-compte/connexion">
                      {t('client.validate.retry')}
                    </Link>
                  </Button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <ValidationPage />
    </Suspense>
  );
}
