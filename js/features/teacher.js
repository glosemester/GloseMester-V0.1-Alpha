// ============================================
// TEACHER.JS - Lærerportal & Glosebank
// ============================================
import { db, auth, collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from './firebase.js'; // Sjekk at stien stemmer
import { visToast, spillLyd } from '../ui/helpers.js';

let editorOrd = [];

// ============================================
// Personvern-samtykke (Lærer) - v0.6 beta
// ============================================
const PRIVACY = {
    version: 'v0.6 beta',
    url: 'https://glosemester.no/personvern'
};

function visPrivacySamtykkeModal({ onAccept, onCancel }) {
    const el = document.createElement('div');
    el.id = 'privacy-consent-modal';
    el.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <h3>Personvern og vilkår (Lærer)</h3>
        <p>
          Ved å bruke lærerfunksjonene i GloseMester bekrefter du at du har lest og aksepterer personvernerklæringen.
          Lærerdata (e-post og prøver) lagres i Firebase for å gi tilgang og administrasjon. Elevdata lagres lokalt på elevens enhet.
        </p>
        <p><a href="${PRIVACY.url}" target="_blank" rel="noopener">Les personvernerklæringen</a></p>
        <div class="modal-actions">
          <button id="privacy-cancel">Avbryt</button>
          <button id="privacy-accept">Jeg godtar</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#privacy-cancel').onclick = () => { el.remove(); onCancel?.(); };
    el.querySelector('#privacy-accept').onclick = () => { el.remove(); onAccept?.(); };
}

export async function ensureTeacherPrivacyAccepted() {
    const user = auth?.currentUser;
    if (!user) return false;

    // Lokal snarvei per bruker + versjon
    const localKey = `privacyAccepted_${user.uid}_${PRIVACY.version}`;
    if (localStorage.getItem(localKey) === 'true') return true;

    // Forsøk å lese fra Firestore hvis mulig
    try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const data = snap.data();
            if (data?.privacyAccepted === true && data?.privacyVersion === PRIVACY.version) {
                localStorage.setItem(localKey, 'true');
                return true;
            }
        }

        // Krev samtykke
        return await new Promise((resolve) => {
            visPrivacySamtykkeModal({
                onAccept: async () => {
                    try {
                        if (!snap.exists()) {
                            await setDoc(ref, { email: user.email ?? null }, { merge: true });
                        }
                        await updateDoc(ref, {
                            privacyAccepted: true,
                            privacyAcceptedAt: serverTimestamp(),
                            privacyVersion: PRIVACY.version,
                            privacyUrl: PRIVACY.url
                        });
                    } catch (e) {
                        // Hvis Firestore feiler, fall tilbake til lokal aksept (beta)
                        console.warn('Kunne ikke lagre samtykke i Firestore. Faller tilbake til lokal lagring.', e);
                    }
                    localStorage.setItem(localKey, 'true');
                    resolve(true);
                },
                onCancel: () => resolve(false)
            });
        });
    } catch (e) {
        console.warn('Kunne ikke verifisere samtykke i Firestore. Faller tilbake til lokal modal.', e);
        return await new Promise((resolve) => {
            visPrivacySamtykkeModal({
                onAccept: () => { 
                    localStorage.setItem(localKey, 'true');
                    resolve(true);
                },
                onCancel: () => resolve(false)
            });
        });
    }
}


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