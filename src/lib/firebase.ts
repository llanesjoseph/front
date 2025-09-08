import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDRfuKkdqVYA9wPiTPXr4CYN1WtX84nG5o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "passon-784d6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "passon-784d6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "passon-784d6.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "86839944740",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:86839944740:web:4b5a623ac0c5df2cef9ab1",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
