
'use server';

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import type { DocumentReference, DocumentSnapshot, Firestore, Query } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import nodemailer from 'nodemailer';
import { buildSupplierEmailHtml } from '@/lib/email-templates';

import type { Product, Settings, DeliverySettings, LaborSettings, PdfSettings, ProductSpec, QuoteRequest, City, Locations, UserProfile, Theme, QuoteHistoryEntry, UserRole, QuoteDetails, WizardSettings, ActivityLogEntry } from '@/lib/types';
import { DEFAULT_PALETTES } from '@/lib/color-palettes';
import { DocumentData, Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import fr from '@/lib/locales/fr.json';
import en from '@/lib/locales/en.json';
import { getQuoteStats, updateStatsOnStatusChange, updateStatsOnDelete, resyncStats } from '@/lib/statsService';
import { getSmtpSettings as getSmtpSettingsDb, updateSmtpSettings as updateSmtpSettingsDb, getSmtpTransport } from '@/lib/smtpService';

type Locale = 'fr' | 'en';
const translations = { fr, en };

// --- Firestore Document IDs for Settings ---
const SETTINGS_DOC_ID = 'main';
const DELIVERY_DOC_ID = 'delivery';
const LABOR_DOC_ID = 'labor';
const PDF_SETTINGS_DOC_ID = 'pdf';
const WIZARD_SETTINGS_DOC_ID = 'wizard';

// --- In-memory TTL caches (shared across calls within the same server process) ---
let _settingsCache: { data: Settings; timestamp: number } | null = null;
const SETTINGS_CACHE_TTL_MS = 30_000; // 30 seconds

let _themesCache: { data: Theme[]; timestamp: number } | null = null;
const THEMES_CACHE_TTL_MS = 120_000; // 2 minutes

// --- Session Actions ---

export async function createSession(idToken: string) {
  console.log('[Session Action] Starting session creation...');
  const { adminAuth, adminDb } = getFirebaseAdmin();
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const settings = await getSettings();
    const isSingleSession = settings?.isSingleSessionEnabled ?? false;

    // Generate unique session token
    const sessionToken =
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

    // Store session token on user document
    if (adminDb) {
      await adminDb.collection('users').doc(uid).set(
        {
          sessionToken,
          sessionCreatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    console.log('[Session Action] Creating session cookie...');
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('[Session Action] Session cookie created successfully.');

    const isSecure = process.env.NODE_ENV === 'production';

    (await cookies()).set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: isSecure,
      path: '/',
      sameSite: 'lax',
    });

    // Set sessionToken cookie (httpOnly so only server can read)
    (await cookies()).set('sessionToken', sessionToken, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: isSecure,
      path: '/',
      sameSite: 'lax',
    });

    console.log('[Session Action] Session token stored and cookies set.');

    return { success: true, sessionToken };
  } catch (error: any) {
    console.error('[Session Action] Error creating session:', error);
    return { success: false, error: 'Failed to create session: ' + error.message };
  }
}

export async function checkUserStatus(uid: string) {
  console.log('[checkUserStatus Action] Verifying status for UID:', uid);
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error('[checkUserStatus Action] adminDb is not initialized');
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.warn('[checkUserStatus Action] User document NOT FOUND for UID:', uid);
      return { success: false, error: 'Account not found.' };
    }
    const userData = userDoc.data();
    console.log('[checkUserStatus Action] User status found:', userData?.status || 'pending');
    return { success: true, status: userData?.status || 'pending' };
  } catch (error: any) {
    console.error('[checkUserStatus Action] Error reading user document:', error);
    return { success: false, error: error.message };
  }
}

export async function logout() {
  const { adminAuth } = getFirebaseAdmin();
  const sessionCookie = (await cookies()).get('session')?.value;
  if (sessionCookie && adminAuth) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      if (!decodedClaims.original_admin_uid) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      }
    } catch (error) {
      // Ignore errors
    }
  }
  (await cookies()).delete('session');
  (await cookies()).delete('sessionToken');
  redirect('/admin/login');
}

/** Clear stale session cookie without revoking tokens or redirecting.
 *  Used by the layout guard to break cookie/Firebase mismatch loops. */
export async function clearSession() {
  (await cookies()).delete('session');
  (await cookies()).delete('sessionToken');
}

export async function revertImpersonation() {
  const { adminAuth } = getFirebaseAdmin();
  const sessionCookie = (await cookies()).get('session')?.value;

  if (!sessionCookie) return { success: false, error: "No active session." };

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const originalAdminUid = decodedClaims.original_admin_uid;

    if (!originalAdminUid) {
      return { success: false, error: "This is not an impersonation session." };
    }

    const idToken = await adminAuth.createCustomToken(originalAdminUid);
    return { success: true, token: idToken };

  } catch (error: any) {
    console.error("Revert impersonation error:", error);
    return { success: false, error: error.message };
  }
}


// --- Auth Actions ---

// Role to default avatar mapping
const DEFAULT_ROLE_AVATAR_MAP: Record<string, string> = {
  admin: '/bot-avatars/Admin.png',
  commercial: '/bot-avatars/Commercial.png',
  fournisseur: '/bot-avatars/Fournisseur.png',
};

function getDefaultAvatarForRole(role: string): string | null {
  return DEFAULT_ROLE_AVATAR_MAP[role] || null;
}

function isDefaultAvatar(photoURL: string): boolean {
  return Object.values(DEFAULT_ROLE_AVATAR_MAP).includes(photoURL);
}

async function ensureDefaultRoles() {
  const { adminDb } = getFirebaseAdmin();
  const rolesRef = adminDb.collection('roles');
  const rolesToEnsure = [
    { id: 'admin', name: 'Admin', color: '#ef4444', isDefault: true },
    { id: 'commercial', name: 'Commercial', color: '#3b82f6', isDefault: true },
    { id: 'fournisseur', name: 'Fournisseur', color: '#f97316', isDefault: true },
  ];

  const batch = adminDb.batch();
  const rolesSnapshot = await rolesRef.get();
  const existingRoles = new Set(rolesSnapshot.docs.map(doc => doc.id));

  let rolesCreated = false;
  rolesToEnsure.forEach(role => {
    if (!existingRoles.has(role.id)) {
      const roleRef = rolesRef.doc(role.id);
      batch.set(roleRef, { name: role.name, color: role.color, isDefault: role.isDefault });
      rolesCreated = true;
    }
  });

  if (rolesCreated) {
    await batch.commit();
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  phone: z.string().min(1, 'Phone is required'),
  description: z.string().optional(),
});

function formatPhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;

  const digitsOnly = phone.replace(/\\s/g, '');

  // If it's a French number starting with 0, replace with +33
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `+33${digitsOnly.substring(1)}`;
  }

  // If it already seems to be in E.164 format, return as is
  if (digitsOnly.startsWith('+')) {
    return digitsOnly;
  }

  // For other cases, you might want to return as is or handle differently
  // For now, we return it, but Firebase might reject it if not E.164
  return phone;
}

export async function registerUser(data: unknown) {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid data." };
  }

  const { email, password, displayName, phone } = result.data;
  const { adminAuth, adminDb, FieldValue } = getFirebaseAdmin();

  if (!adminAuth || !adminDb) {
    return { success: false, error: 'Service unavailable.' };
  }

  let userRecord;
  try {
    // Ensure default roles are present before creating a user
    await ensureDefaultRoles();

    // Check if user already exists in Auth
    try {
      await adminAuth.getUserByEmail(email);
      return { success: false, error: 'A user with this email already exists.' };
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Check if phone number already exists in Auth
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      try {
        await adminAuth.getUserByPhoneNumber(formattedPhone);
        return { success: false, error: 'A user with this phone number already exists.' };
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }
    }

    const defaultRole = await getDefaultRole();

    // First registered user automatically becomes admin
    const usersSnapshot = await adminDb.collection('users').limit(1).get();
    const isFirstUser = usersSnapshot.empty;
    const assignedRole = isFirstUser ? 'admin' : defaultRole.id;
    const status = isFirstUser ? 'approved' : 'pending';

    const formattedPhone = formatPhoneNumber(phone);
    console.log('[Register Action] Formatted phone:', formattedPhone);

    console.log('[Register Action] Creating user in Auth...');
    userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: formattedPhone,
      emailVerified: false,
      disabled: false,
    });
    console.log('[Register Action] User created in Auth with UID:', userRecord.uid);

    // Set custom claim
    console.log('[Register Action] Setting custom claims (role:', assignedRole, ')...');
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: assignedRole });
    console.log('[Register Action] Custom claims set.');

    const userProfile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
      uid: userRecord.uid,
      email,
      displayName,
      phone: phone || '',
      description: result.data.description || '',
      photoURL: getDefaultAvatarForRole(assignedRole) || '',
      role: assignedRole,
      status: status as 'pending' | 'approved',
      createdAt: FieldValue.serverTimestamp(),
    };

    console.log('[Register Action] Writing user profile to Firestore...');
    await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
    console.log('[Register Action] Firestore profile write SUCCESS.');

    // Notify admin users about new registration
    if (status === 'pending') {
      const adminsSnap = await adminDb.collection('users')
        .where('role', '==', 'admin')
        .where('status', '==', 'approved')
        .get();
      if (!adminsSnap.empty) {
        const notifBatch = adminDb.batch();
        adminsSnap.forEach(doc => {
          const notifRef = adminDb.collection('notifications').doc();
          notifBatch.set(notifRef, {
            userId: doc.id,
            type: 'user',
            title: 'Nouvel utilisateur inscrit',
            description: `${displayName} (${email}) a créé un compte et est en attente d'approbation.`,
            href: '/admin/users',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        await notifBatch.commit();
      }
    }

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error during user registration:", error);
    // Attempt to delete the auth user if the DB write fails
    if (userRecord) {
      await adminAuth.deleteUser(userRecord.uid);
    }

    if (error.code === 'auth/invalid-phone-number') {
      return { success: false, error: "The phone number format is invalid. Please use an international format (e.g., +33612345678)." };
    }

    return { success: false, error: error.message || "An error occurred during registration." };
  }
}

const googleSignInSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
});

