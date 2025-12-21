// ============================================
// PRACTICE.JS - GloseMester v0.7.2 (Sikret + UI Tweak)
// ============================================

import { hentTilfeldigKort, visSamling, oppdaterProgresjonUI } from './kort-display.js';
import { getCredits, saveCredits, getTotalCorrect, saveTotalCorrect } from '../core/storage.js';
import { visToast, lesOpp, spillLyd, lagConfetti, vibrer } from '../ui/helpers.js';

let valgtTrinn = ""; 
// 🛡️ LÅS: Hindrer spam-klikk/Enter
let isProcessing = false; 

export function settSprakRetning(retning) {
    window.ovingRetning = retning;
    spillLyd('klikk');

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(retning === 'en' ? 'lang-en' : 'lang-no');
    if (activeBtn) activeBtn.classList.add('active');
    
    if (document.getElementById('oving-omraade').style.display === 'block') {
        visNesteOvingSporsmaal();
    }
}

export function startOving(trinn) {
    valgtTrinn = trinn;
    spillLyd('klikk');

    if (window.vokabularData && window.vokabularData[trinn]) {
        window.ovingOrdliste = [...window.vokabularData[trinn]];
    } else {
        alert("Fant ingen ord. Last inn siden på nytt.");
        return;
    }
    
    window.ovingOrdliste.sort(() => Math.random() - 0.5);
    window.ovingIndex = 0;
    
    // Nullstill lås ved start
    isProcessing = false;
    
    document.getElementById('oving-valg').style.display = 'none';
    document.getElementById('oving-omraade').style.display = 'block';

    const scoreEl = document.getElementById('oving-score');
    if(scoreEl) scoreEl.innerText = "0 riktige i dag";
    const feedback = document.getElementById('oving-feedback');
    if(feedback) feedback.innerText = "";
    
    if(!window.ovingRetning) settSprakRetning('no');
    
    oppdaterProgresjonUI(); 
    visNesteOvingSporsmaal();
}

export function avsluttOving() {
    document.getElementById('oving-omraade').style.display = 'none';
    document.getElementById('oving-valg').style.display = 'block';
    
    const input = document.getElementById('oving-svar');
    if(input) {
        input.value = "";
        input.disabled = false; // Sikre at den er åpen
    }
    
    isProcessing = false; // Lås opp
    oppdaterProgresjonUI();
}

export function visOvingSamling() {
    if(window.visSide) window.visSide('oving-samling');
    visSamling();
}

function visNesteOvingSporsmaal() {
    // 🛡️ LÅS OPP: Klar for nytt spørsmål
    isProcessing = false;

    if (window.ovingIndex >= window.ovingOrdliste.length) {
        window.ovingOrdliste.sort(() => Math.random() - 0.5);
        window.ovingIndex = 0;
    }
    
    const ord = window.ovingOrdliste[window.ovingIndex];
    const spm = document.getElementById('oving-spm');
    if(!spm) return;
    
    const tekst = (window.ovingRetning === 'en') ? ord.s : ord.e;
    spm.innerText = tekst;
    
    const feedback = document.getElementById('oving-feedback');
    if(feedback) feedback.innerText = "";
    
    const inputContainer = document.getElementById('oving-input-container');
    const altContainer = document.getElementById('oving-alternativer');
    const inputFelt = document.getElementById('oving-svar');
    
    // Nullstill input state
    if(inputFelt) {
        inputFelt.disabled = false;
        inputFelt.style.opacity = "1";
        inputFelt.focus();
    }
    
    // Vis input eller flervalg basert på Nivå (niva1 er flervalg)
    if (valgtTrinn === 'niva1') {
        if(inputContainer) inputContainer.style.display = 'none';
        if(altContainer) {
            altContainer.style.display = 'grid'; 
            genererAlternativer(ord);
        }
    } else {
        if(inputContainer) inputContainer.style.display = 'block';
        if(altContainer) altContainer.style.display = 'none';
        if(inputFelt) {
            inputFelt.placeholder = (window.ovingRetning === 'en') ? "Write in English..." : "Skriv på Norsk...";
            inputFelt.value = "";
            // focus() skjer ovenfor
        }
    }
}

function genererAlternativer(riktigOrdObjekt) {
    const container = document.getElementById('oving-alternativer');
    container.innerHTML = ""; 
    
    const fasit = (window.ovingRetning === 'en') ? riktigOrdObjekt.e : riktigOrdObjekt.s;
    let alternativer = [fasit];
    
    const andreOrd = window.ovingOrdliste.filter(o => o !== riktigOrdObjekt);
    andreOrd.sort(() => Math.random() - 0.5);
    
    for(let i=0; i<3; i++) {
        if(andreOrd[i]) {
            const feilTekst = (window.ovingRetning === 'en') ? andreOrd[i].e : andreOrd[i].s;
            alternativer.push(feilTekst);
        }
    }
    alternativer.sort(() => Math.random() - 0.5);
    
    alternativer.forEach((altTekst, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary'; 
        btn.style.padding = "20px";
        btn.style.fontSize = "18px";
        btn.style.height = "100%";
        btn.innerText = altTekst;
        btn.style.animation = `popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`;
        btn.onclick = () => sjekkFlervalgSvar(altTekst, fasit, btn);
        container.appendChild(btn);
    });
}

