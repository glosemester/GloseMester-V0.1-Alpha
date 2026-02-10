/* ============================================
   NORSK-PRACTICE.JS - NorskMester Øving v1.0
   Norskfaglige øvelser med flervalg og skriving
   Bruker samme kort/XP-system som GloseMester
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd, vibrer } from '../ui/helpers.js';
import { saveCredits, getCredits, saveTotalCorrect, getTotalCorrect } from '../core/storage.js';
import { hentTilfeldigKort } from './kort-display.js';
import { practiceLimiter, cardLimiter } from '../core/rate-limiter.js';

// ============================================
// STATE
// ============================================

let norskState = {
    currentLevel: null,
    ordliste: [],
    currentWord: null,
    index: 0,
    riktigeSvar: 0,
    sessionCorrect: 0
};

// ============================================
// NIVÅ-KONFIG
// ============================================

const NORSK_NIVÅER = {
    niva1: { name: 'Ordklasser & Bøyning', emoji: '📝', description: '1.-4. trinn' },
    niva2: { name: 'Rettskriving', emoji: '✍️', description: '3.-6. trinn' },
    niva3: { name: 'Synonymer & Ordforståelse', emoji: '🧠', description: '5.-8. trinn' },
    niva4: { name: 'Bokmål ↔ Nynorsk', emoji: '🇳🇴', description: '6.-10. trinn' }
};

// ============================================
// HJELPEFUNKSJONER
// ============================================

function stokkArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function ventPaNorskData(maxTid = 5000) {
    const startTid = Date.now();
    while (!window.norskVokabular || Object.keys(window.norskVokabular).length === 0) {
        if (Date.now() - startTid > maxTid) {
            console.error('❌ Timeout: NorskData ikke lastet');
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return true;
}

// ============================================
// EKSPORTERTE FUNKSJONER
// ============================================

/**
 * Start norsk-øving med valgt nivå
 */
export async function startNorskOving(nivaValg) {
    norskState.currentLevel = nivaValg;
    window.gjeldendeNiva = nivaValg;

    const erKlar = await ventPaNorskData();

    if (!erKlar || !window.norskVokabular || !window.norskVokabular[nivaValg]) {
        console.error('❌ Kunne ikke laste norskdata for', nivaValg);
        visToast('Kunne ikke laste ordliste. Prøv på nytt.', 'error');
        return;
    }

    norskState.ordliste = stokkArray([...window.norskVokabular[nivaValg]]);
    norskState.index = 0;
    norskState.riktigeSvar = 0;
    norskState.sessionCorrect = 0;

    visSide('norsk-oving-omraade');
    visNorskSpørsmål();
}

/**
 * Vis neste norsk-spørsmål
 */
function visNorskSpørsmål() {
    oppdaterNorskProgress();

    if (norskState.index >= norskState.ordliste.length) {
        // Stokk om og start på nytt (uendelig øving)
        norskState.ordliste = stokkArray([...norskState.ordliste]);
        norskState.index = 0;
    }

    norskState.currentWord = norskState.ordliste[norskState.index];

    const feedbackEl = document.getElementById('norsk-feedback');
    if (feedbackEl) feedbackEl.innerText = '';

    const spmEl = document.getElementById('norsk-spm');
    if (spmEl) spmEl.innerText = norskState.currentWord.s;

    const scoreEl = document.getElementById('norsk-score');
    if (scoreEl) scoreEl.innerText = `${norskState.riktigeSvar} riktige i dag`;

    // Bestem type: flervalg for niva1/niva3, skriving for niva2/niva4
    const erFlervalg = (norskState.currentLevel === 'niva1' || norskState.currentLevel === 'niva3');

    const inputContainer = document.getElementById('norsk-input-container');
    const altContainer = document.getElementById('norsk-alternativer');

    if (erFlervalg) {
        if (inputContainer) inputContainer.style.display = 'none';
        if (altContainer) {
            altContainer.style.display = 'grid';
            altContainer.innerHTML = '';

            let alternativer = [norskState.currentWord];
            let forsok = 0;

            while (alternativer.length < 4 && forsok < 50) {
                const tilfeldig = norskState.ordliste[Math.floor(Math.random() * norskState.ordliste.length)];
                if (!alternativer.some(a => a.e === tilfeldig.e)) {
                    alternativer.push(tilfeldig);
                }
                forsok++;
            }

            alternativer = stokkArray(alternativer);

            alternativer.forEach(alt => {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.style.cssText = 'padding: 12px 15px; text-align: left; font-weight: 700; font-size: 1rem;';
                btn.textContent = alt.e;
                btn.onclick = () => sjekkNorskSvar(alt);
                altContainer.appendChild(btn);
            });
        }
    } else {
        if (altContainer) altContainer.style.display = 'none';
        if (inputContainer) {
            inputContainer.style.display = 'flex';
            const inputFelt = document.getElementById('norsk-svar-input');
            if (inputFelt) {
                inputFelt.value = '';
                inputFelt.focus();
                inputFelt.onkeydown = (e) => {
                    if (e.key === 'Enter') sjekkNorskSvar();
                };
            }
        }
    }
}

/**
 * Sjekk norsk-svar
 */
