/* ============================================
   KORT-DISPLAY.JS - GloseMester v2.6
   UI for kort-visning og galleri
   ============================================ */

import { RARITY_CONFIG } from './kort-data.js';
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
            <div class="kort-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                ${kortList.map(kort => this.renderKortCard(kort)).join('')}
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', gridHtml);

        // Attach click listeners
        this.container.querySelectorAll('.kort-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const kortId = e.currentTarget.dataset.kortId;
                this.showKortModal(kortId);
            });
        });
    }

    /**
     * Render individual kort card
     * @param {Object} kort - Kort object
     * @returns {string} - HTML string
     */
    renderKortCard(kort) {
        const config = RARITY_CONFIG[kort.rarity];

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
                <div class="kort-info" style="padding: 12px 8px; text-align: center;">
                    <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #1d1d1f;">${kort.name}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666; text-transform: capitalize;">${kort.category}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show kort modal (detailed view)
     * @param {string} kortId - Kort ID
     */
    showKortModal(kortId) {
        // TODO: Implement modal view
        console.log('Show modal for kort:', kortId);

        // For now, just show an alert
        const samling = KortReward.getUserCollection();
        const kort = samling.find(k => k.id === kortId);

        if (kort) {
            const count = KortReward.getKortCount(kortId);
            alert(`${kort.name}\n\nKategori: ${kort.category}\nSjeldenhet: ${kort.rarity}\nAntall: ${count}`);
        }
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