export async function handleGoogleSignIn(data: unknown) {
  const result = googleSignInSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: 'Invalid data' };
  }

  const { uid, email, displayName, photoURL } = result.data;
  const { adminDb, adminAuth, FieldValue } = getFirebaseAdmin();

  if (!adminDb || !adminAuth) {
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    console.log('[Google Auth Action] Checking Firestore for user UID:', uid);
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (userDoc.exists) {
      console.log('[Google Auth Action] Existing user found.');
      const userData = userDoc.data();
      return {
        success: true,
        status: userData?.status || 'pending',
        isNew: false,
        userData: {
          uid,
          email: userData?.email || email,
          displayName: userData?.displayName || displayName,
          phone: userData?.phone || '',
          photoURL: userData?.photoURL || photoURL,
          role: userData?.role,
        }
      };
    }

    console.log('[Google Auth Action] New user detected, creating profile...');
    const defaultRole = await getDefaultRole();

    // First registered user automatically becomes admin
    const usersSnapshot = await adminDb.collection('users').limit(1).get();
    const isFirstUser = usersSnapshot.empty;
    const assignedRole = isFirstUser ? 'admin' : defaultRole.id;
    const assignedStatus = isFirstUser ? 'approved' : 'pending';

    const userProfile = {
      uid,
      email,
      displayName: displayName || '',
      phone: '',
      photoURL: photoURL || getDefaultAvatarForRole(assignedRole) || '',
      role: assignedRole,
      status: assignedStatus,
      createdAt: new Date(),
    };

    console.log('[Google Auth Action] Writing user profile to Firestore (role:', assignedRole, ')...');
    await adminDb.collection('users').doc(uid).set(userProfile);

    // Notify admin users about new registration
    if (assignedStatus === 'pending') {
      const adminsSnap = await adminDb.collection('users')
        .where('role', '==', 'admin')
        .where('status', '==', 'approved')
        .get();
      if (!adminsSnap.empty) {
        const notifBatch = adminDb.batch();
        adminsSnap.forEach(doc => {
          const notifRef = adminDb.collection('notifications').doc();
          notifBatch.set(notifRef, {
            userId: doc.id,
            type: 'user',
            title: 'Nouvel utilisateur inscrit',
            description: `${displayName || email} (${email}) a créé un compte et est en attente d'approbation.`,
            href: '/admin/users',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        await notifBatch.commit();
      }
    }

    console.log('[Google Auth Action] Setting custom claims...');
    await adminAuth.setCustomUserClaims(uid, { role: assignedRole });
    console.log('[Google Auth Action] Google Sign-in SUCCESS.');

    return {
      success: true,
      status: assignedStatus,
      isNew: true,
      userData: userProfile
    };
  } catch (error: any) {
    console.error('Google sign-in handler error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateGoogleUserProfile(data: unknown) {
  const schema = z.object({
    uid: z.string(),
    displayName: z.string().min(1),
    phone: z.string().optional(),
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: 'Invalid data' };
  }

  const { uid, displayName, phone } = result.data;
  const { adminDb } = getFirebaseAdmin();

  if (!adminDb) {
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    await adminDb.collection('users').doc(uid).update({
      displayName,
      phone: phone || '',
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const updateUserSchema = z.object({
  uid: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  photoURL: z.string().optional(),
  backgroundImage: z.string().optional(),
  role: z.string().optional(),
  roleTemplate: z.string().optional(),
  status: z.enum(['pending', 'approved', 'suspended']).optional(),
  themeSettings: z.any().optional(),
});

export async function updateUser(data: unknown) {
  const result = updateUserSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: 'Invalid data' };
  }

  const { uid, ...updateData } = result.data;
  const { adminDb, adminAuth } = getFirebaseAdmin();

  if (!adminDb || !adminAuth) {
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    // Prepare payload for Firebase Auth update
    const authPayload: { [key: string]: any } = {};
    if (updateData.email) authPayload.email = updateData.email;
    if (updateData.displayName) authPayload.displayName = updateData.displayName;
    if (updateData.phone) authPayload.phone = updateData.phone;
    // Only pass photoURL to Firebase Auth if it's a valid URL (Firebase Auth requires this)
    if (updateData.photoURL) {
      try {
        new URL(updateData.photoURL);
        authPayload.photoURL = updateData.photoURL;
      } catch {
        // Not a valid URL — save to Firestore only, skip Firebase Auth
      }
    } else if (updateData.photoURL === '') {
      authPayload.photoURL = null;
    }

    // Update Firebase Auth if there are changes
    if (Object.keys(authPayload).length > 0) {
      await adminAuth.updateUser(uid, authPayload);
    }

    // If role is provided, check if it's actually changing before revoking sessions
    if (updateData.role) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        const currentRole = userRecord.customClaims?.role;
        if (currentRole !== updateData.role) {
          await adminAuth.setCustomUserClaims(uid, { role: updateData.role });
          await adminAuth.revokeRefreshTokens(uid);

          // Update default avatar when role changes, unless a custom URL was explicitly provided
          const incomingPhotoURL = 'photoURL' in updateData ? updateData.photoURL : undefined;
          if (!incomingPhotoURL || isDefaultAvatar(incomingPhotoURL)) {
            const newAvatar = getDefaultAvatarForRole(updateData.role);
            if (newAvatar) {
              updateData.photoURL = newAvatar;
            }
          }
        }
      } catch {
        // If we can't fetch the user, still try to update claims
        await adminAuth.setCustomUserClaims(uid, { role: updateData.role });
        await adminAuth.revokeRefreshTokens(uid);
      }
    }

    // Update Firestore document
    await adminDb.collection('users').doc(uid).update(updateData);

    revalidatePath('/admin/users');
    revalidatePath('/admin', 'layout');

    logAdminActivity({
      action: 'Mise à jour utilisateur',
      category: 'user',
      details: `Modification de l'utilisateur ${updateData.displayName || uid}`,
      targetId: uid,
      targetName: updateData.displayName || '',
    });
    return { success: true, photoURL: updateData.photoURL };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}

const customRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  roleTemplate: z.enum(['admin', 'fournisseur', 'commercial']),
  color: z.string().min(4),
});

export async function createCustomRole(data: unknown) {
  const result = customRoleSchema.safeParse(data);
  if (!result.success) return { success: false, error: 'Invalid data' };

  const { name, roleTemplate, color } = result.data;
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Service unavailable.' };

  try {
    const roleId = `role_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    
    await adminDb.collection('roles').doc(roleId).set({
      name,
      roleTemplate,
      color,
      isDefault: false,
      createdAt: new Date(),
    });

    return { success: true, roleId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomRole(roleId: string, data: unknown) {
  const result = customRoleSchema.safeParse(data);
  if (!result.success) return { success: false, error: 'Invalid data' };

  const { name, color } = result.data; // Only allow updating name and color
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Service unavailable.' };

  try {
    const roleRef = adminDb.collection('roles').doc(roleId);
    const docSnap = await roleRef.get();
    
    if (!docSnap.exists) return { success: false, error: 'Role not found' };
    if (docSnap.data()?.isDefault) return { success: false, error: 'Cannot modify a default role' };

    await roleRef.update({ name, color, updatedAt: new Date() });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomRole(roleId: string) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Service unavailable.' };

  try {
    const roleRef = adminDb.collection('roles').doc(roleId);
    const docSnap = await roleRef.get();

    if (!docSnap.exists) return { success: false, error: 'Role not found' };
    if (docSnap.data()?.isDefault) return { success: false, error: 'Cannot delete a default role' };

    const roleData = docSnap.data()!;
    // Fall back to the base template this role was cloned from, then 'commercial' as last resort
    const fallbackRoleId: string = roleData.roleTemplate || 'commercial';

    // Migrate all users with this role to the fallback role
    const usersWithRole = await adminDb.collection('users').where('role', '==', roleId).get();
    if (!usersWithRole.empty) {
      const batch = adminDb.batch();
      usersWithRole.docs.forEach(doc => {
        batch.update(doc.ref, { role: fallbackRoleId, roleTemplate: fallbackRoleId });
      });
      await batch.commit();
    }

    await roleRef.delete();
    return { success: true, migratedCount: usersWithRole.size };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const passwordSchema = z.object({
  uid: z.string(),
  password: z.string().min(6),
});

export async function updatePassword(data: unknown) {
  const result = passwordSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: 'Invalid password.' };
  }

  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) {
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    await adminAuth.updateUser(result.data.uid, { password: result.data.password });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUsers(uids: string[]) {
  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    await adminAuth.deleteUsers(uids);

    const batch = adminDb.batch();
    uids.forEach(uid => {
      const docRef = adminDb.collection('users').doc(uid);
      batch.delete(docRef);
    });
    await batch.commit();

    logAdminActivity({
      action: 'Suppression utilisateurs',
      category: 'user',
      details: `Suppression de ${uids.length} utilisateur(s)`,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting users:', error);
    return { success: false, error: error.message };
  }
}


export async function deleteAllUsersAndData() {
  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return { success: false, error: "Admin SDK not initialized" };
  }

  // Security: Only admins can delete all data
  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only administrators can reset the database.' };
  }

  try {
    // Delete all users from Auth
    const listUsersResult = await adminAuth.listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(u => u.uid);
    if (uidsToDelete.length > 0) {
      await adminAuth.deleteUsers(uidsToDelete);
    }

    // Delete all documents from 'users' collection
    const usersSnapshot = await adminDb.collection('users').get();
    if (!usersSnapshot.empty) {
      const batch = adminDb.batch();
      usersSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete all documents from 'roles' collection
    const rolesSnapshot = await adminDb.collection('roles').get();
    if (!rolesSnapshot.empty) {
      const batch = adminDb.batch();
      rolesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete all documents from 'quotes' collection
    const quotesSnapshot = await adminDb.collection('quotes').get();
    if (!quotesSnapshot.empty) {
      const batch = adminDb.batch();
      quotesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Clear session cookie
    (await cookies()).delete('session');

    return { success: true, message: "All data (users, roles, estimates) has been deleted. The page will refresh." };

  } catch (error: any) {
    console.error("Error resetting database:", error);
    return { success: false, error: error.message };
  }
}

export async function cleanupAnonymousUsers() {
  const { adminAuth, adminDb, app } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return { success: false, error: "Admin SDK not initialized" };
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const listResult = await adminAuth.listUsers(1000);
    const anonymousUids = listResult.users
      .filter(u => u.providerData.length === 0 || u.providerData.some(p => p.providerId === 'anonymous'))
      .map(u => u.uid);

    if (anonymousUids.length === 0) {
      return { success: true, deleted: 0, message: 'Aucun compte anonyme trouvé.' };
    }

    let firestoreDeletes = 0;
    let storageDeletes = 0;
    const bucket = getStorage(app).bucket();

    for (const uid of anonymousUids) {
      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        await userRef.delete();
        firestoreDeletes++;
      }

      const notifsSnap = await adminDb.collection('notifications').where('userId', '==', uid).get();
      if (!notifsSnap.empty) {
        const batch = adminDb.batch();
        notifsSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        firestoreDeletes += notifsSnap.size;
      }

      const chatsSnap = await adminDb.collection('chats').where('participants', 'array-contains', uid).get();
      for (const chatDoc of chatsSnap.docs) {
        const chatId = chatDoc.id;

        const messagesSnap = await adminDb.collection('chats').doc(chatId).collection('messages').get();
        if (!messagesSnap.empty) {
          const batch = adminDb.batch();
          messagesSnap.docs.forEach(m => batch.delete(m.ref));
          await batch.commit();
          firestoreDeletes += messagesSnap.size;
        }

        try {
          const [files] = await bucket.getFiles({ prefix: `chats/${chatId}/` });
          if (files.length > 0) {
            await Promise.all(files.map(f => f.delete()));
            storageDeletes += files.length;
          }
        } catch (e) {
          console.warn(`[cleanup] Storage error for chat ${chatId}:`, e);
        }

        await chatDoc.ref.delete();
        firestoreDeletes++;
      }
    }

    await adminAuth.deleteUsers(anonymousUids);

    return {
      success: true,
      deleted: anonymousUids.length,
      firestoreDeletes,
      storageDeletes,
      message: `${anonymousUids.length} compte(s) anonyme(s) supprimé(s).`
    };
  } catch (error: any) {
    console.error('Error cleaning up anonymous users:', error);
    return { success: false, error: error.message };
  }
}


export async function getUsers({
  limit = 6,
  startAfterId = null,
  searchTerm = '',
  userStatus = null,
}: {
  limit?: number;
  startAfterId?: string | null;
  searchTerm?: string;
  userStatus?: 'pending' | 'approved' | null;
}): Promise<{ users: UserProfile[]; lastId: string | null, totalCount: number }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    throw new Error("Admin SDK not initialized");
  }

  try {
    console.log('[getUsers Action] Fetching users with params:', { limit, startAfterId, searchTerm, userStatus });
    let query: Query = adminDb.collection('users');
    let countQuery: Query = adminDb.collection('users');

    if (userStatus) {
      query = query.where('status', '==', userStatus);
      countQuery = countQuery.where('status', '==', userStatus);
    }

    if (searchTerm) {
      const endTerm = searchTerm.slice(0, -1) + String.fromCharCode(searchTerm.charCodeAt(searchTerm.length - 1) + 1);
      query = query.where('displayName', '>=', searchTerm).where('displayName', '<', endTerm);
    }

    const totalSnapshot = await countQuery.count().get();
    const totalCount = totalSnapshot.data().count;
    console.log('[getUsers Action] Total count in DB:', totalCount);

    const snapshot = await query.get();
    console.log('[getUsers Action] Snapshot size:', snapshot.size);

    if (snapshot.empty) {
      return { users: [], lastId: null, totalCount: 0 };
    }

    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      const plainObject = JSON.parse(JSON.stringify(data, (key, value) => {
        if (key === 'createdAt' && value && typeof value === 'object' && '_seconds' in value) {
          const ts = new Timestamp(value._seconds, value._nanoseconds);
          return ts.toDate().toISOString();
        }
        return value;
      }));
      return { ...plainObject, uid: doc.id } as UserProfile;
    });

    console.log('[getUsers Action] Mapped users count:', users.length);

    // Sort in memory (newest first, fallback to 0 if missing)
    users.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      users = users.filter(user =>
        user.displayName?.toLowerCase().includes(lowercasedTerm) ||
        user.email.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply pagination slice in memory based on startAfterId
    let startIndex = 0;
    if (startAfterId && !searchTerm) {
      const idx = users.findIndex(u => u.uid === startAfterId);
      if (idx !== -1) startIndex = idx + 1;
    }

    const paginatedUsers = users.slice(startIndex, startIndex + limit);
    const lastId = paginatedUsers.length > 0 && !searchTerm ? paginatedUsers[paginatedUsers.length - 1].uid : null;

    console.log('[getUsers Action] Returning paginated users:', paginatedUsers.length);
    return { users: paginatedUsers, lastId, totalCount };

  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [], lastId: null, totalCount: 0 };
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return null;

  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) return null;

  const data = userSnap.data() as DocumentData;

  return {
    uid: userSnap.id,
    ...data,
    createdAt: data.createdAt.toDate().toISOString(),
  } as UserProfile;
}

export async function getUserRole(sessionCookie: string): Promise<string | null> {
  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) return null;
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.role || null;
  } catch (error) {
    return null;
  }
}

async function getDefaultRole(): Promise<UserRole> {
  const { adminDb } = getFirebaseAdmin();
  const rolesRef = adminDb.collection('roles');
  const snapshot = await rolesRef.where('isDefault', '==', true).limit(1).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserRole;
  }

  // This should ideally not be reached if the database is seeded correctly.
  // If it is, we create a default "Commercial" role.
  const commercialRoleRef = rolesRef.doc('commercial');
  const commercialRole: Omit<UserRole, 'id'> = { name: 'Commercial', color: '#3b82f6', isDefault: true };
  await commercialRoleRef.set(commercialRole);
  return { id: 'commercial', ...commercialRole };
}

export async function resetPerformancePoints() {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role !== 'admin') {
    throw new Error('Unauthorized: Only administrators can reset performance.');
  }

  try {
    await adminDb.collection('settings').doc(SETTINGS_DOC_ID).set({
      performanceResetAt: FieldValue.serverTimestamp()
    }, { merge: true });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting performance:', error);
    return { success: false, error: error.message };
  }
}

export async function resetConfiguratorStats() {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role !== 'admin') {
    throw new Error('Unauthorized: Only administrators can reset stats.');
  }

  try {
    await adminDb.collection('settings').doc(SETTINGS_DOC_ID).set({
      configuratorStatsResetAt: FieldValue.serverTimestamp()
    }, { merge: true });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting configurator stats:', error);
    return { success: false, error: error.message };
  }
}



// --- Quote Actions ---
// --- File Sync Action ---
export async function syncFileFromUrl(url: string, destinationPath: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    const { app } = getFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    const file = bucket.file(destinationPath);

    await file.save(fileBuffer, {
      metadata: { contentType },
      public: true,
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media`;

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error syncing file:', error);
    return { success: false, error: error.message };
  }
}

function translateStatus(status: 'pending' | 'processed' | 'trashed' | 'in_progress' | 'sent' | string) {
  switch (status) {
    case 'pending':
      return 'en attente';
    case 'processed':
      return 'processed';
    case 'trashed':
      return 'moved to trash';
    case 'in_progress':
      return 'in progress';
    case 'sent':
      return 'sent';
    default:
      return status;
  }
}

// --- Quote Request Actions (Admin) ---
export async function getQuoteRequest(id: string): Promise<QuoteRequest | null> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("Firestore is not initialized.");
    return null;
  }
  try {
    const quoteRef = adminDb.collection('quotes').doc(id);
    const docSnap = await quoteRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const currentUser = await getCurrentAdminUser();
    
    // Security check for suppliers
    if (currentUser && !('error' in currentUser) && currentUser.role === 'fournisseur') {
      const quoteData = docSnap.data();
      if (quoteData?.supplierId !== currentUser.uid) {
        throw new Error("Unauthorized: You do not have access to this quote.");
      }
    }

    // Public user check (not logged in as admin/commercial/etc.)
    if (!currentUser) {
      const generalSettings = await getSettings();
      const quoteData = docSnap.data();
      // No more blocking throw here, we'll handle verification status on the frontend
      // to allow background PDF generation.
    }

    return processQuoteSnapshot(docSnap);

  } catch (error: any) {
    console.error("Error fetching quote with admin SDK:", error);
    return null;
  }
}

async function processQuoteSnapshot(docSnap: DocumentSnapshot): Promise<QuoteRequest | null> {
  const data = docSnap.data();
  if (!data) return null;

  const [laborSettings, deliverySettings] = await Promise.all([
    getLaborSettings(),
    getDeliverySettings()
  ]);

  const productsRaw = data.products || data.quoteDetails?.products || [];
  const totalArea = productsRaw.reduce((sum: number, p: any) => sum + ((p.width || 0) * (p.height || 0) * (p.quantity || 1)), 0);
  const applicableLaborRule = laborSettings.rules
    .slice()
    .sort((a, b) => b.minSqM - a.minSqM)
    .find(rule => totalArea >= rule.minSqM);

  const installationCost = data.includeInstallation ? (applicableLaborRule?.price || 0) : 0;

  let deliveryCost = 0;
  if (data.includeDelivery) {
    deliveryCost = deliverySettings.defaultFee;
  }

  const structuredQuote: QuoteRequest = {
    id: docSnap.id,
    number: data.number || `EST-${docSnap.id.substring(0,6).toUpperCase()}`,
    client: {
      companyName: data.client?.companyName || data.companyName || '',
      email: data.client?.email || data.email || '',
      phone: data.client?.phone || data.phone || '',
      address: data.client?.address || data.address || '',
      notes: data.client?.notes || data.notes || '',
      sitePhoto: data.client?.sitePhoto || data.sitePhoto || data.installationPhoto || data.quoteDetails?.sitePhoto || '',
    },
    products: productsRaw.map((p: any) => {
      let rentalPeriod = undefined;
      if (p.rentalPeriod && p.rentalPeriod.from && p.rentalPeriod.to) {
        const fromDate = p.rentalPeriod.from.toDate ? p.rentalPeriod.from.toDate() : new Date(p.rentalPeriod.from);
        const toDate = p.rentalPeriod.to.toDate ? p.rentalPeriod.to.toDate() : new Date(p.rentalPeriod.to);
        rentalPeriod = {
          from: fromDate,
          to: toDate
        };
      }

      let rentalDate = undefined;
      if (p.rentalDate) {
        const date = p.rentalDate.toDate ? p.rentalDate.toDate() : new Date(p.rentalDate);
        rentalDate = date;
      }

      return {
        ...p,
        lineTotal: p.lineTotal || 0,
        rentalPeriod: rentalPeriod,
        rentalDate: rentalDate,
        rentalStartTime: p.rentalStartTime,
        rentalEndTime: p.rentalEndTime,
      };
    }),
    installationCost: data.installationCost ?? data.quoteDetails?.installationCost ?? installationCost,
    deliveryCost: data.deliveryCost ?? data.quoteDetails?.deliveryCost ?? deliveryCost,
    totalQuote: data.totalQuote,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    isRead: data.isRead,
    status: data.status || 'pending',
    includeInstallation: data.includeInstallation,
    includeDelivery: data.includeDelivery,
    transactionType: data.transactionType,
    rentalPeriod: data.rentalPeriod ? {
      from: data.rentalPeriod.from?.toDate ? data.rentalPeriod.from.toDate() : new Date(data.rentalPeriod.from),
      to: data.rentalPeriod.to?.toDate ? data.rentalPeriod.to.toDate() : new Date(data.rentalPeriod.to),
    } : undefined,
    rentalStartTime: data.rentalStartTime,
    rentalEndTime: data.rentalEndTime,
    width: data.width,
    height: data.height,
    unconfiguredCityQuery: data.unconfiguredCityQuery,
    selectedCityId: data.selectedCityId,
    isDeliveryCostFinal: data.isDeliveryCostFinal ?? false,
    emailVerified: data.emailVerified ?? false,
    screenType: data.screenType,
    productName: data.productName,
    lang: data.lang,
    techniciansRequired: data.techniciansRequired || 0,
    supplierId: data.supplierId,
    trackingNumber: data.trackingNumber,
    assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate() : undefined,
    history: (data.history || []).map((h: any) => ({
      ...h,
      timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
    })).sort((a: any, b: any) => b.timestamp - a.timestamp),
    supplierNotes: data.supplierNotes,
    supplierTechDetails: data.supplierTechDetails,
    returnReason: data.returnReason,
    pdfSettings: data.pdfSettings,
    pdfUrl: data.pdfUrl,
    contractUrl: data.contractUrl,
  };

  return structuredQuote;
}

// ─────────────────────────────────────────────────────────────
// Phase 4 — In-memory cache for legacy quote counts
// Legacy quotes (documents without transactionType field) are
// relatively static — caching avoids redundant full collection scans
// ─────────────────────────────────────────────────────────────
let _legacyCountsCache: { data: { counts: Record<string, number>; sums: Record<string, number> } | null; timestamp: number; supplierId: string | null } | null = null;
const LEGACY_CACHE_TTL_MS = 30_000; // 30 seconds

export async function getQuoteCounts(clientSupplierId?: string, transactionType?: 'sale' | 'rental'): Promise<{ counts: Record<string, number>, sums: Record<string, number> }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { counts: {}, sums: {} };

  const user = await getCurrentAdminUser();
  if (!user || 'error' in user) return { counts: {}, sums: {} };

  const effectiveSupplierId = user.role === 'fournisseur' ? user.uid : clientSupplierId;
  const statuses = ['pending', 'processed', 'returned', 'in_progress', 'sent', 'archived', 'trashed', 'rented'];
  const counts: Record<string, number> = {};
  const sums: Record<string, number> = {};

  statuses.forEach(s => { counts[s] = 0; sums[s] = 0; });

  // If filtering by supplier or transactionType, use count() aggregation + lightweight sum query
  if (effectiveSupplierId || transactionType) {
    try {
      // Phase 1: per-status counts via Firestore count() aggregation (index-only, no doc reads)
      const countPromises = statuses.map(async (status) => {
        let q: Query = adminDb.collection('quotes').where('status', '==', status);
        if (effectiveSupplierId) q = q.where('supplierId', '==', effectiveSupplierId);
        if (transactionType) q = q.where('transactionType', '==', transactionType);
        const snap = await q.count().get();
        counts[status] = snap.data().count || 0;
      });
      await Promise.all(countPromises);

      // Phase 2: lightweight sum query — only transfer 2 numeric fields per doc
      let sumQ: Query = adminDb.collection('quotes');
      if (effectiveSupplierId) sumQ = sumQ.where('supplierId', '==', effectiveSupplierId);
      if (transactionType) sumQ = sumQ.where('transactionType', '==', transactionType);
      const sumSnap = await sumQ.select('status', 'totalClient', 'totalQuote').get();
      sumSnap.forEach(doc => {
        const d = doc.data();
        if (statuses.includes(d.status)) {
          sums[d.status] += (d.totalClient || d.totalQuote || 0);
        }
      });

      // Phase 3: legacy quotes (no transactionType field) — cached to avoid repeated scans
      if (transactionType === 'sale') {
        const now = Date.now();
        const cacheValid = _legacyCountsCache && _legacyCountsCache.supplierId === effectiveSupplierId && (now - _legacyCountsCache.timestamp) < LEGACY_CACHE_TTL_MS;

        if (cacheValid && _legacyCountsCache!.data) {
          const cached = _legacyCountsCache!.data;
          for (const s of statuses) {
            counts[s] += cached.counts[s] || 0;
            sums[s] += cached.sums[s] || 0;
          }
        } else {
          // Use count() aggregation for legacy counts
          const legacyCountPromises = statuses.map(async (status) => {
            let q: Query = adminDb.collection('quotes')
              .where('status', '==', status)
              .where('transactionType', 'not-in', ['sale', 'rental']);
            if (effectiveSupplierId) q = q.where('supplierId', '==', effectiveSupplierId);
            const snap = await q.count().get();
            return { status, count: snap.data().count || 0 };
          });
          const legacyCountResults = await Promise.all(legacyCountPromises);
          legacyCountResults.forEach(r => { counts[r.status] += r.count; });

          // Lightweight sum query for legacy docs
          let legacySumQ: Query = adminDb.collection('quotes')
            .where('transactionType', 'not-in', ['sale', 'rental']);
          if (effectiveSupplierId) legacySumQ = legacySumQ.where('supplierId', '==', effectiveSupplierId);
          const legacySumSnap = await legacySumQ.select('status', 'totalClient', 'totalQuote').get();
          const legacyCounts: Record<string, number> = {};
          const legacySums: Record<string, number> = {};
          statuses.forEach(s => { legacyCounts[s] = 0; legacySums[s] = 0; });
          legacySumSnap.forEach(doc => {
            const d = doc.data();
            if (statuses.includes(d.status)) {
              legacySums[d.status] += (d.totalClient || d.totalQuote || 0);
            }
          });
          for (const s of statuses) {
            sums[s] += legacySums[s] || 0;
            legacyCounts[s] = legacyCountResults.find(r => r.status === s)?.count || 0;
          }

          // Update cache
          _legacyCountsCache = {
            data: { counts: legacyCounts, sums: legacySums },
            timestamp: now,
            supplierId: effectiveSupplierId,
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { counts, sums };
  }

  // Phase 3: No global recalculation — use pre-computed stats document
  try {
    const stats = await getQuoteStats();
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value === 'object' && value !== null && 'count' in value) {
        counts[key] = value.count || 0;
        sums[key] = value.total || 0;
      }
    }
  } catch (error) {
    console.error("Error reading stats document:", error);
  }

  return { counts, sums };
}

// ─────────────────────────────────────────────────────────────
// Phase 2 — Persistent stats engine (settings/quote_stats)
// ─────────────────────────────────────────────────────────────

export async function calibrateQuoteStats() {
  const result = await resyncStats();
  if (!result) return null;

  const counts: Record<string, number> = {};
  const sums: Record<string, number> = {};

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'object' && value !== null && 'count' in value) {
      counts[key] = (value as any).count || 0;
      sums[key] = (value as any).total || 0;
    }
  }

  return { counts, sums };
}



// ─────────────────────────────────────────────────────────────
// In-memory cache for getPaginatedQuotes legacy fallback results
// Legacy docs are static — a 30s TTL avoids redundant queries
// across tab switches without risking staleness
// ─────────────────────────────────────────────────────────────
let _legacyQuotesCache: {
  data: QueryDocumentSnapshot[];
  timestamp: number;
  supplierId: string | null;
  status: string;
} | null = null;
const LEGACY_QUOTES_CACHE_TTL_MS = 30_000;

export async function getPaginatedQuotes({
  status,
  limit = 6,
  startAfterId,
  supplierId: clientSupplierId,
  transactionType,
}: {
  status?: string;
  limit?: number;
  startAfterId?: string | null;
  supplierId?: string;
  transactionType?: 'sale' | 'rental';
}) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const user = await getCurrentAdminUser();
  if (!user || 'error' in user) throw new Error("Unauthorized");

  const safeSupplierId = (clientSupplierId === '$undefined' || clientSupplierId === 'undefined') 
    ? null 
    : clientSupplierId ?? null;

  // Force strict filtering for suppliers
  const effectiveSupplierId = user.role === 'fournisseur' ? user.uid : safeSupplierId;

  // Phase 1 perf: list-only field projection — heavy fields (history, pdfSettings, verificationToken)
  // are excluded from the list query. They are loaded on-demand via getQuoteRequest().
  const LIST_FIELDS = [
    'number', 'client', 'companyName', 'status', 'createdAt', 'treatedAt',
    'totalPurchase', 'totalClient', 'totalQuote', 'supplierId', 'trackingNumber',
    'isReturned', 'isLocked', 'treatedBy', 'treatedByName', 'treatedByRole',
    'emailVerified', 'products', 'deliveryCost', 'installationCost',
    'supplierNotes', 'returnReason', 'sitePhoto', 'phone', 'email',
    'transactionType', 'rentalPeriod', 'rentalStartTime', 'rentalEndTime'
  ];

  const toIso = (val: any): string | null => {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'string') return val;
    return null;
  };

  const mapDoc = (doc: DocumentSnapshot) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      number: data.number || `EST-${doc.id.substring(0, 6).toUpperCase()}`,
      client: data.client?.companyName || data.companyName || 'Unknown Client',
      email: data.client?.email || data.email || '',
      phone: data.client?.phone || data.phone || '',
      status: data.status || 'pending',
      createdAt: toIso(data.createdAt) || new Date(0).toISOString(),
      treatedAt: toIso(data.treatedAt),
      totalPurchase: data.totalPurchase || 0,
      totalClient: data.totalClient || 0,
      totalQuote: data.totalQuote || 0,
      supplierId: typeof data.supplierId === 'string' ? data.supplierId : (data.supplierId?.id || null),
      trackingNumber: data.trackingNumber || null,
      isReturned: data.isReturned || false,
      isLocked: data.isLocked || false,
      treatedBy: data.treatedBy || null,
      treatedByName: data.treatedByName || null,
      treatedByRole: data.treatedByRole || null,
      emailVerified: data.emailVerified || false,
      products: (data.products || []).map((p: any) => ({
        id: p.id || '',
        name: p.name || '',
        quantity: p.quantity || 0,
        purchasePrice: p.purchasePrice || 0,
        sellingPrice: p.sellingPrice || 0,
        lineTotal: p.lineTotal || 0,
      })),
      deliveryCost: data.deliveryCost || 0,
      installationCost: data.installationCost || 0,
      supplierNotes: data.supplierNotes || null,
      returnReason: data.returnReason || null,
      sitePhoto: data.client?.sitePhoto || data.sitePhoto || null,
      transactionType: data.transactionType || null,
      rentalPeriod: data.rentalPeriod ? {
        from: toIso(data.rentalPeriod.from),
        to: toIso(data.rentalPeriod.to)
      } : null,
      rentalStartTime: data.rentalStartTime || null,
      rentalEndTime: data.rentalEndTime || null,
    };
  };

  const applyProjection = (q: Query) => {
    try {
      return (q as any).select(...LIST_FIELDS);
    } catch {
      return q; // Fallback if .select() not available
    }
  };

  try {
    // ── Primary query: strictly-typed sale OR rental documents ──
    let q: Query = adminDb.collection('quotes');

    if (effectiveSupplierId) {
      q = q.where('supplierId', '==', effectiveSupplierId);
    }

    if (transactionType) {
      q = q.where('transactionType', '==', transactionType);
    }

    if (status) {
      q = q.where('status', '==', status);
    }
    q = applyProjection(q.orderBy('createdAt', 'desc').limit(limit));

    if (startAfterId) {
      const lastDoc = await adminDb.collection('quotes').doc(startAfterId).get();
      if (lastDoc.exists) {
        q = q.startAfter(lastDoc);
      }
    }

    const snapshot = await q.get();
    let allDocs = snapshot.docs;

    // ── For 'sale' mode: also include legacy quotes without the transactionType field ──
    // These are documents created before the Sale/Rental separation was implemented.
    // Firestore `not-in` catches docs where the field is absent or has a non-matching value.
    if (transactionType === 'sale' && !startAfterId) {
      // Only on first page to keep pagination simple; legacy docs backfill happens over time
      const now = Date.now();
      const cacheValid = _legacyQuotesCache
        && _legacyQuotesCache.supplierId === effectiveSupplierId
        && _legacyQuotesCache.status === status
        && (now - _legacyQuotesCache.timestamp) < LEGACY_QUOTES_CACHE_TTL_MS;
      if (cacheValid) {
        const existingIds = new Set(allDocs.map(d => d.id));
        _legacyQuotesCache!.data.forEach(d => {
          if (!existingIds.has(d.id)) allDocs.push(d);
        });
        allDocs.sort((a, b) => {
          const tA = a.data()?.createdAt?.toMillis?.() ?? 0;
          const tB = b.data()?.createdAt?.toMillis?.() ?? 0;
          return tB - tA;
        });
        allDocs = allDocs.slice(0, limit);
      } else {
        try {
          let legacyQ: Query = adminDb.collection('quotes');
          if (effectiveSupplierId) {
            legacyQ = legacyQ.where('supplierId', '==', effectiveSupplierId);
          }
        if (status) {
          legacyQ = legacyQ.where('status', '==', status);
        }
        legacyQ = applyProjection(
          legacyQ
            .where('transactionType', 'not-in', ['sale', 'rental'])
            .orderBy('transactionType')
            .orderBy('createdAt', 'desc')
            .limit(limit)
        );
        const legacySnap = await legacyQ.get();
        _legacyQuotesCache = {
          data: legacySnap.docs,
          timestamp: now,
          supplierId: effectiveSupplierId,
          status,
        };
        const existingIds = new Set(allDocs.map(d => d.id));
        legacySnap.docs.forEach(d => { if (!existingIds.has(d.id)) allDocs.push(d); });
        allDocs.sort((a, b) => {
          const tA = a.data()?.createdAt?.toMillis?.() ?? 0;
          const tB = b.data()?.createdAt?.toMillis?.() ?? 0;
          return tB - tA;
        });
        allDocs = allDocs.slice(0, limit);
      } catch (legacyErr) {
        console.warn('[getPaginatedQuotes] Legacy query skipped:', legacyErr);
      }
      }
    }

    if (allDocs.length === 0) return { requests: [], lastId: null };

    const requests = allDocs.map(mapDoc);
    const lastId = requests.length > 0 ? requests[requests.length - 1].id : null;
    return { requests, lastId };
  } catch (error) {
    console.error("Error in getPaginatedQuotes:", error);
    throw error;
  }
}


