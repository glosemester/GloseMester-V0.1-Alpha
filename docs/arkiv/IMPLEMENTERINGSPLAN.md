# 🔧 GloseMester - Implementeringsplan (Sprint 1-2)

## 📋 SPRINT 1: KRITISKE FIXES (Uke 1-2)

### 1. FJERN DUMMY AUTH FRA TEACHER.JS ⚠️ KRITISK

**Problem:** `teacher.js` har egen dummy-innlogging som ikke bruker Firebase

**Løsning:** Refactor teacher.js til å kun være UI-controller, all auth i auth.js

#### FIL: `js/features/teacher.js` (NY VERSJON)
```javascript
/* ============================================
   TEACHER.JS - LÃ¦rerfunksjoner v2.0
   Refactored: Fjernet all auth-logikk
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd } from '../ui/helpers.js';
import { auth } from './firebase.js';
import { oppdaterProveliste } from './saved-tests.js';

// --- 1. PRØVELAGING (EDITOR) ---
let midlertidigProveListe = [];

export function leggTilOrd() {
    const spmInput = document.getElementById('nytt-sporsmaal');
    const svarInput = document.getElementById('nytt-svar');
    const s = spmInput.value.trim();
    const e = svarInput.value.trim();
    
    if (!s || !e) { 
        visToast("Skriv både norsk og engelsk ord.", "error"); 
        return; 
    }
    
    // Validering: Sjekk for duplikater
    if (midlertidigProveListe.some(ord => ord.s === s || ord.e === e)) {
        visToast("Dette ordet finnes allerede i listen.", "warning");
        return;
    }
    
    midlertidigProveListe.push({s, e});
    oppdaterEditorListe();
    spmInput.value = ''; 
    svarInput.value = ''; 
    spmInput.focus();
    
    // Lydfeedback
    spillLyd('klikk');
}

function oppdaterEditorListe() {
    const listeEl = document.getElementById('editor-liste');
    if (!listeEl) return;
    
    listeEl.innerHTML = '';
    
    if (midlertidigProveListe.length === 0) {
        listeEl.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Ingen ord lagt til ennå...</p>';
        return;
    }
    
    midlertidigProveListe.forEach((ord, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f9f9f9; border-radius:8px; margin-bottom:8px;";
        li.innerHTML = `
            <span><b>${ord.s}</b> → ${ord.e}</span> 
            <button onclick="slettOrd(${index})" class="btn-danger btn-small" title="Slett ord">🗑️</button>
        `;
        listeEl.appendChild(li);
    });
    
    // Vis antall ord
    const antallEl = document.getElementById('editor-antall');
    if (antallEl) antallEl.innerText = `${midlertidigProveListe.length} ord`;
}

window.slettOrd = function(index) {
    midlertidigProveListe.splice(index, 1);
    oppdaterEditorListe();
    spillLyd('klikk');
};

export async function lagreProve() {
    const tittel = document.getElementById('prove-tittel').value.trim();
    
    // Validering
    if (!tittel) { 
        visToast("Prøven må ha et navn!", "error"); 
        return; 
    }
    if (midlertidigProveListe.length < 3) { 
        visToast("Du må legge til minst 3 ord.", "error"); 
        return; 
    }
    
    const user = auth.currentUser;
    if (!user) {
        visToast("Du må være innlogget for å lagre prøver.", "error");
        return;
    }
    
    // ✅ SJEKK ABONNEMENT (NY)
    const abonnement = await sjekkAbonnement(user);
    if (!abonnement.kanLageProver) {
        document.getElementById('upgrade-modal').style.display = 'flex';
        return;
    }
    
    try {
        // Lagre til Firebase (ikke localStorage!)
        const { addDoc, collection, serverTimestamp } = await import('./firebase.js');
        
        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ordliste: midlertidigProveListe,
            opprettet_av: user.uid,
            opprettet_dato: serverTimestamp(),
            antall_gjennomforinger: 0, // ✅ NY: Tracking
            emne: "generelt" // ✅ NY: Kategorisering
        });
        
        visToast(`✅ Prøve lagret! Kode: ${docRef.id.substring(0, 8).toUpperCase()}`, "success");
        spillLyd('fanfare');
        
        // Reset editor
        midlertidigProveListe = [];
        document.getElementById('prove-tittel').value = '';
        oppdaterEditorListe();
        
        // ✅ Oppdater abonnement-telling
        await inkrementerProveAntall(user);
        
        // Gå til oversikt
        visSide('lagrede-prover');
        oppdaterProveliste();
        
    } catch (error) {
        console.error("Lagring feilet:", error);
        visToast("❌ Kunne ikke lagre prøven. Prøv igjen.", "error");
    }
}

// ✅ NY FUNKSJON: Sjekk abonnement
async function sjekkAbonnement(user) {
    const { getDoc, doc } = await import('./firebase.js');
    
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            return { kanLageProver: false, tier: 'free', proverIgjen: 0 };
        }
        
        const data = userDoc.data();
        const abonnement = data.abonnement || { status: 'free' };
        
        // Gratis bruker: Max 1 prøve
        if (abonnement.status === 'free') {
            const proverOpprettet = data.proverOpprettet || 0;
            return {
                kanLageProver: proverOpprettet < 1,
                tier: 'free',
                proverIgjen: Math.max(0, 1 - proverOpprettet)
            };
        }
        
        // Premium: Sjekk om utløpt
        if (abonnement.status === 'premium' || abonnement.status === 'school') {
            const utloper = abonnement.utloper?.toDate();
            if (utloper && Date.now() > utloper) {
                return { kanLageProver: false, tier: 'expired', proverIgjen: 0 };
            }
            return { kanLageProver: true, tier: abonnement.status, proverIgjen: Infinity };
        }
        
        return { kanLageProver: false, tier: 'unknown', proverIgjen: 0 };
        
    } catch (error) {
        console.error("Feil ved abonnementsjekk:", error);
        return { kanLageProver: false, tier: 'error', proverIgjen: 0 };
    }
}

// ✅ NY FUNKSJON: Tell opp prøver opprettet
async function inkrementerProveAntall(user) {
    const { updateDoc, doc, increment } = await import('./firebase.js');
    
    try {
        await updateDoc(doc(db, "users", user.uid), {
            proverOpprettet: increment(1)
        });
    } catch (error) {
        console.error("Kunne ikke oppdatere telling:", error);
    }
}

// --- 2. BULK IMPORT (NY FUNKSJON) ---
export function importerFraCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const innhold = event.target.result;
            const linjer = innhold.split('\n').filter(l => l.trim());
            
            linjer.forEach(linje => {
                const [norsk, engelsk] = linje.split(/[,;\t]/).map(s => s.trim());
                if (norsk && engelsk) {
                    midlertidigProveListe.push({ s: norsk, e: engelsk });
                }
            });
            
            oppdaterEditorListe();
            visToast(`✅ Importerte ${linjer.length} ord!`, "success");
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// --- 3. INITIALISERING ---
export function initTeacherFeatures() {
    console.log("🎓 Lærer-modul lastet (v2.0 - Refactored).");
    
    // Eksponer globale funksjoner
    window.leggTilOrd = leggTilOrd;
    window.lagreProve = lagreProve;
    window.importerFraCSV = importerFraCSV;
    
    // Sett opp event listeners
    const editorForm = document.getElementById('prove-editor-form');
    if (editorForm) {
        editorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            leggTilOrd();
        });
    }
}
```

