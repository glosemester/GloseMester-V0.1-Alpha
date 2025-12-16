/* ============================================
   TEACHER.JS - GloseMester v1.0 (Module)
   ============================================ */

// Hent alt fra vår lokale firebase-fil (ingen https-linker her!)
import { 
    db, auth, 
    collection, addDoc, getDocs, query, orderBy, serverTimestamp,
    signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from './firebase.js';

// Koble til window slik at HTML-knapper (onclick) finner funksjonene
window.loggInn = loggInn;
window.loggUt = loggUt;
window.importerProveFraTekst = importerProveFraTekst;
window.lastInnMineProver = lastInnMineProver;
window.leggTilOrd = leggTilOrd; 
window.slettOrd = slettOrd;

document.addEventListener('DOMContentLoaded', () => {
    setupEditorListeners();
    
    // Lytt etter innlogging-status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("👤 Bruker er logget inn:", user.displayName);
            visLærerDashboard(user);
        } else {
            console.log("👤 Ingen bruker logget inn");
            skjulLærerDashboard();
        }
    });
});

function setupEditorListeners() {
    const knappLeggTil = document.getElementById('btn-legg-til-ord');
    if (knappLeggTil) knappLeggTil.addEventListener('click', leggTilOrd);

    const inputFelt = document.getElementById('nytt-svar');
    if (inputFelt) {
        inputFelt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') leggTilOrd();
        });
    }
    
    const knappLagre = document.getElementById('btn-lagre-prove');
    if (knappLagre) knappLagre.addEventListener('click', lagreProveTilDatabase);
}

// --- AUTENTISERING ---

async function loggInn() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Innlogging feilet:", error);
        alert("Innlogging feilet: " + error.message);
    }
}

async function loggUt() {
    try {
        await signOut(auth);
        alert("Du er logget ut.");
    } catch (error) {
        console.error("Utlogging feilet:", error);
    }
}

function visLærerDashboard(user) {
    const loginSec = document.getElementById('auth-login-section');
    const uiSec = document.getElementById('teacher-ui');
    
    if(loginSec) loginSec.style.display = 'none';
    if(uiSec) uiSec.style.display = 'block';
    
    const nameEl = document.getElementById('user-name');
    if(nameEl) nameEl.innerText = user.displayName;
    
    lastInnMineProver();
}

function skjulLærerDashboard() {
    const loginSec = document.getElementById('auth-login-section');
    const uiSec = document.getElementById('teacher-ui');
    
    if(loginSec) loginSec.style.display = 'block';
    if(uiSec) uiSec.style.display = 'none';
    
    const listEl = document.getElementById('bibliotek-liste');
    if(listEl) listEl.innerHTML = "";
}

// --- EDITOR FUNKSJONER ---

function leggTilOrd() {
    const spmInput = document.getElementById('nytt-sporsmaal');
    const svarInput = document.getElementById('nytt-svar');
    
    const spm = spmInput.value.trim();
    const svar = svarInput.value.trim();
    
    if (!spm || !svar) return;
    
    if (typeof window.editorListe === 'undefined') window.editorListe = [];
    
    window.editorListe.push({ sporsmaal: spm, svar: svar });
    
    oppdaterEditorListeUI();
    
    spmInput.value = "";
    svarInput.value = "";
    spmInput.focus();
}

function slettOrd(index) {
    if (window.editorListe) {
        window.editorListe.splice(index, 1);
        oppdaterEditorListeUI();
    }
}

function oppdaterEditorListeUI() {
    const liste = document.getElementById('editor-liste');
    if (!liste) return;
    liste.innerHTML = "";
    
    window.editorListe.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'bibliotek-item';
        li.innerHTML = `
            <span><b>${item.sporsmaal}</b> - ${item.svar}</span>
            <button class="btn-secondary btn-small btn-danger" onclick="slettOrd(${index})">🗑️</button>
        `;
        liste.appendChild(li);
    });
}

// --- DATABASE FUNKSJONER ---

