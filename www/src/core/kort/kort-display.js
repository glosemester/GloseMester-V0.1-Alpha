/* ============================================
   KORT-DISPLAY.JS - GloseMester v2.6
   UI for kort-visning og galleri
   ============================================ */

import { RARITY_CONFIG, kortData } from './kort-data.js';
import { KortReward } from './kort-reward.js';

/**
 * KortGalleri - Displays user's kort collection
 */
export class KortGalleri {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.sortMode = 'nyeste'; // 'nyeste', 'sjeldenhet', 'navn'
    }

    /**
     * Render the gallery
     * @param {Object} options - Render options
     */
    render(options = {}) {
        if (!this.container) {
            console.error(`Container not found: ${this.containerId}`);
            return;
        }

        const samling = KortReward.getUserCollection();

        // Empty state
        if (samling.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Render header with stats
        const stats = KortReward.getCollectionStats();
        this.renderHeader(stats);

        // Render sort controls
        if (!options.hideSortControls) {
            this.renderSortControls();
        }

        // Sort collection
        const sorted = this.sortCollection(samling);

        // Group by ID and count
        const grouped = this.groupKort(sorted);

        // Render kort cards
        this.renderKortCards(grouped);
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="kort-empty-state" style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🃏</div>
                <h3 style="color: #1d1d1f; margin-bottom: 10px;">Ingen kort ennå</h3>
                <p style="color: #666; margin-bottom: 24px;">Svar riktig på 10 spørsmål for å vinne ditt første kort!</p>
                <button onclick="window.glosemester?.renderPracticeUI()" style="
                    background: #FF6B47; color: white; border: none;
                    padding: 14px 32px; border-radius: 14px;
                    font-size: 16px; font-weight: 700; cursor: pointer;
                ">🚀 Start øving nå</button>
            </div>
        `;
    }

    /**
     * Render header with stats
     * @param {Object} stats - Collection statistics
     */
    renderHeader(stats) {
        const headerHtml = `
            <div class="kort-header" style="margin-bottom: 30px;">
                <h2>Min Kortsamling</h2>
                <div class="kort-stats" style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
                    <div class="stat-box">
                        <span class="stat-value">${stats.total}</span>
                        <span class="stat-label">Totalt</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${stats.unique}</span>
                        <span class="stat-label">Unike</span>
                    </div>
                    <div class="stat-box rarity-legendary">
                        <span class="stat-value">${stats.byRarity.legendary || 0}</span>
                        <span class="stat-label">Legendary</span>
                    </div>
                    <div class="stat-box rarity-epic">
                        <span class="stat-value">${stats.byRarity.epic || 0}</span>
                        <span class="stat-label">Epic</span>
                    </div>
                    <div class="stat-box rarity-rare">
                        <span class="stat-value">${stats.byRarity.rare || 0}</span>
                        <span class="stat-label">Rare</span>
                    </div>
                    <div class="stat-box rarity-common">
                        <span class="stat-value">${stats.byRarity.common || 0}</span>
                        <span class="stat-label">Common</span>
                    </div>
                </div>
            </div>
        `;

        // Insert header before existing content
        this.container.insertAdjacentHTML('afterbegin', headerHtml);
    }

    /**
     * Render sort controls
     */
    renderSortControls() {
        const controlsHtml = `
            <div class="kort-sort-controls" style="margin-bottom: 20px;">
                <label style="font-weight: 600; margin-right: 10px;">Sorter:</label>
                <button class="sort-btn ${this.sortMode === 'nyeste' ? 'active' : ''}" data-sort="nyeste">
                    Nyeste først
                </button>
                <button class="sort-btn ${this.sortMode === 'sjeldenhet' ? 'active' : ''}" data-sort="sjeldenhet">
                    Sjeldenhet
                </button>
                <button class="sort-btn ${this.sortMode === 'navn' ? 'active' : ''}" data-sort="navn">
                    Navn (A-Å)
                </button>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', controlsHtml);

        // Attach event listeners
        this.container.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortMode = e.target.dataset.sort;
                this.setSortMode(sortMode);
                this.render();
            });
        });
    }

    /**
     * Sort collection
     * @param {Array} samling - Kort collection
     * @returns {Array} - Sorted collection
     */
    sortCollection(samling) {
        let sorted = [...samling];

        switch (this.sortMode) {
            case 'nyeste':
                sorted.reverse();
                break;

            case 'sjeldenhet':
                const rarityValue = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
                sorted.sort((a, b) => {
                    return (rarityValue[b.rarity] || 0) - (rarityValue[a.rarity] || 0);
                });
                break;

            case 'navn':
                sorted.sort((a, b) => a.name.localeCompare(b.name, 'no'));
                break;
        }

        return sorted;
    }

    /**
     * Group kort by ID and count duplicates
     * @param {Array} samling - Kort collection
     * @returns {Array} - Grouped kort
     */
    groupKort(samling) {
        const grouped = {};

        samling.forEach(kort => {
            if (!grouped[kort.id]) {
                grouped[kort.id] = { ...kort, count: 0 };
            }
            grouped[kort.id].count++;
        });

        return Object.values(grouped);
    }

    /**
     * Render kort cards
     * @param {Array} kortList - List of kort to render
     */
    renderKortCards(kortList) {
        const gridHtml = `
            <div class="kort-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">
                ${kortList.map(kort => this.renderKortCard(kort)).join('')}
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', gridHtml);

        // Zoom on card click (not on pante-btn)
        this.container.querySelectorAll('.kort-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.pante-btn')) return;
                const kortId = e.currentTarget.dataset.kortId;
                this.showKortModal(kortId);
            });
        });

        // Pante-knapp listeners
        this.container.querySelectorAll('.pante-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const kortId = btn.dataset.panteId;
                this.visPanteBekreftelse(kortId);
            });
        });
    }

    /**
     * Vis bekreftelsesdialog for panting
     * @param {string} kortId
     */
    visPanteBekreftelse(kortId) {
        const samling = KortReward.getUserCollection();
        const kort = samling.find(k => k.id === kortId);
        if (!kort) return;

        const count = KortReward.getKortCount(kortId);
        const config = RARITY_CONFIG[kort.rarity] || {};

        const existing = document.getElementById('pante-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'pante-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:10001;padding:20px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:24px;padding:32px 24px;max-width:340px;width:100%;text-align:center;" onclick="event.stopPropagation()">
                <div style="font-size:40px;margin-bottom:8px;">🔄</div>
                <h3 style="margin:0 0 6px;font-size:20px;color:#1d1d1f;">Pant dubletter?</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#666;">
                    Du har <strong>${count}×</strong> ${kort.name}.<br>
                    Pant <strong>2 kopier</strong> → få <strong>1 tilfeldig nytt kort</strong>.
                </p>
                <img src="${kort.image}" alt="${kort.name}"
                    style="width:100px;border-radius:12px;margin-bottom:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <button id="pante-bekreft-btn"
                        style="padding:13px;background:#22c55e;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                        ✅ Ja, pant 2 kopier
                    </button>
                    <button onclick="document.getElementById('pante-modal').remove()"
                        style="padding:13px;background:#f5f5f7;color:#666;border:none;border-radius:12px;font-size:15px;cursor:pointer;">
                        Avbryt
                    </button>
                </div>
                <p style="margin:12px 0 0;font-size:12px;color:#aaa;">Du beholder 1 kopi av ${kort.name}</p>
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);

        document.getElementById('pante-bekreft-btn').addEventListener('click', () => {
            modal.remove();
            this.gjennomforPanting(kortId);
        });
    }

    /**
     * Gjennomfør panting: fjern 2, vis gevinst-popup, gjenrender galleri
     * @param {string} kortId
     */
    gjennomforPanting(kortId) {
        const nyttKort = KortReward.panteKort(kortId);
        if (!nyttKort) return;

        // Vis gevinst-popup for det nye kortet
        visGevinstPopup(nyttKort);

        // Gjenrender galleriet etter at popup lukkes
        const observeClose = setInterval(() => {
            if (!document.querySelector('.kort-win-modal')) {
                clearInterval(observeClose);
                this.container.innerHTML = '';
                this.render();
            }
        }, 500);
    }

    /**
     * Render individual kort card
     * @param {Object} kort - Kort object
     * @returns {string} - HTML string
     */
    renderKortCard(kort) {
        const config = RARITY_CONFIG[kort.rarity];
        const kanPante = kort.count >= 3;
        const frameStyle = _rarityFrameStyle(kort.rarity, config.farge);

        return `
            <div class="kort-card rarity-${kort.rarity}" data-kort-id="${kort.id}" style="cursor:pointer;position:relative;border-radius:14px;${frameStyle}">
                <div class="kort-image-container" style="aspect-ratio:2/3;border-radius:11px;overflow:hidden;position:relative;">
                    <img src="${kort.image}" alt="${kort.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
                    <div class="kort-rarity-badge" style="position:absolute;top:8px;right:8px;background:${config.farge};color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;">
                        ${config.tekst}
                    </div>
                    ${kort.rarity === 'legendary' ? `<div style="position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,215,0,0.1) 50%,transparent 65%);animation:kw-shimmer 2.2s ease-in-out infinite;pointer-events:none;"></div>` : ''}
                    ${kort.count > 1 ? `
                        <div class="kort-count-badge" style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);color:white;padding:4px 8px;border-radius:50%;font-size:12px;font-weight:700;">
                            ×${kort.count}
                        </div>
                    ` : ''}
                </div>
                <div class="kort-info" style="padding: 8px 8px 4px; text-align: center;">
                    <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #1d1d1f;">${kort.name}</h4>
                    <p style="margin: 0 0 6px; font-size: 12px; color: #666; text-transform: capitalize;">${kort.category}</p>
                    ${kanPante ? `
                        <button class="pante-btn" data-pante-id="${kort.id}"
                            style="width:100%;padding:6px 0;background:#f0fdf4;border:1.5px solid #22c55e;color:#15803d;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
                            Pant 2 dubletter
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show kort modal (detailed view)
     * @param {string} kortId - Kort ID
     */
    showKortModal(kortId) {
        const samling = KortReward.getUserCollection();
        const kort = samling.find(k => k.id === kortId);
        if (!kort) return;

        const config = RARITY_CONFIG[kort.rarity] || { farge: '#FF6B47', emoji: '🃏', tekst: kort.rarity };
        const count = KortReward.getKortCount(kortId);

        const existing = document.getElementById('kort-detail-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'kort-detail-modal';
        modal.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.85);
            display:flex;align-items:center;justify-content:center;
            z-index:10000;padding:20px;cursor:pointer;
        `;
        modal.innerHTML = `
            <div style="background:white;border-radius:24px;padding:32px 24px;max-width:360px;width:100%;text-align:center;cursor:default;position:relative;" onclick="event.stopPropagation()">
                <button id="close-detail-modal" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#666;line-height:1;">✕</button>
                <img src="${kort.image}" alt="${kort.name}"
                    style="width:100%;max-width:280px;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.25);margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;">
                <h2 style="margin:0 0 4px;font-size:22px;color:#1d1d1f;">${kort.name}</h2>
                <p style="margin:0 0 12px;color:#666;font-size:14px;text-transform:capitalize;">${kort.category}</p>
                <span style="display:inline-block;background:${config.farge};color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:${count > 1 ? '10px' : '0'}">
                    ${config.tekst}
                </span>
                ${count > 1 ? `<p style="margin:0;font-size:13px;color:#888;">Du har ${count} av dette kortet</p>` : ''}
            </div>
        `;

        modal.addEventListener('click', () => modal.remove());
        modal.querySelector('#close-detail-modal').addEventListener('click', () => modal.remove());
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); }
        });

        document.body.appendChild(modal);
    }

    /**
     * Render ALL 152 cards — greyed out with "Ikke vunnet" if not owned
     */
    renderAll() {
        if (!this.container) {
            console.error(`Container not found: ${this.containerId}`);
            return;
        }

        const samling = KortReward.getUserCollection();
        const ownedIds = new Set(samling.map(k => k.id));
        const stats = KortReward.getCollectionStats();
        const totalAvailable = kortData.length;

        // Categories with labels
        const categoryLabels = { biler: 'Biler', dinosaurer: 'Dinosaurer', dyr: 'Dyr', guder: 'Guder' };
        const categoryOrder = ['biler', 'dinosaurer', 'dyr', 'guder'];

        // Summary header
        this.container.innerHTML = `
            <div style="margin-bottom:20px;padding:16px;background:rgba(124,58,237,0.08);border-radius:16px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#FF6B47;">${stats.unique}</span>
                <span style="color:#888;font-size:15px;"> / ${totalAvailable} unike kort vunnet</span>
                <div style="margin-top:8px;background:#e5e7eb;border-radius:99px;height:8px;max-width:300px;margin-left:auto;margin-right:auto;">
                    <div style="background:linear-gradient(90deg,#FF6B47,#FFB347);height:8px;border-radius:99px;width:${Math.round((stats.unique / totalAvailable) * 100)}%;transition:width 0.4s;"></div>
                </div>
            </div>
        `;

        // Render by category
        categoryOrder.forEach(cat => {
            const cards = kortData.filter(k => k.category === cat);
            const ownedInCat = cards.filter(k => ownedIds.has(k.id)).length;

            this.container.insertAdjacentHTML('beforeend', `
                <div style="margin-bottom:28px;">
                    <h3 style="margin:0 0 12px;font-size:17px;color:#1d1d1f;">${categoryLabels[cat] || cat} <span style="font-size:13px;color:#888;font-weight:400;">${ownedInCat}/${cards.length}</span></h3>
                    <div class="kort-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;">
                        ${cards.map(kort => this.renderAllKortCard(kort, ownedIds.has(kort.id), samling.filter(k => k.id === kort.id).length)).join('')}
                    </div>
                </div>
            `);
        });

        // Click listeners — only for owned cards
        this.container.querySelectorAll('.kort-card[data-owned="true"]').forEach(card => {
            card.addEventListener('click', () => this.showKortModal(card.dataset.kortId));
        });
    }

    /**
     * Render a single card in the "all cards" gallery
     * @param {Object} kort - Card from kortData
     * @param {boolean} owned - Whether user owns this card
     * @param {number} count - How many copies owned
     * @returns {string} HTML
     */
    renderAllKortCard(kort, owned, count) {
        const config = RARITY_CONFIG[kort.rarity] || { farge: '#a1a1a1', tekst: kort.rarity };

        if (owned) {
            const frameStyle = _rarityFrameStyle(kort.rarity, config.farge);
            return `
                <div class="kort-card" data-kort-id="${kort.id}" data-owned="true"
                    style="cursor:pointer;position:relative;border-radius:13px;${frameStyle}transition:transform 0.15s;"
                    onmouseover="this.style.transform='translateY(-3px)'"
                    onmouseout="this.style.transform=''">
                    <div style="aspect-ratio:2/3;position:relative;overflow:hidden;border-radius:10px;">
                        <img src="${kort.image}" alt="${kort.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
                        <div style="position:absolute;top:5px;right:5px;background:${config.farge};color:white;padding:3px 6px;border-radius:5px;font-size:10px;font-weight:600;">${config.tekst}</div>
                        ${kort.rarity === 'legendary' ? `<div style="position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,215,0,0.1) 50%,transparent 65%);animation:kw-shimmer 2.2s ease-in-out infinite;pointer-events:none;"></div>` : ''}
                        ${count > 1 ? `<div style="position:absolute;bottom:5px;right:5px;background:rgba(0,0,0,0.75);color:white;padding:2px 6px;border-radius:10px;font-size:11px;font-weight:700;">×${count}</div>` : ''}
                    </div>
                    <div style="padding:7px 5px;text-align:center;">
                        <p style="margin:0;font-size:11px;font-weight:600;color:#1d1d1f;line-height:1.2;">${kort.name}</p>
                    </div>
                </div>
            `;
        }

        // Not owned — greyed out, no click
        return `
            <div class="kort-card-locked" data-kort-id="${kort.id}" data-owned="false"
                style="cursor:default;position:relative;border-radius:12px;overflow:hidden;background:#f3f4f6;border:2px solid #e5e7eb;">
                <div style="aspect-ratio:2/3;position:relative;overflow:hidden;">
                    <img src="${kort.image}" alt="${kort.name}" style="width:100%;height:100%;object-fit:cover;filter:grayscale(100%) brightness(0.6);" loading="lazy">
                    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);">
                        <span style="font-size:20px;">🔒</span>
                        <span style="color:white;font-size:10px;font-weight:700;margin-top:3px;text-align:center;padding:0 4px;">Ikke vunnet</span>
                    </div>
                    <div style="position:absolute;top:5px;right:5px;background:#9ca3af;color:white;padding:3px 6px;border-radius:5px;font-size:10px;font-weight:600;">${config.emoji}</div>
                </div>
                <div style="padding:7px 5px;text-align:center;">
                    <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;line-height:1.2;">${kort.name}</p>
                </div>
            </div>
        `;
    }

    /**
     * Set sort mode
     * @param {string} mode - Sort mode
     */
    setSortMode(mode) {
        this.sortMode = mode;
        localStorage.setItem('kortSortMode', mode);
    }

    /**
     * Get sort mode from storage
     * @returns {string} - Sort mode
     */
    getSortMode() {
        return localStorage.getItem('kortSortMode') || 'nyeste';
    }
}