---

### 2. IMPLEMENTER FEIDE SSO ⚠️ KRITISK FOR NORSKE SKOLER

**Viktig:** Feide er standard SSO for norske skoler. Uten dette vil ingen skoler kjøpe.

#### FIL: `js/features/auth.js` (LEGG TIL)
```javascript
/* Legg til i auth.js etter Google-innlogging */

// ✅ FEIDE SSO IMPLEMENTERING
export async function loggInnMedFeide() {
    try {
        // Feide bruker SAML 2.0 eller OpenID Connect
        // For enkelhetens skyld bruker vi OpenID Connect via Firebase Custom Auth
        
        // 1. Redirect til Feide login
        const feideAuthUrl = 'https://auth.dataporten.no/oauth/authorization?' + 
            new URLSearchParams({
                client_id: 'DIN_FEIDE_CLIENT_ID', // ⚠️ Må registreres på feide.no
                redirect_uri: window.location.origin + '/feide-callback',
                response_type: 'code',
                scope: 'openid profile email userid-feide'
            });
        
        // Lagre state for å verifisere callback
        const state = generateRandomString(32);
        sessionStorage.setItem('feide_state', state);
        
        window.location.href = feideAuthUrl + '&state=' + state;
        
    } catch (error) {
        console.error("Feide login feil:", error);
        visToast("Feide-innlogging feilet. Kontakt support.", "error");
    }
}

// ✅ CALLBACK HANDLER (kjøres når Feide redirecter tilbake)
export async function handleFeideCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // Verifiser state (CSRF protection)
    const savedState = sessionStorage.getItem('feide_state');
    if (state !== savedState) {
        visToast("Sikkerhetsfeil. Prøv igjen.", "error");
        return;
    }
    
    try {
        // 2. Bytt authorization code mot access token
        const tokenResponse = await fetch('/api/feide-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const { access_token, id_token } = await tokenResponse.json();
        
        // 3. Hent brukerinfo fra Feide
        const userInfoResponse = await fetch('https://auth.dataporten.no/openid/userinfo', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        const userInfo = await userInfoResponse.json();
        
        // 4. Opprett Firebase custom token på backend
        const customTokenResponse = await fetch('/api/create-custom-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                feideUserId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name
            })
        });
        
        const { customToken } = await customTokenResponse.json();
        
        // 5. Logg inn med Firebase Custom Token
        const { signInWithCustomToken } = await import('./firebase.js');
        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;
        
        // 6. Opprett/oppdater bruker i Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            await setDoc(userDocRef, {
                email: userInfo.email,
                navn: userInfo.name,
                feideId: userInfo.sub,
                organisasjon: userInfo.org || 'Ukjent',
                rolle: "laerer",
                opprettet: new Date(),
                abonnement: { 
                    status: "free", 
                    start_dato: new Date(),
                    proverIgjen: 1
                }
            });
        }
        
        // 7. Fullfør innlogging
        handterVellykketInnlogging(user);
        
        // Rens opp
        sessionStorage.removeItem('feide_state');
        window.history.replaceState({}, document.title, window.location.pathname);
        
    } catch (error) {
        console.error("Feide callback error:", error);
        visToast("Kunne ikke fullføre innlogging. Prøv igjen.", "error");
    }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ✅ Sjekk om vi er på callback-siden
if (window.location.pathname === '/feide-callback') {
    handleFeideCallback();
}
```

