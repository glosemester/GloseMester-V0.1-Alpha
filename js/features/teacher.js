// ============================================
// TEACHER.JS - Lærerportal & Glosebank
// ============================================
import { db, auth, collection, addDoc, serverTimestamp } from './firebase.js'; // Sjekk at stien stemmer
import { visToast, spillLyd } from '../ui/helpers.js';

let editorOrd = [];

export function leggTilOrd() {
    const spm = document.getElementById('nytt-sporsmaal').value;
    const svar = document.getElementById('nytt-svar').value;
    
    if(spm && svar) {
        editorOrd.push({ sporsmaal: spm, svar: svar });
        oppdaterEditorListe();
        spillLyd('klikk');
        
        // Tøm felt og sett fokus
        document.getElementById('nytt-sporsmaal').value = '';
        document.getElementById('nytt-svar').value = '';
        document.getElementById('nytt-sporsmaal').focus();
    }
}

export function slettOrd(index) {
    editorOrd.splice(index, 1);
    oppdaterEditorListe();
}

function oppdaterEditorListe() {
    const liste = document.getElementById('editor-liste');
    liste.innerHTML = editorOrd.map((ord, i) => `
        <li>
            <b>${ord.sporsmaal}</b> - ${ord.svar}
            <button onclick="slettOrd(${i})" class="btn-slett">🗑️</button>
        </li>
    `).join('');
}

export async function lagreProve() {
    const tittel = document.getElementById('prove-tittel').value;
    if(!tittel || editorOrd.length === 0) {
        alert("Du må ha en tittel og minst ett ord.");
        return;
    }
    
    const user = auth.currentUser;
    if(!user) {
        alert("Du må være logget inn.");
        return;
    }

    try {
        // 1. Lagre til Lærerens private bibliotek
        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ord: editorOrd,
            eierId: user.uid,
            opprettet: serverTimestamp()
        });
        
        // 2. SHADOW SAVE (Til Glosebanken - Anonymt)
        // Vi sjekker ikke om de har betalt her ennå, vi bare samler data ;)
        await addDoc(collection(db, "felles_prover"), {
            tittel: tittel,
            ord: editorOrd, // Selve innholdet
            kilde: "Lærer-bidrag",
            godkjent: false, // Må godkjennes av deg før den vises offentlig
            opprettet: serverTimestamp()
        });

        spillLyd('vinn');
        visToast('Prøve lagret! (Kopi sendt til Glosebanken)', 'success');
        
        // Reset
        editorOrd = [];
        document.getElementById('prove-tittel').value = '';
        oppdaterEditorListe();
        
        // Gå tilbake til dashboard (hvis du har navigasjon funksjonen tilgjengelig)
        if(window.visSide) window.visSide('laerer-dashboard');

    } catch (e) {
        console.error("Feil ved lagring:", e);
        alert("Noe gikk galt ved lagring.");
    }
}