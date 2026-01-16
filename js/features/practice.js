/* ============================================
   PRACTICE.JS - Øve Modus v0.10.19 (MED RATE LIMITING)
   Fix: Fet skrift og større font for bedre lesbarhet
   Ny: Rate limiting for å forhindre misbruk
   ============================================ */

import { hentTilfeldigKort, visSamling } from './kort-display.js';
import { visSide } from '../core/navigation.js';
import { visToast, spillLyd, vibrer, lesOpp } from '../ui/helpers.js';
import { saveCredits, getCredits, saveTotalCorrect, getTotalCorrect } from '../core/storage.js';
import { practiceLimiter, cardLimiter } from '../core/rate-limiter.js';

let gjeldendeOrd = null;
let gjeldendeNiva = 'niva1'; 

function stokkArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Venter på at vocabulary er lastet (maks 5 sekunder)
 */
async function ventPaVocabulary(maxTid = 5000) {
    const startTid = Date.now();
    
    while (!window.vokabularData || Object.keys(window.vokabularData).length === 0) {
        if (Date.now() - startTid > maxTid) {
            console.error('❌ Timeout: Vocabulary ikke lastet etter', maxTid, 'ms');
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('✅ Vocabulary klar:', Object.keys(window.vokabularData));
    return true;
}

export async function startOving(nivaValg) {
    gjeldendeNiva = nivaValg;

    const erKlar = await ventPaVocabulary();
    
    if (!erKlar || !window.vokabularData || !window.vokabularData[nivaValg]) {
        console.error('❌ Kunne ikke laste ordliste for', nivaValg);
        alert("Kunne ikke laste ordliste. Prøv en hard refresh (Ctrl+F5).");
        return;
    }
    
    console.log('✅ Starter øving med nivå:', nivaValg, '- Antall ord:', window.vokabularData[nivaValg].length);
    
    window.ovingOrdliste = stokkArray([...window.vokabularData[nivaValg]]);
    window.ovingIndex = 0;
    window.riktigeSvar = 0;
    
    if (!window.ovingRetning || window.ovingRetning === 'no') {
        window.ovingRetning = 'en'; 
    }
    
    oppdaterSprakKnapper();
    visSide('oving-omraade');
    visNesteSporsmaal();
}

function oppdaterSprakKnapper() {
    const btnNo = document.getElementById('lang-no');
    const btnEn = document.getElementById('lang-en');
    
    if(btnNo && btnEn) {
        btnNo.classList.remove('active');
        btnEn.classList.remove('active');
        const aktivKnapp = document.getElementById(`lang-${window.ovingRetning}`);
        if(aktivKnapp) aktivKnapp.classList.add('active');
    }
}

export function settSprakRetning(retning) {
    window.ovingRetning = retning;
    oppdaterSprakKnapper();
    spillLyd('klikk');
}

function oppdaterProgress() {
    const container = document.getElementById('game-progress-target');
    if (!container) return; 

    const antallFylte = window.riktigeSvar % 10;
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
    oppdaterProgress(); 

    const feedbackEl = document.getElementById('oving-feedback');
    const inputContainer = document.getElementById('oving-input-container');
    const altContainer = document.getElementById('oving-alternativer');
    
    if (feedbackEl) feedbackEl.innerText = '';
    
    if (window.ovingIndex >= window.ovingOrdliste.length) {
        window.ovingOrdliste = stokkArray(window.ovingOrdliste);
        window.ovingIndex = 0;
    }
    
    gjeldendeOrd = window.ovingOrdliste[window.ovingIndex];
    
    const sporsmaalTekst = window.ovingRetning === 'no' ? gjeldendeOrd.s : gjeldendeOrd.e; 
    document.getElementById('oving-spm').innerText = sporsmaalTekst;
    
    const altLang = window.ovingRetning === 'no' ? 'en-US' : 'no-NO';

    let erFlervalg = false;

    if (gjeldendeNiva === 'niva1') {
        erFlervalg = true; 
    } 
    else if (gjeldendeNiva === 'niva3') {
        erFlervalg = Math.random() < 0.2; 
    } 
    else {
        erFlervalg = Math.random() < 0.5; 
    }

    if (erFlervalg) {
        // --- FLERVALG MED TYDELIGERE TEKST ---
        inputContainer.style.display = 'none';
        altContainer.style.display = 'grid'; 
        altContainer.innerHTML = '';

        let alternativer = [gjeldendeOrd];
        let forsok = 0;
        
        const sjekkKey = window.ovingRetning === 'no' ? 'e' : 's';
        
        while (alternativer.length < 4 && forsok < 50) {
            const tilfeldig = window.ovingOrdliste[Math.floor(Math.random() * window.ovingOrdliste.length)];
            if (!alternativer.some(a => a[sjekkKey] === tilfeldig[sjekkKey])) {
                alternativer.push(tilfeldig);
            }
            forsok++;
        }
        alternativer = stokkArray(alternativer);
        
        alternativer.forEach(alt => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            const btnTekst = window.ovingRetning === 'no' ? alt.e : alt.s;
            
            btn.style.display = 'flex';
            btn.style.justifyContent = 'space-between';
            btn.style.alignItems = 'center';
            btn.style.padding = '12px 15px';
            btn.style.textAlign = 'left';

            // ✅ FIX: Tydeligere tekst med fet skrift og større font
            btn.innerHTML = `
                <span style="pointer-events: none; font-weight:700; font-size:1.05rem; color:#333;">${btnTekst}</span>
                <div onclick="event.stopPropagation(); window.lesOppOving('${btnTekst}', '${altLang}')" 
                      style="font-size:1.3rem; cursor:pointer; padding:8px; background:rgba(0,0,0,0.05); border-radius:50%; margin-left:15px; display:flex; align-items:center; justify-content:center;">
                    🔊
                </div>
            `;
            btn.onclick = () => sjekkOvingSvar(alt);
            altContainer.appendChild(btn);
        });

    } else {
        // --- SKRIVING ---
        inputContainer.style.display = 'flex';
        altContainer.style.display = 'none';
        const inputFelt = document.getElementById('oving-svar');
        inputFelt.value = '';
        inputFelt.focus();
        inputFelt.onkeydown = (e) => {
            if (e.key === 'Enter') sjekkOvingSvar();
        };
    }
}

export function sjekkOvingSvar(valgtOrd = null) {
    // ✅ RATE LIMITING: Sjekk om bruker har svart for mange ganger
    const rateCheck = practiceLimiter.check('practice_answer');

    if (!rateCheck.allowed) {
        const minutter = Math.ceil(rateCheck.remainingMs / 60000);
        visToast(
            `⏰ Du må ta en pause! Vent ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} før du kan fortsette.`,
            'warning'
        );
        spillLyd('feil');
        return;
    }

    const feedbackEl = document.getElementById('oving-feedback');
    let erRiktig = false;

    const riktigSvarTekst = window.ovingRetning === 'no' ? gjeldendeOrd.e : gjeldendeOrd.s;

    if (valgtOrd) {
        erRiktig = (valgtOrd.s === gjeldendeOrd.s);
    } else {
        const input = document.getElementById('oving-svar');
        const brukerSvar = input.value.trim().toLowerCase();
        erRiktig = (brukerSvar === riktigSvarTekst.toLowerCase());
    }

    if (erRiktig) {
        window.riktigeSvar++;
        saveTotalCorrect(getTotalCorrect() + 1);
        
        feedbackEl.style.color = 'green';
        feedbackEl.innerText = "✅ Riktig!";
        spillLyd('riktig'); 
        
        oppdaterProgress(); 
        
        const scoreEl = document.getElementById('oving-score');
        if(scoreEl) scoreEl.innerText = `${window.riktigeSvar} riktige i dag`;

        sjekkOmGevinst();
        
        setTimeout(() => {
            window.ovingIndex++;
            visNesteSporsmaal();
        }, 1500);

    } else {
        spillLyd('feil');
        vibrer(200);
        
        document.getElementById('fasit-tekst').innerText = riktigSvarTekst;
        document.getElementById('feil-svar-popup').style.display = 'flex';
    }
}

window.lukkFeilPopup = function() {
    document.getElementById('feil-svar-popup').style.display = 'none';
    window.ovingIndex++;
    visNesteSporsmaal();
};

function sjekkOmGevinst() {
    if (window.riktigeSvar > 0 && window.riktigeSvar % 10 === 0) {
        // ✅ RATE LIMITING: Sjekk om bruker har mottatt for mange kort
        const cardCheck = cardLimiter.check('card_reward');

        if (!cardCheck.allowed) {
            const minutter = Math.ceil(cardCheck.remainingMs / 60000);
            visToast(
                `🃏 Du har mottatt nok kort for nå! Kom tilbake om ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} for flere.`,
                'info'
            );
            return;
        }

        setTimeout(() => hentTilfeldigKort(), 600);
    }
}

export function avsluttOving(ferdig = false) {
    if (ferdig) { }
    const container = document.getElementById('game-progress-target');
    if(container) container.innerHTML = ""; 
    visSide('oving-start');
}

export function lesOppOving(tekst = null, lang = null) {
    if (!tekst) {
        tekst = document.getElementById('oving-spm').innerText;
        lang = window.ovingRetning === 'no' ? 'no-NO' : 'en-US';
    }
    lesOpp(tekst, lang);
}

export function visOvingSamling() {
    visSide('oving-samling');
    visSamling(); 
}

window.lesOppOving = lesOppOving;