# Parcours Location Boutique — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans. Steps use checkbox syntax.

**Goal:** Refonte complète du parcours Location sur la page produit boutique avec formulaire, contrat, signature, vérification email, panier mixte, et back-office dédié.

**Tech Stack:** Next.js 16, TypeScript, Firestore, PayPal SDK, html2canvas + jsPDF, Canvas API (signature)

---

## File Structure

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/lib/rental-orders.ts` | Create | Types + CRUD Firestore pour la collection `rental_orders` |
| `src/components/BoutiqueRentalFlow.tsx` | Create | Assistant location 3 étapes (form → contrat → vérification) |
| `src/contexts/CartContext.tsx` | Modify | Ajout `type: 'purchase' \| 'rental'` + champs rental |
| `src/app/boutique/produit/[id]/page.tsx` | Modify | Condition location → affiche `BoutiqueRentalFlow` dans colonne gauche |
| `src/app/boutique/panier/page.tsx` | Modify | Badge type + infos location sur items rental |
| `src/app/boutique/paiement/page.tsx` | Modify | Passage `rentalItems` à la capture PayPal |
| `src/app/api/paypal/capture-order/route.ts` | Modify | Création rental_orders après capture |
| `src/app/admin/boutique/layout.tsx` | Create | Layout onglets Vente / Location |
| `src/app/admin/boutique/location/page.tsx` | Create | Dashboard location admin |

---

### Task 1: Types et helpers Firestore rental_orders

**Files:**
- Create: `src/lib/rental-orders.ts`

- [ ] **Step 1: Créer le fichier avec les types et CRUD**

```typescript
import { firestore } from '@/firebase/config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export type RentalStatus = 'pending_validation' | 'validated' | 'shipped' | 'completed' | 'cancelled';

