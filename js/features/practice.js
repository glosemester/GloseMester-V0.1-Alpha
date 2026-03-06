/* ============================================
   PRACTICE.JS - Øve Modus v2.0 (MED LEITNER + ADAPTIV LÆRING)
   Ny: Leitner spaced repetition system (5 bokser)
   Ny: Adaptiv vanskelighetsgrad basert på prestasjon
   Ny: Visuell indikator for mestringsnivå
   ============================================ */

import { hentTilfeldigKort, visSamling } from './kort-display.js';
import { visSide } from '../core/navigation.js';
import { visToast, spillLyd, vibrer, lesOpp } from '../ui/helpers.js';
import { saveCredits, getCredits, saveTotalCorrect, getTotalCorrect } from '../core/storage.js';
import { practiceLimiter, cardLimiter } from '../core/rate-limiter.js';
import {
    LeitnerSystem,
    AdaptiveDifficulty,
    getUserProgress,
    updateWordProgress,
    recordDailyActivity
} from './learningEngine.js';

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
    window.currentStreak = 0; // ✅ Ny streak-teller

    // Badge-tracking: early_bird og night_owl (én gang per dag per kategori)
    try {
        const hour = new Date().getHours();
        const today = new Date().setHours(0, 0, 0, 0).toString();
        const badgeStats = JSON.parse(localStorage.getItem('mester_badge_stats') || '{}');
        if (hour < 8 && badgeStats.earlyBirdLastDate !== today) {
            badgeStats.earlyBirdCount = (badgeStats.earlyBirdCount || 0) + 1;
            badgeStats.earlyBirdLastDate = today;
            localStorage.setItem('mester_badge_stats', JSON.stringify(badgeStats));
        } else if (hour >= 22 && badgeStats.nightOwlLastDate !== today) {
            badgeStats.nightOwlCount = (badgeStats.nightOwlCount || 0) + 1;
            badgeStats.nightOwlLastDate = today;
            localStorage.setItem('mester_badge_stats', JSON.stringify(badgeStats));
        }
    } catch (e) { /* ignorer feil */ }

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
    const progressBar = document.getElementById('game-progress-fill'); // ✅ Oppdatert ID
    if (!progressBar) return;

    // Calculate percentage based on 10 correct answers per round
    const currentProgress = window.riktigeSvar % 10;
    const isCompletedRound = (window.riktigeSvar > 0 && currentProgress === 0);

    const percentage = isCompletedRound ? 100 : (currentProgress * 10);
    progressBar.style.width = `${percentage}%`;

    // Update text if it exists
    const progressText = document.getElementById('game-progress-text');
    if (progressText) {
        progressText.innerText = isCompletedRound ?
            "Partybølge fullført! 🎉" :
            `Mot nytt kort: ${currentProgress} / 10`;
    }

    // ✅ Oppdater Streak Teller med bump-animasjon
    const streakEl = document.getElementById('streak-counter');
    if (streakEl) {
        streakEl.innerHTML = `🔥 ${window.currentStreak || 0}`;
        streakEl.classList.remove('streak-bump');
        void streakEl.offsetWidth; // trigger reflow
        streakEl.classList.add('streak-bump');
    }
}

// ✅ Flytende poeng-animasjon (+1 som svever oppover med glow)
function visFlytendPoeng(erRiktig) {
    const scoreEl = document.getElementById('oving-score');
    if (!scoreEl) return;

    const floater = document.createElement('span');
    floater.className = 'score-float' + (erRiktig ? '' : ' wrong');
    floater.textContent = erRiktig ? '+1' : '✗';

    // Posisjonering relativt til score-elementet
    scoreEl.style.position = 'relative';
    floater.style.left = '50%';
    floater.style.top = '0';
    floater.style.transform = 'translateX(-50%)';
    scoreEl.appendChild(floater);

    // Fjern etter animasjon
    setTimeout(() => floater.remove(), 1300);
}

