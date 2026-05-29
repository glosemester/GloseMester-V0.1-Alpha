/* ============================================
   TEACHER-MODULE.JS - GloseMester v3.0
   Ground-up rebuild — mørk editorial design
   ============================================ */

import { menuSystem } from '../../core/navigation/menu-system.js';
import { appHeader } from '../../core/navigation/app-header.js';
import { visToast } from '../../core/utils/feedback.js';

const LEVEL_NAMES = {
    niva1: 'Nivå 1', niva2: 'Nivå 2', niva3: 'Nivå 3', niva4: 'Nivå 4', eget: 'Egne gloser'
};
import {
    auth, db,
    collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc,
    query, where, serverTimestamp
} from '../../core/auth/firebase-config.js';

export class TeacherModule {
    constructor() {
        this.userName = 'Lærer';
        this.user = null;
        this.isAdmin = false;
        this.tests = [];
        this.currentView = null;
    }

    // ==================== INIT ====================

    async init(options = {}) {
        this.userName = options.userName || options.user?.displayName || 'Lærer';
        this.user = options.user || null;
        this.isAdmin = options.isAdmin || false;

        document.body.classList.add('teacher-mode');
        await this.loadTests();
        this._buildMenu();

        const hasOnboarded = localStorage.getItem('mester_onboarding_done');
        if (!hasOnboarded && this.tests.length === 0) {
            this.navigate('dashboard');
            this.showOnboardingModal();
        } else {
            this.navigate('dashboard');
        }
    }

    _buildMenu() {
        menuSystem.init();
        menuSystem.showMenu('laerer', {
            userName:    this.userName,
            onDashboard: () => this.navigate('dashboard'),
            onMyTests:   () => this.navigate('my-tests'),
            onCreateTest:() => this.navigate('create-test'),
            onAnalytics: () => this.navigate('analytics'),
            onMinSide:   () => this.navigate('min-side'),
            onHome:      () => this.goHome(),
            onLogout:    () => this.logout()
        });
        // Skjul elev-header når vi er i lærermodus
        appHeader.hide();
    }

    // ==================== NAVIGATION ====================

    navigate(view, params = {}) {
        this.currentView = view;

        const viewTitles = {
            'dashboard':    'Oversikt',
            'my-tests':     'Mine prøver',
            'create-test':  'Lag prøve',
            'analytics':    'Analyser',
            'min-side':     'Min side',
            'test-details': 'Prøvedetaljer',
            'edit-test':    'Rediger prøve',
        };

        const viewMap = {
            'dashboard':    () => this.renderDashboard(),
            'my-tests':     () => this.renderMyTests(),
            'create-test':  () => this.renderCreateTest(),
            'analytics':    () => this.renderAnalytics(),
            'min-side':     () => this.renderMinSide(),
        };

        if (viewMap[view]) {
            viewMap[view]();
            menuSystem.setActive(view);
        } else if (view === 'test-details') {
            this.renderTestDetails(params.testId);
        } else if (view === 'edit-test') {
            this.renderEditTest(params.testId);
        } else if (view === 'test-success') {
            this.renderTestSuccess(params.test);
        }

        // Oppdater topbar-tittel på desktop
        const topbar = document.getElementById('teacher-topbar');
        if (topbar) {
            const logoEl = topbar.querySelector('.t-topbar-logo');
            if (logoEl) logoEl.textContent = viewTitles[view] || 'GloseMester';
        }
    }

    _setContent(html) {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = `<div class="teacher-content">${html}</div>`;
    }

    // ==================== DASHBOARD ====================

    renderDashboard() {
        const totalTests = this.tests.length;
        const totalResults = this.tests.reduce((s, t) => s + (t.results?.length || 0), 0);
        const avgScore = this._calcAvgScore();

        const recentTests = [...this.tests]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        this._setContent(`
            <div class="t-page-header">
                <div class="t-eyebrow">Lærerportal</div>
                <div class="t-page-title">God dag, ${this.userName}</div>
                <div class="t-page-sub">Her er oversikten din for GloseMester</div>
            </div>

            <div class="t-stats-row">
                <div class="t-stat-card">
                    <div class="t-stat-label">Lagrede prøver</div>
                    <div class="t-stat-value">${totalTests}</div>
                </div>
                <div class="t-stat-card">
                    <div class="t-stat-label">Innleveringer</div>
                    <div class="t-stat-value teal">${totalResults}</div>
                </div>
                <div class="t-stat-card">
                    <div class="t-stat-label">Snitt-score</div>
                    <div class="t-stat-value white">${avgScore}</div>
                </div>
            </div>

            <div class="t-section-title">Hurtighandlinger</div>
            <div class="t-actions-grid">
                <button class="t-action-card" id="quick-create">
                    <div class="t-action-icon">➕</div>
                    <div class="t-action-title">Lag ny prøve</div>
                    <div class="t-action-desc">Opprett en ny glose-test og del med klassen din</div>
                    <div class="t-action-arrow">→</div>
                </button>
                <button class="t-action-card" id="quick-tests">
                    <div class="t-action-icon">📝</div>
                    <div class="t-action-title">Mine prøver</div>
                    <div class="t-action-desc">Se, rediger og del prøvene du har opprettet</div>
                    <div class="t-action-arrow">→</div>
                </button>
                <button class="t-action-card" id="quick-analytics">
                    <div class="t-action-icon">📈</div>
                    <div class="t-action-title">Analyser</div>
                    <div class="t-action-desc">Følg med på elevresultater og fremgang</div>
                    <div class="t-action-arrow">→</div>
                </button>
            </div>

            ${recentTests.length > 0 ? `
                <div class="t-divider"></div>
                <div class="t-section-title">Siste prøver</div>
                <div class="t-test-grid">
                    ${recentTests.map(t => this._renderTestCard(t)).join('')}
                </div>
            ` : ''}
        `);

        document.getElementById('quick-create')?.addEventListener('click', () => this.navigate('create-test'));
        document.getElementById('quick-tests')?.addEventListener('click',  () => this.navigate('my-tests'));
        document.getElementById('quick-analytics')?.addEventListener('click', () => this.navigate('analytics'));
        this._attachTestCardListeners();
    }

