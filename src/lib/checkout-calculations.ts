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
  const { subtotal, totalAfterDiscount, deliveryCost, profileType, country, vatValidated, vatRate = 20 } = input;
  const customerType = getCustomerType(profileType, country, vatValidated);

  let vat: number;
  let totalLabel: string;
  let vatLabel: string;

  if (customerType === 'particulier' || customerType === 'entreprise_france') {
    vat = Math.round(totalAfterDiscount * vatRate / 100);
    totalLabel = 'Total TTC';
    vatLabel = `TVA (${vatRate}%)`;
  } else {
    vat = 0;
    totalLabel = 'Total HT';
    vatLabel = 'TVA (0%) — Autoliquidée';
  }

  const total = totalAfterDiscount + vat + deliveryCost;

  return { customerType, vatRate, vat, total, totalLabel, vatLabel };
}