// ✅ Flash-effekt på navigasjonsbaren (grønn/rød glow)
function flashNavBar(erRiktig) {
    // Finn den synlige menybaren
    const menyIds = ['oving-meny', 'matte-oving-meny', 'norsk-oving-meny'];
    let aktivMeny = null;
    for (const id of menyIds) {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none') {
            aktivMeny = el;
            break;
        }
    }
    if (!aktivMeny) return;

    const flashClass = erRiktig ? 'nav-flash-green' : 'nav-flash-red';
    const varighet = erRiktig ? 1500 : 1000;

    // Fjern gamle flash-klasser
    aktivMeny.classList.remove('nav-flash-green', 'nav-flash-red');
    void aktivMeny.offsetWidth; // trigger reflow for re-animasjon
    aktivMeny.classList.add(flashClass);

    setTimeout(() => {
        aktivMeny.classList.remove(flashClass);
    }, varighet);
}

function visNesteSporsmaal() {
    oppdaterProgress();

    const feedbackEl = document.getElementById('oving-feedback');
    const inputContainer = document.getElementById('oving-input-container');
    const altContainer = document.getElementById('oving-alternativer');

    if (feedbackEl) feedbackEl.innerText = '';

    // ✅ LEITNER: Hent ord som skal øves basert på spaced repetition
    const leitner = new LeitnerSystem();
    const userProgress = getUserProgress();
    let dueWords = leitner.getDueWords(window.vokabularData[gjeldendeNiva], userProgress);

    // Fallback: Hvis ingen ord er "due" (alle nylig øvd), bruk alle ord i nivået
    // slik at brukeren kan fortsette å øve i samme økt
    if (dueWords.length === 0) {
        dueWords = [...window.vokabularData[gjeldendeNiva]];
    }

    // Prioriter ord i lavere bokser, men stokk innenfor samme boks
    const lowestBox = dueWords.reduce((min, w) => {
        const box = userProgress[leitner.getWordId(w)]?.box || 1;
        return box < min ? box : min;
    }, Infinity);

    const wordsInLowestBox = stokkArray(
        dueWords.filter(w => (userProgress[leitner.getWordId(w)]?.box || 1) === lowestBox)
    );

    gjeldendeOrd = wordsInLowestBox[0];

    const sporsmaalTekst = window.ovingRetning === 'no' ? gjeldendeOrd.s : gjeldendeOrd.e;
    document.getElementById('oving-spm').innerText = sporsmaalTekst;

    // ✅ VIS LEITNER BOX INDIKATOR
    const wordId = leitner.getWordId(gjeldendeOrd);
    const currentBox = userProgress[wordId]?.box || 1;
    visLeitnerStatus(currentBox, leitner.getBoxName(currentBox));

    const altLang = window.ovingRetning === 'no' ? 'en-US' : 'no-NO';

    // ✅ ADAPTIV VANSKELIGHETSGRAD
    const adaptive = new AdaptiveDifficulty();
    const exerciseType = adaptive.getExerciseType(gjeldendeNiva);
    const erFlervalg = (exerciseType === 'multiple-choice');
    const distractorCount = adaptive.getDistractorCount();

    if (erFlervalg) {
        // --- FLERVALG MED TYDELIGERE TEKST ---
        inputContainer.style.display = 'none';
        altContainer.style.display = 'grid';
        altContainer.innerHTML = '';

        let alternativer = [gjeldendeOrd];
        let forsok = 0;

        const sjekkKey = window.ovingRetning === 'no' ? 'e' : 's';

        // ✅ Adaptiv antall alternativer (2-5 distraktorer + riktig svar = 3-6 total)
        const targetCount = distractorCount + 1;

        while (alternativer.length < targetCount && forsok < 50) {
            const tilfeldig = window.vokabularData[gjeldendeNiva][Math.floor(Math.random() * window.vokabularData[gjeldendeNiva].length)];
            if (!alternativer.some(a => a[sjekkKey] === tilfeldig[sjekkKey])) {
                alternativer.push(tilfeldig);
            }
            forsok++;
        }
        alternativer = stokkArray(alternativer);

        alternativer.forEach(alt => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.type = 'button';
            const btnTekst = window.ovingRetning === 'no' ? alt.e : alt.s;
            btn.setAttribute('aria-label', `Svar: ${btnTekst}`);

            btn.innerHTML = `
                <span>${btnTekst}</span>
                <button type="button" class="audio-btn-small" aria-label="Les opp ${btnTekst}">🔊</button>
            `;
            // Koble lyd trygt via closure — unngår syntaksfeil ved apostrof i btnTekst
            const audioBtn = btn.querySelector('.audio-btn-small');
            if (audioBtn) {
                audioBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.lesOppOving(btnTekst, altLang);
                });
            }
            // Send med event for å kunne endre stil på knappen ved klikk
            btn.onclick = (e) => sjekkOvingSvar(alt, e.currentTarget);
            altContainer.appendChild(btn);
        });

    } else {
        // --- SKRIVING ---
        inputContainer.style.display = 'flex';
        altContainer.style.display = 'none';
        const inputFelt = document.getElementById('oving-svar');
        if (inputFelt) {
            inputFelt.value = '';
            inputFelt.style.borderColor = '#ddd';
            inputFelt.focus();
            // Fjern forrige handler før ny legges til (unngår memory leak ved akkumulerte lyttere)
            if (inputFelt._ovingKeyHandler) {
                inputFelt.removeEventListener('keydown', inputFelt._ovingKeyHandler);
            }
            inputFelt._ovingKeyHandler = (e) => { if (e.key === 'Enter') sjekkOvingSvar(); };
            inputFelt.addEventListener('keydown', inputFelt._ovingKeyHandler);
        }
    }
}

