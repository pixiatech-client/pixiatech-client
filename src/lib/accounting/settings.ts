import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AccountingSettings } from './types';

export const ACCOUNTING_SETTINGS_DOC = 'settings';
export const ACCOUNTING_SETTINGS_ID = 'accounting';

const DEFAULT_SETTINGS: AccountingSettings = {
  enabled: false,
  provider: 'pennylane',
  invoiceTrigger: 'manual',
};

export async function getAccountingSettings(): Promise<AccountingSettings> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection(ACCOUNTING_SETTINGS_DOC).doc(ACCOUNTING_SETTINGS_ID).get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    const data = (snap.data() || {}) as Partial<AccountingSettings>;
    return {
      enabled:
        typeof data.enabled === 'boolean' ? data.enabled : DEFAULT_SETTINGS.enabled,
      provider:
        typeof data.provider === 'string' && data.provider.length > 0
          ? data.provider
          : DEFAULT_SETTINGS.provider,
      invoiceTrigger:
        data.invoiceTrigger === 'payment' ||
        data.invoiceTrigger === 'delivery' ||
        data.invoiceTrigger === 'withdrawal_period_end' ||
        data.invoiceTrigger === 'manual'
          ? data.invoiceTrigger
          : DEFAULT_SETTINGS.invoiceTrigger,
    };
  } catch (err) {
    console.error('[Accounting] Failed to read accounting settings:', err);
    return DEFAULT_SETTINGS;
  }
}