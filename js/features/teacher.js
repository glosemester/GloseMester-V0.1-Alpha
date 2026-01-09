/* ============================================
   TEACHER.JS - Lærerfunksjoner v3.1 
   
   OPPDATERINGER I v3.1:
   ✅ Nye priser (99kr/mnd, 800kr/år for Premium)
   ✅ Skolepakker (5000-10000 kr/år)
   ✅ Gratis tier: 3 prøver
   ✅ Skolepakke-forespørsel via Netlify Function
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd } from '../ui/helpers.js';
import { auth, db, collection, addDoc, serverTimestamp, getDoc, doc, updateDoc } from './firebase.js';

//⚠️ VIKTIG: All innlogging skjer nå i auth.js!
// Denne filen håndterer KUN lærerfunksjoner (prøver, editor osv)

// ==============================================
// PRØVE-EDITOR
// ==============================================

let midlertidigProveListe = [];

/**
 * Legger til et nytt ord i prøve-editoren
 */
export function leggTilOrd() {
    const spmInput = document.getElementById('nytt-sporsmaal');
    const svarInput = document.getElementById('nytt-svar');
    
    if (!spmInput || !svarInput) {
        console.error('Fant ikke input-feltene for ord');
        return;
    }
    
    const norsk = spmInput.value.trim();
    const engelsk = svarInput.value.trim();
    
    // Validering
    if (!norsk || !engelsk) { 
        visToast("Skriv både norsk og engelsk ord.", "error"); 
        return; 
    }
    
    // Sjekk for duplikater
    if (midlertidigProveListe.some(ord => 
        ord.s.toLowerCase() === norsk.toLowerCase() || 
        ord.e.toLowerCase() === engelsk.toLowerCase()
    )) {
        visToast("Dette ordet finnes allerede i listen.", "warning");
        return;
    }
    
    // Legg til ord
    midlertidigProveListe.push({ s: norsk, e: engelsk });
    oppdaterEditorListe();
    
    // Reset inputs
    spmInput.value = ''; 
    svarInput.value = ''; 
    spmInput.focus();
    
    // Feedback
    spillLyd('klikk');
    visToast(`✅ "${norsk}" lagt til`, "success");
}

/**
 * Oppdaterer visuell liste i editoren
 */
function oppdaterEditorListe() {
    const listeEl = document.getElementById('editor-liste');
    if (!listeEl) {
        console.warn('Fant ikke editor-liste element');
        return;
    }
    
    listeEl.innerHTML = '';
    
    if (midlertidigProveListe.length === 0) {
        listeEl.innerHTML = `
            <li style="color:#999; text-align:center; padding:30px;">
                <p>Ingen ord lagt til ennå...</p>
                <p style="font-size:12px; margin-top:10px;">Tips: Trykk Enter for å legge til raskt!</p>
            </li>
        `;
        return;
    }
    
    midlertidigProveListe.forEach((ord, index) => {
        const li = document.createElement('li');
        li.style.cssText = `
            display:flex; 
            justify-content:space-between; 
            align-items:center; 
            padding:12px 15px; 
            background:#f9f9f9; 
            border-radius:8px; 
            margin-bottom:8px;
            border-left: 3px solid #0071e3;
        `;
        
        li.innerHTML = `
            <span style="flex:1;">
                <strong style="color:#0071e3;">${ord.s}</strong> 
                <span style="color:#999; margin:0 10px;">→</span> 
                <span style="color:#333;">${ord.e}</span>
            </span> 
            <button 
                onclick="slettOrd(${index})" 
                class="btn-danger btn-small" 
                title="Slett ord"
                style="padding:5px 10px; font-size:12px;">
                🗑️ Slett
            </button>
        `;
        
        listeEl.appendChild(li);
    });
    
    // Oppdater telling
    const antallEl = document.getElementById('editor-antall');
    if (antallEl) {
        antallEl.innerText = `${midlertidigProveListe.length} ord`;
    }
    
    // Oppdater lagreknapp-status
    const lagreBtn = document.getElementById('lagre-prove-btn');
    if (lagreBtn) {
        if (midlertidigProveListe.length >= 3) {
            lagreBtn.disabled = false;
            lagreBtn.style.opacity = '1';
        } else {
            lagreBtn.disabled = true;
            lagreBtn.style.opacity = '0.5';
        }
    }
}

