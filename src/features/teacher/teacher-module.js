/* ============================================
   TEACHER-MODULE.JS - GloseMester v2.6
   Teacher functionality for all subjects
   ============================================ */

import { menuSystem } from '../core/navigation/menu-system.js';
import { visToast } from '../core/utils/feedback.js';

/**
 * TeacherModule - Central hub for teachers across all subjects
 */
export class TeacherModule {
    constructor() {
        this.currentFag = null;
        this.currentView = 'dashboard';
        this.userName = null;
        this.tests = [];
    }

    /**
     * Initialize teacher module
     * @param {Object} options - { userName, isAdmin }
     */
    async init(options = {}) {
        console.log('👨‍🏫 Initializing TeacherModule...');

        this.userName = options.userName || 'Lærer';
        this.isAdmin = options.isAdmin || false;

        // Load saved tests from localStorage
        this.loadTests();

        // Show teacher menu
        this.showTeacherMenu();

        // Show dashboard by default
        this.showDashboard();

        console.log('✅ TeacherModule initialized');
    }

    /**
     * Show teacher menu
     */
    showTeacherMenu() {
        menuSystem.init();
        menuSystem.showMenu('laerer', {
            userName: this.userName,
            onDashboard: () => this.showDashboard(),
            onSavedTests: () => this.showSavedTests(),
            onStandardTests: () => this.showStandardTests(),
            onGlosebank: () => this.showGlosebank(),
            onAdmin: () => this.showAdmin(),
            onHome: () => this.goHome(),
            onLogout: () => this.logout()
        });
    }

