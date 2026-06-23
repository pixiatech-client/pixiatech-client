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
                <div className="absolute right-0 top-full mt-1 w-[500px] bg-white rounded-xl shadow-lg border border-gray-100 z-50" ref={dropdownRef}>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setEspaceTab('membre')}
                      className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${espaceTab === 'membre' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <User size={14} className="inline mr-1.5 -mt-0.5" />
                      Membre
                    </button>
                    <button
                      onClick={() => setEspaceTab('revendeur')}
                      className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${espaceTab === 'revendeur' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Store size={14} className="inline mr-1.5 -mt-0.5" />
                      Revendeur
                    </button>
                  </div>

                  {/* Tab content */}
                  {espaceTab === 'membre' ? (
                    <div className="p-5">
                      {memberMagicSent ? (
                        <div className="text-center py-6">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Email envoyé !</p>
                          <p className="text-xs text-gray-500">Vérifiez votre boîte email pour vous connecter.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mb-4">Connexion membre</p>
                          <input
                            type="email"
                            placeholder="Votre email"
                            value={memberEmail}
                            onChange={e => setMemberEmail(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 mb-4"
                          />
                          {memberError && <p className="text-[11px] text-red-600 mb-3">{memberError}</p>}
                          <div className="grid grid-cols-2 gap-3">
                            <form onSubmit={handlePasswordLogin} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                              <div className="flex items-center gap-2">
                                <Key size={14} className="text-gray-500" />
                                <span className="text-xs font-semibold text-gray-700">Mot de passe</span>
                              </div>
                              <input
                                type="password"
                                placeholder="Votre mot de passe"
                                value={memberPassword}
                                onChange={e => setMemberPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                              />
                              <button
                                type="submit"
                                disabled={memberLoading || !memberEmail || !memberPassword}
                                className="w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"
                              >
                                {memberLoading ? 'Connexion...' : 'Se connecter'}
                              </button>
                            </form>
                            <form onSubmit={handleMagicLink} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3 flex flex-col">
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-500" />
                                <span className="text-xs font-semibold text-gray-700">Lien magique</span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed flex-1">
                                Recevez un lien de connexion par email, sans mot de passe.
                              </p>
                              <button
                                type="submit"
                                disabled={memberLoading || !memberEmail}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
                              >
                                {memberLoading ? 'Envoi...' : 'Envoyer le lien'}
                              </button>
                            </form>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-5">
                      {resellerDone ? (
                        <div className="text-center py-6">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Merci !</p>
                          <p className="text-xs text-gray-500">Vous recevrez un email dès l'ouverture des inscriptions.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-3">Devenir revendeur</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                            L'espace réservé aux vendeurs n'est pas encore disponible.<br />
                            Laissez-nous votre email, nous vous préviendrons dès l'ouverture.
                          </p>
                          <form onSubmit={handleResellerInterest} className="flex gap-2">
                            <input
                              type="email"
                              placeholder="Votre email"
                              value={resellerEmail}
                              onChange={e => setResellerEmail(e.target.value)}
                              required
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                            />
                            {resellerError && <p className="text-[11px] text-red-600">{resellerError}</p>}
                            <button
                              type="submit"
                              disabled={resellerLoading}
                              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all whitespace-nowrap"
                            >
                              {resellerLoading ? 'Envoi...' : 'M\'informer'}
                            </button>
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
