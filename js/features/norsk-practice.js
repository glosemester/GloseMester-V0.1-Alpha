/* ============================================
   NORSK-PRACTICE.JS - NorskMester Øving v2.1
   Norskfaglige øvelser med diktat, flervalg og skriving
   Bruker samme kort/XP-system som GloseMester
   Støtter lærer-diktat (lyd fra Firebase Storage)
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd, vibrer, lesOpp } from '../ui/helpers.js';
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
    sessionCorrect: 0,
    laererDiktat: null  // {lydUrler: {0: url, 1: url}, tittel, ordliste}
};

// ============================================
// NIVÅ-KONFIG (6 nivåer)
// type: 'diktat' = les opp, skriv
// type: 'flervalg' = velg riktig svar
// type: 'skriving' = les spørsmål, skriv svar
// ============================================

const NORSK_NIVÅER = {
    niva1: { name: 'Høyfrekvente ord - Enkel', emoji: '🔊', description: '1.-2. trinn', type: 'diktat' },
    niva2: { name: 'Høyfrekvente ord - Medium', emoji: '🔊', description: '3.-4. trinn', type: 'diktat' },
    niva3: { name: 'Ordklasser & Bøyning', emoji: '📝', description: '3.-5. trinn', type: 'flervalg' },
    niva4: { name: 'Rettskriving', emoji: '✍️', description: '4.-7. trinn', type: 'skriving' },
    niva5: { name: 'Synonymer & Ordforståelse', emoji: '🧠', description: '5.-8. trinn', type: 'flervalg' },
    niva6: { name: 'Bokmål ↔ Nynorsk', emoji: '🇳🇴', description: '6.-10. trinn', type: 'skriving' }
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

/**
 * Les opp et norsk ord — lærer-lyd først, fallback til robot
 */
function lesOppNorskOrd(tekst) {
    // Sjekk om vi har lærer-lyd for dette ordet
    if (norskState.laererDiktat && norskState.laererDiktat.lydUrler) {
        const lydUrl = norskState.laererDiktat.lydUrler[norskState.index];
        if (lydUrl) {
            const audio = new Audio(lydUrl);
            audio.play().catch(err => {
                console.warn('Kunne ikke spille lærer-lyd, bruker robot:', err);
                spillRobotStemme(tekst);
            });
            return;
        }
    }
    spillRobotStemme(tekst);
}

