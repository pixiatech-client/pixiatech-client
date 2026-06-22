'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, Store, ShoppingBag, User, LogOut, Package, ChevronDown } from 'lucide-react';
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
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createDone, setCreateDone] = useState(false);
  const [createError, setCreateError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await fetch('/api/boutique/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createEmail.trim(), displayName: createName.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      setCreateDone(true);
    } catch {
      setCreateError('Une erreur est survenue.');
    }
    setCreateLoading(false);
  };

  const isBoutiquePage = pathname.startsWith('/boutique') && !pathname.startsWith('/boutique/mon-compte');

  const truncatedEmail = (session.email || '').length > 20 ? (session.email || '').slice(0, 18) + '...' : (session.email || '');

  return (
    <header className="fixed top-0 z-30 w-full h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-14 h-full flex items-center justify-between">
        {/* Left: navigation buttons */}
        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            aria-label="Retour"
          >
            <ArrowLeft size={16} />
          </button>
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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[10px] font-black tracking-tight">P</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900 hidden sm:block">
            PIXIATECH
          </span>
        </Link>

        {/* Right: Lang + Auth + Cart */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[11px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            {t('langName').toUpperCase()}
          </button>

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
                    href="/boutique/mon-compte/commandes"
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
            <div className="flex items-center gap-1">
              <Link
                href="/boutique/mon-compte/connexion"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                Connexion
              </Link>
              <div className="relative">
                <button
                  onClick={() => setCreateOpen(!createOpen)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200"
                >
                  Créer un compte
                </button>
                {createOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50" ref={dropdownRef}>
                    {createDone ? (
                      <div className="text-center py-4">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Email envoyé !</p>
                        <p className="text-[11px] text-gray-500">Vérifiez votre boîte email pour vous connecter.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateAccount} className="space-y-3">
                        <p className="text-xs font-semibold text-gray-900">Créer un compte</p>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={createName}
                          onChange={e => setCreateName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                        />
                        <input
                          type="email"
                          placeholder="Votre email"
                          value={createEmail}
                          onChange={e => setCreateEmail(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                        />
                        {createError && <p className="text-[11px] text-red-600">{createError}</p>}
                        <button
                          type="submit"
                          disabled={createLoading}
                          className="w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"
                        >
                          {createLoading ? 'Création...' : 'Créer mon compte'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
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
