/* ============================================
   AUTH.JS - Master v1.5
   OPPDATERT: Full Feide-integrasjon via Netlify Functions
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
    updateDoc,
    getDoc,
    doc,
    onAuthStateChanged,
    signInWithCustomToken // <--- Brukes for Feide-token
} from './firebase.js';

import { oppdaterProveliste } from './saved-tests.js';

// --- FEIDE KONFIGURASJON ---
const FEIDE_CLIENT_ID = "82131d17-cccd-48da-8397-4e9d70434d4d";

// Bestem Redirect URI dynamisk (Localhost vs Prod) for å unngå feil under testing
const REDIRECT_URI = window.location.hostname === "localhost" || window.location.hostname.includes("127.0.0.1")
    ? "http://127.0.0.1:5500/"  // Sørg for at denne porten stemmer med din Live Server
    : "https://glosemester.no/";

// ------------------------------------------------------------------

export function visInnlogging() {
    document.getElementById('laerer-register-popup').style.display = 'none';
    document.getElementById('laerer-login-popup').style.display = 'flex';
}

export function visRegistrering() {
    document.getElementById('laerer-login-popup').style.display = 'none';
    document.getElementById('laerer-register-popup').style.display = 'flex';
}

export async function loggInnMedGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await oppdaterBrukerIFirestore(user, user.displayName || "Google Bruker", "google");
        handterVellykketInnlogging(user);
    } catch (error) {
        console.error("Google login feil:", error);
        visToast("Innlogging feilet", "error");
    }
}

export async function loggInnMedEmail() {
    const email = document.getElementById('laerer-email').value;
    const pass = document.getElementById('laerer-passord').value;
    if (!email || !pass) { visToast("Fyll ut felt", "error"); return; }

    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        handterVellykketInnlogging(result.user);
    } catch (error) {
        visToast("Feil e-post eller passord", "error");
    }
}

export async function registrerLaerer() {
    const navn = document.getElementById('reg-navn').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-passord').value;
    const passBekreft = document.getElementById('reg-passord-bekreft').value;

    if (!navn || !email || !pass) return;
    if (pass !== passBekreft) { visToast("Passord ulike", "error"); return; }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await oppdaterBrukerIFirestore(user, navn, "email");
        handterVellykketInnlogging(user);
    } catch (error) {
        visToast("Kunne ikke registrere: " + error.message, "error");
    }
}

// --- FEIDE LOGIKK START ---

export function loggInnMedFeide() { 
    // 1. Bygg URL for Feide-innlogging
    // Vi ber om: openid, userid, email, navn, organisasjon og utdanningstilhørighet
    const scope = "openid userid-feide email userinfo-name groups-org groups-edu";
    const authUrl = `https://auth.dataporten.no/oauth/authorization?client_id=${FEIDE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    
    // Lagre flagg i session så vi vet at vi venter på Feide når siden laster på nytt
    sessionStorage.setItem('feideLoginProcess', 'true');
    
    console.log("Sender bruker til Feide:", authUrl);
    window.location.href = authUrl;
}

export async function sjekkFeideRetur() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const isFeideProcess = sessionStorage.getItem('feideLoginProcess');

    // Hvis vi har en kode i URL-en OG vi vet at vi startet en Feide-prosess
    if (code && isFeideProcess) {
        console.log("🔄 Fant Feide-kode, kontakter backend...");
        
        // Rydd opp URL (fjern ?code=... så det ser pent ut)
        window.history.replaceState({}, document.title, "/");
        sessionStorage.removeItem('feideLoginProcess');

        visToast("Logger inn med Feide...", "info");

        try {
            // 2. Send koden til Netlify Function for veksling
            const response = await fetch('/.netlify/functions/feide-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Server feil");
            }

            const data = await response.json();
            const firebaseToken = data.token;
            const feideUser = data.user; // Info hentet fra Feide i backend

            // 3. Logg inn i Firebase med Custom Token
            const result = await signInWithCustomToken(auth, firebaseToken);
            const user = result.user;

            console.log("✅ Feide-login vellykket for:", user.uid);

            // 4. Lagre/Oppdater brukerinfo i Firestore
            await oppdaterBrukerIFirestore(user, feideUser.name, "feide", feideUser.email);

            visToast("Logget inn med Feide! 🎉", "success");
            
            // Send til dashboard hvis vi er på landingssiden
            if(document.getElementById('landing-page').classList.contains('active')) {
                window.visSide('laerer-dashboard');
            }

        } catch (error) {
            console.error("Feide login feilet:", error);
            visToast("Innlogging med Feide feilet. Prøv igjen.", "error");
        }
    }
}

// --- FEIDE LOGIKK SLUTT ---

// Hjelpefunksjon for å lagre brukerdata
async function oppdaterBrukerIFirestore(user, navn, kilde, emailOverride = null) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
        await setDoc(userDocRef, {
            email: emailOverride || user.email,
            navn: navn || "Ukjent Bruker",
            rolle: "laerer",
            kilde: kilde, // 'feide', 'google' eller 'email'
            opprettet: new Date(),
            abonnement: { status: "free", start_dato: new Date() }
        });
    }
}

export async function loggUt() {
    try {
        await signOut(auth);
        window.currentUser = null;
        window.location.reload(); 
    } catch (error) { console.error("Logout feil", error); }
}

function handterVellykketInnlogging(user) {
    document.querySelectorAll('.popup-overlay').forEach(p => p.style.display = 'none');
    visToast(`Velkommen!`, "success");
    oppdaterUIForInnloggetBruker(user);
    window.visSide('laerer-dashboard');
}

function oppdaterUIForInnloggetBruker(user) {
    window.currentUser = user;
    console.log("✅ window.currentUser satt:", user.email);
    
    const infoSpan = document.getElementById('user-info');
    if(infoSpan) infoSpan.innerText = user.email;
    oppdaterProveliste();
    
    if (typeof window.visAdminMenyHvisAdmin === 'function') {
        window.visAdminMenyHvisAdmin(user);
    }
    
    sjekkOgOppdaterAdminTilgang(user);
}

async function sjekkOgOppdaterAdminTilgang(user) {
    const ADMIN_UID = "QrFRB6xQDnVQsiSd0bzE6rH8z4x2";
    if (user.uid !== ADMIN_UID) return;
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.abonnement?.type !== 'skolepakke') {
                await updateDoc(userDocRef, {
                    'abonnement.type': 'skolepakke',
                    'abonnement.status': 'active',
                    'abonnement.kampanjekode': 'ADMIN'
                });
            }
        }
        setTimeout(() => {
            const glosebankBtn = document.getElementById('btn-glosebank-browse');
            if (glosebankBtn) glosebankBtn.style.display = 'inline-block';
        }, 200);
    } catch (error) {
        console.error("Admin check error", error);
    }
}

export function godtaPersonvern() { 
    document.getElementById('personvern-popup').style.display = 'none'; 
}
export function avvisPersonvern() { 
    alert("Du må godta for å bruke tjenesten."); 
}

// Eksponering til window
window.loggInnMedGoogle = loggInnMedGoogle;
window.loggInnMedEmail = loggInnMedEmail;
window.loggInnMedFeide = loggInnMedFeide; // <--- Nå virker denne!
window.registrerLaerer = registrerLaerer;
window.loggUt = loggUt;
window.visInnlogging = visInnlogging;
window.visRegistrering = visRegistrering;
window.godtaPersonvern = godtaPersonvern;
window.avvisPersonvern = avvisPersonvern;

// Auto-login listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUser = user;
        const aktivRolle = sessionStorage.getItem('aktivRolle');
        const erPåLandingPage = document.getElementById('landing-page').classList.contains('active');
        
        if (aktivRolle === 'laerer' && !erPåLandingPage) {
            oppdaterUIForInnloggetBruker(user);
        }
    } else {
        window.currentUser = null;
    }
});