/**
 * Sletter et ord fra listen (global for onclick)
 */
window.slettOrd = function(index) {
    if (index < 0 || index >= midlertidigProveListe.length) return;
    
    const slettetOrd = midlertidigProveListe[index];
    midlertidigProveListe.splice(index, 1);
    oppdaterEditorListe();
    spillLyd('klikk');
    visToast(`Fjernet "${slettetOrd.s}"`, "info");
};

/**
 * Tømmer hele listen
 */
export function tomListe() {
    if (midlertidigProveListe.length === 0) return;
    
    if (confirm(`Er du sikker på at du vil slette alle ${midlertidigProveListe.length} ordene?`)) {
        midlertidigProveListe = [];
        oppdaterEditorListe();
        visToast("Listen er tømt", "info");
    }
}

// ==============================================
// LAGRE PRØVE TIL FIREBASE
// ==============================================

/**
 * Lagrer prøve til Firebase (med abonnement-sjekk)
 */
export async function lagreProve() {
    const tittelInput = document.getElementById('prove-tittel');
    if (!tittelInput) {
        visToast("Fant ikke tittel-felt", "error");
        return;
    }
    
    const tittel = tittelInput.value.trim();
    
    // Validering
    if (!tittel) { 
        visToast("Prøven må ha et navn!", "error"); 
        tittelInput.focus();
        return; 
    }
    
    if (midlertidigProveListe.length < 3) { 
        visToast("Du må legge til minst 3 ord.", "error"); 
        return; 
    }
    
    // Sjekk autentisering
    const user = auth.currentUser;
    if (!user) {
        visToast("Du må være innlogget for å lagre prøver.", "error");
        document.getElementById('laerer-login-popup').style.display = 'flex';
        return;
    }
    
    // ✅ SJEKK ABONNEMENT
    try {
        const abonnement = await sjekkAbonnement(user);
        
        if (!abonnement.kanLageProver) {
            if (abonnement.tier === 'free') {
                visToast(`Du har brukt dine 3 gratis prøver. Oppgrader for å lage flere.`, "warning");
            } else if (abonnement.tier === 'expired') {
                visToast("Abonnementet ditt er utløpt. Forny for å fortsette.", "warning");
            }
            
            // Vis oppgradering-modal
            document.getElementById('upgrade-modal').style.display = 'flex';
            return;
        }
        
        // Vis loading-indikator
        const lagreBtn = document.getElementById('lagre-prove-btn');
        const originalTekst = lagreBtn ? lagreBtn.innerText : '';
        if (lagreBtn) {
            lagreBtn.disabled = true;
            lagreBtn.innerText = '💾 Lagrer...';
        }
        
        // Lagre til Firebase (prover collection)
        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ordliste: midlertidigProveListe,
            opprettet_av: user.uid,
            opprettet_av_epost: user.email,
            opprettet_dato: serverTimestamp(),
            antall_gjennomforinger: 0,
            emne: "generelt",
            aktiv: true
        });
        
        // NYTT: Lagre OGSÅ til GloseBank (automatisk)
        // Alle prøver er norsk-engelsk, så alle lagres til GloseBank
        try {
            await addDoc(collection(db, "glosebank"), {
                // Prøvedata
                tittel: tittel,
                ordliste: midlertidigProveListe,
                
                // Metadata
                opprettet_av: user.uid,
                opprettet_av_epost: user.email,
                opprettet_dato: serverTimestamp(),
                
                // Kategorisering (settes av admin senere)
                fag: "engelsk", // Alle prøver er engelsk
                nivå: null,
                trinn: null,
                emne: null,
                LK20_kompetansemål: [],
                vanskelighetsgrad: null,
                
                // Status (venter på godkjenning)
                status: "pending",
                synlig_for_kunder: false,
                
                // Statistikk
                nedlastninger: 0,
                rating_sum: 0,
                rating_count: 0,
                rating_snitt: 0,
                
                // Admin
                admin_notat: "",
                sist_redigert: serverTimestamp(),
                tags: ["engelsk"],
                
                // Referanse til original prøve
                original_prove_id: docRef.id
            });
            
            console.log('✅ Prøve lagret til GloseBank (pending godkjenning)');
        } catch (gbError) {
            console.error('⚠️ Kunne ikke lagre til GloseBank:', gbError);
            // Ikke stopp prosessen hvis GloseBank-lagring feiler
        }
        
        // Oppdater brukerens prøve-telling
        await inkrementerProveAntall(user);
        
        // Suksess!
        spillLyd('fanfare');
        const proveKode = docRef.id; // Bruk full ID (20 tegn)
        visToast(`✅ Prøve lagret! Kode: ${proveKode}`, "success");
        
        // Reset editor
        midlertidigProveListe = [];
        tittelInput.value = '';
        oppdaterEditorListe();
        
        // Gå til oversikt
        setTimeout(() => {
            visSide('lagrede-prover');
            if (typeof window.oppdaterProveliste === 'function') {
                window.oppdaterProveliste();
            }
        }, 1500);
        
    } catch (error) {
        console.error("Lagring feilet:", error);
        
        // Spesifikke feilmeldinger
        if (error.code === 'permission-denied') {
            visToast("❌ Du har ikke tilgang til å lagre prøver.", "error");
        } else if (error.code === 'unavailable') {
            visToast("❌ Ingen nettforbindelse. Sjekk internett.", "error");
        } else {
            visToast("❌ Kunne ikke lagre prøven. Prøv igjen.", "error");
        }
    } finally {
        // Reset knapp
        const lagreBtn = document.getElementById('lagre-prove-btn');
        if (lagreBtn) {
            lagreBtn.disabled = false;
            lagreBtn.innerText = '💾 Lagre prøve';
        }
    }
}