async function sjekkFlervalgSvar(valgtSvar, fasit, btnElement) {
    // 🛡️ SJEKK LÅS
    if(isProcessing) return;
    isProcessing = true; 

    const buttons = document.querySelectorAll('#oving-alternativer button');
    buttons.forEach(b => b.disabled = true);

    if (valgtSvar === fasit) {
        btnElement.style.backgroundColor = '#10B981'; 
        btnElement.style.color = 'white';
        await handterRiktigSvar();
    } else {
        btnElement.style.backgroundColor = '#EF4444'; 
        btnElement.style.color = 'white';
        btnElement.style.animation = 'shake 0.4s ease-in-out';
        buttons.forEach(b => {
            if(b.innerText === fasit) {
                b.style.backgroundColor = '#10B981'; 
                b.style.color = 'white';
            }
        });
        await handterFeilSvar(fasit);
    }
}

export async function sjekkOvingSvar() {
    // 🛡️ SJEKK LÅS
    if (isProcessing) return;

    const inputFelt = document.getElementById('oving-svar');
    const input = inputFelt.value.trim().toLowerCase();
    
    if(!input) return; // Ignorer tomme svar

    // 🛡️ LÅS & UI FEEDBACK
    isProcessing = true;
    inputFelt.disabled = true; // Visuell indikasjon på at vi tenker
    
    const ord = window.ovingOrdliste[window.ovingIndex];
    const fasit = (window.ovingRetning === 'en') ? ord.e.toLowerCase() : ord.s.toLowerCase();

    if (input === fasit) {
        await handterRiktigSvar();
    } else {
        await handterFeilSvar(fasit);
    }
}

async function handterRiktigSvar() {
    spillLyd('riktig');
    const feedback = document.getElementById('oving-feedback');
    if(feedback) {
        feedback.style.color = "#10B981"; 
        feedback.innerText = "Riktig! 🎉";
        feedback.style.animation = 'popIn 0.3s ease';
    }
    
    // XP LOGIKK
    let totalXP = getTotalCorrect();
    totalXP++;
    saveTotalCorrect(totalXP);
    
    const scoreEl = document.getElementById('oving-score');
    if(scoreEl) {
        let currentText = scoreEl.innerText;
        let num = parseInt(currentText) || 0;
        scoreEl.innerText = (num + 1) + " riktige i dag";
    }

    // OPPDATER UI UMIDDELBART
    oppdaterProgresjonUI(); 

    // SJEKKER KORT (Hver 10. riktig)
    if (totalXP % 10 === 0 && totalXP > 0) {
        // Vent litt så spilleren ser at baren ble full
        setTimeout(async () => {
            spillLyd('vinn');
            await hentTilfeldigKort(); 
            lagConfetti();
        }, 500); 
    }

    // SJEKKER DIAMANTER (Hver 100. riktig)
    if (totalXP % 100 === 0 && totalXP > 0) {
        let credits = getCredits();
        credits += 10; 
        saveCredits(credits);
        
        visToast("BONUS! +10 Diamanter 💎", "success");
        spillLyd('fanfare');
        vibrer([100, 50, 100]);
    }

    window.ovingIndex++;
    
    // Her resetter vi låsen når neste spørsmål lastes
    setTimeout(visNesteOvingSporsmaal, 1500); 
}

async function handterFeilSvar(fasit) {
    spillLyd('feil');
    vibrer(200);
    // Hvis IKKE nivå 1 (som har knapper), vis fasit tekst.
    if (valgtTrinn !== 'niva1') {
        const feedback = document.getElementById('oving-feedback');
        if(feedback) {
            feedback.style.color = "#EF4444";
            feedback.innerText = `Feil! Riktig: ${fasit}`;
        }
    }
    window.ovingIndex++;
    setTimeout(visNesteOvingSporsmaal, 3000);
}

export function lesOppOving() {
    const el = document.getElementById('oving-spm');
    if(!el) return;
    const tekst = el.innerText;
    const lang = (window.ovingRetning === 'en') ? 'nb-NO' : 'en-US';
    lesOpp(tekst, lang);
}

export function byttOvingRetning() {
    // 🛡️ Sjekk lås også her
    if(isProcessing) return;

    const nyRetning = window.ovingRetning === 'no' ? 'en' : 'no';
    settSprakRetning(nyRetning);
}