export async function getQuoteRequests({
  status,
  limit = 6,
  startAfterId = null,
  isLightweight = false,
}: {
  status?: string | string[];
  limit?: number;
  startAfterId?: string | null;
  isLightweight?: boolean;
}): Promise<{ requests: QuoteRequest[]; lastId: string | null; totalCount: number }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  try {
    const user = await getCurrentAdminUser();
    if (!user || 'error' in user) throw new Error("Unauthorized");

    let query: Query = adminDb.collection('quotes');
    
    // Role-based filtering
    if (user.role === 'fournisseur') {
      query = query.where('supplierId', '==', user.uid);
    } else if (typeof status === 'string' && (status === '$undefined' || status === 'undefined')) {
      // Guard against common serialization bugs
      return { requests: [], lastId: null, totalCount: 0 };
    }

    // Status filtering (Server-side)
    if (status) {
      if (Array.isArray(status)) {
        if (status.length > 0) {
          query = query.where('status', 'in', status);
        }
      } else {
        query = query.where('status', '==', status);
      }
    }

    // Total count for the current filter
    const totalSnapshot = await query.count().get();
    const totalCount = totalSnapshot.data().count;

    // Sorting and Pagination
    query = query.orderBy('createdAt', 'desc');

    if (startAfterId) {
      const lastDoc = await adminDb.collection('quotes').doc(startAfterId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return { requests: [], lastId: null, totalCount: 0 };
    }

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();

      if (isLightweight) {
        // Return only essential fields for the table
        return {
          id: doc.id,
          // Flat aliases for optimization guide compatibility
          numero: data.number || `EST-${doc.id.substring(0, 6).toUpperCase()}`,
          clientName: data.client?.companyName || data.companyName || 'Unknown',
          clientPhone: data.client?.phone || data.phone || '',
          clientEmail: data.client?.email || data.email || '',
          total: data.totalQuote || 0,
          
          // Existing structure for UI compatibility
          number: data.number || `EST-${doc.id.substring(0, 6).toUpperCase()}`,
          client: {
            companyName: data.client?.companyName || data.companyName || 'Unknown',
            phone: data.client?.phone || data.phone || '',
            email: data.client?.email || data.email || '',
          },
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          totalQuote: data.totalQuote || 0,
          sitePhoto: data.client?.sitePhoto || data.sitePhoto || null,
          isRead: data.isRead ?? true,
          emailVerified: data.emailVerified ?? false,
          trackingNumber: data.trackingNumber,
          supplierId: data.supplierId,
          isReturned: data.isReturned ?? false,
        } as any;
      }

      // Full data (for backward compatibility or explicit full fetch)
      const productsRaw = data.products || data.quoteDetails?.products || [];
      const products = productsRaw.map((p: any) => ({
        ...p,
        rentalPeriod: (p.rentalPeriod && p.rentalPeriod.from && p.rentalPeriod.to) ? {
          from: p.rentalPeriod.from.toDate ? p.rentalPeriod.from.toDate() : new Date(p.rentalPeriod.from),
          to: p.rentalPeriod.to.toDate ? p.rentalPeriod.to.toDate() : new Date(p.rentalPeriod.to)
        } : undefined,
        rentalDate: p.rentalDate?.toDate ? p.rentalDate.toDate() : (p.rentalDate ? new Date(p.rentalDate) : undefined)
      }));

      return {
        id: doc.id,
        client: {
          companyName: data.client?.companyName || data.companyName || '',
          email: data.client?.email || data.email || '',
          phone: data.client?.phone || data.phone || '',
          address: data.client?.address || data.address || '',
          notes: data.client?.notes || data.notes || '',
          sitePhoto: data.client?.sitePhoto || data.sitePhoto || data.installationPhoto || ''
        },
        products: products,
        totalQuote: data.totalQuote,
        includeInstallation: data.includeInstallation,
        includeDelivery: data.includeDelivery,
        deliveryCost: data.deliveryCost,
        installationCost: data.installationCost,
        isDeliveryCostFinal: data.isDeliveryCostFinal ?? false,
        unconfiguredCityQuery: data.unconfiguredCityQuery,
        selectedCityId: data.selectedCityId,
        transactionType: data.transactionType,
        width: data.width,
        height: data.height,
        productName: data.productName,
        isRead: data.isRead,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        status: data.status || 'pending',
        emailVerified: data.emailVerified ?? false,
        screenType: data.screenType,
        lang: data.lang,
        techniciansRequired: data.techniciansRequired || 0,
        supplierId: data.supplierId,
        trackingNumber: data.trackingNumber,
        assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate().toISOString() : undefined,
        history: (data.history || []).map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate ? h.timestamp.toDate().toISOString() : new Date(h.timestamp).toISOString(),
        })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        supplierNotes: data.supplierNotes,
        returnReason: data.returnReason,
      } as any;
    });

    const lastId = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return { requests, lastId, totalCount };
  } catch (err) {
    console.error('Error fetching paginated quotes:', err);
    throw err;
  }
}


