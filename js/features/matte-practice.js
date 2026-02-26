/* ============================================
   MATTE-PRACTICE.JS - MatteMester Øving v1.0
   Portet fra src/features/mattemester/ til
   index.html DOM-arkitektur
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd, vibrer } from '../ui/helpers.js';
import { saveCredits, getCredits, saveTotalCorrect, getTotalCorrect } from '../core/storage.js';
import { hentTilfeldigKort } from './kort-display.js';
import { practiceLimiter, cardLimiter } from '../core/rate-limiter.js';

// ============================================
// OPPGAVE CONFIG (tilpasset LK20)
// ============================================

const OPPGAVE_CONFIG = {
    pluss: {
        name: 'Pluss', emoji: '➕', type: 'addisjon',
        nivåer: {
            niva1: { name: 'Nivå 1', description: '1.-2. trinn', tallområde: [1, 20] },
            niva2: { name: 'Nivå 2', description: '3.-5. trinn', tallområde: [1, 100] },
            niva3: { name: 'Nivå 3', description: '6.-8. trinn', tallområde: [1, 1000], medDesimal: true }
        }
    },
    minus: {
        name: 'Minus', emoji: '➖', type: 'subtraksjon',
        nivåer: {
            niva1: { name: 'Nivå 1', description: '1.-2. trinn', tallområde: [1, 20] },
            niva2: { name: 'Nivå 2', description: '3.-5. trinn', tallområde: [1, 100] },
            niva3: { name: 'Nivå 3', description: '6.-8. trinn', tallområde: [1, 1000], medDesimal: true }
        }
    },
    gange: {
        name: 'Gange', emoji: '✖️', type: 'multiplikasjon',
        nivåer: {
            niva1: { name: 'Nivå 1', description: '1.-2. trinn', gangetabellTil: 5, faktorMaks: 10 },
            niva2: { name: 'Nivå 2', description: '3.-5. trinn', gangetabellTil: 10, faktorMaks: 12 },
            niva3: { name: 'Nivå 3', description: '6.-8. trinn', gangetabellTil: 12, faktorMaks: 100 }
        }
    },
    dele: {
        name: 'Dele', emoji: '➗', type: 'divisjon',
        nivåer: {
            niva1: { name: 'Nivå 1', description: '1.-2. trinn', divisorMaks: 5, kvotientMaks: 10 },
            niva2: { name: 'Nivå 2', description: '3.-5. trinn', divisorMaks: 10, kvotientMaks: 12 },
            niva3: { name: 'Nivå 3', description: '6.-8. trinn', divisorMaks: 12, kvotientMaks: 100 }
        }
    }
};

// ============================================
// STATE
// ============================================

let matteState = {
    currentOperation: null,
    currentLevel: null,
    problems: [],
    currentIndex: 0,
    currentAnswer: '',
    sessionCorrect: 0,
    dailyCorrect: 0,
    keydownHandler: null
};

// ============================================
// OPPGAVE GENERATOR
// ============================================

function tilfeldigTall(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tilfeldigDesimal(min, max, desimaler) {
    const tall = Math.random() * (max - min) + min;
    return parseFloat(tall.toFixed(desimaler));
}

function genererOppgave(operasjon, nivå) {
    const config = OPPGAVE_CONFIG[operasjon].nivåer[nivå];

    switch (operasjon) {
        case 'pluss': {
            const [min, max] = config.tallområde;
            if (config.medDesimal && Math.random() > 0.5) {
                const a = tilfeldigDesimal(min, max / 2, 1);
                const b = tilfeldigDesimal(min, max / 2, 1);
                return { spørsmål: `${a} + ${b}`, svar: parseFloat((a + b).toFixed(1)), forklaring: `${a} + ${b} = ${parseFloat((a + b).toFixed(1))}` };
            }
            const a = tilfeldigTall(min, Math.floor(max / 2));
            const b = tilfeldigTall(min, Math.floor(max / 2));
            return { spørsmål: `${a} + ${b}`, svar: a + b, forklaring: `${a} + ${b} = ${a + b}` };
        }
        case 'minus': {
            const [min, max] = config.tallområde;
            if (config.medDesimal && Math.random() > 0.5) {
                const a = tilfeldigDesimal(min + 5, max, 1);
                const b = tilfeldigDesimal(min, a, 1);
                return { spørsmål: `${a} − ${b}`, svar: parseFloat((a - b).toFixed(1)), forklaring: `${a} − ${b} = ${parseFloat((a - b).toFixed(1))}` };
            }
            const a = tilfeldigTall(min + 5, max);
            const b = tilfeldigTall(min, a);
            return { spørsmål: `${a} − ${b}`, svar: a - b, forklaring: `${a} − ${b} = ${a - b}` };
        }
        case 'gange': {
            const a = tilfeldigTall(1, config.gangetabellTil);
            const b = tilfeldigTall(1, config.faktorMaks);
            return { spørsmål: `${a} × ${b}`, svar: a * b, forklaring: `${a} × ${b} = ${a * b}` };
        }
        case 'dele': {
            const divisor = tilfeldigTall(2, config.divisorMaks);
            const quotient = tilfeldigTall(2, config.kvotientMaks);
            const dividend = divisor * quotient;
            return { spørsmål: `${dividend} ÷ ${divisor}`, svar: quotient, forklaring: `${dividend} ÷ ${divisor} = ${quotient}` };
        }
    }
}

function genererFlereOppgaver(operasjon, nivå, antall = 10) {
    const problems = [];
    for (let i = 0; i < antall; i++) {
        problems.push(genererOppgave(operasjon, nivå));
    }
    return problems;
}

// ============================================
// UI RENDERING (bruker DOM page-divs)
// ============================================

/**
 * Vis operasjonsvelger (pluss, minus, gange, dele)
 */
