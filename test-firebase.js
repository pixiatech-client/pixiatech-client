// Test Firestore connection and rules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAW6cWb29qnlIS8Hb8RAWlv4KDxgqw-bM8",
  authDomain: "studio-9205859220-a6440.firebaseapp.com",
  projectId: "studio-9205859220-a6440",
  storageBucket: "studio-9205859220-a6440.firebasestorage.app",
  messagingSenderId: "517372546955",
  appId: "1:517372546955:web:f420d5047e9ab05184298e"
};

async function test() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firestore initialized');
    
    console.log('Testing chats collection access...');
    const chatsRef = collection(db, 'chats');
    const snapshot = await getDocs(chatsRef);
    console.log('Success! Found', snapshot.size, 'chats');
    snapshot.forEach(doc => {
      console.log('Chat:', doc.id, '->', doc.data());
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

test();