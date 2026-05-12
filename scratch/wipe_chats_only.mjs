
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

async function wipeChatsOnly() {
  console.log("Wiping chats and notifications only...");

  const chatsRef = db.collection('chats');
  const chatsSnap = await chatsRef.get();
  for (const doc of chatsSnap.docs) {
    // Delete messages subcollection
    const messagesSnap = await doc.ref.collection('messages').get();
    const batch = db.batch();
    messagesSnap.docs.forEach(m => batch.delete(m.ref));
    batch.delete(doc.ref);
    await batch.commit();
  }
  console.log(`Deleted ${chatsSnap.size} chats.`);

  const notifRef = db.collection('notifications');
  let deletedNotif = 0;
  while (true) {
    const snap = await notifRef.limit(500).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deletedNotif += snap.size;
  }
  console.log(`Deleted ${deletedNotif} notifications.`);
  console.log("Wipe complete.");
}

wipeChatsOnly().catch(console.error);
