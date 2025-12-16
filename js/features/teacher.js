/* teacher.js
   Håndterer lærer-funksjonalitet med Firebase Firestore
   Versjon: v0.3 (Bruker eksisterende firebase.js)
*/

// 1. IMPORT: Vi henter verktøyene fra din eksisterende firebase.js
import { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy 
} from './firebase.js';

// Vi trenger 'serverTimestamp' som ikke var eksportert i din fil, så vi henter den fra samme versjon (9.22.0)
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    setupEditorListeners();
    lastInnMineProver(); // Hent prøver fra databasen når siden laster
});

function setupEditorListeners() {
    // --- LEGG TIL ORD ---
    const knappLeggTil = document.getElementById('btn-legg-til-ord');
    if (knappLeggTil) {
        knappLeggTil.addEventListener('click', leggTilOrd);
    }

    const inputFelt = document.getElementById('nytt-svar');
    if (inputFelt) {
        inputFelt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') leggTilOrd();
        });
    }

    // --- LAGRE PRØVE ---
    const knappLagre = document.getElementById('btn-lagre-prove');
    if (knappLagre) {
        // Vi bruker en ny funksjon som er 'async' for å kunne vente på Firebase
        knappLagre.addEventListener('click', async () => {
            await lagreProveTilFirebase();
        });
    }
}

function leggTilOrd() {
    const norskInput = document.getElementById('nytt-sporsmaal');
    const engelskInput = document.getElementById('nytt-svar');
    const liste = document.getElementById('editor-liste');

    if (!norskInput?.value.trim() || !engelskInput?.value.trim()) {
        alert("Fyll ut begge feltene!");
        return;
    }

    const li = document.createElement('li');
    li.className = 'editor-item'; 
    li.innerHTML = `
        <span><b>${norskInput.value.trim()}</b> = ${engelskInput.value.trim()}</span>
        <button class="slett-ord-btn" style="background:none; border:none; cursor:pointer;" title="Fjern ord">🗑️</button>
    `;
    
    // Legg til slette-funksjonalitet via lytter
    li.querySelector('.slett-ord-btn').addEventListener('click', () => li.remove());

    liste.appendChild(li);
    norskInput.value = '';
    engelskInput.value = '';
    norskInput.focus();
}

// --- FIREBASE LOGIKK ---

async function lagreProveTilFirebase() {
    const bruker = auth.currentUser;
    
    // Enkel sjekk: Er bruker logget inn?
    if (!bruker) {
        alert("Du må være logget inn for å lagre prøver! (Gå til Bibliotek og logg inn først)");
        return;
    }

    const tittelInput = document.getElementById('ny-prove-navn');
    const tittel = tittelInput ? tittelInput.value.trim() : "Uten navn";
    
    // Samle ord fra listen
    const ordListe = [];
    document.querySelectorAll('#editor-liste li span').forEach(span => {
        const deler = span.innerText.split('=');
        if (deler.length >= 2) {
            ordListe.push({ sporsmaal: deler[0].trim(), svar: deler[1].trim() });
        }
    });

    if (ordListe.length === 0) {
        alert("Prøven er tom!");
        return;
    }

    const knapp = document.getElementById('btn-lagre-prove');
    const orgTekst = knapp.innerText;
    knapp.innerText = "Lagrer...";
    knapp.disabled = true;

    try {
        // SKRIV TIL FIRESTORE (Bruker funksjonene fra din firebase.js)
        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ord: ordListe,
            forfatterId: bruker.uid,
            forfatterEpost: bruker.email,
            opprettet: serverTimestamp(),
            offentlig: false 
        });

        console.log("✅ Prøve lagret med ID: ", docRef.id);
        alert(`Prøven "${tittel}" er lagret i skyen!`);
        
        // Nullstill UI
        document.getElementById('editor-liste').innerHTML = '';
        tittelInput.value = '';
        
        // Gå tilbake til biblioteket
        if (typeof visSide === 'function') visSide('laerer-dashboard');
        
        // Oppdater listen med en gang
        lastInnMineProver();

    } catch (e) {
        console.error("❌ Feil ved lagring: ", e);
        alert("Noe gikk galt ved lagring: " + e.message);
    } finally {
        knapp.innerText = orgTekst;
        knapp.disabled = false;
    }
}

async function lastInnMineProver() {
    const bruker = auth.currentUser;
    const listeEl = document.getElementById('bibliotek-liste');
    
    if (!listeEl) return;
    if (!bruker) {
        listeEl.innerHTML = ''; // Tøm listen hvis ingen er logget inn
        return; 
    }

    listeEl.innerHTML = '<li style="text-align:center; padding:20px;">Laster dine prøver...</li>';

    try {
        // Hent prøver sortert på dato
        // (Merk: orderBy kan kreve at du oppretter en indeks i Firebase Console første gang)
        const q = query(
            collection(db, "prover"), 
            orderBy("opprettet", "desc")
        );

        const querySnapshot = await getDocs(q);
        listeEl.innerHTML = ''; // Fjern "laster..." melding

        let antallFunnet = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filtrer manuelt på klienten foreløpig (enklest uten indeks-trøbbel i starten)
            if (data.forfatterId === bruker.uid) {
                visProveIBibliotek(doc.id, data);
                antallFunnet++;
            }
        });

        if (antallFunnet === 0) {
            document.getElementById('ingen-prover-msg').style.display = 'block';
        } else {
            document.getElementById('ingen-prover-msg').style.display = 'none';
        }

    } catch (e) {
        console.error("Feil ved henting av prøver:", e);
        // Ofte er feilen manglende indeks. Vi gir en mer hjelpsom feilmelding i konsollen.
        if(e.message.includes("index")) {
            console.warn("⚠️ Du må kanskje opprette en indeks i Firebase Console. Se lenken i feilmeldingen over.");
        }
        listeEl.innerHTML = '<li style="color:red; text-align:center;">Kunne ikke laste prøver. Sjekk konsoll (F12) for feil.</li>';
    }
}

function visProveIBibliotek(id, prove) {
    const liste = document.getElementById('bibliotek-liste');
    
    // Sjekk om dato finnes, ellers bruk 'Nå'
    let dato = 'Nylig';
    if (prove.opprettet && prove.opprettet.seconds) {
        dato = new Date(prove.opprettet.seconds * 1000).toLocaleDateString();
    }

    const li = document.createElement('li');
    li.className = 'bibliotek-item'; 
    li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
                <strong style="font-size:16px; color:#333;">${prove.tittel}</strong><br>
                <small style="color:#888;">${prove.ord.length} ord • ${dato}</small>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-start-prove" data-id="${id}" style="background:#0071e3; color:white; border:none; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:12px;">Start</button>
            </div>
        </div>
    `;
    
    // Legg til lytter for start-knappen
    li.querySelector('.btn-start-prove').addEventListener('click', () => {
        alert("Klar til å starte prøve ID: " + id + "\n(QR-kode generering kommer i neste versjon!)");
    });

    liste.appendChild(li);
}