// ==============================================
// ABONNEMENT-LOGIKK (OPPDATERT MED NYE PRISER)
// ==============================================

/**
 * Sjekker brukerens abonnement-status
 * @returns {Object} { kanLageProver, tier, proverIgjen, abonnementInfo }
 */
async function sjekkAbonnement(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            console.warn('Bruker-dokument finnes ikke, oppretter...');
            // Opprett bruker-dokument hvis det ikke finnes
            await setDoc(userDocRef, {
                email: user.email,
                opprettet: serverTimestamp(),
                abonnement: { 
                    status: 'free',
                    start_dato: serverTimestamp()
                },
                proverOpprettet: 0
            });
            return { 
                kanLageProver: true, 
                tier: 'free', 
                proverIgjen: 3,
                abonnementInfo: { status: 'free' }
            };
        }
        
        const data = userSnap.data();
        const abonnement = data.abonnement || { status: 'free' };
        const proverOpprettet = data.proverOpprettet || 0;
        
        // ✅ GRATIS BRUKER: Max 3 prøver (oppdatert fra 1)
        if (abonnement.status === 'free') {
            return {
                kanLageProver: proverOpprettet < 3,
                tier: 'free',
                proverIgjen: Math.max(0, 3 - proverOpprettet),
                abonnementInfo: abonnement
            };
        }
        
        // ✅ PREMIUM LÆRER: Ubegrenset (årlig abonnement)
        if (abonnement.status === 'premium') {
            const utloper = abonnement.utloper?.toDate();
            
            if (utloper && Date.now() > utloper.getTime()) {
                return { 
                    kanLageProver: false, 
                    tier: 'expired', 
                    proverIgjen: 0,
                    abonnementInfo: abonnement
                };
            }
            
            return { 
                kanLageProver: true, 
                tier: 'premium', 
                proverIgjen: Infinity,
                abonnementInfo: abonnement
            };
        }
        
        // ✅ SKOLE-ABONNEMENT: Ubegrenset (årlig)
        if (abonnement.status === 'school') {
            const utloper = abonnement.utloper?.toDate();
            
            if (utloper && Date.now() > utloper.getTime()) {
                return { 
                    kanLageProver: false, 
                    tier: 'expired', 
                    proverIgjen: 0,
                    abonnementInfo: abonnement
                };
            }
            
            return { 
                kanLageProver: true, 
                tier: 'school', 
                proverIgjen: Infinity,
                abonnementInfo: abonnement
            };
        }
        
        // Ukjent status - behandle som gratis
        console.warn('Ukjent abonnement-status:', abonnement.status);
        return { 
            kanLageProver: proverOpprettet < 3, 
            tier: 'free', 
            proverIgjen: Math.max(0, 3 - proverOpprettet),
            abonnementInfo: abonnement
        };
        
    } catch (error) {
        console.error("Feil ved abonnementsjekk:", error);
        // Ved feil: Tillat 3 prøver (fail-safe)
        return { 
            kanLageProver: true, 
            tier: 'error', 
            proverIgjen: 3,
            abonnementInfo: { status: 'error' }
        };
    }
}

