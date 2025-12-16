// ============================================
// PRACTICE.JS - GloseMester v0.5 (Design + Audio) 🎵
// ============================================

import { visGevinstPopup, visKortGrid } from './kort-display.js';
import { lagreBrukerKort, getSamling, saveCredits, getCredits } from '../core/storage.js';

// 🎵 1. LYD-MOTOR (Preload)
const soundCorrect = new Audio('sounds/correct.mp3');
const soundWrong = new Audio('sounds/wrong.mp3');
const soundWin = new Audio('sounds/win.mp3');
const soundPop = new Audio('sounds/pop.mp3');

// Juster volum (valgfritt)
soundCorrect.volume = 0.6;
soundWrong.volume = 0.4;
soundWin.volume = 0.7;

let valgtTrinn = ""; 

// Global bridge for språkinnstilling
export function settSprakRetning(retning) {
    window.ovingRetning = retning;
    
    // Spill "pop" lyd ved bytte
    soundPop.currentTime = 0;
    soundPop.play().catch(e => {}); // Ignorer feil hvis ingen interaksjon enda

    // Oppdater UI for språkvalg
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(retning === 'en' ? 'lang-en' : 'lang-no');
    if (activeBtn) activeBtn.classList.add('active');
    
    // Hvis øvingen allerede er i gang, bytt spørsmål
    const ovingOmraade = document.getElementById('oving-omraade');
    if (ovingOmraade && ovingOmraade.style.display === 'block') {
        visNesteOvingSporsmaal();
    }
}

export function startOving(trinn) {
    valgtTrinn = trinn;
    
    // Spill start-lyd
    soundPop.play().catch(e => {});

    oppdaterProgresjonUI();

    if (window.vokabularData && window.vokabularData[trinn]) {
        window.ovingOrdliste = [...window.vokabularData[trinn]];
    } else {
        console.error("Fant ikke ordliste for trinn:", trinn);
        window.ovingOrdliste = [{s:"Feil", e:"Error"}];
    }
    
    // Shuffle ordlisten
    window.ovingOrdliste.sort(() => Math.random() - 0.5);
    window.ovingIndex = 0;
    
    let tittel = "";
    if (trinn === "1-2") tittel = "1. - 2. Trinn";
    else if (trinn === "3-4") tittel = "3. - 4. Trinn";
    else if (trinn === "5-7") tittel = "5. - 7. Trinn";
    
    document.getElementById('oving-tittel').innerText = tittel;
    
    // Vis spill-området med animasjon
    const omraade = document.getElementById('oving-omraade');
    omraade.style.display = 'block';
    omraade.style.animation = 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    const trinnGrid = document.querySelector('.trinn-grid');
    if(trinnGrid) trinnGrid.style.display = 'none';

    document.getElementById('oving-score').innerText = "0";
    document.getElementById('oving-progress').style.width = "0%";
    document.getElementById('oving-feedback').innerText = "";
    
    if(!window.ovingRetning) settSprakRetning('no');
    
    visNesteOvingSporsmaal();
}

export function avsluttOving() {
    document.getElementById('oving-omraade').style.display = 'none';
    
    const trinnGrid = document.querySelector('.trinn-grid');
    if(trinnGrid) {
        trinnGrid.style.display = 'grid';
        trinnGrid.style.animation = 'none';
        trinnGrid.offsetHeight; /* trigger reflow */
        trinnGrid.style.animation = 'popIn 0.3s ease-out';
    }
    
    document.getElementById('oving-svar').value = "";
    document.getElementById('oving-feedback').innerText = "";
    
    oppdaterProgresjonUI();
}

function oppdaterProgresjonUI() {
    let current = window.credits || 0;
    const bar = document.getElementById('credit-progress-bar-oving');
    const txt = document.getElementById('credit-progress-text-oving');
    
    let displayPercent = Math.min(current, 100);
    
    if(bar) bar.style.width = displayPercent + "%";
    if(txt) txt.innerText = current + "/100";
    
    saveCredits(current);
}

