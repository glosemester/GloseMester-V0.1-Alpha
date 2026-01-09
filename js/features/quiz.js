// ============================================
// QUIZ.JS - GloseMester v0.7.5 (10-RUTE PROGRESS)
// NYTT: 10-rute progress som øving + persistent lagring
// ============================================
import { spillLyd, vibrer, visToast, lagConfetti, lesOpp } from '../ui/helpers.js';
import { hentTilfeldigKort } from './kort-display.js';
import { trackEvent } from '../core/analytics.js';
import { db, doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from './firebase.js';
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits, lagreElevProveLokalt, hentElevProverLokalt } from '../core/storage.js';

let aktivProve = [];
let aktivProveId = null;
let quizIndex = 0;
let antallRiktige = 0;
let kortVunnetISesjon = 0;
let diamanterVunnetISesjon = 0;
let alleElevSvar = [];
let proveStartTid = null;

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
}

window.startLagretProve = function(id) {
    const liste = hentElevProverLokalt();
    const prove = liste.find(p => p.id === id);
    if(prove) {
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
            visToast("Henter prove...", "info");
            const docRef = doc(db, "prover", kode);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                lagreElevProveLokalt({ id: kode, ...data });
                kjorProveInit(data.ordliste, data.tittel, kode);
                return; 
            }
        } catch (e) {
            console.error("Feil mot skyen:", e);
        }
    }

    // 2. SJEKK OFFLINE
    try {
        const json = decodeURIComponent(atob(kode));
        const data = JSON.parse(json);
        const ordliste = data.ord || data.ordliste || data;
        const tittel = data.tittel || "Offline Prove";
        const offlineId = "offline_"+Date.now();
        
        lagreElevProveLokalt({ id: offlineId, tittel: tittel, ordliste: ordliste });
        kjorProveInit(ordliste, tittel, offlineId);
    } catch (e) {
        visToast('Ugyldig kode.', 'error');
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
    window.proveSprak = 'no'; 
    
    if(window.visSide) window.visSide('elev-dashboard'); 
    
    document.getElementById('prove-omraade').style.display = 'block';
    document.getElementById('elev-start-skjerm').style.display = 'none';
    
    const header = document.querySelector('#prove-omraade h3');
    if(header) header.innerText = tittel;
    
    // Oppdater progress ved start
    oppdaterQuizProgress();
    
    visNesteSporsmaal();
    trackEvent('Quiz', 'Start', tittel);
}

// ============================================
// NYTT: 10-RUTE PROGRESS (som i øving)
// ============================================
function oppdaterQuizProgress() {
    const container = document.getElementById('quiz-progress-target');
    if (!container) return;

    const totalXP = getTotalCorrect();
    const antallFylte = totalXP % 10;
    const antallRuter = 10;

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
    
    document.getElementById('quiz-spm').innerText = spmTekst;
    document.getElementById('quiz-input').value = '';
    document.getElementById('quiz-input').focus();
    
    const progressElem = document.getElementById('quiz-progress');
    if(progressElem) progressElem.innerText = `${quizIndex + 1} / ${aktivProve.length}`;
}

function sjekkSvar() {
    const inputFelt = document.getElementById('quiz-input');
    const input = inputFelt.value.trim().toLowerCase();
    
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
        visToast('Riktig!', 'success');
        antallRiktige++;
        
        // VIKTIG: Oppdater GLOBAL progress (lagres automatisk i storage.js)
        let totalXP = getTotalCorrect();
        totalXP++;
        saveTotalCorrect(totalXP);
        
        // Oppdater progress-visning
        oppdaterQuizProgress();

        if (totalXP % 10 === 0) {
            kortVunnetISesjon++;
            visToast("Du har tjent opp et KORT!", "success");
        }
        
        if (totalXP % 100 === 0) {
            diamanterVunnetISesjon += 10;
            let credits = getCredits();
            credits += 10;
            saveCredits(credits);
            visToast("BONUS! +10 Diamanter!", "success");
        }

    } else {
        spillLyd('feil');
        vibrer(200);
        alert(`Feil dessverre.\nRiktig svar var: ${fasit}`);
    }
    
    quizIndex++;
    visNesteSporsmaal();
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
            elev_id: elevId,
            tidspunkt: serverTimestamp(),
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
        
        console.log("Resultat lagret til Firebase!");
        
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
        const mangler = 10 - (totalXP % 10);
        melding += `\n(Du trenger ${mangler} riktige til for a fa neste kort)`;
    }

    if (diamanterVunnetISesjon > 0) {
        melding += `\nDu fikk ogsa ${diamanterVunnetISesjon} diamanter!`;
    }
    
    alert(melding);
    
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
