/* ============================================
   KORT-SYSTEM.JS - GloseMester v2.6
   Main entry point for kort-systemet
   ============================================ */

// Re-export all kort-related functionality
export * from './kort-data.js';
export * from './kort-reward.js';
export * from './kort-display.js';

// Import classes for convenience
import { KortReward } from './kort-reward.js';
import { KortGalleri, visGevinstPopup } from './kort-display.js';
import { kortData, RARITIES, CATEGORIES, RARITY_CONFIG } from './kort-data.js';

/**
 * KortSystem - Main class for managing kort system
 */
export class KortSystem {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize kort system
     */
    init() {
        if (this.initialized) {
            console.warn('KortSystem already initialized');
            return;
        }

        console.log('🎴 Initializing KortSystem...');
        console.log(`📊 Total kort: ${kortData.length}`);

        this.initialized = true;
        console.log('✅ KortSystem initialized');
    }

    /**
     * Handle quiz completion and award kort
     * @param {number} correctCount - Number of correct answers
     * @param {number} totalQuestions - Total questions
     * @param {string} fagType - Fag type
     * @param {number} nivå - Optional: Level (for category filtering)
     * @returns {Object|null} - Won kort or null
     */
    async handleQuizCompletion(correctCount, totalQuestions, fagType = 'gloser', nivå = null) {
        console.log(`🎮 Quiz completed: ${correctCount}/${totalQuestions} (${Math.round((correctCount/totalQuestions)*100)}%)`);

        // Check win condition
        const kort = KortReward.checkWinCondition(correctCount, totalQuestions, fagType);

        if (!kort) {
            console.log('❌ No kort won this time');
            return null;
        }

        // Award kort
        const awarded = KortReward.awardKort(kort);

        if (!awarded) {
            console.error('Failed to award kort');
            return null;
        }

        // Show popup
        visGevinstPopup(kort);

        return kort;
    }

    /**
     * Create and render gallery
     * @param {string} containerId - Container element ID
     * @param {Object} options - Gallery options
     * @returns {KortGalleri} - Gallery instance
     */
    createGallery(containerId, options = {}) {
        const gallery = new KortGalleri(containerId);
        gallery.render(options);
        return gallery;
    }

    /**
     * Create gallery showing all 152 cards — greyed out if not owned
     * @param {string} containerId - Container element ID
     * @returns {KortGalleri} - Gallery instance
     */
    createAllKortGallery(containerId) {
        const gallery = new KortGalleri(containerId);
        gallery.renderAll();
        return gallery;
    }

    /**
     * Get user statistics
     * @returns {Object} - User stats
     */
    getUserStats() {
        const stats = KortReward.getCollectionStats();
        const totalKort = kortData.length;
        const completionRate = Math.round((stats.unique / totalKort) * 100);

        return {
            ...stats,
            totalAvailable: totalKort,
            completionRate: completionRate
        };
    }

    /**
     * Check if kort system is ready
     * @returns {boolean} - Is ready
     */
    isReady() {
        return this.initialized && kortData.length > 0;
    }
}

// ==================== SINGLETON INSTANCE ====================

// Create singleton instance
export const kortSystem = new KortSystem();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
    kortSystem.init();

    // Make globally available (for compatibility)
    window.KortSystem = kortSystem;
    window.KortReward = KortReward;
    window.KortGalleri = KortGalleri;
}

// ==================== CONVENIENCE EXPORTS ====================

/**
 * Award kort after quiz (convenience function)
 * @param {number} correctCount - Correct answers
 * @param {number} totalQuestions - Total questions
 * @param {string} fagType - Fag type
 * @returns {Promise<Object|null>} - Won kort or null
 */
export async function awardKortAfterQuiz(correctCount, totalQuestions, fagType = 'gloser') {
    return kortSystem.handleQuizCompletion(correctCount, totalQuestions, fagType);
}

/**
 * Create kort gallery (convenience function)
 * @param {string} containerId - Container ID
 * @param {Object} options - Options
 * @returns {KortGalleri} - Gallery instance
 */
export function createKortGallery(containerId, options = {}) {
    return kortSystem.createGallery(containerId, options);
}

/**
 * Get user kort stats (convenience function)
 * @returns {Object} - Stats
 */
export function getUserKortStats() {
    return kortSystem.getUserStats();
}

// ==================== DEPRECATED EXPORTS (for backwards compatibility) ====================

// These exports maintain compatibility with old code
export const getSamling = () => KortReward.getUserCollection();
export const lagreBrukerKort = (kort) => KortReward.awardKort(kort);
export const hentTilfeldigKort = (fagType, nivå) => {
    const rarity = KortReward.calculateRarity(90); // Default to 90% for manual calls
    return KortReward.getRandomKort(rarity, fagType, nivå);
};

console.log('🎴 Kort System v2.0 loaded');
