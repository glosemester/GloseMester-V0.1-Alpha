/**
 * FIREBASE CONFIG & EXPORTS
 * Bruker Firebase SDK v9 (Modular) via CDN for Vanilla JS.
 */

// 1. Importer funksjoner fra Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebase Konfigurasjon
// TODO: Bytt ut med dine egne nøkler fra Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "DINE_API_KEY_HER",
    authDomain: "gloseme-xxxx.firebaseapp.com",
    projectId: "gloseme-xxxx",
    storageBucket: "gloseme-xxxx.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// 3. Initialiser Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase v9 initialized");
} catch (error) {
    console.error("❌ Firebase init failed. Sjekk config!", error);
}

/**
 * 4. Hjelpefunksjon: Sjekk Premium Status
 * Foreløpig mock-implementasjon. Skal kobles mot Stripe/Custom Claims senere.
 * * @param {object} user - Firebase User objekt
 * @returns {Promise<boolean>}
 */
async function sjekkPremiumStatus(user) {
    if (!user) return false;
    
    // TODO: Implementer sjekk mot 'subscriptions' collection eller ID-token claims
    console.log(`💳 Sjekker premium status for: ${user.email}`);
    
    // Returnerer alltid true i Alpha/Dev
    return true; 
}

// 5. Eksporter alt som 'storage.js' trenger
export {
    app,
    auth,
    db,
    // Firestore metoder
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    // Egne hjelpere
    sjekkPremiumStatus
};/**
 * FIREBASE CONFIG & EXPORTS
 * Bruker Firebase SDK v9 (Modular) via CDN for Vanilla JS.
 */

// 1. Importer funksjoner fra Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebase Konfigurasjon
// TODO: Bytt ut med dine egne nøkler fra Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "DINE_API_KEY_HER",
    authDomain: "gloseme-xxxx.firebaseapp.com",
    projectId: "gloseme-xxxx",
    storageBucket: "gloseme-xxxx.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// 3. Initialiser Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase v9 initialized");
} catch (error) {
    console.error("❌ Firebase init failed. Sjekk config!", error);
}

/**
 * 4. Hjelpefunksjon: Sjekk Premium Status
 * Foreløpig mock-implementasjon. Skal kobles mot Stripe/Custom Claims senere.
 * * @param {object} user - Firebase User objekt
 * @returns {Promise<boolean>}
 */
async function sjekkPremiumStatus(user) {
    if (!user) return false;
    
    // TODO: Implementer sjekk mot 'subscriptions' collection eller ID-token claims
    console.log(`💳 Sjekker premium status for: ${user.email}`);
    
    // Returnerer alltid true i Alpha/Dev
    return true; 
}

// 5. Eksporter alt som 'storage.js' trenger
export {
    app,
    auth,
    db,
    // Firestore metoder
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    // Egne hjelpere
    sjekkPremiumStatus
};