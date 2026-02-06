/* ============================================
   KORT-REWARD.JS - Mester Suite v2.0
   Belønningssystem for kort (fag-agnostisk)
   ============================================ */

import { kortData, RARITIES, CATEGORIES } from './kort-data.js';

/**
 * KortReward - Håndterer kort-belønning for alle fag
 */
export class KortReward {
    /**
     * Check if user should win a kort
     * @param {number} correctCount - Number of correct answers
     * @param {number} totalQuestions - Total questions in quiz
     * @param {string} fagType - 'gloser', 'matte', or 'norsk'
     * @returns {Object|null} - Won kort or null
     */
    static checkWinCondition(correctCount, totalQuestions, fagType = 'gloser') {
        const percentage = Math.round((correctCount / totalQuestions) * 100);

        // Win condition: 80% or higher
        if (percentage < 80) {
            console.log(`📉 Score too low: ${percentage}% (need 80%+)`);
            return null;
        }

        console.log(`✅ Win condition met: ${percentage}%`);

        // Get rarity based on score
        const rarity = this.calculateRarity(percentage);

        // Get random kort
        const kort = this.getRandomKort(rarity, fagType);

        return kort;
    }

    /**
     * Calculate rarity based on percentage score
     * @param {number} percentage - Score percentage (0-100)
     * @returns {string} - Rarity type
     */
    static calculateRarity(percentage) {
        const rand = Math.random() * 100;

        // Perfect score (100%) - boosted legendary chance
        if (percentage === 100) {
            if (rand > 95) return RARITIES.LEGENDARY;  // 5% legendary
            if (rand > 80) return RARITIES.EPIC;       // 15% epic
            if (rand > 50) return RARITIES.RARE;       // 30% rare
            return RARITIES.COMMON;                     // 50% common
        }

        // Excellent score (90-99%) - good chances
        if (percentage >= 90) {
            if (rand > 97) return RARITIES.LEGENDARY;  // 3% legendary
            if (rand > 87) return RARITIES.EPIC;       // 10% epic
            if (rand > 65) return RARITIES.RARE;       // 22% rare
            return RARITIES.COMMON;                     // 65% common
        }

        // Good score (80-89%) - standard odds
        if (rand > 99) return RARITIES.LEGENDARY;      // 1% legendary
        if (rand > 96) return RARITIES.EPIC;           // 3% epic
        if (rand > 85) return RARITIES.RARE;           // 11% rare
        return RARITIES.COMMON;                         // 85% common
    }

    /**
     * Get random kort from pool
     * @param {string} rarity - Target rarity
     * @param {string} fagType - Fag type ('gloser', 'matte', 'norsk')
     * @param {number} nivå - Optional: Level (for category filtering)
     * @returns {Object} - Kort object
     */
    static getRandomKort(rarity, fagType = 'gloser', nivå = null) {
        // Filter kort by fag
        let pool = kortData.filter(kort => kort.fag === fagType);

        if (pool.length === 0) {
            console.warn(`⚠️ No kort found for fag: ${fagType}, using all kort`);
            pool = kortData;
        }

        // Level-based category filtering (for GloseMester)
        if (fagType === 'gloser' && nivå) {
            const availableCategories = this.getCategoriesForLevel(nivå);
            pool = pool.filter(kort => availableCategories.includes(kort.category));
        }

        // Filter by rarity
        let muligeKort = pool.filter(kort => kort.rarity === rarity);

        // Fallback: if no kort of target rarity, use all kort from pool
        if (muligeKort.length === 0) {
            console.warn(`⚠️ No ${rarity} kort found, using all available kort`);
            muligeKort = pool;
        }

        // Random selection
        const randomIndex = Math.floor(Math.random() * muligeKort.length);
        const selectedKort = muligeKort[randomIndex];

        console.log(`🎁 Won kort: ${selectedKort.name} (${selectedKort.rarity})`);

        return selectedKort;
    }

