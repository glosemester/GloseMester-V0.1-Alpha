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
import { visGevinstPopup } from '../../core/kort/kort-display.js';
import { visToast } from '../../core/utils/feedback.js';

const TRADE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutter
const POLL_INTERVAL_MS = 4000;
const PENDING_KEY = 'gm_pending_trade';

class TradeSystem {
    constructor() {
        this._pollTimer = null;
    }

    init() {
        this._injectStyles();
        this._resumePendingTrade();

        // Handle #bytt=CODE hash (fra delt QR/lenke)
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
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('gm_device_id', id);
        }
        return id;
    }

    // ── Elev A: Opprett trade ──────────────────────────────────

    openTradeCreator(offeredKortId) {
        const samling = KortReward.getUserCollection();
        const offered = samling.find(k => k.id === offeredKortId);
        if (!offered) { visToast('Fant ikke kortet i samlingen din', 'error'); return; }

        if (localStorage.getItem(`gm_trade_lock_${offeredKortId}`)) {
            visToast('Dette kortet er allerede i en aktiv byttehandel', 'warning');
            return;
        }

        this._renderKortPicker(offered);
    }

    _renderKortPicker(offered) {
        document.getElementById('trade-modal')?.remove();

        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        const sorted = [...kortData].sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>🔄 Velg kort du ønsker</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-offered-preview">
                    <span class="trade-offered-label">Du tilbyr:</span>
                    <div class="trade-mini-card">
                        <img src="${offered.image}" alt="${offered.name}">
                        <span>${offered.name}</span>
                    </div>
                </div>
                <p class="trade-picker-hint">Velg kortet du ønsker å få i bytte:</p>
                <div class="trade-picker-grid" id="trade-picker-grid">
                    ${sorted.map(k => this._renderPickerCard(k, k.id === offered.id)).join('')}
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());

        modal.querySelectorAll('.trade-pick-card:not(.trade-pick-disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const requested = kortData.find(k => k.id === card.dataset.kortId);
                if (!requested) return;
                modal.remove();
                this._showCreateConfirm(offered, requested);
            });
        });
    }

    _renderPickerCard(kort, isSelf) {
        const config = RARITY_CONFIG[kort.rarity] || { farge: '#888', emoji: '📦' };
        const cls = isSelf ? 'trade-pick-disabled' : '';
        return `
            <div class="trade-pick-card ${cls}" data-kort-id="${kort.id}">
                <div class="trade-pick-img-wrap">
                    <img src="${kort.image}" alt="${kort.name}" loading="lazy">
                    <span class="trade-pick-rarity" style="background:${config.farge}">${config.emoji}</span>
                    ${isSelf ? '<div class="trade-pick-self-label">Ditt kort</div>' : ''}
                </div>
                <p class="trade-pick-name">${kort.name}</p>
            </div>
        `;
    }

    _showCreateConfirm(offered, requested) {
        document.getElementById('trade-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>🔄 Bekreft bytte</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-swap-preview">
                    <div class="trade-swap-card">
                        <img src="${offered.image}" alt="${offered.name}">
                        <p class="trade-swap-label">Du gir</p>
                        <p class="trade-swap-name">${offered.name}</p>
                    </div>
                    <div class="trade-swap-arrow">⇌</div>
                    <div class="trade-swap-card">
                        <img src="${requested.image}" alt="${requested.name}">
                        <p class="trade-swap-label">Du får</p>
                        <p class="trade-swap-name">${requested.name}</p>
                    </div>
                </div>
                <p style="text-align:center;color:#666;font-size:13px;margin:0 0 20px;">Genererer en byttkode du deler med en venn. Utløper etter 15 min.</p>
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
            this._renderKortPicker(offered);
        });
        document.getElementById('trade-confirm-btn').addEventListener('click', async () => {
            const btn = document.getElementById('trade-confirm-btn');
            btn.disabled = true;
            btn.textContent = 'Oppretter…';
            try {
                const { tradeId, code } = await this.createTrade(offered, requested);
                modal.remove();
                this._showTradeCode(tradeId, code, offered, requested);
            } catch (err) {
                console.error('Trade create error:', err);
                visToast('Kunne ikke opprette byttehandel', 'error');
                btn.disabled = false;
                btn.textContent = 'Lag byttkode';
            }
        });
    }

    async createTrade(offeredKortData, requestedKortData) {
        const deviceId = this._getDeviceId();
        const code = this._generateCode();

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
            requestedKortId: requestedKortData.id,
            requestedKortData: this._kortSnapshot(requestedKortData),
            cancelReason: null
        });

        const tradeId = tradeRef.id;
        localStorage.setItem(PENDING_KEY, JSON.stringify({ tradeId, code, offeredKortData, requestedKortData }));

        return { tradeId, code };
    }

    _kortSnapshot(k) {
        return { id: k.id, name: k.name, image: k.image, rarity: k.rarity, category: k.category, fag: k.fag || 'gloser' };
    }

    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ingen O/0/I/1
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    _showTradeCode(tradeId, code, offeredKortData, requestedKortData) {
        document.getElementById('trade-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>🔄 Del byttkoden</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-code-display">
                    <div class="trade-code-value">${code}</div>
                    <button class="trade-copy-btn" id="trade-copy-btn">📋 Kopier kode</button>
                </div>
                <p class="trade-code-hint">Del koden med vennen din. Utløper om <span id="trade-countdown">15:00</span>.</p>
                <div class="trade-swap-preview trade-swap-preview-sm">
                    <div class="trade-swap-card">
                        <img src="${offeredKortData.image}" alt="${offeredKortData.name}">
                        <p class="trade-swap-name">${offeredKortData.name}</p>
                    </div>
                    <div class="trade-swap-arrow">⇌</div>
                    <div class="trade-swap-card">
                        <img src="${requestedKortData.image}" alt="${requestedKortData.name}">
                        <p class="trade-swap-name">${requestedKortData.name}</p>
                    </div>
                </div>
                <div id="trade-status-msg" class="trade-status-waiting">⏳ Venter på at vennen din godtar…</div>
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

        // Nedtelling
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
                    msg.textContent = status === 'expired' ? '⏰ Handel utløpt' : '❌ Handel avbrutt';
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
            statusMsg.textContent = '✅ Vennen din godtok! Bytter kort…';
        }

        if (!KortReward.hasKort(tradeDoc.offeredKortId)) {
            await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled', cancelReason: 'initiator_no_longer_has' });
            visToast('Du eier ikke lenger kortet du tilbød — handel avbrutt', 'error');
            if (modal) modal.remove();
            localStorage.removeItem(`gm_trade_lock_${tradeDoc.offeredKortId}`);
            localStorage.removeItem(PENDING_KEY);
            return;
        }

        KortReward.removeKort(tradeDoc.offeredKortId, 1);
        KortReward.awardKort(tradeDoc.requestedKortData);
        await updateDoc(doc(db, 'trades', tradeId), { status: 'completed' });

        this.stopPolling();
        localStorage.removeItem(`gm_trade_lock_${tradeDoc.offeredKortId}`);
        localStorage.removeItem(PENDING_KEY);

        if (modal) modal.remove();
        visGevinstPopup(tradeDoc.requestedKortData);
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

                if (['accepted', 'completed', 'cancelled'].includes(data.status)) {
                    this.stopPolling();
                }
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

    // ── Gjenoppta ventende handel ved sidelasting ──────────────

    _resumePendingTrade() {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return;
        try {
            const { tradeId, code, offeredKortData, requestedKortData } = JSON.parse(raw);
            if (!tradeId || !code) return;
            setTimeout(() => this._showTradeCode(tradeId, code, offeredKortData, requestedKortData), 1200);
        } catch {
            localStorage.removeItem(PENDING_KEY);
        }
    }

    // ── Elev B: Godta trade ────────────────────────────────────

    openTradeResponder(code = '') {
        document.getElementById('trade-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>🔄 Skriv inn byttkode</h2>
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
                this._showTradePreview(result.tradeId, result.tradeDoc);
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

    _showTradePreview(tradeId, tradeDoc) {
        document.getElementById('trade-modal')?.remove();

        const hasCard = KortReward.hasKort(tradeDoc.requestedKortId);
        const off = tradeDoc.offeredKortData;
        const req = tradeDoc.requestedKortData;

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'trade-overlay';
        modal.innerHTML = `
            <div class="trade-modal" onclick="event.stopPropagation()">
                <div class="trade-header">
                    <h2>🔄 Godta handel?</h2>
                    <button class="trade-close-btn" id="trade-close">✕</button>
                </div>
                <div class="trade-swap-preview">
                    <div class="trade-swap-card">
                        <img src="${off.image}" alt="${off.name}">
                        <p class="trade-swap-label">Du får</p>
                        <p class="trade-swap-name">${off.name}</p>
                    </div>
                    <div class="trade-swap-arrow">⇌</div>
                    <div class="trade-swap-card">
                        <img src="${req.image}" alt="${req.name}" ${!hasCard ? 'style="filter:grayscale(1) opacity(0.5)"' : ''}>
                        <p class="trade-swap-label">Du gir</p>
                        <p class="trade-swap-name">${req.name}</p>
                        ${!hasCard ? '<p class="trade-swap-missing-label">Du eier ikke dette kortet</p>' : ''}
                    </div>
                </div>
                ${!hasCard ? `<p style="color:#ef4444;text-align:center;font-size:13px;margin:-8px 0 16px;">Du eier ikke <strong>${req.name}</strong> og kan ikke godta handelen.</p>` : ''}
                <div style="display:flex;gap:12px;">
                    <button id="trade-reject-btn" class="trade-btn-secondary" style="flex:1">Avslå</button>
                    <button id="trade-accept-btn" class="trade-btn-primary" style="flex:2" ${!hasCard ? 'disabled' : ''}>✅ Godta handel</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
        document.getElementById('trade-close').addEventListener('click', () => modal.remove());
        document.getElementById('trade-reject-btn').addEventListener('click', () => modal.remove());

        if (hasCard) {
            document.getElementById('trade-accept-btn').addEventListener('click', async () => {
                const btn = document.getElementById('trade-accept-btn');
                btn.disabled = true; btn.textContent = 'Bytter kort…';
                try {
                    await this.acceptTrade(tradeId, tradeDoc);
                    modal.remove();
                    visGevinstPopup(off);
                } catch (err) {
                    console.error('[Trade] Accept error:', err);
                    visToast('Noe gikk galt. Prøv igjen.', 'error');
                    btn.disabled = false; btn.textContent = '✅ Godta handel';
                }
            });
        }
    }

    async acceptTrade(tradeId, tradeDoc) {
        KortReward.removeKort(tradeDoc.requestedKortId, 1);
        KortReward.awardKort(tradeDoc.offeredKortData);
        await updateDoc(doc(db, 'trades', tradeId), {
            status: 'accepted',
            responderDevice: this._getDeviceId()
        });
    }
}

export const tradeSystem = new TradeSystem();
window.tradeSystem = tradeSystem;