async function findQuoteRef(adminDb: Firestore, quoteId: string): Promise<DocumentReference | null> {
  const docRef = adminDb.collection('quotes').doc(quoteId);
  const docSnap = await docRef.get();
  return docSnap.exists ? docRef : null;
}

async function sendSupplierEmail(supplierEmail: string, quoteNumber: string, clientName: string, message?: string) {
  try {
    const { transporter, fromHeader, host, user, pass } = await getSmtpTransport();

    if (!host || !user || !pass) {
      console.warn('SMTP credentials not configured, skipping supplier email.');
      return;
    }

    const emailHtml = buildSupplierEmailHtml(supplierEmail, quoteNumber, clientName, message);

    await transporter.sendMail({
      from: fromHeader,
      to: supplierEmail,
      subject: `[PIXIATECH] Nouvelle estimation N°${quoteNumber}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error('Failed to send supplier email:', err);
  }
}

export async function updateQuoteStatus(quoteId: string, data: Partial<QuoteRequest>) {
  const { adminDb, FieldValue, Timestamp } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const docRef = await findQuoteRef(adminDb, quoteId);
  if (!docRef) throw new Error("Quote not found");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser) {
    throw new Error('Unauthorized');
  }

  const quoteSnap = await docRef.get();
  const quoteData = quoteSnap.data();

  // Security check for suppliers
  if (adminUser.role === 'fournisseur') {
    if (quoteData?.supplierId !== adminUser.uid) {
      throw new Error("Unauthorized: You cannot modify this quote.");
    }
  }

  // Prepare list of users to notify (Admins + Commercial in charge)
  const getTargetUsers = async () => {
    const targets = new Set<string>();
    // 1. Add the commercial in charge
    if (quoteData?.userId) targets.add(quoteData.userId);
    // 2. Add the person who last treated it (if different)
    if (quoteData?.treatedBy) targets.add(quoteData.treatedBy);
    // 3. Add all approved admins
    const adminsSnap = await adminDb.collection('users')
      .where('role', '==', 'admin')
      .where('status', '==', 'approved')
      .get();
    adminsSnap.forEach(doc => targets.add(doc.id));
    // 4. Remove the person who is making the change
    targets.delete(adminUser.uid);
    return Array.from(targets);
  };

  // Clean up $undefined serialization artifacts
  const updatePayload: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    const val = (data as any)[key];
    if (val === '$undefined' || val === 'undefined') {
      updatePayload[key] = null;
    } else {
      updatePayload[key] = val;
    }
  });

  const notifications: any[] = [];

  if (data.status) {
    let details = `Status changed to ${translateStatus(data.status)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (data.status === 'in_progress' && data.supplierId) {
      const supplier = await getUser(data.supplierId);
      details = `Submitted to supplier: ${supplier?.displayName || 'Unknown'}`;
      updatePayload.assignedAt = FieldValue.serverTimestamp();
      if (data.treatedBy && !data.treatedAt) {
        updatePayload.treatedAt = FieldValue.serverTimestamp();
      }
      
      // Notify the supplier
      if (supplier && supplier.uid !== adminUser.uid) {
        notifications.push({
          userId: supplier.uid,
          type: 'estimation_sent',
          title: 'Nouveau devis reçu',
          description: `Devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}) vous a été soumis le ${dateStr} à ${timeStr}.`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });

        if (supplier.email) {
          const quoteNumber = quoteData?.number || quoteId.substring(0, 8);
          const clientName = quoteData?.client?.companyName || 'Client';
          sendSupplierEmail(supplier.email, quoteNumber, clientName, data.supplierNotes).catch(console.error);
        }
      }
    }

    // NEW: Handle "returned" (when supplier sends back the price)
    if (data.status === 'returned') {
      const targets = await getTargetUsers();
      targets.forEach(uid => {
        notifications.push({
          userId: uid,
          type: 'estimation',
          title: 'Devis complété par le fournisseur',
          description: `Le fournisseur a retourné les prix pour le devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}).`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });
      });
    }

    // NEW: Handle "sent" (Delivery in progress)
    if (data.status === 'sent') {
      const targets = await getTargetUsers();
      targets.forEach(uid => {
        notifications.push({
          userId: uid,
          type: 'delivery',
          title: 'Devis en livraison',
          description: `Le devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}) a été marqué comme en livraison.`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });
      });
    }

    // When supplier rejects an estimation
    if (data.status === 'in_progress' && data.supplierNotes && data.supplierNotes.toLowerCase().includes('reject')) {
      const targets = await getTargetUsers();
      targets.forEach(uid => {
        notifications.push({
          userId: uid,
          type: 'estimation_rejected',
          title: 'Devis rejeté',
          description: `Le fournisseur a rejeté le devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}).`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });
      });
    }
    
    // When supplier creates an order (delivered status in system)
    if (data.status === 'delivered') {
      const targets = await getTargetUsers();
      targets.forEach(uid => {
        notifications.push({
          userId: uid,
          type: 'order_created',
          title: 'Commande confirmée par le fournisseur',
          description: `Une commande a été créée pour le devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}).`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });
      });
    }
    
    // Default notifications for other status changes (processed, etc.)
    if (['processed', 'delivered'].includes(data.status)) {
      const targets = await getTargetUsers();
      targets.forEach(uid => {
        notifications.push({
          userId: uid,
          type: 'estimation',
          title: `Devis ${data.status === 'processed' ? 'traité' : 'livré'}`,
          description: `Le devis N°${quoteId.substring(0, 8)} (${quoteData?.client?.companyName || 'Client'}) a été marqué comme ${data.status === 'processed' ? 'traité' : 'livré'}.`,
          href: `/admin/quotes/${quoteId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: quoteId
        });
      });
    }

    const historyEntry: Omit<QuoteHistoryEntry, 'timestamp'> & { timestamp: Timestamp } = {
      userId: adminUser.uid,
      userName: adminUser.displayName || 'Admin',
      userPhotoUrl: adminUser.photoURL || '',
      action: 'Mise à jour du statut',
      details: details,
      timestamp: Timestamp.fromDate(new Date()),
    };
    updatePayload.history = FieldValue.arrayUnion(historyEntry);
  }

  // Create batch notifications
  if (notifications.length > 0) {
    const notifBatch = adminDb.batch();
    notifications.forEach(notifData => {
      const notifRef = adminDb.collection('notifications').doc();
      notifBatch.set(notifRef, notifData);
    });
    await notifBatch.commit();
  }

  if (Object.keys(updatePayload).length > 0) {
    updatePayload.updatedAt = FieldValue.serverTimestamp();
    updatePayload.updatedBy = adminUser.uid;
    await docRef.update(updatePayload);

    // Phase 3 hook: Update persistent stats transactionally
    if (data.status && quoteData?.status !== data.status) {
      const amount = quoteData?.totalClient || quoteData?.totalQuote || 0;
      await updateStatsOnStatusChange(quoteData.status, data.status, amount, 1);
    }
  }

  logAdminActivity({
    action: 'Mise à jour du statut',
    category: 'quote',
    details: `Statut changé pour ${quoteData?.client?.companyName || quoteId} → ${data.status}`,
    targetId: quoteId,
    targetName: quoteData?.client?.companyName || '',
  });

  // Revalidate cache - ignore errors to avoid breaking optimistic UI
  try {
    revalidatePath('/admin', 'layout');
  } catch (error) {
    console.error('Failed to revalidate path after status update:', error);
  }
}

export async function updateQuotePdfUrl(quoteId: string, pdfUrl: string) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Firestore not initialized' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    await docRef.update({ pdfUrl });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating quote PDF URL:', error);
    return { success: false, error: error.message };
  }
}

export async function updateQuoteContractUrl(quoteId: string, contractUrl: string) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Firestore not initialized' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    await docRef.update({ contractUrl });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating quote contract URL:', error);
    return { success: false, error: error.message };
  }
}


export async function moveQuotesToTrash(quoteIds: string[]) {
  const { adminDb, FieldValue, Timestamp } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role === 'fournisseur') {
    throw new Error('Unauthorized');
  }

  const batch = adminDb.batch();
  const quoteNotifications: any[] = [];
  const statsUpdates: { fromStatus: string, toStatus: string, amount: number }[] = [];

  const findPromises = quoteIds.map(async (id) => {
    const docRef = await findQuoteRef(adminDb, id);
    if (docRef) {
      const quoteSnap = await docRef.get();
      const quoteData = quoteSnap.data();
      
      if (quoteData && quoteData.status !== 'trashed') {
        statsUpdates.push({
          fromStatus: quoteData.status,
          toStatus: 'trashed',
          amount: quoteData.totalClient || quoteData.totalQuote || 0
        });

        const historyEntry: Omit<QuoteHistoryEntry, 'timestamp'> & { timestamp: Timestamp } = {
          userId: adminUser.uid,
          userName: adminUser.displayName || 'Admin',
          userPhotoUrl: adminUser.photoURL || '',
          action: 'Status update',
          details: `Status changed for ${quoteData?.client?.companyName} to ${translateStatus('trashed')}`,
          timestamp: Timestamp.fromDate(new Date()),
        };
        batch.update(docRef, {
          status: 'trashed',
          history: FieldValue.arrayUnion(historyEntry),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: adminUser.uid,
        });
        
        // Notify user
        if (quoteData?.userId) {
          const now = new Date();
          const dateStr = now.toLocaleDateString('fr-FR');
          const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          quoteNotifications.push({
            userId: quoteData.userId,
            type: 'estimation_archived',
            title: 'Devis archivé',
            description: `Le devis N°${id.substring(0, 8)} du client ${quoteData?.client?.companyName || 'Client'} a été déplacé vers la corbeille par ${adminUser.displayName || 'un administrateur'} le ${dateStr} à ${timeStr}.`,
            href: '/admin/quote-requests',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            quoteRequestId: id
          });
        }
      }
    }
  });

  await Promise.all(findPromises);
  await batch.commit();

  // Phase 3 hook
  if (statsUpdates.length > 0) {
    const groupedUpdates: Record<string, { amount: number, count: number }> = {};
    statsUpdates.forEach(u => {
      if (!groupedUpdates[u.fromStatus]) groupedUpdates[u.fromStatus] = { amount: 0, count: 0 };
      groupedUpdates[u.fromStatus].amount += u.amount;
      groupedUpdates[u.fromStatus].count += 1;
    });
    for (const [fromStatus, data] of Object.entries(groupedUpdates)) {
      await updateStatsOnStatusChange(fromStatus, 'trashed', data.amount, data.count);
    }
  }
  
  // Create batch notifications for archiving
  if (quoteNotifications.length > 0) {
    const notifBatch = adminDb.batch();
    quoteNotifications.forEach(notifData => {
      const notifRef = adminDb.collection('notifications').doc();
      notifBatch.set(notifRef, notifData);
    });
   await notifBatch.commit();
   }
   await batch.commit();
   
   // Revalidate cache - ignore errors to avoid breaking optimistic UI
   try {
     revalidatePath('/admin', 'layout');
   } catch (error) {
     console.error('Failed to revalidate path after moving quotes to trash:', error);
   }
}


export async function restoreQuotes(quoteIds: string[]) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role === 'fournisseur') {
    throw new Error('Unauthorized');
  }

  const batch = adminDb.batch();
  const findPromises = quoteIds.map(id => findQuoteRef(adminDb, id));
  const docRefs = await Promise.all(findPromises);
  const quoteNotifications: any[] = [];
  const statsUpdates: { fromStatus: string, toStatus: string, amount: number }[] = [];

  for (const docRef of docRefs) {
    if (docRef) {
      const quoteSnap = await docRef.get();
      const quoteData = quoteSnap.data();

      if (quoteData && quoteData.status !== 'pending') {
        statsUpdates.push({
          fromStatus: quoteData.status,
          toStatus: 'pending',
          amount: quoteData.totalClient || quoteData.totalQuote || 0
        });
      }

      batch.update(docRef, { status: 'pending' });
      
      if (quoteData?.userId) {
        quoteNotifications.push({
          userId: quoteData.userId,
          type: 'estimation_unarchived',
          title: 'Devis désarchivé',
          description: `Votre devis pour ${quoteData?.client?.companyName || 'Client'} a été désarchivé`,
          href: '/admin/quote-requests',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          quoteRequestId: docRef.id
        });
      }
    }
  }
  await batch.commit();

  // Phase 3 hook
  if (statsUpdates.length > 0) {
    const groupedUpdates: Record<string, Record<string, { amount: number, count: number }>> = {};
    
    statsUpdates.forEach(u => {
      if (!groupedUpdates[u.fromStatus]) groupedUpdates[u.fromStatus] = {};
      if (!groupedUpdates[u.fromStatus][u.toStatus]) {
        groupedUpdates[u.fromStatus][u.toStatus] = { amount: 0, count: 0 };
      }
      groupedUpdates[u.fromStatus][u.toStatus].amount += u.amount;
      groupedUpdates[u.fromStatus][u.toStatus].count += 1;
    });

    for (const [fromStatus, toStatusGroup] of Object.entries(groupedUpdates)) {
      for (const [toStatus, data] of Object.entries(toStatusGroup)) {
        await updateStatsOnStatusChange(fromStatus, toStatus, data.amount, data.count);
      }
    }
  }
   
   // Create batch notifications for unarchiving
   if (quoteNotifications.length > 0) {
     const notifBatch = adminDb.batch();
     quoteNotifications.forEach(notifData => {
       const notifRef = adminDb.collection('notifications').doc();
       notifBatch.set(notifRef, notifData);
     });
     await notifBatch.commit();
   }
   
   // Revalidate cache - ignore errors to avoid breaking optimistic UI
   try {
     revalidatePath('/admin', 'layout');
   } catch (error) {
     console.error('Failed to revalidate path after restoring quotes:', error);
   }
}

export async function permanentDeleteQuotes(quoteIds: string[]) {
  const { adminDb, app } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role === 'fournisseur') {
    throw new Error('Unauthorized');
  }
  const batch = adminDb.batch();
  const findPromises = quoteIds.map(id => findQuoteRef(adminDb, id));
  const docRefs = await Promise.all(findPromises);
  const statsUpdates: { fromStatus: string, toStatus: string | null, amount: number }[] = [];

  for (const docRef of docRefs) {
    if (docRef) {
      const snap = await docRef.get();
      const data = snap.data();
      if (data) {
        statsUpdates.push({
          fromStatus: data.status,
          toStatus: null,
          amount: data.totalClient || data.totalQuote || 0
        });
      }
      batch.delete(docRef);
    }
  }
  await batch.commit();

  // Delete Storage files (PDFs, contracts)
  try {
    const bucket = getStorage(app).bucket();
    const deletePromises: Promise<any>[] = [];
    for (const id of quoteIds) {
      deletePromises.push(
        bucket.file(`quotes/pdfs/${id}.pdf`).delete().catch(() => {}),
        bucket.file(`quotes/contracts/${id}.pdf`).delete().catch(() => {})
      );
    }
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn('Error deleting quote storage files:', e);
  }

  // Phase 3 hook
  if (statsUpdates.length > 0) {
    const groupedUpdates: Record<string, { amount: number, count: number }> = {};
    statsUpdates.forEach(u => {
      if (!groupedUpdates[u.fromStatus]) groupedUpdates[u.fromStatus] = { amount: 0, count: 0 };
      groupedUpdates[u.fromStatus].amount += u.amount;
      groupedUpdates[u.fromStatus].count += 1;
    });
    for (const [fromStatus, data] of Object.entries(groupedUpdates)) {
      await updateStatsOnDelete(fromStatus, data.amount, data.count);
    }
  }
   
   // Revalidate cache - ignore errors to avoid breaking optimistic UI
   try {
     revalidatePath('/admin', 'layout');
   } catch (error) {
     console.error('Failed to revalidate path after permanent delete quotes:', error);
   }
}

export async function permanentDeleteAllTrashedQuotes() {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) throw new Error("Firestore not initialized");

  const adminUser = await getCurrentAdminUser();
  if (!adminUser || 'error' in adminUser || adminUser.role === 'fournisseur') {
    throw new Error('Unauthorized');
  }

  const query = adminDb.collection('quotes').where('status', '==', 'trashed');
  const snapshot = await query.get();

  if (snapshot.empty) {
    return;
  }

  // Phase 2 hook: Calculate total to decrement from stats
  const totalAmount = snapshot.docs.reduce((acc, doc) => acc + (doc.data().totalClient || doc.data().totalQuote || 0), 0);
  const totalCount = snapshot.docs.length;

  const batchPromises: Promise<any>[] = [];
  let batch = adminDb.batch();
  snapshot.docs.forEach((doc, index) => {
    batch.delete(doc.ref);
    if ((index + 1) % 500 === 0) {
      batchPromises.push(batch.commit());
      batch = adminDb.batch();
    }
  });

  if (snapshot.docs.length % 500 !== 0) {
    batchPromises.push(batch.commit());
  }

   await Promise.all(batchPromises);

   // Phase 3 hook
   await updateStatsOnDelete('trashed', totalAmount, totalCount);
   
   // Revalidate cache - ignore errors to avoid breaking optimistic UI
   try {
     revalidatePath('/admin', 'layout');
   } catch (error) {
     console.error('Failed to revalidate path after permanent delete all trashed quotes:', error);
   }
}

const clientDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  notes: z.string().optional(),
});

export async function updateQuoteClientDetails(quoteId: string, clientData: unknown) {
  const result = clientDetailsSchema.safeParse(clientData);
  if (!result.success) {
    return { success: false, error: 'Invalid client data.' };
  }

  const { adminDb, FieldValue, Timestamp } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Service unavailable.' };

  try {
    const docRef = await findQuoteRef(adminDb, quoteId);
    const adminUser = await getCurrentAdminUser();

    if (docRef && adminUser && !('error' in adminUser)) {
      const historyEntry: Omit<QuoteHistoryEntry, 'timestamp'> & { timestamp: Timestamp } = {
        userId: adminUser.uid,
        userName: adminUser.displayName || 'Admin',
        userPhotoUrl: adminUser.photoURL || '',
        action: 'Update',
        details: 'modified client information',
        timestamp: Timestamp.fromDate(new Date()),
      };

       await docRef.update({
         ...result.data,
         history: FieldValue.arrayUnion(historyEntry),
       });
       
       // Revalidate cache - ignore errors to avoid breaking optimistic UI
       try {
         revalidatePath(`/admin/quotes/${quoteId}`);
         revalidatePath('/admin');
       } catch (error) {
         console.error('Failed to revalidate paths after updating client details:', error);
       }
       return { success: true };
    }
      return { success: false, error: 'Estimate not found or user not authorized.' };
  } catch (error: any) {
    console.error('Error updating client details:', error);
    return { success: false, error: error.message || 'Unable to update the client.' };
  }
}

export async function verifyQuoteToken(token: string): Promise<{ success: boolean; quoteId?: string; userId?: string; error?: string }> {
  const { adminDb } = getFirebaseAdmin();
  try {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const quotesRef = adminDb.collection('quotes');
    const querySnapshot = await quotesRef.where('verificationToken', '==', hashedToken).limit(1).get();

    if (querySnapshot.empty) {
      return { success: false, error: "Invalid or expired token." };
    }

    const quoteDoc = querySnapshot.docs[0];
    const quoteData = quoteDoc.data();

    const expiresTimestamp = quoteData.verificationTokenExpires;
    if (expiresTimestamp && new Date() > expiresTimestamp.toDate()) {
      return { success: false, error: "The verification link has expired." };
    }

    if (!quoteData.emailVerified) {
      await quoteDoc.ref.update({ emailVerified: true });
    }

    if (!quoteData.userId) {
      return { success: false, error: "No user associated with this estimate." };
    }

    return { success: true, quoteId: quoteDoc.id, userId: quoteData.userId };
  } catch (error) {
    console.error("Error verifying estimate:", error);
    return { success: false, error: 'Internal server error.' };
  }
}


// --- PDF Settings Actions ---

const pdfSettingsSchema = z.object({
  logoUrl: z.string().url("Invalid logo URL").or(z.literal('')).optional(),
  logoWidth: z.coerce.number().min(20).max(300).optional(),
  backgroundUrl: z.string().url("Invalid background URL").or(z.literal('')).optional(),
  companyName: z.string().min(1, "Company name is required"),
  siret: z.string().optional(),
  capital: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  textColor: z.string().optional(),
  titleColor: z.string().optional(),
  headerColor: z.string().optional(),
  quoteTitle: z.string().optional(),
  quoteNumberPrefix: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export async function getPdfSettings(rawUrls = false): Promise<PdfSettings> {
  const { adminDb } = getFirebaseAdmin();
  const defaultSettings: PdfSettings = {
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Flogo.png?alt=media&token=8544c77c-6554-46c5-ac33-0c464c8d50d0",
    logoWidth: 190,
    backgroundUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Fbackground.jpg?alt=media&token=0a32d431-1554-4648-9b88-be9c73eac09f",
    companyName: "PIXIATECH",
    siret: "123 456 789 00010 100",
    capital: "100000€",
    address: "123 Rue de l'Exemple, 75001 Paris, France",
    phone: "+33 1 23 45 67 89",
    email: "contact@pixiatech.com",
    textColor: "#000000",
    titleColor: "#000000",
    headerColor: "#0a5499",
    quoteTitle: "Estimation",
    quoteNumberPrefix: "EST-",
    termsAndConditions: "Merci de votre confiance. Cette estimation est valable 30 jours.",
  };

  try {
    const docRef = adminDb.collection('settings').doc(PDF_SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { ...defaultSettings, ...docSnap.data() };
    } else {
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching PDF settings from Firestore:", error);
    return defaultSettings;
  }
}

export async function updatePdfSettings(data: unknown) {
  const result = pdfSettingsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten().formErrors.join(', ') || 'Validation error' };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(PDF_SETTINGS_DOC_ID).set(result.data, { merge: true });
    revalidatePath('/admin/pdf-settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to update PDF settings in Firestore:', error);
    return { success: false, error: 'Failed to save PDF settings.' };
  }
}

// --- Product Actions ---

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Name must contain at least 3 characters'),
  type: z.array(z.enum(['indoor', 'outdoor', 'showcase'])).min(1, 'At least one type must be selected'),
  availableFor: z.array(z.enum(['sale', 'rental'])).min(1, 'At least one availability option must be selected'),
  productUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  videoUrl: z.string().url('Invalid media URL').or(z.literal('')).optional(),

  salePricePerSqM: z.coerce.number().optional().default(0),
  rentalPricePerDay: z.coerce.number().optional().default(0),
  rentalPricePerHour: z.coerce.number().optional().default(0),

  tileWidth: z.coerce.number().optional().default(0),
  tileHeight: z.coerce.number().optional().default(0),
  pricePerTile: z.coerce.number().optional().default(0),

  maxRentalArea: z.coerce.number().optional().default(0),
  minArea: z.coerce.number().min(0, "Minimum area must be positive.").optional(),
  hasDimensions: z.boolean().optional().default(true),
  isHidden: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if ((data.tileWidth ?? 0) > 0 || (data.tileHeight ?? 0) > 0 || (data.pricePerTile ?? 0) > 0) {
    if (data.tileWidth === undefined || data.tileWidth <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tileWidth'], message: 'La largeur de la dalle est requise.' });
    }
    if (data.tileHeight === undefined || data.tileHeight <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tileHeight'], message: 'La hauteur de la dalle est requise.' });
    }
    if (data.pricePerTile === undefined || data.pricePerTile <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pricePerTile'], message: 'Le prix par dalle est requis.' });
    }
  }
});


export async function getProducts(options: { page?: number; limit?: number } = {}): Promise<{ products: Product[]; hasMore: boolean; rentalCount: number; saleCount: number; }> {
  const { page = 1, limit = 5 } = options;
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("Firestore is not initialized for getProducts.");
    return { products: [], hasMore: false, rentalCount: 0, saleCount: 0 };
  }

  try {
    const productsCollection = adminDb.collection('products');

    // Get counts (flexible for both EN and FR terms)
    const rentalSnapshot = await productsCollection.where('availableFor', 'array-contains-any', ['rental', 'location']).count().get();
    const rentalCount = rentalSnapshot.data().count;
    const saleSnapshot = await productsCollection.where('availableFor', 'array-contains-any', ['sale', 'vente']).count().get();
    const saleCount = saleSnapshot.data().count;

    let products: Product[] = [];
    let hasMore = false;

    if (limit > 0) {
      let query: Query = productsCollection.orderBy('name');

      if (page > 1) {
        const offset = (page - 1) * limit;
        const previousDocsSnapshot = await productsCollection.orderBy('name').limit(offset).get();
        if (!previousDocsSnapshot.empty) {
          const lastVisible = previousDocsSnapshot.docs[previousDocsSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limit + 1).get();
      products = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Normalize availableFor to strictly use 'sale' or 'rental' for the UI
        const normalizedAvailableFor = (data.availableFor || data.mode || [])
          .map((m: string) => {
            const val = m.toLowerCase();
            if (val === 'vente' || val === 'sale') return 'sale';
            if (val === 'location' || val === 'rental') return 'rental';
            return val;
          })
          .filter((m: string) => m === 'sale' || m === 'rental');

        // Normalize environment types to strictly use 'indoor', 'outdoor', or 'showcase'
        const normalizedType = (Array.isArray(data.type) ? data.type : [data.type || 'indoor'])
          .map((t: string) => {
            const val = t.toLowerCase();
            if (val === 'interieur' || val === 'indoor') return 'indoor';
            if (val === 'exterieur' || val === 'outdoor') return 'outdoor';
            if (val === 'semi-exterieur' || val === 'showcase' || val === 'vitrine') return 'showcase';
            return val;
          })
          .filter((t: string) => t === 'indoor' || t === 'outdoor' || t === 'showcase');

        return { 
          id: doc.id, 
          ...data,
          availableFor: normalizedAvailableFor,
          type: normalizedType,
          tileWidth: parseFloat(data.largeurDalle || data.tileWidth || 0),
          tileHeight: parseFloat(data.hauteurDalle || data.tileHeight || 0),
          pricePerTile: parseFloat(data.prixDalle || data.pricePerTile || 0),
          hasDimensions: data.dimensionsEnabled !== undefined ? data.dimensionsEnabled : data.hasDimensions,
          minArea: parseFloat(data.surfaceMinRequise || data.minArea || 0),
          oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : undefined,
          salePricePerSqM: parseFloat(typeof data.price === 'string' ? data.price.replace('€', '').replace(/ /g, '').trim() : data.price || data.salePricePerSqM || 0),
          rentalPricePerDay: parseFloat(data.prixLocationJour || data.rentalPricePerDay || 0),
          rentalPricePerHour: parseFloat(data.prixLocationHeure || data.rentalPricePerHour || 0),
          productUrl: data.pdfUrl || data.productUrl || '',
          isHidden: !!data.isHidden,
        } as Product;
      });

      hasMore = products.length > limit;
      if (hasMore) {
        products.pop();
      }
    }

    return { products, hasMore, rentalCount, saleCount };
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return { products: [], hasMore: false, rentalCount: 0, saleCount: 0 };
  }
}


export async function addProduct(data: unknown) {
  const result = productSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: { formErrors: result.error.flatten().fieldErrors } };
  }

  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    return { success: false, error: { formErrors: { _errors: ['Database service unavailable.'] } } };
  }

  const { id, ...newProductData } = result.data;

  try {
    const docRef = await adminDb.collection('products').add(newProductData);
    revalidatePath('/admin/products');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding product to Firestore:", error);
    return { success: false, error: { formErrors: { _errors: ["Failed to add product to database."] } } };
  }
}

export async function updateProduct(data: unknown) {
  const result = productSchema.safeParse(data);
  if (!result.success || !result.data.id) {
    return { success: false, error: result.error?.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    return { success: false, error: { formErrors: ['Database service unavailable.'] } };
  }

  const { id, ...updatedData } = result.data;

  try {
    await adminDb.collection('products').doc(id).set(updatedData, { merge: true });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error("Error updating product in Firestore:", error);
    return { success: false, error: { formErrors: ["Product update failed."] } };
  }
}


export async function deleteProducts(ids: string[]) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    return { success: false, error: "Database service unavailable." };
  }
  try {
    const batch = adminDb.batch();
    ids.forEach(id => {
      const docRef = adminDb.collection('products').doc(id);
      batch.delete(docRef);
    });
    await batch.commit();
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting products from Firestore:", error);
    return { success: false, error: error.message };
  }
}


export async function cloneProduct(id: string) {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    return { success: false, error: "Service indisponible." };
  }

  try {
    const productRef = adminDb.collection('products').doc(id);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return { success: false, error: 'Product not found.' };
    }

    const productToClone = productSnap.data();
    if (!productToClone) {
      return { success: false, error: 'Product data not found.' };
    }

    const clonedProductData = {
      ...productToClone,
      name: `Copie de ${productToClone.name}`,
    };

    const newDocRef = await adminDb.collection('products').add(clonedProductData);
    revalidatePath('/admin/products');
    return { success: true, newProduct: { id: newDocRef.id, ...clonedProductData } };
  } catch (error: any) {
    console.error("Error cloning product in Firestore:", error);
    return { success: false, error: error.message };
  }
}


// --- Product Specifications Actions ---

const specItemSchema = z.object({
  id: z.string(),
  key: z.string().min(1, "Feature key cannot be empty."),
  value: z.string().min(1, "Feature value cannot be empty."),
});

const productSpecSchema = z.object({
  productId: z.string(),
  specs: z.array(specItemSchema),
});


export async function getProductSpecs(): Promise<Record<string, ProductSpec[]>> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return {};

  const specs: Record<string, ProductSpec[]> = {};
  try {
    const snapshot = await adminDb.collection('product_specs').get();
    snapshot.forEach(doc => {
      specs[doc.id] = doc.data().specs as ProductSpec[];
    });
    return specs;
  } catch (error) {
    console.error("Error fetching product specs from Firestore:", error);
    return {};
  }
}

export async function updateProductSpecs(data: unknown) {
  const result = productSpecSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: { formErrors: ["Service indisponible."] } };

  const { productId, specs } = result.data;

  try {
    const docRef = adminDb.collection('product_specs').doc(productId);
    await docRef.set({ specs: specs });
    revalidatePath('/admin/products/specs');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating product specs:", error);
    return { success: false, error: { formErrors: [error.message] } };
  }
}


// --- Settings Actions ---

const translatedStringSchema = z.object({
  fr: z.string().optional(),
  en: z.string().optional(),
});

const hintBubbleSchema = z.object({
  enabled: z.boolean(),
  text: z.string().optional(),
  desktopBottom: z.coerce.number().optional(),
  desktopRight: z.coerce.number().optional(),
  mobileBottom: z.coerce.number().optional(),
  mobileRight: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
});

const messagingSchema = z.object({
  enabled: z.boolean(),
  allowCommercialMessaging: z.boolean(),
  allowSupplierMessaging: z.boolean(),
});

const settingsSchema = z.object({
  defaultWidth: z.coerce.number().min(1, "Width must be at least 1"),
  defaultHeight: z.coerce.number().min(1, "Height must be at least 1"),
  maxWidth: z.coerce.number().min(1, "Max width must be at least 1"),
  maxHeight: z.coerce.number().min(1, "Max height must be at least 1"),
  maxRentalWidth: z.coerce.number().min(1).optional(),
  maxRentalHeight: z.coerce.number().min(1).optional(),
  maxProductsPerQuote: z.coerce.number().min(1, 'Must be at least 1').optional(),
  previewScreenImageUrl: z.string().optional(),
  previewScreenVideoUrl: z.string().optional(),
  emergencyStopEnabled: z.boolean().optional(),
  emergencyReturnUrl: z.string().optional(),
  emergencyStopMessage: z.string().optional(),
  congratulationsTitle: translatedStringSchema.optional(),
  congratulationsMessage: translatedStringSchema.optional(),
  deliveryTitle: translatedStringSchema.optional(),
  deliveryMessage: translatedStringSchema.optional(),
  installationTitle: translatedStringSchema.optional(),
  installationMessage: translatedStringSchema.optional(),
  disclaimerMessage: translatedStringSchema.optional(),
  quoteFormNotesPlaceholder: translatedStringSchema.optional(),
  isDeliveryStepEnabled: z.boolean().optional(),
  isInstallationStepEnabled: z.boolean().optional(),
  isEmailVerificationEnabled: z.boolean().optional(),
  isPriceHidden: z.boolean().optional(),
  isSingleSessionEnabled: z.boolean().optional(),
  zoomMaxDistance: z.coerce.number().min(1, 'Must be at least 1').optional(),
  zoomMinDistance: z.coerce.number().min(0.1, 'Must be at least 0.1').optional(),
  isWizardBotEnabled: z.boolean().optional(),
  isGuidedConfigEnabled: z.boolean().optional(),
  isManualConfigEnabled: z.boolean().optional(),
  hintBubble: hintBubbleSchema.optional(),
  lightThemeId: z.string().optional(),
  darkThemeId: z.string().optional(),
  sidebarOrder: z.array(z.string()).optional(),
  logoConfig: z.object({
    text: z.string(),
    letter: z.string(),
    color: z.string(),
    image: z.string().nullable(),
  }).optional(),
  messaging: messagingSchema.optional(),
  emailVerification: z.object({
    companyName: z.string(),
    companySlogan: z.string(),
    documentLabel: z.string(),
    messageStyle: z.string(),
    validityMinutes: z.number(),
    previewTheme: z.string().optional(),
  }).optional(),
  estimationFlow: z.object({
    enableRentalPeriod: z.boolean(),
    enableDigitalSignature: z.boolean(),
    enableContractEditing: z.boolean(),
    companySignatureDataUrl: z.string().optional(),
    saleContractTemplate: z.string().optional(),
    rentalContractTemplate: z.string().optional(),
    taxEnabled: z.boolean(),
    taxRate: z.number().min(0).max(100),
    taxMode: z.enum(['ht', 'ttc']),
    sale: z.object({
      maxProductsPerQuote: z.coerce.number().min(1).default(3),
      flatScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
      curvedScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1), curveMin: z.coerce.number().max(0), curveMax: z.coerce.number().min(0) }),
      screen360: z.object({ maxDiameter: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
    }).optional(),
    rental: z.object({
      flatScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
      curvedScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1), curveMin: z.coerce.number().max(0), curveMax: z.coerce.number().min(0) }),
      screen360: z.object({ maxDiameter: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
    }).optional(),
  }).optional(),
});

const wizardProjectTypeSettingSchema = z.object({
  enabled: z.boolean(),
  imageUrl: z.string().optional(),
});

const wizardEnvironmentSettingSchema = z.object({
  imageUrl: z.string().optional(),
});

const viewingDistanceOptionSchema = z.object({
  id: z.string(),
  value: z.string().min(1, "Value cannot be empty."),
  recommended: z.boolean().optional(),
});

const pixelPitchOptionSchema = z.object({
  id: z.string(),
  value: z.string().min(1, "Value cannot be empty."),
  recommended: z.boolean(),
});

const wizardSettingsSchema = z.object({
  projectTypes: z.object({
    location: wizardProjectTypeSettingSchema,
    vente: wizardProjectTypeSettingSchema,
  }),
  environments: z.object({
    interieur: wizardEnvironmentSettingSchema,
    'semi-exterieur': wizardEnvironmentSettingSchema,
    exterieur: wizardEnvironmentSettingSchema,
  }),
  viewingDistanceImageUrl: z.string().optional(),
  viewingDistances: z.array(viewingDistanceOptionSchema),
  pixelPitchImageUrl: z.string().optional(),
  pixelPitches: z.array(pixelPitchOptionSchema),
});

export async function getSettings(): Promise<Settings> {
  // Serve from in-memory cache if still fresh
  if (_settingsCache && Date.now() - _settingsCache.timestamp < SETTINGS_CACHE_TTL_MS) {
    return _settingsCache.data;
  }

  const { adminDb } = getFirebaseAdmin();
  const defaultSettings: Settings = {
    defaultWidth: 20,
    defaultHeight: 10,
    maxWidth: 20,
    maxHeight: 10,
    maxRentalWidth: 6,
    maxRentalHeight: 5,
    maxProductsPerQuote: 3,
    previewScreenImageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Fpreview-screen.mp4?alt=media&token=c198b18a-40d6-4a25-950c-e2b26a6358d7',
    emergencyStopEnabled: false,
    emergencyReturnUrl: 'https://mahboubidz.com/',
    emergencyStopMessage: "Pour des raisons de maintenance, notre outil d'estimation en ligne est actuellement suspendu. Veuillez nous excuser pour la gêne occasionnée.",
    congratulationsTitle: { fr: "🌟🌟 Félicitations ! 🌟🌟", en: "🌟🌟 Congratulations! 🌟🌟" },
    congratulationsMessage: { fr: "Votre demande d'estimation a bien été envoyée. Un commercial vous contactera dans les plus brefs délais pour discuter de votre projet.", en: "Your quote request has been sent successfully. A sales representative will contact you shortly to discuss your project." },
    deliveryTitle: { fr: "Livraison", en: "Delivery" },
    deliveryMessage: { fr: "Choisissez le lieu de livraison pour calculer les frais.", en: "Choose the delivery location to calculate fees." },
    installationTitle: { fr: "Installation", en: "Installation" },
    installationMessage: { fr: "Souhaitez-vous inclure l'installation par nos techniciens ?", en: "Would you like to include installation by our technicians?" },
    disclaimerMessage: { fr: "L'entreprise PIXIATECH décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.", en: "PIXIATECH declines all responsibility for any problem related to an installation not carried out by its technicians." },
    quoteFormNotesPlaceholder: { fr: "Merci de préciser l’environnement d’installation, afin que nous vous proposions la solution la plus adaptée.", en: "Please specify the installation environment, so we can offer you the most suitable solution." },
    isDeliveryStepEnabled: true,
    isInstallationStepEnabled: true,
    isEmailVerificationEnabled: true,
    isPriceHidden: false,
    isSingleSessionEnabled: false,
    zoomMaxDistance: 50,
    zoomMinDistance: 0.5,
    isWizardBotEnabled: true,
    hintBubble: {
      enabled: true,
      text: "Pour démarrer, veuillez cliquer sur<br /> le bouton <b>+ Ajouter un produit</b>.",
      desktopBottom: 30,
      desktopRight: 24,
      mobileBottom: 41,
      mobileRight: 8,
      duration: 0
    },
    lightThemeId: '',
    darkThemeId: '',
    estimationFlow: {
      enableRentalPeriod: true,
      enableDigitalSignature: true,
      enableContractEditing: false,
      companySignatureDataUrl: '',
      taxEnabled: false,
      taxRate: 19,
      taxMode: 'ht',
      sale: {
        maxProductsPerQuote: 3,
        flatScreen: { maxWidth: 20, maxHeight: 10 },
        curvedScreen: { maxWidth: 20, maxHeight: 10, curveMin: -30, curveMax: 30 },
        screen360: { maxDiameter: 10, maxHeight: 8 },
      },
      rental: {
        flatScreen: { maxWidth: 6, maxHeight: 5 },
        curvedScreen: { maxWidth: 6, maxHeight: 5, curveMin: -30, curveMax: 30 },
        screen360: { maxDiameter: 6, maxHeight: 5 },
      },
    },
  };

  try {
    const docRef = adminDb.collection('settings').doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && '_seconds' in value) {
          return new Timestamp(value._seconds, value._nanoseconds).toDate().toISOString();
        }
        return value;
      }));
      const merged = { ...defaultSettings, ...serializedData };
      _settingsCache = { data: merged, timestamp: Date.now() };
      return merged;
    } else {
      await docRef.set(defaultSettings);
      _settingsCache = { data: defaultSettings, timestamp: Date.now() };
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    return defaultSettings;
  }
}

export async function updateSettings(data: unknown) {
  const result = settingsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(SETTINGS_DOC_ID).set(result.data, { merge: true });

    // Check if a YouTube URL is configured
    const videoUrl = result.data.previewScreenVideoUrl || result.data.previewScreenImageUrl;
    const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
    if (isYouTube) {
      console.log('[updateSettings] Detected YouTube URL, triggering download...');
      const scriptPath = path.join(process.cwd(), 'scratch', 'download_youtube.py');
      exec(`python "${scriptPath}" "${videoUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('[updateSettings] Error running download_youtube.py:', error);
        } else {
          console.log('[updateSettings] download_youtube.py output:', stdout);
        }
      });
    }

    _settingsCache = null;
    logAdminActivity({
      action: 'Modification paramètres',
      category: 'settings',
      details: 'Mise à jour des paramètres généraux',
    });
    revalidatePath('/admin/settings', 'layout');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update settings in Firestore:', error);
    return { success: false, error: { formErrors: ['Failed to save settings.'] } };
  }
}

export async function getSmtpSettings() {
  return await getSmtpSettingsDb();
}

export async function updateSmtpSettings(data: any) {
  const res = await updateSmtpSettingsDb(data);
  if (res.success) {
    revalidatePath('/admin/settings', 'layout');
  }
  return res;
}


// --- Dedicated Sidebar Config Action (for partial updates: order + logo) ---

const sidebarConfigSchema = z.object({
  sidebarOrder: z.array(z.string()).optional(),
  logoConfig: z.object({
    text: z.string(),
    letter: z.string(),
    color: z.string(),
    image: z.string().nullable(),
  }).optional(),
});

export async function saveSidebarConfig(data: unknown) {
  // Verify caller is admin
  const currentUser = await getCurrentAdminUser();
  if (!currentUser || 'error' in currentUser || currentUser.role !== 'admin') {
    return { success: false, error: 'Access denied. Only an administrator can modify this configuration.' };
  }

  const result = sidebarConfigSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(SETTINGS_DOC_ID).set(result.data, { merge: true });
    logAdminActivity({
      action: 'Modification sidebar',
      category: 'settings',
      details: 'Configuration de la barre latérale mise à jour',
    });
    revalidatePath('/admin', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to save sidebar config in Firestore:', error);
    return { success: false, error: 'Failed to save configuration.' };
  }
}

export async function getWizardSettings(): Promise<WizardSettings> {
  const { adminDb } = getFirebaseAdmin();

  const defaultSettings: WizardSettings = {
    projectTypes: {
      location: { enabled: true, imageUrl: 'https://picsum.photos/seed/led-location/800/600' },
      vente: { enabled: true, imageUrl: 'https://picsum.photos/seed/led-sale/800/600' },
    },
    environments: {
      interieur: { imageUrl: 'https://picsum.photos/seed/led-interior/800/1200' },
      'semi-exterieur': { imageUrl: 'https://picsum.photos/seed/led-semi-outdoor/800/1200' },
      exterieur: { imageUrl: 'https://picsum.photos/seed/led-outdoor/800/1200' },
    },
    viewingDistanceImageUrl: 'https://picsum.photos/seed/led-viewing-distance/800/1200',
    viewingDistances: [
      { id: 'vd0', value: '0-0.5m' },
      { id: 'vd1', value: '0.5-2m' },
      { id: 'vd2', value: '2-5m' },
      { id: 'vd3', value: '5-10m' },
      { id: 'vd4', value: '10-20m' },
      { id: 'vd5', value: '20-50m' },
      { id: 'vd6', value: '+50m' },
    ],
    pixelPitchImageUrl: 'https://picsum.photos/seed/led-pixel-pitch/800/1200',
    pixelPitches: [
      { id: 'pp1', value: 'P1.2', recommended: false },
      { id: 'pp2', value: 'P1.5', recommended: false },
      { id: 'pp3', value: 'P2', recommended: false },
      { id: 'pp4', value: 'P2.5', recommended: true },
      { id: 'pp5', value: 'P3', recommended: false },
      { id: 'pp6', value: 'P4', recommended: false },
      { id: 'pp7', value: 'P5', recommended: false },
      { id: 'pp8', value: 'P6', recommended: false },
      { id: 'pp9', value: 'P8', recommended: false },
      { id: 'pp10', value: 'P10', recommended: false },
      { id: 'pp11', value: 'P16', recommended: false },
      { id: 'pp12', value: 'P18', recommended: false },
      { id: 'pp13', value: 'P19', recommended: false },
    ],
  };

  try {
    const docRef = adminDb.collection('settings').doc(WIZARD_SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const dbData = docSnap.data() as Partial<WizardSettings> | undefined;
      // Deep merge structure-level keys but use Firestore arrays AS-IS (no default injection)
      // so that deletions made by the user are respected after page refresh.
      const mergedData: WizardSettings = {
        projectTypes: {
          location: { ...defaultSettings.projectTypes.location, ...dbData?.projectTypes?.location },
          vente: { ...defaultSettings.projectTypes.vente, ...dbData?.projectTypes?.vente },
        },
        environments: {
          interieur: { ...defaultSettings.environments.interieur, ...dbData?.environments?.interieur },
          'semi-exterieur': { ...defaultSettings.environments['semi-exterieur'], ...dbData?.environments?.['semi-exterieur'] },
          exterieur: { ...defaultSettings.environments.exterieur, ...dbData?.environments?.exterieur },
        },
        viewingDistanceImageUrl: dbData?.viewingDistanceImageUrl ?? defaultSettings.viewingDistanceImageUrl,
        // Use Firestore array directly — do NOT merge with defaults to preserve user deletions
        viewingDistances: dbData?.viewingDistances ?? defaultSettings.viewingDistances,
        pixelPitchImageUrl: dbData?.pixelPitchImageUrl ?? defaultSettings.pixelPitchImageUrl,
        // Use Firestore array directly — do NOT merge with defaults to preserve user deletions
        pixelPitches: dbData?.pixelPitches ?? defaultSettings.pixelPitches,
      };
      return mergedData;
    } else {
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching wizard settings from Firestore:", error);
    return defaultSettings;
  }
}

export async function updateWizardSettings(data: unknown) {
  const result = wizardSettingsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(WIZARD_SETTINGS_DOC_ID).set(result.data, { merge: true });
    revalidatePath('/admin/wizard', 'layout');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to update wizard settings in Firestore:', error);
    return { success: false, error: { formErrors: ['Failed to save wizard settings.'] } };
  }
}

// --- Theme Actions ---

const defaultThemes: Omit<Theme, 'id' | 'createdAt'>[] = DEFAULT_PALETTES;

export async function getThemes(): Promise<Theme[]> {
  // Serve from in-memory cache if still fresh
  if (_themesCache && Date.now() - _themesCache.timestamp < THEMES_CACHE_TTL_MS) {
    return _themesCache.data;
  }

  const { adminDb, FieldValue } = getFirebaseAdmin();
  try {
    const snapshot = await adminDb.collection('themes').orderBy('createdAt', 'asc').get();
    let themes: Theme[];
    if (snapshot.empty) {
      // If no themes exist, create the default ones
      const batch = adminDb.batch();
      const createdThemes: Theme[] = [];
      defaultThemes.forEach(themeData => {
        const docRef = adminDb.collection('themes').doc(); // Auto-generate ID
        const newTheme = {
          ...themeData,
          createdAt: FieldValue.serverTimestamp()
        };
        batch.set(docRef, newTheme);
        // We can't get the server timestamp client-side, so we create a placeholder date
        createdThemes.push({ ...themeData, id: docRef.id, createdAt: new Date() });
      });
      await batch.commit();
      themes = createdThemes;
    } else {
      themes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        } as Theme;
      });
    }
    _themesCache = { data: themes, timestamp: Date.now() };
    return themes;
  } catch (error) {
    console.error("Error fetching themes:", error);
    return []; // Return empty array on error
  }
}

export async function saveTheme(theme: Partial<Omit<Theme, 'createdAt'>> & { name: string; colors: Theme['colors']; }) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  try {
    let docRef;
    if (theme.id) {
      docRef = adminDb.collection('themes').doc(theme.id);
    } else {
      docRef = adminDb.collection('themes').doc(); // Let Firestore auto-generate the ID
    }

    const dataToSave: any = { ...theme };
    if (!dataToSave.id) {
      dataToSave.id = docRef.id;
    }
    delete dataToSave.id;

    if (!('createdAt' in theme)) {
      dataToSave.createdAt = FieldValue.serverTimestamp();
    }

    await docRef.set(dataToSave, { merge: true });

    const savedDoc = await docRef.get();
    const savedData = savedDoc.data();

    if (savedData && savedData.createdAt instanceof Timestamp) {
      return { success: true, theme: { ...savedData, id: savedDoc.id, createdAt: savedData.createdAt.toDate().toISOString() } };
    }

    return { success: true, theme: { ...savedData, id: savedDoc.id } as Theme };

  } catch (error) {
    console.error("Error saving theme:", error);
    return { success: false, error: (error as Error).message };
  }
}


