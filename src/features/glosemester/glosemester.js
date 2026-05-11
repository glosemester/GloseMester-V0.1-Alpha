/* ============================================
   GLOSEMESTER.JS - GloseMester v2.6
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
import { EASTER_EGG_KORT } from '../../core/kort/kort-data.js';
import { menuSystem } from '../../core/navigation/menu-system.js';
import { visToast, vibrer, lesOpp } from '../../core/utils/feedback.js';
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits } from '../../core/utils/storage.js';
import { practiceLimiter, cardLimiter } from '../../core/utils/rate-limiter.js';

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
        this.sessionCorrect = parseInt(localStorage.getItem('kortProgress') || '0', 10); // Persists across sessions
        this.dailyCorrect = 0; // Correct answers today (for "X riktige i dag" counter)
        this.innstillinger = { vibrasjon: true, lydfeedback: true, visTips: true };
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

        // Initialize navigation menu
        menuSystem.init();

        // Load user settings
        this.applyInnstillinger();

        // Render UI
        this.renderPracticeUI();

        // Show onboarding for first-time users
        this.sjekkOnboarding();

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
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
                        <button id="vis-samling-btn" style="background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.5);color:white;border-radius:20px;padding:7px 18px;font-size:14px;font-weight:600;cursor:pointer;">🃏 Se dine kort</button>
                        <button id="vis-galleri-btn" style="background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.5);color:white;border-radius:20px;padding:7px 18px;font-size:14px;font-weight:600;cursor:pointer;">🖼️ Galleri</button>
                        <button id="innstillinger-btn" style="background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.5);color:white;border-radius:20px;padding:7px 18px;font-size:14px;font-weight:600;cursor:pointer;">⚙️ Innstillinger</button>
                        <button id="tilbake-btn" style="background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.5);color:white;border-radius:20px;padding:7px 18px;font-size:14px;font-weight:600;cursor:pointer;">← Tilbake</button>
                    </div>
                </header>

                <div class="level-grid">
        `;

        const levelIcons = { niva1: '🌱', niva2: '📗', niva3: '🔥', niva4: '🚀' };

        this.levels.forEach(level => {
            const metadata = getLevelMetadata(level);
            const wordCount = getWordCountForLevel(level);
            const icon = levelIcons[level] || '📚';

            html += `
                <div class="level-card" data-level="${level}">
                    <div class="level-header">
                        <h3>${icon} ${metadata.name}</h3>
                        <span class="level-badge">${metadata.description}</span>
                    </div>
                    <div class="level-stats">
                        <span class="word-count">${wordCount} ord</span>
                        ${metadata.hasImages ? '<span class="has-images">🖼️ Med bilder</span>' : ''}
                    </div>
                    <button class="start-practice-btn" data-level="${level}">
                        Start øving →
                    </button>
                </div>
            `;
        });

        const kortProgress = parseInt(localStorage.getItem('kortProgress') || '0', 10);
        const progressPct = Math.round((kortProgress / 10) * 100);

        html += `
                </div>

                <!-- Slik vinner du kort -->
                <div style="max-width:700px;margin:36px auto 0;padding:0 16px 40px;">

                    <!-- Fremgang mot neste kort -->
                    <div style="background:white;border-radius:20px;padding:20px 24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(124,58,237,0.08);border:1.5px solid rgba(124,58,237,0.12);">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                            <span style="font-weight:700;font-size:15px;color:#1d1d1f;">🎯 Fremgang mot neste kort</span>
                            <span style="font-size:14px;font-weight:700;color:#7C3AED;">${kortProgress}/10 riktige</span>
                        </div>
                        <div style="background:#f0e9ff;border-radius:99px;height:12px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,#7C3AED,#A78BFA);height:12px;border-radius:99px;width:${progressPct}%;transition:width 0.4s;"></div>
                        </div>
                        <p style="margin:10px 0 0;font-size:13px;color:#888;">Svar riktig på 10 gloser i rad (eller over tid) — da vinner du et tilfeldig samlekort!</p>
                    </div>

                    <!-- Slik fungerer det -->
                    <div style="background:white;border-radius:20px;padding:24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(124,58,237,0.08);border:1.5px solid rgba(124,58,237,0.12);">
                        <h3 style="margin:0 0 16px;font-size:17px;color:#1d1d1f;">🃏 Slik vinner du samlekort</h3>
                        <div style="display:flex;flex-direction:column;gap:12px;">
                            <div style="display:flex;align-items:flex-start;gap:12px;">
                                <span style="font-size:22px;flex-shrink:0;">✅</span>
                                <div><strong style="color:#1d1d1f;">Svar riktig</strong> — for hvert riktige svar fyller fremgangslinjen seg</div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;">
                                <span style="font-size:22px;flex-shrink:0;">🔟</span>
                                <div><strong style="color:#1d1d1f;">10 riktige</strong> — og du vinner et tilfeldig kort. Fremgangen lagres mellom øktene!</div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;">
                                <span style="font-size:22px;flex-shrink:0;">🌟</span>
                                <div><strong style="color:#1d1d1f;">Sjeldenhet avgjøres av flaks</strong> — du kan vinne alt fra Vanlig til det legendariske</div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;">
                                <span style="font-size:22px;flex-shrink:0;">♻️</span>
                                <div><strong style="color:#1d1d1f;">Dubletter</strong> — bytt mot 💎 diamanter og bruk dem til å handle sjeldne kort</div>
                            </div>
                        </div>
                    </div>

                    <!-- Kort-kategorier -->
                    <div style="background:white;border-radius:20px;padding:24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(124,58,237,0.08);border:1.5px solid rgba(124,58,237,0.12);">
                        <h3 style="margin:0 0 6px;font-size:17px;color:#1d1d1f;">🎴 152 samlekort å vinne</h3>
                        <p style="margin:0 0 16px;font-size:13px;color:#888;">Fordelt på 4 kategorier med 38 kort i hver — og <strong>flere legges til fortløpende!</strong></p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div style="background:#f5f0ff;border-radius:14px;padding:14px;text-align:center;">
                                <div style="font-size:28px;margin-bottom:4px;">🚗</div>
                                <div style="font-weight:700;font-size:14px;color:#1d1d1f;">Biler</div>
                                <div style="font-size:12px;color:#888;margin-top:3px;">Fra VW Golf til LaFerrari</div>
                            </div>
                            <div style="background:#f5f0ff;border-radius:14px;padding:14px;text-align:center;">
                                <div style="font-size:28px;margin-bottom:4px;">🦕</div>
                                <div style="font-weight:700;font-size:14px;color:#1d1d1f;">Dinosaurer</div>
                                <div style="font-size:12px;color:#888;margin-top:3px;">Fra Compsognathus til Indominus Rex</div>
                            </div>
                            <div style="background:#f5f0ff;border-radius:14px;padding:14px;text-align:center;">
                                <div style="font-size:28px;margin-bottom:4px;">🐾</div>
                                <div style="font-weight:700;font-size:14px;color:#1d1d1f;">Dyr</div>
                                <div style="font-size:12px;color:#888;margin-top:3px;">Fra Hamster til den legendariske Føniks</div>
                            </div>
                            <div style="background:#f5f0ff;border-radius:14px;padding:14px;text-align:center;">
                                <div style="font-size:28px;margin-bottom:4px;">⚡</div>
                                <div style="font-weight:700;font-size:14px;color:#1d1d1f;">Guder</div>
                                <div style="font-size:12px;color:#888;margin-top:3px;">Norrøne og greske guder — inkl. Midgardsormen</div>
                            </div>
                        </div>

                        <!-- Sjeldenhetsnivåer -->
                        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                            <span style="background:#a1a1a1;color:white;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600;">📦 Vanlig</span>
                            <span style="background:#0071e3;color:white;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600;">✨ Sjelden</span>
                            <span style="background:#8e44ad;color:white;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600;">💎 Episk</span>
                            <span style="background:#f1c40f;color:#333;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600;">🌟 Legendarisk</span>
                        </div>
                    </div>

                    <!-- Registreringslenke -->
                    <div style="text-align:center;padding:20px 16px;background:linear-gradient(135deg,#7C3AED,#A78BFA);border-radius:20px;color:white;">
                        <div style="font-size:22px;margin-bottom:8px;">🎓</div>
                        <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;">Er du lærer eller skole?</h3>
                        <p style="margin:0 0 14px;font-size:13px;opacity:0.9;">Lag egne prøver, del med QR-kode og se resultater i dashbordet</p>
                        <a href="/for-skoler.html" style="display:inline-block;background:white;color:#7C3AED;font-weight:700;font-size:14px;padding:10px 24px;border-radius:99px;text-decoration:none;">
                            Se priser og registrer deg →
                        </a>
                    </div>

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

        document.getElementById('vis-samling-btn')?.addEventListener('click', () => this.renderGallery());
        document.getElementById('vis-galleri-btn')?.addEventListener('click', () => this.renderAllKortGallery());
        document.getElementById('innstillinger-btn')?.addEventListener('click', () => this.visInnstillinger());
        document.getElementById('tilbake-btn')?.addEventListener('click', () => window.router.push('/'));
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
                            <span id="daily-correct" style="font-weight: bold; color: var(--accent-blue);">0 riktige i dag</span>
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
                    <!-- Credits/XP Progress Bar -->
                    <div id="credits-progress" class="credit-progress-container" style="margin-bottom: 20px;"></div>

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
        // ✅ RATE LIMITING: Check if user is answering too fast
        const rateCheck = practiceLimiter.check('practice_answer');
        if (!rateCheck.allowed) {
            const minutter = Math.ceil(rateCheck.remainingMs / 60000);
            visToast(
                `⏰ Du må ta en pause! Vent ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} før du kan fortsette.`,
                'warning'
            );
            return;
        }

        const correctWord = this.currentWords[this.currentIndex];
        const isCorrect = selectedWord.s === correctWord.s;

        // Disable all buttons
        const buttons = document.querySelectorAll('.alternative-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (isCorrect) {
            this.sessionCorrect++;
            localStorage.setItem('kortProgress', this.sessionCorrect);
            this.correctAnswers++;
            this.totalQuestions++;
            this.dailyCorrect++;

            // ✅ Save XP to storage
            const currentXP = getTotalCorrect('gloser');
            saveTotalCorrect(currentXP + 1, 'gloser');

            // 🥚 Easter egg — 1/20 000 sjanse per riktig svar
            this.sjekkEasterEgg();

            // Show success feedback
            const feedback = document.getElementById('feedback');
            if (feedback) {
                feedback.textContent = '✅ Riktig!';
                feedback.className = 'feedback correct';
            }

            // Update progress
            this.updateProgress();

            // ✅ Check for diamond bonus every 100 XP
            const newXP = getTotalCorrect('gloser');
            if (newXP > 0 && newXP % 100 === 0) {
                this.awardDiamondBonus();
            }

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
            if (this.innstillinger.vibrasjon) vibrer(200);

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

        // ✅ RATE LIMITING: Check if user is answering too fast
        const rateCheck = practiceLimiter.check('practice_answer');
        if (!rateCheck.allowed) {
            const minutter = Math.ceil(rateCheck.remainingMs / 60000);
            visToast(
                `⏰ Du må ta en pause! Vent ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} før du kan fortsette.`,
                'warning'
            );
            return;
        }

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
            localStorage.setItem('kortProgress', this.sessionCorrect);
            this.dailyCorrect++;

            // 🥚 Easter egg — 1/20 000 sjanse per riktig svar
            this.sjekkEasterEgg();

            // ✅ Save XP to storage
            const currentXP = getTotalCorrect('gloser');
            saveTotalCorrect(currentXP + 1, 'gloser');

            // Update stats
            this.updateProgress();

            // ✅ Check for diamond bonus every 100 XP
            const newXP = getTotalCorrect('gloser');
            if (newXP > 0 && newXP % 100 === 0) {
                this.awardDiamondBonus();
            }

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
            if (this.innstillinger.vibrasjon) vibrer(200);
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

        // Update daily correct counter
        const dailyCorrectEl = document.getElementById('daily-correct');
        if (dailyCorrectEl) {
            dailyCorrectEl.textContent = `${this.dailyCorrect} riktige i dag`;
        }

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const percent = (this.currentIndex / this.currentWords.length) * 100;
            progressFill.style.width = `${percent}%`;
        }

        // Update 10-box kort progress
        this.updateKortProgress();

        // Update credits/XP progress
        this.updateCreditsProgress();

        // Check if feedback prompt should be shown
        this.sjekkTilbakemelding();
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
     * Update Credits/XP progress bar (yellow bar for diamond bonus)
     */
    updateCreditsProgress() {
        const container = document.getElementById('credits-progress');
        if (!container) return;

        const totalXP = getTotalCorrect('gloser');
        const currentProgress = totalXP % 100;
        const percentage = currentProgress;

        container.innerHTML = `
            <div style="padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: var(--radius-md, 20px);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: var(--text-dark, #1F2937);">
                    <span>💎 Mot neste bonuspoeng (100 xp)</span>
                    <span>${currentProgress} / 100</span>
                </div>
                <div class="yellow-track" style="width: 100%; background: rgba(229, 229, 234, 0.6); border-radius: 10px; height: 10px; overflow: hidden;">
                    <div class="yellow-fill" style="height: 100%; background: linear-gradient(90deg, #FBBF24, #F59E0B); width: ${percentage}%; transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    }

    /**
     * Handle kort reward (every 10 correct answers)
     */
    async handleKortReward() {
        console.log('🎁 10 correct answers! Checking for kort reward...');

        // ✅ RATE LIMITING: Check if user has received too many cards
        const cardCheck = cardLimiter.check('card_reward');
        if (!cardCheck.allowed) {
            const minutter = Math.ceil(cardCheck.remainingMs / 60000);
            visToast(
                `🃏 Du har mottatt nok kort for nå! Kom tilbake om ${minutter} ${minutter === 1 ? 'minutt' : 'minutter'} for flere.`,
                'info'
            );
            return;
        }

        try {
            await kortSystem.handleQuizCompletion(10, 10, 'gloser', this.currentLevel);
            // Reset persistent progress counter after card awarded
            localStorage.setItem('kortProgress', '0');
            this.sessionCorrect = 0;
        } catch (error) {
            console.error('Error getting kort reward:', error);
        }
    }

    /**
     * Easter egg — 1/20 000 sjanse per riktig svar
     */
    sjekkEasterEgg() {
        if (localStorage.getItem('easteregg_funnet')) return;
        if (Math.random() > 1 / 20000) return;
        this.visEasterEggPopup();
    }

    visEasterEggPopup() {
        localStorage.setItem('easteregg_funnet', JSON.stringify({ dato: Date.now() }));

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; background: #000;
            display: flex; align-items: center; justify-content: center;
            z-index: 99999; animation: egFadeIn 1.2s ease forwards;
        `;

        overlay.innerHTML = `
            <style>
                @keyframes egFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes egGlow {
                    0%, 100% { text-shadow: 0 0 20px #FFD700, 0 0 60px #FFD700; }
                    50% { text-shadow: 0 0 60px #FFD700, 0 0 120px #FFA500; }
                }
                @keyframes egFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                .eg-title { animation: egGlow 2s ease-in-out infinite; }
                .eg-img { animation: egFloat 3s ease-in-out infinite; }
            </style>
            <div style="text-align:center; padding:40px; max-width:360px; color:#fff;">
                <div style="font-size:56px; margin-bottom:16px; letter-spacing:8px;">✦ ✦ ✦</div>
                <img class="eg-img" src="images/branding/easter-egg.png" alt="Hemmelig kort"
                     style="width:200px; height:280px; border-radius:20px;
                            box-shadow:0 0 60px #FFD700, 0 0 120px rgba(255,215,0,0.4);
                            margin-bottom:28px; object-fit:cover;" />
                <h1 class="eg-title" style="font-size:26px; font-weight:900; margin-bottom:12px; color:#FFD700;">
                    Du fant det hemmelige kortet
                </h1>
                <p style="font-size:15px; color:rgba(255,255,255,0.7); margin-bottom:8px; font-style:italic;">
                    Sjansen var 1 av 20 000.
                </p>
                <p style="font-size:14px; color:rgba(255,255,255,0.5); margin-bottom:36px;">
                    Det er knapt noen andre som har sett dette.
                </p>
                <button id="eg-close-btn"
                    style="background:#FFD700; color:#000; border:none; border-radius:50px;
                           padding:14px 40px; font-size:16px; font-weight:800; cursor:pointer;">
                    Lukk
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('#eg-close-btn').addEventListener('click', () => overlay.remove());
    }

    // ==================== ONBOARDING ====================

    sjekkOnboarding() {
        if (localStorage.getItem('gm_onboarding_done')) return;
        this.visOnboarding();
    }

    visOnboarding() {
        let steg = 0;
        const steger = [
            { ikon: '🎓', tittel: 'Velkommen til GloseMester!', tekst: 'Øv på gloser og vinn samlekort underveis. Gratis å starte!' },
            { ikon: '🃏', tittel: 'Svar riktig — vinn kort', tekst: 'For hver 10 riktige svar vinner du et tilfeldig samlekort. Det finnes 152 kort fordelt på 6 kategorier!' },
            { ikon: '🚀', tittel: 'Klar til å starte?', tekst: 'Velg et nivå og begynn å øve. Fremgangen din lagres mellom øktene.' }
        ];

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';

        const lukkModal = () => {
            localStorage.setItem('gm_onboarding_done', '1');
            overlay.remove();
        };

        const render = () => {
            const s = steger[steg];
            const dots = steger.map((_, i) => `<span style="width:8px;height:8px;border-radius:50%;background:${i === steg ? '#7C3AED' : '#ddd'};display:inline-block;"></span>`).join('');
            overlay.innerHTML = `
                <div style="background:white;border-radius:28px;padding:36px 32px;max-width:360px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div style="font-size:56px;margin-bottom:16px;">${s.ikon}</div>
                    <h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;font-weight:800;">${s.tittel}</h2>
                    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5;">${s.tekst}</p>
                    <div style="display:flex;gap:6px;justify-content:center;margin-bottom:24px;">${dots}</div>
                    <div style="display:flex;gap:10px;justify-content:center;">
                        <button id="ob-skip" style="background:transparent;border:1.5px solid #ddd;border-radius:20px;padding:10px 20px;font-size:14px;color:#888;cursor:pointer;">Hopp over</button>
                        <button id="ob-neste" style="background:#7C3AED;border:none;border-radius:20px;padding:10px 28px;font-size:14px;font-weight:700;color:white;cursor:pointer;">
                            ${steg < steger.length - 1 ? 'Neste →' : 'Start nå 🚀'}
                        </button>
                    </div>
                </div>
            `;
            overlay.querySelector('#ob-skip').addEventListener('click', lukkModal);
            overlay.querySelector('#ob-neste').addEventListener('click', () => {
                if (steg < steger.length - 1) { steg++; render(); }
                else lukkModal();
            });
        };

        render();
        document.body.appendChild(overlay);
    }

    // ==================== INNSTILLINGER ====================

    applyInnstillinger() {
        const lagret = localStorage.getItem('gm_innstillinger');
        if (lagret) {
            try { this.innstillinger = { ...this.innstillinger, ...JSON.parse(lagret) }; } catch {}
        }
    }

    visInnstillinger() {
        const s = this.innstillinger;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';

        const toggle = (key, label, desc) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f0f0f0;">
                <div>
                    <div style="font-weight:600;font-size:15px;color:#1d1d1f;">${label}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">${desc}</div>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;margin-left:12px;">
                    <input type="checkbox" data-key="${key}" ${s[key] ? 'checked' : ''}
                        style="opacity:0;width:0;height:0;" />
                    <span style="position:absolute;cursor:pointer;inset:0;background:${s[key] ? '#7C3AED' : '#ccc'};border-radius:24px;transition:0.3s;">
                        <span style="position:absolute;height:18px;width:18px;left:${s[key] ? '23px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:0.3s;"></span>
                    </span>
                </label>
            </div>
        `;

        overlay.innerHTML = `
            <div style="background:white;border-radius:24px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1d1d1f;">⚙️ Innstillinger</h2>
                <p style="margin:0 0 20px;font-size:13px;color:#888;">Tilpasse øvingen etter deg</p>
                ${toggle('vibrasjon', 'Vibrasjon', 'Telefonen vibrerer ved feil svar')}
                ${toggle('lydfeedback', 'Lydfeedback', 'Lydsignal ved riktig/feil (kommer snart)')}
                ${toggle('visTips', 'Vis hint', 'Vis hjelpetekst under spørsmålet')}
                <div style="display:flex;gap:10px;margin-top:24px;">
                    <button id="inn-avbryt" style="flex:1;background:transparent;border:1.5px solid #ddd;border-radius:20px;padding:12px;font-size:14px;color:#666;cursor:pointer;">Avbryt</button>
                    <button id="inn-lagre" style="flex:1;background:#7C3AED;border:none;border-radius:20px;padding:12px;font-size:14px;font-weight:700;color:white;cursor:pointer;">Lagre</button>
                </div>
            </div>
        `;

        overlay.querySelector('#inn-avbryt').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#inn-lagre').addEventListener('click', () => {
            overlay.querySelectorAll('input[data-key]').forEach(inp => {
                this.innstillinger[inp.dataset.key] = inp.checked;
            });
            localStorage.setItem('gm_innstillinger', JSON.stringify(this.innstillinger));
            overlay.remove();
            visToast('✅ Innstillinger lagret', 'success');
        });

        // Rerender toggle visuals on change
        overlay.querySelectorAll('input[data-key]').forEach(inp => {
            inp.addEventListener('change', () => {
                const span = inp.nextElementSibling;
                const knob = span.querySelector('span');
                if (inp.checked) { span.style.background = '#7C3AED'; knob.style.left = '23px'; }
                else { span.style.background = '#ccc'; knob.style.left = '3px'; }
            });
        });

        document.body.appendChild(overlay);
    }

    // ==================== TILBAKEMELDING ====================

    sjekkTilbakemelding() {
        if (localStorage.getItem('gm_feedback_gitt')) return;
        const xp = getTotalCorrect('gloser');
        if (xp >= 50) this.visTilbakemeldingModal();
    }

    visTilbakemeldingModal() {
        localStorage.setItem('gm_feedback_gitt', JSON.stringify({ dato: Date.now(), stjerner: 0 }));

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';

        overlay.innerHTML = `
            <div style="background:white;border-radius:28px;padding:36px 28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="font-size:40px;margin-bottom:12px;">⭐</div>
                <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1d1d1f;">Hva synes du om GloseMester?</h2>
                <p style="margin:0 0 20px;font-size:14px;color:#888;">Din mening hjelper oss!</p>
                <div id="stjerne-rad" style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;font-size:36px;cursor:pointer;">
                    <span data-s="1">☆</span>
                    <span data-s="2">☆</span>
                    <span data-s="3">☆</span>
                    <span data-s="4">☆</span>
                    <span data-s="5">☆</span>
                </div>
                <button id="fb-hopp" style="background:transparent;border:none;font-size:13px;color:#aaa;cursor:pointer;text-decoration:underline;">Hopp over</button>
            </div>
        `;

        const rad = overlay.querySelector('#stjerne-rad');
        rad.querySelectorAll('span').forEach(s => {
            s.addEventListener('click', () => {
                const n = parseInt(s.dataset.s);
                rad.querySelectorAll('span').forEach((sp, i) => { sp.textContent = i < n ? '★' : '☆'; });
                localStorage.setItem('gm_feedback_gitt', JSON.stringify({ dato: Date.now(), stjerner: n }));
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'app_feedback', { stars: n, xp_total: getTotalCorrect('gloser') });
                }
                setTimeout(() => {
                    overlay.remove();
                    visToast('Takk for tilbakemeldingen! 🙏', 'success');
                }, 600);
            });
        });

        overlay.querySelector('#fb-hopp').addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }

    /**
     * Award diamond bonus (every 100 XP)
     */
    awardDiamondBonus() {
        const DIAMANTER_PER_BONUS = 10;
        let credits = getCredits('gloser');
        credits += DIAMANTER_PER_BONUS;
        saveCredits(credits, 'gloser');

        // Show toast message
        setTimeout(() => {
            visToast(`💎 BONUS! Du fikk ${DIAMANTER_PER_BONUS} diamanter!`, 'success');
        }, 1000);

        console.log(`💎 Awarded ${DIAMANTER_PER_BONUS} diamonds! Total: ${credits}`);
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
     * Show kort gallery (mine kort)
     */
    renderGallery() {
        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                    <button class="btn btn-secondary" onclick="window.glosemester.renderPracticeUI()" style="padding: 8px 16px;">← Tilbake</button>
                    <h2 style="margin: 0;">🃏 Mine Kort</h2>
                    <button class="btn btn-secondary" onclick="window.glosemester.renderAllKortGallery()" style="padding: 8px 16px; margin-left: auto;">🖼️ Galleri</button>
                </div>
                <div id="app-gallery"></div>
            </div>
        `;

        kortSystem.createGallery('app-gallery');
    }

    /**
     * Show full kort gallery — all 152 cards, greyed out if not owned
     */
    renderAllKortGallery() {
        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="window.glosemester.renderPracticeUI()" style="padding: 8px 16px;">← Tilbake</button>
                    <h2 style="margin: 0;">🖼️ Alle Kort</h2>
                    <button class="btn btn-secondary" onclick="window.glosemester.renderGallery()" style="padding: 8px 16px; margin-left: auto;">🃏 Se dine kort</button>
                </div>
                <p style="margin: 0 0 20px; color: #888; font-size: 14px;">Øv for å vinne kortene du mangler!</p>
                <div id="app-all-gallery"></div>
            </div>
        `;

        kortSystem.createAllKortGallery('app-all-gallery');
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

// Make singleton globally available — do NOT overwrite window.GloseMester (that's the app state object)
if (typeof window !== 'undefined') {
    window.glosemester = glosemester;
}

console.log('📚 GloseMester module loaded');
