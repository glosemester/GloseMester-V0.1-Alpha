/* ============================================
   TEACHER.JS - v0.8.0 (Med Free-Tier Sperre)
   ============================================ */

import { visToast, spillLyd } from '../ui/helpers.js';
import { 
    db, 
    collection, 
    addDoc, 
    serverTimestamp, 
    auth, 
    query, 
    where, 
    getDocs, 
    getDoc, 
    doc 
} from './firebase.js';

let ordliste = [];

// --- HJELPEFUNKSJON: SJEKK ABONNEMENT ---
async function sjekkOmBrukerKanLagre() {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        // 1. Hent brukerens status fra 'users' collection
        let status = 'free';
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            status = data.abonnement?.status || 'free';
        }

        // HVIS PREMIUM/SKOLE: ALLTID OK
        if (status === 'premium' || status === 'school') {
            return true;
        }

        // HVIS GRATIS: SJEKK ANTALL PRØVER
        if (status === 'free') {
            const q = query(
                collection(db, "prover"), 
                where("opprettet_av", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            
            // GRATIS-GRENSE: 1 PRØVE
            // Hvis de har 1 eller flere, stopp dem.
            if (querySnapshot.size >= 1) {
                return false; 
            }
            return true; // Har 0 prøver fra før
        }

        return true; // Fallback

    } catch (e) {
        console.error("Feil ved sjekk av kvote:", e);
        // Ved feil (f.eks. nettverk), tillat lagring for ikke å ødelegge brukeropplevelsen
        return true; 
    }
}

// --- EDITOR FUNKSJONER ---

export function leggTilOrd() {
    const spmInput = document.getElementById('nytt-sporsmaal');
    const svarInput = document.getElementById('nytt-svar');
    
    const spm = spmInput.value.trim();
    const svar = svarInput.value.trim();
    
    if (spm && svar) {
        ordliste.push({ s: spm, e: svar }); // Bruker kortformat (s/e) som i resten av appen
        
        // UI Feedback
        spillLyd('klikk');
        
        // Nullstill feltene og sett fokus tilbake
        spmInput.value = '';
        svarInput.value = '';
        spmInput.focus();
        
        oppdaterListeUI();
    } else {
        visToast("Fyll ut begge feltene", "error");
    }
}

export function slettOrd(index) {
    ordliste.splice(index, 1);
    spillLyd('klikk');
    oppdaterListeUI();
}

function oppdaterListeUI() {
    const listeEl = document.getElementById('editor-liste');
    if (!listeEl) return;
    
    listeEl.innerHTML = '';
    
    if (ordliste.length === 0) {
        listeEl.innerHTML = '<li style="color:#999; font-style:italic; padding:10px;">Ingen ord lagt til ennå...</li>';
        return;
    }

    ordliste.forEach((ord, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px; background:#f9f9f9; border-radius:6px; margin-bottom:5px;";
        li.innerHTML = `
            <span><b>${ord.s}</b> → ${ord.e}</span>
            <button onclick="slettOrd(${index})" class="btn-small btn-danger" style="padding:5px 10px;">🗑️</button>
        `;
        listeEl.appendChild(li);
    });
}

// --- LAGRING MED SPERRE ---

export async function lagreProve() {
    const tittelInput = document.getElementById('prove-tittel');
    const tittel = tittelInput.value.trim();
    
    if (!tittel) {
        alert("Prøven må ha et navn!");
        return;
    }
    
    if (ordliste.length < 1) { // Endret til 1 for testing, men sett gjerne til 3
        alert("Legg til minst ett ordpar.");
        return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        alert("Du må være logget inn.");
        return;
    }

    visToast("⏳ Sjekker abonnement...", "info");

    // 🛑 1. SJEKK OM DE HAR LOV (Gratis-kvote)
    const kanLagre = await sjekkOmBrukerKanLagre();
    
    if (!kanLagre) {
        // Vis oppgraderings-modal (definert i index.html)
        const modal = document.getElementById('upgrade-modal');
        if(modal) modal.style.display = 'flex';
        visToast("Gratis-kvote oppbrukt", "error");
        return; // AVBRYT
    }

    // 2. LAGRE HVIS OK
    try {
        console.log('💾 Lagrer prøve:', tittel);
        
        // A. Lagre til Lærerens bibliotek
        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ordliste: ordliste,
            opprettet_av: user.uid,
            opprettet_navn: user.displayName || user.email || "Lærer",
            opprettet_dato: serverTimestamp(),
            sokbare_tags: [tittel.toLowerCase()]
        });
        
        console.log('✅ Prøve lagret med ID:', docRef.id);

        // B. SHADOW SAVE (Din gamle funksjonalitet - beholder denne)
        await addDoc(collection(db, "glosebank"), {
            tittel: tittel,
            ordliste: ordliste,
            kilde: "Lærer-bidrag",
            godkjent: false,
            opprettet_dato: serverTimestamp()
        });
        
        // Suksess UI
        spillLyd('vinn');
        visToast("✅ Prøve lagret!", "success");
        
        // Nullstill skjema
        tittelInput.value = '';
        ordliste = [];
        oppdaterListeUI();
        
        // Oppdater listen og naviger
        if(window.oppdaterProveliste) window.oppdaterProveliste();
        if(window.visSide) setTimeout(() => window.visSide('lagrede-prover'), 1000);

    } catch (e) {
        console.error("Feil ved lagring: ", e);
        visToast("Kunne ikke lagre prøven. Sjekk konsoll.", "error");
    }
}