    /**
     * Get available categories for level (GloseMester specific)
     * @param {number|string} nivå - Level number or string
     * @returns {Array<string>} - Available categories
     */
    static getCategoriesForLevel(nivå) {
        const level = typeof nivå === 'string' ? parseInt(nivå.replace('niva', '')) : nivå;

        const allCategories = [
            CATEGORIES.BILER,
            CATEGORIES.DINOSAURER,
            CATEGORIES.DYR,
            CATEGORIES.GUDER
        ];

        // Guder-kort kun på nivå 3 og 4
        if (level === 1 || level === 2) {
            return allCategories.filter(cat => cat !== CATEGORIES.GUDER);
        }

        return allCategories;
    }

    /**
     * Award kort to user (saves to localStorage)
     * @param {Object} kort - Kort object to award
     * @param {string} userId - Optional: User ID (for future Firestore sync)
     * @returns {boolean} - Success
     */
    static awardKort(kort, userId = null) {
        try {
            // Get existing collection
            const samlingStr = localStorage.getItem('kortSamling');
            const samling = samlingStr ? JSON.parse(samlingStr) : [];

            // Add kort to collection (duplicates allowed)
            samling.push(kort);

            // Save to localStorage
            localStorage.setItem('kortSamling', JSON.stringify(samling));

            console.log(`✅ Kort awarded: ${kort.name} (Total: ${samling.length})`);

            // TODO: Sync to Firestore if userId provided
            if (userId) {
                this.syncToFirestore(userId, kort);
            }

            return true;
        } catch (error) {
            console.error('❌ Error awarding kort:', error);
            return false;
        }
    }

    /**
     * Sync kort to Firestore (TODO: implement)
     * @param {string} userId - User ID
     * @param {Object} kort - Kort to sync
     */
    static async syncToFirestore(userId, kort) {
        // TODO: Implement Firestore sync
        console.log('🔄 Firestore sync not yet implemented');
    }

    /**
     * Get user's kort collection
     * @returns {Array<Object>} - Array of kort
     */
    static getUserCollection() {
        try {
            const samlingStr = localStorage.getItem('kortSamling');
            return samlingStr ? JSON.parse(samlingStr) : [];
        } catch (error) {
            console.error('Error loading collection:', error);
            return [];
        }
    }

    /**
     * Get collection statistics
     * @returns {Object} - Statistics
     */
    static getCollectionStats() {
        const samling = this.getUserCollection();

        const stats = {
            total: samling.length,
            unique: new Set(samling.map(k => k.id)).size,
            byRarity: {},
            byCategory: {},
            byFag: {}
        };

        samling.forEach(kort => {
            // By rarity
            stats.byRarity[kort.rarity] = (stats.byRarity[kort.rarity] || 0) + 1;

            // By category
            stats.byCategory[kort.category] = (stats.byCategory[kort.category] || 0) + 1;

            // By fag
            stats.byFag[kort.fag] = (stats.byFag[kort.fag] || 0) + 1;
        });

        return stats;
    }

    /**
     * Check if user has a specific kort
     * @param {string} kortId - Kort ID to check
     * @returns {boolean} - Has kort
     */
    static hasKort(kortId) {
        const samling = this.getUserCollection();
        return samling.some(kort => kort.id === kortId);
    }

    /**
     * Get kort count for a specific ID
     * @param {string} kortId - Kort ID
     * @returns {number} - Count
     */
    static getKortCount(kortId) {
        const samling = this.getUserCollection();
        return samling.filter(kort => kort.id === kortId).length;
    }

    /**
     * Clear all kort (for testing/reset)
     * @returns {boolean} - Success
     */
    static clearCollection() {
        try {
            localStorage.removeItem('kortSamling');
            console.log('🗑️ Collection cleared');
            return true;
        } catch (error) {
            console.error('Error clearing collection:', error);
            return false;
        }
    }
}

// Export singleton methods
export const {
    checkWinCondition,
    calculateRarity,
    getRandomKort,
    awardKort,
    getUserCollection,
    getCollectionStats,
    hasKort,
    getKortCount,
    clearCollection
} = KortReward;