export async function deleteTheme(themeId: string) {
  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('themes').doc(themeId).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting theme:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function reinitializePalettes() {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  try {
    const existing = await adminDb.collection('themes').get();
    const batch = adminDb.batch();
    existing.docs.forEach(doc => batch.delete(doc.ref));
    DEFAULT_PALETTES.forEach(palette => {
      const docRef = adminDb.collection('themes').doc();
      batch.set(docRef, {
        ...palette,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    _themesCache = null;
    revalidatePath('/admin/settings/themes', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error reinitializing palettes:", error);
    return { success: false, error: (error as Error).message };
  }
}

const ACTIVE_THEME_DOC_ID = 'global';

export async function getActiveGlobalTheme(): Promise<{ themeId: string }> {
  const { adminDb } = getFirebaseAdmin();
  try {
    const doc = await adminDb.collection('settings').doc(ACTIVE_THEME_DOC_ID).get();
    const data = doc.data();
    const defaultName = (await import('@/lib/color-palettes')).DEFAULT_PALETTES[0].name;
    return { themeId: data?.activeThemeId || defaultName };
  } catch (error) {
    console.error("Error fetching active theme:", error);
    return { themeId: 'Nuage' };
  }
}

export async function setActiveGlobalTheme(themeId: string) {
  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(ACTIVE_THEME_DOC_ID).set({ activeThemeId: themeId }, { merge: true });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error setting active theme:", error);
    return { success: false, error: (error as Error).message };
  }
}

// --- Delivery Actions ---

const deliveryRuleSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  cityId: z.string().optional(),
  fee: z.coerce.number().min(0),
});

const deliverySettingsSchema = z.object({
  defaultFee: z.coerce.number().min(0),
  isDefaultFeeEnabled: z.boolean(),
  isFreeDeliveryEnabled: z.boolean(),
  freeDeliveryThreshold: z.coerce.number().min(0),
  deliveryFeeRules: z.array(deliveryRuleSchema),
  isTotalFreeDeliveryEnabled: z.boolean().optional(),
  unconfiguredZoneMessage: z.string().optional(),
});

export const getDeliverySettings = cache(async (): Promise<DeliverySettings> => {
  const { adminDb } = getFirebaseAdmin();
  const defaults: DeliverySettings = {
    defaultFee: 600,
    isDefaultFeeEnabled: false,
    isFreeDeliveryEnabled: false,
    freeDeliveryThreshold: 10000,
    deliveryFeeRules: [],
    isTotalFreeDeliveryEnabled: false,
    unconfiguredZoneMessage: "Cette zone n’est pas encore configurée dans notre système. Un tarif personnalisé vous sera communiqué rapidement après vérification."
  };
  try {
    const docRef = adminDb.collection('settings').doc(DELIVERY_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { ...defaults, ...docSnap.data() };
    } else {
      await docRef.set(defaults);
      return defaults;
    }
  } catch (error) {
    console.error("Error fetching delivery settings from Firestore:", error);
    return defaults;
  }
});

export async function updateDeliverySettings(data: unknown) {
  const result = deliverySettingsSchema.safeParse(data);
  if (!result.success) {
    console.error("Zod validation failed:", result.error.flatten());
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(DELIVERY_DOC_ID).set(result.data, { merge: true });
    revalidatePath('/admin/delivery', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to update delivery settings in Firestore:', error);
    return { success: false, error: { formErrors: ['Failed to save delivery settings.'] } };
  }
}

// --- Labor Actions ---

const laborRuleSchema = z.object({
  id: z.string(),
  minSqM: z.coerce.number().min(0),
  technicians: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
});

const laborSettingsSchema = z.object({
  rules: z.array(laborRuleSchema),
});

export const getLaborSettings = cache(async (): Promise<LaborSettings> => {
  const { adminDb } = getFirebaseAdmin();
  const defaults: LaborSettings = {
    rules: [
      { id: 'default_1', minSqM: 2, technicians: 2, price: 200 },
      { id: 'rule_1762391030432', minSqM: 4, technicians: 3, price: 300 },
      { id: 'rule_1762391040555', minSqM: 8, technicians: 4, price: 400 },
      { id: 'rule_1762593299199', minSqM: 10, technicians: 5, price: 500 },
    ],
  };
  try {
    const docRef = adminDb.collection('settings').doc(LABOR_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data() as LaborSettings;
    } else {
      await docRef.set(defaults);
      return defaults;
    }
  } catch (error) {
    console.error("Error fetching labor settings from Firestore:", error);
    return defaults;
  }
});

export async function updateLaborSettings(data: unknown) {
  const result = laborSettingsSchema.safeParse(data);
  if (!result.success) {
    console.error("Zod validation failed:", result.error.flatten());
    return { success: false, error: result.error.flatten() };
  }

  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc(LABOR_DOC_ID).set(result.data, { merge: true });
    revalidatePath('/admin/labor');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update labor settings in Firestore:', error);
    return { success: false, error: { formErrors: ['Failed to save labor settings.'] } };
  }
}

// --- Locations Actions ---
export async function getLocations(): Promise<Locations> {
  const { adminDb } = getFirebaseAdmin();
  const citiesSnapshot = await adminDb.collection('cities').get();
  const cities = citiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return Promise.resolve({ villes: cities as any });
}


export async function getSessionUid() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return { uid: null };

  try {
    const { adminAuth } = getFirebaseAdmin();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    return { uid: decoded.uid };
  } catch {
    return { uid: null };
  }
}

export async function verifySession() {
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const sessionCookie = (await cookies()).get('session')?.value;
  const sessionTokenCookie = (await cookies()).get('sessionToken')?.value;

  if (!sessionCookie) {
    return { valid: false, reason: 'no_session' };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const uid = decoded.uid;

    // Read settings directly from Firestore to bypass the 30s cache in getSettings()
    let isSingleSession = false;
    try {
      const settingsDoc = await adminDb.collection('settings').doc(SETTINGS_DOC_ID).get();
      const settingsData = settingsDoc.data();
      isSingleSession = settingsData?.isSingleSessionEnabled === true;
    } catch {
      // Fail-safe: if we can't read settings, don't enforce single session
    }
    if (!isSingleSession) {
      return { valid: true, uid };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { valid: false, reason: 'user_not_found' };
    }

    const userData = userDoc.data();
    const storedToken = userData?.sessionToken;

    // Only disconnect if a stored token exists and doesn't match the cookie
    if (storedToken && storedToken !== sessionTokenCookie) {
      return { valid: false, reason: 'session_mismatch', uid, sessionCreatedAt: userData?.sessionCreatedAt ?? null };
    }

    return { valid: true, uid };
  } catch (error) {
    console.error('[verifySession] Error:', error);
    return { valid: false, reason: 'error' };
  }
}

export const getCurrentAdminUser = cache(async (): Promise<UserProfile | { error: string } | null> => {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;

  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    throw new Error("Admin SDK not initialized");
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data() as DocumentData;

    if (userData.status === 'pending') {
      return { error: 'pending' };
    }

    return {
      uid: decodedClaims.uid,
      email: userData.email,
      displayName: userData.displayName || userData.email,
      role: userData.role,
      status: userData.status,
      phone: userData.phone,
      photoURL: userData.photoURL,
      createdAt: userData.createdAt,
      originalAdminUid: decodedClaims.original_admin_uid,
    };

  } catch (error) {
    console.error("Error fetching current admin user:", error);
    return null;
  }
});
async function urlToDataUri(url: string | undefined): Promise<string> {
  if (!url) return '';
  return '';
}

export async function impersonateUser(targetUserId: string) {
  const { adminAuth } = getFirebaseAdmin();

  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) {
    return { success: false, error: 'Access denied. Invalid session.' };
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);

    const originalAdminUid = decodedClaims.original_admin_uid || decodedClaims.uid;
    const originalAdminUserRecord = await adminAuth.getUser(originalAdminUid);

    if (originalAdminUserRecord.customClaims?.role !== 'admin') {
      return { success: false, error: 'Access denied. Only an administrator can use this function.' };
    }

    const impersonationToken = await adminAuth.createCustomToken(targetUserId, {
      original_admin_uid: originalAdminUid,
    });

    return { success: true, token: impersonationToken };
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return { success: false, error: error.message || 'Une erreur est survenue lors de l\'impersonation.' };
  }
}

