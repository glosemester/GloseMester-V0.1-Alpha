/* ============================================
   AUTH.JS - KOMPLETT MED ELEV-BLOKKERING
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
    signInWithCustomToken
} from './firebase.js';

import { oppdaterProveliste } from './saved-tests.js';

// --- FEIDE KONFIGURASJON ---
const FEIDE_CLIENT_ID = "82131d17-cccd-48da-8397-4e9d70434d4d";

// Automatisk origin-deteksjon
const REDIRECT_URI = (() => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return `${origin}/`;
    }
    return "https://glosemester.no/";
})();

// console.log("🔐 Feide config initialisert:", {
//     clientId: FEIDE_CLIENT_ID,
//     redirectUri: REDIRECT_URI
// });

// ============================================
// POPUP-HÅNDTERING
// ============================================

export function visInnlogging() {
    const regPopup = document.getElementById('laerer-register-popup');
    const loginPopup = document.getElementById('laerer-login-popup');
    if (regPopup) regPopup.style.display = 'none';
    if (loginPopup) loginPopup.style.display = 'flex';
}

export function visRegistrering() {
    const loginPopup = document.getElementById('laerer-login-popup');
    const regPopup = document.getElementById('laerer-register-popup');
    if (loginPopup) loginPopup.style.display = 'none';
    if (regPopup) regPopup.style.display = 'flex';
}

// ============================================
// GOOGLE LOGIN
// ============================================

export async function loggInnMedGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await oppdaterBrukerIFirestore(user, user.displayName || "Google Bruker", "google");
        handterVellykketInnlogging(user);
    } catch (error) {
        console.error("❌ Google login feil:", error);
        visToast("Innlogging feilet", "error");
    }
}

// ============================================
// EMAIL LOGIN
// ============================================

export async function loggInnMedEmail() {
    const emailEl = document.getElementById('laerer-email');
    const passEl = document.getElementById('laerer-passord');
    
    if (!emailEl || !passEl) return;

    const email = emailEl.value;
    const pass = passEl.value;

    if (!email || !pass) { 
        visToast("Fyll ut felt", "error"); 
        return; 
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        handterVellykketInnlogging(result.user);
    } catch (error) {
        console.error("❌ Email login feil:", error);
        visToast("Feil e-post eller passord", "error");
    }
}

// ============================================
// REGISTRERING
// ============================================

export async function registrerLaerer() {
    const navn = document.getElementById('reg-navn').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-passord').value;
    const passBekreft = document.getElementById('reg-passord-bekreft').value;

    if (!navn || !email || !pass) return;
    if (pass !== passBekreft) { 
        visToast("Passord ulike", "error"); 
        return; 
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await oppdaterBrukerIFirestore(user, navn, "email");
        handterVellykketInnlogging(user);
    } catch (error) {
        console.error("❌ Registrering feil:", error);
        visToast("Kunne ikke registrere: " + error.message, "error");
    }
}

// ============================================
// FEIDE LOGIN - START
// ============================================

export function loggInnMedFeide() { 
    const scope = "openid userid-feide email userinfo-name groups-org groups-edu";
    const authUrl = `https://auth.dataporten.no/oauth/authorization?client_id=${FEIDE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    
    // console.log("🚀 Starter Feide login...");
    
    sessionStorage.setItem('feideLoginProcess', 'true');
    window.location.href = authUrl;
}

// ============================================
// FEIDE CALLBACK - HÅNDTER RETUR
// ============================================

export async function sjekkFeideRetur() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const isFeideProcess = sessionStorage.getItem('feideLoginProcess');

    // FEIDE-FEIL
    if (error) {
        console.error("❌ Feide error:", error);
        sessionStorage.removeItem('feideLoginProcess');
        visToast(`Feide feilet: ${error}`, "error");
        return;
    }

    if (code && isFeideProcess) {
        // console.log("✅ Feide callback OK - behandler...");
        
        window.history.replaceState({}, document.title, "/");
        sessionStorage.removeItem('feideLoginProcess');
        visToast("Logger inn med Feide...", "info");

        try {
            // console.log("📡 Sender code til backend...");
            
            const response = await fetch('/.netlify/functions/feide-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI })
            });

            // console.log("📥 Backend response:", response.status);

            // HÅNDTER FEIL
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // 🎒 ELEV BLOKKERT
                if (response.status === 403 && errorData.error === 'student_blocked') {
                    visElevPopup();
                    return;
                }
                
                // ANDRE FEIL
                console.error("❌ Backend error:", errorData);
                throw new Error(`Backend feil (${response.status})`);
            }

            // SUCCESS - PARSE DATA
            const data = await response.json();
            const firebaseToken = data.token;
            const feideUser = data.user;

            // console.log("👤 Feide user:", feideUser.name);
            // console.log("🔐 Logger inn i Firebase...");

            // LOGG INN MED FIREBASE TOKEN
            const result = await signInWithCustomToken(auth, firebaseToken);
            const user = result.user;

            // console.log("✅ Firebase login OK:", user.uid);

            // OPPDATER FIRESTORE
            await oppdaterBrukerIFirestore(user, feideUser.name, "feide", feideUser.email);

            visToast("Logget inn med Feide! 🎉", "success");
            
            // NAVIGER TIL DASHBOARD
            const landingPageEl = document.getElementById('landing-page');
            if(landingPageEl && landingPageEl.classList.contains('active')) {
                if (typeof window.visSide === 'function') {
                    window.visSide('laerer-dashboard');
                }
            }

        } catch (error) {
            console.error("💥 Feide FATAL:", error);
            visToast("Innlogging feilet. Prøv igjen.", "error");
        }
    }
}

// ============================================
// ELEV-POPUP
// ============================================

function visElevPopup() {
    const popup = document.createElement('div');
    popup.id = 'elev-blokkert-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
    `;
    
    popup.innerHTML = `
        <div style="
            background: white;
            padding: 50px;
            border-radius: 16px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s;
        ">
            <div style="font-size: 80px; margin-bottom: 20px;">🎒</div>
            <h2 style="color: #0071e3; margin: 0 0 20px 0; font-size: 28px;">Hei elev!</h2>
            <p style="color: #666; line-height: 1.8; font-size: 16px; margin-bottom: 25px;">
                Denne siden er for lærere som skal <strong>lage prøver</strong>.
            </p>
            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <p style="color: #0071e3; margin: 0; font-size: 15px;">
                    <strong>💡 Skal du ta en prøve?</strong><br>
                    <span style="color: #666;">Bruk koden du fikk av læreren din på forsiden.</span>
                </p>
            </div>
            <button onclick="document.getElementById('elev-blokkert-popup').remove(); window.location.reload();" 
                style="
                    padding: 15px 40px;
                    background: #0071e3;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                "
                onmouseover="this.style.background='#005bb5'"
                onmouseout="this.style.background='#0071e3'">
                OK, jeg forstår
            </button>
        </div>
    `;
    
    document.body.appendChild(popup);
}

// ============================================
// FIRESTORE OPPDATERING
// ============================================

async function oppdaterBrukerIFirestore(user, navn, kilde, emailOverride = null) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
        await setDoc(userDocRef, {
            email: emailOverride || user.email,
            navn: navn || "Ukjent Bruker",
            rolle: "laerer",
            kilde: kilde,
            opprettet: new Date(),
            abonnement: { status: "free", start_dato: new Date() },
            personvernGodtatt: false
        });
    }
}

// ============================================
// LOGG UT
// ============================================

export async function loggUt() {
    try {
        // console.log("👋 Logger ut...");
        await signOut(auth);
        window.currentUser = null;

        // Tøm sessionStorage for å unngå rolle-lekkasje
        sessionStorage.clear();

        window.location.reload();
    } catch (error) {
        console.error("❌ Logout error:", error);
    }
}

// ============================================
// VELLYKKET INNLOGGING
// ============================================

async function handterVellykketInnlogging(user) {
    document.querySelectorAll('.popup-overlay').forEach(p => p.style.display = 'none');

    // Sjekk om bruker har godtatt personvernerklæring
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data().personvernGodtatt === false) {
            const popup = document.getElementById('personvern-popup');
            if (popup) popup.style.display = 'flex';
        }
    } catch (e) {
        // Ignorer feil — ikke blokker innlogging
    }

    visToast(`Velkommen!`, "success");
    oppdaterUIForInnloggetBruker(user);
    if (typeof window.visSide === 'function') {
        window.visSide('laerer-dashboard');
    }
}

// ============================================
// UI OPPDATERING
// ============================================

function oppdaterUIForInnloggetBruker(user) {
    window.currentUser = user;

    const infoSpan = document.getElementById('user-info');
    if(infoSpan) infoSpan.innerText = user.email;
    oppdaterProveliste();
    
    if (typeof window.visAdminMenyHvisAdmin === 'function') {
        window.visAdminMenyHvisAdmin(user);
    }
    
    sjekkOgOppdaterAdminTilgang(user);
}

// ============================================
// ADMIN-SJEKK (OPPDATERT - BRUKER ROLLE FRA FIRESTORE)
// ============================================

async function sjekkOgOppdaterAdminTilgang(user) {
    // ✅ OPPDATERT: Sjekker rolle i stedet for hardkodet UID

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return;
        }

        const userData = userSnap.data();

        // Sjekk om bruker har admin-rolle
        if (userData.rolle !== 'admin') {
            return;
        }

        // Sørg for at admin har skolepakke-tilgang
        if (userData.abonnement?.type !== 'skolepakke') {
            await updateDoc(userDocRef, {
                'abonnement.type': 'skolepakke',
                'abonnement.status': 'active',
                'abonnement.kampanjekode': 'ADMIN'
            });
        }

        setTimeout(() => {
            const glosebankBtn = document.getElementById('btn-glosebank-browse');
            if (glosebankBtn) {
                glosebankBtn.style.display = 'inline-block';
            }
        }, 200);
    } catch (error) {
        console.error("⚠️ Admin check error:", error);
    }
}

// ============================================
// PERSONVERN
// ============================================

export async function godtaPersonvern() {
    document.getElementById('personvern-popup').style.display = 'none';
    // Lagre samtykke i Firestore
    const user = auth.currentUser;
    if (user) {
        try {
            await updateDoc(doc(db, "users", user.uid), { personvernGodtatt: true });
        } catch (e) {
            // Ignorer feil
        }
    }
}

export async function avvisPersonvern() {
    alert("Du må godta personvernerklæringen for å bruke tjenesten.\n\nDu blir nå logget ut.");
    try {
        await auth.signOut();
    } catch (e) { /* ignorerer feil */ }
    document.getElementById('personvern-popup').style.display = 'none';
    window.currentUser = null;
    sessionStorage.clear();
    window.location.href = '/';
}

// ============================================
// GLOBALE FUNKSJONER
// ============================================

window.loggInnMedGoogle = loggInnMedGoogle;
window.loggInnMedEmail = loggInnMedEmail;
window.loggInnMedFeide = loggInnMedFeide;
window.registrerLaerer = registrerLaerer;
window.loggUt = loggUt;
window.visInnlogging = visInnlogging;
window.visRegistrering = visRegistrering;
window.godtaPersonvern = godtaPersonvern;
window.avvisPersonvern = avvisPersonvern;
window.auth = auth;

// ============================================
// AUTH STATE LISTENER
// ============================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUser = user;
        const aktivRolle = sessionStorage.getItem('aktivRolle');

        const landingPageEl = document.getElementById('landing-page');
        const erPåLandingPage = landingPageEl ? landingPageEl.classList.contains('active') : false;

        if (aktivRolle === 'laerer' && !erPåLandingPage) {
            oppdaterUIForInnloggetBruker(user);
        }
    } else {
        window.currentUser = null;
    }
});