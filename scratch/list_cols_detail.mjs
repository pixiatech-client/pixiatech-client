
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

async function listCollectionsDetail() {
  const collections = await db.listCollections();
  for (const col of collections) {
    const snapshot = await col.limit(1).get();
    console.log(`Collection: "${col.id}" (Size: ${snapshot.size > 0 ? '>0' : '0'})`);
  }
}

listCollectionsDetail().catch(console.error);
