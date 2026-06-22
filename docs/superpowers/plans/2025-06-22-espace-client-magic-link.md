# Espace Client Boutique — Magic Link Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a passwordless customer account system with Magic Link login, auto-provisioned after PayPal payment.

**Architecture:** New `customers` + `magic_links` Firestore collections. Post-payment, capture-order route upserts customer and writes `customerId` to orders. Login via email → generates crypto token → stores in magic_links → sends email with link → validates → sets JWT session cookie (12h).

**Tech Stack:** Next.js App Router, Firebase Admin SDK (server-side), Nodemailer/SMTP, jose (JWT), crypto (Node.js)

---

### Task 1: Customer library (`src/lib/customers.ts`)

**Files:**
- Create: `src/lib/customers.ts`
- Create: `src/lib/__tests__/customers.test.ts`

- [ ] **Step 1: Create customers lib**

```typescript
import { getFirebaseAdmin } from './firebase-admin';

export interface Customer {
  id?: string;
  email: string;
  displayName: string;
  phone: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'active';
}

const COLLECTION = 'customers';

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(COLLECTION).where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function createCustomer(data: Omit<Customer, 'id'>): Promise<string> {
  const { adminDb } = getFirebaseAdmin();
  const ref = await adminDb.collection(COLLECTION).add(data);
  return ref.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const { adminDb } = getFirebaseAdmin();
  await adminDb.collection(COLLECTION).doc(id).update(data);
}

export async function upsertCustomer(email: string, displayName: string): Promise<{ id: string; isNew: boolean }> {
  const existing = await findCustomerByEmail(email);
  const now = new Date().toISOString();
  if (existing) {
    await updateCustomer(existing.id!, { lastLoginAt: now });
    return { id: existing.id!, isNew: false };
  }
  const id = await createCustomer({
    email,
    displayName,
    phone: '',
    createdAt: now,
    lastLoginAt: now,
    status: 'active',
  });
  return { id, isNew: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/customers.ts
git commit -m "feat: add customers Firestore CRUD lib"
```

---

### Task 2: Magic link library (`src/lib/magic-link.ts`)

**Files:**
- Create: `src/lib/magic-link.ts`

- [ ] **Step 1: Create magic link lib**

```typescript
import { getFirebaseAdmin } from './firebase-admin';
import crypto from 'crypto';

export interface MagicLink {
  id?: string;
  email: string;
  customerId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

const COLLECTION = 'magic_links';
const TOKEN_EXPIRY_MINUTES = 15;

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function buildMagicLinkUrl(token: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/boutique/mon-compte/valider?token=${token}&email=${encodeURIComponent(email)}`;
}

export async function createMagicLink(email: string, customerId: string): Promise<{ token: string; url: string }> {
  const { adminDb } = getFirebaseAdmin();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await adminDb.collection(COLLECTION).doc(token).set({
    email,
    customerId,
    expiresAt,
    used: false,
    createdAt: now.toISOString(),
  });

  return { token, url: buildMagicLinkUrl(token, email) };
}

export async function validateMagicLink(token: string, email: string): Promise<{ valid: boolean; customerId?: string; reason?: string }> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(COLLECTION).where('__name__', '==', token).limit(1).get();
  if (snap.empty) return { valid: false, reason: 'Token introuvable' };

  const doc = snap.docs[0];
  const data = doc.data() as MagicLink;

  if (data.used) return { valid: false, reason: 'Ce lien a déjà été utilisé' };
  if (data.email !== email) return { valid: false, reason: 'Email invalide' };
  if (new Date(data.expiresAt) < new Date()) return { valid: false, reason: 'Ce lien a expiré' };

  await adminDb.collection(COLLECTION).doc(doc.id).update({ used: true });

  return { valid: true, customerId: data.customerId };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/magic-link.ts
git commit -m "feat: add magic link token generation and validation"
```

---

### Task 3: Session cookie utility — update `src/lib/auth.ts`

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Update encrypt to accept custom expiration**

```typescript
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error('SESSION_SECRET is not set in environment variables');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiresIn = '24h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('JWT decryption failed:', error);
    throw new Error('Invalid session token.');
  }
}
```

- [ ] **Step 2: Add SESSION_SECRET to .env**

Generate a random 64-char hex string and add to `.env`:

```bash
# Run this in terminal to generate
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to `.env`:

```
SESSION_SECRET=<generated-64-char-hex>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts .env
git commit -m "feat: support custom expiry in JWT encrypt, add SESSION_SECRET"
```

---

### Task 4: Update capture-order route — upsert customer + write customerId

**Files:**
- Modify: `src/app/api/paypal/capture-order/route.ts`

- [ ] **Step 1: Update route to create/update customer and write customerId**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { upsertCustomer } from '@/lib/customers';

export async function POST(req: NextRequest) {
  try {
    const { orderId, rentalItems, purchaseItems } = await req.json();
    const capture = await capturePayPalOrder(orderId);
    const paypalCaptureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || capture?.id || '';
    const { adminDb } = getFirebaseAdmin();
    const now = new Date().toISOString();

    // Extract payer info from PayPal
    const payer = capture?.payer;
    const shipping = capture?.purchase_units?.[0]?.shipping;
    const payerName = payer?.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : '';
    const customerName = shipping?.name?.full_name || payerName || '';
    const customerEmail = payer?.email_address || '';
    const shippingAddress = shipping?.address || {};
    const customerAddress = shippingAddress?.address_line_1 || '';
    const customerCity = shippingAddress?.admin_area_2 || '';
    const customerPostcode = shippingAddress?.postal_code || '';

    // Upsert customer
    let customerId = '';
    if (customerEmail) {
      const result = await upsertCustomer(customerEmail, customerName);
      customerId = result.id;
    }

    const rentalOrderIds: string[] = [];
    if (rentalItems && rentalItems.length > 0) {
      for (const item of rentalItems) {
        try {
          const rd = item.renterDetails;
          if (!rd) {
            console.error('Missing renterDetails for item:', item.productId);
            continue;
          }
          const ref = await adminDb.collection('rental_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: item.productPrice,
            quantity: item.quantity,
            renterCompany: rd.company || '',
            renterRepresentative: rd.representative || '',
            renterEmail: rd.email || '',
            renterPhone: rd.phone || '',
            renterAddress: rd.address || '',
            renterCity: rd.city || '',
            renterPostcode: rd.postcode || '',
            rentalStartDate: item.rentalStartDate || '',
            rentalEndDate: item.rentalEndDate || '',
            rentalStartTime: item.rentalStartTime || '',
            rentalEndTime: item.rentalEndTime || '',
            additionalNotes: item.additionalNotes || '',
            contractSignedAt: item.contractSignedAt || null,
            contractPdfUrl: null,
            emailVerified: true,
            emailVerifiedAt: now,
            paypalOrderId: orderId,
            paypalCaptureId,
            amountPaid: item.productPrice * item.quantity,
            status: 'pending_validation',
            userId: null,
            customerId,
            createdAt: now,
            updatedAt: now,
          });
          rentalOrderIds.push(ref.id);
        } catch (err) {
          console.error('Failed to create rental order for item:', item.productId, err);
        }
      }
    }

    const saleOrderIds: string[] = [];
    if (purchaseItems && purchaseItems.length > 0) {
      for (const item of purchaseItems) {
        try {
          const ref = await adminDb.collection('sale_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: item.productPrice,
            quantity: item.quantity,
            customerName,
            customerEmail,
            customerPhone: '',
            customerAddress,
            customerCity,
            customerPostcode,
            customerId,
            paypalOrderId: orderId,
            paypalCaptureId,
            amountPaid: item.productPrice * item.quantity,
            status: 'commande',
            createdAt: now,
            updatedAt: now,
          });
          saleOrderIds.push(ref.id);
        } catch (err) {
          console.error('Failed to create sale order for item:', item.productId, err);
        }
      }
    }

    return NextResponse.json({ ...capture, rentalOrderIds, saleOrderIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/paypal/capture-order/route.ts
git commit -m "feat: upsert customer and add customerId to orders on payment"
```

---

### Task 5: Send magic link API route

**Files:**
- Create: `src/app/api/boutique/send-magic-link/route.ts`

- [ ] **Step 1: Create API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/customers';
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
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Connexion à votre espace client</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Se connecter
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            Aucun changement n'a été apporté à votre compte.
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
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find customer — don't leak whether email exists
    const customer = await findCustomerByEmail(normalizedEmail);

    // Always return the same message to prevent email enumeration
    if (!customer) {
      return NextResponse.json({
        message: 'Si cet email est associé à un compte, un lien de connexion vous a été envoyé.',
      });
    }

    // Create magic link
    const { url } = await createMagicLink(normalizedEmail, customer.id!);

    // Determine recipient
    const isSandbox = isSandboxEmail(normalizedEmail);
    const toEmail = isSandbox ? 'ayanhil@gmail.com' : normalizedEmail;

    // Send email
    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: toEmail,
      subject: 'Connexion à votre espace client PIXIATECH',
      html: buildMagicLinkEmailHtml(url, 15),
    });

    console.log(`[MagicLink] Sent to ${toEmail}${isSandbox ? ` (redirected from ${normalizedEmail})` : ''}`);

    return NextResponse.json({
      message: 'Si cet email est associé à un compte, un lien de connexion vous a été envoyé.',
    });
  } catch (err: any) {
    console.error('[MagicLink] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du lien' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/boutique/send-magic-link/route.ts
git commit -m "feat: add send-magic-link API route with sandbox redirect"
```

---

### Task 6: Logout API route

**Files:**
- Create: `src/app/api/boutique/logout/route.ts`

- [ ] **Step 1: Create logout API**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const loginUrl = new URL('/boutique/mon-compte/connexion', req.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('client_session');
  return response;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/boutique/logout/route.ts
git commit -m "feat: add logout API route"
```

---

### Task 7: Magic link validation page

**Files:**
- Create: `src/app/boutique/mon-compte/valider/page.tsx`

- [ ] **Step 1: Create validation page**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setError('Lien invalide. Vérifiez que vous avez bien copié l\'URL complète.');
      return;
    }

    fetch(`/api/boutique/validate-magic-link?token=${token}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('success');
          setTimeout(() => router.push('/boutique/mon-compte/commandes'), 1500);
        } else {
          setStatus('error');
          setError(data.reason || 'Lien invalide ou expiré.');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Erreur de validation. Veuillez réessayer.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">Validation de votre lien...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Connexion réussie !</h1>
            <p className="text-gray-500">Redirection vers votre espace client...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link href="/boutique/mon-compte/connexion" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Demander un nouveau lien
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/boutique/mon-compte/valider/page.tsx
git commit -m "feat: add magic link validation page"
```

---

### Task 8: Validate magic link API route

**Files:**
- Create: `src/app/api/boutique/validate-magic-link/route.ts`

- [ ] **Step 1: Create validation API**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateMagicLink } from '@/lib/magic-link';
import { updateCustomer } from '@/lib/customers';
import { encrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    const email = req.nextUrl.searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ valid: false, reason: 'Paramètres manquants' }, { status: 400 });
    }

    const result = await validateMagicLink(token, email.toLowerCase().trim());
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 400 });
    }

    // Update lastLoginAt
    await updateCustomer(result.customerId!, { lastLoginAt: new Date().toISOString() });

    // Create session cookie
    const sessionToken = await encrypt(
      { customerId: result.customerId, email: email.toLowerCase().trim(), type: 'client' },
      '12h'
    );

    const response = NextResponse.json({ valid: true });
    response.cookies.set('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (err: any) {
    console.error('[ValidateMagicLink] Error:', err);
    return NextResponse.json({ valid: false, reason: 'Erreur serveur' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/boutique/validate-magic-link/route.ts
git commit -m "feat: add validate-magic-link API route with session cookie creation"
```

---

### Task 9: Login page (email input)

**Files:**
- Create: `src/app/boutique/mon-compte/connexion/page.tsx`

- [ ] **Step 1: Create login page**

```typescript
'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ConnexionPage() {
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
      if (!res.ok) throw new Error('Erreur serveur');
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Email envoyé</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Si cet email est associé à un compte, un lien de connexion vous a été envoyé.
            Vérifiez votre boîte de réception (et vos spams).
          </p>
          <Link href="/boutique" className="mt-6 inline-block text-sm font-semibold text-gray-900 underline underline-offset-2">
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
        <p className="text-sm text-gray-500 mb-6">
          Saisissez votre email pour recevoir un lien de connexion.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Envoyer le lien</>}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6 text-center leading-relaxed">
          Aucun mot de passe requis. Le lien expire après 15 minutes.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/boutique/mon-compte/connexion/page.tsx
git commit -m "feat: add magic link login page"
```

---

### Task 10: Protected layout + redirect root

**Files:**
- Create: `src/app/boutique/mon-compte/layout.tsx`
- Create: `src/app/boutique/mon-compte/page.tsx`

- [ ] **Step 1: Create protected layout**

```typescript
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MonCompteLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;

  if (!sessionCookie) {
    redirect('/boutique/mon-compte/connexion');
  }

  try {
    await decrypt(sessionCookie);
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create root redirect page**

```typescript
import { redirect } from 'next/navigation';

export default function MonComptePage() {
  redirect('/boutique/mon-compte/commandes');
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/boutique/mon-compte/layout.tsx src/app/boutique/mon-compte/page.tsx
git commit -m "feat: add protected layout for espace client"
```

---

### Task 11: Orders list page

**Files:**
- Create: `src/app/boutique/mon-compte/commandes/page.tsx`

- [ ] **Step 1: Create orders list page**

```typescript
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CalendarRange, Package, Euro, ArrowRight, LogOut } from 'lucide-react';

async function getCustomerOrders(customerId: string) {
  const { adminDb } = getFirebaseAdmin();

  const [saleSnap, rentalSnap] = await Promise.all([
    adminDb.collection('sale_orders').where('customerId', '==', customerId).orderBy('createdAt', 'desc').get(),
    adminDb.collection('rental_orders').where('customerId', '==', customerId).orderBy('createdAt', 'desc').get(),
  ]);

  const saleOrders = saleSnap.docs.map(d => ({ id: d.id, type: 'sale' as const, ...d.data() }));
  const rentalOrders = rentalSnap.docs.map(d => ({ id: d.id, type: 'rental' as const, ...d.data() }));

  return [...saleOrders, ...rentalOrders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusLabel(type: string, status: string): string {
  if (type === 'sale') {
    const labels: Record<string, string> = { commande: 'En préparation', archive: 'Archivé', corbeille: 'Corbeille' };
    return labels[status] || status;
  }
  const labels: Record<string, string> = {
    pending_validation: 'En attente de validation',
    validated: 'Validée',
    shipped: 'Expédiée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

export default async function CommandesPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/boutique/mon-compte/connexion');

  let customerId = '';
  let customerEmail = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
    customerEmail = payload.email;
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  const orders = await getCustomerOrders(customerId);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b border-gray-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Mon espace client</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{customerEmail}</span>
            <form action="/api/boutique/logout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Mes commandes</h2>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune commande pour le moment</p>
            <Link href="/boutique" className="mt-4 inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/boutique/mon-compte/commande/${order.id}?type=${order.type}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.productName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Quantité : {order.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatPrice(order.amountPaid)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : order.status === 'shipped'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {order.type === 'rental' ? <CalendarRange className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {order.type === 'rental' ? 'Location' : 'Achat'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{getStatusLabel(order.type, order.status)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/boutique/mon-compte/commandes/page.tsx
git commit -m "feat: add orders list page for espace client"
```

---

### Task 12: Order detail page

**Files:**
- Create: `src/app/boutique/mon-compte/commande/[id]/page.tsx`

- [ ] **Step 1: Create order detail page**

```typescript
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, CalendarRange, Euro, Package, FileText } from 'lucide-react';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const saleStatusLabels: Record<string, string> = {
  commande: 'En préparation',
  archive: 'Archivé',
  corbeille: 'Corbeille',
};

const rentalStatusLabels: Record<string, string> = {
  pending_validation: 'En attente de validation',
  validated: 'Validée',
  shipped: 'Expédiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export default async function CommandeDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { type?: string } }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/boutique/mon-compte/connexion');

  let customerId = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  const { adminDb } = getFirebaseAdmin();
  const type = searchParams.type || 'sale';
  const collection = type === 'sale' ? 'sale_orders' : 'rental_orders';

  const doc = await adminDb.collection(collection).doc(params.id).get();
  if (!doc.exists) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Commande introuvable</h1>
          <Link href="/boutique/mon-compte/commandes" className="text-sm font-semibold text-gray-900 underline underline-offset-2">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const order = { id: doc.id, ...doc.data() } as any;

  // Security check: make sure the order belongs to this customer
  if (order.customerId !== customerId) {
    redirect('/boutique/mon-compte/commandes');
  }

  const statusLabels = type === 'sale' ? saleStatusLabels : rentalStatusLabels;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b border-gray-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/boutique/mon-compte/commandes" className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Détail de la commande</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{order.productName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                    {type === 'rental' ? <CalendarRange className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {type === 'rental' ? 'Location' : 'Achat'}
                  </span>
                  <span className="text-sm text-gray-500">{statusLabels[order.status] || order.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Montant</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(order.amountPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantité</p>
                <p className="text-lg font-bold text-gray-900">{order.quantity}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date de commande</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statut</p>
                <p className="text-sm font-semibold text-gray-900">{statusLabels[order.status] || order.status}</p>
              </div>
            </div>

            {type === 'rental' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Début location</p>
                  <p className="text-sm font-semibold text-gray-900">{order.rentalStartDate || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fin location</p>
                  <p className="text-sm font-semibold text-gray-900">{order.rentalEndDate || '—'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-900">{order.customerEmail || order.renterEmail || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adresse</p>
                <p className="text-sm font-semibold text-gray-900">{order.customerAddress || order.renterAddress || '—'}</p>
              </div>
              {type === 'rental' && order.renterCompany && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Société</p>
                  <p className="text-sm font-semibold text-gray-900">{order.renterCompany}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 p-6 flex justify-between">
            <Link href="/boutique/mon-compte/commandes" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              ← Retour aux commandes
            </Link>
            <Link href="/boutique" className="text-sm font-semibold text-gray-900 underline underline-offset-2">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/boutique/mon-compte/commande/[id]/page.tsx
git commit -m "feat: add order detail page for espace client"
```

---

### Task 13: Update middleware for client routes

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add client route matcher + session check**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages: cache on CDN
  const publicPages = ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify'];
  if (publicPages.includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return response;
  }

  // Client espace routes: check client_session cookie
  const clientLoginUrl = new URL('/boutique/mon-compte/connexion', request.url);
  const isClientAuthPage = pathname === '/boutique/mon-compte/connexion' || pathname.startsWith('/boutique/mon-compte/valider');
  const isClientRoute = pathname.startsWith('/boutique/mon-compte/');

  if (isClientRoute && !isClientAuthPage) {
    const clientSession = request.cookies.get('client_session')?.value;
    if (!clientSession) {
      return NextResponse.redirect(clientLoginUrl);
    }
  }

  if (isClientAuthPage && request.cookies.get('client_session')?.value) {
    return NextResponse.redirect(new URL('/boutique/mon-compte/commandes', request.url));
  }

  // Admin routes: session check
  const sessionCookie = request.cookies.get('session')?.value;
  const loginUrl = new URL('/admin/login', request.url);
  const adminUrl = new URL('/admin', request.url);
  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');
  const isApiRoute = pathname.startsWith('/api/');

  if (!sessionCookie && !isAuthPage && !isApiRoute && pathname.startsWith('/admin')) {
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(adminUrl);
  }

  if (sessionCookie && pathname.startsWith('/admin')) {
    try {
      const verifyUrl = new URL('/api/verify-session', request.url);
      const verifyRes = await fetch(verifyUrl, {
        headers: { cookie: request.headers.get('cookie') || '' },
      });
      const data = await verifyRes.json();

      if (!data.valid && data.reason === 'session_mismatch') {
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('session');
        response.cookies.delete('sessionToken');
        return response;
      }
    } catch (err) {
      console.error('[Middleware] verify-session error:', err);
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/boutique/mon-compte', '/boutique/mon-compte/:path*', '/api/:path*'],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect client espace routes in middleware"
```

---

### Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| `customers` collection | Task 1 |
| `magic_links` collection | Task 2 |
| Session cookie JWT (12h) | Task 3 |
| Token expiry (15 min) | Task 2 |
| Customer upsert after payment | Task 4 |
| `customerId` on sale_orders/rental_orders | Task 4 |
| Send magic link API | Task 5 |
| Sandbox redirect to ayanhil@gmail.com | Task 5 |
| Logout API | Task 6 |
| Validate magic link API | Task 8 |
| Validation page | Task 7 |
| Login page | Task 9 |
| Protected layout | Task 10 |
| Orders list | Task 11 |
| Order detail | Task 12 |
| Middleware protection | Task 13 |
