
import admin from "firebase-admin";
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue, Timestamp, AggregateField } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from "@/firebase/config";

interface FirebaseAdminServices {
  app: App;
  adminAuth: Auth;
  adminDb: Firestore;
  FieldValue: typeof FieldValue;
  Timestamp: typeof Timestamp;
  AggregateField: typeof AggregateField;
}

let services: FirebaseAdminServices | null = null;

function getFirestoreInstance(app: App): Firestore {
  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // déjà configuré
  }
  return db;
}

function initializeAdminApp(): FirebaseAdminServices {
  console.log('[Admin SDK] Initializing Admin App...');
  if (getApps().length > 0) {
    const defaultApp = getApps()[0];
    if (defaultApp) {
        console.log('[Admin SDK] Using existing Firebase app instance.');
        return {
            app: defaultApp,
            adminAuth: getAuth(defaultApp),
            adminDb: getFirestoreInstance(defaultApp),
            FieldValue: FieldValue,
            Timestamp: Timestamp,
            AggregateField: AggregateField,
        };
    }
  }

  const projectId = process.env.ADMIN_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  console.log('[Admin SDK] Environment Variables Check:', {
    projectId: projectId ? 'PRESENT' : 'MISSING',
    clientEmail: clientEmail ? 'PRESENT' : 'MISSING',
    privateKey: privateKey ? 'PRESENT' : 'MISSING',
  });

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[Admin SDK] Environment variables missing. Falling back to Application Default Credentials (ADC)."
    );
    try {
      const app = initializeApp({ projectId, storageBucket: firebaseConfig.storageBucket });
      console.log('[Admin SDK] Initialized with ADC successfully.');
      return {
          app,
          adminAuth: getAuth(app),
          adminDb: getFirestoreInstance(app),
          FieldValue: FieldValue,
          Timestamp: Timestamp,
          AggregateField: AggregateField,
      }
    } catch (err: any) {
      console.error('[Admin SDK] ADC Initialization failed:', err);
      throw err;
    }
  }

  try {
    console.log('[Admin SDK] Attempting to initialize with Service Account...');
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: firebaseConfig.storageBucket,
    });
    console.log("[Admin SDK] Initialized successfully with service account.");
    return {
      app,
      adminAuth: getAuth(app),
      adminDb: getFirestoreInstance(app),
      FieldValue: FieldValue,
      Timestamp: Timestamp,
      AggregateField: AggregateField,
    };
  } catch (error) {
    console.error("[Admin SDK] Service Account Initialization failed:", error);
    throw error;
  }
}

export function getFirebaseAdmin(): FirebaseAdminServices {
    if (!services) {
        services = initializeAdminApp();
    }
    return services;
}

export async function verifyAdminSession(): Promise<{ ok: boolean; uid?: string; error?: string; status?: number }> {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    const sessionCookie = (await (await import('next/headers')).cookies()).get('session')?.value;
    if (!sessionCookie) {
      return { ok: false, error: 'Non authentifié', status: 401 };
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { ok: false, error: 'Non autorisé', status: 403 };
    }

    return { ok: true, uid: decoded.uid };
  } catch (err: any) {
    console.error('[verifyAdminSession] Error:', err);
    return { ok: false, error: err.message || 'Erreur d\'authentification', status: 401 };
  }
}

