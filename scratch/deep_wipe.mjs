
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

async function deepWipe() {
  console.log("Starting deep wipe...");

  // 1. Delete all users except PIXIATECH and Super admin
  const usersToKeep = ["bz3w95zTWVMWiQm968dw4f8PkMP2", "ePjW4gMIAoaNQeDYRegQ7QYDkdP2"];
  const usersRef = db.collection('users');
  const usersSnap = await usersRef.get();
  for (const doc of usersSnap.docs) {
    if (!usersToKeep.includes(doc.id)) {
      console.log(`Deleting user: ${doc.data().displayName} [${doc.id}]`);
      await doc.ref.delete();
    }
  }

  // 2. Delete all chats (again, just in case)
  const chatsRef = db.collection('chats');
  const chatsSnap = await chatsRef.get();
  for (const doc of chatsSnap.docs) {
    console.log(`Deleting chat: ${doc.id}`);
    await doc.ref.delete();
  }

  // 3. Delete all notifications (1268 is a lot, let's use batches)
  console.log("Deleting notifications...");
  const notifRef = db.collection('notifications');
  let deletedCount = 0;
  while (true) {
    const q = notifRef.limit(500);
    const snap = await q.get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deletedCount += snap.size;
    console.log(`Deleted ${deletedCount} notifications...`);
  }

  console.log("Deep wipe completed.");
}

deepWipe().catch(console.error);
