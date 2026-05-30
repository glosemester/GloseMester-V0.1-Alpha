/**
 * Firebase-oppsett for v3.
 *
 * Verdiene leses fra Vite-env (import.meta.env.VITE_*) med dagens prod-config
 * som fallback. Firebase web-API-nøkler er ikke hemmeligheter (sikkerhet
 * håndheves av Firestore-regler), men env-basert oppsett lar oss bytte
 * prosjekt per miljø uten kodeendring. Legg lokale overstyringer i app-v3/.env.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'glosemester-1e67e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'glosemester-1e67e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'glosemester-1e67e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '370013462432',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:370013462432:web:fbf33e44d56629d715cec5',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const isDevelopment =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