export function sjekkOvingSvar(valgtOrd = null, clickedBtn = null) {
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

        // ✅ LEITNER: Oppdater progress for dette ordet
        const leitner = new LeitnerSystem();
        const wordId = leitner.getWordId(gjeldendeOrd);
        const currentProgress = getUserProgress()[wordId];
        const currentBox = currentProgress?.box || 1;

        const updatedProgress = updateWordProgress(wordId, true, currentBox);

        // ✅ ADAPTIV: Registrer riktig svar
        const adaptive = new AdaptiveDifficulty();
        adaptive.recordAnswer(true);

        // ✅ Vis Leitner-fremgang
        if (updatedProgress.box > currentBox) {
            feedbackEl.innerHTML = `✅ Riktig! <span style="color: var(--electric-blue); font-weight: bold;">Opp til ${leitner.getBoxName(updatedProgress.box)}!</span>`;
        } else {
            feedbackEl.innerText = "✅ Riktig!";
        }

        feedbackEl.style.color = 'green';
        spillLyd('riktig');

        oppdaterProgress();

        const scoreEl = document.getElementById('oving-score');
        if (scoreEl) scoreEl.innerText = `${window.riktigeSvar} poeng`;

        window.currentStreak = (window.currentStreak || 0) + 1; // Øk streak

        // Badge-tracking: perfect_10 (10 riktige på rad i én økt)
        if (window.currentStreak >= 10) {
            try {
                const badgeStats = JSON.parse(localStorage.getItem('mester_badge_stats') || '{}');
                if ((badgeStats.perfectStreak || 0) < 10) {
                    badgeStats.perfectStreak = 10;
                    localStorage.setItem('mester_badge_stats', JSON.stringify(badgeStats));
                }
            } catch (e) { /* ignorer feil */ }
        }

        // ✅ Visuell feedback på knappen
        if (clickedBtn) {
            clickedBtn.classList.add('correct');
        } else {
            const input = document.getElementById('oving-svar');
            if (input) input.style.borderColor = '#4CAF50';
        }
        oppdaterProgress(); // Oppdater streak teller UI

        // ✅ NY: Flytende poeng-animasjon og nav bar flash
        visFlytendPoeng(true);
        flashNavBar(true);

        // ✅ DEAKTIVER KLIKK: Hindre at bruker kan klikke mens feedback vises
        const altContainer = document.getElementById('oving-alternativer');
        const inputContainer = document.getElementById('oving-input-container');
        if (altContainer) altContainer.style.pointerEvents = 'none';
        if (inputContainer) inputContainer.style.pointerEvents = 'none';

        sjekkOmGevinst();
        recordDailyActivity(); // Track activity for streak tracking

        // Vis «Neste»-knapp slik at brukeren kan styre tempoet
        feedbackEl.insertAdjacentHTML('beforeend',
            ' <button id="neste-spm-btn" class="btn-neste">Neste →</button>'
        );

        const nesteTimer = setTimeout(() => {
            if (altContainer) altContainer.style.pointerEvents = 'auto';
            if (inputContainer) inputContainer.style.pointerEvents = 'auto';
            visNesteSporsmaal();
        }, 2000);

        const nesteBtnEl = document.getElementById('neste-spm-btn');
        if (nesteBtnEl) {
            nesteBtnEl.onclick = () => {
                clearTimeout(nesteTimer);
                if (altContainer) altContainer.style.pointerEvents = 'auto';
                if (inputContainer) inputContainer.style.pointerEvents = 'auto';
                visNesteSporsmaal();
            };
        }

    } else {
        // ✅ LEITNER: Registrer feil svar (flytt ned i bokser)
        const leitner = new LeitnerSystem();
        const wordId = leitner.getWordId(gjeldendeOrd);
        const currentProgress = getUserProgress()[wordId];
        const currentBox = currentProgress?.box || 1;

        updateWordProgress(wordId, false, currentBox);

        // ✅ ADAPTIV: Registrer feil svar
        const adaptive = new AdaptiveDifficulty();
        adaptive.recordAnswer(false);

        spillLyd('feil');
        vibrer(200);


        window.currentStreak = 0; // Nullstill streak
        oppdaterProgress(); // Oppdater streak teller UI

        // ✅ NY: Flytende feil-animasjon og nav bar flash
        visFlytendPoeng(false);
        flashNavBar(false);

        // ✅ Visuell feedback på knappen
        if (clickedBtn) {
            clickedBtn.classList.add('wrong');
        } else {
            const input = document.getElementById('oving-svar');
            if (input) input.style.borderColor = '#FF5252';
        }

        document.getElementById('fasit-tekst').innerText = riktigSvarTekst;
        document.getElementById('feil-svar-popup').style.display = 'flex';
    }
}

