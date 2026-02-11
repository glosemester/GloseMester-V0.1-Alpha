/* ============================================
   FIREBASE.JS - Konfigurasjon og Exports v1.4
   OPPDATERT: Firebase Storage for diktat-opptak
   VIKTIG: Analytics fjernet for skolegodkjenning (GDPR/privacy)
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU",
    authDomain: "glosemester-1e67e.firebaseapp.com",
    projectId: "glosemester-1e67e",
    storageBucket: "glosemester-1e67e.firebasestorage.app",
    messagingSenderId: "370013462432",
    appId: "1:370013462432:web:fbf33e44d56629d715cec5"
    // measurementId fjernet for skolegodkjenning (ikke nødvendig uten Analytics)
};

const app = initializeApp(firebaseConfig);
// Analytics fjernet for bedre privacy og skolegodkjenning
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    db,
    storage,
    googleProvider,
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
    increment,
    // Storage
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
};