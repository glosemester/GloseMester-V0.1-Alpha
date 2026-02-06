/* ============================================
   MATTEMESTER.JS - Mester Suite v2.0
   MatteMester implementation of FagModul
   ============================================ */

import { FagModul } from '../base-modul.js';
import {
    OppgaveGenerator,
    OPPGAVE_CONFIG
} from './oppgave-generator.js';
import { kortSystem } from '../../core/kort/kort-system.js';

/**
 * MatteMester - Mathematics learning module
 */
export class MatteMester extends FagModul {
    constructor() {
        super('matte');

        this.operations = []; // pluss, minus, gange, dele
        this.currentOperation = null;
        this.currentLevel = null;
        this.currentProblems = [];
        this.currentProblem = null;
        this.currentIndex = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.currentAnswer = '';
    }

    // ==================== REQUIRED METHODS ====================

    /**
     * Initialize MatteMester
     * @override
     */
    async init() {
        console.log('➕ Initializing MatteMester...');

        // Load available operations
        this.operations = OppgaveGenerator.getAvailableOperations();

        // Render UI
        this.renderOperationSelector();

        this.initialized = true;
        console.log('✅ MatteMester initialized');
        console.log(`📊 Available operations: ${this.operations.length}`);

        return true;
    }

    /**
     * Get practice data
     * @override
     */
    getPracticeData() {
        return OPPGAVE_CONFIG;
    }

    /**
     * Start a practice session
     * @override
     * @param {string} operasjon - Operation type (pluss, minus, gange, dele)
     * @param {string} level - Sub-level (niva1, niva2, niva3)
     * @param {Object} options - Practice options
     */
    startPractice(operasjon, level, options = {}) {
        this.ensureInitialized();

        const kategori = OppgaveGenerator.getOperationConfig(operasjon);
        if (!kategori || !kategori.nivåer[level]) {
            console.error(`Invalid operation/level: ${operasjon}/${level}`);
            return;
        }

        console.log(`🎯 Starting MatteMester practice: ${operasjon} - ${level}`);

        // Set up session
        this.currentOperation = operasjon;
        this.currentLevel = level;
        this.currentProblems = OppgaveGenerator.genererFlereMuligheter(operasjon, level, options.antall || 10);
        this.currentIndex = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.currentAnswer = '';

        // Create session object
        this.currentSession = {
            category: `${operasjon}_${level}`,
            operasjon,
            nivå: level,
            startTime: Date.now(),
            totalQuestions: this.currentProblems.length,
            correctAnswers: 0,
            paused: false,
            problems: this.currentProblems
        };

        // Render quiz UI
        this.renderQuizUI();

        // Show first question
        this.showNextQuestion();
    }

