
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

async function countChats() {
  const chatsRef = db.collection('chats');
  const snapshot = await chatsRef.get();
  console.log(`Total chats in collection 'chats': ${snapshot.size}`);
  
  // Also check if there are other collections that might contain chats
  const collections = await db.listCollections();
  console.log("Root collections:", collections.map(c => c.id));
}

countChats().catch(console.error);
