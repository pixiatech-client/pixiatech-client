'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';

import { loginAndRedirect, registerUser, handleGoogleSignIn as googleSignInAction, updateGoogleUserProfile } from '@/app/admin/actions';
import { useAuth } from '@/firebase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminT } from '@/hooks/useAdminT';

type AuthMode = 'login' | 'signup';

function getFirebaseErrorMessage(error: any, fallback: string, t: (s: string) => string) {
  const code = error?.code;

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return t('Incorrect email or password.');
    case 'auth/too-many-requests':
      return t('Too many attempts. Please try again in a few moments.');
    case 'auth/network-request-failed':
      return t('Network issue. Check your connection and try again.');
    default:
      return fallback;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { t } = useAdminT();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [showGoogleProfileForm, setShowGoogleProfileForm] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [googleDisplayName, setGoogleDisplayName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [isSavingGoogleProfile, setIsSavingGoogleProfile] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setLoginError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('[Login] Mounted, auth=', !!auth, 'sessionCookie=', document.cookie.includes('session='));
    if (auth) {
      console.log('[Login] auth available');
    }
    setIsSigningOut(false);

    const savedEmail = localStorage.getItem('remember-email');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, [auth]);

  const activeTitle = useMemo(() => {
    return authMode === 'login' ? t('Login') : t('Create an account');
  }, [authMode]);

  const activeDescription = useMemo(() => {
    return authMode === 'login'
      ? t('Access your admin space and manage your catalog.')
      : t('Create your admin account with the required information.');
  }, [authMode]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setSignupSuccess(null);
    setIsLoggingIn(true);

    if (!auth) {
      setLoginError(t('The authentication service is not available.'));
      setIsLoggingIn(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

      const actionsModule = await import('@/app/admin/actions');
      const { checkUserStatus } = actionsModule;
      const statusResult = await checkUserStatus(userCredential.user.uid);

      if (!statusResult.success) {
        await signOut(auth);
        throw new Error(statusResult.error || t('Account not found.'));
      }

      if (statusResult.status === 'pending') {
        await signOut(auth);
        throw new Error(t('Your account is pending approval by an administrator.'));
      }

      if (statusResult.status === 'suspended') {
        await signOut(auth);
        throw new Error(t('Your account has been suspended.'));
      }

      const idToken = await userCredential.user.getIdToken();

      if (rememberMe) {
        localStorage.setItem('remember-email', loginEmail);
      } else {
        localStorage.removeItem('remember-email');
      }

      const loginResult = await loginAndRedirect(idToken);
      if ('redirect' in loginResult) {
        router.push('/admin');
      } else {
        throw new Error(loginResult.error || t('Session creation failed.'));
      }
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error, error.message || t('An error occurred. Please try again.'), t);
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);
    setIsSigningUp(true);

    try {
      if (!signupName.trim()) {
        throw new Error(t('Name is required.'));
      }
      if (signupName.trim().length < 2) {
        throw new Error(t('Name must be at least 2 characters.'));
      }
      if (!signupEmail.trim()) {
        throw new Error(t('Email is required.'));
      }
      if (signupPassword.length < 6) {
        throw new Error(t('Password must be at least 6 characters.'));
      }
      if (!signupPhone.trim()) {
        throw new Error(t('Phone number is required.'));
      }
      if (!/^(\+33|0)[1-9][0-9]{8}$/.test(signupPhone.replace(/\s/g, ''))) {
        throw new Error(t('Invalid phone number format. Example: 06 12 34 56 78'));
      }

      const result = await registerUser({
        email: signupEmail,
        password: signupPassword,
        displayName: signupName,
        phone: signupPhone || '',
      });

      if (!result.success) {
        throw new Error(result.error || t('An error occurred during registration.'));
      }

      setSignupSuccess(t('Account created successfully. An administrator must approve your account before you can log in.'));
      setAuthMode('login');
      setLoginEmail(signupEmail);
      setLoginPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupPhone('');
    } catch (error: any) {
      console.error('Signup failed:', error);
      setSignupError(error?.message || t('An error occurred during registration.'));
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setSignupError(null);
    setIsSigningInWithGoogle(true);

    if (!auth) {
      setLoginError(t('The authentication service is not available.'));
      setIsSigningInWithGoogle(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      const result = await googleSignInAction({
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
      });

      if (!result.success) {
        throw new Error(result.error || t('Error during Google sign-in.'));
      }

      if (result.status === 'approved') {
        const loginResult = await loginAndRedirect(idToken);
        if ('redirect' in loginResult) {
          router.push('/admin');
        } else {
          throw new Error(loginResult.error || t('Session creation failed.'));
        }
      } else {
        setGoogleUser(result.userData);
        setGoogleDisplayName(result.userData?.displayName || userCredential.user.displayName || '');
        setGooglePhone(result.userData?.phone || '');

        if (result.isNew || !result.userData?.displayName) {
          setShowGoogleProfileForm(true);
        } else {
          setShowPendingMessage(true);
        }

        await signOut(auth);
      }
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setLoginError(t('Sign-in cancelled.'));
      } else {
        setLoginError(getFirebaseErrorMessage(error, t('An error occurred with Google.'), t));
      }
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleSaveGoogleProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!googleUser?.uid) return;

    setIsSavingGoogleProfile(true);
    try {
      const result = await updateGoogleUserProfile({
        uid: googleUser.uid,
        displayName: googleDisplayName,
        phone: googlePhone,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setShowGoogleProfileForm(false);
      setShowPendingMessage(true);
    } catch (error: any) {
      setLoginError(error?.message || t('Error during update.'));
    } finally {
      setIsSavingGoogleProfile(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#f8f9fa] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_22%)]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-600 shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                {t('Admin Space')}
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight text-slate-900">
                  {t('Secure Interface')}
                  <span className="block text-blue-600">PixiaTech</span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-500">
              {t('This space is reserved exclusively for suppliers, sales representatives, and administrators, to manage the professional catalog in a secure environment.')}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-gray-200 bg-white/90 p-5 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-blue-400">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{t('Quick Login')}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('Email and password authentication with a secure server-side session.')}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <KeyRound className="h-9 w-9" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{t('Integrated Registration')}</h2>
                  <p className="mt-1 text-sm text">
                    {t('Account creation via the existing backend with profile and role provisioning.')}
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back to site')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="border-b border-slate-100 bg-slate-50/80 px-6 pb-6 pt-8 sm:px-8">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-slate-900 shadow-lg shadow-slate-200">
                    <KeyRound className="h-9 w-9 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">{activeTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{activeDescription}</p>
                </div>

                <div className="mt-6">
                  <Tabs value={authMode} onValueChange={(value) => {
                    setAuthMode(value as AuthMode);
                    setLoginError(null);
                    setSignupError(null);
                    setSignupSuccess(null);
                  }}>
                    <TabsList activeTab={authMode} className="rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
                      <TabsTrigger value="login" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                        <LogIn className={`mr-2 h-4 w-4 transition-colors ${authMode === 'login' ? 'text-blue-500' : 'text-slate-400'}`} />
                        {t('Login')}
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                        <UserPlus className={`mr-2 h-4 w-4 transition-colors ${authMode === 'signup' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {t('Sign up')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
                {signupSuccess && authMode === 'login' && (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{signupSuccess}</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {authMode === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="login-email">
                          {t('Email')}
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="login-email"
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(event) => setLoginEmail(event.target.value)}
                            placeholder={t('admin@example.com')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="login-password">
                          {t('Password')}
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="login-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            placeholder={t('••••••••')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((value) => !value)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                            aria-label={showLoginPassword ? t('Hide password') : t('Show password')}
                          >
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-500">{t('Remember me')}</span>
                        </label>
                      </div>

                      {loginError && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoggingIn || isSigningOut}
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                      >
                        {isLoggingIn || isSigningOut ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            {t('Logging in...')}
                          </>
                        ) : (
                          <>
                            <LogIn className="h-5 w-5 text-blue-500" />
                            {t('Log in')}
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSignup}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="signup-name">
                          {t('Full name')}
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="signup-name"
                            type="text"
                            required
                            value={signupName}
                            onChange={(event) => setSignupName(event.target.value)}
                            placeholder={t('First and last name')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="signup-email">
                          {t('Email')}
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="signup-email"
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(event) => setSignupEmail(event.target.value)}
                            placeholder={t('admin@example.com')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="signup-password">
                          {t('Password')}
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="signup-password"
                            type={showSignupPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={signupPassword}
                            onChange={(event) => setSignupPassword(event.target.value)}
                            placeholder={t('Minimum 6 characters')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword((value) => !value)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                            aria-label={showSignupPassword ? t('Hide password') : t('Show password')}
                          >
                            {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500" htmlFor="signup-phone">
                          {t('Phone')}
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="signup-phone"
                            type="tel"
                            required
                            value={signupPhone}
                            onChange={(event) => setSignupPhone(event.target.value)}
                            placeholder={t('+33 6 00 00 00 00')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      {signupError && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{signupError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSigningUp}
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-theme-sidebar-active-bg text-sm font-bold text-theme-sidebar-active-text shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                      >
                        {isSigningUp ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('Signing up...')}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5" />
                            {t('Create my account')}
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {showGoogleProfileForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <p className="font-bold">{t('Complete your profile')}</p>
                      <p className="mt-1 text-xs">{t('Your account will be submitted for administrator approval.')}</p>
                    </div>

                    <form onSubmit={handleSaveGoogleProfile} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                          {t('Full name')}
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={googleDisplayName}
                            onChange={(e) => setGoogleDisplayName(e.target.value)}
                            placeholder={t('Your name')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                          {t('Phone')} <span className="normal-case tracking-normal text-slate-400">({t('optional')})</span>
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={googlePhone}
                            onChange={(e) => setGooglePhone(e.target.value)}
                            placeholder={t('+33 6 00 00 00 00')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingGoogleProfile}
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-theme-sidebar-active-bg text-sm font-bold text-theme-sidebar-active-text shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                      >
                        {isSavingGoogleProfile ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('Saving...')}
                          </>
                        ) : (
                          t('Save and submit')
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {showPendingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                        <ShieldCheck className="h-8 w-8 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-900">{t('Pending account')}</p>
                        <p className="mt-2 text-sm text-amber-700">
                          {t('Your account has been created successfully. An administrator must approve your account and assign you a role before you can log in.')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowPendingMessage(false);
                          setGoogleUser(null);
                        }}
                        className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-800"
                      >
                        {t('Back to login')}
                      </button>
                    </div>
                  </motion.div>
                )}

                {!showGoogleProfileForm && !showPendingMessage && (
                  <>
                    <div className="relative mt-6 flex items-center">
                      <div className="flex-1 border-t border-slate-200" />
                      <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('or')}</span>
                      <div className="flex-1 border-t border-slate-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSigningInWithGoogle || isLoggingIn || isSigningUp || isSigningOut}
                      className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSigningInWithGoogle ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {t('Continue with Google')}
                    </button>

                    <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t('Back to site')}
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center sm:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  {t('Access reserved for PixiaTech administration')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}