export function visMatteOperasjoner() {
    const container = document.getElementById('matte-operasjon-liste');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(OPPGAVE_CONFIG).forEach(([key, config]) => {
        const card = document.createElement('div');
        card.className = 'trinn-btn';
        card.style.cssText = 'padding: 20px; text-align: center; cursor: pointer;';
        card.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 8px;">${config.emoji}</div>
            <div style="font-weight: 700;">${config.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">3 nivåer</div>
        `;
        card.onclick = () => visMatteNivåer(key);
        container.appendChild(card);
    });

    visSide('matte-oving-start');
}

/**
 * Vis nivåvelger for valgt operasjon
 */
function visMatteNivåer(operasjon) {
    const container = document.getElementById('matte-nivaa-liste');
    if (!container) return;

    matteState.currentOperation = operasjon;
    const config = OPPGAVE_CONFIG[operasjon];

    // Oppdater header
    const header = document.getElementById('matte-nivaa-header');
    if (header) header.textContent = `${config.emoji} ${config.name} - Velg nivå`;

    container.innerHTML = '';

    Object.entries(config.nivåer).forEach(([key, nivå]) => {
        const btn = document.createElement('button');
        btn.className = 'trinn-btn';
        btn.style.cssText = 'width: 100%; text-align: left; padding: 15px 20px;';
        btn.innerHTML = `
            <strong>${nivå.name}</strong>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">${nivå.description}</div>
            ${nivå.tallområde ? `<div style="font-size: 12px; color: #999; margin-top: 2px;">Tallområde: ${nivå.tallområde[0]}-${nivå.tallområde[1]}</div>` : ''}
            ${nivå.gangetabellTil ? `<div style="font-size: 12px; color: #999; margin-top: 2px;">Gangetabell til: ${nivå.gangetabellTil}</div>` : ''}
        `;
        btn.onclick = () => startMatteOving(operasjon, key);
        container.appendChild(btn);
    });

    visSide('matte-nivaa-velger');
}

/**
 * Start matte-øving
 */
export function startMatteOving(operasjon, nivå) {
    matteState.currentOperation = operasjon;
    matteState.currentLevel = nivå;
    matteState.problems = genererFlereOppgaver(operasjon, nivå, 10);
    matteState.currentIndex = 0;
    matteState.currentAnswer = '';
    matteState.sessionCorrect = 0;

    // Reset dagsteller om det er ny dag
    const today = new Date().toDateString();
    if (localStorage.getItem('mester_matte_daily_date') !== today) {
        matteState.dailyCorrect = 0;
        localStorage.setItem('mester_matte_daily_date', today);
        localStorage.setItem('mester_matte_daily_correct', '0');
    } else {
        matteState.dailyCorrect = parseInt(localStorage.getItem('mester_matte_daily_correct') || '0', 10);
    }

    window.gjeldendeNiva = nivå; // For kort-belønning

    visSide('matte-oving-omraade');
    setupMatteKeyboard();
    visMatteSpørsmål();
}

/**
 * Setup tastatur-hendelser
 */
function setupMatteKeyboard() {
    // Fjern gammel handler
    if (matteState.keydownHandler) {
        document.removeEventListener('keydown', matteState.keydownHandler);
    }

    matteState.keydownHandler = (e) => {
        if (document.getElementById('matte-oving-omraade')?.classList.contains('active')) {
            if (e.key >= '0' && e.key <= '9') handleMatteInput(e.key);
            else if (e.key === '.') handleMatteInput('.');
            else if (e.key === 'Backspace') handleMatteInput('backspace');
            else if (e.key === 'Enter') handleMatteInput('check');
            else if (e.key === 'Escape') handleMatteInput('clear');
        }
    };

    document.addEventListener('keydown', matteState.keydownHandler);
}

/**
 * Vis neste spørsmål
 */
function visMatteSpørsmål() {
    if (matteState.currentIndex >= matteState.problems.length) {
        visMatteResultat();
        return;
    }

    const problem = matteState.problems[matteState.currentIndex];
    matteState.currentAnswer = '';

    // Oppdater UI
    const spmEl = document.getElementById('matte-spm');
    if (spmEl) spmEl.textContent = `${problem.spørsmål} = ?`;

    const answerEl = document.getElementById('matte-answer-text');
    if (answerEl) answerEl.textContent = '0';

    const feedbackEl = document.getElementById('matte-feedback');
    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'feedback'; }

    // Progress
    const progressEl = document.getElementById('matte-progress');
    if (progressEl) progressEl.textContent = `${matteState.currentIndex} / ${matteState.problems.length}`;

    const fillEl = document.getElementById('matte-progress-fill');
    if (fillEl) fillEl.style.width = `${(matteState.currentIndex / matteState.problems.length) * 100}%`;

    const scoreEl = document.getElementById('matte-score');
    if (scoreEl) scoreEl.textContent = `${matteState.dailyCorrect} riktige i dag`;

    // Kort progress (10-box)
    oppdaterMatteKortProgress();
    oppdaterMatteXPProgress();
}

/**
 * Håndter tastatur/knapp input
 */
function handleMatteInput(value) {
    if (value === 'check') {
        sjekkMatteSvar();
    } else if (value === 'clear') {
        matteState.currentAnswer = '';
        oppdaterMatteAnswerDisplay();
    } else if (value === 'backspace') {
        matteState.currentAnswer = matteState.currentAnswer.slice(0, -1);
        oppdaterMatteAnswerDisplay();
    } else if (value === '.') {
        if (!matteState.currentAnswer.includes('.')) {
            matteState.currentAnswer += value;
            oppdaterMatteAnswerDisplay();
        }
    } else if (value === '-') {
        if (matteState.currentAnswer.length === 0) {
            matteState.currentAnswer = '-';
            oppdaterMatteAnswerDisplay();
        }
    } else {
        matteState.currentAnswer += value;
        oppdaterMatteAnswerDisplay();
    }
}

function oppdaterMatteAnswerDisplay() {
    const el = document.getElementById('matte-answer-text');
    if (el) el.textContent = matteState.currentAnswer || '0';
}

/**
 * Sjekk matte-svar
 */
async function sjekkMatteSvar() {
    if (!matteState.currentAnswer) return;

    // Rate limiting
    const rateCheck = practiceLimiter.check('practice_answer');
    if (!rateCheck.allowed) {
        const minutter = Math.ceil(rateCheck.remainingMs / 60000);
        visToast(`⏰ Vent ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} før du fortsetter.`, 'warning');
        return;
    }

    const problem = matteState.problems[matteState.currentIndex];
    const userAnswer = parseFloat(matteState.currentAnswer);
    const correctAnswer = problem.svar;

    const tolerance = Number.isInteger(correctAnswer) ? 0 : 0.01;
    const erRiktig = Math.abs(userAnswer - correctAnswer) <= tolerance;

    const feedbackEl = document.getElementById('matte-feedback');

    if (erRiktig) {
        matteState.sessionCorrect++;
        matteState.dailyCorrect++;
        localStorage.setItem('mester_matte_daily_correct', matteState.dailyCorrect);

        // Lagre XP
        saveTotalCorrect(getTotalCorrect() + 1);

        if (feedbackEl) {
            feedbackEl.innerHTML = `<div class="correct"><p class="feedback-main">Riktig! 🎉</p></div>`;
            feedbackEl.className = 'feedback correct';
        }

        spillLyd('riktig');
        oppdaterMatteKortProgress();
        oppdaterMatteXPProgress();

        // Diamant-bonus sjekk
        const newXP = getTotalCorrect();
        if (newXP > 0 && newXP % 100 === 0) {
            let credits = getCredits();
            credits += 10;
            saveCredits(credits);
            setTimeout(() => visToast('💎 BONUS! Du fikk 10 diamanter!', 'success'), 1000);
        }

        // Kort-belønning
        if (matteState.sessionCorrect > 0 && matteState.sessionCorrect % 10 === 0) {
            const cardCheck = cardLimiter.check('card_reward');
            if (cardCheck.allowed) {
                setTimeout(() => hentTilfeldigKort(), 600);
            }
        }

        setTimeout(() => {
            matteState.currentIndex++;
            matteState.currentAnswer = '';
            visMatteSpørsmål();
        }, 800);

    } else {
        if (feedbackEl) {
            feedbackEl.innerHTML = `<div class="incorrect"><p class="feedback-main">Feil. Riktig svar: ${correctAnswer}</p><p class="feedback-explain">${problem.forklaring}</p></div>`;
            feedbackEl.className = 'feedback incorrect';
        }

        spillLyd('feil');
        vibrer(200);

        setTimeout(() => {
            matteState.currentIndex++;
            matteState.currentAnswer = '';
            visMatteSpørsmål();
        }, 2500);
    }
}

/**
 * Oppdater 10-box kort progress
 */
function oppdaterMatteKortProgress() {
    const container = document.getElementById('matte-kort-progress');
    if (!container) return;

    const filled = matteState.sessionCorrect % 10;
    let html = '';
    for (let i = 0; i < 10; i++) {
        const isFilled = i < filled;
        html += `<div style="flex:1; height:12px; background:${isFilled ? 'var(--sunny-yellow, #FBBF24)' : 'rgba(0,0,0,0.1)'}; border-radius:6px; transition:all 0.3s;${isFilled ? 'box-shadow:0 0 8px var(--sunny-yellow, #FBBF24);' : ''}"></div>`;
    }

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; font-weight:600; color:#333;">
            <span>🎁 MOT NYTT KORT:</span>
            <span>${filled} / 10</span>
        </div>
        <div style="display:flex; gap:4px;">${html}</div>
    `;
}

/**
 * Oppdater XP progress bar
 */
function oppdaterMatteXPProgress() {
    const container = document.getElementById('matte-xp-progress');
    if (!container) return;

    const totalXP = getTotalCorrect();
    const progress = totalXP % 100;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px; font-weight:600; color:#333;">
            <span>💎 Mot neste bonus (100 xp)</span>
            <span>${progress} / 100</span>
        </div>
        <div class="yellow-track" style="width:100%; background:rgba(229,229,234,0.6); border-radius:10px; height:10px; overflow:hidden;">
            <div style="height:100%; background:linear-gradient(90deg, #FBBF24, #F59E0B); width:${progress}%; transition:width 0.4s;"></div>
        </div>
    `;
}

/**
 * Vis resultat
 */
function visMatteResultat() {
    const total = matteState.problems.length;
    const correct = matteState.sessionCorrect;
    const score = Math.round((correct / total) * 100);

    const container = document.getElementById('matte-resultat-innhold');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:64px; margin-bottom:15px;">🎉</div>
            <h2>Flott jobba!</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:25px 0;">
                <div style="background:#f0f9ff; padding:20px; border-radius:12px;">
                    <div style="font-size:32px; font-weight:700; color:#667eea;">${score}%</div>
                    <div style="font-size:13px; color:#666;">Score</div>
                </div>
                <div style="background:#f0fdf4; padding:20px; border-radius:12px;">
                    <div style="font-size:32px; font-weight:700; color:#16a34a;">${correct}/${total}</div>
                    <div style="font-size:13px; color:#666;">Riktige</div>
                </div>
            </div>
            ${score < 80 ? '<p style="color:#666; margin-bottom:20px;">Fortsett å øve - du blir bedre! 💪</p>' : ''}
        </div>
    `;

    visSide('matte-resultat');
}

/**
 * Avslutt matte-øving
 */
export function avsluttMatteOving() {
    if (matteState.keydownHandler) {
        document.removeEventListener('keydown', matteState.keydownHandler);
        matteState.keydownHandler = null;
    }
    matteState.currentIndex = 0;
    matteState.problems = [];
    matteState.currentAnswer = '';
    visMatteOperasjoner();
}

/**
 * Prøv igjen med samme operasjon/nivå
 */
export function matteProvIgjen() {
    startMatteOving(matteState.currentOperation, matteState.currentLevel);
}

// Eksponer til window
window.handleMatteInput = handleMatteInput;
window.sjekkMatteSvar = sjekkMatteSvar;
window.avsluttMatteOving = avsluttMatteOving;
window.matteProvIgjen = matteProvIgjen;