#### BACKEND (Node.js/Firebase Functions)
Du trenger en backend for å håndtere Feide tokens sikkert:

```javascript
// functions/index.js (Firebase Cloud Functions)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// Exchange authorization code for tokens
exports.feideToken = functions.https.onRequest(async (req, res) => {
    const { code } = req.body;
    
    const tokenResponse = await fetch('https://auth.dataporten.no/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: functions.config().feide.client_id,
            client_secret: functions.config().feide.client_secret,
            redirect_uri: functions.config().feide.redirect_uri
        })
    });
    
    const tokens = await tokenResponse.json();
    res.json(tokens);
});

// Create Firebase custom token
exports.createCustomToken = functions.https.onRequest(async (req, res) => {
    const { feideUserId, email, name } = req.body;
    
    // Bruk Feide ID som Firebase UID
    const uid = `feide_${feideUserId}`;
    
    const customToken = await admin.auth().createCustomToken(uid, {
        email: email,
        name: name,
        provider: 'feide'
    });
    
    res.json({ customToken });
});
```

---

### 3. RATE LIMITING ⚠️ SIKKERHET

#### FIL: `js/core/rate-limiter.js` (NY)
```javascript
/* ============================================
   RATE-LIMITER.JS - Forhindre misbruk
   ============================================ */

export class RateLimiter {
    constructor(maxAttempts, windowMs) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.storageKey = 'rate_limit_data';
    }
    
    check(action) {
        const now = Date.now();
        const data = this.getData();
        
        // Filtrer ut gamle forsøk
        const recentAttempts = (data[action] || []).filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        // Sjekk om grense er nådd
        if (recentAttempts.length >= this.maxAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const resetTime = new Date(oldestAttempt + this.windowMs);
            
            return {
                allowed: false,
                resetTime: resetTime,
                remainingMs: (oldestAttempt + this.windowMs) - now
            };
        }
        
        // Legg til nytt forsøk
        recentAttempts.push(now);
        data[action] = recentAttempts;
        this.saveData(data);
        
        return {
            allowed: true,
            remaining: this.maxAttempts - recentAttempts.length
        };
    }
    
    reset(action) {
        const data = this.getData();
        delete data[action];
        this.saveData(data);
    }
    
    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return {};
        }
    }
    
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
}

// Instanser for forskjellige actions
export const practiceLimiter = new RateLimiter(100, 10 * 60 * 1000); // 100 per 10 min
export const testLimiter = new RateLimiter(50, 10 * 60 * 1000); // 50 per 10 min
export const cardLimiter = new RateLimiter(20, 60 * 60 * 1000); // 20 kort per time
```