function visNesteOvingSporsmaal() {
    if (window.ovingIndex >= window.ovingOrdliste.length) {
        window.ovingOrdliste.sort(() => Math.random() - 0.5);
        window.ovingIndex = 0;
    }
    
    const ord = window.ovingOrdliste[window.ovingIndex];
    const spmTekst = (window.ovingRetning === 'en') ? ord.s : ord.e;
    
    const spmElement = document.getElementById('oving-spm');
    spmElement.innerText = spmTekst;
    // Pulse animasjon på tekst
    spmElement.style.animation = 'none';
    spmElement.offsetHeight; 
    spmElement.style.animation = 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    document.getElementById('oving-feedback').innerText = "";
    
    const inputFelt = document.getElementById('oving-svar');
    const svarKnapp = document.getElementById('btn-svar-tekst');
    const altContainer = document.getElementById('oving-alternativer');
    
    if (valgtTrinn === '1-2') {
        inputFelt.style.display = 'none';
        svarKnapp.style.display = 'none';
        altContainer.style.display = 'grid';
        genererAlternativer(ord);
    } 
    else {
        inputFelt.style.display = 'block';
        svarKnapp.style.display = 'block';
        altContainer.style.display = 'none';
        
        const placeholder = (window.ovingRetning === 'en') ? "Write in English..." : "Skriv på Norsk...";
        inputFelt.placeholder = placeholder;
        inputFelt.value = "";
        inputFelt.focus();
    }
}

function genererAlternativer(riktigOrdObjekt) {
    const container = document.getElementById('oving-alternativer');
    container.innerHTML = ""; 
    
    const fasit = (window.ovingRetning === 'en') ? riktigOrdObjekt.e : riktigOrdObjekt.s;
    let alternativer = [fasit];
    
    const andreOrd = window.ovingOrdliste.filter(o => o !== riktigOrdObjekt);
    andreOrd.sort(() => Math.random() - 0.5);
    
    if (andreOrd.length >= 2) {
        const feil1 = (window.ovingRetning === 'en') ? andreOrd[0].e : andreOrd[0].s;
        const feil2 = (window.ovingRetning === 'en') ? andreOrd[1].e : andreOrd[1].s;
        alternativer.push(feil1, feil2);
        if (andreOrd.length >= 3) {
            const feil3 = (window.ovingRetning === 'en') ? andreOrd[2].e : andreOrd[2].s;
            alternativer.push(feil3);
        }
    }
    
    alternativer.sort(() => Math.random() - 0.5);
    
    alternativer.forEach((altTekst, index) => {
        const btn = document.createElement('button');
        btn.className = 'alt-btn';
        btn.innerText = altTekst;
        // Staggered animation
        btn.style.animation = `popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`;
        
        btn.onclick = () => sjekkFlervalgSvar(altTekst, fasit, btn);
        container.appendChild(btn);
    });
}

async function sjekkFlervalgSvar(valgtSvar, fasit, btnElement) {
    // Lås knapper
    const buttons = document.querySelectorAll('.alt-btn');
    buttons.forEach(b => b.disabled = true);

    if (valgtSvar === fasit) {
        // ✅ Visuell Feedback (Grønn)
        btnElement.style.backgroundColor = '#10B981'; 
        btnElement.style.color = 'white';
        btnElement.style.borderColor = '#059669';
        
        await handterRiktigSvar();
    } else {
        // ❌ Visuell Feedback (Rød + Rist)
        btnElement.style.backgroundColor = '#EF4444'; 
        btnElement.style.color = 'white';
        btnElement.style.borderColor = '#DC2626';
        btnElement.style.animation = 'shake 0.4s ease-in-out';
        
        await handterFeilSvar(fasit);
    }
}

