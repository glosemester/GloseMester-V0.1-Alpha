// ============================================
// QUIZ.JS - GloseMester v0.8.0 (PROFESJONELL VERSJON)
// Oppdatert: Konstanter, sikkerhet, accessibility, memory management
// ============================================
import { spillLyd, vibrer, visToast, lagConfetti, lesOpp } from '../ui/helpers.js';
import { hentTilfeldigKort } from './kort-display.js';
import { trackEvent } from '../core/analytics.js';
import { db, doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from './firebase.js';
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits, lagreElevProveLokalt, hentElevProverLokalt } from '../core/storage.js';

// ============================================
// KONSTANTER (fjerner magic numbers)
// ============================================
const TIMING = {
    RIKTIG_SVAR_PAUSE: 1200,      // ms før neste ord ved riktig svar
    FEIL_SVAR_PAUSE: 3200,         // ms før neste ord ved feil svar
    RIKTIG_POPUP_VARIGHET: 1000,  // ms riktig-popup vises
    FEIL_POPUP_AUTO_LUKK: 3000,   // ms feil-popup auto-lukker
};

const PROGRESS = {
    RUTER_ANTALL: 10,              // Antall ruter i progress bar
    XP_PER_KORT: 10,               // XP needed per kort
    XP_PER_DIAMANT_BONUS: 100,    // XP needed for diamant-bonus
    DIAMANTER_PER_BONUS: 10,       // Antall diamanter ved bonus
};

const STORAGE = {
    ELEV_PROVER_VARIGHET_DAGER: 7, // Dager før prøver slettes
};

// ============================================
// STATE VARIABLER
// ============================================
let aktivProve = [];
let aktivProveId = null;
let aktivProveEier = null;
let quizIndex = 0;
let antallRiktige = 0;
let kortVunnetISesjon = 0;
let diamanterVunnetISesjon = 0;
let alleElevSvar = [];
let proveStartTid = null;
let besvarer = false;
let activePopupCleanup = null; // ✅ NYTT: For å unngå memory leaks