#### BRUK I practice.js
```javascript
import { practiceLimiter, cardLimiter } from '../core/rate-limiter.js';

export function sjekkOvingSvar(valgtOrd = null) {
    // ✅ Sjekk rate limit
    const rateCheck = practiceLimiter.check('practice_answer');
    
    if (!rateCheck.allowed) {
        const minutter = Math.ceil(rateCheck.remainingMs / 60000);
        visToast(
            `⏰ Du må vente ${minutter} minutter før du kan fortsette. Ta en pause!`,
            "error"
        );
        return;
    }
    
    // ... resten av koden
}

function sjekkOmGevinst() {
    if (window.riktigeSvar > 0 && window.riktigeSvar % 10 === 0) {
        // ✅ Sjekk rate limit for kort
        const cardCheck = cardLimiter.check('card_reward');
        
        if (!cardCheck.allowed) {
            visToast("Du har mottatt nok kort for nå. Kom tilbake senere!", "warning");
            return;
        }
        
        setTimeout(() => hentTilfeldigKort(), 600);
    }
}
```

---

### 4. FIREBASE APP CHECK ⚠️ SIKKERHET

#### Steg 1: Aktiver i Firebase Console
1. Gå til Firebase Console → App Check
2. Aktiver for Web-app
3. Velg reCAPTCHA v3
4. Kopier site key

#### Steg 2: Implementer i kode
```javascript
// firebase.js (LEGG TIL)
import { 
    initializeAppCheck, 
    ReCaptchaV3Provider 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// Initialize App Check
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('DIN_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
});

export { appCheck };
```

---

### 5. GDPR COMPLIANCE

#### FIL: `js/features/gdpr.js` (NY)
```javascript
/* ============================================
   GDPR.JS - Personvernfunksjoner
   ============================================ */

import { auth, db, doc, deleteDoc, query, where, getDocs, collection } from './firebase.js';
import { visToast } from '../ui/helpers.js';

// ✅ Cookie Consent Banner
export function visCookieBanner() {
    if (localStorage.getItem('cookieConsent')) {
        return; // Allerede godtatt
    }
    
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.95);
        color: white;
        padding: 20px;
        z-index: 99999;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    `;
    
    banner.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <p style="margin: 0 0 5px 0; font-size: 14px;">
                🍪 Vi bruker cookies for å forbedre opplevelsen din.
            </p>
            <a href="/personvern.html" style="color: #60a5fa; font-size: 12px;">Les mer om personvern</a>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="godtaCookies()" class="btn-primary" style="margin: 0;">
                Godta
            </button>
            <button onclick="avvisCookies()" class="btn-secondary" style="margin: 0;">
                Avvis
            </button>
        </div>
    `;
    
    document.body.appendChild(banner);
}

window.godtaCookies = function() {
    localStorage.setItem('cookieConsent', 'true');
    document.getElementById('cookie-banner').remove();
    visToast("Cookie-innstillinger lagret", "success");
};

window.avvisCookies = function() {
    localStorage.setItem('cookieConsent', 'false');
    document.getElementById('cookie-banner').remove();
    
    // Disable analytics
    window['ga-disable-G-7Q1Q9MX8QN'] = true;
    
    visToast("Du har avvist cookies. Noen funksjoner kan være begrenset.", "info");
};

// ✅ Slett all brukerdata
export async function slettMinData() {
    const user = auth.currentUser;
    
    if (!user) {
        visToast("Du må være innlogget for å slette data.", "error");
        return;
    }
    
    const confirmation = prompt(
        'Er du sikker på at du vil slette ALL data?\n\n' +
        'Dette inkluderer:\n' +
        '- Din brukerprofil\n' +
        '- Alle prøver du har laget\n' +
        '- Statistikk\n\n' +
        'Skriv "SLETT" for å bekrefte.'
    );
    
    if (confirmation !== 'SLETT') {
        visToast("Sletting avbrutt.", "info");
        return;
    }
    
    try {
        // 1. Slett Firestore data
        const userDoc = doc(db, "users", user.uid);
        await deleteDoc(userDoc);
        
        // 2. Slett alle prøver
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid)
        );
        const proverSnapshot = await getDocs(proverQuery);
        const deleteBatch = [];
        
        proverSnapshot.forEach((doc) => {
            deleteBatch.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deleteBatch);
        
        // 3. Slett Firebase Auth bruker
        await user.delete();
        
        // 4. Rens localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        alert("✅ All data er permanent slettet.");
        window.location.href = "/";
        
    } catch (error) {
        console.error("Feil ved sletting:", error);
        
        if (error.code === 'auth/requires-recent-login') {
            visToast(
                "Du må logge inn på nytt før du kan slette kontoen. " +
                "Logg ut og inn igjen, og prøv på nytt.",
                "error"
            );
        } else {
            visToast("Kunne ikke slette data. Kontakt support.", "error");
        }
    }
}

// ✅ Eksporter data (GDPR Artikkel 20)
export async function eksporterMinData() {
    const user = auth.currentUser;
    
    if (!user) {
        visToast("Du må være innlogget for å eksportere data.", "error");
        return;
    }
    
    try {
        // Hent all brukerdata
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid)
        );
        const proverSnapshot = await getDocs(proverQuery);
        
        const data = {
            bruker: userDoc.data(),
            prover: proverSnapshot.docs.map(d => d.data()),
            eksportert: new Date().toISOString()
        };
        
        // Last ned som JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glosemester_data_${user.uid}_${Date.now()}.json`;
        a.click();
        
        visToast("✅ Data eksportert!", "success");
        
    } catch (error) {
        console.error("Feil ved eksport:", error);
        visToast("Kunne ikke eksportere data.", "error");
    }
}
```

#### Legg til i HTML (index.html)
```html
<!-- I lærer-meny eller settings -->
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
    <h4 style="font-size: 14px; color: #666; margin-bottom: 10px;">Personvern</h4>
    <button class="btn-secondary btn-small" onclick="eksporterMinData()">
        📥 Last ned mine data
    </button>
    <button class="btn-danger btn-small" onclick="slettMinData()" style="margin-left: 10px;">
        🗑️ Slett min konto
    </button>
