
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  "apiKey": "AIzaSyBCXX0SNvwwBHYrP1Z0NAoas3M9-Q5BC58",
  "authDomain": "studio-9205859220-a6440.firebaseapp.com",
  "projectId": "studio-9205859220-a6440",
  "storageBucket": "studio-9205859220-a6440.firebasestorage.app",
  "messagingSenderId": "517372546955",
  "appId": "1:517372546955:web:528447152b2482aa84298e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, firestore, auth, storage };