// --- TEGN LISTEN OVER LAGREDE PRØVER ---
function visLagredeProverUI() {
    const liste = hentElevProverLokalt();
    const container = document.getElementById('elev-lagrede-prover-container');
    const listeDiv = document.getElementById('elev-lagrede-liste');
    
    if (liste.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    listeDiv.innerHTML = '';
    
    liste.forEach(prove => {
        const msIgjen = prove.utloperDato - Date.now();
        const dagerIgjen = Math.ceil(msIgjen / (1000 * 60 * 60 * 24));
        
        const div = document.createElement('div');
        div.style.cssText = "background:white; border:1px solid #eee; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
            <div>
                <div style="font-weight:bold;">${prove.tittel}</div>
                <div style="font-size:11px; color:${dagerIgjen < 2 ? 'red' : '#999'};">
                    Slettes om ${dagerIgjen} dager
                </div>
            </div>
            <button class="btn-primary btn-small" onclick="startLagretProve('${prove.id}')">Start</button>
        `;
        listeDiv.appendChild(div);
    });
    
    // ✅ OPPDATER OGSÅ START-SKJERM PROGRESS
    oppdaterStartSkjermProgress();
}

// ✅ NY FUNKSJON: Oppdater progress i START-SKJERMEN
function oppdaterStartSkjermProgress() {
    const container = document.getElementById('elev-start-progress-target');
    if (!container) return;

    const totalXP = getTotalCorrect();
    const antallFylte = (totalXP % PROGRESS.XP_PER_KORT === 0 && totalXP > 0)
        ? PROGRESS.XP_PER_KORT
        : totalXP % PROGRESS.XP_PER_KORT;
    const antallRuter = PROGRESS.RUTER_ANTALL;

    let ruterHTML = '';
    
    for (let i = 0; i < antallRuter; i++) {
        const erFylt = i < antallFylte;
        const farge = erFylt ? '#4CAF50' : '#e0e0e0'; 
        const border = erFylt ? '1px solid #388E3C' : '1px solid #ccc';
        
        ruterHTML += `
            <div style="
                flex: 1; 
                height: 12px; 
                background-color: ${farge}; 
                border: ${border}; 
                border-radius: 3px;
                transition: background-color 0.3s ease;
            "></div>
        `;
    }

    container.innerHTML = `
        <div style="display:flex; gap:4px;">
            ${ruterHTML}
        </div>
    `;
    
    // Oppdater også teksten
    const textElem = document.getElementById('quiz-progress-text');
    if (textElem) textElem.innerText = `${antallFylte} / 10`;
}

window.startLagretProve = function(id) {
    const liste = hentElevProverLokalt();
    const prove = liste.find(p => p.id === id);
    if(prove) {
        aktivProveEier = prove.opprettet_av || null; // ✅ Sett eier hvis tilgjengelig
        kjorProveInit(prove.ordliste, prove.tittel, id);
    }
};

async function startProve(kode) {
    if (!kode) {
        const input = document.getElementById('prove-kode');
        if (input) kode = input.value.trim();
    }
    
    if (!kode) {
        visToast('Mangler prove-kode!', 'error');
        return;
    }

    document.getElementById('prove-omraade').style.display = 'none';
    kortVunnetISesjon = 0;
    diamanterVunnetISesjon = 0;

    // 1. SJEKK SKYEN
    if (kode.length < 50 && !kode.includes('{')) {
        try {
            visToast("Henter prøve...", "info");
            const docRef = doc(db, "prover", kode);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                aktivProveEier = data.opprettet_av || null; // ✅ NYTT: Lagre prøveeier
                lagreElevProveLokalt({ id: kode, ...data });
                kjorProveInit(data.ordliste, data.tittel, kode);
                return;
            } else {
                visToast('Fant ikke prøven. Sjekk koden og prøv igjen.', 'error');
                return;
            }
        } catch (e) {
            console.error("Feil mot skyen:", e);
            visToast('Kunne ikke hente prøve. Sjekk internettforbindelsen.', 'error');
            return;
        }
    }

    // 2. SJEKK OFFLINE
    try {
        const json = decodeURIComponent(atob(kode));
        const data = JSON.parse(json);
        const ordliste = data.ord || data.ordliste || data;
        const tittel = data.tittel || "Offline Prøve";
        const offlineId = "offline_"+Date.now();
        aktivProveEier = null; // ✅ Offline-prøver har ingen eier
        lagreElevProveLokalt({ id: offlineId, tittel: tittel, ordliste: ordliste });
        kjorProveInit(ordliste, tittel, offlineId);
    } catch (e) {
        visToast('Ugyldig kode. Sjekk at du har kopiert hele koden.', 'error');
    }
}

function kjorProveInit(ordliste, tittel = "Prove", proveId = null) {
    if (!ordliste || ordliste.length === 0) {
        visToast("Denne proven er tom!", "error");
        return;
    }

    aktivProve = ordliste;
    aktivProveId = proveId;
    quizIndex = 0;
    antallRiktige = 0;
    alleElevSvar = [];
    proveStartTid = Date.now();
    besvarer = false; // ✅ Reset svar-lås
    window.proveSprak = 'no';

    if(window.visSide) window.visSide('elev-dashboard');

    document.getElementById('prove-omraade').style.display = 'block';
    document.getElementById('elev-start-skjerm').style.display = 'none';

    const header = document.querySelector('#prove-omraade h3');
    if(header) header.innerText = tittel;

    // ✅ FIX: Legg til Enter-taste funksjonalitet
    const inputFelt = document.getElementById('quiz-input');
    if (inputFelt) {
        // Fjern eksisterende listeners først (unngå duplikater)
        inputFelt.removeEventListener('keypress', handleQuizEnter);
        // Legg til ny listener
        inputFelt.addEventListener('keypress', handleQuizEnter);
    }

    // Oppdater progress ved start
    oppdaterQuizProgress();

    visNesteSporsmaal();
    trackEvent('Quiz', 'Start', tittel);
}

// ✅ NYTT: Event handler for Enter-taste i prøvemodus
function handleQuizEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Hindre form-submit
        sjekkSvar();
    }
}

// ============================================
// NYTT: 10-RUTE PROGRESS (som i øving)
// ============================================
function oppdaterQuizProgress() {
    const container = document.getElementById('quiz-progress-target');
    if (!container) return;

    const totalXP = getTotalCorrect();
    const antallFylte = (totalXP % PROGRESS.XP_PER_KORT === 0 && totalXP > 0)
        ? PROGRESS.XP_PER_KORT
        : totalXP % PROGRESS.XP_PER_KORT;
    const antallRuter = PROGRESS.RUTER_ANTALL;

    let ruterHTML = '';
    
    for (let i = 0; i < antallRuter; i++) {
        const erFylt = i < antallFylte;
        const farge = erFylt ? '#4CAF50' : '#e0e0e0'; 
        const border = erFylt ? '1px solid #388E3C' : '1px solid #ccc';
        
        ruterHTML += `
            <div style="
                flex: 1; 
                height: 12px; 
                background-color: ${farge}; 
                border: ${border}; 
                border-radius: 3px;
                transition: background-color 0.3s ease;
            "></div>
        `;
    }

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px; color:#666; font-weight:bold;">
            <span>MOT NYTT KORT:</span>
            <span>${antallFylte} / 10</span>
        </div>
        <div style="display:flex; gap:4px; margin-bottom:15px;">
            ${ruterHTML}
        </div>
    `;
}

function visNesteSporsmaal() {
    // Oppdater progress først
    oppdaterQuizProgress();

    if (quizIndex >= aktivProve.length) {
        avsluttProve();
        return;
    }

    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';

    const spmNorsk = ord.sporsmaal || ord.s;
    const svarEngelsk = ord.svar || ord.e;
    const spmTekst = spraak === 'en' ? svarEngelsk : spmNorsk;

    const inputFelt = document.getElementById('quiz-input');
    const svarKnapp = document.querySelector('button.btn-primary[onclick*="sjekkSvar"]');

    document.getElementById('quiz-spm').innerText = spmTekst;
    inputFelt.value = '';

    // ✅ Lås opp input OG knapp for neste svar
    besvarer = false;
    inputFelt.disabled = false;
    if (svarKnapp) svarKnapp.disabled = false;
    inputFelt.focus();

    const progressElem = document.getElementById('quiz-progress');
    if(progressElem) progressElem.innerText = `${quizIndex + 1} / ${aktivProve.length}`;
}

// ==============================================
// MODERNE POPUP FOR RIKTIG SVAR
// ==============================================
function visRiktigPopup() {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s;
    `;

    popup.innerHTML = `
        <div style="
            background: white;
            padding: 40px 60px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.2s;
            border-top: 5px solid #34c759;
        ">
            <div style="font-size: 70px; margin-bottom: 10px;">✅</div>
            <h2 style="color: #34c759; margin: 0; font-size: 28px;">Riktig!</h2>
        </div>
    `;

    document.body.appendChild(popup);

    // Auto-lukk etter definert varighet
    setTimeout(() => {
        if (popup.parentElement) popup.remove();
    }, TIMING.RIKTIG_POPUP_VARIGHET);
}

// ==============================================
// MODERNE POPUP FOR FEIL SVAR (MED SIKKERHET & A11Y)
// ==============================================
function visFeilPopup(fasit) {
    // ✅ Rydd opp eksisterende popup først (forhindre duplikater)
    if (activePopupCleanup) {
        activePopupCleanup();
    }

    const popup = document.createElement('div');
    popup.className = 'quiz-popup-overlay';
    popup.setAttribute('role', 'alertdialog');
    popup.setAttribute('aria-labelledby', 'feil-popup-tittel');
    popup.setAttribute('aria-describedby', 'feil-popup-beskrivelse');
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
    `;

    // ✅ Sanitér fasit for å forhindre XSS
    const sanitizedFasit = String(fasit)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

    popup.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 16px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s;
        ">
            <div style="font-size: 60px; margin-bottom: 15px;" aria-hidden="true">❌</div>
            <h2 id="feil-popup-tittel" style="color: #ff3b30; margin: 0 0 15px 0; font-size: 24px;">Beklager!</h2>
            <p id="feil-popup-beskrivelse" style="color: #666; font-size: 16px; margin-bottom: 10px;">
                Riktig svar var:
            </p>
            <p style="color: #0071e3; font-size: 22px; font-weight: bold; margin-bottom: 25px;">
                ${sanitizedFasit}
            </p>
            <button class="feil-popup-lukk-btn"
                aria-label="Lukk og gå til neste spørsmål"
                style="
                    padding: 12px 30px;
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
                Neste spørsmål (Esc)
            </button>
        </div>
    `;

    document.body.appendChild(popup);

    // ✅ Focus på lukk-knapp for keyboard navigation
    const lukkBtn = popup.querySelector('.feil-popup-lukk-btn');
    if (lukkBtn) {
        lukkBtn.focus();
        lukkBtn.addEventListener('click', cleanupPopup);
    }

    // ✅ Escape-key support
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            cleanupPopup();
        }
    };
    document.addEventListener('keydown', handleEscape);

    // ✅ Cleanup funksjon (forhindrer memory leaks)
    const cleanupPopup = () => {
        if (popup.parentElement) {
            popup.remove();
        }
        document.removeEventListener('keydown', handleEscape);
        if (lukkBtn) {
            lukkBtn.removeEventListener('click', cleanupPopup);
        }
        activePopupCleanup = null;
    };

    activePopupCleanup = cleanupPopup;

    // Auto-lukk etter definert tid
    setTimeout(cleanupPopup, TIMING.FEIL_POPUP_AUTO_LUKK);
}

function sjekkSvar() {
    // ✅ Forhindre flere svar samtidig - SETT FLAGG UMIDDELBART
    if (besvarer) {
        console.log("⚠️ Blokkert duplikat svar");
        return;
    }
    besvarer = true; // LÅS FØRST!

    const inputFelt = document.getElementById('quiz-input');
    const svarKnapp = document.querySelector('button.btn-primary[onclick*="sjekkSvar"]');
    const input = inputFelt.value.trim().toLowerCase();

    if (!input) {
        besvarer = false; // Lås opp hvis tomt svar
        return;
    }

    // Lås UI mens vi behandler
    inputFelt.disabled = true;
    if (svarKnapp) svarKnapp.disabled = true;

    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';

    const spmNorsk = ord.sporsmaal || ord.s;
    const svarEngelsk = ord.svar || ord.e;

    const fasit = (spraak === 'en' ? spmNorsk : svarEngelsk).toLowerCase();
    const erRiktig = (input === fasit);

    // Lagre dette svaret
    alleElevSvar.push({
        ord_norsk: spmNorsk,
        ord_engelsk: svarEngelsk,
        elevSvar: input,
        riktig: erRiktig,
        tidspunkt: new Date().toISOString()
    });

    if (erRiktig) {
        spillLyd('riktig');
        antallRiktige++;

        // VIKTIG: Oppdater GLOBAL progress (lagres automatisk i storage.js)
        let totalXP = getTotalCorrect();
        totalXP++;
        saveTotalCorrect(totalXP);

        // Oppdater progress-visning
        oppdaterQuizProgress();

        if (totalXP % PROGRESS.XP_PER_KORT === 0) {
            kortVunnetISesjon++;
            visToast("Du har tjent opp et KORT!", "success");
        }

        if (totalXP % PROGRESS.XP_PER_DIAMANT_BONUS === 0) {
            diamanterVunnetISesjon += PROGRESS.DIAMANTER_PER_BONUS;
            let credits = getCredits();
            credits += PROGRESS.DIAMANTER_PER_BONUS;
            saveCredits(credits);
            visToast(`BONUS! +${PROGRESS.DIAMANTER_PER_BONUS} Diamanter!`, "success");
        }

        // Vis riktig-popup og vent før neste ord
        visRiktigPopup();

        setTimeout(() => {
            quizIndex++;
            visNesteSporsmaal();
        }, TIMING.RIKTIG_SVAR_PAUSE);

    } else {
        spillLyd('feil');
        vibrer(200);
        visFeilPopup(fasit);

        // For feil svar, vent litt lenger før neste ord
        setTimeout(() => {
            quizIndex++;
            visNesteSporsmaal();
        }, TIMING.FEIL_SVAR_PAUSE);
    }
}

function settProveSprak(retning) {
    window.proveSprak = retning;
    visToast(`Sprak endret`, 'info');
    if(document.getElementById('prove-omraade').style.display === 'block') {
        visNesteSporsmaal();
    }
}

function lesOppProve() {
    if (quizIndex >= aktivProve.length) return;
    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';
    const tekst = spraak === 'en' ? (ord.svar || ord.e) : (ord.sporsmaal || ord.s);
    const langCode = spraak === 'en' ? 'en-US' : 'nb-NO';
    lesOpp(tekst, langCode);
}

// ==============================================
// RESULTAT-LAGRING TIL FIREBASE
// ==============================================

async function lagreResultatTilFirebase() {
    if (!aktivProveId || aktivProveId.startsWith('offline_')) {
        console.log("Offline-prove, lagrer ikke resultat");
        return;
    }

    try {
        const varighetSekunder = Math.round((Date.now() - proveStartTid) / 1000);
        const prosent = Math.round((antallRiktige / aktivProve.length) * 100);
        
        const elevId = genererAnonymtElevId();
        
        const resultatData = {
            prove_id: aktivProveId,
            prove_eier: aktivProveEier, // ✅ NYTT: Lagre hvem som eier prøven (for analytics)
            elev_id: elevId,
            tidspunkt: serverTimestamp(),
            opprettet: serverTimestamp(), // ✅ NYTT: For aktivitetsgraf
            poengsum: antallRiktige,
            maks_poeng: aktivProve.length,
            prosent: prosent,
            svar: alleElevSvar,
            varighet_sekunder: varighetSekunder
        };
        
        await addDoc(collection(db, "resultater"), resultatData);
        
        const proveRef = doc(db, "prover", aktivProveId);
        await updateDoc(proveRef, {
            antall_gjennomforinger: increment(1)
        });
        
        // console.log("Resultat lagret til Firebase!");
        
    } catch (error) {
        console.error("Kunne ikke lagre resultat:", error);
    }
}

function genererAnonymtElevId() {
    let elevId = localStorage.getItem('glosemester_elev_id');
    
    if (!elevId) {
        elevId = 'elev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('glosemester_elev_id', elevId);
    }
    
    return elevId;
}

// ==============================================
// MODERNE POPUP FOR FERDIG PRØVE
// ==============================================
function visFerdigPopup(melding) {
    const popup = document.createElement('div');
    popup.className = 'quiz-popup-overlay';
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
    `;

    const meldingMedBreaks = melding.split('\n').join('<br>');

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
            <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
            <h2 style="color: #0071e3; margin: 0 0 20px 0; font-size: 28px;">Prøve Fullført!</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                ${meldingMedBreaks}
            </p>
            <button onclick="this.closest('.quiz-popup-overlay').remove();"
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
                Fortsett (Esc)
            </button>
        </div>
    `;

    document.body.appendChild(popup);

    // ✅ Escape-key support
    const handleEscape = (e) => {
        if (e.key === 'Escape' && popup.parentElement) {
            popup.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// ==============================================
// AVSLUTNING MED RESULTAT-LAGRING
// ==============================================

async function avsluttProve() {
    const prosent = Math.round((antallRiktige / aktivProve.length) * 100);
    
    await lagreResultatTilFirebase();
    
    let melding = `Prove ferdig!\n\n`;
    melding += `Du fikk ${antallRiktige} av ${aktivProve.length} riktige (${prosent}%).\n`;
    
    if (kortVunnetISesjon > 0) {
        melding += `\nDu tjente opp ${kortVunnetISesjon} nye kort!`;
        spillLyd('vinn');
        lagConfetti();
    } else {
        const totalXP = getTotalCorrect();
        const mangler = PROGRESS.XP_PER_KORT - (totalXP % PROGRESS.XP_PER_KORT);
        melding += `\n(Du trenger ${mangler} riktige til for å få neste kort)`;
    }

    if (diamanterVunnetISesjon > 0) {
        melding += `\nDu fikk også ${diamanterVunnetISesjon} diamanter!`;
    }

    visFerdigPopup(melding);

    for (let i = 0; i < kortVunnetISesjon; i++) {
        await hentTilfeldigKort();
    }
    
    document.getElementById('prove-omraade').style.display = 'none';
    document.getElementById('elev-start-skjerm').style.display = 'block';
    
    // VIKTIG: IKKE nullstill progress her - den lagres automatisk
    // Oppdater bare visningen
    oppdaterQuizProgress();
    
    visLagredeProverUI();
    
    trackEvent('Quiz', 'Ferdig', `${prosent}%`);
}

// ==============================================
// EKSPORTER FUNKSJONER
// ==============================================
export { 
    startProve, 
    sjekkSvar, 
    settProveSprak, 
    lesOppProve, 
    visLagredeProverUI 
};