</div>
```

---

## 📊 SPRINT 2: SALGBAR FUNKSJONALITET (Uke 3-4)

### 1. LÆRER DASHBOARD MED STATISTIKK

#### FIL: `js/features/teacher-analytics.js` (NY)
```javascript
/* ============================================
   TEACHER-ANALYTICS.JS - Dashboard & Stats
   ============================================ */

import { db, collection, query, where, getDocs, orderBy, limit } from './firebase.js';

export async function lastDashboardData(userId) {
    try {
        // Hent lærerens prøver
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", userId),
            orderBy("opprettet_dato", "desc")
        );
        
        const proverSnapshot = await getDocs(proverQuery);
        const prover = proverSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Hent statistikk for hver prøve
        const statsPromises = prover.map(prove => hentProveStatistikk(prove.id));
        const stats = await Promise.all(statsPromises);
        
        // Aggreger data
        const dashboard = {
            totaltProver: prover.length,
            totaltGjennomforinger: stats.reduce((sum, s) => sum + s.antall, 0),
            gjennomsnittScore: stats.reduce((sum, s) => sum + s.gjennomsnitt, 0) / stats.length || 0,
            topProver: prover.slice(0, 5).map((p, i) => ({
                ...p,
                stats: stats[i]
            })),
            aktivitetSisteUke: await hentAktivitetGraf(userId, 7)
        };
        
        return dashboard;
        
    } catch (error) {
        console.error("Feil ved lasting av dashboard:", error);
        return null;
    }
}

async function hentProveStatistikk(proveId) {
    const resultaterQuery = query(
        collection(db, "test_resultater"),
        where("prove_id", "==", proveId)
    );
    
    const snapshot = await getDocs(resultaterQuery);
    
    if (snapshot.empty) {
        return { antall: 0, gjennomsnitt: 0, siste24t: 0 };
    }
    
    const resultater = snapshot.docs.map(d => d.data());
    const gjennomsnitt = resultater.reduce((sum, r) => sum + r.score, 0) / resultater.length;
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const siste24t = resultater.filter(r => (now - r.timestamp.toMillis()) < day).length;
    
    return {
        antall: resultater.length,
        gjennomsnitt: Math.round(gjennomsnitt),
        siste24t: siste24t
    };
}