    /**
     * Show teacher dashboard
     */
    showDashboard() {
        this.currentView = 'dashboard';
        menuSystem.setActive('dashboard');

        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div class="teacher-dashboard" style="padding: 100px 20px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.5s ease;">
                <header class="dashboard-header" style="margin-bottom: 60px;">
                    <div class="landing-eyebrow" style="margin-bottom: 12px;">Lærerportal</div>
                    <h1 style="font-size: clamp(32px, 5vw, 48px); font-family: var(--font-heading); font-weight: 800; color: var(--purple-900); margin-bottom: 10px;">
                        Velkommen, <span style="background: var(--gradient-purple); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${this.userName}</span> 👋
                    </h1>
                    <p style="color: var(--purple-600); font-size: 18px; font-weight: 500;">Her er din oversikt for GloseMester</p>
                </header>

                <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                    
                    <!-- Hovedkort: Lag Prøve -->
                    <div class="glass-card-dark fag-card" data-fag="gloser" style="padding: 40px; cursor: pointer; position: relative; overflow: hidden; border: 1px solid var(--purple-400);">
                        <div class="card-glow" style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
                        <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));">📚</div>
                        <h2 style="font-size: 28px; font-family: var(--font-heading); font-weight: 800; color: white; margin-bottom: 12px;">GloseMester</h2>
                        <p style="color: var(--purple-100); margin-bottom: 30px; font-size: 16px; line-height: 1.5;">Opprett nye glosetester, administrer eksisterende prøver og se elevenes resultater.</p>
                        <button class="btn-primary" style="width: 100%; padding: 16px; font-weight: 700; font-size: 16px; box-shadow: var(--glow-purple);">
                            ➕ Lag ny prøve
                        </button>
                    </div>

                    <!-- Stats & Info -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="glass-card" style="padding: 30px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--purple-200);">
                            <div style="width: 60px; height: 60px; border-radius: 20px; background: var(--purple-100); display: flex; align-items: center; justify-content: center; font-size: 30px;">📝</div>
                            <div>
                                <div style="font-size: 32px; font-weight: 800; color: var(--purple-900); font-family: var(--font-heading); line-height: 1;">${this.tests.length}</div>
                                <div style="font-size: 14px; color: var(--purple-600); font-weight: 600; margin-top: 4px;">Lagrede prøver</div>
                            </div>
                        </div>

                        <div class="glass-card" style="padding: 30px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--purple-200);">
                            <div style="width: 60px; height: 60px; border-radius: 20px; background: var(--purple-100); display: flex; align-items: center; justify-content: center; font-size: 30px;">🎓</div>
                            <div>
                                <div style="font-size: 32px; font-weight: 800; color: var(--purple-900); font-family: var(--font-heading); line-height: 1;">–</div>
                                <div style="font-size: 14px; color: var(--purple-600); font-weight: 600; margin-top: 4px;">Aktive elever</div>
                            </div>
                        </div>

                        <div class="glass-card" style="padding: 25px; background: var(--gradient-purple); color: white; border: none;">
                            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Premium Lærer</h3>
                            <p style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">Du har tilgang til alle funksjoner, inkludert standardprøver og eksport.</p>
                            <div style="height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px;">
                                <div style="width: 100%; height: 100%; background: white; border-radius: 3px; box-shadow: 0 0 10px white;"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Add event listeners
        const fagCards = container.querySelectorAll('.fag-card[data-fag]');
        fagCards.forEach(card => {
            card.addEventListener('click', () => {
                const fag = card.dataset.fag;
                if (fag !== 'norsk') {
                    this.showCreateTest(fag);
                }
            });
        });
    }

    /**
     * Show create test view
     * @param {string} fag - 'gloser', 'matte', 'norsk'
     */
    showCreateTest(fag) {
        this.currentFag = fag;

        const container = document.getElementById('app');
        if (!container) return;

        const fagConfig = {
            gloser: {
                name: 'GloseMester',
                emoji: '📚',
                gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                levels: ['niva1', 'niva2', 'niva3', 'niva4']
            }
        };

        const config = fagConfig[fag];

        container.innerHTML = `
            <div class="create-test-view" style="padding: 80px 20px 100px; max-width: 800px; margin: 0 auto;">
                <button class="btn-back" id="back-to-dashboard" style="margin-bottom: 20px;">
                    ← Tilbake til dashboard
                </button>

                <div class="hero-section" style="background: ${config.gradient}; padding: 40px; border-radius: var(--radius-xl, 50px); text-align: center; margin-bottom: 40px; color: white;">
                    <div class="icon-large" style="font-size: 72px; margin-bottom: 15px;">${config.emoji}</div>
                    <h1 style="font-size: 32px; margin-bottom: 10px;">Lag ${config.name}-prøve</h1>
                    <p style="opacity: 0.9;">Opprett en ny prøve for elevene dine</p>
                </div>

                <form id="create-test-form" class="playful-card" style="background: white; padding: 40px; border-radius: var(--radius-lg, 30px); box-shadow: var(--shadow-lg);">

                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 16px;">
                            📝 Prøvetittel
                        </label>
                        <input
                            type="text"
                            id="test-title"
                            placeholder="F.eks. 'Ukentlig glose-quiz' eller 'Kapittel 3 - Addisjon'"
                            required
                            style="width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB; border-radius: var(--radius-md, 20px); font-size: 16px;"
                        />
                    </div>

                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 16px;">
                            📚 Velg nivå
                        </label>
                        <select
                            id="test-level"
                            required
                            style="width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB; border-radius: var(--radius-md, 20px); font-size: 16px;"
                        >
                            <option value="">-- Velg nivå --</option>
                            ${config.levels.map(level => `
                                <option value="${level}">${this.getLevelName(level, fag)}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 16px;">
                            🔢 Antall spørsmål
                        </label>
                        <input
                            type="number"
                            id="test-questions"
                            min="5"
                            max="50"
                            value="10"
                            required
                            style="width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB; border-radius: var(--radius-md, 20px); font-size: 16px;"
                        />
                    </div>

                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 16px;">
                            ⏱️ Tidsbegrensning (minutter)
                        </label>
                        <input
                            type="number"
                            id="test-time"
                            min="5"
                            max="120"
                            value="15"
                            placeholder="0 = ingen tidsbegrensning"
                            style="width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB; border-radius: var(--radius-md, 20px); font-size: 16px;"
                        />
                    </div>

                    <div class="form-group" style="margin-bottom: 30px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input
                                type="checkbox"
                                id="test-shuffle"
                                checked
                                style="width: 20px; height: 20px; cursor: pointer;"
                            />
                            <span style="font-weight: 500;">🔀 Bland rekkefølgen på spørsmålene</span>
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 18px; font-weight: 600;">
                        ✨ Opprett prøve
                    </button>

                </form>
            </div>
        `;

        // Event listeners
        const backBtn = container.querySelector('#back-to-dashboard');
        backBtn.addEventListener('click', () => this.showDashboard());

        const form = container.querySelector('#create-test-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateTest(fag);
        });
    }

    /**
     * Handle test creation
     * @param {string} fag
     */
    handleCreateTest(fag) {
        const title = document.getElementById('test-title').value.trim();
        const level = document.getElementById('test-level').value;
        const questions = parseInt(document.getElementById('test-questions').value);
        const time = parseInt(document.getElementById('test-time').value) || 0;
        const shuffle = document.getElementById('test-shuffle').checked;

        if (!title || !level) {
            visToast('⚠️ Vennligst fyll ut alle obligatoriske felt', 'warning');
            return;
        }

        // Generate unique test code
        const testCode = this.generateTestCode();

        // Create test object
        const test = {
            id: Date.now().toString(),
            code: testCode,
            fag,
            title,
            level,
            questions,
            timeLimit: time,
            shuffle,
            createdAt: new Date().toISOString(),
            createdBy: this.userName,
            results: []
        };

        // Save test
        this.tests.push(test);
        this.saveTests();

        console.log('✅ Test created:', test);

        // Show success and QR code
        this.showTestCreatedSuccess(test);
    }

    /**
     * Show test created success screen
     * @param {Object} test
     */
    showTestCreatedSuccess(test) {
        const container = document.getElementById('app');
        if (!container) return;

        const testUrl = `${window.location.origin}${window.location.pathname}?prove=${test.code}`;

        container.innerHTML = `
            <div class="test-success-view" style="padding: 80px 20px 100px; max-width: 600px; margin: 0 auto; text-align: center;">

                <div class="success-animation" style="font-size: 100px; margin-bottom: 20px; animation: bounce 0.6s;">
                    🎉
                </div>

                <h1 style="font-size: 32px; margin-bottom: 10px;">Prøve opprettet!</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 40px;">
                    Prøven "<strong>${test.title}</strong>" er nå klar for elevene
                </p>

                <div class="test-code-card playful-card" style="background: white; padding: 30px; border-radius: var(--radius-lg, 30px); margin-bottom: 30px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Prøvekode</div>
                    <div class="test-code" style="font-size: 36px; font-weight: 800; font-family: monospace; color: var(--primary-purple, #7C3AED); letter-spacing: 4px; margin-bottom: 20px;">
                        ${test.code}
                    </div>

                    <div id="qrcode" style="display: inline-block; padding: 20px; background: white; border-radius: var(--radius-md, 20px); margin-bottom: 20px;"></div>

                    <div style="font-size: 13px; color: #999; margin-top: 15px;">
                        Elever kan scanne QR-koden eller skrive inn prøvekoden
                    </div>
                </div>

                <div class="action-buttons" style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="copy-code-btn" class="btn btn-primary" style="width: 100%;">
                        📋 Kopier prøvekode
                    </button>
                    <button id="copy-link-btn" class="btn btn-secondary" style="width: 100%;">
                        🔗 Kopier link til prøve
                    </button>
                    <button id="view-tests-btn" class="btn btn-secondary" style="width: 100%;">
                        📝 Se alle lagrede prøver
                    </button>
                    <button id="back-dashboard-btn" class="btn btn-secondary" style="width: 100%;">
                        🏠 Tilbake til dashboard
                    </button>
                </div>

                <style>
                    @keyframes bounce {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }
                </style>
            </div>
        `;

        // Generer ekte QR-kode med QRCode.js (lastet via CDN i index-v2.html)
        const qrcodeContainer = container.querySelector('#qrcode');
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrcodeContainer, {
                    text: testUrl,
                    width: 200,
                    height: 200,
                    colorDark: '#1F2937',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) {
                qrcodeContainer.innerHTML = `<div style="width:200px;height:200px;background:#f5f3ff;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#7C3AED;font-size:13px;text-align:center;padding:10px;">Kode: <strong>${test.code}</strong></div>`;
            }
        } else {
            qrcodeContainer.innerHTML = `<div style="width:200px;height:200px;background:#f5f3ff;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#7C3AED;font-size:13px;text-align:center;padding:10px;">Kode: <strong>${test.code}</strong></div>`;
        }

        // Event listeners
        const copyCodeBtn = container.querySelector('#copy-code-btn');
        copyCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(test.code);
            visToast('✅ Prøvekode kopiert!', 'success');
        });

        const copyLinkBtn = container.querySelector('#copy-link-btn');
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(testUrl);
            visToast('✅ Link kopiert!', 'success');
        });

        const viewTestsBtn = container.querySelector('#view-tests-btn');
        viewTestsBtn.addEventListener('click', () => this.showSavedTests());

        const backBtn = container.querySelector('#back-dashboard-btn');
        backBtn.addEventListener('click', () => this.showDashboard());
    }

    /**
     * Show saved tests
     */
    showSavedTests() {
        this.currentView = 'saved-tests';
        menuSystem.setActive('saved-tests');

        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div class="saved-tests-view" style="padding: 80px 20px 100px; max-width: 1200px; margin: 0 auto;">
                <header style="margin-bottom: 40px;">
                    <h1 style="font-size: 32px; margin-bottom: 10px;">📝 Lagrede prøver</h1>
                    <p style="color: #666;">Administrer og se resultater fra prøvene dine</p>
                </header>

                ${this.tests.length === 0 ? `
                    <div class="empty-state" style="text-align: center; padding: 60px 20px; background: white; border-radius: var(--radius-lg, 30px);">
                        <div style="font-size: 80px; margin-bottom: 20px; opacity: 0.3;">📭</div>
                        <h3 style="font-size: 24px; margin-bottom: 10px;">Ingen prøver ennå</h3>
                        <p style="color: #666; margin-bottom: 30px;">Opprett din første prøve fra dashboard</p>
                        <button class="btn btn-primary" id="go-dashboard">
                            🏠 Gå til dashboard
                        </button>
                    </div>
                ` : `
                    <div class="tests-grid" style="display: grid; gap: 20px;">
                        ${this.tests.map(test => this.renderTestCard(test)).join('')}
                    </div>
                `}
            </div>
        `;

        // Event listeners
        if (this.tests.length === 0) {
            const goDashboardBtn = container.querySelector('#go-dashboard');
            goDashboardBtn.addEventListener('click', () => this.showDashboard());
        } else {
            // Add event listeners for test cards
            const deleteButtons = container.querySelectorAll('.delete-test-btn');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const testId = btn.dataset.testId;
                    this.deleteTest(testId);
                });
            });

            const viewButtons = container.querySelectorAll('.view-test-btn');
            viewButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const testId = btn.dataset.testId;
                    this.viewTestDetails(testId);
                });
            });
        }
    }

    /**
     * Render test card
     * @param {Object} test
     */
    renderTestCard(test) {
        const fagEmoji = {
            gloser: '📚'
        };

        const date = new Date(test.createdAt).toLocaleDateString('no-NO');

        return `
            <div class="test-card playful-card" style="background: white; padding: 25px; border-radius: var(--radius-lg, 30px); box-shadow: var(--shadow-md); display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        <span style="font-size: 32px;">${fagEmoji[test.fag]}</span>
                        <div>
                            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${test.title}</h3>
                            <div style="font-size: 13px; color: #666;">
                                ${test.level} • ${test.questions} spørsmål • Opprettet ${date}
                            </div>
                        </div>
                    </div>
                    <div style="font-family: monospace; font-weight: 600; color: var(--primary-purple, #7C3AED); margin-top: 10px;">
                        Kode: ${test.code}
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="view-test-btn btn btn-secondary" data-test-id="${test.id}" style="padding: 10px 20px;">
                        👁️ Se detaljer
                    </button>
                    <button class="delete-test-btn btn btn-danger" data-test-id="${test.id}" style="padding: 10px 20px; background: #dc2626; color: white;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * View test details
     * @param {string} testId
     */
    viewTestDetails(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;

        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div class="test-details-view" style="padding: 80px 20px 100px; max-width: 800px; margin: 0 auto;">
                <button class="btn-back" id="back-to-tests" style="margin-bottom: 20px;">
                    ← Tilbake til prøver
                </button>

                <div class="playful-card" style="background: white; padding: 40px; border-radius: var(--radius-lg, 30px);">
                    <h1 style="font-size: 28px; margin-bottom: 20px;">${test.title}</h1>

                    <div class="test-info" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                        <div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 4px;">Prøvekode</div>
                            <div style="font-size: 20px; font-weight: 700; font-family: monospace; color: var(--primary-purple, #7C3AED);">
                                ${test.code}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 4px;">Fag</div>
                            <div style="font-size: 18px; font-weight: 600;">GloseMester</div>
                        </div>
                        <div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 4px;">Nivå</div>
                            <div style="font-size: 18px; font-weight: 600;">${test.level}</div>
                        </div>
                        <div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 4px;">Antall spørsmål</div>
                            <div style="font-size: 18px; font-weight: 600;">${test.questions}</div>
                        </div>
                    </div>

                    <div class="results-section" style="margin-top: 40px;">
                        <h3 style="font-size: 20px; margin-bottom: 20px;">📊 Resultater</h3>
                        ${test.results.length === 0 ? `
                            <div style="text-align: center; padding: 40px; background: #f9f9f9; border-radius: var(--radius-md, 20px);">
                                <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;">📭</div>
                                <p style="color: #666;">Ingen elever har tatt denne prøven ennå</p>
                            </div>
                        ` : `
                            <div class="results-list">
                                ${test.results.map(result => `
                                    <div style="padding: 15px; background: #f9f9f9; border-radius: 12px; margin-bottom: 10px;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <div style="font-weight: 600;">${result.studentName || 'Anonym'}</div>
                                            <div style="font-weight: 700; color: ${result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#dc2626'};">
                                                ${result.score}%
                                            </div>
                                        </div>
                                        <div style="font-size: 13px; color: #666; margin-top: 4px;">
                                            ${result.correct}/${result.total} riktige • ${new Date(result.completedAt).toLocaleString('no-NO')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        const backBtn = container.querySelector('#back-to-tests');
        backBtn.addEventListener('click', () => this.showSavedTests());
    }

    /**
     * Delete test
     * @param {string} testId
     */
    deleteTest(testId) {
        if (!confirm('Er du sikker på at du vil slette denne prøven?')) return;

        this.tests = this.tests.filter(t => t.id !== testId);
        this.saveTests();
        this.showSavedTests();
        visToast('🗑️ Prøve slettet', 'info');
    }

    /**
     * Show standard tests (placeholder)
     */
    showStandardTests() {
        this.currentView = 'standard-tests';
        menuSystem.setActive('standard-tests');

        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div class="standard-tests-view" style="padding: 80px 20px 100px; max-width: 800px; margin: 0 auto; text-align: center;">
                <h1 style="font-size: 32px; margin-bottom: 20px;">📚 Standardprøver</h1>
                <div class="playful-card" style="background: white; padding: 60px 40px; border-radius: var(--radius-lg, 30px);">
                    <div style="font-size: 80px; margin-bottom: 20px; opacity: 0.3;">🚧</div>
                    <h3 style="font-size: 24px; margin-bottom: 10px;">Kommer snart!</h3>
                    <p style="color: #666;">Vi jobber med ferdige standardprøver som du kan bruke direkte</p>
                </div>
            </div>
        `;
    }

    /**
     * Show glosebank (placeholder)
     */
    showGlosebank() {
        visToast('🚧 GloseBank kommer snart!', 'info');
    }

    /**
     * Show admin panel (placeholder)
     */
    showAdmin() {
        visToast('🚧 Admin-panel kommer snart!', 'info');
    }

    /**
     * Get level name
     */
    getLevelName(level, fag) {
        const levels = {
            gloser: {
                niva1: 'Nivå 1 - Grunnleggende',
                niva2: 'Nivå 2 - Videregående',
                niva3: 'Nivå 3 - Avansert',
                niva4: 'Nivå 4 - Ekspert'
            }
        };

        return levels[fag]?.[level] || level;
    }

    /**
     * Get test count by fag
     */
    getTestCountByFag(fag) {
        return this.tests.filter(t => t.fag === fag).length;
    }

    /**
     * Generate unique test code
     */
    generateTestCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Load tests from localStorage
     */
    loadTests() {
        try {
            const saved = localStorage.getItem('mester_teacher_tests');
            if (saved) {
                this.tests = JSON.parse(saved);
                console.log(`📚 Loaded ${this.tests.length} tests from storage`);
            }
        } catch (error) {
            console.error('Error loading tests:', error);
            this.tests = [];
        }
    }

    /**
     * Save tests to localStorage
     */
    saveTests() {
        try {
            localStorage.setItem('mester_teacher_tests', JSON.stringify(this.tests));
            console.log(`💾 Saved ${this.tests.length} tests to storage`);
        } catch (error) {
            console.error('Error saving tests:', error);
        }
    }

    /**
     * Go home
     */
    goHome() {
        window.location.href = '/';
    }

    /**
     * Logout
     */
    logout() {
        if (confirm('Er du sikker på at du vil logge ut?')) {
            menuSystem.hideMenu();
            this.goHome();
        }
    }
}

// Export singleton
export const teacherModule = new TeacherModule();

// Make globally available
if (typeof window !== 'undefined') {
    window.TeacherModule = TeacherModule;
    window.teacherModule = teacherModule;
}

console.log('👨‍🏫 TeacherModule loaded');
