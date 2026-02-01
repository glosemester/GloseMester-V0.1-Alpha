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

    // console.log('✅ Vocabulary klar:', Object.keys(window.vokabularData));
    return true;
}

export async function startOving(nivaValg) {
    gjeldendeNiva = nivaValg;
    window.gjeldendeNiva = nivaValg; // ✅ Global variabel for kortbelønning

    const erKlar = await ventPaVocabulary();

    if (!erKlar || !window.vokabularData || !window.vokabularData[nivaValg]) {
        console.error('❌ Kunne ikke laste ordliste for', nivaValg);
        alert("Kunne ikke laste ordliste. Prøv en hard refresh (Ctrl+F5).");
        return;
    }

    // console.log('✅ Starter øving med nivå:', nivaValg, '- Antall ord:', window.vokabularData[nivaValg].length);

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

    if (btnNo && btnEn) {
        btnNo.classList.remove('active');
        btnEn.classList.remove('active');
        const aktivKnapp = document.getElementById(`lang-${window.ovingRetning}`);
        if (aktivKnapp) aktivKnapp.classList.add('active');
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

    const antallFylte = (window.riktigeSvar % 10 === 0 && window.riktigeSvar > 0) ? 10 : window.riktigeSvar % 10;
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

    // ✅ BILDESTØTTE: Vis bilde hvis det finnes
    const bildeContainer = document.getElementById('oving-bilde-container');
    if (gjeldendeOrd.image && bildeContainer) {
        bildeContainer.innerHTML = `<img src="${gjeldendeOrd.image}" class="oving-bilde" alt="${sporsmaalTekst}" loading="lazy">`;
        bildeContainer.style.display = 'block';
    } else if (bildeContainer) {
        bildeContainer.innerHTML = '';
        bildeContainer.style.display = 'none';
    }

    const altLang = window.ovingRetning === 'no' ? 'en-US' : 'no-NO';

    let erFlervalg = false;

    // ✅ OPPDATERT NIVÅLOGIKK (Nivå 1-4)
    if (gjeldendeNiva === 'niva1' || gjeldendeNiva === 'niva2') {
        erFlervalg = true; // Nivå 1 og 2: 100% flervalg
    }
    else if (gjeldendeNiva === 'niva4') {
        erFlervalg = Math.random() < 0.2; // Nivå 4: 20% flervalg, 80% skriving
    }
    else {
        erFlervalg = Math.random() < 0.5; // Nivå 3: 50/50
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
        if (scoreEl) scoreEl.innerText = `${window.riktigeSvar} riktige i dag`;

        // ✅ DEAKTIVER KLIKK: Hindre at bruker kan klikke mens feedback vises
        const altContainer = document.getElementById('oving-alternativer');
        const inputContainer = document.getElementById('oving-input-container');
        if (altContainer) altContainer.style.pointerEvents = 'none';
        if (inputContainer) inputContainer.style.pointerEvents = 'none';

        sjekkOmGevinst();

        // ✅ RASKERE FEEDBACK: 1 sekund i stedet for 1.5
        setTimeout(() => {
            // Reaktiver klikk
            if (altContainer) altContainer.style.pointerEvents = 'auto';
            if (inputContainer) inputContainer.style.pointerEvents = 'auto';

            window.ovingIndex++;
            visNesteSporsmaal();
        }, 1000);

    } else {
        spillLyd('feil');
        vibrer(200);

        document.getElementById('fasit-tekst').innerText = riktigSvarTekst;
        document.getElementById('feil-svar-popup').style.display = 'flex';
    }
}

window.lukkFeilPopup = function () {
    document.getElementById('feil-svar-popup').style.display = 'none';
    window.ovingIndex++;
    visNesteSporsmaal();
};

function sjekkOmGevinst() {
    // === 1. KORTPREMIE (Hver 10. riktig i sesjonen) ===
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

    // === 2. DIAMANTPREMIE (Hver 100. totalt riktig) ===
    // Matchet logikk fra quiz.js
    const totalXP = getTotalCorrect();
    const XP_PER_DIAMANT_BONUS = 100;
    const DIAMANTER_PER_BONUS = 10;

    if (totalXP > 0 && totalXP % XP_PER_DIAMANT_BONUS === 0) {
        let credits = getCredits();
        credits += DIAMANTER_PER_BONUS;
        saveCredits(credits);

        // Vis melding
        setTimeout(() => {
            visToast(`💎 BONUS! Du fikk ${DIAMANTER_PER_BONUS} diamanter!`, 'success');
            spillLyd('vinn');
        }, 1200); // Litt forsinkelse så det ikke kræsjer med kort-animasjon
    }
}

export function avsluttOving(ferdig = false) {
    if (ferdig) { }
    const container = document.getElementById('game-progress-target');
    if (container) container.innerHTML = "";
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