export function sjekkNorskSvar(valgtOrd = null) {
    // Rate limiting
    const rateCheck = practiceLimiter.check('practice_answer');
    if (!rateCheck.allowed) {
        const minutter = Math.ceil(rateCheck.remainingMs / 60000);
        visToast(`⏰ Vent ${minutter} minutt(er) før du fortsetter.`, 'warning');
        return;
    }

    const feedbackEl = document.getElementById('norsk-feedback');
    let erRiktig = false;
    const riktigSvar = norskState.currentWord.e;

    if (valgtOrd) {
        erRiktig = (valgtOrd.e === norskState.currentWord.e);
    } else {
        const input = document.getElementById('norsk-svar-input');
        const brukerSvar = input?.value.trim().toLowerCase();
        erRiktig = (brukerSvar === riktigSvar.toLowerCase());
    }

    // Deaktiver klikk midlertidig
    const altContainer = document.getElementById('norsk-alternativer');
    const inputContainer = document.getElementById('norsk-input-container');
    if (altContainer) altContainer.style.pointerEvents = 'none';
    if (inputContainer) inputContainer.style.pointerEvents = 'none';

    if (erRiktig) {
        norskState.riktigeSvar++;
        norskState.sessionCorrect++;
        saveTotalCorrect(getTotalCorrect() + 1);

        if (feedbackEl) {
            feedbackEl.innerText = '✅ Riktig!';
            feedbackEl.style.color = 'green';
        }

        spillLyd('riktig');
        oppdaterNorskProgress();

        // Diamant-bonus
        const newXP = getTotalCorrect();
        if (newXP > 0 && newXP % 100 === 0) {
            let credits = getCredits();
            credits += 10;
            saveCredits(credits);
            setTimeout(() => visToast('💎 BONUS! Du fikk 10 diamanter!', 'success'), 1000);
        }

        // Kort-belønning
        if (norskState.sessionCorrect > 0 && norskState.sessionCorrect % 10 === 0) {
            const cardCheck = cardLimiter.check('card_reward');
            if (cardCheck.allowed) {
                setTimeout(() => hentTilfeldigKort(), 600);
            }
        }

        setTimeout(() => {
            if (altContainer) altContainer.style.pointerEvents = 'auto';
            if (inputContainer) inputContainer.style.pointerEvents = 'auto';
            norskState.index++;
            visNorskSpørsmål();
        }, 1000);

    } else {
        spillLyd('feil');
        vibrer(200);

        // Vis riktig svar i feil-popup
        const fasitEl = document.getElementById('fasit-tekst');
        if (fasitEl) fasitEl.innerText = riktigSvar;
        const popup = document.getElementById('feil-svar-popup');
        if (popup) popup.style.display = 'flex';

        // Lagre gammel lukk-funksjon og overskriv for å gå til neste
        const originalLukkFn = window.lukkFeilPopup;
        window.lukkFeilPopup = function() {
            popup.style.display = 'none';
            if (altContainer) altContainer.style.pointerEvents = 'auto';
            if (inputContainer) inputContainer.style.pointerEvents = 'auto';
            norskState.index++;
            visNorskSpørsmål();
            // Gjenopprett original
            window.lukkFeilPopup = originalLukkFn;
        };
    }
}

/**
 * Oppdater norsk progress
 */
function oppdaterNorskProgress() {
    // Kort progress (10-box)
    const kortProgress = document.getElementById('norsk-kort-progress');
    if (kortProgress) {
        const filled = norskState.sessionCorrect % 10;
        let html = '';
        for (let i = 0; i < 10; i++) {
            const isFilled = i < filled;
            html += `<div style="flex:1; height:12px; background:${isFilled ? 'var(--sunny-yellow, #FBBF24)' : 'rgba(0,0,0,0.1)'}; border-radius:6px; transition:all 0.3s;${isFilled ? 'box-shadow:0 0 8px var(--sunny-yellow, #FBBF24);' : ''}"></div>`;
        }
        kortProgress.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:600;">
                <span>🎁 MOT NYTT KORT:</span>
                <span>${filled} / 10</span>
            </div>
            <div style="display:flex; gap:4px;">${html}</div>
        `;
    }

    // XP progress
    const xpProgress = document.getElementById('norsk-xp-progress');
    if (xpProgress) {
        const totalXP = getTotalCorrect();
        const progress = totalXP % 100;
        xpProgress.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px; font-weight:600;">
                <span>💎 Mot neste bonus (100 xp)</span>
                <span>${progress} / 100</span>
            </div>
            <div class="yellow-track" style="width:100%; background:rgba(229,229,234,0.6); border-radius:10px; height:10px; overflow:hidden;">
                <div style="height:100%; background:linear-gradient(90deg, #FBBF24, #F59E0B); width:${progress}%; transition:width 0.4s;"></div>
            </div>
        `;
    }
}

/**
 * Avslutt norsk-øving
 */
export function avsluttNorskOving() {
    norskState.index = 0;
    norskState.ordliste = [];
    norskState.sessionCorrect = 0;
    visSide('norsk-oving-start');
}

/**
 * Vis norsk samling (kortsamling)
 */
export function visNorskSamling() {
    visSide('oving-samling');
    if (typeof window.visSamling === 'function') window.visSamling();
}

// Eksponer til window
window.startNorskOving = startNorskOving;
window.sjekkNorskSvar = sjekkNorskSvar;
window.avsluttNorskOving = avsluttNorskOving;

console.log('📖 NorskMester practice module loaded');
