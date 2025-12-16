/* ============================================
   FIREBASE.JS - Modul (Sentralen)
   ============================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Dine nøkler
const firebaseConfig = {
  apiKey: "AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU",
  authDomain: "glosemester-1e67e.firebaseapp.com",
  projectId: "glosemester-1e67e",
  storageBucket: "glosemester-1e67e.firebasestorage.app",
  messagingSenderId: "370013462432",
  appId: "1:370013462432:web:fbf33e44d56629d715cec5",
  measurementId: "G-7Q1Q9MX8QN"
};

// Initialiser Appen
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// VIKTIG: Eksporter alt herfra så andre filer slipper å hente fra nettet selv
export { 
    app, db, auth, 
    collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
};