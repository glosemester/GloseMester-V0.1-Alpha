/* ============================================
   NORSKMESTER.JS - Mester Suite v2.0
   NorskMester implementation av FagModul
   Diktat, ordklasser, synonymer og rettskriving
   ============================================ */

import { FagModul } from '../base-modul.js';
import { norskVokabular, NIVA_KONFIG } from './norsk-data.js';
import { kortSystem } from '../../core/kort/kort-system.js';
import { visToast, vibrer, lesOpp } from '../../core/utils/feedback.js';
import { getTotalCorrect, saveTotalCorrect } from '../../core/utils/storage.js';
import { practiceLimiter } from '../../core/utils/rate-limiter.js';

/**
 * NorskMester — norsk rettskriving, ordklasser og synonymer
 */
export class NorskMester extends FagModul {
    constructor() {
        super('norsk');
        this.currentNiva = null;
        this.queue = [];
        this.currentIndex = 0;
        this.sessionCorrect = 0;
        this.dailyCorrect = this._lastDailyCorrect();
    }

    // ==================== PÅKREVDE METODER ====================

    async init() {
        this.renderPracticeUI();
        this.initialized = true;
        return true;
    }

    getPracticeData() {
        return { niva: this.currentNiva, antallOrd: this.queue.length };
    }

    startPractice(niva) {
        this.currentNiva = niva;
        const konfig = NIVA_KONFIG[niva];
        const data = norskVokabular[niva];

        if (!data || !konfig) {
            visToast('Ugyldig nivå valgt', 'error');
            return;
        }

        this.queue = this._byggKø(data, konfig.type);
        this.currentIndex = 0;
        this.sessionCorrect = 0;
        this._visOppgave();
    }

