/* ============================================
   GLOSEMESTER.JS - Mester Suite v2.0
   GloseMester implementation of FagModul
   ============================================ */

import { FagModul } from '../base-modul.js';
import {
    vocabularyData,
    getTotalWordCount,
    getWordCountForLevel,
    getLevelMetadata,
    getWordsForLevel,
    getAvailableLevels
} from './vocabulary-data.js';
import { kortSystem } from '../../core/kort/kort-system.js';

/**
 * GloseMester - Norwegian-English vocabulary learning module
 */
export class GloseMester extends FagModul {
    constructor() {
        super('gloser');

        this.levels = [];
        this.currentLevel = null;
        this.currentWords = [];
        this.currentIndex = 0;
        this.direction = 'en'; // 'en' = Norwegian->English, 'no' = English->Norwegian
        this.correctAnswers = 0;
        this.totalQuestions = 0;
    }

    // ==================== REQUIRED METHODS ====================

    /**
     * Initialize GloseMester
     * @override
     */
    async init() {
        console.log('📚 Initializing GloseMester...');

        // Load available levels
        this.levels = getAvailableLevels();

        // Render UI
        this.renderPracticeUI();

        this.initialized = true;
        console.log('✅ GloseMester initialized');
        console.log(`📊 Total vocabulary: ${getTotalWordCount()} words across ${this.levels.length} levels`);

        return true;
    }

    /**
     * Get practice data
     * @override
     */
    getPracticeData() {
        return vocabularyData;
    }

    /**
     * Start a practice session
     * @override
     * @param {string} level - Level to practice (niva1-4)
     * @param {Object} options - Practice options
     */
    startPractice(level, options = {}) {
        this.ensureInitialized();

        if (!vocabularyData[level]) {
            console.error(`Invalid level: ${level}`);
            return;
        }

        console.log(`🎯 Starting practice: ${level}`);

        // Set up session
        this.currentLevel = level;
        this.currentWords = this.shuffleArray([...getWordsForLevel(level)]);
        this.currentIndex = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.direction = options.direction || 'en';

        // Create session object
        this.currentSession = {
            category: level,
            startTime: Date.now(),
            totalQuestions: 0,
            correctAnswers: 0,
            paused: false,
            words: this.currentWords,
            direction: this.direction
        };

        // Render practice UI
        this.renderQuizUI();

        // Show first question
        this.showNextQuestion();
    }