    // ==================== MINE PRØVER ====================

    renderMyTests() {
        if (this.tests.length === 0) {
            this._setContent(`
                <div class="t-page-header">
                    <div class="t-eyebrow">Prøver</div>
                    <div class="t-page-title">Mine prøver</div>
                </div>
                ${this._renderEmptyState('Ingen prøver ennå', 'Lag din første prøve og del den med klassen.', 'Lag prøve', () => this.navigate('create-test'))}
            `);
            return;
        }

        this._setContent(`
            <div class="t-page-header">
                <div class="t-eyebrow">Prøver</div>
                <div class="t-page-title">Mine prøver</div>
                <div class="t-page-sub">${this.tests.length} ${this.tests.length === 1 ? 'prøve' : 'prøver'} totalt</div>
            </div>

            <div class="t-search-bar">
                <input class="t-search-input" id="test-search" placeholder="Søk etter prøvetittel…" type="search" />
            </div>

            <div class="t-test-grid" id="tests-grid">
                ${this.tests.map(t => this._renderTestCard(t)).join('')}
            </div>
        `);

        document.getElementById('test-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.t-test-card').forEach(card => {
                const title = card.querySelector('.t-test-title')?.textContent.toLowerCase() || '';
                card.style.display = title.includes(q) ? '' : 'none';
            });
        });

        this._attachTestCardListeners();
    }

    _renderTestCard(test) {
        const date = new Date(test.createdAt).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' });
        const resultCount = test.results?.length || 0;

        return `
            <div class="t-test-card" data-test-id="${test.id}">
                <div class="t-test-title">${this._esc(test.title)}</div>
                <div class="t-test-meta">
                    <span class="t-chip">${LEVEL_NAMES[test.level] || test.level}</span>
                    <span class="t-chip">${test.questions} spørsmål</span>
                    <span class="t-chip">${date}</span>
                    ${resultCount > 0 ? `<span class="t-chip">${resultCount} innlevering${resultCount !== 1 ? 'er' : ''}</span>` : ''}
                </div>
                <div class="t-test-code">${test.code}</div>
                <div class="t-test-actions">
                    <button class="t-btn t-btn-ghost t-btn-sm view-test-btn" data-test-id="${test.id}">👁 Detaljer</button>
                    <button class="t-btn t-btn-ghost t-btn-sm edit-test-btn" data-test-id="${test.id}">✏️ Rediger</button>
                    <button class="t-btn t-btn-ghost t-btn-sm share-test-btn" data-test-id="${test.id}">🔗 Del</button>
                    <button class="t-btn t-btn-danger t-btn-sm delete-test-btn" data-test-id="${test.id}" style="margin-left:auto">🗑</button>
                </div>
            </div>
        `;
    }

    _attachTestCardListeners() {
        document.querySelectorAll('.view-test-btn').forEach(btn =>
            btn.addEventListener('click', () => this.navigate('test-details', { testId: btn.dataset.testId })));
        document.querySelectorAll('.edit-test-btn').forEach(btn =>
            btn.addEventListener('click', () => this.navigate('edit-test', { testId: btn.dataset.testId })));
        document.querySelectorAll('.share-test-btn').forEach(btn =>
            btn.addEventListener('click', () => this._shareTest(btn.dataset.testId)));
        document.querySelectorAll('.delete-test-btn').forEach(btn =>
            btn.addEventListener('click', () => this.handleDeleteTest(btn.dataset.testId)));
    }

    // ==================== LAG PRØVE ====================

    renderCreateTest(prefill = null) {
        const isEdit = !!prefill;
        const v = prefill || {};
        const initialWords = v.words?.length > 0
            ? v.words
            : [{s:'',e:''},{s:'',e:''},{s:'',e:''},{s:'',e:''}];

        this._setContent(`
            <button class="t-btn-back" id="back-btn">Tilbake</button>

            <div class="t-page-header">
                <div class="t-eyebrow">${isEdit ? 'Rediger' : 'Opprett'}</div>
                <div class="t-page-title">${isEdit ? 'Rediger prøve' : 'Lag ny prøve'}</div>
            </div>

            ${!isEdit ? `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:640px;margin-bottom:28px;">
                <button id="tab-custom" class="t-tab-btn t-tab-active">
                    <div style="font-size:22px;margin-bottom:6px;">✏️</div>
                    <div style="font-weight:700;font-size:15px;">Egne gloser</div>
                    <div style="font-size:12px;color:var(--t-muted);margin-top:3px;">Skriv inn dine egne ord</div>
                </button>
                <button id="tab-standard" class="t-tab-btn">
                    <div style="font-size:22px;margin-bottom:6px;">📚</div>
                    <div style="font-weight:700;font-size:15px;">Ferdige prøver</div>
                    <div style="font-size:12px;color:var(--t-muted);margin-top:3px;">Bruk standardinnhold</div>
                </button>
            </div>
            ` : ''}

            <div id="panel-custom" style="max-width:640px;">
                <div class="t-card">
                    <form class="t-form" id="create-test-form">
                        <div class="t-form-group">
                            <label class="t-label" for="test-title">Prøvetittel</label>
                            <input class="t-input" id="test-title" type="text"
                                placeholder="F.eks. «Ukeprøve — Klasse 5B»"
                                value="${this._esc(v.title || '')}" required />
                        </div>
                        <div class="t-form-group">
                            <label class="t-label">Gloser</label>
                            <div class="t-word-list-header">
                                <span class="t-word-col-label">Norsk</span>
                                <span></span>
                                <span class="t-word-col-label">Engelsk</span>
                                <span></span>
                            </div>
                            <div id="words-list" class="t-word-list">
                                ${initialWords.map(w => this._wordRowHTML(w.s, w.e)).join('')}
                            </div>
                            <button class="t-btn-add-word" id="add-word-btn" type="button">+ Legg til ord</button>
                        </div>
                        <div class="t-form-group">
                            <label class="t-checkbox-row">
                                <input class="t-checkbox" id="test-shuffle" type="checkbox" ${v.shuffle !== false ? 'checked' : ''} />
                                <span class="t-checkbox-label">Bland rekkefølgen på spørsmålene</span>
                            </label>
                        </div>
                        <button class="t-btn t-btn-primary t-btn-lg" type="submit" style="width:100%;">
                            ${isEdit ? '💾 Lagre endringer' : '✨ Opprett prøve'}
                        </button>
                        ${isEdit ? `<input type="hidden" id="edit-test-id" value="${v.id}" />` : ''}
                    </form>
                </div>
            </div>

            <div id="panel-standard" style="max-width:780px;display:none;">
                <div id="standard-list"><div class="loading" style="padding:40px;text-align:center;color:var(--t-muted);">Laster prøver…</div></div>
            </div>
        `);

        document.getElementById('back-btn')?.addEventListener('click', () =>
            isEdit ? this.navigate('my-tests') : this.navigate('dashboard'));

        document.getElementById('create-test-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            isEdit ? this.handleEditTest() : this.handleCreateTest();
        });

        document.getElementById('words-list')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.t-word-remove');
            if (btn) btn.closest('.t-word-row').remove();
        });

        document.getElementById('add-word-btn')?.addEventListener('click', () => {
            const list = document.getElementById('words-list');
            if (!list) return;
            const row = document.createElement('div');
            row.className = 't-word-row';
            row.innerHTML = this._wordRowHTML();
            list.appendChild(row);
            row.querySelector('.t-word-no')?.focus();
        });

        if (!isEdit) {
            const tabCustom   = document.getElementById('tab-custom');
            const tabStandard = document.getElementById('tab-standard');
            const panelCustom = document.getElementById('panel-custom');
            const panelStd    = document.getElementById('panel-standard');

            tabCustom.addEventListener('click', () => {
                tabCustom.classList.add('t-tab-active');
                tabStandard.classList.remove('t-tab-active');
                panelCustom.style.display = '';
                panelStd.style.display = 'none';
            });

            tabStandard.addEventListener('click', () => {
                tabStandard.classList.add('t-tab-active');
                tabCustom.classList.remove('t-tab-active');
                panelCustom.style.display = 'none';
                panelStd.style.display = '';
                this._loadStandardTests();
            });
        }
    }

    async _loadStandardTests() {
        const container = document.getElementById('standard-list');
        if (!container) return;
        try {
            const snap = await getDocs(collection(db, 'standardprover'));
            if (snap.empty) {
                container.innerHTML = `<div style="text-align:center;color:var(--t-muted);padding:40px;">Ingen ferdige prøver tilgjengelig ennå.</div>`;
                return;
            }
            const cards = snap.docs.map(d => {
                const data = d.data();
                const antall = (data.ordliste || []).length;
                return `
                    <div class="t-card" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
                        <div>
                            <div style="font-weight:700;font-size:15px;color:var(--t-text);">${this._esc(data.tittel || data.title || 'Uten tittel')}</div>
                            <div style="font-size:13px;color:var(--t-muted);margin-top:3px;">${antall} glose-par${data.nivaa ? ' · ' + data.nivaa : ''}</div>
                        </div>
                        <button class="t-btn t-btn-primary" data-std-id="${d.id}">Bruk denne →</button>
                    </div>`;
            }).join('');
            container.innerHTML = cards;
            container.querySelectorAll('[data-std-id]').forEach(btn => {
                btn.addEventListener('click', () => this._useStandardTest(btn.dataset.stdId, snap));
            });
        } catch (e) {
            container.innerHTML = `<div style="color:var(--t-danger);padding:20px;">Feil ved lasting: ${e.message}</div>`;
        }
    }

    async _useStandardTest(docId, snap) {
        const d = snap.docs.find(d => d.id === docId);
        if (!d) return;
        const data = d.data();
        const kode = this._generateCode();
        try {
            const docRef = await addDoc(collection(db, 'prover'), {
                kode,
                fag: data.fag || 'gloser',
                tittel: data.tittel || data.title,
                ordliste: data.ordliste || [],
                antallSporsmal: data.antallSporsmal || (data.ordliste || []).length,
                tidsbegrensning: 0,
                bland: true,
                opprettet_av: this.user?.uid || 'ukjent',
                opprettetAvNavn: this.userName,
                opprettetDato: serverTimestamp(),
                fraStandard: docId
            });
            const test = {
                id: docRef.id, code: kode,
                title: data.tittel || data.title,
                level: data.fag || 'eget',
                questions: data.antallSporsmal || (data.ordliste || []).length,
                timeLimit: 0, shuffle: true,
                words: data.ordliste || [],
                createdAt: new Date().toISOString(), results: []
            };
            this.tests.push(test);
            this.navigate('test-success', { test });
        } catch (e) {
            visToast('Feil ved oppretting: ' + e.message, 'error');
        }
    }

    // ==================== PRØVEDETALJER ====================

    renderTestDetails(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) { this.navigate('my-tests'); return; }

        const testUrl = `${window.location.origin}${window.location.pathname}?prove=${test.code}`;
        const date = new Date(test.createdAt).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });

        this._setContent(`
            <button class="t-btn-back" id="back-btn">Mine prøver</button>

            <div class="t-details-header">
                <div>
                    <div class="t-eyebrow">Prøve</div>
                    <div class="t-page-title">${this._esc(test.title)}</div>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;">
                    <button class="t-btn t-btn-secondary" id="edit-from-detail">✏️ Rediger</button>
                    <button class="t-btn t-btn-secondary" id="share-from-detail">🔗 Del</button>
                </div>
            </div>

            <div class="t-info-grid">
                <div class="t-info-item">
                    <div class="t-info-item-label">Prøvekode</div>
                    <div class="t-info-item-value mono">${test.code}</div>
                </div>
                <div class="t-info-item">
                    <div class="t-info-item-label">Nivå</div>
                    <div class="t-info-item-value">${LEVEL_NAMES[test.level] || test.level}</div>
                </div>
                <div class="t-info-item">
                    <div class="t-info-item-label">Spørsmål</div>
                    <div class="t-info-item-value">${test.questions}</div>
                </div>
                <div class="t-info-item">
                    <div class="t-info-item-label">Opprettet</div>
                    <div class="t-info-item-value">${date}</div>
                </div>
                ${test.timeLimit ? `
                <div class="t-info-item">
                    <div class="t-info-item-label">Tidsbegrensning</div>
                    <div class="t-info-item-value">${test.timeLimit} min</div>
                </div>` : ''}
            </div>

            <div class="t-card" style="max-width:340px;text-align:center;margin-bottom:28px;">
                <div class="t-code-label">QR-kode</div>
                <div id="qrcode-wrap" class="t-qr-wrap" style="display:inline-block;margin:12px 0;"></div>
                <div style="font-size:13px;color:var(--t-muted);">Elever scanner for å starte</div>
                <div style="display:flex;gap:8px;margin-top:14px;">
                    <button class="t-btn t-btn-secondary t-btn-sm" id="copy-code" style="flex:1">📋 Kode</button>
                    <button class="t-btn t-btn-secondary t-btn-sm" id="copy-link" style="flex:1">🔗 Link</button>
                </div>
            </div>

            <div class="t-divider"></div>
            <div class="t-results-header">Resultater</div>
            ${test.results?.length > 0 ? `
                <div>
                    ${test.results.map(r => {
                        const score = r.score || 0;
                        const cls = score >= 80 ? 'good' : score >= 50 ? 'ok' : 'poor';
                        return `
                        <div class="t-result-row">
                            <div>
                                <div class="t-result-name">${this._esc(r.studentName || 'Anonym')}</div>
                                <div class="t-result-meta">${r.correct}/${r.total} riktige · ${new Date(r.completedAt).toLocaleString('no-NO')}</div>
                            </div>
                            <div class="t-result-score ${cls}">${score}%</div>
                        </div>`;
                    }).join('')}
                </div>
            ` : this._renderEmptyState('Ingen resultater ennå', 'Del prøven med klassen for å samle inn besvarelser.', null, null)}
        `);

        document.getElementById('back-btn')?.addEventListener('click', () => this.navigate('my-tests'));
        document.getElementById('edit-from-detail')?.addEventListener('click', () => this.navigate('edit-test', { testId }));
        document.getElementById('share-from-detail')?.addEventListener('click', () => this._shareTest(testId));
        document.getElementById('copy-code')?.addEventListener('click', () => {
            navigator.clipboard.writeText(test.code);
            visToast('✅ Prøvekode kopiert!', 'success');
        });
        document.getElementById('copy-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(testUrl);
            visToast('✅ Link kopiert!', 'success');
        });

        this._generateQR('qrcode-wrap', testUrl);
    }

    // ==================== REDIGER PRØVE ====================

    renderEditTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) { this.navigate('my-tests'); return; }
        this.renderCreateTest(test);
    }

    // ==================== SUKSESSSKJERM ====================

    renderTestSuccess(test) {
        const testUrl = `${window.location.origin}${window.location.pathname}?prove=${test.code}`;

        this._setContent(`
            <div class="t-success-screen">
                <div class="t-success-icon">🎉</div>
                <div class="t-success-title">Prøve opprettet!</div>
                <div class="t-success-sub">«${this._esc(test.title)}» er klar for elevene</div>

                <div class="t-code-display">
                    <div class="t-code-label">Prøvekode</div>
                    <div class="t-code-value">${test.code}</div>
                    <div id="qrcode-wrap" class="t-qr-wrap"></div>
                    <div style="font-size:12px;color:var(--t-muted);margin-top:6px;">Elever scanner eller skriver inn koden</div>
                </div>

                <div class="t-action-list">
                    <button class="t-btn t-btn-primary t-btn-lg" id="copy-code-btn" style="width:100%;">📋 Kopier prøvekode</button>
                    <button class="t-btn t-btn-secondary t-btn-lg" id="copy-link-btn" style="width:100%;">🔗 Kopier lenke</button>
                    <button class="t-btn t-btn-secondary t-btn-lg" id="share-colleague-btn" style="width:100%;background:rgba(28,75,130,0.15);border-color:rgba(28,75,130,0.3);color:#7EB3FF;">🏫 Del med en kollega</button>
                    <div style="display:flex;gap:10px;margin-top:4px;">
                        <button class="t-btn t-btn-ghost" id="view-tests-btn" style="flex:1;">📝 Mine prøver</button>
                        <button class="t-btn t-btn-ghost" id="back-dashboard-btn" style="flex:1;">🏠 Dashboard</button>
                    </div>
                </div>
            </div>
        `);

        document.getElementById('copy-code-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(test.code);
            visToast('✅ Prøvekode kopiert!', 'success');
        });
        document.getElementById('copy-link-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(testUrl);
            visToast('✅ Lenke kopiert!', 'success');
        });
        document.getElementById('share-colleague-btn')?.addEventListener('click', () => this._shareColleague());
        document.getElementById('view-tests-btn')?.addEventListener('click', () => this.navigate('my-tests'));
        document.getElementById('back-dashboard-btn')?.addEventListener('click', () => this.navigate('dashboard'));

        this._generateQR('qrcode-wrap', testUrl);
    }

    // ==================== ANALYSER ====================

    renderAnalytics() {
        const hasResults = this.tests.some(t => t.results?.length > 0);

        const rows = this.tests
            .filter(t => t.results?.length > 0)
            .map(t => {
                const avg = t.results.reduce((s, r) => s + (r.score || 0), 0) / t.results.length;
                const pct = Math.round(avg);
                return { t, pct };
            })
            .sort((a, b) => b.pct - a.pct);

        this._setContent(`
            <div class="t-page-header">
                <div class="t-eyebrow">Statistikk</div>
                <div class="t-page-title">Analyser</div>
                <div class="t-page-sub">Resultater per prøve</div>
            </div>

            ${!hasResults
                ? this._renderEmptyState('Ingen resultater ennå', 'Resultater vil dukke opp her når elevene har tatt prøvene dine.', 'Lag en prøve', () => this.navigate('create-test'))
                : `
                <div class="t-analytics-grid">
                    ${rows.map(({ t, pct }) => `
                        <div class="t-analytics-row" style="cursor:pointer;" data-test-id="${t.id}">
                            <div style="min-width:0;">
                                <div class="t-analytics-title">${this._esc(t.title)}</div>
                                <div class="t-analytics-meta">${t.results.length} innlevering${t.results.length !== 1 ? 'er' : ''} · ${LEVEL_NAMES[t.level] || t.level}</div>
                                <div class="t-bar-track">
                                    <div class="t-bar-fill ${pct >= 70 ? '' : 'teal'}" style="width:${pct}%;"></div>
                                </div>
                            </div>
                            <div class="t-analytics-score">${pct}%</div>
                        </div>
                    `).join('')}
                </div>
                `
            }
        `);

        document.querySelectorAll('.t-analytics-row[data-test-id]').forEach(row =>
            row.addEventListener('click', () => this.navigate('test-details', { testId: row.dataset.testId })));
    }

    // ==================== MIN SIDE ====================

    async renderMinSide() {
        const user = auth.currentUser || this.user;

        this._setContent(`
            <div class="t-page-header">
                <div class="t-eyebrow">Konto</div>
                <div class="t-page-title">Min side</div>
            </div>
            <div id="minside-loading" style="color:var(--t-muted);padding:20px 0;">Laster kontoinformasjon…</div>
            <div id="minside-content" style="display:none;">
                <div class="t-card" style="margin-bottom:20px;">
                    <div style="font-size:13px;color:var(--t-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Profil</div>
                    <div style="font-size:17px;font-weight:600;color:var(--t-text);margin-bottom:8px;" id="ms-name">—</div>
                    <div style="font-size:14px;color:var(--t-muted);" id="ms-email">—</div>
                    <div style="font-size:11px;color:var(--t-muted);margin-top:4px;font-family:var(--t-font-mono);" id="ms-uid">—</div>
                </div>

                <div class="t-card" style="margin-bottom:20px;">
                    <div style="font-size:13px;color:var(--t-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">Abonnement</div>
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                        <span id="ms-status-badge" style="padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;background:rgba(255,255,255,0.08);color:var(--t-muted);">Gratis</span>
                        <span id="ms-plan-text" style="font-size:14px;color:var(--t-text);">Gratisversjon</span>
                    </div>
                    <div style="margin-top:12px;font-size:13px;color:var(--t-muted);" id="ms-expiry"></div>
                    <div style="margin-top:16px;" id="ms-upgrade-wrap">
                        <a href="/oppgrader.html" style="display:inline-block;padding:10px 20px;background:var(--t-accent);color:var(--t-dark);border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">Oppgrader til Premium →</a>
                    </div>
                </div>

                <div class="t-card" style="margin-bottom:20px;">
                    <div style="font-size:13px;color:var(--t-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">Kampanjekode</div>
                    <div style="display:flex;gap:10px;max-width:420px;">
                        <input type="text" id="ms-kampanje-input" placeholder="F.eks: BETA2026"
                            style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:var(--t-text);font-size:14px;" />
                        <button id="ms-kampanje-btn"
                            style="padding:10px 20px;background:var(--t-accent);color:var(--t-dark);border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;white-space:nowrap;">
                            Aktiver
                        </button>
                    </div>
                </div>

                <div class="t-card" style="margin-bottom:20px;">
                    <div style="font-size:13px;color:var(--t-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">Personvern & GDPR</div>
                    <div style="display:flex;flex-direction:column;gap:10px;max-width:340px;">
                        <button id="ms-eksport-btn" class="t-btn t-btn-ghost" style="justify-content:flex-start;">
                            📥 Last ned mine data
                        </button>
                        <button id="ms-slett-btn" class="t-btn t-btn-ghost" style="justify-content:flex-start;color:var(--t-danger);border-color:rgba(239,68,68,0.3);">
                            🗑️ Slett min konto
                        </button>
                    </div>
                    <div style="margin-top:10px;font-size:12px;color:var(--t-muted);">
                        <a href="/personvern.html" style="color:var(--t-accent);text-decoration:none;">Personvernserklæring</a>
                        &nbsp;·&nbsp;
                        <a href="/vilkar.html" style="color:var(--t-accent);text-decoration:none;">Kjøpsvilkår</a>
                    </div>
                </div>

                <div class="t-card">
                    <div style="font-size:13px;color:var(--t-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Support</div>
                    <div style="font-size:14px;color:var(--t-text);">
                        <a href="mailto:kontakt@glosemester.no" style="color:var(--t-accent);text-decoration:none;">kontakt@glosemester.no</a>
                        <span style="color:var(--t-muted);margin-left:12px;">Svar innen 2 virkedager</span>
                    </div>
                </div>
            </div>
        `);

        // Hent brukerdata fra Firestore
        try {
            let userData = {};
            if (user?.uid) {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) userData = snap.data();
            }

            document.getElementById('ms-name').textContent  = userData.navn || user?.displayName || this.userName;
            document.getElementById('ms-email').textContent = userData.email || user?.email || '—';
            document.getElementById('ms-uid').textContent   = user?.uid || '—';

            const sub = userData.subscription || {};
            const abo = userData.abonnement   || {};
            const badge   = document.getElementById('ms-status-badge');
            const planEl  = document.getElementById('ms-plan-text');
            const expEl   = document.getElementById('ms-expiry');
            const upgrEl  = document.getElementById('ms-upgrade-wrap');

            if (sub.status === 'premium') {
                badge.textContent = '⭐ Premium';
                badge.style.background = 'rgba(16,185,129,0.15)';
                badge.style.color = '#10B981';
                planEl.textContent = sub.plan === 'premium_yearly' ? 'Premium Årlig' : 'Premium Månedlig';
                if (sub.expiresAt?.toDate) expEl.textContent = 'Utløper: ' + sub.expiresAt.toDate().toLocaleDateString('no-NO');
                upgrEl.style.display = 'none';
            } else if (abo.status === 'active' || abo.type === 'skolepakke') {
                badge.textContent = '🏫 Skolepakke';
                badge.style.background = 'rgba(139,92,246,0.15)';
                badge.style.color = '#FFB347';
                planEl.textContent = abo.beskrivelse || 'Skolepakke';
                if (abo.utloper?.toDate) expEl.textContent = 'Utløper: ' + abo.utloper.toDate().toLocaleDateString('no-NO');
                else expEl.textContent = 'Ubegrenset tilgang';
                upgrEl.style.display = 'none';
            }
        } catch (e) {
            console.warn('Min side: kunne ikke laste brukerdata', e);
        }

        document.getElementById('minside-loading').style.display = 'none';
        document.getElementById('minside-content').style.display = '';

        // Kampanjekode
        document.getElementById('ms-kampanje-btn')?.addEventListener('click', () => this._aktiverKampanjekode());

        // Eksporter data
        document.getElementById('ms-eksport-btn')?.addEventListener('click', async () => {
            try {
                const snap = user?.uid ? await getDoc(doc(db, 'users', user.uid)) : null;
                const userData = snap?.exists() ? snap.data() : {};
                const eksport = { uid: user?.uid, email: user?.email, profil: userData, prover: this.tests, eksportertDato: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(eksport, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'glosemester-mine-data.json';
                a.click();
                visToast('✅ Data eksportert', 'success');
            } catch (e) {
                visToast('Feil ved eksport: ' + e.message, 'error');
            }
        });

        // Slett konto
        document.getElementById('ms-slett-btn')?.addEventListener('click', async () => {
            if (!confirm('Er du helt sikker? Dette sletter PERMANENT all din data og kan ikke angres.')) return;
            if (!confirm('Siste sjanse: bekreft kontosletting.')) return;
            try {
                if (user?.uid) await deleteDoc(doc(db, 'users', user.uid));
                await user?.delete?.();
                visToast('Konto slettet.', 'info');
                this.goHome();
            } catch (e) {
                visToast('Feil: ' + e.message + '. Logg inn på nytt og prøv igjen.', 'error');
            }
        });
    }

    async _aktiverKampanjekode() {
        const input = document.getElementById('ms-kampanje-input');
        const kode = input?.value.trim().toUpperCase();
        if (!kode) { visToast('Skriv inn en kampanjekode', 'warning'); return; }

        const kampanjekoder = {
            'BETA2026':   { type: 'premium',    dager: 90,  beskrivelse: 'Beta-testkode (90 dager)' },
            'LANSERING':  { type: 'premium',    dager: 30,  beskrivelse: 'Lanseringskode (30 dager)' },
            'TEST7':      { type: 'premium',    dager: 7,   beskrivelse: 'Testkode (7 dager)' },
            'SKOLE2026':  { type: 'skolepakke', dager: 365, beskrivelse: 'Skolepakke (365 dager)' },
            'SKOLEPILOT': { type: 'skolepakke', dager: 180, beskrivelse: 'Skolepilot (180 dager)' },
            'SKOLETEST':  { type: 'skolepakke', dager: 30,  beskrivelse: 'Skoletest (30 dager)' }
        };
        const kampanje = kampanjekoder[kode];
        if (!kampanje) { visToast('Ugyldig kampanjekode: ' + kode, 'error'); if (input) input.value = ''; return; }

        const user = auth.currentUser || this.user;
        if (!user?.uid) { visToast('Ikke innlogget', 'error'); return; }

        try {
            const utloper = new Date();
            utloper.setDate(utloper.getDate() + kampanje.dager);
            await updateDoc(doc(db, 'users', user.uid), {
                'abonnement.type':           kampanje.type,
                'abonnement.status':         'active',
                'abonnement.utloper':        utloper,
                'abonnement.kampanjekode':   kode,
                'abonnement.sist_oppdatert': serverTimestamp()
            });
            visToast(`✅ ${kampanje.beskrivelse} aktivert!`, 'success');
            if (input) input.value = '';
            setTimeout(() => this.renderMinSide(), 800);
        } catch (e) {
            visToast('Feil ved aktivering: ' + e.message, 'error');
        }
    }

    // ==================== HANDLERS ====================

    async handleCreateTest() {
        const title   = document.getElementById('test-title')?.value.trim();
        const shuffle = document.getElementById('test-shuffle')?.checked ?? true;

        if (!title) { visToast('⚠️ Fyll ut prøvetittel', 'warning'); return; }

        const ordliste = this._collectWords();
        if (ordliste.length < 4) {
            visToast('⚠️ Du trenger minst 4 glose-par', 'warning');
            return;
        }

        const questions = ordliste.length;
        const timeLimit = 0;

        const btn = document.querySelector('#create-test-form [type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Lagrer…'; }

        const kode = this._generateCode();
        try {
            const docRef = await addDoc(collection(db, 'prover'), {
                kode,
                fag: 'gloser',
                tittel: title,
                ordliste,
                antallSporsmal: Math.min(questions, ordliste.length),
                tidsbegrensning: timeLimit,
                bland: shuffle,
                opprettet_av: this.user?.uid || 'ukjent',
                opprettetAvNavn: this.userName,
                opprettetDato: serverTimestamp()
            });

            const test = {
                id: docRef.id, code: kode, title, level: 'eget',
                questions: Math.min(questions, ordliste.length),
                timeLimit, shuffle, words: ordliste,
                createdAt: new Date().toISOString(), results: []
            };
            this.tests.push(test);
            this.navigate('test-success', { test });
        } catch (e) {
            visToast('Feil ved lagring: ' + e.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = '✨ Opprett prøve'; }
        }
    }

    async handleEditTest() {
        const id      = document.getElementById('edit-test-id')?.value;
        const title   = document.getElementById('test-title')?.value.trim();
        const shuffle = document.getElementById('test-shuffle')?.checked ?? true;

        if (!title) { visToast('⚠️ Fyll ut tittel', 'warning'); return; }

        const ordliste = this._collectWords();
        if (ordliste.length < 4) { visToast('⚠️ Minst 4 glose-par kreves', 'warning'); return; }

        const questions = ordliste.length;
        const timeLimit = 0;

        const idx = this.tests.findIndex(t => t.id === id);
        if (idx === -1) { visToast('Fant ikke prøven', 'error'); return; }

        try {
            await updateDoc(doc(db, 'prover', id), {
                tittel: title, ordliste,
                antallSporsmal: Math.min(questions, ordliste.length),
                tidsbegrensning: timeLimit, bland: shuffle
            });
            this.tests[idx] = { ...this.tests[idx], title, questions: Math.min(questions, ordliste.length), timeLimit, shuffle, words: ordliste };
            visToast('✅ Prøve oppdatert', 'success');
            this.navigate('test-details', { testId: id });
        } catch (e) {
            visToast('Feil ved lagring: ' + e.message, 'error');
        }
    }

    async handleDeleteTest(testId) {
        if (!confirm('Er du sikker på at du vil slette denne prøven?')) return;
        try {
            await deleteDoc(doc(db, 'prover', testId));
            this.tests = this.tests.filter(t => t.id !== testId);
            visToast('🗑️ Prøve slettet', 'info');
            this.navigate('my-tests');
        } catch (e) {
            visToast('Feil ved sletting: ' + e.message, 'error');
        }
    }

    _shareTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;
        const url = `${window.location.origin}${window.location.pathname}?prove=${test.code}`;
        if (navigator.share) {
            navigator.share({ title: test.title, url });
        } else {
            navigator.clipboard.writeText(url);
            visToast('✅ Lenke kopiert!', 'success');
        }
    }

    _shareColleague() {
        const msg = 'Hei! Jeg bruker GloseMester til glose-tester — enkelt å sette opp, og elevene elsker det. Prøv gratis: https://glosemester.no/for-laerere.html';
        if (navigator.share) {
            navigator.share({ title: 'GloseMester for lærere', text: msg, url: 'https://glosemester.no/for-laerere.html' });
        } else {
            navigator.clipboard.writeText(msg);
            visToast('✅ Tekst kopiert — lim inn til en kollega!', 'success');
        }
    }

    // ==================== ONBOARDING ====================

    showOnboardingModal() {
        const steps = [
            { icon: '👋', title: `Hei, ${this.userName}!`, body: 'GloseMester gjør det enkelt å lage glose-tester og dele dem med elevene dine. La oss sette opp din første prøve.' },
            { icon: '📝', title: 'Lag en prøve', body: 'Velg nivå (1.–10. trinn), sett antall spørsmål og gi prøven et navn. Innholdet er allerede klart.' },
            { icon: '📲', title: 'Del med klassen', body: 'Etter oppretting får du en QR-kode og en lenke. Vis den på tavlen eller send i Teams. Elevene er i gang umiddelbart.' }
        ];

        let current = 0;
        const overlay = document.createElement('div');
        overlay.className = 't-onboarding-overlay';

        const render = () => {
            const s = steps[current];
            const isLast = current === steps.length - 1;
            overlay.innerHTML = `
                <div class="t-onboarding-box">
                    <div class="t-onboarding-icon">${s.icon}</div>
                    <div class="t-onboarding-title">${s.title}</div>
                    <div class="t-onboarding-body">${s.body}</div>
                    <div class="t-onboarding-dots">
                        ${steps.map((_, i) => `<div class="t-onboarding-dot ${i === current ? 'active' : 'inactive'}"></div>`).join('')}
                    </div>
                    <button class="t-btn t-btn-primary t-btn-lg" id="ob-next" style="width:100%;">
                        ${isLast ? '🚀 Lag min første prøve' : 'Neste →'}
                    </button>
                    ${current === 0 ? '<button class="t-onboarding-skip" id="ob-skip">Hopp over</button>' : ''}
                </div>
            `;
            document.getElementById('ob-next')?.addEventListener('click', () => {
                if (isLast) {
                    localStorage.setItem('mester_onboarding_done', '1');
                    overlay.remove();
                    this.navigate('create-test');
                } else { current++; render(); }
            });
            document.getElementById('ob-skip')?.addEventListener('click', () => {
                localStorage.setItem('mester_onboarding_done', '1');
                overlay.remove();
            });
        };

        document.body.appendChild(overlay);
        render();
    }

    // ==================== HELPERS ====================

    _renderEmptyState(title, sub, ctaLabel, ctaFn) {
        const id = 'empty-cta-' + Math.random().toString(36).slice(2);
        setTimeout(() => {
            if (ctaFn) document.getElementById(id)?.addEventListener('click', ctaFn);
        }, 0);
        return `
            <div class="t-empty-state">
                <span class="t-empty-icon">📭</span>
                <div class="t-empty-title">${title}</div>
                <div class="t-empty-sub">${sub}</div>
                ${ctaLabel ? `<button class="t-btn t-btn-primary t-btn-lg" id="${id}">${ctaLabel}</button>` : ''}
            </div>
        `;
    }

    _generateQR(containerId, url) {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (typeof window.QRCode !== 'undefined') {
            try {
                new window.QRCode(el, { text: url, width: 160, height: 160, colorDark: '#1F2937', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
            } catch {
                el.innerHTML = `<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;color:var(--t-amber);font-family:var(--t-font-mono);font-size:20px;">${url.split('prove=')[1]}</div>`;
            }
        } else {
            el.innerHTML = `<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;color:var(--t-amber);font-family:var(--t-font-mono);font-size:20px;">${url.split('prove=')[1]}</div>`;
        }
    }

    _wordRowHTML(s = '', e = '') {
        return `<div class="t-word-row">
            <input class="t-input t-word-no" type="text" placeholder="Norsk" value="${this._esc(s)}" />
            <span class="t-word-sep">→</span>
            <input class="t-input t-word-en" type="text" placeholder="Engelsk" value="${this._esc(e)}" />
            <button class="t-word-remove" type="button" title="Fjern">✕</button>
        </div>`;
    }

    _collectWords() {
        return Array.from(document.querySelectorAll('.t-word-row')).map(row => {
            const s = row.querySelector('.t-word-no')?.value.trim();
            const e = row.querySelector('.t-word-en')?.value.trim();
            return (s && e) ? { s, e } : null;
        }).filter(Boolean);
    }

    _parseWords(raw) {
        if (!raw) return [];
        return raw.split('\n')
            .map(l => l.trim())
            .filter(l => l.includes('=') || l.includes('\t'))
            .map(l => {
                const sep = l.includes('=') ? '=' : '\t';
                const [left, ...rest] = l.split(sep);
                const s = left?.trim();
                const e = rest.join(sep).trim();
                return (s && e) ? { s, e } : null;
            })
            .filter(Boolean);
    }

    _calcAvgScore() {
        const allResults = this.tests.flatMap(t => t.results || []);
        if (allResults.length === 0) return '—';
        const avg = allResults.reduce((s, r) => s + (r.score || 0), 0) / allResults.length;
        return Math.round(avg) + '%';
    }

    _generateCode() {
        return Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async loadTests() {
        if (!this.user) { this.tests = []; return; }
        try {
            const q = query(collection(db, 'prover'), where('opprettet_av', '==', this.user.uid));
            const snap = await getDocs(q);
            this.tests = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    code: data.kode || data.code || '',
                    title: data.tittel || data.title || 'Uten tittel',
                    level: data.level || data.fag || 'eget',
                    questions: data.antallSporsmal || data.questions || 10,
                    timeLimit: data.tidsbegrensning ?? data.timeLimit ?? 0,
                    shuffle: data.bland ?? data.shuffle ?? true,
                    words: data.ordliste || data.words || [],
                    createdAt: data.opprettetDato?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    results: []
                };
            });
            if (this.tests.length > 0) await this._loadResults();
        } catch (e) {
            console.error('loadTests error:', e);
            this.tests = [];
        }
    }

    async _loadResults() {
        const ids = this.tests.map(t => t.id);
        // Firestore 'in' er begrenset til 30 — del opp ved behov
        for (let i = 0; i < ids.length; i += 30) {
            const chunk = ids.slice(i, i + 30);
            try {
                const snap = await getDocs(
                    query(collection(db, 'resultater'), where('prove_id', 'in', chunk))
                );
                snap.docs.forEach(d => {
                    const r = d.data();
                    const test = this.tests.find(t => t.id === r.prove_id);
                    if (!test) return;
                    test.results.push({
                        score:       r.prosent       ?? 0,
                        correct:     r.poengsum      ?? 0,
                        total:       r.maksPoeng     ?? 0,
                        studentName: r.elevNavn      || 'Anonym',
                        completedAt: r.tidspunkt?.toDate?.()?.toISOString() || new Date().toISOString()
                    });
                });
            } catch (e) {
                console.warn('_loadResults chunk feil:', e);
            }
        }
    }

    goHome() {
        document.body.classList.remove('teacher-mode', 'has-sidebar');
        menuSystem.hideMenu();
        window.router.push('/');
    }

    logout() {
        if (confirm('Er du sikker på at du vil logge ut?')) {
            document.body.classList.remove('teacher-mode');
            menuSystem.hideMenu();
            this.goHome();
        }
    }
}

export const teacherModule = new TeacherModule();

if (typeof window !== 'undefined') {
    window.TeacherModule = TeacherModule;
    window.teacherModule = teacherModule;
}
