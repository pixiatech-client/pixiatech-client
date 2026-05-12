
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

async function listUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  console.log(`Total users: ${snapshot.size}`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.displayName} (${data.role}) [ID: ${doc.id}]`);
  });
}

listUsers().catch(console.error);
