
import admin from "firebase-admin";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const firebaseConfig = {
  "projectId": "studio-9205859220-a6440",
  "storageBucket": "studio-9205859220-a6440.firebasestorage.app",
};

const projectId = process.env.ADMIN_PROJECT_ID || firebaseConfig.projectId;
const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in .env");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
  storageBucket: firebaseConfig.storageBucket,
});

const db = getFirestore(app);

async function wipeChats() {
  console.log("Starting full chat wipe...");
  
  const chatsRef = db.collection('chats');
  const chatsSnapshot = await chatsRef.get();
  
  if (chatsSnapshot.empty) {
    console.log("No chats found.");
    return;
  }
  
  console.log(`Found ${chatsSnapshot.size} chats to delete.`);
  
  for (const chatDoc of chatsSnapshot.docs) {
    const chatId = chatDoc.id;
    console.log(`Deleting chat: ${chatId}`);
    
    // Delete messages subcollection
    const messagesRef = chatDoc.ref.collection('messages');
    const messagesSnapshot = await messagesRef.get();
    
    const batch = db.batch();
    messagesSnapshot.docs.forEach(mDoc => {
      batch.delete(mDoc.ref);
    });
    
    // Delete chat document
    batch.delete(chatDoc.ref);
    
    await batch.commit();
    console.log(`Successfully deleted chat ${chatId} and its ${messagesSnapshot.size} messages.`);
  }
  
  console.log("Wipe completed successfully.");
}

wipeChats().catch(console.error);
