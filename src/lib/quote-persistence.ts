'use client';

const STORAGE_KEY = 'pixiatech_quote_v3';

export interface QuotePersistedState {
  configuredProducts: any[];
  activeConfigProductId: string | null;
  baseQuote: number;
  includeInstallation: boolean;
  deliveryCost: number;
  selectedCityId: string | null;
  unconfiguredCityQuery: string | undefined;
  isDeliveryCostFinal: boolean;
  installationCost: number;
  techniciansRequired: number;
  includeDelivery: boolean;
  activeMode: 'selection' | 'wizard' | 'manual';
  initialWizardStep: number;
  isSubmitting: boolean;
  isSignatureFlowActive: boolean;
  currentStep: number;
}

const DEFAULT_STATE: QuotePersistedState = {
  configuredProducts: [],
  activeConfigProductId: null,
  baseQuote: 0,
  includeInstallation: true,
  deliveryCost: 0,
  selectedCityId: null,
  unconfiguredCityQuery: undefined,
  isDeliveryCostFinal: false,
  installationCost: 0,
  techniciansRequired: 0,
  includeDelivery: true,
  activeMode: 'selection',
  initialWizardStep: 1,
  isSubmitting: false,
  isSignatureFlowActive: false,
  currentStep: 1,
};

export function saveQuoteState(state: Partial<QuotePersistedState>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadQuoteState();
    const merged = { ...DEFAULT_STATE, ...existing, ...state };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export function loadQuoteState(): QuotePersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearQuoteState(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export { STEP_ROUTES, ROUTE_STEP_MAP, VALID_STEPS } from './quote-routes';