    /**
     * Render the main practice UI (level selection)
     * @override
     */
    renderPracticeUI() {
        const container = document.getElementById('app');
        if (!container) {
            console.error('App container not found');
            return;
        }

        let html = `
            <div class="glosemester-container">
                <header class="fag-header">
                    <h1>📚 GloseMester</h1>
                    <p>Velg nivå for å begynne å øve</p>
                </header>

                <div class="level-grid">
        `;

        this.levels.forEach(level => {
            const metadata = getLevelMetadata(level);
            const wordCount = getWordCountForLevel(level);

            html += `
                <div class="level-card" data-level="${level}">
                    <div class="level-header">
                        <h3>${metadata.name}</h3>
                        <span class="level-badge">${metadata.description}</span>
                    </div>
                    <div class="level-stats">
                        <span class="word-count">${wordCount} ord</span>
                        ${metadata.hasImages ? '<span class="has-images">🖼️ Med bilder</span>' : ''}
                    </div>
                    <button class="btn-primary start-practice-btn" data-level="${level}">
                        Start øving
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Attach event listeners
        container.querySelectorAll('.start-practice-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const level = e.target.dataset.level;
                this.startPractice(level);
            });
        });
    }

    /**
     * Check if answer is correct
     * @override
     * @param {string} answer - User's answer
     * @returns {Object} Result object
     */
    checkAnswer(answer) {
        if (!this.currentSession || this.currentIndex >= this.currentWords.length) {
            return { isCorrect: false, feedback: 'No active session' };
        }

        const currentWord = this.currentWords[this.currentIndex];
        const correctAnswer = this.direction === 'en' ? currentWord.e : currentWord.s;

        // Normalize answers for comparison
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedCorrect = correctAnswer.toLowerCase();

        const isCorrect = normalizedAnswer === normalizedCorrect;

        // Update stats
        this.totalQuestions++;
        this.currentSession.totalQuestions++;

        if (isCorrect) {
            this.correctAnswers++;
            this.currentSession.correctAnswers++;
        }

        return {
            isCorrect,
            correctAnswer,
            userAnswer: answer,
            feedback: isCorrect ? 'Riktig!' : `Feil. Riktig svar: ${correctAnswer}`,
            currentWord
        };
    }

    // ==================== OPTIONAL OVERRIDES ====================

    /**
     * Get available categories/levels
     * @override
     */
    getCategories() {
        return this.levels.map(level => {
            const metadata = getLevelMetadata(level);
            return {
                id: level,
                name: metadata.name,
                description: metadata.description,
                wordCount: metadata.wordCount,
                hasImages: metadata.hasImages
            };
        });
    }

    /**
     * End current session and award kort if earned
     * @override
     */
    async endSession() {
        if (!this.currentSession) {
            return null;
        }

        const summary = super.endSession();

        // Check if user won a kort
        if (summary.score >= 80) {
            console.log(`🎁 Score ${summary.score}% - Checking for kort...`);
            try {
                const kort = await kortSystem.handleQuizCompletion(
                    summary.correctAnswers,
                    summary.totalQuestions,
                    'gloser',
                    this.currentLevel
                );

                if (kort) {
                    summary.wonKort = kort;
                    console.log(`✅ Won kort: ${kort.name}`);
                }
            } catch (error) {
                console.error('Error awarding kort:', error);
            }
        }

        // Reset current level
        this.currentLevel = null;
        this.currentWords = [];
        this.currentIndex = 0;

        return summary;
    }

    // ==================== GLOSEMESTER-SPECIFIC METHODS ====================

    /**
     * Render the quiz UI
     */
    renderQuizUI() {
        const container = document.getElementById('app');
        if (!container) return;

        const metadata = getLevelMetadata(this.currentLevel);

        container.innerHTML = `
            <div class="glosemester-quiz">
                <header class="quiz-header">
                    <button class="btn-back" id="quit-quiz">← Tilbake</button>
                    <div class="quiz-info">
                        <h2>${metadata.name}</h2>
                        <div class="quiz-stats">
                            <span id="quiz-progress">0 / ${this.currentWords.length}</span>
                            <span id="quiz-score">Riktige: 0</span>
                        </div>
                    </div>
                    <div class="direction-toggle">
                        <button class="lang-btn ${this.direction === 'en' ? 'active' : ''}" data-direction="en">
                            NO → EN
                        </button>
                        <button class="lang-btn ${this.direction === 'no' ? 'active' : ''}" data-direction="no">
                            EN → NO
                        </button>
                    </div>
                </header>

                <div class="quiz-content">
                    <div class="question-container">
                        <div id="question-word" class="question-word"></div>
                        <div id="word-image" class="word-image"></div>
                    </div>

                    <div class="answer-container">
                        <input
                            type="text"
                            id="answer-input"
                            class="answer-input"
                            placeholder="Skriv svaret her..."
                            autocomplete="off"
                            autocorrect="off"
                            autocapitalize="off"
                        />
                        <button class="btn-primary btn-check" id="check-answer">
                            Sjekk svar
                        </button>
                    </div>

                    <div id="feedback" class="feedback"></div>
                </div>

                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `;

        // Attach event listeners
        const quitBtn = document.getElementById('quit-quiz');
        const checkBtn = document.getElementById('check-answer');
        const input = document.getElementById('answer-input');
        const langBtns = container.querySelectorAll('.lang-btn');

        this.addEventListener(quitBtn, 'click', () => this.handleQuit());
        this.addEventListener(checkBtn, 'click', () => this.handleCheckAnswer());
        this.addEventListener(input, 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCheckAnswer();
            }
        });

        langBtns.forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                this.changeDirection(e.target.dataset.direction);
            });
        });

        // Focus input
        input.focus();
    }

    /**
     * Show next question
     */
    showNextQuestion() {
        if (this.currentIndex >= this.currentWords.length) {
            // Quiz complete
            this.handleQuizComplete();
            return;
        }

        const word = this.currentWords[this.currentIndex];
        const questionWord = this.direction === 'en' ? word.s : word.e;

        // Update question
        const questionEl = document.getElementById('question-word');
        if (questionEl) {
            questionEl.textContent = questionWord;
        }

        // Show image if available (and direction is NO->EN)
        const imageEl = document.getElementById('word-image');
        if (imageEl) {
            if (word.image && this.direction === 'en') {
                imageEl.innerHTML = `<img src="${word.image}" alt="${word.s}" />`;
                imageEl.style.display = 'block';
            } else {
                imageEl.innerHTML = '';
                imageEl.style.display = 'none';
            }
        }

        // Clear input and feedback
        const input = document.getElementById('answer-input');
        if (input) {
            input.value = '';
            input.focus();
        }

        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'feedback';
        }

        // Update progress
        this.updateProgress();
    }

    /**
     * Handle check answer button click
     */
    handleCheckAnswer() {
        const input = document.getElementById('answer-input');
        if (!input || !input.value.trim()) return;

        const result = this.checkAnswer(input.value);

        // Show feedback
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = result.feedback;
            feedback.className = `feedback ${result.isCorrect ? 'correct' : 'incorrect'}`;
        }

        // Update stats
        this.updateProgress();

        // Move to next question after delay
        setTimeout(() => {
            this.currentIndex++;
            this.showNextQuestion();
        }, result.isCorrect ? 800 : 2000);
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const progressText = document.getElementById('quiz-progress');
        if (progressText) {
            progressText.textContent = `${this.currentIndex} / ${this.currentWords.length}`;
        }

        const scoreText = document.getElementById('quiz-score');
        if (scoreText) {
            scoreText.textContent = `Riktige: ${this.correctAnswers}`;
        }

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const percent = (this.currentIndex / this.currentWords.length) * 100;
            progressFill.style.width = `${percent}%`;
        }
    }

    /**
     * Handle quiz completion
     */
    async handleQuizComplete() {
        const summary = await this.endSession();

        const container = document.getElementById('app');
        if (!container) return;

        const percentage = summary.score;
        const wonKort = summary.wonKort;

        container.innerHTML = `
            <div class="quiz-results">
                <h2>🎉 Bra jobba!</h2>
                <div class="result-stats">
                    <div class="stat-box">
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-label">Score</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${summary.correctAnswers}/${summary.totalQuestions}</div>
                        <div class="stat-label">Riktige svar</div>
                    </div>
                </div>

                ${wonKort ? `
                    <div class="kort-won">
                        <p>🎁 Du vant et kort!</p>
                        <p>${wonKort.name}</p>
                    </div>
                ` : ''}

                <div class="result-actions">
                    <button class="btn-primary" id="practice-again">Øv igjen</button>
                    <button class="btn-secondary" id="back-to-levels">Velg nytt nivå</button>
                </div>
            </div>
        `;

        // Attach event listeners
        const practiceAgainBtn = document.getElementById('practice-again');
        const backBtn = document.getElementById('back-to-levels');

        if (practiceAgainBtn) {
            this.addEventListener(practiceAgainBtn, 'click', () => {
                this.startPractice(summary.category);
            });
        }

        if (backBtn) {
            this.addEventListener(backBtn, 'click', () => {
                this.renderPracticeUI();
            });
        }
    }

    /**
     * Handle quit button
     */
    async handleQuit() {
        if (confirm('Er du sikker på at du vil avslutte?')) {
            await this.endSession();
            this.renderPracticeUI();
        }
    }

    /**
     * Change practice direction
     * @param {string} direction - 'en' or 'no'
     */
    changeDirection(direction) {
        if (this.direction === direction) return;

        this.direction = direction;

        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.direction === direction);
        });

        // Restart current level
        this.startPractice(this.currentLevel, { direction });
    }

    /**
     * Shuffle array (Fisher-Yates algorithm)
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Export singleton instance
export const glosemester = new GloseMester();

// Make globally available (for debugging)
if (typeof window !== 'undefined') {
    window.GloseMester = GloseMester;
    window.glosemester = glosemester;
}

console.log('📚 GloseMester module loaded');