async function lagreProveTilDatabase() {
    const tittelInput = document.getElementById('ny-prove-navn');
    const tittel = tittelInput.value.trim();
    
    if (!tittel) { alert("Mangler navn på prøven!"); return; }
    if (!window.editorListe || window.editorListe.length === 0) { alert("Prøven er tom!"); return; }

    const user = auth.currentUser;
    if (!user) { alert("Du må være logget inn."); return; }

    const lagreKnapp = document.getElementById('btn-lagre-prove');
    const originalTekst = lagreKnapp.innerText;
    lagreKnapp.disabled = true;
    lagreKnapp.innerText = "Lagrer... ⏳";

    try {
        await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ord: window.editorListe,
            eier: user.uid,
            opprettet: serverTimestamp()
        });
        
        alert("✅ Prøve lagret i biblioteket!");
        window.editorListe = [];
        tittelInput.value = "";
        oppdaterEditorListeUI();
        if(typeof visSide === 'function') visSide('laerer-dashboard');
        
    } catch (e) {
        console.error("Feil ved lagring:", e);
        alert("❌ Kunne ikke lagre: " + e.message);
    } finally {
        lagreKnapp.disabled = false;
        lagreKnapp.innerText = originalTekst;
    }
}

async function lastInnMineProver() {
    const user = auth.currentUser;
    if (!user) return;

    const listeEl = document.getElementById('bibliotek-liste');
    if (!listeEl) return;
    
    listeEl.innerHTML = '<li style="text-align:center;">Laster... ⏳</li>';

    try {
        const q = query(
            collection(db, "prover"), 
            orderBy("opprettet", "desc")
        );
        
        const snapshot = await getDocs(q);
        listeEl.innerHTML = "";
        
        if (snapshot.empty) {
            const msg = document.getElementById('ingen-prover-msg');
            if(msg) msg.style.display = 'block';
        } else {
            const msg = document.getElementById('ingen-prover-msg');
            if(msg) msg.style.display = 'none';
            snapshot.forEach(doc => {
                visProveIBibliotek(doc.id, doc.data());
            });
        }
    } catch (e) {
        console.error("Feil ved henting:", e);
        listeEl.innerHTML = '<li style="color:red; text-align:center;">Feil ved lasting. Sjekk internett.</li>';
    }
}

function visProveIBibliotek(id, prove) {
    const liste = document.getElementById('bibliotek-liste');
    
    let dato = 'Nylig';
    if (prove.opprettet && prove.opprettet.seconds) {
        dato = new Date(prove.opprettet.seconds * 1000).toLocaleDateString();
    }

    const li = document.createElement('li');
    li.className = 'bibliotek-item';
    
    const dataObj = { navn: prove.tittel, data: prove.ord };
    const dataString = btoa(encodeURIComponent(JSON.stringify(dataObj))); 
    
    li.innerHTML = `
        <div style="flex:1;">
            <h4>${prove.tittel}</h4>
            <span style="font-size:12px; color:#666;">${prove.ord.length} ord • ${dato}</span>
        </div>
        <div class="bib-actions">
            <button class="btn-secondary btn-small" onclick="visKodePopup('${dataString}')">Vis Kode</button>
        </div>
    `;
    liste.appendChild(li);
}

// Funksjon for å vise QR-kode popup (Må kobles globalt)
window.visKodePopup = function(kodeStreng) {
    const popup = document.getElementById('kode-popup');
    const kodeBoks = document.getElementById('popup-kode-tekst');
    const qrContainer = document.getElementById('qrcode-container');
    
    if(popup) popup.style.display = 'flex';
    if(kodeBoks) kodeBoks.innerText = kodeStreng;
    
    if(qrContainer) {
        qrContainer.innerHTML = "";
        if(typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: kodeStreng,
                width: 128,
                height: 128
            });
        } else {
            qrContainer.innerText = "QR-bibliotek ikke lastet";
        }
    }
}

function importerProveFraTekst() {
    const input = prompt("Lim inn prøve-kode her:");
    if (!input) return;
    
    try {
        const json = decodeURIComponent(atob(input));
        const data = JSON.parse(json);
        
        if (data.data && Array.isArray(data.data)) {
            window.editorListe = data.data;
            document.getElementById('ny-prove-navn').value = (data.navn || "Importert") + " (Kopi)";
            oppdaterEditorListeUI();
            if(typeof visSide === 'function') visSide('laerer-editor');
            alert("✅ Prøve importert til redigering!");
        } else {
            throw new Error("Ugyldig format");
        }
    } catch (e) {
        alert("Kunne ikke lese koden.");
    }
}