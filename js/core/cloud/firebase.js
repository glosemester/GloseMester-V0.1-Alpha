// ============================================
// FIREBASE.JS - GloseMester v1.0
// Konfigurasjon og initiering av Cloud-tjenester
// ============================================

// Vi bruker ES Modules import fra CDN for å slippe "npm install"
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// ⚠️ ERSTATT MED DINE EGNE NØKLER FRA FIREBASE CONSOLE:
// Gå til: Project Settings -> General -> "Your apps" -> SDK setup and configuration (CDN)
const firebaseConfig = {
  apiKey: "DIN_API_KEY_HER",
  authDomain: "ditt-prosjekt-id.firebaseapp.com",
  projectId: "ditt-prosjekt-id",
  storageBucket: "ditt-prosjekt-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialiser Firebase
let app, db, auth, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log("☁️ Firebase initialisert");
} catch (e) {
    console.error("❌ Firebase Config Feil (Mangler API-nøkler?)", e);
}

// Hjelpefunksjon: Sjekk om bruker er Premium (Betalende lærer)
// I v1.0 sier vi bare "True" for alle innloggede lærere.
// I v2.0 kobler vi dette mot Stripe-kvitteringer.
function sjekkPremiumStatus(user) {
    if (!user) return false;
    // Her kan vi legge inn logikk senere: return user.claims.stripeRole === 'premium';
    return true; 
}

// Eksporter funksjonene så andre filer (auth.js, teacher.js) kan bruke dem
export { 
    app, db, auth, googleProvider, 
    collection, addDoc, getDocs, query, where, orderBy, // Firestore funksjoner
    signInWithPopup, signOut, onAuthStateChanged,       // Auth funksjoner
    sjekkPremiumStatus 
};