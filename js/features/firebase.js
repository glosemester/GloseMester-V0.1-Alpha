/* ============================================
   FIREBASE.JS - Konfigurasjon og Exports v1.3
   OPPDATERT: Inkluderer signInWithCustomToken for Feide
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithCustomToken // <--- NY
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    setDoc, 
    getDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    deleteDoc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU",
    authDomain: "glosemester-1e67e.firebaseapp.com",
    projectId: "glosemester-1e67e",
    storageBucket: "glosemester-1e67e.firebasestorage.app",
    messagingSenderId: "370013462432",
    appId: "1:370013462432:web:fbf33e44d56629d715cec5",
    measurementId: "G-7Q1Q9MX8QN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { 
    auth, 
    db, 
    googleProvider, 
    analytics,
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithCustomToken, // <--- EKSPORTERES HER
    collection, 
    addDoc, 
    setDoc,
    getDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    deleteDoc,
    updateDoc,
    increment
};