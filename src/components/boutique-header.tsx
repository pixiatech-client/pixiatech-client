'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Store, ShoppingBag, User, LogOut, Package, ChevronDown, Shield, Key, Mail } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function BoutiqueHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { locale, setLocale, t } = useI18n();
  const [session, setSession] = useState<{ loggedIn: boolean; email: string }>({ loggedIn: false, email: '' });
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberMagicSent, setMemberMagicSent] = useState(false);
  const [resellerOpen, setResellerOpen] = useState(false);
  const [resellerEmail, setResellerEmail] = useState('');
  const [resellerLoading, setResellerLoading] = useState(false);
  const [resellerDone, setResellerDone] = useState(false);
  const [resellerError, setResellerError] = useState('');
  const [espaceTab, setEspaceTab] = useState<'membre' | 'revendeur'>('membre');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resellerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/boutique/session-status')
      .then(r => r.json())
      .then(data => setSession(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setCreateOpen(false);
      }
      if (resellerRef.current && !resellerRef.current.contains(e.target as Node)) {
        setResellerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    setMemberError('');
    try {
      const res = await fetch('/api/boutique/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail.trim(), password: memberPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email ou mot de passe incorrect');
      setMemberLoading(false);
      window.location.href = '/mon-compte/tableau-de-bord';
    } catch (err: any) {
      setMemberError(err.message || 'Erreur de connexion');
      setMemberLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    setMemberError('');
    try {
      const res = await fetch('/api/boutique/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      setMemberMagicSent(true);
    } catch {
      setMemberError('Une erreur est survenue.');
    }
    setMemberLoading(false);
  };

  const handleResellerInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResellerLoading(true);
    setResellerError('');
    try {
      const res = await fetch('/api/boutique/reseller-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resellerEmail.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      setResellerDone(true);
    } catch {
      setResellerError('Une erreur est survenue.');
    }
    setResellerLoading(false);
  };

  const isBoutiquePage = pathname.startsWith('/boutique');

  const truncatedEmail = (session.email || '').length > 20 ? (session.email || '').slice(0, 18) + '...' : (session.email || '');

  return (
    <header className="fixed top-0 z-30 w-full h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-14 h-full flex items-center justify-between">
        {/* Left: navigation buttons */}
        <nav className="flex items-center gap-1.5 -ml-[100px]">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              pathname === '/' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Home size={14} />
            Accueil
          </Link>
          <Link
            href="/boutique"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              isBoutiquePage ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Store size={14} />
            Boutique
          </Link>
        </nav>

        {/* Center: Logo */}


        {/* Right: Lang + Auth + Cart */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[11px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            {t('langName').toUpperCase()}
          </button>

          {/* Admin link */}
          <Link
            href="/admin/login"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            aria-label="Administration"
            title="Administration"
          >
            <Shield size={14} />
          </Link>

          {/* Auth buttons */}
          {session.loggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                <User size={14} />
                <span className="max-w-[100px] truncate">{truncatedEmail}</span>
                <ChevronDown size={12} className={cn("transition-transform", profileOpen && "rotate-180")} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    href="/mon-compte/commandes"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Package size={14} />
                    Mes commandes
                  </Link>
                  <form action="/api/boutique/logout" method="POST">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      Déconnexion
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={resellerRef}>
              <button
                onClick={() => setCreateOpen(!createOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200"
              >
                <User size={14} />
                Espace membre
              </button>
              {createOpen && (
                <div className="absolute right-0 top-full mt-2 w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100/80 z-50 overflow-hidden" ref={dropdownRef}>
                  {/* Tabs */}
                  <div className="flex bg-gray-50/50 p-1.5 m-1.5 rounded-xl gap-1">
                    <button
                      onClick={() => setEspaceTab('membre')}
                      className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all duration-200 rounded-lg ${
                        espaceTab === 'membre'
                          ? 'text-gray-900 bg-white shadow-sm border border-gray-100'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <User size={14} className="inline mr-2 -mt-0.5" />
                      Membre
                    </button>
                    <button
                      onClick={() => setEspaceTab('revendeur')}
                      className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all duration-200 rounded-lg ${
                        espaceTab === 'revendeur'
                          ? 'text-gray-900 bg-white shadow-sm border border-gray-100'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Store size={14} className="inline mr-2 -mt-0.5" />
                      Revendeur
                    </button>
                  </div>

                  {/* Tab content */}
                  {espaceTab === 'membre' ? (
                    <div className="p-5 pt-2">
                      {memberMagicSent ? (
                        <div className="text-center py-10 px-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 rotate-0">
                            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-gray-900 mb-1.5">Email envoyé !</p>
                          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                            Vérifiez votre boîte de réception. Le lien de connexion expire sous 15 minutes.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-between mb-5">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Connexion membre</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Accédez à vos commandes et votre espace personnel</p>
                            </div>
                          </div>

                          {/* Email field */}
                          <div className="relative mb-4">
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="Votre adresse email"
                              value={memberEmail}
                              onChange={e => setMemberEmail(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-gray-50/30 placeholder:text-gray-300"
                            />
                          </div>

                          {memberError && (
                            <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-100 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <p className="text-[11px] text-red-600 font-medium">{memberError}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {/* Password method */}
                            <form onSubmit={handlePasswordLogin} className="group relative bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
                              <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                    <Key size={13} className="text-gray-500" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800">Mot de passe</span>
                                </div>
                                <input
                                  type="password"
                                  placeholder="Saisir votre mot de passe"
                                  value={memberPassword}
                                  onChange={e => setMemberPassword(e.target.value)}
                                  className="w-full px-2.5 py-2 border border-gray-100 rounded-lg text-xs bg-gray-50/30 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 transition-all placeholder:text-gray-300 mb-3"
                                />
                                <button
                                  type="submit"
                                  disabled={memberLoading || !memberEmail || !memberPassword}
                                  className="mt-auto w-full bg-gray-900 text-white py-2 rounded-lg text-[11px] font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
                                >
                                  {memberLoading ? (
                                    <span className="flex items-center justify-center gap-1.5">
                                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                      Connexion...
                                    </span>
                                  ) : 'Se connecter'}
                                </button>
                              </div>
                            </form>

                            {/* Magic link method */}
                            <form onSubmit={handleMagicLink} className="group relative bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
                              <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800">Lien magique</span>
                                </div>
                                <p className="text-[10.5px] text-gray-400 leading-relaxed flex-1 mb-3">
                                  Recevez un lien par email. Pas de mot de passe requis.
                                </p>
                                <button
                                  type="submit"
                                  disabled={memberLoading || !memberEmail}
                                  className="w-full bg-gray-50 border border-gray-100 text-gray-700 py-2 rounded-lg text-[11px] font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
                                >
                                  {memberLoading ? (
                                    <span className="flex items-center justify-center gap-1.5">
                                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                      Envoi...
                                    </span>
                                  ) : 'Envoyer le lien'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 pt-2">
                      {resellerDone ? (
                        <div className="text-center py-10 px-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-gray-900 mb-1.5">Merci de votre intérêt !</p>
                          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                            Nous vous tiendrons informé dès l&apos;ouverture de l&apos;espace revendeur.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-5">
                            <p className="text-sm font-semibold text-gray-900">Devenir revendeur</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Programme de partenariat et revente de nos solutions</p>
                          </div>

                          <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-4 mb-5">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-amber-800 mb-0.5">Espace en cours de déploiement</p>
                                <p className="text-[10.5px] text-amber-600/80 leading-relaxed">
                                  L&apos;inscription revendeur n&apos;est pas encore ouverte. Laissez-nous votre email, nous vous préviendrons dès le lancement.
                                </p>
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleResellerInterest}>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                  type="email"
                                  placeholder="Votre adresse email"
                                  value={resellerEmail}
                                  onChange={e => setResellerEmail(e.target.value)}
                                  required
                                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-gray-50/30 placeholder:text-gray-300"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={resellerLoading || !resellerEmail}
                                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
                              >
                                {resellerLoading ? (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Envoi...
                                  </span>
                                ) : "M'informer"}
                              </button>
                            </div>
                            {resellerError && (
                              <p className="text-[11px] text-red-600 font-medium mt-2 flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {resellerError}
                              </p>
                            )}
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
             </div>
          )}

          {/* Cart */}
          <Link
            href="/boutique/panier"
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            aria-label="Panier"
          >
            <ShoppingBag size={16} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