function spillRobotStemme(tekst) {
    if (typeof lesOpp === 'function') {
        lesOpp(tekst, 'no-NO');
    } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(tekst);
        utterance.lang = 'no-NO';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
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
        norskState.ordliste = stokkArray([...norskState.ordliste]);
        norskState.index = 0;
    }

    norskState.currentWord = norskState.ordliste[norskState.index];

    const feedbackEl = document.getElementById('norsk-feedback');
    if (feedbackEl) feedbackEl.innerText = '';

    const spmEl = document.getElementById('norsk-spm');
    const scoreEl = document.getElementById('norsk-score');
    if (scoreEl) scoreEl.innerText = `${norskState.riktigeSvar} riktige i dag`;

    const inputContainer = document.getElementById('norsk-input-container');
    const altContainer = document.getElementById('norsk-alternativer');
    const diktatContainer = document.getElementById('norsk-diktat-container');

    // Skjul alle først
    if (inputContainer) inputContainer.style.display = 'none';
    if (altContainer) altContainer.style.display = 'none';
    if (diktatContainer) diktatContainer.style.display = 'none';

    // Bestem oppgavetype basert på nivå-config
    const nivaConfig = NORSK_NIVÅER[norskState.currentLevel];
    // Lærer-diktat bruker alltid diktat-modus
    const oppgaveType = norskState.laererDiktat ? 'diktat' : (nivaConfig ? nivaConfig.type : 'skriving');

    if (oppgaveType === 'diktat') {
        // ===== DIKTAT-MODUS =====
        // Vis "Lytt og skriv" i stedet for selve ordet
        if (spmEl) spmEl.innerHTML = '🔊 <span style="color:#e74c3c;">Lytt og skriv ordet!</span>';

        if (diktatContainer) {
            diktatContainer.style.display = 'block';

            // Auto-les opp ordet etter en kort pause
            setTimeout(() => lesOppNorskOrd(norskState.currentWord.s), 400);

            // Setup "Les opp igjen"-knapp
            const lesOppBtn = document.getElementById('norsk-les-opp-btn');
            if (lesOppBtn) {
                lesOppBtn.onclick = () => lesOppNorskOrd(norskState.currentWord.s);
            }

            // Setup input
            const diktatInput = document.getElementById('norsk-diktat-input');
            if (diktatInput) {
                diktatInput.value = '';
                diktatInput.focus();
                diktatInput.onkeydown = (e) => {
                    if (e.key === 'Enter') sjekkNorskSvar();
                };
            }
        }

    } else if (oppgaveType === 'flervalg') {
        // ===== FLERVALG-MODUS =====
        if (spmEl) spmEl.innerText = norskState.currentWord.s;

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
        // ===== SKRIVING-MODUS =====
        if (spmEl) spmEl.innerText = norskState.currentWord.s;

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
 * Sjekk norsk-svar (fungerer for alle 3 moduser)
 */
export function sjekkNorskSvar(valgtOrd = null) {
    const rateCheck = practiceLimiter.check('practice_answer');
    if (!rateCheck.allowed) {
        const minutter = Math.ceil(rateCheck.remainingMs / 60000);
        visToast(`⏰ Vent ${minutter} minutt(er) før du fortsetter.`, 'warning');
        return;
    }

    const feedbackEl = document.getElementById('norsk-feedback');
    let erRiktig = false;
    const riktigSvar = norskState.currentWord.e;

    const nivaConfig = NORSK_NIVÅER[norskState.currentLevel];
    const oppgaveType = nivaConfig ? nivaConfig.type : 'skriving';

    if (valgtOrd) {
        // Flervalg
        erRiktig = (valgtOrd.e === norskState.currentWord.e);
    } else if (oppgaveType === 'diktat') {
        // Diktat - hent fra diktat-input
        const input = document.getElementById('norsk-diktat-input');
        const brukerSvar = input?.value.trim().toLowerCase();
        erRiktig = (brukerSvar === riktigSvar.toLowerCase());
    } else {
        // Skriving - hent fra vanlig input
        const input = document.getElementById('norsk-svar-input');
        const brukerSvar = input?.value.trim().toLowerCase();
        erRiktig = (brukerSvar === riktigSvar.toLowerCase());
    }

    // Deaktiver klikk midlertidig
    const altContainer = document.getElementById('norsk-alternativer');
    const inputContainer = document.getElementById('norsk-input-container');
    const diktatContainer = document.getElementById('norsk-diktat-container');
    if (altContainer) altContainer.style.pointerEvents = 'none';
    if (inputContainer) inputContainer.style.pointerEvents = 'none';
    if (diktatContainer) diktatContainer.style.pointerEvents = 'none';

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
            if (diktatContainer) diktatContainer.style.pointerEvents = 'auto';
            norskState.index++;
            visNorskSpørsmål();
        }, 1000);

    } else {
        spillLyd('feil');
        vibrer(200);

        const fasitEl = document.getElementById('fasit-tekst');
        if (fasitEl) fasitEl.innerText = riktigSvar;
        const popup = document.getElementById('feil-svar-popup');
        if (popup) popup.style.display = 'flex';

        const originalLukkFn = window.lukkFeilPopup;
        window.lukkFeilPopup = function() {
            popup.style.display = 'none';
            if (altContainer) altContainer.style.pointerEvents = 'auto';
            if (inputContainer) inputContainer.style.pointerEvents = 'auto';
            if (diktatContainer) diktatContainer.style.pointerEvents = 'auto';
            norskState.index++;
            visNorskSpørsmål();
            window.lukkFeilPopup = originalLukkFn;
        };
    }
}

/**
 * Oppdater norsk progress
 */
function oppdaterNorskProgress() {
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

/**
 * Start lærer-diktat fra delingskode
 * Henter lyd fra Firebase Storage og kjører diktat med lærerens stemme
 */
export async function startLaererDiktat(delingskode) {
    try {
        // Importer dynamisk for å unngå sirkulær avhengighet
        const { hentDiktatForElev } = await import('./diktat-recorder.js');
        const diktatData = await hentDiktatForElev(delingskode);

        if (!diktatData) {
            visToast('Fant ikke diktat, eller det har utløpt', 'error');
            return;
        }

        // Sett opp state med lærer-lyd
        norskState.laererDiktat = diktatData;
        norskState.currentLevel = 'laerer-diktat';
        norskState.ordliste = diktatData.ordliste.map(ord => ({
            s: ord, e: ord, kategori: 'diktat', diktat: true
        }));
        norskState.index = 0;
        norskState.riktigeSvar = 0;
        norskState.sessionCorrect = 0;

        visSide('norsk-oving-omraade');
        visToast(`🎤 Diktat fra ${diktatData.laererEpost || 'lærer'}`, 'success');
        visNorskSpørsmål();

    } catch (err) {
        console.error('Feil ved lasting av lærer-diktat:', err);
        visToast('Kunne ikke starte diktat', 'error');
    }
}

// Eksponer til window
window.startNorskOving = startNorskOving;
window.sjekkNorskSvar = sjekkNorskSvar;
window.avsluttNorskOving = avsluttNorskOving;
window.startLaererDiktat = startLaererDiktat;

console.log('📖 NorskMester practice module v2.1 loaded (med lærer-diktat)');
