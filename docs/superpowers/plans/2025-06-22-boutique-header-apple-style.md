# Header Boutique Apple-Style — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4 duplicated inline nav bars on boutique pages with a single global Apple-style glassmorphism header.

**Architecture:** New `boutique-header.tsx` component renders on all `/boutique/*` pages via `layout-provider.tsx`. A lightweight `/api/boutique/session-status` endpoint provides auth state to the client component (since `client_session` is httpOnly). Per-page inline `<header>` elements are removed. A new `create-account` API handles client self-registration.

**Tech Stack:** Next.js App Router, Tailwind CSS, Lucide React, framer-motion (for dropdown animation), jose (JWT decrypt server-side)

---

### Task 1: Session status API endpoint

**Files:**
- Create: `src/app/api/boutique/session-status/route.ts`

- [ ] **Step 1: Create API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('client_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ loggedIn: false });
  }

  try {
    const payload = await decrypt(sessionCookie);
    return NextResponse.json({
      loggedIn: true,
      email: payload.email || '',
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/api/boutique/session-status/route.ts
git commit -m "feat: add session-status API endpoint for header auth state"
```

---

### Task 2: Create account API endpoint

**Files:**
- Create: `src/app/api/boutique/create-account/route.ts`

- [ ] **Step 1: Create API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { upsertCustomer } from '@/lib/customers';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';

function isSandboxEmail(email: string): boolean {
  return email.includes('@sandbox') || email.includes('@personal.example.com');
}

function buildMagicLinkEmailHtml(linkUrl: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Bienvenue chez PIXIATECH</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Accéder à mon espace
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, displayName } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert or create customer
    const { id } = await upsertCustomer(normalizedEmail, displayName.trim());
    if (!id) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
    }

    // Create magic link with customerId
    const { url } = await createMagicLink(normalizedEmail, id);

    const isSandbox = isSandboxEmail(normalizedEmail);
    const toEmail = isSandbox ? 'ayanhil@gmail.com' : normalizedEmail;

    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: toEmail,
      subject: 'Bienvenue chez PIXIATECH — Confirmez votre email',
      html: buildMagicLinkEmailHtml(url, 15),
    });

    return NextResponse.json({
      message: 'Votre compte a été créé. Vérifiez votre boîte email pour vous connecter.',
    });
  } catch (err: any) {
    console.error('[CreateAccount] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/api/boutique/create-account/route.ts
git commit -m "feat: add create-account API endpoint"
```

---

### Task 3: Boutique header component

**Files:**
- Create: `src/components/boutique-header.tsx`

- [ ] **Step 1: Create Apple-style header component**

```typescript
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

  const truncatedEmail = session.email.length > 20 ? session.email.slice(0, 18) + '...' : session.email;

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
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/boutique-header.tsx
git commit -m "feat: add Apple-style boutique header component"
```

---

### Task 4: Update layout-provider to use BoutiqueHeader

**Files:**
- Modify: `src/components/layout-provider.tsx`

- [ ] **Step 1: Import and use BoutiqueHeader for boutique pages**

Replace line 8 (`import { Header } from '@/components/header';`) with:
```typescript
import { Header } from '@/components/header';
import { BoutiqueHeader } from '@/components/boutique-header';
```

Replace line 8 (`import { Header } from '@/components/header';`) with:
```typescript
import { Header } from '@/components/header';
import { BoutiqueHeader } from '@/components/boutique-header';
```

Add a variable for boutique main pages (excludes mon-compte which has its own layout):
```typescript
  const isBoutiqueMainPage = pathname.startsWith('/boutique') && !pathname.startsWith('/boutique/mon-compte') && !pathname.startsWith('/boutique/louer');
```

Replace line 51 (`{!isAdminPage && !isEmbedPage && <Header fixed={isBoutiqueProductPage} />}`) with:
```typescript
            {!isAdminPage && !isEmbedPage && (
              isBoutiqueMainPage ? (
                <BoutiqueHeader />
              ) : (
                <Header fixed={isBoutiqueProductPage} />
              )
            )}
```

Also update the padding logic — the new BoutiqueHeader is always fixed:

```typescript
            <main className={cn(
              'flex-1 flex items-start justify-center w-full',
              !isAdminPage && !isQuotePage && !isEmbedPage && !isBoutiqueMainPage && 'px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2',
              isBoutiqueMainPage && 'pt-14',
            )}>
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/layout-provider.tsx
git commit -m "feat: use BoutiqueHeader on boutique pages"
```

---

### Task 5: Remove inline nav from boutique page listing

**Files:**
- Modify: `src/app/boutique/page.tsx`

- [ ] **Step 1: Remove the inline `<header>` nav block**

Remove lines ~225-257 (the `<header>` element containing the nav buttons). The code to remove starts at `<header className="flex items-center justify-between...">` and ends at `</header>`.

Keep the filter drawer (`FilterDrawer`), the tab navigation, and all product content.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/boutique/page.tsx
git commit -m "refactor: remove inline nav from boutique listing page"
```

---

### Task 6: Remove inline nav from cart page

**Files:**
- Modify: `src/app/boutique/panier/page.tsx`

- [ ] **Step 1: Remove the inline `<header>` nav block**

Remove lines ~52-75 (from `<header className="flex items-center justify-between...">` to `</header>`).

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/boutique/panier/page.tsx
git commit -m "refactor: remove inline nav from cart page"
```

---

### Task 7: Remove inline nav from product detail page

**Files:**
- Modify: `src/app/boutique/produit/[id]/page.tsx`

- [ ] **Step 1: Remove the inline `<header>` nav block**

Remove lines ~245-276 (the `<header>` element containing nav buttons). Also adjust any padding or layout that assumed the old inline header.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/boutique/produit/[id]/page.tsx
git commit -m "refactor: remove inline nav from product detail page"
```

---

### Task 8: Remove inline nav from payment page

**Files:**
- Modify: `src/app/boutique/paiement/page.tsx`

- [ ] **Step 1: Remove the inline `<header>` nav block**

Remove lines ~263-295 (the `<header>` element containing nav buttons).

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/boutique/paiement/page.tsx
git commit -m "refactor: remove inline nav from payment page"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Verify all pages render correctly**

Check:
- `/boutique` — header present, no duplicate nav
- `/boutique/panier` — header present, cart badge works
- `/boutique/produit/[id]` — header present, no layout shift
- `/boutique/paiement` — header present
- `/boutique/mon-compte/connexion` — header present (if pathname starts with /boutique)

- [ ] **Step 3: Push commit**

```bash
git push
```