    renderPracticeUI() {
        const container = document.getElementById('app');
        if (!container) return;

        const niver = Object.entries(NIVA_KONFIG);

        container.innerHTML = `
            <div style="min-height:100vh; padding:20px; max-width:720px; margin:0 auto;">

                <!-- Tilbake-knapp -->
                <button onclick="window.router?.back()" style="margin-bottom:24px; background:none; border:none; color:#7C3AED; font-size:15px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    ← Tilbake
                </button>

                <!-- Header -->
                <div style="text-align:center; margin-bottom:36px;">
                    <div style="font-size:64px; margin-bottom:12px;">📖</div>
                    <h1 style="font-family:'Outfit',system-ui; font-size:32px; font-weight:800; color:#1F2937; margin-bottom:8px;">NorskMester</h1>
                    <p style="color:#6B7280; font-size:16px;">Mestre norsk rettskriving, ordklasser og synonymer</p>
                </div>

                <!-- Nivåvalg -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px;">
                    ${niver.map(([key, konfig]) => `
                        <button
                            onclick="window.norskmester.startPractice('${key}')"
                            style="
                                text-align:left; padding:24px 20px;
                                background:white; border:2px solid #e5e7eb;
                                border-radius:20px; cursor:pointer;
                                transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04);
                                display:flex; flex-direction:column; gap:6px;
                            "
                            onmouseenter="this.style.borderColor='#7C3AED'; this.style.transform='translateY(-2px)'"
                            onmouseleave="this.style.borderColor='#e5e7eb'; this.style.transform='none'"
                        >
                            <div style="font-size:28px;">${konfig.emoji}</div>
                            <div style="font-weight:700; font-size:17px; color:#1F2937;">${konfig.navn}</div>
                            <div style="font-size:13px; color:#6B7280;">${konfig.beskrivelse}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        window.norskmester = this;
    }

    checkAnswer(svar) {
        const oppgave = this.queue[this.currentIndex];
        if (!oppgave) return false;

        const normaliser = s => String(s).trim().toLowerCase();
        return normaliser(svar) === normaliser(oppgave.riktigSvar);
    }

    // ==================== INTERN LOGIKK ====================

    _byggKø(data, type) {
        const stokket = this._stokk([...data]);

        return stokket.map(item => {
            if (type === 'diktat') {
                // Ord er en ren streng — les opp, eleven skriver
                const ord = typeof item === 'string' ? item : item.s;
                return { type: 'diktat', vis: ord, riktigSvar: ord };
            }
            if (type === 'flervalg') {
                // Ordklasse / synonym / rettskriving
                const sporsmal = item.ord ?? item.feil;
                const riktig   = item.ordklasse ?? item.synonym ?? item.riktig;
                const alts     = this._stokk([...item.alternativer]);
                return { type: 'flervalg', vis: sporsmal, riktigSvar: riktig, alternativer: alts };
            }
            return null;
        }).filter(Boolean);
    }

    _visOppgave() {
        const container = document.getElementById('app');
        if (!container) return;

        const totalt = this.queue.length;
        if (this.currentIndex >= totalt) {
            this._visResultat(container);
            return;
        }

        const oppgave = this.queue[this.currentIndex];
        const prosent = Math.round((this.currentIndex / totalt) * 100);
        const konfig  = NIVA_KONFIG[this.currentNiva];

        container.innerHTML = `
            <div style="min-height:100vh; padding:20px; max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">

                <!-- Topp -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0;">
                    <span style="font-size:13px; color:#6B7280; font-weight:600;">${this.currentIndex + 1} av ${totalt}</span>
                    <span style="font-size:13px; color:#9CA3AF;">${konfig.navn}</span>
                </div>

                <!-- Progress -->
                <div style="height:6px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
                    <div style="height:100%; width:${prosent}%; background:linear-gradient(90deg,#f472b6,#fb923c); border-radius:999px; transition:width 0.4s;"></div>
                </div>

                <!-- Spørsmål -->
                <div style="background:white; border-radius:24px; padding:36px 28px; text-align:center; box-shadow:0 8px 32px rgba(244,114,182,0.08);">
                    ${oppgave.type === 'diktat' ? `
                        <p style="font-size:13px; color:#9CA3AF; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Diktat — skriv ordet du hører</p>
                        <button onclick="window.norskmester._lesOppOrd('${oppgave.vis}')" style="font-size:48px; background:none; border:none; cursor:pointer; margin-bottom:8px;" title="Hør ordet">🔊</button>
                        <p style="font-size:14px; color:#9CA3AF;">Trykk på høyttaleren for å høre ordet</p>
                    ` : `
                        <p style="font-size:13px; color:#9CA3AF; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">
                            ${this.currentNiva === 'niva3' ? 'Hvilken ordklasse er dette?' : this.currentNiva === 'niva4' ? 'Finn synonymet' : 'Velg riktig stavemåte'}
                        </p>
                        <div style="font-size:32px; font-weight:800; color:#1F2937; font-family:'Outfit',system-ui;">${oppgave.vis}</div>
                    `}
                </div>

                <!-- Svar -->
                ${oppgave.type === 'diktat' ? `
                    <form id="norsk-form" style="display:flex; gap:10px;">
                        <input id="norsk-input" type="text" autocomplete="off" spellcheck="false"
                            placeholder="Skriv ordet…"
                            style="flex:1; padding:16px; border:2px solid #e5e7eb; border-radius:14px; font-size:18px; font-weight:600; text-align:center; outline:none;"
                            autocapitalize="none"
                        />
                        <button type="submit" style="padding:16px 24px; background:#f472b6; color:white; border:none; border-radius:14px; font-size:18px; font-weight:700; cursor:pointer;">✓</button>
                    </form>
                ` : `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        ${oppgave.alternativer.map(alt => `
                            <button class="norsk-alt-btn" data-svar="${alt}" style="
                                padding:18px 12px; border:2px solid #e5e7eb; border-radius:16px;
                                background:white; font-size:17px; font-weight:600; cursor:pointer;
                                transition:all 0.2s; color:#1F2937;
                            ">${alt}</button>
                        `).join('')}
                    </div>
                `}

                <p id="norsk-feedback" style="text-align:center; font-weight:700; font-size:18px; min-height:28px;"></p>
            </div>
        `;

        // Event handlers
        if (oppgave.type === 'diktat') {
            container.querySelector('#norsk-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const val = container.querySelector('#norsk-input')?.value;
                if (val) this._sjekkSvar(val, container);
            });
            // Auto-les ord
            setTimeout(() => this._lesOppOrd(oppgave.vis), 400);
        } else {
            container.querySelectorAll('.norsk-alt-btn').forEach(btn => {
                btn.addEventListener('click', () => this._sjekkSvar(btn.dataset.svar, container));
            });
        }

        window.norskmester = this;
    }

    _sjekkSvar(svar, container) {
        const rateCheck = practiceLimiter.check('norsk_practice');
        if (!rateCheck.allowed) {
            const min = Math.ceil(rateCheck.remainingMs / 60000);
            visToast(`⏰ Vent ${min} minutt(er) før du fortsetter.`, 'warning');
            return;
        }

        const erRiktig = this.checkAnswer(svar);
        const oppgave  = this.queue[this.currentIndex];

        // Deaktiver input
        container.querySelectorAll('.norsk-alt-btn, #norsk-input, button[type=submit]').forEach(el => el.disabled = true);

        // Farge alternativer
        container.querySelectorAll('.norsk-alt-btn').forEach(btn => {
            if (btn.dataset.svar === oppgave.riktigSvar) {
                btn.style.background = '#D1FAE5'; btn.style.borderColor = '#10B981'; btn.style.color = '#065F46';
            } else if (btn.dataset.svar === svar && !erRiktig) {
                btn.style.background = '#FEE2E2'; btn.style.borderColor = '#EF4444'; btn.style.color = '#991B1B';
            }
        });

        const fb = container.querySelector('#norsk-feedback');
        if (fb) {
            fb.textContent = erRiktig ? '✅ Riktig!' : `❌ Fasit: ${oppgave.riktigSvar}`;
            fb.style.color = erRiktig ? '#10B981' : '#EF4444';
        }

        if (erRiktig) {
            this.sessionCorrect++;
            this.dailyCorrect++;
            this._lagreDailyCorrect();
            saveTotalCorrect(getTotalCorrect() + 1);
            vibrer(50);
        } else {
            vibrer(200);
        }

        setTimeout(() => {
            this.currentIndex++;
            this._visOppgave();
        }, erRiktig ? 900 : 1600);
    }

    _visResultat(container) {
        const totalt  = this.queue.length;
        const prosent = totalt > 0 ? Math.round((this.sessionCorrect / totalt) * 100) : 0;
        const emoji   = prosent >= 90 ? '🏆' : prosent >= 70 ? '🌟' : prosent >= 50 ? '👍' : '💪';
        const farge   = prosent >= 70 ? '#10B981' : prosent >= 50 ? '#F59E0B' : '#EF4444';

        // Kortbelønning
        if (prosent >= 60 && typeof kortSystem !== 'undefined') {
            try { kortSystem.giveCard('norsk', this.currentNiva); } catch (e) { /* ignorer */ }
        }

        container.innerHTML = `
            <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; text-align:center; padding:40px 20px;">
                <div style="font-size:80px;">${emoji}</div>
                <h1 style="font-family:'Outfit',system-ui; font-size:32px; font-weight:800; color:#1F2937;">Økten er ferdig!</h1>
                <div style="background:white; border-radius:24px; padding:32px 48px; box-shadow:0 8px 32px rgba(0,0,0,0.08);">
                    <div style="font-size:64px; font-weight:900; color:${farge}; font-family:'Outfit',system-ui; line-height:1;">${prosent}%</div>
                    <div style="color:#6B7280; font-size:16px; margin-top:8px;">${this.sessionCorrect} av ${totalt} riktige</div>
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                    <button onclick="window.norskmester.startPractice('${this.currentNiva}')" style="padding:14px 28px; background:#f472b6; color:white; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer;">
                        🔄 Prøv igjen
                    </button>
                    <button onclick="window.norskmester.renderPracticeUI()" style="padding:14px 28px; background:white; border:2px solid #e5e7eb; color:#374151; border-radius:14px; font-size:16px; font-weight:600; cursor:pointer;">
                        📖 Velg nivå
                    </button>
                </div>
            </div>
        `;
    }

    _lesOppOrd(ord) {
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(ord);
            u.lang = 'nb-NO';
            u.rate = 0.85;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        }
    }

    _stokk(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    _lastDailyCorrect() {
        const today = new Date().toDateString();
        if (localStorage.getItem('mester_norsk_daily_date') !== today) return 0;
        return parseInt(localStorage.getItem('mester_norsk_daily_correct') || '0', 10);
    }

    _lagreDailyCorrect() {
        const today = new Date().toDateString();
        localStorage.setItem('mester_norsk_daily_date', today);
        localStorage.setItem('mester_norsk_daily_correct', this.dailyCorrect);
    }
}

// Singleton-eksport
export const norskmester = new NorskMester();
