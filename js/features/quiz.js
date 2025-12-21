// ============================================
// QUIZ.JS - GloseMester v0.7.0 (7-dagers lagring)
// ============================================
import { spillLyd, vibrer, visToast, lagConfetti, lesOpp } from '../ui/helpers.js';
import { hentTilfeldigKort } from './kort-display.js';
import { trackEvent } from '../core/analytics.js';
import { db, doc, getDoc } from './firebase.js';
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits, lagreElevProveLokalt, hentElevProverLokalt } from '../core/storage.js';

let aktivProve = [];
let quizIndex = 0;
let antallRiktige = 0;
let kortVunnetISesjon = 0;
let diamanterVunnetISesjon = 0;

// --- TEGN LISTEN OVER LAGREDE PRØVER ---
export function visLagredeProverUI() {
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
            <button class="btn-primary btn-small" onclick="startLagretProve('${prove.id}')">Start ▶️</button>
        `;
        listeDiv.appendChild(div);
    });
}

window.startLagretProve = function(id) {
    const liste = hentElevProverLokalt();
    const prove = liste.find(p => p.id === id);
    if(prove) {
        kjorProveInit(prove.ordliste, prove.tittel);
    }
};

export async function startProve(kode) {
    if (!kode) {
        const input = document.getElementById('prove-kode');
        if (input) kode = input.value.trim();
    }
    
    if (!kode) {
        visToast('Mangler prøve-kode!', 'error');
        return;
    }

    document.getElementById('prove-omraade').style.display = 'none';
    kortVunnetISesjon = 0;
    diamanterVunnetISesjon = 0;

    // 1. SJEKK SKYEN
    if (kode.length < 50 && !kode.includes('{')) {
        try {
            visToast("🔍 Henter prøve...", "info");
            const docRef = doc(db, "prover", kode);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                lagreElevProveLokalt({ id: kode, ...data });
                kjorProveInit(data.ordliste, data.tittel);
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
        const tittel = data.tittel || "Offline Prøve";
        
        lagreElevProveLokalt({ id: "offline_"+Date.now(), tittel: tittel, ordliste: ordliste });
        
        kjorProveInit(ordliste, tittel);
    } catch (e) {
        visToast('Ugyldig kode.', 'error');
    }
}

function kjorProveInit(ordliste, tittel = "Prøve") {
    if (!ordliste || ordliste.length === 0) {
        visToast("Denne prøven er tom!", "error");
        return;
    }

    aktivProve = ordliste;
    quizIndex = 0;
    antallRiktige = 0;
    window.proveSprak = 'no'; 
    
    if(window.visSide) window.visSide('elev-dashboard'); 
    
    document.getElementById('prove-omraade').style.display = 'block';
    document.getElementById('elev-start-skjerm').style.display = 'none';
    
    const header = document.querySelector('#prove-omraade h3');
    if(header) header.innerText = tittel;
    
    visNesteSporsmaal();
    trackEvent('Quiz', 'Start', tittel);
}

function visNesteSporsmaal() {
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

export function sjekkSvar() {
    const inputFelt = document.getElementById('quiz-input');
    const input = inputFelt.value.trim().toLowerCase();
    
    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';
    
    const spmNorsk = ord.sporsmaal || ord.s;
    const svarEngelsk = ord.svar || ord.e;
    
    const fasit = (spraak === 'en' ? spmNorsk : svarEngelsk).toLowerCase();

    if (input === fasit) {
        spillLyd('riktig');
        visToast('Riktig! 🌟', 'success');
        antallRiktige++;
        
        let totalXP = getTotalCorrect();
        totalXP++;
        saveTotalCorrect(totalXP);
        
        if(window.oppdaterProgresjonUI) window.oppdaterProgresjonUI();

        if (totalXP % 10 === 0) {
            kortVunnetISesjon++;
            visToast("🎉 Du har tjent opp et KORT!", "success");
        }
        
        if (totalXP % 100 === 0) {
            diamanterVunnetISesjon += 10;
            let credits = getCredits();
            credits += 10;
            saveCredits(credits);
            visToast("💎 BONUS! +10 Diamanter!", "success");
        }

    } else {
        spillLyd('feil');
        vibrer(200);
        alert(`Feil dessverre.\nRiktig svar var: ${fasit}`);
    }
    
    quizIndex++;
    visNesteSporsmaal();
}

export function settProveSprak(retning) {
    window.proveSprak = retning;
    visToast(`Språk endret`, 'info');
    if(document.getElementById('prove-omraade').style.display === 'block') {
        visNesteSporsmaal();
    }
}

export function lesOppProve() {
    if (quizIndex >= aktivProve.length) return;
    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';
    const tekst = spraak === 'en' ? (ord.svar || ord.e) : (ord.sporsmaal || ord.s);
    const langCode = spraak === 'en' ? 'en-US' : 'nb-NO';
    lesOpp(tekst, langCode);
}

async function avsluttProve() {
    const prosent = Math.round((antallRiktige / aktivProve.length) * 100);
    
    let melding = `Prøve ferdig!\n\n`;
    melding += `✅ Du fikk ${antallRiktige} av ${aktivProve.length} riktige (${prosent}%).\n`;
    
    if (kortVunnetISesjon > 0) {
        melding += `\n🎁 Du tjente opp ${kortVunnetISesjon} nye kort!`;
        spillLyd('vinn');
        lagConfetti();
    } else {
        const totalXP = getTotalCorrect();
        const mangler = 10 - (totalXP % 10);
        melding += `\n(Du trenger ${mangler} riktige til for å få neste kort)`;
    }

    if (diamanterVunnetISesjon > 0) {
        melding += `\n💎 Du fikk også ${diamanterVunnetISesjon} diamanter!`;
    }
    
    alert(melding);
    
    for (let i = 0; i < kortVunnetISesjon; i++) {
        await hentTilfeldigKort(); 
    }
    
    document.getElementById('prove-omraade').style.display = 'none';
    document.getElementById('elev-start-skjerm').style.display = 'block';
    
    visLagredeProverUI();
    if(window.oppdaterProgresjonUI) window.oppdaterProgresjonUI();
    
    trackEvent('Quiz', 'Ferdig', `${prosent}%`);
}