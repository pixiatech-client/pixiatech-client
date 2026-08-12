
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  "apiKey": "AIzaSyCG55rqyEmmiA8dT_kBoqYPrlgcGA7Ws94",
  "authDomain": "pixiatech-client.firebaseapp.com",
  "projectId": "pixiatech-client",
  "storageBucket": "pixiatech-client.firebasestorage.app",
  "messagingSenderId": "72844010087",
  "appId": "1:72844010087:web:5e16bf3f7d1007640feac2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, firestore, auth, storage };
