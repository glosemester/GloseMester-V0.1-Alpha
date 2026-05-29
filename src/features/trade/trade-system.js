/* ============================================
   TRADE-SYSTEM.JS — GloseMester
   Kort-bytte mellom elever via 6-tegns kode
   ============================================ */

import {
    db, collection, addDoc, doc, getDoc, getDocs,
    query, where, updateDoc, serverTimestamp
} from '../../core/auth/firebase-config.js';
import { kortData, RARITY_CONFIG } from '../../core/kort/kort-data.js';
import { KortReward } from '../../core/kort/kort-reward.js';
import { visToast } from '../../core/utils/feedback.js';

const TRADE_EXPIRY_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;
const PENDING_KEY = 'gm_pending_trade';

const RARITY_LABELS = { common: 'Vanlig', rare: 'Sjelden', epic: 'Episk', legendary: 'Legendarisk' };

class TradeSystem {
    constructor() {
        this._pollTimer = null;
    }

    init() {
        this._injectStyles();
        this._resumePendingTrade();
        const byttMatch = window.location.hash.match(/#bytt=([A-Z0-9]{4,8})/i);
        if (byttMatch) {
            window.history.replaceState({}, '', window.location.pathname + '#/gloser');
            setTimeout(() => this.openTradeResponder(byttMatch[1].toUpperCase()), 800);
        }
    }

    _injectStyles() {
        if (document.getElementById('trade-styles')) return;
        const link = document.createElement('link');
        link.id = 'trade-styles';
        link.rel = 'stylesheet';
        link.href = '/src/features/trade/trade-styles.css';
        document.head.appendChild(link);
    }

    _getDeviceId() {
        let id = localStorage.getItem('gm_device_id');
        if (!id) { id = crypto.randomUUID(); localStorage.setItem('gm_device_id', id); }
        return id;
    }

    // ── Trade hub ─────────────────────────────────────────────

    openTradeHub() {
        document.getElementById('trade-modal')?.remove();

        const tokens = parseInt(localStorage.getItem('gm_trade_tokens') || '0', 10);
        const earned = parseInt(localStorage.getItem('gm_trade_tokens_earned') || '0', 10);
        const intervals = [35, 40, 45];
        let prevThreshold = 0;
        for (let i = 0; i < earned; i++) prevThreshold += i < intervals.length ? intervals[i] : 50;
        const nextInterval = earned < intervals.length ? intervals[earned] : 50;
        const user = window.brukerNavn || localStorage.getItem('aktiv_bruker') || 'Spiller';
        const totalXP = parseInt(localStorage.getItem(`mester_xp_gloser_${user}`) || '0', 10);
        const xpSinceLast = Math.max(0, totalXP - prevThreshold);
        const pct = Math.min(100, Math.round((xpSinceLast / nextInterval) * 100));
        const mangler = Math.max(0, nextInterval - xpSinceLast);

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Kortbytte</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div style="background:#f9f5ff;border-radius:16px;padding:14px 16px;margin-bottom:20px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:13px;font-weight:700;color:#FF6B47;">Trade-tokens</span>
                        <span style="font-size:18px;font-weight:900;color:${tokens > 0 ? '#15803d' : '#FF6B47'};">
                            ${tokens > 0 ? `${tokens} klar` : `${xpSinceLast} / ${nextInterval}`}
                        </span>
                    </div>
                    <div style="background:#e9d5ff;border-radius:99px;height:8px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#FF6B47,#FFB347);height:100%;width:${pct}%;transition:width 0.4s;"></div>
                    </div>
                    <p style="margin:7px 0 0;font-size:12px;color:#888;text-align:center;">
                        ${tokens > 0
                            ? `Du har ${tokens} trade${tokens !== 1 ? 's' : ''} — bruk dem til å opprette byttehandler`
                            : `${mangler} riktige svar til neste trade-token`}
                    </p>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <button id="hub-create-btn" class="trade-btn-primary" style="display:flex;align-items:center;gap:12px;padding:16px 20px;text-align:left;" ${tokens <= 0 ? 'disabled' : ''}>
                        <span style="font-size:28px;flex-shrink:0;">📤</span>
                        <div>
                            <div style="font-size:15px;">Opprett byttehandel</div>
                            <div style="font-size:12px;opacity:0.8;font-weight:400;margin-top:2px;">
                                ${tokens > 0 ? `Bruker 1 av ${tokens} trade-token` : 'Trenger en trade-token'}
                            </div>
                        </div>
                    </button>
                    <button id="hub-respond-btn" class="trade-btn-secondary" style="display:flex;align-items:center;gap:12px;padding:16px 20px;text-align:left;">
                        <span style="font-size:28px;flex-shrink:0;">📥</span>
                        <div>
                            <div style="font-size:15px;color:#1d1d1f;font-weight:700;">Skriv inn byttkode</div>
                            <div style="font-size:12px;color:#888;font-weight:400;margin-top:2px;">Du har fått en kode fra en venn</div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('hub-create-btn').addEventListener('click', () => {
            if (tokens <= 0) return;
            modal.remove();
            this._velgEgetKort();
        });
        document.getElementById('hub-respond-btn').addEventListener('click', () => {
            modal.remove();
            this._visTradeOnboarding(() => this._visResponderModal(''));
        });
    }

    // ── Elev A: velg kort å gi bort ───────────────────────────

    _velgEgetKort() {
        document.getElementById('trade-modal')?.remove();

        const samling = KortReward.getUserCollection();
        if (samling.length === 0) {
            visToast('Du har ingen kort å bytte bort ennå', 'warning');
            return;
        }

        const grouped = {};
        samling.forEach(k => {
            if (!grouped[k.id]) grouped[k.id] = { ...k, count: 0 };
            grouped[k.id].count++;
        });
        const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Velg kort å tilby</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <p class="trade-picker-hint">Hvilket kort vil du gi bort?</p>
                <div class="trade-picker-grid">
                    ${sorted.map(k => {
                        const config = RARITY_CONFIG[k.rarity] || { farge: '#888', emoji: '📦' };
                        const locked = !!localStorage.getItem(`gm_trade_lock_${k.id}`);
                        return `
                            <div class="trade-pick-card ${locked ? 'trade-pick-disabled' : ''}" data-kort-id="${k.id}">
                                <div class="trade-pick-img-wrap">
                                    <img src="${k.image}" alt="${k.name}" loading="lazy">
                                    <span class="trade-pick-rarity" style="background:${config.farge}">${config.emoji}</span>
                                    ${k.count > 1 ? `<div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.7);color:white;font-size:10px;font-weight:700;padding:2px 5px;border-radius:6px;">×${k.count}</div>` : ''}
                                    ${locked ? '<div class="trade-pick-self-label">I handel</div>' : ''}
                                </div>
                                <p class="trade-pick-name">${k.name}</p>
                            </div>`;
                    }).join('')}
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());

        modal.querySelectorAll('.trade-pick-card:not(.trade-pick-disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const kortId = card.dataset.kortId;
                const offered = samling.find(k => k.id === kortId);
                if (!offered) return;
                modal.remove();
                this._showCreateConfirm(offered);
            });
        });
    }

    _showCreateConfirm(offered) {
        document.getElementById('trade-modal')?.remove();
        const config = RARITY_CONFIG[offered.rarity] || { farge: '#888', emoji: '📦' };

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Bekreft tilbud</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div style="text-align:center;padding:12px 0 20px;">
                    <img src="${offered.image}" alt="${offered.name}"
                        style="width:120px;height:180px;object-fit:cover;border-radius:14px;
                               box-shadow:0 8px 24px rgba(255,107,71,0.2);">
                    <p style="margin:12px 0 4px;font-size:18px;font-weight:800;color:#1d1d1f;">${offered.name}</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:${config.farge};">${config.emoji} ${RARITY_LABELS[offered.rarity] || offered.rarity}</p>
                </div>
                <p style="text-align:center;color:#666;font-size:13px;margin:0 0 20px;line-height:1.5;">
                    Du tilbyr dette kortet. Vennen din velger selv<br>hva de gir i retur. Koden utløper etter 15 min.
                </p>
                <div style="display:flex;gap:12px;">
                    <button id="trade-back-btn" class="trade-btn-secondary" style="flex:1">← Tilbake</button>
                    <button id="trade-confirm-btn" class="trade-btn-primary" style="flex:2">Lag byttkode</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('trade-back-btn').addEventListener('click', () => {
            modal.remove();
            this._velgEgetKort();
        });
        document.getElementById('trade-confirm-btn').addEventListener('click', async () => {
            const btn = document.getElementById('trade-confirm-btn');
            btn.disabled = true;
            btn.textContent = 'Oppretter…';
            try {
                const { tradeId, code } = await this.createTrade(offered);
                modal.remove();
                this._showTradeCode(tradeId, code, offered);
            } catch (err) {
                console.error('Trade create error:', err);
                visToast('Kunne ikke opprette byttehandel — sjekk nettilkobling', 'error');
                btn.disabled = false;
                btn.textContent = 'Lag byttkode';
            }
        });
    }

    async createTrade(offeredKortData) {
        const deviceId = this._getDeviceId();
        const code = this._generateCode();

        const currentTokens = parseInt(localStorage.getItem('gm_trade_tokens') || '0', 10);
        localStorage.setItem('gm_trade_tokens', Math.max(0, currentTokens - 1));
        localStorage.setItem(`gm_trade_lock_${offeredKortData.id}`, '1');

        const tradeRef = await addDoc(collection(db, 'trades'), {
            code,
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: Date.now() + TRADE_EXPIRY_MS,
            initiatorDevice: deviceId,
            responderDevice: null,
            offeredKortId: offeredKortData.id,
            offeredKortData: this._kortSnapshot(offeredKortData),
            requestedKortId: null,
            requestedKortData: null,
            cancelReason: null
        });

        const tradeId = tradeRef.id;
        localStorage.setItem(PENDING_KEY, JSON.stringify({ tradeId, code, offeredKortData }));
        return { tradeId, code };
    }

    _kortSnapshot(k) {
        return { id: k.id, name: k.name, image: k.image, rarity: k.rarity, category: k.category, fag: k.fag || 'gloser' };
    }

    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    _showTradeCode(tradeId, code, offeredKortData) {
        document.getElementById('trade-modal')?.remove();
        const config = RARITY_CONFIG[offeredKortData.rarity] || { farge: '#888', emoji: '📦' };

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Del byttkoden</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-code-display">
                    <div class="trade-code-value">${code}</div>
                    <button class="trade-copy-btn" id="trade-copy-btn">Kopier kode</button>
                </div>
                <p class="trade-code-hint">Del koden med vennen din. Utløper om <span id="trade-countdown">15:00</span>.</p>
                <div style="background:#f9f5ff;border-radius:14px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
                    <img src="${offeredKortData.image}" alt="${offeredKortData.name}"
                        style="width:48px;height:72px;object-fit:cover;border-radius:8px;flex-shrink:0;">
                    <div>
                        <p style="margin:0 0 2px;font-size:13px;color:#888;font-weight:600;">Du tilbyr:</p>
                        <p style="margin:0 0 2px;font-size:15px;font-weight:800;color:#1d1d1f;">${offeredKortData.name}</p>
                        <p style="margin:0;font-size:12px;color:${config.farge};font-weight:600;">${config.emoji} ${RARITY_LABELS[offeredKortData.rarity] || offeredKortData.rarity}</p>
                    </div>
                </div>
                <p style="text-align:center;font-size:12px;color:#888;margin:0 0 14px;">Vennen din velger selv hva de gir i retur</p>
                <div id="trade-status-msg" class="trade-status-waiting">Venter på at vennen din godtar…</div>
                <button id="trade-cancel-btn" class="trade-btn-secondary" style="width:100%;margin-top:12px;">Avbryt handel</button>
            </div>
        `;

        document.body.appendChild(modal);

        const closeAndCancel = () => {
            this.stopPolling();
            this.cancelTrade(tradeId, offeredKortData.id);
            modal.remove();
        };
        document.getElementById('trade-close').addEventListener('click', closeAndCancel);
        document.getElementById('trade-cancel-btn').addEventListener('click', closeAndCancel);
        document.getElementById('trade-copy-btn').addEventListener('click', () => {
            navigator.clipboard?.writeText(code)
                .then(() => visToast(`Kode ${code} kopiert!`, 'success'))
                .catch(() => visToast(`Byttkode: ${code}`, 'info'));
        });

        const expiresAt = Date.now() + TRADE_EXPIRY_MS;
        const countdownEl = document.getElementById('trade-countdown');
        const countdownTimer = setInterval(() => {
            const remaining = expiresAt - Date.now();
            if (!countdownEl || remaining <= 0) { clearInterval(countdownTimer); return; }
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            countdownEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }, 1000);

        this.startPolling(tradeId, (status, tradeDoc) => {
            if (status === 'accepted') {
                clearInterval(countdownTimer);
                this._completeTradeAsInitiator(tradeId, tradeDoc, modal);
            } else if (status === 'cancelled' || status === 'expired') {
                clearInterval(countdownTimer);
                const msg = document.getElementById('trade-status-msg');
                if (msg) {
                    msg.className = 'trade-status-cancelled';
                    msg.textContent = status === 'expired' ? 'Handel utløpt' : 'Handel avbrutt';
                }
                localStorage.removeItem(`gm_trade_lock_${offeredKortData.id}`);
                localStorage.removeItem(PENDING_KEY);
            }
        });
    }

    async _completeTradeAsInitiator(tradeId, tradeDoc, modal) {
        const statusMsg = document.getElementById('trade-status-msg');
        if (statusMsg) {
            statusMsg.className = 'trade-status-accepted';
            statusMsg.textContent = 'Vennen din godtok! Bytter kort…';
        }

        if (!KortReward.hasKort(tradeDoc.offeredKortId)) {
            await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled', cancelReason: 'initiator_no_longer_has' });
            visToast('Du eier ikke lenger kortet du tilbød — handel avbrutt', 'error');
            if (modal) modal.remove();
            localStorage.removeItem(`gm_trade_lock_${tradeDoc.offeredKortId}`);
            localStorage.removeItem(PENDING_KEY);
            return;
        }

        const fikKort = tradeDoc.requestedKortData;
        const giKort = tradeDoc.offeredKortData;

        KortReward.removeKort(tradeDoc.offeredKortId, 1);
        KortReward.awardKort(fikKort);
        await updateDoc(doc(db, 'trades', tradeId), { status: 'completed' });

        this.stopPolling();
        localStorage.removeItem(`gm_trade_lock_${tradeDoc.offeredKortId}`);
        localStorage.removeItem(PENDING_KEY);

        if (modal) modal.remove();
        this._visTradeAnimasjon(giKort, fikKort);
    }

    startPolling(tradeId, cb) {
        this.stopPolling();
        const poll = async () => {
            if (document.hidden) return;
            try {
                const snap = await getDoc(doc(db, 'trades', tradeId));
                if (!snap.exists()) return;
                const data = snap.data();
                if (data.status === 'pending' && data.expiresAt < Date.now()) {
                    await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled', cancelReason: 'expired' });
                    cb('expired', data);
                    this.stopPolling();
                    return;
                }
                cb(data.status, data);
                if (['accepted', 'completed', 'cancelled'].includes(data.status)) this.stopPolling();
            } catch (err) {
                console.warn('[Trade] Poll error:', err);
            }
        };
        this._pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    }

    stopPolling() {
        if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    }

    async cancelTrade(tradeId, offeredKortId) {
        try {
            await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled', cancelReason: 'cancelled' });
        } catch (e) {
            console.warn('[Trade] Cancel failed:', e);
        }
        if (offeredKortId) localStorage.removeItem(`gm_trade_lock_${offeredKortId}`);
        localStorage.removeItem(PENDING_KEY);
    }

    _resumePendingTrade() {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return;
        try {
            const { tradeId, code, offeredKortData } = JSON.parse(raw);
            if (!tradeId || !code) return;
            setTimeout(() => this._showTradeCode(tradeId, code, offeredKortData), 1200);
        } catch {
            localStorage.removeItem(PENDING_KEY);
        }
    }

    // ── Trade onboarding ───────────────────────────────────────

    _visTradeOnboarding(callback) {
        if (localStorage.getItem('gm_trade_onboarding_done')) { callback(); return; }

        const steger = [
            {
                ikon: '🃏',
                tittel: 'Bytt kort med venner!',
                tekst: 'Har du dubletter? Bytt med en venn og få et kort du mangler i samlingen din!',
                illustrasjon: `
                    <div class="trade-ob-swap">
                        <div class="trade-ob-card-mini">🦕<span>Ditt kort</span></div>
                        <div class="trade-ob-arrows">⇌</div>
                        <div class="trade-ob-card-mini">🚗<span>Vennens kort</span></div>
                    </div>`
            },
            {
                ikon: '📤',
                tittel: 'Slik sender du et tilbud',
                tekst: 'Velg kortet du vil gi bort og få en 6-tegns kode. Del koden med vennen din — de velger hva de gir i retur!',
                illustrasjon: `
                    <div class="trade-ob-flow">
                        <div class="trade-ob-step-item">
                            <span class="trade-ob-step-num">1</span>
                            <span>Velg kort å gi</span>
                        </div>
                        <span class="trade-ob-flow-arrow">→</span>
                        <div class="trade-ob-step-item trade-ob-step-highlight">
                            <span class="trade-ob-code-preview">X4KQ2R</span>
                            <span>Del koden</span>
                        </div>
                        <span class="trade-ob-flow-arrow">→</span>
                        <div class="trade-ob-step-item">
                            <span class="trade-ob-step-num">2</span>
                            <span>Venn velger og godtar</span>
                        </div>
                    </div>`
            },
            {
                ikon: '📥',
                tittel: 'Slik godtar du et tilbud',
                tekst: 'Har du fått en kode? Skriv den inn, se hva du kan få, velg hva du gir i retur og godta!',
                illustrasjon: `
                    <div class="trade-ob-flow">
                        <div class="trade-ob-step-item">
                            <span class="trade-ob-step-num">1</span>
                            <span>Skriv inn kode</span>
                        </div>
                        <span class="trade-ob-flow-arrow">→</span>
                        <div class="trade-ob-step-item">
                            <span class="trade-ob-step-num">2</span>
                            <span>Velg hva du gir</span>
                        </div>
                        <span class="trade-ob-flow-arrow">→</span>
                        <div class="trade-ob-step-item trade-ob-step-highlight">
                            <span class="trade-ob-step-num" style="background:#22c55e">✓</span>
                            <span>Godta!</span>
                        </div>
                    </div>`
            }
        ];

        let aktivtSteg = 0;
        const modal = document.createElement('div');
        modal.id = 'trade-ob-modal';
        modal.className = 'trade-overlay';

        const oppdater = () => {
            const s = steger[aktivtSteg];
            const erSiste = aktivtSteg === steger.length - 1;
            modal.innerHTML = `
                <div class="trade-modal trade-ob-modal" onclick="event.stopPropagation()">
                    <button class="trade-ob-skip" id="trade-ob-skip">Hopp over</button>
                    <div class="trade-ob-ikon">${s.ikon}</div>
                    <h2 class="trade-ob-tittel">${s.tittel}</h2>
                    <p class="trade-ob-tekst">${s.tekst}</p>
                    ${s.illustrasjon}
                    <div class="trade-ob-dots">
                        ${steger.map((_, i) => `<span class="trade-ob-dot ${i === aktivtSteg ? 'active' : ''}"></span>`).join('')}
                    </div>
                    <button id="trade-ob-neste" class="trade-btn-primary" style="width:100%">
                        ${erSiste ? 'Start byttet!' : 'Neste →'}
                    </button>
                </div>
            `;
            modal.querySelector('#trade-ob-skip').addEventListener('click', fullfør);
            modal.querySelector('#trade-ob-neste').addEventListener('click', () => {
                if (erSiste) fullfør();
                else { aktivtSteg++; oppdater(); }
            });
        };

        const fullfør = () => {
            localStorage.setItem('gm_trade_onboarding_done', '1');
            modal.remove();
            callback();
        };

        oppdater();
        document.body.appendChild(modal);
    }

    // ── Elev B: Godta trade ────────────────────────────────────

    openTradeResponder(code = '') {
        this._visTradeOnboarding(() => this._visResponderModal(code));
    }

    _visResponderModal(code = '') {
        document.getElementById('trade-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Skriv inn byttkode</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <input id="trade-code-input" class="trade-code-input"
                    type="text" placeholder="F.eks. X4KQ2R"
                    maxlength="6" value="${code}"
                    autocomplete="off" autocapitalize="characters">
                <div id="trade-lookup-error" style="color:#ef4444;font-size:13px;text-align:center;min-height:20px;margin-bottom:8px;"></div>
                <div style="display:flex;gap:12px;">
                    <button id="trade-close-btn2" class="trade-btn-secondary" style="flex:1">Avbryt</button>
                    <button id="trade-lookup-btn" class="trade-btn-primary" style="flex:2">Finn handel →</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('trade-close-btn2').addEventListener('click', () => modal.remove());

        const input = document.getElementById('trade-code-input');
        input.focus();
        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('trade-lookup-btn').click();
        });

        document.getElementById('trade-lookup-btn').addEventListener('click', async () => {
            const kode = input.value.trim().toUpperCase();
            if (kode.length < 4) {
                document.getElementById('trade-lookup-error').textContent = 'Skriv inn en gyldig kode (minst 4 tegn)';
                return;
            }
            const btn = document.getElementById('trade-lookup-btn');
            btn.disabled = true; btn.textContent = 'Søker…';
            document.getElementById('trade-lookup-error').textContent = '';

            const result = await this.lookupTrade(kode);
            if (!result) {
                document.getElementById('trade-lookup-error').textContent = `Fant ingen aktiv handel med kode "${kode}"`;
                btn.disabled = false; btn.textContent = 'Finn handel →';
            } else if (result === 'self') {
                document.getElementById('trade-lookup-error').textContent = 'Du kan ikke godta din egen handel';
                btn.disabled = false; btn.textContent = 'Finn handel →';
            } else if (result === 'expired') {
                document.getElementById('trade-lookup-error').textContent = 'Denne handelen er utløpt';
                btn.disabled = false; btn.textContent = 'Finn handel →';
            } else {
                modal.remove();
                this._bVelgEgetKort(result.tradeId, result.tradeDoc);
            }
        });
    }

    async lookupTrade(code) {
        try {
            const q = query(collection(db, 'trades'), where('code', '==', code), where('status', '==', 'pending'));
            const snap = await getDocs(q);
            if (snap.empty) return null;

            const tradeDocSnap = snap.docs[0];
            const tradeDoc = tradeDocSnap.data();
            const tradeId = tradeDocSnap.id;

            if (tradeDoc.expiresAt < Date.now()) {
                await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled', cancelReason: 'expired' });
                return 'expired';
            }
            if (tradeDoc.initiatorDevice === this._getDeviceId()) return 'self';
            return { tradeId, tradeDoc };
        } catch (err) {
            console.error('[Trade] lookupTrade error:', err);
            return null;
        }
    }

    /** Elev B: velg hva de gir i retur */
    _bVelgEgetKort(tradeId, tradeDoc) {
        document.getElementById('trade-modal')?.remove();

        const off = tradeDoc.offeredKortData;
        const offConfig = RARITY_CONFIG[off.rarity] || { farge: '#888', emoji: '📦' };

        const samling = KortReward.getUserCollection();
        if (samling.length === 0) {
            visToast('Du har ingen kort å gi i bytte', 'warning');
            return;
        }

        const grouped = {};
        samling.forEach(k => {
            if (!grouped[k.id]) grouped[k.id] = { ...k, count: 0 };
            grouped[k.id].count++;
        });
        const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Du får dette kortet</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <!-- Hva B får -->
                <div style="background:#f9f5ff;border-radius:14px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
                    <img src="${off.image}" alt="${off.name}"
                        style="width:56px;height:84px;object-fit:cover;border-radius:10px;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                    <div>
                        <p style="margin:0 0 3px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Du mottar</p>
                        <p style="margin:0 0 3px;font-size:17px;font-weight:800;color:#1d1d1f;">${off.name}</p>
                        <p style="margin:0;font-size:12px;font-weight:600;color:${offConfig.farge};">${offConfig.emoji} ${RARITY_LABELS[off.rarity] || off.rarity}</p>
                    </div>
                </div>
                <p class="trade-picker-hint">Velg et kort fra samlingen din å gi i retur:</p>
                <div class="trade-picker-grid">
                    ${sorted.map(k => {
                        const config = RARITY_CONFIG[k.rarity] || { farge: '#888', emoji: '📦' };
                        return `
                            <div class="trade-pick-card" data-kort-id="${k.id}">
                                <div class="trade-pick-img-wrap">
                                    <img src="${k.image}" alt="${k.name}" loading="lazy">
                                    <span class="trade-pick-rarity" style="background:${config.farge}">${config.emoji}</span>
                                    ${k.count > 1 ? `<div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.7);color:white;font-size:10px;font-weight:700;padding:2px 5px;border-radius:6px;">×${k.count}</div>` : ''}
                                </div>
                                <p class="trade-pick-name">${k.name}</p>
                            </div>`;
                    }).join('')}
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());

        modal.querySelectorAll('.trade-pick-card').forEach(card => {
            card.addEventListener('click', () => {
                const kortId = card.dataset.kortId;
                const picked = samling.find(k => k.id === kortId);
                if (!picked) return;
                modal.remove();
                this._showBConfirm(tradeId, tradeDoc, picked);
            });
        });
    }

    _showBConfirm(tradeId, tradeDoc, pickedKort) {
        document.getElementById('trade-modal')?.remove();

        const off = tradeDoc.offeredKortData;
        const offConfig = RARITY_CONFIG[off.rarity] || { farge: '#888', emoji: '📦' };
        const pickedConfig = RARITY_CONFIG[pickedKort.rarity] || { farge: '#888', emoji: '📦' };

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>Bekreft byttet</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-swap-preview">
                    <div class="trade-swap-card">
                        <img src="${pickedKort.image}" alt="${pickedKort.name}">
                        <p class="trade-swap-label">Du gir</p>
                        <p class="trade-swap-name">${pickedKort.name}</p>
                        <p style="margin:2px 0 0;font-size:11px;font-weight:600;color:${pickedConfig.farge};">${pickedConfig.emoji} ${RARITY_LABELS[pickedKort.rarity] || pickedKort.rarity}</p>
                    </div>
                    <div class="trade-swap-arrow">⇌</div>
                    <div class="trade-swap-card">
                        <img src="${off.image}" alt="${off.name}">
                        <p class="trade-swap-label">Du får</p>
                        <p class="trade-swap-name">${off.name}</p>
                        <p style="margin:2px 0 0;font-size:11px;font-weight:600;color:${offConfig.farge};">${offConfig.emoji} ${RARITY_LABELS[off.rarity] || off.rarity}</p>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-top:4px;">
                    <button id="trade-back-btn" class="trade-btn-secondary" style="flex:1">← Velg annet</button>
                    <button id="trade-accept-btn" class="trade-btn-primary" style="flex:2">Godta byttet!</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('trade-back-btn').addEventListener('click', () => {
            modal.remove();
            this._bVelgEgetKort(tradeId, tradeDoc);
        });
        document.getElementById('trade-accept-btn').addEventListener('click', async () => {
            const btn = document.getElementById('trade-accept-btn');
            btn.disabled = true; btn.textContent = 'Bytter kort…';
            try {
                await this.acceptTrade(tradeId, tradeDoc, pickedKort);
                modal.remove();
                this._visTradeAnimasjon(pickedKort, off);
            } catch (err) {
                console.error('[Trade] Accept error:', err);
                visToast('Noe gikk galt. Prøv igjen.', 'error');
                btn.disabled = false; btn.textContent = 'Godta byttet!';
            }
        });
    }

    async acceptTrade(tradeId, tradeDoc, pickedKortData) {
        if (!KortReward.hasKort(pickedKortData.id)) {
            throw new Error('Du eier ikke lenger dette kortet');
        }
        KortReward.removeKort(pickedKortData.id, 1);
        KortReward.awardKort(tradeDoc.offeredKortData);
        await updateDoc(doc(db, 'trades', tradeId), {
            status: 'accepted',
            responderDevice: this._getDeviceId(),
            requestedKortId: pickedKortData.id,
            requestedKortData: this._kortSnapshot(pickedKortData)
        });
    }

    // ── Swap animasjon ─────────────────────────────────────────

    _visTradeAnimasjon(giKort, fikKort, onClose) {
        document.querySelector('.trade-anim-overlay')?.remove();

        const config = RARITY_CONFIG[fikKort.rarity] || { farge: '#888', emoji: '📦' };
        const rarityLabel = RARITY_LABELS[fikKort.rarity] || fikKort.rarity;

        const colors = ['#FFB347', '#F59E0B', '#34D399', '#60A5FA', '#F87171', '#FCD34D', '#C084FC', '#38BDF8'];
        const particles = Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * 360;
            const dist = 70 + Math.random() * 80;
            const tx = Math.cos(angle * Math.PI / 180) * dist;
            const ty = Math.sin(angle * Math.PI / 180) * dist;
            const size = 6 + Math.random() * 8;
            const color = colors[i % colors.length];
            const delay = 0.9 + Math.random() * 0.15;
            return `<div style="
                position:absolute;left:50%;top:50%;
                width:${size}px;height:${size}px;
                margin:${-size/2}px 0 0 ${-size/2}px;
                border-radius:50%;background:${color};
                --tx:${tx}px;--ty:${ty}px;
                animation:tradeParticle 0.9s cubic-bezier(.25,.46,.45,.94) ${delay}s both;
                pointer-events:none;
            "></div>`;
        }).join('');

        const overlay = document.createElement('div');
        overlay.className = 'trade-anim-overlay';
        overlay.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.92);
            z-index:10010;display:flex;align-items:center;justify-content:center;
            animation:tradeAnim_fadeIn 0.35s ease both;
        `;
        overlay.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:20px;padding:28px 20px;max-width:380px;width:100%;text-align:center;">

                <p style="color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:2px;text-transform:uppercase;
                    animation:tradeAnim_fadeUp 0.3s ease 0.1s both;">Handel fullført!</p>

                <!-- Kortene -->
                <div style="display:flex;align-items:center;gap:20px;position:relative;">
                    ${particles}
                    <!-- Lysglimt ved møtet -->
                    <div style="
                        position:absolute;left:50%;top:50%;width:80px;height:80px;
                        margin:-40px 0 0 -40px;border-radius:50%;
                        background:radial-gradient(circle,rgba(255,230,80,0.9) 0%,transparent 70%);
                        animation:tradeAnim_flash 0.4s ease 0.8s both;
                        pointer-events:none;
                    "></div>

                    <!-- Gitt kort -->
                    <div style="display:flex;flex-direction:column;align-items:center;animation:tradeAnim_slideLeft 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both;">
                        <img src="${giKort.image}" alt="${giKort.name}"
                            style="width:100px;height:150px;object-fit:cover;border-radius:12px;
                                   box-shadow:0 6px 20px rgba(0,0,0,0.5);opacity:0.55;filter:grayscale(0.2);">
                        <span style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:6px;">Du ga</span>
                    </div>

                    <!-- Pil -->
                    <div style="font-size:26px;color:white;animation:tradeAnim_arrow 0.4s cubic-bezier(.34,1.56,.64,1) 0.75s both;flex-shrink:0;">⇌</div>

                    <!-- Fått kort (flipper) -->
                    <div style="display:flex;flex-direction:column;align-items:center;animation:tradeAnim_slideRight 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both;">
                        <div style="animation:tradeAnim_flip 0.65s ease 0.95s both;transform-style:preserve-3d;">
                            <img src="${fikKort.image}" alt="${fikKort.name}"
                                style="width:120px;height:180px;object-fit:cover;border-radius:14px;
                                       box-shadow:0 8px 32px rgba(255,107,71,0.5),0 0 0 3px rgba(255,179,71,0.4);
                                       display:block;">
                        </div>
                        <span style="color:white;font-size:12px;font-weight:700;margin-top:8px;
                            animation:tradeAnim_fadeUp 0.4s ease 1.3s both;">Du fikk!</span>
                    </div>
                </div>

                <!-- Kortnavn + sjeldenhet -->
                <h2 style="margin:0;font-size:24px;font-weight:900;color:white;
                    animation:tradeAnim_fadeUp 0.4s ease 1.45s both;">${fikKort.name}</h2>
                <p style="margin:0;font-size:14px;font-weight:700;color:${config.farge};
                    animation:tradeAnim_fadeUp 0.4s ease 1.55s both;">${config.emoji} ${rarityLabel}</p>

                <!-- Fortsett-knapp -->
                <button id="trade-anim-close" style="
                    background:#FF6B47;color:white;border:none;border-radius:99px;
                    padding:13px 40px;font-size:15px;font-weight:700;cursor:pointer;
                    margin-top:4px;animation:tradeAnim_fadeUp 0.4s ease 1.8s both;
                    transition:transform 0.15s,background 0.15s;
                ">Fortsett →</button>
            </div>
        `;

        // Inject keyframes if not already present
        if (!document.getElementById('trade-anim-keyframes')) {
            const style = document.createElement('style');
            style.id = 'trade-anim-keyframes';
            style.textContent = `
                @keyframes tradeAnim_fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes tradeAnim_fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes tradeAnim_slideLeft {
                    from{opacity:0;transform:translateX(-180px) rotate(-12deg)}
                    to{opacity:1;transform:translateX(0) rotate(0deg)}
                }
                @keyframes tradeAnim_slideRight {
                    from{opacity:0;transform:translateX(180px) rotate(12deg)}
                    to{opacity:1;transform:translateX(0) rotate(0deg)}
                }
                @keyframes tradeAnim_arrow {
                    from{opacity:0;transform:scale(0)}
                    60%{transform:scale(1.4)}
                    to{opacity:1;transform:scale(1)}
                }
                @keyframes tradeAnim_flash {
                    0%{opacity:0;transform:scale(0)}
                    40%{opacity:1;transform:scale(1.2)}
                    100%{opacity:0;transform:scale(2)}
                }
                @keyframes tradeAnim_flip {
                    0%{transform:rotateY(0deg) scale(1)}
                    45%{transform:rotateY(90deg) scale(1.05)}
                    55%{transform:rotateY(90deg) scale(1.05)}
                    100%{transform:rotateY(0deg) scale(1.12)}
                }
                @keyframes tradeParticle {
                    0%{opacity:1;transform:translate(0,0) scale(1)}
                    100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.animation = 'tradeAnim_fadeIn 0.25s ease reverse forwards';
            setTimeout(() => { overlay.remove(); onClose?.(); }, 250);
        };

        document.getElementById('trade-anim-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        setTimeout(close, 6000);
    }

    // ── Ingen tokens modal ─────────────────────────────────────

    _visIngenTokenerModal() {
        document.getElementById('trade-modal')?.remove();

        const earned = parseInt(localStorage.getItem('gm_trade_tokens_earned') || '0', 10);
        const intervals = [35, 40, 45];
        let prevThreshold = 0;
        for (let i = 0; i < earned; i++) prevThreshold += i < intervals.length ? intervals[i] : 50;
        const nextInterval = earned < intervals.length ? intervals[earned] : 50;
        const nextThreshold = prevThreshold + nextInterval;
        const user = window.brukerNavn || localStorage.getItem('aktiv_bruker') || 'Spiller';
        const totalXP = parseInt(localStorage.getItem(`mester_xp_gloser_${user}`) || '0', 10);
        const xpSinceLast = Math.max(0, totalXP - prevThreshold);
        const mangler = Math.max(0, nextThreshold - totalXP);
        const pct = Math.min(100, Math.round((xpSinceLast / nextInterval) * 100));

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" style="text-align:center;" onclick="event.stopPropagation()">
                <div class="trade-header" style="justify-content:center;position:relative;">
                    <h2>Ingen trade-tokens</h2>
                    <button class="trade-close-btn" id="trade-close" style="position:absolute;right:0;">✕</button>
                </div>
                <div style="font-size:52px;margin-bottom:12px;">📚</div>
                <p style="font-size:15px;color:#555;margin:0 0 20px;line-height:1.5;">
                    Du trenger en <strong>trade-token</strong> for å bytte kort.<br>
                    Tokens tjenes ved å svare riktig på gloser!
                </p>
                <div style="background:#f9f5ff;border-radius:16px;padding:18px;margin-bottom:20px;text-align:left;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:700;color:#FF6B47;">
                        <span>Fremgang mot neste token</span>
                        <span>${xpSinceLast} / ${nextInterval}</span>
                    </div>
                    <div style="background:#e9d5ff;border-radius:99px;height:12px;overflow:hidden;margin-bottom:10px;">
                        <div style="background:linear-gradient(90deg,#FF6B47,#FFB347);height:100%;width:${pct}%;transition:width 0.4s;"></div>
                    </div>
                    <p style="margin:0;font-size:13px;color:#FF6B47;font-weight:700;text-align:center;">
                        ${mangler > 0 ? `${mangler} riktige svar til neste trade-token` : 'Du er klar — øv litt til!'}
                    </p>
                </div>
                <button id="trade-go-practice" class="trade-btn-primary" style="width:100%;">Øv nå!</button>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('trade-go-practice').addEventListener('click', () => {
            modal.remove();
            window.glosemester?.renderPracticeUI?.();
        });
    }
}

export const tradeSystem = new TradeSystem();
window.tradeSystem = tradeSystem;
