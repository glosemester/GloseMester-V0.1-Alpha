// ============================================
// PRACTICE.JS - GloseMester v0.6.1 (Robust)
// ============================================

import { hentTilfeldigKort, visSamling } from './kort-display.js';
import { saveCredits, getCredits, leggTilByttepoeng } from '../core/storage.js';
import { visToast, lesOpp, spillLyd, lagConfetti, vibrer } from '../ui/helpers.js';

let valgtTrinn = "";

function oppdaterOvingScoreUI(riktigeDenneRunden) {
    const scoreEl = document.getElementById('oving-score');
    if (!scoreEl) return;
    const riktige = Number.isFinite(riktigeDenneRunden)
        ? riktigeDenneRunden
        : (parseInt(scoreEl.innerText, 10) || 0);

    // Viktig: starter med tallet slik at parseInt fortsatt fungerer andre steder.
    // (Progresjon til belønninger vises i Samling-oversikten)
    scoreEl.innerText = `${riktige} riktige`;
}

// Global bridge for språkinnstilling
export function settSprakRetning(retning) {
    window.ovingRetning = retning;
    spillLyd('klikk');

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(retning === 'en' ? 'lang-en' : 'lang-no');
    if (activeBtn) activeBtn.classList.add('active');
    
    // Oppdater tekst hvis vi er midt i en øving
    const ovingOmraade = document.getElementById('oving-omraade');
    if (ovingOmraade && ovingOmraade.style.display === 'block') {
        visNesteOvingSporsmaal();
    }
}

export function startOving(trinn) {
    console.log("▶️ Starter øving for trinn:", trinn);
    valgtTrinn = trinn;
    spillLyd('klikk');

    // Last inn data
    if (window.vokabularData && window.vokabularData[trinn]) {
        window.ovingOrdliste = [...window.vokabularData[trinn]];
    } else {
        console.error("❌ Fant ikke ordliste! Sjekk vocabulary.js");
        alert("Fant ingen ord for dette trinnet. Prøv igjen.");
        return;
    }
    
    // Shuffle
    window.ovingOrdliste.sort(() => Math.random() - 0.5);
    window.ovingIndex = 0;
    
    // Sett tittel (hvis elementet finnes)
    const tittelMap = { "1-2": "1. - 2. Trinn", "3-4": "3. - 4. Trinn", "5-7": "5. - 7. Trinn" };
    const tittelEl = document.getElementById('oving-tittel');
    if(tittelEl) tittelEl.innerText = tittelMap[trinn] || trinn;
    
    // BYTT SKJERM
    const valgSkjerm = document.getElementById('oving-valg');
    const spillSkjerm = document.getElementById('oving-omraade');
    
    if(valgSkjerm) valgSkjerm.style.display = 'none';
    if(spillSkjerm) {
        spillSkjerm.style.display = 'block';
        spillSkjerm.style.animation = 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    // Nullstill UI
    const scoreEl = document.getElementById('oving-score');
    if(scoreEl) oppdaterOvingScoreUI(0);
    const feedback = document.getElementById('oving-feedback');
    if(feedback) feedback.innerText = "";
    
    // Sett standard språk hvis mangler
    if(!window.ovingRetning) settSprakRetning('no');
    
    oppdaterProgresjonUI();
    visNesteOvingSporsmaal();
}

export function avsluttOving() {
    document.getElementById('oving-omraade').style.display = 'none';
    document.getElementById('oving-valg').style.display = 'block';
    const input = document.getElementById('oving-svar');
    if(input) input.value = "";
    oppdaterProgresjonUI();
}

export function visOvingSamling() {
    if(window.visSide) window.visSide('oving-samling');
    visSamling();
}

function oppdaterProgresjonUI() {
    let current = getCredits(); 
    if (typeof window.credits !== 'undefined') current = window.credits; 
    
    // Støtter både "valg"-skjerm og "spill"-skjerm (unngår ID-kollisjon i HTML)
    const bars = [
        document.getElementById('credit-progress-bar-oving'),
        document.getElementById('credit-progress-bar-oving-valg'),
    ].filter(Boolean);
    const txts = [
        document.getElementById('credit-progress-text-oving'),
        document.getElementById('credit-progress-text-oving-valg'),
    ].filter(Boolean);
    
    // Progresjon mot neste byttepoeng-pakke (10) per 100 riktige totalt
    const cycle = 100;
    const progress = current % cycle;

    bars.forEach(bar => (bar.style.width = ((progress / cycle) * 100) + "%"));
    txts.forEach(txt => (txt.innerText = `${progress}/${cycle}`));
}

function visNesteOvingSporsmaal() {
    if (window.ovingIndex >= window.ovingOrdliste.length) {
        window.ovingOrdliste.sort(() => Math.random() - 0.5);
        window.ovingIndex = 0;
    }
    
    const ord = window.ovingOrdliste[window.ovingIndex];
    const spmTekst = (window.ovingRetning === 'en') ? ord.s : ord.e;
    
    const spmElement = document.getElementById('oving-spm');
    if(spmElement) {
        spmElement.innerText = spmTekst;
        spmElement.style.animation = 'none';
        spmElement.offsetHeight; 
        spmElement.style.animation = 'popIn 0.3s ease';
    }
    
    const feedback = document.getElementById('oving-feedback');
    if(feedback) feedback.innerText = "";
    
    const inputContainer = document.getElementById('oving-input-container');
    const altContainer = document.getElementById('oving-alternativer');
    const inputFelt = document.getElementById('oving-svar');
    
    // --- UI LOGIKK ---
    if (valgtTrinn === '1-2') {
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
            inputFelt.focus();
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
    const input = document.getElementById('oving-svar').value.trim().toLowerCase();
    const ord = window.ovingOrdliste[window.ovingIndex];
    const fasit = (window.ovingRetning === 'en') ? ord.e.toLowerCase() : ord.s.toLowerCase();

    if (input === fasit) {
        await handterRiktigSvar();
    } else {
        handterFeilSvar(fasit);
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
    
    if (typeof window.credits === 'undefined') window.credits = getCredits();
    window.credits++;
    saveCredits(window.credits);
    oppdaterProgresjonUI();
    
    const scoreEl = document.getElementById('oving-score');
    let sessionScore = 0;
    if (scoreEl) sessionScore = parseInt(scoreEl.innerText, 10) || 0;
    sessionScore++;

    if (scoreEl) oppdaterOvingScoreUI(sessionScore);

    // 10 riktige totalt => 1 kort (lagres i samlingen via hentTilfeldigKort)
    if (window.credits % 10 === 0) {
        spillLyd('vinn');
        await hentTilfeldigKort();
        lagConfetti();
        visToast('10 riktige! Du fikk et nytt kort 🎴', 'success');
    }

    // 100 riktige totalt => 10 byttepoeng
    if (window.credits % 100 === 0) {
        spillLyd('vinn');
        leggTilByttepoeng(10);
        lagConfetti();
        visToast('100 riktige! Du fikk 10 byttepoeng ♻️', 'success');
    }

    window.ovingIndex++;
    setTimeout(visNesteOvingSporsmaal, 1200);
}

function handterFeilSvar(fasit) {
    spillLyd('feil');
    vibrer(200);
    if (valgtTrinn !== '1-2') {
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
    const nyRetning = window.ovingRetning === 'no' ? 'en' : 'no';
    settSprakRetning(nyRetning);
}