/**
 * Show kort win popup
 * @param {Object} kort - Won kort
 */
function _rarityFrameStyle(rarity, farge) {
    switch (rarity) {
        case 'legendary':
            return `border:3px solid ${farge};box-shadow:0 0 18px ${farge}bb,0 0 42px ${farge}44,inset 0 0 0 1px rgba(255,230,100,0.25);`;
        case 'epic':
            return `border:3px solid ${farge};box-shadow:0 0 14px ${farge}99,0 0 30px ${farge}33,inset 0 0 0 1px rgba(192,132,252,0.2);`;
        case 'rare':
            return `border:2px solid ${farge};box-shadow:0 0 10px ${farge}77,inset 0 0 0 1px rgba(96,165,250,0.15);`;
        default:
            return `border:2px solid #c8c8c8;box-shadow:0 2px 8px rgba(0,0,0,0.12);`;
    }
}

export function visGevinstPopup(kort) {
    const config = RARITY_CONFIG[kort.rarity] || RARITY_CONFIG.common;
    const isLegendary = kort.rarity === 'legendary';
    const isEpic      = kort.rarity === 'epic';
    const isRare      = kort.rarity === 'rare';

    // Inject keyframes once
    if (!document.getElementById('kortwin-kf')) {
        const s = document.createElement('style');
        s.id = 'kortwin-kf';
        s.textContent = `
            @keyframes kw-in        { from{opacity:0} to{opacity:1} }
            @keyframes kw-down      { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
            @keyframes kw-up        { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
            @keyframes kw-appear    { 0%{opacity:0;transform:scale(0.25)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
            @keyframes kw-flip      { from{transform:rotateY(0deg)} to{transform:rotateY(180deg)} }
            @keyframes kw-aura      { 0%{opacity:0;transform:scale(0.4)} 50%{opacity:1} 100%{opacity:0;transform:scale(2.2)} }
            @keyframes kw-particle  { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)} }
            @keyframes kw-rays      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes kw-flash     { 0%{opacity:0} 30%{opacity:0.35} 100%{opacity:0} }
            @keyframes kw-shimmer   { 0%{transform:translateX(-120%) skewX(-12deg)} 100%{transform:translateX(220%) skewX(-12deg)} }
            @keyframes kw-pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        `;
        document.head.appendChild(s);
    }

    const rarityColors = {
        common:    ['#c0c0c0','#e0e0e0','#a0a0a0','#d5d5d5'],
        rare:      ['#0071e3','#60a5fa','#3b82f6','#93c5fd','#bfdbfe'],
        epic:      ['#9333ea','#c084fc','#a855f7','#FFCAB8','#e9d5ff'],
        legendary: ['#f59e0b','#fde68a','#fbbf24','#fcd34d','#f97316','#fffbeb']
    };
    const colors = rarityColors[kort.rarity] || rarityColors.common;

    // Rarity-specific glow sizes
    const glowSize  = isLegendary ? '36px' : isEpic ? '24px' : isRare ? '16px' : '8px';
    const glowSize2 = isLegendary ? '70px' : isEpic ? '50px' : '0px';
    const borderW   = isLegendary ? '4px' : '3px';
    const textColor = isLegendary ? '#1a0a00' : 'white';

    // Particles (22 pieces)
    const particles = Array.from({length: 22}, (_, i) => {
        const angle = (i / 22) * 360 + Math.random() * 16;
        const dist  = 110 + Math.random() * 130;
        const px    = Math.cos(angle * Math.PI / 180) * dist;
        const py    = Math.sin(angle * Math.PI / 180) * dist;
        const size  = 5 + Math.random() * 10;
        const color = colors[i % colors.length];
        const round = Math.random() > 0.45 ? '50%' : '3px';
        const delay = (0.06 + Math.random() * 0.08).toFixed(3);
        return `<div style="position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;
            margin:${-size/2}px 0 0 ${-size/2}px;border-radius:${round};background:${color};
            --px:${px}px;--py:${py}px;
            animation:kw-particle 0.9s ease-out ${delay}s both;
            pointer-events:none;opacity:0;"></div>`;
    }).join('');

    // Legendary rays
    const rays = isLegendary ? `
        <div style="position:absolute;inset:0;overflow:hidden;opacity:0;animation:kw-in 0.6s ease 0.15s forwards;">
            <div style="position:absolute;top:50%;left:50%;width:220%;height:220%;margin:-110% 0 0 -110%;
                background:conic-gradient(from 0deg,
                    transparent 0deg, rgba(245,158,11,0.45) 8deg, transparent 18deg,
                    transparent 38deg, rgba(245,158,11,0.3)  48deg, transparent 58deg,
                    transparent 78deg, rgba(245,158,11,0.4)  88deg, transparent 98deg,
                    transparent 118deg,rgba(245,158,11,0.25) 128deg,transparent 138deg,
                    transparent 158deg,rgba(245,158,11,0.45) 168deg,transparent 178deg,
                    transparent 198deg,rgba(245,158,11,0.35) 208deg,transparent 218deg,
                    transparent 238deg,rgba(245,158,11,0.4)  248deg,transparent 258deg,
                    transparent 278deg,rgba(245,158,11,0.3)  288deg,transparent 298deg,
                    transparent 318deg,rgba(245,158,11,0.45) 328deg,transparent 338deg,
                    transparent 358deg);
                animation:kw-rays 12s linear infinite;"></div>
        </div>` : '';

    const flash = isLegendary ? `<div style="position:absolute;inset:0;background:white;pointer-events:none;
        animation:kw-flash 0.55s ease 0.08s both;"></div>` : '';

    const overlay = document.createElement('div');
    overlay.id = 'kortwin-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);display:flex;align-items:center;justify-content:center;z-index:10010;animation:kw-in 0.35s ease both;overflow:hidden;';

    overlay.innerHTML = `
        ${rays}${flash}
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;padding:24px 20px;max-width:360px;width:100%;text-align:center;">

            <p style="color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:2px;text-transform:uppercase;
                margin:0 0 20px;animation:kw-down 0.35s ease 0.25s both;">Nytt samlekort!</p>

            <!-- Card 3D scene -->
            <div style="position:relative;width:190px;height:285px;perspective:900px;margin-bottom:22px;">

                <!-- Aura burst (fires when flip completes) -->
                <div id="kortwin-aura" style="position:absolute;inset:-40px;border-radius:50%;
                    background:radial-gradient(circle,${config.farge}70 0%,transparent 65%);
                    opacity:0;pointer-events:none;"></div>

                <!-- Particles (hidden until flip) -->
                <div id="kortwin-particles" style="position:absolute;inset:0;pointer-events:none;">
                    ${particles}
                </div>

                <!-- Flipper — back starts facing user -->
                <div id="kortwin-flipper" style="width:190px;height:285px;transform-style:preserve-3d;
                    animation:kw-appear 0.55s cubic-bezier(.34,1.56,.64,1) 0.4s both;">

                    <!-- BACK -->
                    <div style="position:absolute;inset:0;border-radius:18px;backface-visibility:hidden;
                        background:linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4c1d95 65%,#1e1b4b 100%);
                        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
                        box-shadow:0 0 28px ${config.farge}88,0 10px 40px rgba(0,0,0,0.6);overflow:hidden;">
                        <div style="position:absolute;inset:0;background:linear-gradient(110deg,transparent 38%,rgba(255,255,255,0.07) 50%,transparent 62%);animation:kw-shimmer 2.2s ease-in-out infinite;"></div>
                        <div style="font-size:56px;opacity:0.65;user-select:none;">🃏</div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:2px;font-weight:700;">GLOSEMESTER</div>
                    </div>

                    <!-- FRONT (starts hidden — rotated away) -->
                    <div style="position:absolute;inset:0;border-radius:18px;backface-visibility:hidden;
                        transform:rotateY(180deg);overflow:hidden;
                        border:${borderW} solid ${config.farge};
                        box-shadow:0 0 ${glowSize} ${config.farge}cc,0 0 ${glowSize2} ${config.farge}44,0 10px 40px rgba(0,0,0,0.6),inset 0 0 0 1px rgba(255,255,255,0.18);">
                        <img src="${kort.image}" alt="${kort.name}" style="width:100%;height:100%;object-fit:cover;display:block;">
                        ${isLegendary ? `<div style="position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,215,0,0.13) 50%,transparent 65%);animation:kw-shimmer 1.9s ease-in-out infinite;pointer-events:none;"></div>` : ''}
                    </div>
                </div>
            </div>

            <!-- Navn -->
            <h2 id="kortwin-name" style="margin:0 0 6px;font-size:24px;font-weight:900;color:white;opacity:0;">
                ${kort.name}
            </h2>

            <!-- Sjeldenhet -->
            <span id="kortwin-rarity" style="display:inline-block;background:${config.farge};color:${textColor};
                padding:5px 18px;border-radius:99px;font-size:13px;font-weight:700;margin-bottom:22px;opacity:0;">
                ${config.tekst}
            </span>

            <!-- Fortsett -->
            <button id="kortwin-close" style="background:${config.farge};color:${textColor};border:none;
                border-radius:99px;padding:13px 44px;font-size:16px;font-weight:700;cursor:pointer;
                opacity:0;transition:transform 0.15s,opacity 0.15s;">
                Fortsett →
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // JS-driven sequence after card appears
    const flipper = overlay.querySelector('#kortwin-flipper');
    const aura    = overlay.querySelector('#kortwin-aura');
    const name    = overlay.querySelector('#kortwin-name');
    const rarity  = overlay.querySelector('#kortwin-rarity');
    const btn     = overlay.querySelector('#kortwin-close');

    // Flip after 1.3s — must clear the CSS animation first or it overrides the JS transform
    setTimeout(() => {
        if (!flipper) return;
        flipper.style.animation = 'none';   // stop kw-appear fill from overriding
        void flipper.offsetWidth;           // force reflow so transition picks up from current state
        flipper.style.transition = 'transform 0.65s cubic-bezier(0.4,0,0.2,1)';
        flipper.style.transform  = 'rotateY(180deg)';
    }, 1300);

    // Aura + particles fire as flip completes
    setTimeout(() => {
        if (aura) { aura.style.animation = 'kw-aura 0.85s ease-out forwards'; }
        overlay.querySelectorAll('#kortwin-particles div').forEach(p => {
            p.style.opacity = '1';
        });
    }, 1800);

    // Show name
    setTimeout(() => {
        if (name) { name.style.animation = 'kw-up 0.4s ease forwards'; }
    }, 2050);

    // Show rarity badge
    setTimeout(() => {
        if (rarity) { rarity.style.animation = 'kw-up 0.4s ease forwards'; }
    }, 2200);

    // Show button
    setTimeout(() => {
        if (btn) {
            btn.style.animation = 'kw-up 0.4s ease forwards, kw-pulse 2s ease-in-out 1s infinite';
        }
    }, 2400);

    // Close logic
    const close = () => {
        overlay.style.animation = 'kw-in 0.25s ease reverse forwards';
        setTimeout(() => overlay.remove(), 260);
    };

    btn?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    setTimeout(close, 9000);

    if (navigator.vibrate) {
        navigator.vibrate(isLegendary ? [60,40,120,40,200] : [100, 50, 100]);
    }
}

// Export globally for compatibility
window.visGevinstPopup = visGevinstPopup;
