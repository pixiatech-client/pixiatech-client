export type CustomerType = 'particulier' | 'entreprise_france' | 'entreprise_ue';

export type ProfileType = 'entreprise' | 'particulier' | null;

export function getCustomerType(
  profileType: ProfileType,
  country: string,
  vatValidated: boolean
): CustomerType {
  if (profileType !== 'entreprise') return 'particulier';
  if (country === 'FR') return 'entreprise_france';
  if (vatValidated) return 'entreprise_ue';
  return 'entreprise_france';
}

export interface CheckoutInput {
  subtotal: number;
  totalAfterDiscount: number;
  deliveryCost: number;
  profileType: ProfileType;
  country: string;
  vatValidated: boolean;
  vatNumber?: string;
  vatRate?: number;
}

export interface CheckoutResult {
  customerType: CustomerType;
  vatRate: number;
  vat: number;
  total: number;
  totalLabel: string;
  vatLabel: string;
}

export function calculateCheckout(input: CheckoutInput): CheckoutResult {
  const { subtotal, totalAfterDiscount, deliveryCost, profileType, country, vatValidated, vatNumber, vatRate = 19 } = input;
  const customerType = getCustomerType(profileType, country, vatValidated);

  // Règle métier UNIQUE : la TVA n'est autoliquidée (0%) que si le profil est
  // professionnel ET que la TVA a été validée ET qu'un numéro de TVA est présent.
  // Dans tous les autres cas (particulier, entreprise non validée, invité), la TVA
  // s'applique au taux normal.
  const hasVatExemption = vatValidated === true && typeof vatNumber === 'string' && vatNumber.trim() !== '';

  let vat: number;
  let totalLabel: string;
  let vatLabel: string;
  let effectiveRate: number;

  if (hasVatExemption) {
    vat = 0;
    totalLabel = 'TOTAL TTC';
    vatLabel = 'TVA (0%) — Autoliquidée';
    effectiveRate = 0;
  } else {
    vat = Math.round(totalAfterDiscount * vatRate / 100);
    totalLabel = 'TOTAL TTC';
    vatLabel = `TVA (${vatRate}%)`;
    effectiveRate = vatRate;
  }

  const total = totalAfterDiscount + vat + deliveryCost;

  return { customerType, vatRate: effectiveRate, vat, total, totalLabel, vatLabel };
}
