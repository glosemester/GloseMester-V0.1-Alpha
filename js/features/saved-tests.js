/* ============================================
   SAVED-TESTS.JS - Håndterer lagrede prøver
   ============================================ */

import { visToast, spillLyd } from '../ui/helpers.js';
import { 
    db, 
    auth, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    deleteDoc, 
    doc 
} from './firebase.js';

import { startProve } from './quiz.js'; 

// Wrapper for å kalle hovedfunksjonen
export function oppdaterProveliste() {
    lastInnProver();
}

// Hovedfunksjon: Hent prøver fra Firebase
export async function lastInnProver() {
    const user = auth.currentUser;
    const container = document.getElementById('prover-liste');
    const loading = document.getElementById('prover-loading');
    const tom = document.getElementById('prover-tom');

    // Sjekk at elementene finnes før vi prøver å endre dem
    if (!container) return; 

    if (!user) {
        container.style.display = 'none';
        if(loading) loading.style.display = 'none';
        if(tom) tom.style.display = 'block'; // Eller en "Logg inn"-melding
        return;
    }

    try {
        // 1. Vis loading
        if(loading) loading.style.display = 'block';
        if(tom) tom.style.display = 'none';
        container.innerHTML = '';
        container.style.display = 'none';

        // 2. Lag spørring mot Firebase
        // VIKTIG: Her brukes 'db' som vi importerte fra firebase.js. 
        // Det var her feilen lå tidligere (db manglet).
        const q = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid),
            orderBy("opprettet_dato", "desc")
        );

        const querySnapshot = await getDocs(q);

        // 3. Skjul loading
        if(loading) loading.style.display = 'none';

        // 4. Sjekk om tomt
        if (querySnapshot.empty) {
            if(tom) tom.style.display = 'block';
            return;
        }

        // 5. Tegn listen
        container.style.display = 'grid'; // Eller 'block' avhengig av CSS
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const antallOrd = data.ordliste ? data.ordliste.length : 0;
            const dato = data.opprettet_dato ? new Date(data.opprettet_dato.toDate()).toLocaleDateString() : 'Ukjent dato';

            const kort = document.createElement('div');
            kort.className = 'prove-kort'; 
            // Legg til litt inline-stil i tilfelle CSS mangler
            kort.style.cssText = "background:white; padding:15px; border-radius:8px; border:1px solid #ddd; margin-bottom:10px; position:relative;";
            
            kort.innerHTML = `
                <div style="font-weight:bold; font-size:16px;">${data.tittel}</div>
                <div style="font-size:12px; color:#666; margin:5px 0;">
                    📅 ${dato} • 📝 ${antallOrd} ord
                </div>
                <div style="font-size:12px; color:#333; background:#f0f0f0; padding:4px; border-radius:4px; display:inline-block; margin-bottom:10px;">
                    Kode: <strong>${id}</strong>
                </div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-primary btn-small" onclick="kopierProvekode('${id}')">Kopier Kode</button>
                    <button class="btn-danger btn-small" onclick="slettProve('${id}')">Slett</button>
                </div>
            `;
            container.appendChild(kort);
        });

    } catch (error) {
        console.error("Feil ved henting av prøver:", error);
        if(loading) loading.style.display = 'none';
        visToast("Kunne ikke laste prøver: " + error.message, "error");
    }
}

// Funksjon for å slette prøve
export async function slettProve(id) {
    if(confirm("Er du sikker på at du vil slette denne prøven?")) {
        try {
            await deleteDoc(doc(db, "prover", id));
            visToast("Prøve slettet", "success");
            lastInnProver(); // Oppdater listen
        } catch (e) {
            console.error("Sletting feilet:", e);
            visToast("Kunne ikke slette prøven", "error");
        }
    }
}

// Funksjon for å kopiere kode
export function kopierProvekode(id) {
    navigator.clipboard.writeText(id).then(() => {
        visToast("Kode kopiert! Send den til elevene.", "success");
        spillLyd('klikk');
    }).catch(() => {
        prompt("Kopier koden herfra:", id);
    });
}

// Søkefunksjon (Enkel filtrering i UI)
export function sokProver() {
    const input = document.getElementById('prove-sok');
    const filter = input.value.toLowerCase();
    const liste = document.getElementById('prover-liste');
    const kort = liste.getElementsByClassName('prove-kort');

    for (let i = 0; i < kort.length; i++) {
        const tekst = kort[i].textContent || kort[i].innerText;
        if (tekst.toLowerCase().indexOf(filter) > -1) {
            kort[i].style.display = "";
        } else {
            kort[i].style.display = "none";
        }
    }
}

// (Valgfritt) Placeholder funksjoner hvis app.js spør etter dem
export function visQRKode(id) {
    alert("QR-kode funksjon kommer i neste versjon!");
}
export function redigerProve(id) {
    alert("Redigering kommer snart!");
}