    /**
     * Render operation selector (pluss, minus, gange, dele)
     */
    renderOperationSelector() {
        const container = document.getElementById('app');
        if (!container) {
            console.error('App container not found');
            return;
        }

        let html = `
            <div class="mattemester-container">
                <header class="fag-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1>➕ MatteMester</h1>
                    <p>Velg regneart for å begynne å øve</p>
                </header>

                <div class="operation-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; max-width: 900px; margin: 40px auto; padding: 0 20px;">
        `;

        this.operations.forEach(operasjon => {
            const config = OPPGAVE_CONFIG[operasjon];

            html += `
                <div class="operation-card" data-operasjon="${operasjon}" style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; text-align: center;">
                    <div class="operation-emoji" style="font-size: 64px; margin-bottom: 15px;">${config.emoji}</div>
                    <h3 style="margin: 0 0 10px 0; color: #667eea;">${config.name}</h3>
                    <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">3 nivåer tilgjengelig</p>
                    <button class="btn-primary select-operation-btn" data-operasjon="${operasjon}" style="background: #667eea; width: 100%;">
                        Velg
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
        container.querySelectorAll('.select-operation-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const operasjon = e.target.dataset.operasjon;
                this.renderLevelSelector(operasjon);
            });
        });
    }

    /**
     * Render level selector for chosen operation
     * @param {string} operasjon - Operation type
     */
    renderLevelSelector(operasjon) {
        const container = document.getElementById('app');
        if (!container) return;

        const config = OPPGAVE_CONFIG[operasjon];
        const subLevels = OppgaveGenerator.getSubLevels(operasjon);

        let html = `
            <div class="mattemester-container">
                <header class="fag-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <button class="btn-back" id="back-to-operations" style="position: absolute; left: 20px; top: 20px; background: rgba(255,255,255,0.2); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        ← Tilbake
                    </button>
                    <h1>${config.emoji} ${config.name}</h1>
                    <p>Velg nivå som passer for deg</p>
                </header>

                <div class="level-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; max-width: 1000px; margin: 40px auto; padding: 0 20px;">
        `;

        subLevels.forEach(level => {
            const levelConfig = config.nivåer[level];

            html += `
                <div class="level-card matte-card" data-level="${level}" style="background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div class="level-header">
                        <h3 style="color: #667eea; margin: 0 0 10px 0;">${levelConfig.name}</h3>
                        <span class="level-badge" style="display: inline-block; background: #e0e7ff; color: #667eea; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${levelConfig.description}</span>
                    </div>
                    <div class="level-stats" style="margin: 20px 0;">
                        ${levelConfig.tallområde ? `
                            <p style="margin: 5px 0; color: #666;">📊 Tallområde: ${levelConfig.tallområde[0]}-${levelConfig.tallområde[1]}</p>
                        ` : ''}
                        ${levelConfig.gangetabellTil ? `
                            <p style="margin: 5px 0; color: #666;">✖️ Gangetabell til: ${levelConfig.gangetabellTil}</p>
                        ` : ''}
                        ${levelConfig.medDesimal ? `
                            <p style="margin: 5px 0; color: #666;">💧 Med desimaltall</p>
                        ` : ''}
                    </div>
                    <button class="btn-primary start-practice-btn" data-operasjon="${operasjon}" data-level="${level}" style="background: #667eea; width: 100%;">
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
        const backBtn = document.getElementById('back-to-operations');
        this.addEventListener(backBtn, 'click', () => this.renderOperationSelector());

        container.querySelectorAll('.start-practice-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const op = e.target.dataset.operasjon;
                const lvl = e.target.dataset.level;
                this.startPractice(op, lvl);
            });
        });
    }

    /**
     * Render the main practice UI (backwards compatibility)
     * @override
     */
    renderPracticeUI() {
        this.renderOperationSelector();
    }

    /**
     * Check if answer is correct
     * @override
     * @param {string|number} answer - User's answer
     * @returns {Object} Result object
     */
    checkAnswer(answer) {
        if (!this.currentSession || !this.currentProblem) {
            return { isCorrect: false, feedback: 'No active session' };
        }

        const userAnswer = typeof answer === 'string' ? parseFloat(answer) : answer;
        const correctAnswer = this.currentProblem.svar;

        const isCorrect = OppgaveGenerator.sjekkSvar(userAnswer, correctAnswer);

        // Update stats
        this.totalQuestions++;
        this.currentSession.totalQuestions = this.totalQuestions;

        if (isCorrect) {
            this.correctAnswers++;
            this.currentSession.correctAnswers++;
        }

        return {
            isCorrect,
            correctAnswer,
            userAnswer: answer,
            feedback: isCorrect ? 'Riktig! 🎉' : `Feil. Riktig svar: ${correctAnswer}`,
            problem: this.currentProblem,
            forklaring: this.currentProblem.forklaring
        };
    }

    // ==================== OPTIONAL OVERRIDES ====================

    /**
     * Get available categories/levels
     * @override
     */
    getCategories() {
        const categories = [];

        this.operations.forEach(operasjon => {
            const config = OPPGAVE_CONFIG[operasjon];
            const subLevels = OppgaveGenerator.getSubLevels(operasjon);

            subLevels.forEach(level => {
                const levelConfig = config.nivåer[level];
                categories.push({
                    id: `${operasjon}_${level}`,
                    operasjon,
                    nivå: level,
                    name: levelConfig.name,
                    description: levelConfig.description
                });
            });
        });

        return categories;
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
                    'matte',
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

        // Reset state
        this.currentLevel = null;
        this.currentProblems = [];
        this.currentProblem = null;
        this.currentIndex = 0;
        this.currentAnswer = '';

        return summary;
    }

    // ==================== MATTEMESTER-SPECIFIC METHODS ====================

    /**
     * Render the quiz UI with number keyboard
     */
    renderQuizUI() {
        const container = document.getElementById('app');
        if (!container) return;

        const config = OPPGAVE_CONFIG[this.currentLevel];

        container.innerHTML = `
            <div class="mattemester-quiz">
                <header class="quiz-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <button class="btn-back" id="quit-quiz">← Tilbake</button>
                    <div class="quiz-info">
                        <h2>${config.name}</h2>
                        <div class="quiz-stats">
                            <span id="quiz-progress">0 / ${this.currentProblems.length}</span>
                            <span id="quiz-score">Riktige: 0</span>
                        </div>
                    </div>
                </header>

                <div class="quiz-content">
                    <div class="question-container matte-question">
                        <div id="problem-display" class="problem-display"></div>
                        <div id="answer-display" class="answer-display">
                            <span id="answer-text" class="answer-text"></span>
                            <span class="cursor">|</span>
                        </div>
                    </div>

                    <div id="feedback" class="feedback"></div>

                    <!-- Number Keyboard -->
                    <div class="number-keyboard">
                        <div class="keyboard-row">
                            ${[1, 2, 3].map(n => `<button class="num-btn" data-value="${n}">${n}</button>`).join('')}
                        </div>
                        <div class="keyboard-row">
                            ${[4, 5, 6].map(n => `<button class="num-btn" data-value="${n}">${n}</button>`).join('')}
                        </div>
                        <div class="keyboard-row">
                            ${[7, 8, 9].map(n => `<button class="num-btn" data-value="${n}">${n}</button>`).join('')}
                        </div>
                        <div class="keyboard-row">
                            <button class="num-btn special" data-value=".">.</button>
                            <button class="num-btn" data-value="0">0</button>
                            <button class="num-btn special" data-value="backspace">⌫</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="num-btn clear" data-value="clear">Slett</button>
                            <button class="num-btn check" data-value="check">Sjekk svar ✓</button>
                        </div>
                    </div>
                </div>

                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill" style="width: 0%; background: #667eea;"></div>
                </div>
            </div>
        `;

        // Attach event listeners
        const quitBtn = document.getElementById('quit-quiz');
        this.addEventListener(quitBtn, 'click', () => this.handleQuit());

        // Number keyboard
        container.querySelectorAll('.num-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const value = e.target.dataset.value;
                this.handleKeyboardInput(value);
            });
        });

        // Physical keyboard support
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                this.handleKeyboardInput(e.key);
            } else if (e.key === '.') {
                this.handleKeyboardInput('.');
            } else if (e.key === 'Backspace') {
                this.handleKeyboardInput('backspace');
            } else if (e.key === 'Enter') {
                this.handleKeyboardInput('check');
            } else if (e.key === 'Escape') {
                this.handleKeyboardInput('clear');
            }
        });
    }

    /**
     * Show next question
     */
    showNextQuestion() {
        if (this.currentIndex >= this.currentProblems.length) {
            // Quiz complete
            this.handleQuizComplete();
            return;
        }

        this.currentProblem = this.currentProblems[this.currentIndex];
        this.currentAnswer = '';

        // Update problem display
        const problemDisplay = document.getElementById('problem-display');
        if (problemDisplay) {
            const emoji = OppgaveGenerator.getTypeEmoji(this.currentProblem.type);
            problemDisplay.innerHTML = `
                <span class="problem-emoji">${emoji}</span>
                <span class="problem-text">${this.currentProblem.spørsmål} = ?</span>
            `;
        }

        // Clear answer display
        this.updateAnswerDisplay();

        // Clear feedback
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'feedback';
        }

        // Update progress
        this.updateProgress();
    }

    /**
     * Handle keyboard input
     * @param {string} value - Key value
     */
    handleKeyboardInput(value) {
        if (value === 'check') {
            this.handleCheckAnswer();
        } else if (value === 'clear') {
            this.currentAnswer = '';
            this.updateAnswerDisplay();
        } else if (value === 'backspace') {
            this.currentAnswer = this.currentAnswer.slice(0, -1);
            this.updateAnswerDisplay();
        } else if (value === '.') {
            // Only allow one decimal point
            if (!this.currentAnswer.includes('.')) {
                this.currentAnswer += value;
                this.updateAnswerDisplay();
            }
        } else {
            // Number key
            this.currentAnswer += value;
            this.updateAnswerDisplay();
        }
    }

    /**
     * Update answer display
     */
    updateAnswerDisplay() {
        const answerText = document.getElementById('answer-text');
        if (answerText) {
            answerText.textContent = this.currentAnswer || '0';
        }
    }

    /**
     * Handle check answer button
     */
    handleCheckAnswer() {
        if (!this.currentAnswer) return;

        const result = this.checkAnswer(this.currentAnswer);

        // Show feedback
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.innerHTML = `
                <div class="${result.isCorrect ? 'correct' : 'incorrect'}">
                    <p class="feedback-main">${result.feedback}</p>
                    ${!result.isCorrect ? `<p class="feedback-explain">${result.forklaring}</p>` : ''}
                </div>
            `;
            feedback.className = `feedback ${result.isCorrect ? 'correct' : 'incorrect'}`;
        }

        // Update stats
        this.updateProgress();

        // Move to next question after delay
        setTimeout(() => {
            this.currentIndex++;
            this.showNextQuestion();
        }, result.isCorrect ? 800 : 2500);
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const progressText = document.getElementById('quiz-progress');
        if (progressText) {
            progressText.textContent = `${this.currentIndex} / ${this.currentProblems.length}`;
        }

        const scoreText = document.getElementById('quiz-score');
        if (scoreText) {
            scoreText.textContent = `Riktige: ${this.correctAnswers}`;
        }

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const percent = (this.currentIndex / this.currentProblems.length) * 100;
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
            <div class="quiz-results matte-results">
                <h2>🎉 Flott jobba!</h2>
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

                ${percentage < 80 ? `
                    <p class="encouragement">Fortsett å øve - du blir bedre for hver gang! 💪</p>
                ` : ''}

                <div class="result-actions">
                    <button class="btn-primary" id="practice-again" style="background: #667eea;">Øv igjen</button>
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
     * Format type name for display
     * @param {string} type - Problem type
     * @returns {string} Formatted name
     */
    formatTypeName(type) {
        const names = {
            telling: 'Telling',
            addisjon: 'Pluss',
            subtraksjon: 'Minus',
            ganging_enkelt: 'Gange',
            multiplikasjon: 'Gange',
            divisjon_enkel: 'Dele',
            divisjon: 'Dele',
            desimal: 'Desimaltall',
            prosent: 'Prosent',
            potens: 'Potenser'
        };

        return names[type] || type;
    }
}

// Export singleton instance
export const mattemester = new MatteMester();

// Make globally available (for debugging)
if (typeof window !== 'undefined') {
    window.MatteMester = MatteMester;
    window.mattemester = mattemester;
}

console.log('➕ MatteMester module loaded');
