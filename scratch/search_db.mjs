
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

async function searchDatabase(searchTerm) {
  const collections = await db.listCollections();
  console.log(`Searching for "${searchTerm}" in ${collections.length} collections...`);
  
  for (const col of collections) {
    console.log(`Checking collection: ${col.id}`);
    const snapshot = await col.get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const strData = JSON.stringify(data);
      if (strData.includes(searchTerm)) {
        console.log(`FOUND in [${col.id}] document [${doc.id}]:`, data);
      }
      
      // Also check subcollections
      const subCols = await doc.ref.listCollections();
      for (const subCol of subCols) {
         const subSnap = await subCol.get();
         for (const subDoc of subSnap.docs) {
           const subData = subDoc.data();
           if (JSON.stringify(subData).includes(searchTerm)) {
             console.log(`FOUND in [${col.id}/${doc.id}/${subCol.id}] document [${subDoc.id}]:`, subData);
           }
         }
      }
    }
  }
  console.log("Search complete.");
}

searchDatabase("Refond").catch(console.error);
