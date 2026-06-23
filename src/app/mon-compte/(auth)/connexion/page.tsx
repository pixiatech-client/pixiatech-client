'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle, Lock, Eye, EyeOff, LogIn, ArrowLeft, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

function MagicLinkTab() {
  const { t } = useI18n();
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
      if (!res.ok) throw new Error(t('client.login.serverError'));
      setSent(true);
    } catch {
      setError(t('client.login.genericError'));
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t('client.login.emailSent')}</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          {t('client.login.emailSentDesc')}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="ml-email" className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
          {t('client.login.emailLabel')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="ml-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('client.login.emailPlaceholder')}
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={loading || !email.trim()}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <ArrowRight className="h-5 w-5" />
            {t('client.login.sendLink')}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-slate-400 leading-relaxed">
        {t('client.login.magicLinkHelp')}
      </p>
    </form>
  );
}

function PasswordTab() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('client.login.wrongCredentials'));
      }
      router.push('/mon-compte/tableau-de-bord');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="pw-email" className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
          {t('client.login.emailLabel')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="pw-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('client.login.emailPlaceholder')}
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
          {t('client.login.passwordLabel')}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('client.login.passwordPlaceholder')}
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            aria-label={showPassword ? t('client.login.hidePassword') : t('client.login.showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            {t('client.login.loginBtn')}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-slate-400 leading-relaxed">
        {t('client.login.orUseMagicLink')}
      </p>
    </form>
  );
}

export default function ConnexionPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('magic-link');

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#f8f9fa] px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-8 pb-0 sm:px-8">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-black shadow-lg shadow-slate-200/50">
                    <Sparkles className="h-9 w-9 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('client.login.title')}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{t('client.login.subtitle')}</p>
                </div>
                <div className="mt-6">
                  <TabsList activeTab={activeTab} className="rounded-2xl border border-slate-200 bg-slate-100 p-1.5 w-full">
                    <TabsTrigger value="magic-link" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white flex-1">
                      <Mail className={`mr-2 h-4 w-4 transition-colors ${activeTab === 'magic-link' ? 'text-blue-500' : 'text-slate-400'}`} />
                      {t('client.login.tabMagicLink')}
                    </TabsTrigger>
                    <TabsTrigger value="password" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white flex-1">
                      <Lock className={`mr-2 h-4 w-4 transition-colors ${activeTab === 'password' ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {t('client.login.tabPassword')}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="h-[330px] px-6 pb-6 sm:px-8 sm:pb-8 w-full min-w-0">
                <TabsContent value="magic-link" className="mt-0 pt-6">
                  <MagicLinkTab />
                </TabsContent>
                <TabsContent value="password" className="mt-0 pt-6 w-[339px] mx-auto">
                  <PasswordTab />
                </TabsContent>
              </div>
            </Tabs>

            <div className="border-t border-slate-100 px-6 py-4 text-center sm:px-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                {t('client.login.backToSite')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