export async function getAllUsers() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return [];

  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    await adminAuth.verifySessionCookie(sessionCookie, false);
    const snap = await adminDb.collection('users').get();
    return JSON.parse(JSON.stringify(snap.docs.map(d => ({ uid: d.id, ...d.data() }))));
  } catch (error) {
    console.error('[getAllUsers] Error:', error);
    return [];
  }
}

export async function logAdminActivity(params: {
  action: string;
  category: ActivityLogEntry['category'];
  details: string;
  targetId?: string;
  targetName?: string;
}): Promise<void> {
  try {
    const { adminDb, FieldValue } = getFirebaseAdmin();
    const auth = await getAuth();
    if (!auth) return;
    const cookie = await getAuthCookie();
    const adminUser = await auth.verifyIdToken(cookie);
    const entry = {
      userId: adminUser.uid,
      userName: adminUser.name || adminUser.email || 'Admin',
      userPhotoUrl: adminUser.picture || '',
      userRole: adminUser.role || 'admin',
      action: params.action,
      category: params.category,
      details: params.details,
      targetId: params.targetId || '',
      targetName: params.targetName || '',
      timestamp: FieldValue.serverTimestamp(),
    };
    await adminDb.collection('activityLogs').add(entry);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function getActivityLogs(options?: {
  limit?: number;
  category?: string;
  userId?: string;
}): Promise<ActivityLogEntry[]> {
  try {
    const { adminDb } = getFirebaseAdmin();
    let query: FirebaseFirestore.Query = adminDb.collection('activityLogs').orderBy('timestamp', 'desc');
    if (options?.category) query = query.where('category', '==', options.category);
    if (options?.userId) query = query.where('userId', '==', options.userId);
    if (options?.limit) query = query.limit(options.limit);
    const snap = await query.get();
    return snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId || '',
        userName: d.userName || '',
        userPhotoUrl: d.userPhotoUrl || '',
        userRole: d.userRole || '',
        action: d.action || '',
        category: d.category || 'other',
        details: d.details || '',
        targetId: d.targetId || '',
        targetName: d.targetName || '',
        timestamp: d.timestamp?.toDate?.() || new Date(),
        createdAt: d.timestamp,
      } as ActivityLogEntry;
    });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}

async function getAuthCookie(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('__session')?.value || '';
}

async function getAuth() {
  try {
    const { getAuth } = await import('firebase-admin/auth');
    return getAuth();
  } catch {
    return null;
  }
}

export async function resetEstimationCounter(newNumber: number): Promise<{ success: boolean; error?: string }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    const counterRef = adminDb.collection('counters').doc('quoteNumber');
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);
      const current = doc.data()?.current ?? 0;
      transaction.set(counterRef, { current: newNumber - 1 }, { merge: true });
    });
    logAdminActivity({
      action: 'Réinitialisation compteur',
      category: 'counter',
      details: `Compteur d'estimations réinitialisé à ${newNumber}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error resetting estimation counter:', error);
    return { success: false, error: 'Failed to reset counter' };
  }
}
