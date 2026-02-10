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
import { visToast, vibrer, lesOpp } from '../../core/utils/feedback.js';

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
        this.sessionCorrect = 0; // Correct answers in current continuous session (for kort rewards)
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
                    <!-- 10-box progress tracker -->
                    <div id="kort-progress" class="kort-progress-container"></div>

                    <div class="question-container">
                        <div id="question-word" class="question-word"></div>
                        <div id="word-image" class="word-image"></div>
                    </div>

                    <!-- Skriving modus -->
                    <div class="answer-container" id="answer-input-container">
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

                    <!-- Flervalg modus -->
                    <div class="answer-alternatives" id="answer-alternatives" style="display: none;">
                        <!-- Will be populated dynamically -->
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

        // Determine if this should be multiple choice or typing
        const isMultipleChoice = this.shouldBeMultipleChoice();

        const inputContainer = document.getElementById('answer-input-container');
        const alternativesContainer = document.getElementById('answer-alternatives');

        if (isMultipleChoice) {
            // Show multiple choice
            inputContainer.style.display = 'none';
            alternativesContainer.style.display = 'grid';
            this.renderMultipleChoice(word);
        } else {
            // Show typing input
            inputContainer.style.display = 'flex';
            alternativesContainer.style.display = 'none';

            const input = document.getElementById('answer-input');
            if (input) {
                input.value = '';
                input.focus();
                input.disabled = false;
            }
        }

        // Clear feedback
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'feedback';
        }

        // Update progress (including kort progress tracker)
        this.updateProgress();
    }

    /**
     * Determine if question should be multiple choice based on level
     * @returns {boolean}
     */
    shouldBeMultipleChoice() {
        // niva1 and niva2: 100% multiple choice
        if (this.currentLevel === 'niva1' || this.currentLevel === 'niva2') {
            return true;
        }
        // niva4: 20% multiple choice, 80% typing
        else if (this.currentLevel === 'niva4') {
            return Math.random() < 0.2;
        }
        // niva3: 50/50
        else {
            return Math.random() < 0.5;
        }
    }

    /**
     * Render multiple choice alternatives
     * @param {Object} correctWord - The correct word object
     */
    renderMultipleChoice(correctWord) {
        const container = document.getElementById('answer-alternatives');
        if (!container) return;

        // Generate alternatives (including correct answer)
        let alternatives = [correctWord];
        const checkKey = this.direction === 'en' ? 'e' : 's';

        // Add 3 random wrong answers
        let attempts = 0;
        while (alternatives.length < 4 && attempts < 50) {
            const randomWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
            if (!alternatives.some(alt => alt[checkKey] === randomWord[checkKey])) {
                alternatives.push(randomWord);
            }
            attempts++;
        }

        // Shuffle alternatives
        alternatives = this.shuffleArray(alternatives);

        // Render buttons
        container.innerHTML = '';
        container.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px;';

        alternatives.forEach(alt => {
            const answerText = this.direction === 'en' ? alt.e : alt.s;
            const lang = this.direction === 'en' ? 'en-US' : 'no-NO';

            const btn = document.createElement('button');
            btn.className = 'btn-secondary alternative-btn';
            btn.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; text-align: left; font-size: 16px; font-weight: 600;';

            btn.innerHTML = `
                <span style="pointer-events: none;">${answerText}</span>
                <div class="speaker-btn-inline"
                     onclick="event.stopPropagation(); window.MesterUtils.lesOpp('${answerText.replace(/'/g, "\\'")}', '${lang}')"
                     style="font-size: 20px; cursor: pointer; padding: 6px 10px; background: rgba(0,0,0,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    🔊
                </div>
            `;

            this.addEventListener(btn, 'click', () => this.handleMultipleChoiceAnswer(alt));
            container.appendChild(btn);
        });
    }

    /**
     * Handle multiple choice answer selection
     * @param {Object} selectedWord - The selected word object
     */
    async handleMultipleChoiceAnswer(selectedWord) {
        const correctWord = this.currentWords[this.currentIndex];
        const isCorrect = selectedWord.s === correctWord.s;

        // Disable all buttons
        const buttons = document.querySelectorAll('.alternative-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (isCorrect) {
            this.sessionCorrect++;
            this.correctAnswers++;
            this.totalQuestions++;

            // Show success feedback
            const feedback = document.getElementById('feedback');
            if (feedback) {
                feedback.textContent = '✅ Riktig!';
                feedback.className = 'feedback correct';
            }

            // Update progress
            this.updateProgress();

            // Check for kort reward
            if (this.sessionCorrect > 0 && this.sessionCorrect % 10 === 0) {
                await this.handleKortReward();
            }

            // Move to next question
            setTimeout(() => {
                this.currentIndex++;
                this.showNextQuestion();
            }, 800);
        } else {
            this.totalQuestions++;

            // Wrong answer - vibrate and show popup
            vibrer(200);

            const correctAnswer = this.direction === 'en' ? correctWord.e : correctWord.s;
            this.showWrongAnswerPopup(correctAnswer);
        }
    }

    /**
     * Handle check answer button click
     */
    async handleCheckAnswer() {
        const input = document.getElementById('answer-input');
        if (!input || !input.value.trim()) return;

        const result = this.checkAnswer(input.value);

        // Show feedback
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = result.feedback;
            feedback.className = `feedback ${result.isCorrect ? 'correct' : 'incorrect'}`;
        }

        // If correct, increment session correct and check for kort reward
        if (result.isCorrect) {
            this.sessionCorrect++;

            // Update stats
            this.updateProgress();

            // Check for kort reward every 10 correct answers
            if (this.sessionCorrect > 0 && this.sessionCorrect % 10 === 0) {
                await this.handleKortReward();
            }

            // Move to next question after delay
            setTimeout(() => {
                this.currentIndex++;
                this.showNextQuestion();
            }, 800);
        } else {
            // Wrong answer - vibrate and show error popup
            vibrer(200);
            this.showWrongAnswerPopup(result.correctAnswer);
        }
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

        // Update 10-box kort progress
        this.updateKortProgress();
    }

    /**
     * Update 10-box kort progress tracker
     */
    updateKortProgress() {
        const container = document.getElementById('kort-progress');
        if (!container) return;

        const filledBoxes = (this.sessionCorrect % 10 === 0 && this.sessionCorrect > 0) ? 10 : this.sessionCorrect % 10;
        const totalBoxes = 10;

        let boxesHTML = '';
        for (let i = 0; i < totalBoxes; i++) {
            const isFilled = i < filledBoxes;
            boxesHTML += `
                <div class="progress-box ${isFilled ? 'filled' : ''}"
                     style="flex: 1; height: 12px; background: ${isFilled ? 'var(--sunny-yellow, #FBBF24)' : 'rgba(255,255,255,0.3)'};
                            border-radius: 6px; transition: all 0.3s ease;
                            ${isFilled ? 'box-shadow: 0 0 12px var(--sunny-yellow, #FBBF24);' : ''}">
                </div>
            `;
        }

        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: rgba(124, 58, 237, 0.1); border-radius: var(--radius-md, 20px);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--text-dark, #1F2937);">
                    <span>🎁 MOT NYTT KORT:</span>
                    <span>${filledBoxes} / 10</span>
                </div>
                <div class="progress-boxes" style="display: flex; gap: 6px;">
                    ${boxesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Handle kort reward (every 10 correct answers)
     */
    async handleKortReward() {
        console.log('🎁 10 correct answers! Checking for kort reward...');

        try {
            const kort = await kortSystem.getRandomKort('gloser', this.currentLevel);

            if (kort) {
                // Show kort reward popup
                this.showKortPopup(kort);
            }
        } catch (error) {
            console.error('Error getting kort reward:', error);
        }
    }

    /**
     * Show kort reward popup
     */
    showKortPopup(kort) {
        const popup = document.createElement('div');
        popup.className = 'kort-popup-overlay';
        popup.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s;';

        popup.innerHTML = `
            <div class="kort-popup playful-card" style="background: white; border-radius: var(--radius-xl, 50px); padding: 40px; max-width: 400px; text-align: center; animation: bounceIn 0.5s;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="font-size: 28px; margin-bottom: 15px; color: var(--primary-purple, #7C3AED);">Du vant et kort!</h2>
                <div class="kort-preview" style="margin: 20px 0;">
                    <img src="${kort.image}" alt="${kort.name}" style="width: 200px; height: 280px; border-radius: var(--radius-lg, 30px); box-shadow: var(--shadow-lg);" />
                </div>
                <p style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">${kort.name}</p>
                <p style="color: var(--text-gray); margin-bottom: 30px;">${kort.description || ''}</p>
                <button class="btn btn-primary" onclick="this.closest('.kort-popup-overlay').remove()" style="width: 100%;">
                    🚀 Fortsett øving
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show wrong answer popup
     */
    showWrongAnswerPopup(correctAnswer) {
        const popup = document.createElement('div');
        popup.className = 'wrong-answer-overlay';
        popup.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;';

        popup.innerHTML = `
            <div class="wrong-answer-popup playful-card" style="background: white; border-radius: var(--radius-lg, 30px); padding: 30px; max-width: 350px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                <h3 style="margin-bottom: 20px; color: var(--text-dark);">Feil svar</h3>
                <p style="margin-bottom: 10px; color: var(--text-gray);">Riktig svar er:</p>
                <p style="font-size: 24px; font-weight: 700; color: var(--primary-purple, #7C3AED); margin-bottom: 30px;">${correctAnswer}</p>
                <button class="btn btn-primary" onclick="this.closest('.wrong-answer-overlay').remove(); window.glosemester.continueAfterWrong();" style="width: 100%;">
                    Fortsett
                </button>
            </div>
        `;

        document.body.appendChild(popup);
    }

    /**
     * Continue to next question after wrong answer
     */
    continueAfterWrong() {
        this.currentIndex++;
        this.showNextQuestion();
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