async function hentAktivitetGraf(userId, dager) {
    const resultat = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = dager - 1; i >= 0; i--) {
        const startOfDay = now - (i * dayMs);
        const endOfDay = startOfDay + dayMs;
        
        // Hent antall gjennomføringer denne dagen
        const q = query(
            collection(db, "test_resultater"),
            where("laerer_id", "==", userId),
            where("timestamp", ">=", new Date(startOfDay)),
            where("timestamp", "<", new Date(endOfDay))
        );
        
        const snapshot = await getDocs(q);
        
        resultat.push({
            dato: new Date(startOfDay).toLocaleDateString('no', { weekday: 'short' }),
            antall: snapshot.size
        });
    }
    
    return resultat;
}

export function visDashboard(data) {
    const container = document.getElementById('dashboard-stats');
    
    container.innerHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div class="stat-card">
                <div class="stat-value">${data.totaltProver}</div>
                <div class="stat-label">Prøver opprettet</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.totaltGjennomforinger}</div>
                <div class="stat-label">Gjennomføringer</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.gjennomsnittScore}%</div>
                <div class="stat-label">Gj.snitt score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.aktivitetSisteUke.reduce((s, d) => s + d.antall, 0)}</div>
                <div class="stat-label">Aktive siste uke</div>
            </div>
        </div>
        
        <div class="chart-container" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0;">Aktivitet siste 7 dager</h3>
            <canvas id="aktivitet-graf" width="400" height="150"></canvas>
        </div>
        
        <div class="top-prover" style="background: white; padding: 20px; border-radius: 12px;">
            <h3 style="margin: 0 0 15px 0;">Mest brukte prøver</h3>
            ${data.topProver.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                    <span><strong>${p.tittel}</strong></span>
                    <span style="color: #666;">${p.stats.antall} gj.føringer</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Tegn graf
    tegnAktivitetsGraf(data.aktivitetSisteUke);
}

function tegnAktivitetsGraf(data) {
    const canvas = document.getElementById('aktivitet-graf');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const maxValue = Math.max(...data.map(d => d.antall), 1);
    const barWidth = width / data.length;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Tegn søyler
    data.forEach((punkt, index) => {
        const barHeight = (punkt.antall / maxValue) * (height - 30);
        const x = index * barWidth;
        const y = height - barHeight - 20;
        
        // Søyle
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
        
        // Verdi på toppen
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(punkt.antall, x + barWidth/2, y - 5);
        
        // Dag-label
        ctx.fillText(punkt.dato, x + barWidth/2, height - 5);
    });
}
```

#### CSS for Dashboard
```css
/* Legg til i main.css */
.stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-value {
    font-size: 36px;
    font-weight: bold;
    color: #0071e3;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 13px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Før produksjon:
- [ ] Fjern alle console.log() i produksjonskode
- [ ] Implementer error tracking (Sentry)
- [ ] Test alle features på mobil
- [ ] Test på iPhone Safari (PWA)
- [ ] Test på Android Chrome (PWA)
- [ ] Valider GDPR compliance med jurist
- [ ] Få Feide-godkjenning fra Sikt
- [ ] Sett opp Firebase security rules
- [ ] Enable Firebase App Check
- [ ] Sett opp backup av Firestore
- [ ] Test rate limiting grundig
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WAVE)

### Etter produksjon:
- [ ] Monitor Firebase quota
- [ ] Monitor error rates
- [ ] Track conversion funnel
- [ ] A/B test pricing
- [ ] Samle tilbakemeldinger fra beta-brukere

---

## 📞 SUPPORT & VEDLIKEHOLD

### Etabler support-system:
1. **E-post:** support@glosemester.no
2. **Intercom chat:** For betalende kunder
3. **FAQ-seksjon:** På nettsiden
4. **Video-tutorials:** YouTube-kanal
5. **Feedback-widget:** I appen

### Vedlikeholdsplan:
- **Daglig:** Monitor errors, sjekk Firebase quota
- **Ukentlig:** Gjennomgå support-tickets
- **Månedlig:** Performance review, security audit
- **Kvartalsvis:** Feature releases, brukerundersøkelse

---

**NÅ HAR DU EN KOMPLETT PLAN! Start med Sprint 1 denne uken. 💪**

