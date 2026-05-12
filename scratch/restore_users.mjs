
import admin from "firebase-admin";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const usersToRestore = [
  { id: "2yV0AMcFbKfRlJYuFH77cuEcabt1", displayName: "AliExpress TrendyFinds", role: "commercial" },
  { id: "7zZxDuDHlnfzTIBcQhYaRlC7iMa2", displayName: "amine", role: "commercial" },
  { id: "UOF34EcE6KUylRTcYrwldrMxtQz2", displayName: "A in", role: "fournisseur" },
  { id: "cYelyV2nMigW7V92kZEz25zt4RP2", displayName: "virtual realitymakers", role: "commercial" },
  { id: "kAtIrRwCjsRqwlZjYPhGZEHU22x2", displayName: "teste", role: "fournisseur" },
  { id: "pOb4mw2hnmf6qh5RlyNrdD9PeUZ2", displayName: "dfsdfsdf", role: "fournisseur" },
  { id: "uRcWUfpitjWU9TOQo0AsDgkUepA3", displayName: "Promedia audiovisuelles", role: "commercial" },
  { id: "uuqrHRi0zmNzWDXhhEf3Cqnxokh2", displayName: "Fournisseur 0001", role: "fournisseur" }
];

async function restoreUsers() {
  console.log("Restoring users...");
  for (const user of usersToRestore) {
    const userRef = db.collection('users').doc(user.id);
    await userRef.set({
      displayName: user.displayName,
      role: user.role,
      isOnline: false,
      permissions: { canChat: true },
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Restored: ${user.displayName}`);
  }
  console.log("Restoration complete.");
}

restoreUsers().catch(console.error);