/**
 * Inkrementer antall prøver opprettet
 */
async function inkrementerProveAntall(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        
        // Bruk updateDoc i stedet for setDoc for å ikke overskrive eksisterende data
        const currentData = await getDoc(userDocRef);
        const currentCount = currentData.data()?.proverOpprettet || 0;
        
        await updateDoc(userDocRef, {
            proverOpprettet: currentCount + 1,
            siste_aktivitet: serverTimestamp()
        });
        
        console.log(`✅ Prøve-telling oppdatert: ${currentCount + 1}`);
    } catch (error) {
        console.warn("Kunne ikke oppdatere prøve-telling:", error);
        // Ikke kritisk - fortsett uansett
    }
}

// ==============================================
// BULK IMPORT (BONUS)
// ==============================================

/**
 * Importer ord fra CSV/TXT-fil
 */
export function importerFraCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const innhold = event.target.result;
                const linjer = innhold.split('\n').filter(l => l.trim());
                
                let importerte = 0;
                let feil = 0;
                
                linjer.forEach(linje => {
                    // Støtt både komma, semikolon og tab
                    const deler = linje.split(/[,;\t]/).map(s => s.trim());
                    
                    if (deler.length >= 2) {
                        const [norsk, engelsk] = deler;
                        
                        if (norsk && engelsk) {
                            // Sjekk om det allerede finnes
                            if (!midlertidigProveListe.some(ord => 
                                ord.s.toLowerCase() === norsk.toLowerCase()
                            )) {
                                midlertidigProveListe.push({ s: norsk, e: engelsk });
                                importerte++;
                            }
                        }
                    } else {
                        feil++;
                    }
                });
                
                oppdaterEditorListe();
                spillLyd('fanfare');
                visToast(
                    `✅ Importerte ${importerte} ord!${feil > 0 ? ` (${feil} feil)` : ''}`, 
                    "success"
                );
                
            } catch (error) {
                console.error('Import feil:', error);
                visToast("❌ Kunne ikke lese filen. Sjekk formatet.", "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================================
// KAMPANJEKODER (MED NYE PRISER)
// ==============================================

/**
 * Sjekker og aktiverer kampanjekode
 */
export async function sjekkKampanjeKode() {
    const input = document.getElementById('kampanje-input');
    const feilEl = document.getElementById('kampanje-feil');
    
    if (!input) return;
    
    const kode = input.value.trim().toUpperCase();
    
    if (!kode) {
        if (feilEl) {
            feilEl.textContent = 'Skriv inn en kode';
            feilEl.style.display = 'block';
        }
        return;
    }
    
    // ✅ OPPDATERTE KAMPANJEKODER MED NYE PRISER
    const gyldigeKoder = {
        // Beta-testing koder (Premium)
        'BETA2026': { dager: 90, type: 'premium', beskrivelse: 'Beta-tester bonus (3 mnd gratis)' },
        'LANSERING': { dager: 30, type: 'premium', beskrivelse: 'Lanseringstilbud (1 mnd gratis)' },
        
        // Skolepakke-koder (GloseBank tilgang)
        'SKOLE2026': { dager: 365, type: 'skolepakke', beskrivelse: 'Skolepakke med GloseBank (1 år)' },
        'SKOLEPILOT': { dager: 180, type: 'skolepakke', beskrivelse: 'Skolepakke pilot (6 mnd)' },
        'SKOLETEST': { dager: 30, type: 'skolepakke', beskrivelse: 'Skolepakke test (1 mnd)' },
        
        // Premium test-koder
        'TEST7': { dager: 7, type: 'premium', beskrivelse: 'Premium test (7 dager)' },
        'TEST30': { dager: 30, type: 'premium', beskrivelse: 'Premium test (30 dager)' }
    };
    
    if (!gyldigeKoder[kode]) {
        if (feilEl) {
            feilEl.textContent = '❌ Ugyldig kode';
            feilEl.style.display = 'block';
        }
        spillLyd('feil');
        return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        visToast("Du må være innlogget først", "error");
        return;
    }
    
    try {
        const kampanje = gyldigeKoder[kode];
        const utloper = new Date();
        utloper.setDate(utloper.getDate() + kampanje.dager);
        
        // Oppdater brukerens abonnement med RIKTIG struktur
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            abonnement: {
                type: kampanje.type,        // 'premium' eller 'skolepakke'
                status: 'active',            // Alltid 'active' ved aktivering
                start_dato: serverTimestamp(),
                utloper: utloper,
                kampanjekode: kode,
                beskrivelse: kampanje.beskrivelse
            }
        });
        
        // Suksess!
        document.getElementById('upgrade-modal').style.display = 'none';
        spillLyd('fanfare');
        
        // Spesiell melding for skolepakke
        if (kampanje.type === 'skolepakke') {
            visToast(
                `🎉 Skolepakke aktivert! Du har nå tilgang til GloseBank i ${kampanje.dager} dager.`, 
                "success"
            );
        } else {
            visToast(
                `🎉 Kode aktivert! ${kampanje.beskrivelse}`, 
                "success"
            );
        }
        
        // Oppdater UI
        setTimeout(() => {
            location.reload(); // Enkleste måte å oppdatere alt på
        }, 2000);
        
    } catch (error) {
        console.error('Kampanjekode-feil:', error);
        visToast("Kunne ikke aktivere koden. Prøv igjen.", "error");
    }
}

