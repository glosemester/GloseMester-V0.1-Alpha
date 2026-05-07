/* ============================================
   BASE-MODUL.JS - GloseMester v2.0
   Abstract base class for all fagmoduler
   ============================================ */

/**
 * FagModul - Base class that all subject modules must extend
 *
 * Each fag implements this interface
 * to ensure consistency across modules.
 */
export class FagModul {
    /**
     * @param {string} fagType - Type of subject ('gloser')
     */
    constructor(fagType) {
        if (new.target === FagModul) {
            throw new Error('FagModul is an abstract class and cannot be instantiated directly');
        }

        this.fagType = fagType;
        this.initialized = false;
        this.currentSession = null;
        this.eventListeners = [];
    }

    // ==================== ABSTRACT METHODS (must be implemented) ====================

    /**
     * Initialize the module
     * @abstract
     * @returns {Promise<void>}
     */
    async init() {
        throw new Error('init() must be implemented by subclass');
    }

    /**
     * Get practice data for this fag
     * @abstract
     * @returns {Object} Practice data structure
     */
    getPracticeData() {
        throw new Error('getPracticeData() must be implemented by subclass');
    }

    /**
     * Start a practice session
     * @abstract
     * @param {string} category - Practice category/level
     * @param {Object} options - Practice options
     * @returns {void}
     */
    startPractice(category, options = {}) {
        throw new Error('startPractice() must be implemented by subclass');
    }

    /**
     * Render the main practice UI
     * @abstract
     * @returns {void}
     */
    renderPracticeUI() {
        throw new Error('renderPracticeUI() must be implemented by subclass');
    }

    /**
     * Handle answer submission
     * @abstract
     * @param {any} answer - User's answer
     * @returns {Object} Result object with isCorrect, feedback, etc.
     */
    checkAnswer(answer) {
        throw new Error('checkAnswer() must be implemented by subclass');
    }

    // ==================== OPTIONAL METHODS (can be overridden) ====================

    /**
     * Get available categories/levels for this fag
     * @returns {Array<Object>} Categories with metadata
     */
    getCategories() {
        return [];
    }

    /**
     * Cleanup resources when module is unloaded
     * @returns {void}
     */
    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        // Reset state
        this.currentSession = null;
    }

    /**
     * Pause current session
     * @returns {void}
     */
    pause() {
        if (this.currentSession) {
            this.currentSession.paused = true;
        }
    }

    /**
     * Resume paused session
     * @returns {void}
     */
    resume() {
        if (this.currentSession) {
            this.currentSession.paused = false;
        }
    }

    /**
     * End current session
     * @returns {Object} Session summary
     */
    endSession() {
        if (!this.currentSession) {
            return null;
        }

        const summary = {
            fagType: this.fagType,
            category: this.currentSession.category,
            startTime: this.currentSession.startTime,
            endTime: Date.now(),
            duration: Date.now() - this.currentSession.startTime,
            totalQuestions: this.currentSession.totalQuestions || 0,
            correctAnswers: this.currentSession.correctAnswers || 0,
            score: this.calculateScore()
        };

        this.currentSession = null;
        return summary;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Calculate current session score
     * @returns {number} Score percentage (0-100)
     */
    calculateScore() {
        if (!this.currentSession || !this.currentSession.totalQuestions) {
            return 0;
        }

        const { correctAnswers, totalQuestions } = this.currentSession;
        return Math.round((correctAnswers / totalQuestions) * 100);
    }

    /**
     * Get module metadata
     * @returns {Object} Module information
     */
    getMetadata() {
        return {
            type: this.fagType,
            initialized: this.initialized,
            hasActiveSession: this.currentSession !== null,
            currentScore: this.calculateScore()
        };
    }

    /**
     * Register an event listener (for cleanup tracking)
     * @param {HTMLElement} element - DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Check if module is ready to use
     * @returns {boolean} Ready state
     */
    isReady() {
        return this.initialized;
    }

    /**
     * Get current session info
     * @returns {Object|null} Current session data
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Validate that module is initialized
     * @throws {Error} If not initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error(`${this.fagType} module not initialized. Call init() first.`);
        }
    }
}

// ==================== EXPORTS ====================

export default FagModul;