window.lukkFeilPopup = function () {
    document.getElementById('feil-svar-popup').style.display = 'none';
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

// ============================================
// LEITNER STATUS VISUALIZATION
// ============================================

/**
 * Vis visuell indikator for Leitner-boksstatus
 * @param {number} currentBox - Nåværende boks (1-5)
 * @param {string} boxName - Display-navn for boksen
 */
function visLeitnerStatus(currentBox, boxName) {
    // Finn eller opprett container
    let statusContainer = document.getElementById('leitner-status-container');

    if (!statusContainer) {
        // Opprett container hvis den ikke finnes
        const sporsmaalContainer = document.getElementById('oving-spm')?.parentElement;
        if (!sporsmaalContainer) return;

        statusContainer = document.createElement('div');
        statusContainer.id = 'leitner-status-container';
        statusContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            padding: 8px 12px;
            background: rgba(124, 58, 237, 0.08);
            border-radius: var(--border-radius-sm);
            font-size: 0.85rem;
            color: #666;
        `;

        sporsmaalContainer.insertBefore(statusContainer, sporsmaalContainer.firstChild.nextSibling);
    }

    // Emoji og farge basert på boks
    const boxEmojis = ['🌱', '🌿', '🌳', '⭐', '🏆'];
    const boxColors = ['#ff6b6b', '#ffa726', '#ffca28', '#66bb6a', '#26a69a'];

    const emoji = boxEmojis[currentBox - 1];
    const color = boxColors[currentBox - 1];

    // Vis bokser med fylling
    let boxHTML = '<div style="display: flex; gap: 3px; margin-right: 8px;">';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= currentBox;
        boxHTML += `
            <div style="
                width: 12px;
                height: 12px;
                background: ${filled ? color : '#e0e0e0'};
                border-radius: 2px;
                transition: background 0.3s ease;
            "></div>
        `;
    }
    boxHTML += '</div>';

    statusContainer.innerHTML = `
        ${boxHTML}
        <span style="font-weight: 600; color: ${color};">${emoji} ${boxName}</span>
    `;
}