/**
 * Vis abonnement-info til bruker
 */
export async function visAbonnementInfo() {
    const user = auth.currentUser;
    if (!user) {
        visToast("Du må være innlogget", "error");
        return;
    }
    
    try {
        const status = await sjekkAbonnement(user);
        const { tier, proverIgjen, abonnementInfo } = status;
        
        let melding = '';
        
        if (tier === 'free') {
            melding = `📦 Gratis-plan\nDu har ${proverIgjen} prøver igjen.\n\nOppgrader for ubegrenset tilgang!`;
        } else if (tier === 'premium') {
            const utloper = abonnementInfo.utloper?.toDate();
            const utloperDato = utloper ? utloper.toLocaleDateString('no-NO') : 'Ukjent';
            melding = `⭐ Premium Lærer\nAktiv til: ${utloperDato}\n\nDu har ubegrenset tilgang!`;
        } else if (tier === 'school') {
            const utloper = abonnementInfo.utloper?.toDate();
            const utloperDato = utloper ? utloper.toLocaleDateString('no-NO') : 'Ukjent';
            melding = `🏫 Skole-pakke\nAktiv til: ${utloperDato}\n\nFull tilgang for hele skolen!`;
        } else if (tier === 'expired') {
            melding = `⚠️ Abonnement utløpt\n\nForny abonnementet for å fortsette.`;
        }
        
        alert(melding);
        
    } catch (error) {
        console.error('Feil ved visning av abonnement:', error);
        visToast("Kunne ikke hente abonnement-info", "error");
    }
}

