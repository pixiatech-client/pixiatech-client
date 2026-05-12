
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

async function checkChats() {
  const chatsRef = db.collection('chats');
  const snapshot = await chatsRef.get();
  console.log(`Total chats: ${snapshot.size}`);
  snapshot.docs.forEach(doc => {
    console.log(`Chat ID: ${doc.id}, Participants: ${doc.data().participants}`);
  });
}

checkChats().catch(console.error);
