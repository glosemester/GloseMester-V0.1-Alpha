/* ============================================
   DIKTAT-RECORDER.JS v1.0
   Lærer-diktat: Ta opp ord med mikrofon,
   lagre til Firebase Storage, del med elever.
   TTL: 90 dager (180 for premium/skole).
   Eksport/import som .json med base64-lyd.
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, escapeHtml } from '../ui/helpers.js';
import {
    auth, db, storage,
    collection, addDoc, getDoc, getDocs, doc, deleteDoc, updateDoc,
    query, where, orderBy, serverTimestamp,
    storageRef, uploadBytes, getDownloadURL, deleteObject, listAll
} from './firebase.js';

// ============================
// STATE
// ============================
let diktatState = {
    ordliste: [],           // [{tekst: "jeg"}, {tekst: "skole"}, ...]
    opptak: {},             // {0: Blob, 1: Blob, ...} — index → audio blob
    aktivtIndex: 0,
    mediaRecorder: null,
    audioChunks: [],
    kilde: null,            // 'niva1', 'niva2', 'niva4', 'egendefinert'
    settId: null,           // Firestore doc ID etter lagring
    delingskode: null
};

// TTL-konfigurasjon
const TTL_DAGER_STANDARD = 90;
const TTL_DAGER_PREMIUM = 180;
const MAKS_ORD_PER_SETT = 50;
const MAKS_OPPTAK_PER_TIME = 200;

// ============================
// INIT
// ============================
export function initDiktatRecorder() {
    window.velgDiktatKilde = velgDiktatKilde;
    window.bekreftEgneOrd = bekreftEgneOrd;
    window.startOpptak = startOpptak;
    window.stoppOpptak = stoppOpptak;
    window.lyttPaOpptak = lyttPaOpptak;
    window.nesteOrd = nesteOrd;
    window.avbrytOpptak = avbrytOpptak;
    window.fullforDiktat = fullforDiktat;
    window.nullstillDiktat = nullstillDiktat;
    window.kopierDiktatKode = kopierDiktatKode;
    window.eksporterDiktat = eksporterDiktat;
    window.importerDiktat = importerDiktat;
    window.handleDiktatImport = handleDiktatImport;
    window.slettDiktatSett = slettDiktatSett;
    window.lastMineDiktatSett = lastMineDiktatSett;
}

// ============================
// STEG 1: VELG ORDLISTE
// ============================

function velgDiktatKilde(kilde) {
    diktatState.kilde = kilde;

    if (kilde === 'egendefinert') {
        document.getElementById('diktat-egne-ord').style.display = 'block';
        return;
    }

    // Hent ord fra norskVokabular
    const vokabular = window.norskVokabular;
    if (!vokabular || !vokabular[kilde]) {
        visToast('Fant ikke ordliste for dette nivået', 'error');
        return;
    }

    const ord = vokabular[kilde].map(item => ({ tekst: item.s }));
    if (ord.length === 0) {
        visToast('Ordlisten er tom', 'error');
        return;
    }

    diktatState.ordliste = ord.slice(0, MAKS_ORD_PER_SETT);
    startOpptakSteg();
}

function bekreftEgneOrd() {
    const textarea = document.getElementById('diktat-egne-ord-input');
    const linjer = textarea.value.trim().split('\n').filter(l => l.trim().length > 0);

    if (linjer.length < 2) {
        visToast('Skriv inn minst 2 ord', 'error');
        return;
    }

    if (linjer.length > MAKS_ORD_PER_SETT) {
        visToast(`Maks ${MAKS_ORD_PER_SETT} ord per diktat-sett`, 'error');
        return;
    }

    diktatState.ordliste = linjer.map(l => ({ tekst: l.trim() }));
    startOpptakSteg();
}

function startOpptakSteg() {
    document.getElementById('diktat-steg-kilde').style.display = 'none';
    document.getElementById('diktat-steg-opptak').style.display = 'block';

    diktatState.aktivtIndex = 0;
    diktatState.opptak = {};
    visAktivtOrd();
}

// ============================
// STEG 2: OPPTAK ORD FOR ORD
// ============================

function visAktivtOrd() {
    const ord = diktatState.ordliste[diktatState.aktivtIndex];
    document.getElementById('diktat-aktivt-ord').textContent = ord.tekst;
    document.getElementById('diktat-progress').textContent =
        `${diktatState.aktivtIndex + 1} / ${diktatState.ordliste.length}`;

    // Skjul preview hvis nytt ord uten opptak
    const harOpptak = diktatState.opptak[diktatState.aktivtIndex];
    document.getElementById('diktat-preview').style.display = harOpptak ? 'block' : 'none';
    document.getElementById('btn-start-opptak').style.display = harOpptak ? 'none' : '';
    document.getElementById('diktat-recording-indicator').style.display = 'none';

    // Vis fullfør-knapp hvis alle ord er tatt opp
    const alleTattOpp = diktatState.ordliste.every((_, i) => diktatState.opptak[i]);
    document.getElementById('btn-fullfør-diktat').style.display = alleTattOpp ? '' : 'none';
}

async function startOpptak() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        diktatState.audioChunks = [];

        // Velg best tilgjengelig format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

        diktatState.mediaRecorder = new MediaRecorder(stream, { mimeType });

        diktatState.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) diktatState.audioChunks.push(e.data);
        };

        diktatState.mediaRecorder.onstop = () => {
            const blob = new Blob(diktatState.audioChunks, { type: mimeType });
            diktatState.opptak[diktatState.aktivtIndex] = blob;

            // Stopp mikrofon
            stream.getTracks().forEach(t => t.stop());

            // Vis preview
            document.getElementById('btn-stopp-opptak').style.display = 'none';
            document.getElementById('btn-start-opptak').style.display = 'none';
            document.getElementById('diktat-recording-indicator').style.display = 'none';
            document.getElementById('diktat-preview').style.display = 'block';
        };

        diktatState.mediaRecorder.start();

        // UI: vis "tar opp"
        document.getElementById('btn-start-opptak').style.display = 'none';
        document.getElementById('btn-stopp-opptak').style.display = '';
        document.getElementById('diktat-recording-indicator').style.display = 'block';
        document.getElementById('diktat-preview').style.display = 'none';

    } catch (err) {
        console.error('Mikrofon-tilgang nektet:', err);
        visToast('Kunne ikke starte mikrofon. Gi tilgang i nettleseren.', 'error');
    }
}

function stoppOpptak() {
    if (diktatState.mediaRecorder && diktatState.mediaRecorder.state === 'recording') {
        diktatState.mediaRecorder.stop();
    }
}

function lyttPaOpptak() {
    const blob = diktatState.opptak[diktatState.aktivtIndex];
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
}

function nesteOrd() {
    if (diktatState.aktivtIndex < diktatState.ordliste.length - 1) {
        diktatState.aktivtIndex++;
        visAktivtOrd();
    } else {
        // Alle ord tatt opp
        visAktivtOrd(); // Oppdater fullfør-knapp
        visToast('Alle ord er tatt opp! Klikk "Lagre diktat"', 'success');
    }
}

function avbrytOpptak() {
    if (diktatState.mediaRecorder && diktatState.mediaRecorder.state === 'recording') {
        diktatState.mediaRecorder.stop();
    }
    nullstillDiktat();
}

// ============================
// STEG 3: LAGRE TIL FIREBASE
// ============================

async function fullforDiktat() {
    const user = auth.currentUser;
    if (!user) {
        visToast('Du må være logget inn', 'error');
        return;
    }

    const btn = document.getElementById('btn-fullfør-diktat');
    btn.disabled = true;
    btn.textContent = '⏳ Lagrer...';

    try {
        // Sjekk at alle ord har opptak
        const mangler = diktatState.ordliste.filter((_, i) => !diktatState.opptak[i]);
        if (mangler.length > 0) {
            visToast(`${mangler.length} ord mangler opptak`, 'error');
            btn.disabled = false;
            btn.textContent = '💾 Lagre diktat';
            return;
        }

        // Beregn TTL
        const ttlDager = await hentTTLDager(user);
        const utloperDato = new Date();
        utloperDato.setDate(utloperDato.getDate() + ttlDager);

        // Generer delingskode (6 tegn, uppercase)
        const delingskode = genererDelingskode();

        // 1. Lagre metadata til Firestore
        const docRef = await addDoc(collection(db, 'diktat-sett'), {
            laererId: user.uid,
            laererEpost: user.email,
            tittel: hentDiktatTittel(),
            kilde: diktatState.kilde,
            ordliste: diktatState.ordliste.map(o => o.tekst),
            antallOrd: diktatState.ordliste.length,
            delingskode: delingskode,
            opprettet: serverTimestamp(),
            utloperDato: utloperDato.toISOString(),
            ttlDager: ttlDager,
            aktiv: true
        });

        diktatState.settId = docRef.id;
        diktatState.delingskode = delingskode;

        // 2. Last opp lydfiler til Storage
        for (let i = 0; i < diktatState.ordliste.length; i++) {
            const blob = diktatState.opptak[i];
            const filnavn = `${i}_${diktatState.ordliste[i].tekst}`;
            const ref = storageRef(storage, `diktat/${user.uid}/${docRef.id}/${filnavn}.webm`);
            await uploadBytes(ref, blob);
        }

        // Vis ferdig-steg
        document.getElementById('diktat-steg-opptak').style.display = 'none';
        document.getElementById('diktat-steg-ferdig').style.display = 'block';
        document.getElementById('diktat-kode').textContent = delingskode;
        document.getElementById('diktat-ferdig-info').textContent =
            `${diktatState.ordliste.length} ord lagret med din stemme.`;
        document.getElementById('diktat-utloper-info').textContent =
            `Utløper: ${utloperDato.toLocaleDateString('nb-NO')} (${ttlDager} dager). Last ned for å beholde.`;

        visToast('Diktat lagret!', 'success');

        // Oppdater listen
        lastMineDiktatSett();

    } catch (err) {
        console.error('Feil ved lagring av diktat:', err);
        visToast('Feil ved lagring: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Lagre diktat';
    }
}

// ============================
// HJELPEFUNKSJONER
// ============================

function genererDelingskode() {
    const tegn = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unngår O/0, I/1
    let kode = '';
    for (let i = 0; i < 6; i++) {
        kode += tegn.charAt(Math.floor(Math.random() * tegn.length));
    }
    return kode;
}

function hentDiktatTittel() {
    const titler = {
        niva1: 'Høyfrekvente ord – Enkel',
        niva2: 'Høyfrekvente ord – Medium',
        niva4: 'Rettskriving',
        egendefinert: 'Egendefinert diktat'
    };
    return titler[diktatState.kilde] || 'Diktat';
}

async function hentTTLDager(user) {
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const erPremium = data.abonnement?.status === 'aktiv' ||
                data.subscription?.status === 'premium' ||
                data.abonnement?.type === 'skolepakke';
            if (erPremium) return TTL_DAGER_PREMIUM;
        }
    } catch (e) {
        console.warn('Kunne ikke sjekke abonnement:', e);
    }
    return TTL_DAGER_STANDARD;
}

function nullstillDiktat() {
    diktatState = {
        ordliste: [],
        opptak: {},
        aktivtIndex: 0,
        mediaRecorder: null,
        audioChunks: [],
        kilde: null,
        settId: null,
        delingskode: null
    };

    // Reset UI
    document.getElementById('diktat-steg-kilde').style.display = 'block';
    document.getElementById('diktat-steg-opptak').style.display = 'none';
    document.getElementById('diktat-steg-ferdig').style.display = 'none';
    document.getElementById('diktat-egne-ord').style.display = 'none';

    const textarea = document.getElementById('diktat-egne-ord-input');
    if (textarea) textarea.value = '';
}

function kopierDiktatKode() {
    const kode = diktatState.delingskode;
    if (!kode) return;

    navigator.clipboard.writeText(kode).then(() => {
        visToast('Kode kopiert!', 'success');
    }).catch(() => {
        // Fallback
        visToast(`Kode: ${kode}`, 'info');
    });
}

// ============================
// MINE DIKTAT-SETT (LISTE)
// ============================

async function lastMineDiktatSett() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('diktat-sett-liste');
    if (!container) return;
    container.innerHTML = '<p style="color:#999;">Laster...</p>';

    try {
        const q = query(
            collection(db, 'diktat-sett'),
            where('laererId', '==', user.uid),
            orderBy('opprettet', 'desc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = '<p style="color:#999; font-style:italic;">Ingen diktat-sett ennå.</p>';
            return;
        }

        let html = '';
        const nå = new Date();

        snapshot.forEach(docSnap => {
            const d = docSnap.data();
            const utloper = new Date(d.utloperDato);
            const dagerIgjen = Math.ceil((utloper - nå) / (1000 * 60 * 60 * 24));
            const erUtlopt = dagerIgjen <= 0;
            const snartUtlopt = dagerIgjen <= 14 && dagerIgjen > 0;

            // Auto-slett utløpte sett
            if (erUtlopt) {
                slettDiktatSett(docSnap.id, user.uid, true);
                return;
            }

            const statusBadge = snartUtlopt
                ? `<span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:8px; font-size:12px;">⚠️ ${dagerIgjen}d igjen</span>`
                : `<span style="background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:8px; font-size:12px;">✅ ${dagerIgjen}d igjen</span>`;

            html += `
                <div style="background:#f8f9fa; border-radius:12px; padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong>${escapeHtml(d.tittel)}</strong>
                        <span style="color:#888; font-size:13px; margin-left:8px;">${d.antallOrd} ord</span>
                        ${statusBadge}
                        <br><span style="color:#999; font-size:12px;">Kode: <strong>${d.delingskode}</strong></span>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-secondary" onclick="eksporterDiktatById('${docSnap.id}')" style="font-size:12px; padding:6px 10px;">📥 Last ned</button>
                        <button class="btn-secondary" onclick="slettDiktatSett('${docSnap.id}', '${user.uid}')" style="font-size:12px; padding:6px 10px; color:#dc2626;">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color:#999; font-style:italic;">Ingen aktive diktat-sett.</p>';

    } catch (err) {
        console.error('Feil ved lasting av diktat-sett:', err);
        container.innerHTML = '<p style="color:#dc2626;">Kunne ikke laste diktat-sett.</p>';
    }
}

// ============================
// SLETT DIKTAT-SETT
// ============================

async function slettDiktatSett(settId, laererId, stille = false) {
    if (!stille && !confirm('Er du sikker? Diktat-settet slettes permanent.')) return;

    try {
        // 1. Slett lydfiler fra Storage
        const mappeRef = storageRef(storage, `diktat/${laererId}/${settId}`);
        try {
            const filer = await listAll(mappeRef);
            await Promise.all(filer.items.map(item => deleteObject(item)));
        } catch (e) {
            console.warn('Kunne ikke slette Storage-filer:', e);
        }

        // 2. Slett Firestore-dokument
        await deleteDoc(doc(db, 'diktat-sett', settId));

        if (!stille) {
            visToast('Diktat-sett slettet', 'success');
            lastMineDiktatSett();
        }
    } catch (err) {
        console.error('Feil ved sletting:', err);
        if (!stille) visToast('Feil ved sletting', 'error');
    }
}

// ============================
// EKSPORT (.json med base64-lyd)
// ============================

async function eksporterDiktat() {
    // Eksporter nåværende opptak (etter fullfor)
    if (!diktatState.settId || !diktatState.ordliste.length) {
        visToast('Ingenting å eksportere', 'error');
        return;
    }

    try {
        visToast('Forbereder nedlasting...', 'info');

        const eksportData = {
            format: 'glosemester-diktat-v1',
            tittel: hentDiktatTittel(),
            kilde: diktatState.kilde,
            opprettet: new Date().toISOString(),
            laerer: auth.currentUser?.email || 'Ukjent',
            ord: []
        };

        for (let i = 0; i < diktatState.ordliste.length; i++) {
            const blob = diktatState.opptak[i];
            const base64 = blob ? await blobToBase64(blob) : null;
            eksportData.ord.push({
                tekst: diktatState.ordliste[i].tekst,
                lyd: base64
            });
        }

        lastNedJSON(eksportData, `diktat-${diktatState.kilde || 'sett'}.json`);
        visToast('Diktat lastet ned!', 'success');

    } catch (err) {
        console.error('Eksportfeil:', err);
        visToast('Feil ved eksport', 'error');
    }
}

// Eksporter et eksisterende sett fra Firebase (fra listen)
window.eksporterDiktatById = async function(settId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        visToast('Laster ned diktat...', 'info');

        // Hent metadata
        const settDoc = await getDoc(doc(db, 'diktat-sett', settId));
        if (!settDoc.exists()) {
            visToast('Fant ikke diktat-sett', 'error');
            return;
        }
        const data = settDoc.data();

        // Hent lydfiler fra Storage
        const mappeRef = storageRef(storage, `diktat/${user.uid}/${settId}`);
        const filer = await listAll(mappeRef);

        const eksportData = {
            format: 'glosemester-diktat-v1',
            tittel: data.tittel,
            kilde: data.kilde,
            opprettet: new Date().toISOString(),
            laerer: user.email || 'Ukjent',
            ord: []
        };

        // Last ned hver lydfil og konverter til base64
        for (let i = 0; i < data.ordliste.length; i++) {
            const ord = data.ordliste[i];
            let base64Lyd = null;

            // Finn matchende lydfil
            const matchFil = filer.items.find(f => f.name.startsWith(`${i}_`));
            if (matchFil) {
                const url = await getDownloadURL(matchFil);
                const response = await fetch(url);
                const blob = await response.blob();
                base64Lyd = await blobToBase64(blob);
            }

            eksportData.ord.push({ tekst: ord, lyd: base64Lyd });
        }

        lastNedJSON(eksportData, `diktat-${data.kilde || 'sett'}-${settId.slice(0, 6)}.json`);
        visToast('Diktat lastet ned!', 'success');

    } catch (err) {
        console.error('Eksportfeil:', err);
        visToast('Feil ved nedlasting', 'error');
    }
};

// ============================
// IMPORT (.json)
// ============================

function importerDiktat() {
    document.getElementById('diktat-import-input').click();
}

async function handleDiktatImport(event) {
    const fil = event.target.files[0];
    if (!fil) return;

    const user = auth.currentUser;
    if (!user) {
        visToast('Du må være logget inn', 'error');
        return;
    }

    try {
        visToast('Importerer diktat...', 'info');

        const tekst = await fil.text();
        const data = JSON.parse(tekst);

        // Valider format
        if (data.format !== 'glosemester-diktat-v1') {
            visToast('Ugyldig fil-format', 'error');
            return;
        }

        if (!data.ord || data.ord.length < 2) {
            visToast('Filen inneholder for få ord', 'error');
            return;
        }

        if (data.ord.length > MAKS_ORD_PER_SETT) {
            visToast(`Maks ${MAKS_ORD_PER_SETT} ord per sett`, 'error');
            return;
        }

        // Sett opp state
        diktatState.ordliste = data.ord.map(o => ({ tekst: o.tekst }));
        diktatState.kilde = data.kilde || 'importert';
        diktatState.opptak = {};

        // Konverter base64 tilbake til blobs
        for (let i = 0; i < data.ord.length; i++) {
            if (data.ord[i].lyd) {
                diktatState.opptak[i] = base64ToBlob(data.ord[i].lyd);
            }
        }

        // Sjekk at alle ord har lyd
        const mangler = data.ord.filter(o => !o.lyd).length;
        if (mangler > 0) {
            visToast(`${mangler} ord mangler lyd — du kan ta de opp på nytt`, 'info');
            // Gå til opptak-steg slik at manglende ord kan tas opp
            startOpptakSteg();
        } else {
            // Alt er komplett — lagre direkte
            startOpptakSteg();
            visToast('Import OK! Sjekk opptakene og klikk "Lagre diktat"', 'success');
        }

    } catch (err) {
        console.error('Importfeil:', err);
        visToast('Kunne ikke lese filen', 'error');
    }

    // Reset file input
    event.target.value = '';
}

// ============================
// HENT DIKTAT FOR ELEV
// ============================

export async function hentDiktatForElev(delingskode) {
    try {
        const q = query(
            collection(db, 'diktat-sett'),
            where('delingskode', '==', delingskode.toUpperCase()),
            where('aktiv', '==', true)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const settDoc = snapshot.docs[0];
        const data = settDoc.data();

        // Sjekk TTL
        const utloper = new Date(data.utloperDato);
        if (utloper < new Date()) return null;

        // Hent lyd-URLer fra Storage
        const mappeRef = storageRef(storage, `diktat/${data.laererId}/${settDoc.id}`);
        const filer = await listAll(mappeRef);

        const lydUrler = {};
        for (const fil of filer.items) {
            const url = await getDownloadURL(fil);
            // Filnavn: "0_jeg.webm" → index 0
            const idx = parseInt(fil.name.split('_')[0]);
            lydUrler[idx] = url;
        }

        return {
            id: settDoc.id,
            tittel: data.tittel,
            ordliste: data.ordliste,
            lydUrler: lydUrler,
            laererEpost: data.laererEpost
        };

    } catch (err) {
        console.error('Feil ved henting av diktat:', err);
        return null;
    }
}

// ============================
// BASE64 KONVERTERING
// ============================

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64String) {
    const parts = base64String.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'audio/webm';
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
}

function lastNedJSON(data, filnavn) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filnavn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