// ==============================================
// KEYBOARD SHORTCUTS
// ==============================================

/**
 * Sett opp hurtigtaster i editoren
 */
function setupKeyboardShortcuts() {
    // Enter i input-felt = legg til ord
    const spmInput = document.getElementById('nytt-sporsmaal');
    const svarInput = document.getElementById('nytt-svar');
    
    if (spmInput && svarInput) {
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                leggTilOrd();
            }
        };
        
        spmInput.addEventListener('keydown', handleEnter);
        svarInput.addEventListener('keydown', handleEnter);
    }
    
    // Ctrl+S = lagre prøve
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            
            // Sjekk om vi er på editor-siden
            const editorSide = document.getElementById('laerer-dashboard');
            if (editorSide && editorSide.classList.contains('active')) {
                lagreProve();
            }
        }
    });
}

// ==============================================
// SKOLEPAKKE-FORESPØRSEL
// ==============================================

/**
 * Send forespørsel om Skolepakke
 */
async function sendSchoolInquiry() {
    const schoolName = document.getElementById('school-name')?.value.trim();
    const orgNumber = document.getElementById('org-number')?.value.trim();
    const contactPerson = document.getElementById('contact-person')?.value.trim();
    const contactEmail = document.getElementById('contact-email')?.value.trim();
    const contactPhone = document.getElementById('contact-phone')?.value.trim();
    const teacherCount = document.getElementById('teacher-count')?.value;
    const message = document.getElementById('school-message')?.value.trim();

    // Validering
    if (!schoolName || !orgNumber || !contactPerson || !contactEmail || !contactPhone || !teacherCount) {
        visToast("Alle feltene må fylles ut", "error");
        return;
    }

    // Valider e-post
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
        visToast("Ugyldig e-postadresse", "error");
        return;
    }

    try {
        visToast("Sender forespørsel...", "info");

        console.log('📋 Sender skolepakke-forespørsel:', schoolName);

        // Kall Netlify Function
        const response = await fetch('/.netlify/functions/school-inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schoolName,
                orgNumber,
                contactPerson,
                contactEmail,
                contactPhone,
                teacherCount,
                message
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Kunne ikke sende forespørsel');
        }

        const data = await response.json();
        console.log('✅ Forespørsel sendt:', data.inquiryId);

        // Suksess!
        spillLyd('fanfare');
        visToast("🎉 Forespørsel sendt! Vi kontakter dere snart.", "success");

        // Lukk modal og nullstill skjema
        const modal = document.getElementById('skolepakke-modal');
        if (modal) modal.style.display = 'none';
        
        const form = document.getElementById('skolepakke-form');
        if (form) form.reset();

    } catch (error) {
        console.error('❌ Skolepakke-feil:', error);
        visToast(`Kunne ikke sende forespørsel: ${error.message}`, "error");
    }
}

// ==============================================
// INITIALISERING
// ==============================================

export function initTeacherFeatures() {
    console.log("🎓 Lærer-modul lastet (v3.1 - Oppdaterte priser).");
    
    // Eksponer globale funksjoner (for onclick i HTML)
    window.leggTilOrd = leggTilOrd;
    window.lagreProve = lagreProve;
    window.importerFraCSV = importerFraCSV;
    window.tomListe = tomListe;
    window.sjekkKampanjeKode = sjekkKampanjeKode;
    window.visAbonnementInfo = visAbonnementInfo;
    window.sendSchoolInquiry = sendSchoolInquiry;  // NY!
    
    // Sett opp keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initial oppdatering av UI
    oppdaterEditorListe();
    
    console.log("💰 Priser: Premium 99kr/mnd eller 800kr/år, Skolepakke fra 5000kr/år");
}