export interface RentalOrder {
  id?: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  // Client
  renterCompany: string;
  renterRepresentative: string;
  renterEmail: string;
  renterPhone: string;
  renterAddress: string;
  renterCity: string;
  renterPostcode: string;
  // Location
  rentalStartDate: string;
  rentalEndDate: string;
  rentalStartTime: string;
  rentalEndTime: string;
  additionalNotes: string;
  // Contrat
  contractSignedAt: string | null;
  contractPdfUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  // Paiement
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  amountPaid: number;
  // Meta
  status: RentalStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'rental_orders';

export async function createRentalOrder(data: Omit<RentalOrder, 'id'>): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateRentalOrder(id: string, data: Partial<RentalOrder>) {
  await updateDoc(doc(firestore, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getRentalOrder(id: string): Promise<RentalOrder | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RentalOrder;
}

export async function getRentalOrders(options?: {
  status?: RentalStatus;
  limit?: number;
}): Promise<RentalOrder[]> {
  const constraints: any[] = [];
  if (options?.status) constraints.push(where('status', '==', options.status));
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(collection(firestore, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RentalOrder));
}

export async function getAllRentalOrders(): Promise<RentalOrder[]> {
  const q = query(collection(firestore, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RentalOrder));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rental-orders.ts
git commit -m "feat(rental): add rental_orders types and Firestore CRUD"
```

---

### Task 2: Modifier CartContext — ajout type rental

**Files:**
- Modify: `src/contexts/CartContext.tsx` (lignes 5-12, 16, 19, 23, 44)

- [ ] **Step 1: Ajouter les champs rental à CartItem**

Remplacer l'interface `CartItem`:

```typescript
import { RenterDetails } from '@/lib/signature-types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  type: 'purchase' | 'rental';
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
  renterDetails?: RenterDetails;
  rentalFlowCompleted?: boolean;
}
```

- [ ] **Step 2: Mettre à jour addItem pour accepter type**

Remplacer la signature et l'implémentation de `addItem`:

```typescript
  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.productId && i.type === product.type);
      if (existing) {
        return prev.map(i =>
          i.productId === product.productId && i.type === product.type
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);
```

- [ ] **Step 3: Mettre à jour removeItem pour type+id**

```typescript
  const removeItem = useCallback((productId: string, type?: 'purchase' | 'rental') => {
    setItems(prev => prev.filter(i =>
      type ? !(i.productId === productId && i.type === type) : i.productId !== productId
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number, type?: 'purchase' | 'rental') => {
    if (qty < 1) return;
    setItems(prev => prev.map(i =>
      (i.productId === productId && (!type || i.type === type))
        ? { ...i, quantity: qty }
        : i
    ));
  }, []);
```

- [ ] **Step 4: Commit**

```bash
git add src/contexts/CartContext.tsx
git commit -m "feat(rental): add type field and rental metadata to CartItem"
```

---

### Task 3: BoutiqueRentalFlow — assistant location 3 étapes

**Files:**
- Create: `src/components/BoutiqueRentalFlow.tsx`

- [ ] **Step 1: Créer le composant avec les états et le formulaire étape 1**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, ShieldAlert, Clock, AlertTriangle, CheckCircle, Lock, Copy, KeyRound, FileText, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { RenterDetails } from '@/lib/signature-types';
import { validatePhone } from '@/lib/phone-validation';
import ContractDocument from './ContractDocument';
import SignaturePad from './SignaturePad';
import type { Product } from '@/lib/boutique-data';

const CITIES = [
  { id: '1', name: 'Paris', postalCode: '75000' },
  { id: '2', name: 'Marseille', postalCode: '13000' },
  { id: '3', name: 'Lyon', postalCode: '69000' },
  { id: '4', name: 'Toulouse', postalCode: '31000' },
  { id: '5', name: 'Nice', postalCode: '06000' },
  { id: '6', name: 'Nantes', postalCode: '44000' },
  { id: '7', name: 'Montpellier', postalCode: '34000' },
  { id: '8', name: 'Strasbourg', postalCode: '67000' },
  { id: '9', name: 'Bordeaux', postalCode: '33000' },
  { id: '10', name: 'Lille', postalCode: '59000' },
  { id: '11', name: 'Rennes', postalCode: '35000' },
  { id: '12', name: 'Reims', postalCode: '51100' },
  { id: '13', name: 'Toulon', postalCode: '83000' },
  { id: '14', name: 'Saint-Étienne', postalCode: '42000' },
  { id: '15', name: 'Le Havre', postalCode: '76600' },
  { id: '16', name: 'Grenoble', postalCode: '38000' },
  { id: '17', name: 'Dijon', postalCode: '21000' },
  { id: '18', name: 'Angers', postalCode: '49000' },
  { id: '19', name: 'Nîmes', postalCode: '30000' },
  { id: '20', name: 'Aix-en-Provence', postalCode: '13100' }
];

type FlowStep = 'form' | 'contract' | 'verification' | 'done';

interface Props {
  product: Product;
  onComplete: () => void;
}

export default function BoutiqueRentalFlow({ product, onComplete }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [currentStep, setCurrentStep] = useState<FlowStep>('form');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [renterDetails, setRenterDetails] = useState<RenterDetails>({
    company: '', representative: '', address: '', postcode: '', city: '', email: '', phone: ''
  });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [rentalStartTime, setRentalStartTime] = useState('08:00');
  const [rentalEndTime, setRentalEndTime] = useState('18:00');
  const [quantity, setQuantity] = useState(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [acceptedCgl, setAcceptedCgl] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureValidated, setIsSignatureValidated] = useState(false);
  const [showConsentAlert, setShowConsentAlert] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [inputOtpCode, setInputOtpCode] = useState('');
  const [isOtpCompleted, setIsOtpCompleted] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(600);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [resendAttemptsLeft, setResendAttemptsLeft] = useState(3);
  const [showErrorTips, setShowErrorTips] = useState(false);
  const [otpResent, setOtpResent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer: any;
    if (currentStep === 'verification' && !isOtpCompleted && emailDeliveryStatus === 'sent') {
      timer = setInterval(() => {
        setOtpTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [currentStep, isOtpCompleted, emailDeliveryStatus]);

  const handleNextFromForm = () => {
    setAttemptedSubmit(true);
    setEmailError(null);
    setPhoneError(null);
    let hasError = false;
    if (!renterDetails.company.trim()) hasError = true;
    if (!renterDetails.representative.trim()) hasError = true;
    if (!validateEmail(renterDetails.email)) { setEmailError('Email invalide'); hasError = true; }
    const phoneResult = validatePhone(renterDetails.phone);
    if (!phoneResult.isValid) { setPhoneError(phoneResult.error || 'Téléphone invalide'); hasError = true; }
    if (!renterDetails.address.trim()) hasError = true;
    if (!citySearchQuery.trim()) hasError = true;
    if (!rentalStartDate) hasError = true;
    if (!rentalEndDate) hasError = true;
    if (hasError) return;
    setCurrentStep('contract');
  };

  const handleNextFromContract = () => {
    setCurrentStep('verification');
    setEmailDeliveryStatus('sending');
    sendOtpEmail();
  };

  const sendOtpEmail = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtpCode(code);
    setOtpTimeLeft(600);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: renterDetails.email,
          subject: 'Votre code de vérification PixiaTech',
          code,
          companyName: renterDetails.company,
          clientName: renterDetails.representative,
          totalAmount: product.price.toFixed(2),
          details: product.name,
          appUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      setEmailDeliveryStatus(data.success ? 'sent' : 'failed');
    } catch {
      setEmailDeliveryStatus('failed');
    }
  };

  const handleManualCodeVerify = (code: string) => {
    if (code === sentOtpCode) {
      setIsOtpCompleted(true);
      setOtpError(null);
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        type: 'rental',
        rentalStartDate,
        rentalEndDate,
        rentalStartTime,
        rentalEndTime,
        renterDetails,
        rentalFlowCompleted: true,
      });
      setTimeout(() => setCurrentStep('done'), 500);
    } else {
      setOtpError('Code invalide. Vérifiez votre email.');
      setInputOtpCode('');
    }
  };

  const handleResendCode = async () => {
    if (resendAttemptsLeft <= 0) return;
    setResendAttemptsLeft(prev => prev - 1);
    await sendOtpEmail();
    setOtpTimeLeft(600);
    setOtpError(null);
    setInputOtpCode('');
    setOtpResent(true);
    setTimeout(() => setOtpResent(false), 4000);
  };

  const pack = {
    id: 'boutique-rental',
    name: product.name,
    surface: `${product.name}`,
    price: product.price,
    deposit: Math.round(product.price * 0.5),
    description: product.description,
    specs: [`Produit: ${product.name}`, `Catégorie: ${product.category}`],
  };

  return (
    <div className="animate-fade-in">
      {/* Étape 1: Formulaire */}
      {currentStep === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-amber-600" />
            <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">ESPACE SÉCURISÉ</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight text-zinc-900 uppercase">Location</h2>
            <p className="text-xs text-zinc-500 font-semibold">Tous les champs marqués * sont obligatoires</p>
          </div>

          {/* Informations de location - dates */}
          <div className="bg-[#f0f9ff]/70 border border-blue-150/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full block" />
              <h4 className="font-bold text-[10px] sm:text-xs text-blue-900 uppercase tracking-wider">Période de location</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">Date début *</label>
                <input type="date" value={rentalStartDate} onChange={e => setRentalStartDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">Date fin *</label>
                <input type="date" value={rentalEndDate} onChange={e => setRentalEndDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">Début *</label>
                <input type="text" placeholder="HH:MM" value={rentalStartTime} onChange={e => setRentalStartTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">Fin *</label>
                <input type="text" placeholder="HH:MM" value={rentalEndTime} onChange={e => setRentalEndTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm" />
              </div>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-1.5">
            <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-700">Quantité *</label>
            <div className="flex items-center border border-zinc-200 rounded-xl w-fit bg-white">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2.5 hover:bg-zinc-50 transition-colors rounded-xl">
                <span className="text-lg font-semibold text-zinc-500">−</span>
              </button>
              <span className="w-12 text-center text-sm font-semibold text-zinc-900">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2.5 hover:bg-zinc-50 transition-colors rounded-xl">
                <span className="text-lg font-semibold text-zinc-500">+</span>
              </button>
            </div>
          </div>

          {/* Informations client */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className={`font-black uppercase tracking-wide text-[10px] ${attemptedSubmit && !renterDetails.company ? 'text-red-500' : 'text-zinc-700'}`}>Société *</label>
              <input type="text" placeholder="Nom de votre société" value={renterDetails.company} onChange={e => setRenterDetails({...renterDetails, company: e.target.value})}
                className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${attemptedSubmit && !renterDetails.company ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
            </div>
            <div className="space-y-1.5">
              <label className={`font-black uppercase tracking-wide text-[10px] ${attemptedSubmit && !renterDetails.representative ? 'text-red-500' : 'text-zinc-700'}`}>Contact *</label>
              <input type="text" placeholder="Nom du contact" value={renterDetails.representative} onChange={e => setRenterDetails({...renterDetails, representative: e.target.value})}
                className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${attemptedSubmit && !renterDetails.representative ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
            </div>
            <div className="space-y-1.5">
              <label className={`font-black uppercase tracking-wide text-[10px] ${emailError ? 'text-red-500' : 'text-zinc-700'}`}>Email professionnel *</label>
              <input type="email" placeholder="email@entreprise.com" value={renterDetails.email} onChange={e => setRenterDetails({...renterDetails, email: e.target.value})}
                className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${emailError ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
              {emailError && <p className="text-red-550 font-bold text-[10px] mt-1">▲ {emailError}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={`font-black uppercase tracking-wide text-[10px] ${phoneError ? 'text-red-500' : 'text-zinc-700'}`}>Téléphone *</label>
              <input type="tel" placeholder="0612345678" value={renterDetails.phone} onChange={e => { const v = e.target.value.replace(/[^\d]/g, '').slice(0, 14); setRenterDetails({...renterDetails, phone: v}); }}
                className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${phoneError ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
              {phoneError && <p className="text-red-550 font-bold text-[10px] mt-1">▲ {phoneError}</p>}
            </div>

            {/* Ville */}
            <div className="space-y-1.5 relative">
              <label className={`font-black uppercase tracking-wide text-[10px] ${attemptedSubmit && !citySearchQuery ? 'text-red-500' : 'text-zinc-700'}`}>Ville de livraison *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400"><Search size={14} /></div>
                <input type="text" placeholder="Rechercher une ville" value={citySearchQuery} onChange={e => { setCitySearchQuery(e.target.value); setIsCityDropdownOpen(true); }} onFocus={() => setIsCityDropdownOpen(true)}
                  className={`w-full rounded-[14px] pl-10 pr-10 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${attemptedSubmit && !citySearchQuery ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
              </div>
              {isCityDropdownOpen && (
                <div className="absolute z-55 left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-50 text-xs font-semibold">
                  {CITIES.filter(c => c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) || c.postalCode.includes(citySearchQuery)).map(c => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCityId(c.id); setCitySearchQuery(`${c.name} (${c.postalCode})`); setRenterDetails(prev => ({...prev, city: c.name, postcode: c.postalCode})); setIsCityDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50/50 flex items-center justify-between text-zinc-800 transition-colors">
                      <span>{c.name} ({c.postalCode})</span>
                      {selectedCityId === c.id && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-1.5">
              <label className={`font-black uppercase tracking-wide text-[10px] ${attemptedSubmit && !renterDetails.address ? 'text-red-500' : 'text-zinc-700'}`}>Adresse *</label>
              <input type="text" placeholder="Adresse de livraison" value={renterDetails.address} onChange={e => setRenterDetails({...renterDetails, address: e.target.value})}
                className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${attemptedSubmit && !renterDetails.address ? 'bg-red-50/30 border-2 border-red-300' : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'}`} />
            </div>

            {/* Remarques */}
            <div className="space-y-1.5">
              <label className="font-black uppercase tracking-wide text-[10px] text-zinc-550">Remarques <span className="text-[9px] bg-zinc-100 text-zinc-500 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Optionnel</span></label>
              <textarea rows={3} placeholder="Informations complémentaires..." value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
                className="w-full bg-[#edf2f7]/40 border-2 border-transparent hover:border-zinc-200 rounded-[14px] px-4 py-3.5 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-xs shadow-sm resize-none h-24" />
            </div>
          </div>

          <button onClick={handleNextFromForm} className="w-full bg-zinc-950 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
            Continuer <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Étape 2: Contrat & Signature */}
      {currentStep === 'contract' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-amber-600" />
            <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">CONTRAT DE LOCATION</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight text-zinc-900 uppercase">Contrat de location</h2>

          <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm">
            <ContractDocument
              pack={pack}
              renter={renterDetails}
              signatureDataUrl={signatureDataUrl}
              isValidated={isSignatureValidated}
              projectMode="location"
              rentalPeriod={{ from: rentalStartDate, to: rentalEndDate }}
              rentalStartTime={rentalStartTime}
              rentalEndTime={rentalEndTime}
              productImage={product.image}
            />

            <div className={`mt-6 p-4 rounded-xl border transition-all ${showErrorTips && !acceptedCgl ? 'border-red-200 bg-red-50/40' : acceptedCgl ? 'border-blue-200 bg-blue-50/20' : 'border-zinc-200 bg-zinc-50/40'}`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={acceptedCgl} onChange={e => { setAcceptedCgl(e.target.checked); if (e.target.checked) setShowErrorTips(false); }}
                    className="w-5 h-5 rounded-lg border appearance-none checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                  {acceptedCgl && <Check size={12} className="absolute inset-0 m-auto text-white stroke-[3.5] pointer-events-none" />}
                </div>
                <span className="text-xs leading-relaxed">J&apos;accepte les conditions générales de location</span>
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-100 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                <h4 className="text-xs font-heading font-extrabold uppercase tracking-widest text-zinc-900">Signature électronique</h4>
              </div>
              <SignaturePad
                isValidated={isSignatureValidated}
                onSave={(dataUrl) => {
                  if (!acceptedCgl) { setShowConsentAlert(true); setShowErrorTips(true); return; }
                  setSignatureDataUrl(dataUrl);
                  setIsSignatureValidated(true);
                  setShowErrorTips(false);
                }}
                onClear={() => { setSignatureDataUrl(null); setIsSignatureValidated(false); }}
              />
              <p className="text-center mt-3 text-[10px] text-zinc-400 font-mono">Certifié électroniquement</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setCurrentStep('form')} className="px-6 py-3.5 border border-zinc-200 rounded-xl font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition-all flex items-center gap-2">
              <ArrowLeft size={14} /> Retour
            </button>
            <button onClick={handleNextFromContract} disabled={!acceptedCgl || !isSignatureValidated}
              className="flex-1 bg-zinc-950 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continuer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Étape 3: Vérification email */}
      {currentStep === 'verification' && (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-amber-600" />
            <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">VÉRIFICATION DE SÉCURITÉ</span>
          </div>

          {emailDeliveryStatus === 'sending' && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 animate-pulse">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="text-xs font-semibold">Envoi du code de vérification à {renterDetails.email}...</div>
            </div>
          )}

          {emailDeliveryStatus === 'sent' && !isOtpCompleted && (
            <>
              <div className="p-4 bg-emerald-50/80 border border-emerald-250/60 rounded-2xl flex items-start gap-3 text-emerald-900">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold">
                  <span className="font-black uppercase tracking-wide text-emerald-800 text-[10px] block mb-0.5">CODE ENVOYÉ</span>
                  Un code à 6 chiffres vous a été envoyé à {renterDetails.email}
                </div>
              </div>

              <div className="bg-blue-50/30 border-2 border-blue-600 rounded-[24px] p-6 text-center space-y-6">
                <div className="w-12 h-12 bg-zinc-950 text-white rounded-[16px] flex items-center justify-center mx-auto shadow-md">
                  <Lock size={20} className="stroke-[2.5]" />
                </div>

                <div className="relative max-w-xs mx-auto">
                  <input ref={hiddenInputRef} type="text" maxLength={100} value={inputOtpCode} autoFocus
                    onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setInputOtpCode(val); setOtpError(null); if (val.length === 6) setTimeout(() => handleManualCodeVerify(val), 100); }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-default" />
                  <div onClick={() => hiddenInputRef.current?.focus()} className="flex justify-between gap-1.5 sm:gap-2.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold font-mono transition-all cursor-pointer ${inputOtpCode[idx] ? 'bg-white border-blue-500 text-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
                        {inputOtpCode[idx] || ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                  <Clock size={12} />
                  <span>Code valable </span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${otpTimeLeft <= 59 ? 'text-red-600 bg-red-100 animate-pulse' : 'text-zinc-800 bg-zinc-100'}`}>{formatTime(otpTimeLeft)}</span>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left text-[11px] text-red-900">
                    <AlertTriangle size={14} className="text-red-650 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {resendAttemptsLeft > 0 ? (
                    <button onClick={handleResendCode} className="text-xs text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
                      Renvoyer le code ({resendAttemptsLeft} tentatives restantes)
                    </button>
                  ) : (
                    <div className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">Trop de tentatives</div>
                  )}
                </div>
              </div>
            </>
          )}

          {isOtpCompleted && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <CheckCircle size={32} className="mx-auto text-emerald-600 mb-3" />
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Email vérifié</h3>
              <p className="text-sm text-emerald-700">Ajout au panier en cours...</p>
            </div>
          )}

          {emailDeliveryStatus === 'failed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
              <AlertTriangle size={20} className="mx-auto text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-800 mb-2">Échec d'envoi du code</p>
              <button onClick={sendOtpEmail} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition-all">
                Réessayer
              </button>
            </div>
          )}

          {emailDeliveryStatus === 'sent' && !isOtpCompleted && (
            <button onClick={() => setCurrentStep('contract')} className="w-full py-3.5 border border-zinc-200 rounded-xl font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Retour au contrat
            </button>
          )}
        </div>
      )}

      {/* Étape 4: Terminé */}
      {currentStep === 'done' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-14 h-14 bg-zinc-950 text-white rounded-[18px] flex items-center justify-center mx-auto shadow-md">
            <Check size={26} className="stroke-[3]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-zinc-900 uppercase">Prêt pour la location</h2>
            <p className="text-sm text-zinc-500 mt-2">{product.name} a été ajouté à votre panier</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/boutique/panier')} className="w-full bg-zinc-950 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
              <ShoppingBag size={14} /> Voir le panier
            </button>
            <button onClick={onComplete} className="w-full border-2 border-zinc-200 py-3.5 rounded-xl font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition-all">
              Continuer mes achats
            </button>
          </div>
        </div>
      )}

      {/* Alert dialog consent */}
      {showConsentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConsentAlert(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-amber-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <h3 className="text-center font-bold text-zinc-900 mb-2">Acceptez les conditions</h3>
            <p className="text-center text-xs text-zinc-500 mb-4">Veuillez accepter les conditions générales avant de signer.</p>
            <button onClick={() => setShowConsentAlert(false)} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold text-xs">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BoutiqueRentalFlow.tsx
git commit -m "feat(rental): add BoutiqueRentalFlow component with 3-step wizard"
```

---

### Task 4: Intégration dans la page produit

**Files:**
- Modify: `src/app/boutique/produit/[id]/page.tsx`

- [ ] **Step 1: Ajouter l'import et l'état**

Ajouter en haut du fichier:
```typescript
import BoutiqueRentalFlow from '@/components/BoutiqueRentalFlow';
```

Ajouter après `const [selectedVariant, setSelectedVariant]`:
```typescript
  const [rentalFlowCompleted, setRentalFlowCompleted] = useState(false);
```

- [ ] **Step 2: Remplacer le contenu gauche en mode location**

Remplacer le bloc `const canRent` et `const canBuy` avec le state et la logique. Puis modifier la section du main pour conditionner l'affichage de la galerie.

Remplacer le wrapper `<div className="lg:mr-[430px]">` et tout son contenu par:

```typescript
        <div className="lg:mr-[430px]">
          {purchaseType === 'location' && product.availableFor?.includes('rental') ? (
            <BoutiqueRentalFlow
              product={product}
              onComplete={() => setRentalFlowCompleted(true)}
            />
          ) : (
            <div className="flex flex-col">
              {/* ... existing gallery, description, specs content ... */}
            </div>
          )}
        </div>
```

- [ ] **Step 3: Modifier le bouton "Louer ce produit"**

Remplacer le bloc location (lignes 496-503):
```typescript
              {purchaseType === 'location' ? (
                <div className="flex flex-col gap-3">
                  <button disabled className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                    <FileText size={16} />
                    {rentalFlowCompleted ? 'Louer ce produit' : 'Effectuez les étapes de location'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    {rentalFlowCompleted
                      ? 'Produit ajouté au panier — rendez-vous dans le panier pour finaliser'
                      : 'Remplissez le formulaire ci-contre pour louer ce produit'}
                  </p>
                  {rentalFlowCompleted && (
                    <button onClick={() => router.push('/boutique/panier')} className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                      <ShoppingBag size={16} />
                      Voir le panier
                    </button>
                  )}
                </div>
              ) : (
```

- [ ] **Step 4: Ajouter l'import ShoppingBag si manquant**

Vérifier que `ShoppingBag` est déjà importé (ligne 5).

- [ ] **Step 5: Commit**

```bash
git add src/app/boutique/produit/\[id\]/page.tsx
git commit -m "feat(rental): integrate BoutiqueRentalFlow into product detail page"
```

---

### Task 5: Panier — affichage des items location

**Files:**
- Modify: `src/app/boutique/panier/page.tsx`

- [ ] **Step 1: Ajouter badge type et infos location dans chaque item**

Remplacer le `<h2 className="font-bold...">{item.name}</h2>` et `<p className="text-sm text-gray-400">{item.category}</p>` par:

```typescript
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="font-bold text-gray-900 text-base">{item.name}</h2>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.type === 'rental'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.type === 'rental' ? 'Location' : 'Achat'}
                            </span>
                          </div>
                          {item.type === 'rental' && item.rentalStartDate && (
                            <p className="text-xs text-gray-400">
                              Du {new Date(item.rentalStartDate).toLocaleDateString('fr-FR')}
                              {item.rentalEndDate ? ` au ${new Date(item.rentalEndDate).toLocaleDateString('fr-FR')}` : ''}
                              {item.rentalStartTime && ` (${item.rentalStartTime} - ${item.rentalEndTime || ''})`}
                            </p>
                          )}
```

- [ ] **Step 2: Mettre à jour addItem de l'upsell avec type purchase**

Remplacer:
```typescript
addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category })
```
par:
```typescript
addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category, type: 'purchase' })
```

- [ ] **Step 3: Commit**

```bash
git add src/app/boutique/panier/page.tsx
git commit -m "feat(rental): display rental badge and dates in cart"
```

---

### Task 6: Paiement — passage des items rental + capture

**Files:**
- Modify: `src/app/boutique/paiement/page.tsx`
- Modify: `src/app/api/paypal/capture-order/route.ts`

- [ ] **Step 1: Capturer avec données rental dans paiement/page.tsx**

Dans le `PayPalButtonGroup`, modifier le `onApprove` pour envoyer les rentalItems:

```typescript
        onApprove={async (data) => {
          try {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                rentalItems: items.filter(i => i.type === 'rental').map(i => ({
                  productId: i.productId,
                  productName: i.name,
                  productImage: i.image,
                  productPrice: i.price,
                  quantity: i.quantity,
                  rentalStartDate: i.rentalStartDate,
                  rentalEndDate: i.rentalEndDate,
                  rentalStartTime: i.rentalStartTime,
                  rentalEndTime: i.rentalEndTime,
                  renterCompany: i.renterDetails?.company || '',
                  renterRepresentative: i.renterDetails?.representative || '',
                  renterEmail: i.renterDetails?.email || '',
                  renterPhone: i.renterDetails?.phone || '',
                  renterAddress: i.renterDetails?.address || '',
                  renterCity: i.renterDetails?.city || '',
                  renterPostcode: i.renterDetails?.postcode || '',
                  additionalNotes: '',
                })),
              }),
            });
```

- [ ] **Step 2: Modifier capture-order route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createRentalOrder } from '@/lib/rental-orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId, rentalItems } = await req.json();
    const capture = await capturePayPalOrder(orderId);

    if (capture.status === 'COMPLETED' && rentalItems?.length > 0) {
      const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
      for (const item of rentalItems) {
        await createRentalOrder({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          productPrice: item.productPrice,
          quantity: item.quantity,
          renterCompany: item.renterCompany,
          renterRepresentative: item.renterRepresentative,
          renterEmail: item.renterEmail,
          renterPhone: item.renterPhone,
          renterAddress: item.renterAddress,
          renterCity: item.renterCity,
          renterPostcode: item.renterPostcode,
          rentalStartDate: item.rentalStartDate || '',
          rentalEndDate: item.rentalEndDate || '',
          rentalStartTime: item.rentalStartTime || '',
          rentalEndTime: item.rentalEndTime || '',
          additionalNotes: item.additionalNotes || '',
          contractSignedAt: null,
          contractPdfUrl: null,
          emailVerified: true,
          emailVerifiedAt: null,
          paypalOrderId: orderId,
          paypalCaptureId: captureId,
          amountPaid: capture.purchase_units?.[0]?.amount?.value
            ? parseFloat(capture.purchase_units[0].amount.value)
            : 0,
          status: 'pending_validation',
          userId: null,
          createdAt: '',
          updatedAt: '',
        });
      }
    }

    return NextResponse.json(capture);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/boutique/paiement/page.tsx src/app/api/paypal/capture-order/route.ts
git commit -m "feat(rental): pass rental items to capture-order API for rental_orders creation"
```

---

### Task 7: Admin — layout onglets Boutique

**Files:**
- Create: `src/app/admin/boutique/layout.tsx`

- [ ] **Step 1: Créer le layout admin boutique avec tabs**

```typescript
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag, Building2 } from 'lucide-react';

export default function BoutiqueAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/admin/boutique') {
      router.replace('/admin/boutique/vente');
    }
  }, [pathname, router]);

  const tabs = [
    { id: '/admin/boutique/vente', label: 'Vente', icon: ShoppingBag },
    { id: '/admin/boutique/location', label: 'Location', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200/70 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname === tab.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/boutique/layout.tsx
git commit -m "feat(admin): add boutique admin layout with Vente/Location tabs"
```

---

### Task 8: Admin — dashboard Location

**Files:**
- Create: `src/app/admin/boutique/location/page.tsx`
- Créer le dossier si nécessaire

- [ ] **Step 1: Créer la page dashboard location**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Building2, ShoppingBag, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { getRentalOrders, updateRentalOrder, RentalOrder, RentalStatus } from '@/lib/rental-orders';

const STATUS_LABELS: Record<RentalStatus, string> = {
  pending_validation: 'En attente',
  validated: 'Validée',
  shipped: 'Expédiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<RentalStatus, string> = {
  pending_validation: 'bg-amber-100 text-amber-700',
  validated: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminBoutiqueLocationPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all');

  useEffect(() => {
    getRentalOrders().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.productName.toLowerCase().includes(q) || o.renterCompany.toLowerCase().includes(q) || o.renterEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
  const activeCount = orders.filter(o => o.status === 'pending_validation' || o.status === 'validated' || o.status === 'shipped').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  const handleStatusChange = async (id: string, status: RentalStatus) => {
    await updateRentalOrder(id, { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-10 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={18} className="text-blue-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total locations</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag size={18} className="text-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">CA Location</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalRevenue.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={18} className="text-amber-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Actives</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Terminées</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{completedCount}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher client, produit..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200/70 rounded-xl text-xs font-semibold outline-none focus:border-gray-400 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'pending_validation', 'validated', 'shipped', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Produit</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Dates</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-right px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Aucune location trouvée
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{order.renterCompany}</div>
                    <div className="text-gray-400 mt-0.5">{order.renterEmail}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{order.productName}</div>
                    <div className="text-gray-400 mt-0.5">×{order.quantity}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-700">
                      {new Date(order.rentalStartDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-gray-400 mt-0.5">
                      → {new Date(order.rentalEndDate).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {order.amountPaid.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <select
                      value={order.status}
                      onChange={e => order.id && handleStatusChange(order.id, e.target.value as RentalStatus)}
                      className="text-[10px] font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400 cursor-pointer"
                    >
                      <option value="pending_validation">En attente</option>
                      <option value="validated">Valider</option>
                      <option value="shipped">Expédier</option>
                      <option value="completed">Terminer</option>
                      <option value="cancelled">Annuler</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Créer la page de redirection Vente**

Create `src/app/admin/boutique/vente/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function VenteRedirect() {
  redirect('/admin/produits');
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/boutique/
git commit -m "feat(admin): add rental location dashboard with stats and status management"
```

---

## Self-Review

- [ ] Tous les appels `addItem` existants dans `panier/page.tsx` et `produit/[id]/page.tsx` sont mis à jour avec `type: 'purchase'`
- [ ] `CartContext.removeItem` gère le filtre par type pour éviter les conflits Achat/Location même produit
- [ ] `capture-order/route.ts` crée les `rental_orders` après succès PayPal, sinon la commande PayPal seule est créée
- [ ] Le dashboard admin lit depuis `rental_orders` (collection Firestore) — pas de conflit avec `quote-requests`
- [ ] Pas de récréation de composants existants (`SignaturePad`, `ContractDocument` sont réutilisés)
- [ ] Tous les chemins de fichiers sont corrects
- [ ] Pas de placeholder/TODO
