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
                <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                <h3 style="color: #1d1d1f; margin-bottom: 10px;">Ingen kort ennå</h3>
                <p style="color: #666;">Øv mer for å vinne kort til samlingen din!</p>
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
                        <span class="stat-label">🌟 Legendary</span>
                    </div>
                    <div class="stat-box rarity-epic">
                        <span class="stat-value">${stats.byRarity.epic || 0}</span>
                        <span class="stat-label">💎 Epic</span>
                    </div>
                    <div class="stat-box rarity-rare">
                        <span class="stat-value">${stats.byRarity.rare || 0}</span>
                        <span class="stat-label">✨ Rare</span>
                    </div>
                    <div class="stat-box rarity-common">
                        <span class="stat-value">${stats.byRarity.common || 0}</span>
                        <span class="stat-label">📦 Common</span>
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
                <div style="font-size:40px;margin-bottom:8px;">♻️</div>
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

        return `
            <div class="kort-card rarity-${kort.rarity}" data-kort-id="${kort.id}" style="cursor: pointer; position: relative;">
                <div class="kort-image-container" style="aspect-ratio: 2/3; background: #f5f5f5; border-radius: 12px; overflow: hidden; position: relative;">
                    <img src="${kort.image}" alt="${kort.name}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                    <div class="kort-rarity-badge" style="position: absolute; top: 8px; right: 8px; background: ${config.farge}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${config.emoji} ${config.tekst}
                    </div>
                    ${kort.count > 1 ? `
                        <div class="kort-count-badge" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 50%; font-size: 12px; font-weight: 700;">
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
                            ♻️ Pant 2 dubletter
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

        const config = RARITY_CONFIG[kort.rarity] || { farge: '#7C3AED', emoji: '🃏', tekst: kort.rarity };
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
                    ${config.emoji} ${config.tekst}
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
        const categoryLabels = { biler: '🚗 Biler', dinosaurer: '🦕 Dinosaurer', dyr: '🐾 Dyr', guder: '⚡ Guder' };
        const categoryOrder = ['biler', 'dinosaurer', 'dyr', 'guder'];

        // Summary header
        this.container.innerHTML = `
            <div style="margin-bottom:20px;padding:16px;background:rgba(124,58,237,0.08);border-radius:16px;text-align:center;">
                <span style="font-size:22px;font-weight:700;color:#7C3AED;">${stats.unique}</span>
                <span style="color:#888;font-size:15px;"> / ${totalAvailable} unike kort vunnet</span>
                <div style="margin-top:8px;background:#e5e7eb;border-radius:99px;height:8px;max-width:300px;margin-left:auto;margin-right:auto;">
                    <div style="background:linear-gradient(90deg,#7C3AED,#A78BFA);height:8px;border-radius:99px;width:${Math.round((stats.unique / totalAvailable) * 100)}%;transition:width 0.4s;"></div>
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
        const config = RARITY_CONFIG[kort.rarity] || { farge: '#a1a1a1', emoji: '📦', tekst: kort.rarity };

        if (owned) {
            return `
                <div class="kort-card" data-kort-id="${kort.id}" data-owned="true"
                    style="cursor:pointer;position:relative;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.10);border:2px solid ${config.farge}30;transition:transform 0.15s,box-shadow 0.15s;"
                    onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.15)'"
                    onmouseout="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.10)'">
                    <div style="aspect-ratio:2/3;position:relative;overflow:hidden;">
                        <img src="${kort.image}" alt="${kort.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
                        <div style="position:absolute;top:5px;right:5px;background:${config.farge};color:white;padding:3px 6px;border-radius:5px;font-size:10px;font-weight:600;">${config.emoji}</div>
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
export function visGevinstPopup(kort) {
    const config = RARITY_CONFIG[kort.rarity];

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'kort-win-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div class="kort-win-content" style="background: white; border-radius: 20px; padding: 40px; max-width: 400px; text-align: center; animation: scaleIn 0.3s ease;">
            <div style="font-size: 64px; margin-bottom: 20px;">${config.emoji}</div>
            <h2 style="color: ${config.farge}; margin: 0 0 10px 0;">Du vant et kort!</h2>
            <div style="margin: 20px 0;">
                <img src="${kort.image}" alt="${kort.name}" style="width: 200px; height: 300px; object-fit: cover; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            </div>
            <h3 style="margin: 15px 0 5px 0; color: #1d1d1f;">${kort.name}</h3>
            <p style="margin: 0 0 10px 0; color: #666; text-transform: capitalize;">${kort.category}</p>
            <div style="display: inline-block; background: ${config.farge}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
                ${config.tekst}
            </div>
            <button onclick="this.closest('.kort-win-modal').remove()" class="btn-primary" style="width: 100%; padding: 14px; font-size: 16px;">
                Lukk
            </button>
        </div>
    `;

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Add to DOM
    document.body.appendChild(modal);

    // Play sound and confetti (if available)
    if (typeof window.spillLyd === 'function') {
        window.spillLyd('fanfare');
    }

    if (typeof window.lagConfetti === 'function') {
        window.lagConfetti();
    }

    // Vibrate (if supported)
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Export globally for compatibility
window.visGevinstPopup = visGevinstPopup;
