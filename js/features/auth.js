// ============================================
// FIREBASE.JS - GloseMester v1.0
// Konfigurasjon og initiering av Cloud-tjenester
// ============================================

// Vi bruker ES Modules import fra CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// ✅ DINE EKTE NØKLER:
const firebaseConfig = {
  apiKey: "AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU",
  authDomain: "glosemester-1e67e.firebaseapp.com",
  projectId: "glosemester-1e67e",
  storageBucket: "glosemester-1e67e.firebasestorage.app",
  messagingSenderId: "370013462432",
  appId: "1:370013462432:web:fbf33e44d56629d715cec5",
  measurementId: "G-7Q1Q9MX8QN"
};

// Initialiser Firebase
let app, db, auth, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log("☁️ Firebase tilkoblet mot: glosemester-1e67e");
} catch (e) {
    console.error("❌ Firebase Config Feil:", e);
}

// Hjelpefunksjon: Sjekk om bruker er Premium (Betalende lærer)
function sjekkPremiumStatus(user) {
    if (!user) return false;
    // Foreløpig lar vi alle innloggede lærere være "Premium"
    return true; 
}

// Eksporter funksjonene
export { 
    app, db, auth, googleProvider, 
    collection, addDoc, getDocs, query, where, orderBy, 
    signInWithPopup, signOut, onAuthStateChanged,       
    sjekkPremiumStatus 
};