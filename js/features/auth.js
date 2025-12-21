/* ============================================
   AUTH.JS - Håndterer innlogging og registrering
   ============================================ */

import { visToast } from '../ui/helpers.js';
import { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    db,       
    setDoc,   
    getDoc, // <--- La til denne importen
    doc       
} from './firebase.js';

import { oppdaterProveliste } from './saved-tests.js';

export function visInnlogging() {
    document.getElementById('laerer-register-popup').style.display = 'none';
    document.getElementById('laerer-login-popup').style.display = 'flex';
}

export function visRegistrering() {
    document.getElementById('laerer-login-popup').style.display = 'none';
    document.getElementById('laerer-register-popup').style.display = 'flex';
}

// 1. Logg inn med Google (Oppdatert: Oppretter bruker-doc hvis det mangler)
export async function loggInnMedGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // SJEKK OM BRUKERDATA FINNES, HVIS IKKE: OPPRETT
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            await setDoc(userDocRef, {
                email: user.email,
                navn: user.displayName || "Google Bruker",
                rolle: "laerer",
                opprettet: new Date(),
                abonnement: {
                    status: "free",
                    start_dato: new Date()
                }
            });
            console.log("Google-bruker opprettet i database");
        }

        handterVellykketInnlogging(user);
    } catch (error) {
        console.error("Google login feil:", error);
        visToast("Innlogging feilet", "error");
    }
}

// 2. Logg inn med E-post
export async function loggInnMedEmail() {
    const email = document.getElementById('laerer-email').value;
    const pass = document.getElementById('laerer-passord').value;

    if (!email || !pass) {
        visToast("Fyll ut e-post og passord", "error");
        return;
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        handterVellykketInnlogging(result.user);
    } catch (error) {
        console.error("Login feil:", error);
        visToast("Feil e-post eller passord", "error");
    }
}

// 3. Registrer ny lærer (MED USERS-DOC OPPRETTELSE)
export async function registrerLaerer() {
    const navn = document.getElementById('reg-navn').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-passord').value;
    const passBekreft = document.getElementById('reg-passord-bekreft').value;

    if (!navn || !email || !pass) {
        visToast("Alle felt må fylles ut", "error");
        return;
    }
    if (pass !== passBekreft) {
        visToast("Passordene er ikke like", "error");
        return;
    }
    if (pass.length < 6) {
        visToast("Passord må være minst 6 tegn", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // --- OPPRETT BRUKERDATA I FIRESTORE ---
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            navn: navn,
            rolle: "laerer",
            opprettet: new Date(),
            abonnement: {
                status: "free", // Standard: Gratis
                start_dato: new Date()
            }
        });
        
        visToast("Konto opprettet! Velkommen.", "success");
        handterVellykketInnlogging(user);
        
    } catch (error) {
        console.error("Reg feil:", error);
        if(error.code === 'auth/email-already-in-use') {
            visToast("E-posten er allerede i bruk", "error");
        } else {
            visToast("Kunne ikke registrere bruker", "error");
        }
    }
}

// 4. Logg ut
export async function loggUt() {
    try {
        await signOut(auth);
        window.location.reload(); 
    } catch (error) {
        console.error("Logout feil", error);
    }
}

// Hjelpefunksjoner
function handterVellykketInnlogging(user) {
    document.getElementById('laerer-login-popup').style.display = 'none';
    document.getElementById('laerer-register-popup').style.display = 'none';
    
    visToast(`Velkommen, ${user.displayName || user.email}!`, "success");
    
    // Oppdater UI
    const infoSpan = document.getElementById('user-info');
    if(infoSpan) infoSpan.innerText = user.email;

    // VIKTIG: Naviger til dashboard for å trigge meny-visning
    window.visSide('laerer-dashboard');
    
    // Last inn data
    oppdaterProveliste();
}

// Feide placeholder (Mock)
export function loggInnMedFeide() {
    alert("Feide-integrasjon krever godkjenning fra Sikt. Dette er en demo-knapp.");
}

export function godtaPersonvern() {
    localStorage.setItem('personvern_godtatt', 'true');
    document.getElementById('personvern-popup').style.display = 'none';
}

export function avvisPersonvern() {
    alert("Du må godta vilkårene for å bruke appen fullt ut.");
}