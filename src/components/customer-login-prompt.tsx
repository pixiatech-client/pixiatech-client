'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, Send, Lock, LogIn, X } from 'lucide-react';

/**
 * Proposition de connexion client facultative (non bloquante).
 *
 * S'affiche au-dessus des formulaires de la boutique (checkout, location, sur
 * commande) lorsque le visiteur n'est pas connecté. Réutilise exclusivement les
 * API existantes :
 *   - /api/boutique/send-magic-link (lien magique)
 *   - /api/boutique/login-password  (mot de passe)
 *   - /api/boutique/session-status  (détection de session active)
 *
 * Comportement identique au bloc historique du checkout :
 *   - connecter par lien magique ;
 *   - connecter par mot de passe ;
 *   - après succès → window.location.reload() → le pré-remplissage de session
 *     réinjecte automatiquement le profil ;
 *   - possibilité de continuer en invité ;
 *   - masqué lorsque le client est déjà connecté.
 *
 * L'email est passé par le formulaire parent afin d'être réutilisé sans
 * nouvelle détection d'existence de compte (anti-énumération).
 */
export default function CustomerLoginPrompt({ email }: { email: string }) {
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [loginPanelOpen, setLoginPanelOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginDisplay, setLoginDisplay] = useState<'choose' | 'password' | 'magic'>('choose');
  const [loginMagicSending, setLoginMagicSending] = useState(false);
  const [loginMagicSent, setLoginMagicSent] = useState(false);

  // Détection de session active une seule fois au montage.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/boutique/session-status')
      .then(res => res.json())
      .then((data: { loggedIn?: boolean }) => {
        if (!cancelled) {
          setLoggedIn(!!data?.loggedIn);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoggedIn(false);
          setLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setLoginError('Veuillez renseigner votre adresse email dans le formulaire ci-dessous.');
      return;
    }
    if (loginMagicSending || loginMagicSent) return;
    setLoginError('');
    setLoginMagicSending(true);
    try {
      const res = await fetch('/api/boutique/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Échec de l\'envoi du lien.');
      }
      setLoginMagicSent(true);
    } catch (e: any) {
      setLoginError(e?.message || 'Une erreur est survenue.');
    } finally {
      setLoginMagicSending(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !loginPassword || loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/boutique/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, password: loginPassword }),
      });
      if (!res.ok) {
        throw new Error('Email ou mot de passe incorrect.');
      }
      window.location.reload();
    } catch (e: any) {
      setLoginError(e?.message || 'Une erreur est survenue.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Tant que la détection de session n'est pas terminée, on n'affiche rien
  // pour éviter un clignotement du bloc chez les clients connectés.
  if (!loaded || loggedIn) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-4 mb-6">
      {!loginPanelOpen ? (
        <button
          type="button"
          onClick={() => {
            setLoginPanelOpen(true);
            setLoginDisplay('choose');
            setLoginError('');
          }}
          className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
        >
          Vous avez déjà un compte client ? Se connecter
        </button>
      ) : (
        <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-bold text-gray-800">Se connecter</p>
            <button
              type="button"
              onClick={() => setLoginPanelOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>

          {loginDisplay === 'choose' && (
            <>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                Récupérez automatiquement vos informations en vous connectant à votre espace client.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setLoginDisplay('magic')}
                  className="flex items-center gap-2 rounded-xl bg-black text-white text-[12px] font-semibold px-4 py-2.5 hover:opacity-90 transition-all active:scale-[0.99]"
                >
                  <Mail size={14} />
                  Recevoir un lien de connexion
                </button>
                <button
                  type="button"
                  onClick={() => setLoginDisplay('password')}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-[12px] font-semibold px-4 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.99]"
                >
                  <Lock size={14} />
                  Se connecter avec mon mot de passe
                </button>
              </div>
              <p className="mt-3 text-[10px] text-gray-400">
                Vous pouvez aussi continuer sans vous connecter.
              </p>
            </>
          )}

          {loginDisplay === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="text-[12px] font-semibold text-gray-700">Recevoir un lien de connexion</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {email.trim()
                  ? <span>Un lien vous sera envoyé à <span className="font-semibold text-gray-700">{email.trim()}</span>.</span>
                  : 'Renseignez votre adresse email dans le formulaire ci-dessous pour recevoir un lien.'}
              </p>
              {loginMagicSent ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700 leading-relaxed">
                  Si un compte correspond à cette adresse, un lien de connexion vous a été envoyé. Vérifiez vos spams.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loginMagicSending || !email.trim()}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-black text-white text-[12px] font-semibold px-4 py-2.5 hover:opacity-90 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginMagicSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {loginMagicSending ? 'Envoi en cours…' : 'Envoyer le lien'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setLoginDisplay('choose')}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                ← Autres options
              </button>
            </form>
          )}

          {loginDisplay === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div className="text-[12px] font-semibold text-gray-700">Se connecter avec mon mot de passe</div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="password"
                  autoFocus
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                  placeholder="Votre mot de passe"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-[12px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading || !loginPassword}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-black text-white text-[12px] font-semibold px-4 py-2.5 hover:opacity-90 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                {loginLoading ? 'Connexion…' : 'Se connecter'}
              </button>
              <button
                type="button"
                onClick={() => setLoginDisplay('choose')}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                ← Autres options
              </button>
            </form>
          )}

          {loginError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700 leading-relaxed whitespace-pre-line">
              {loginError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
