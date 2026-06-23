'use server';

import bcrypt from 'bcryptjs';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function updateCustomerProfile(
  customerId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminDb } = getFirebaseAdmin();

    const fields: Record<string, string> = {};
    const allowedFields = [
      'displayName', 'phone',
      'companyName', 'companyAddress', 'country', 'city', 'state', 'zipCode',
      'officePhone', 'companyEmail', 'position', 'employees', 'website', 'fax',
    ];

    for (const field of allowedFields) {
      const value = formData.get(field);
      if (typeof value === 'string') {
        fields[field] = value;
      }
    }

    await adminDb.collection('customers').doc(customerId).update({
      ...fields,
      profileUpdatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('updateCustomerProfile error:', error);
    return { success: false, error: error.message || 'Erreur lors de la mise à jour du profil' };
  }
}

export async function setPassword(
  customerId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }

    const { adminDb } = getFirebaseAdmin();
    const customerSnap = await adminDb.collection('customers').doc(customerId).get();
    if (!customerSnap.exists) {
      return { success: false, error: 'Compte introuvable.' };
    }

    const customer = customerSnap.data()!;
    const existingHash = customer.passwordHash || null;

    // If a password is already set, verify the current one
    if (existingHash) {
      const valid = await bcrypt.compare(currentPassword, existingHash);
      if (!valid) {
        return { success: false, error: 'Mot de passe actuel incorrect.' };
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await adminDb.collection('customers').doc(customerId).update({
      passwordHash: newHash,
      passwordUpdatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('setPassword error:', error);
    return { success: false, error: error.message || 'Erreur lors du changement de mot de passe' };
  }
}