export async function sjekkOvingSvar() {
    const input = document.getElementById('oving-svar').value.trim().toLowerCase();
    const ord = window.ovingOrdliste[window.ovingIndex];
    const fasit = (window.ovingRetning === 'en') ? ord.e.toLowerCase() : ord.s.toLowerCase();

    if (input === fasit) {
        handterRiktigSvar();
    } else {
        handterFeilSvar(fasit);
    }
}

async function handterRiktigSvar() {
    // 🎵 LYD: PLING!
    soundCorrect.currentTime = 0;
    soundCorrect.play().catch(e => console.log("Lyd feilet:", e));

    const feedback = document.getElementById('oving-feedback');
    feedback.style.color = "#10B981"; 
    feedback.innerText = "Riktig! 🎉";
    feedback.style.animation = 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Øk poeng
    if (!window.credits) window.credits = 0;
    window.credits++;
    oppdaterProgresjonUI();

    let currentStreak = parseInt(document.getElementById('oving-score').innerText) + 1;
    
    document.getElementById('oving-score').innerText = currentStreak;
    document.getElementById('oving-progress').style.width = (currentStreak * 10) + "%";

    // GI KORT (Hver 10. rette)
    if (currentStreak >= 10) {
        // 🎵 LYD: WIN!
        setTimeout(() => soundWin.play(), 300);
        
        await hentTilfeldigKort();
        
        currentStreak = 0;
        document.getElementById('oving-score').innerText = "0";
        document.getElementById('oving-progress').style.width = "0%";
    }

    window.ovingIndex++;
    setTimeout(visNesteOvingSporsmaal, 1200);
}

function handterFeilSvar(fasit) {
    // 🎵 LYD: BUZZ!
    soundWrong.currentTime = 0;
    soundWrong.play().catch(e => console.log("Lyd feilet:", e));

    if (typeof window.visFeilMelding === 'function') {
        window.visFeilMelding(fasit);
    } else {
        const feedback = document.getElementById('oving-feedback');
        feedback.style.color = "#EF4444";
        feedback.innerText = `Feil! Riktig: ${fasit}`;
    }
    window.ovingIndex++;
    setTimeout(visNesteOvingSporsmaal, 3000);
}

// ... (Resten av funksjonene: lesOppOving, hentTilfeldigKort, visOvingSamling beholdes likt) ...
// Du trenger ikke lime inn disse på nytt hvis de allerede ligger der, men for sikkerhets skyld:

export function lesOppOving() {
    const ord = window.ovingOrdliste[window.ovingIndex];
    if (typeof window.lesOpp === 'function') {
        if (window.ovingRetning === 'en') window.lesOpp(ord.s, 'nb-NO');
        else window.lesOpp(ord.e, 'en-US');
    }
}

export async function hentTilfeldigKort() {
    try {
        const kategorier = ['biler', 'guder', 'dinosaurer', 'dyr'];
        const gevinstKategori = kategorier[Math.floor(Math.random() * kategorier.length)];
        const kategoriKort = window.kortSamling[gevinstKategori];
        
        if (!kategoriKort) return;
        
        let rarity = "vanlig";
        const rand = Math.random() * 100;
        if (rand > 98) rarity = "legendary";
        else if (rand > 85) rarity = "episk";
        else if (rand > 60) rarity = "sjelden";
        
        const muligeKort = kategoriKort.filter(k => k.rarity.type === rarity);
        const tilfeldigKort = muligeKort.length > 0
            ? muligeKort[Math.floor(Math.random() * muligeKort.length)]
            : kategoriKort[Math.floor(Math.random() * kategoriKort.length)];
        
        lagreBrukerKort(tilfeldigKort);
        visGevinstPopup(tilfeldigKort);
        console.log('🎴 Kort vunnet:', tilfeldigKort.navn);
        
    } catch (e) {
        console.error('❌ Feil ved henting av kort:', e);
    }
}

export function visOvingSamling() {
    const samling = getSamling();
    visKortGrid('oving-samling-liste', samling, true);
}