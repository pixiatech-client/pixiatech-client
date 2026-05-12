
import admin from "firebase-admin";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  "projectId": "studio-9205859220-a6440",
};

const projectId = process.env.ADMIN_PROJECT_ID || firebaseConfig.projectId;
const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

async function recoverUsersFromAuth() {
  console.log("Starting user recovery from Auth...");
  
  const listUsersResult = await auth.listUsers();
  console.log(`Found ${listUsersResult.users.length} users in Auth.`);
  
  for (const userRecord of listUsersResult.users) {
    if (!userRecord.displayName && !userRecord.email) continue;

    console.log(`Recovering Firestore doc for: ${userRecord.displayName} [${userRecord.uid}]`);
    
    const existingSnap = await db.collection('users').doc(userRecord.uid).get();
    let role = 'commercial';
    let permissions = { canChat: true };

    if (existingSnap.exists) {
      const data = existingSnap.data();
      role = data.role || 'commercial';
      permissions = data.permissions || { canChat: true };
    } else {
      if (userRecord.displayName?.toLowerCase().includes('admin')) role = 'admin';
      if (userRecord.displayName?.toLowerCase().includes('fournisseur') || userRecord.displayName?.toLowerCase().includes('teste')) role = 'fournisseur';
    }

    // Special case for PIXIATECH
    if (userRecord.displayName === 'PIXIATECH' || userRecord.uid === 'bz3w95zTWVMWiQm968dw4f8PkMP2') {
      role = 'admin';
    }

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || 'Utilisateur',
      photoURL: userRecord.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userRecord.uid}`,
      role: role,
      isOnline: false,
      permissions: permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  console.log("User recovery complete.");
}

recoverUsersFromAuth().catch(console.error);
