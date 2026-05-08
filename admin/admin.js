/* ============================================
   GLOSEMESTER ADMIN PANEL v1.0
   Separat kontrollpanel — kun for admins
   ============================================ */

import {
    auth, db,
    signInWithEmailAndPassword, signOut, onAuthStateChanged,
    signInWithPopup, GoogleAuthProvider,
    collection, getDocs, getDoc, doc,
    query, where, orderBy, updateDoc, serverTimestamp
} from '../src/core/auth/firebase-config.js';

import {
    limit, startAfter
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AdminApp {
    constructor() {
        this.user = null;
        this.userData = null;
        this.totpVerified = false;
        this.currentView = 'login';
        this.userPage = 0;
        this.userSearch = '';
        this.lastUserDoc = null;
        this.userDocs = [null]; // page stack for pagination
    }

    async init() {
        document.getElementById('admin-root').innerHTML = '<div id="admin-app"><div id="admin-content"></div></div>';

        const savedUid = sessionStorage.getItem('adminTotpVerified');

        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                this.user = null;
                this.userData = null;
                this.totpVerified = false;
                this.navigate('login');
                return;
            }

            this.user = user;

            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (!snap.exists() || snap.data().rolle !== 'admin') {
                    await signOut(auth);
                    this.showGlobalError('Denne brukeren har ikke admin-tilgang.');
                    return;
                }
                this.userData = snap.data();
            } catch (e) {
                this.showGlobalError('Kunne ikke verifisere admin-rolle: ' + e.message);
                return;
            }

            if (savedUid === user.uid) {
                this.totpVerified = true;
                this.navigate('dashboard');
            } else if (!this.userData.totp_secret) {
                this.navigate('totp-setup');
            } else {
                this.navigate('totp-verify');
            }
        });
    }

    // ==================== NAVIGATION ====================

    navigate(view) {
        this.currentView = view;
        const isAuthView = ['login', 'totp-setup', 'totp-verify'].includes(view);

        const app = document.getElementById('admin-app');

        if (isAuthView) {
            app.innerHTML = '<div id="admin-content"></div>';
        } else {
            app.innerHTML = `
                <aside class="admin-sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">⚙️ GloseMester Admin</div>
                        <div class="sidebar-user">${this.userData?.displayName || this.user?.email || ''}</div>
                    </div>
                    <nav class="sidebar-nav">
                        ${this.navItem('dashboard',  '📊', 'Dashbord')}
                        ${this.navItem('users',       '👥', 'Brukere')}
                        ${this.navItem('tests',       '📝', 'Prøver')}
                        ${this.navItem('glosebank',   '📚', 'GloseBank')}
                        ${this.navItem('payments',    '💳', 'Betalinger')}
                        ${this.navItem('schools',     '🏫', 'Skolepakker')}
                        ${this.navItem('stats',       '📈', 'Statistikk')}
                    </nav>
                    <div class="sidebar-footer">
                        <button class="admin-btn-ghost" id="admin-logout">🚪 Logg ut</button>
                    </div>
                </aside>
                <main class="admin-main">
                    <div id="admin-content"></div>
                </main>
            `;

            app.querySelectorAll('.sidebar-item').forEach(btn => {
                btn.addEventListener('click', () => this.navigate(btn.dataset.view));
            });
            document.getElementById('admin-logout').addEventListener('click', () => this.handleSignOut());
        }

        const content = document.getElementById('admin-content');
        switch (view) {
            case 'login':       this.renderLogin(content); break;
            case 'totp-setup':  this.renderTotpSetup(content); break;
            case 'totp-verify': this.renderTotpVerify(content); break;
            case 'dashboard':   this.renderDashboard(content); break;
            case 'users':       this.renderUsers(content); break;
            case 'tests':       this.renderTests(content); break;
            case 'glosebank':   this.renderGlosebank(content); break;
            case 'payments':    this.renderPayments(content); break;
            case 'schools':     this.renderSchools(content); break;
            case 'stats':       this.renderStats(content); break;
        }
    }

    navItem(view, icon, label) {
        const active = this.currentView === view ? 'active' : '';
        return `<button class="sidebar-item ${active}" data-view="${view}">
            <span class="nav-icon">${icon}</span><span>${label}</span>
        </button>`;
    }

    // ==================== AUTH VIEWS ====================

    renderLogin(el) {
        el.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <span class="auth-logo">⚙️</span>
                    <h1>GloseMester Admin</h1>
                    <p class="auth-subtitle">Logg inn med admin-konto</p>
                    <div id="auth-error" class="error-msg" style="display:none;"></div>
                    <div class="form-group">
                        <label>E-post</label>
                        <input type="email" id="admin-email" class="admin-input" placeholder="admin@glosemester.no" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label>Passord</label>
                        <input type="password" id="admin-password" class="admin-input" placeholder="••••••••" autocomplete="current-password">
                    </div>
                    <button class="admin-btn-primary" id="login-btn" style="width:100%">Logg inn →</button>
                    <div style="display:flex;align-items:center;gap:12px;margin:16px 0;">
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                        <span style="color:var(--muted);font-size:12px;">eller</span>
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                    </div>
                    <button class="admin-btn-secondary" id="google-login-btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;">
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                        Logg inn med Google
                    </button>
                </div>
            </div>
        `;

        const email = document.getElementById('admin-email');
        const pw = document.getElementById('admin-password');
        const btn = document.getElementById('login-btn');
        const doLogin = () => this.handleLogin(email.value, pw.value);
        btn.addEventListener('click', doLogin);
        pw.addEventListener('keydown', e => e.key === 'Enter' && doLogin());
        document.getElementById('google-login-btn').addEventListener('click', () => this.handleGoogleLogin());
        email.focus();
    }

    async handleLogin(email, password) {
        const btn = document.getElementById('login-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Logger inn...'; }
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            this.showFormError('auth-error', this.firebaseError(err.code));
            if (btn) { btn.disabled = false; btn.textContent = 'Logg inn →'; }
        }
    }

    async handleGoogleLogin() {
        const btn = document.getElementById('google-login-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Venter…'; }
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (err) {
            this.showFormError('auth-error', 'Google-innlogging feilet: ' + err.message);
            if (btn) { btn.disabled = false; }
        }
    }

    renderTotpSetup(el) {
        el.innerHTML = `
            <div class="auth-container">
                <div class="auth-card" style="max-width:460px;">
                    <span class="auth-logo">🔐</span>
                    <h2>Sett opp 2-faktor</h2>
                    <p class="auth-subtitle">Skann QR-koden med Google Authenticator eller Authy</p>
                    <div id="totp-setup-content"><div class="loading">Genererer nøkkel…</div></div>
                </div>
            </div>
        `;
        this.initTotpSetup();
    }

    async initTotpSetup() {
        const content = document.getElementById('totp-setup-content');
        try {
            const idToken = await this.user.getIdToken();
            const res = await fetch('/.netlify/functions/admin-totp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'setup', idToken })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            content.innerHTML = `
                <div id="qr-container" style="display:flex;justify-content:center;margin:16px 0;background:white;border-radius:12px;padding:16px;"></div>
                <p style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:20px;">
                    Manuell kode: <code style="font-family:monospace;background:var(--bg);padding:3px 8px;border-radius:4px;color:var(--amber);font-size:11px;">${data.secret}</code>
                </p>
                <div class="form-group">
                    <label>Skriv inn 6-sifret kode for å bekrefte</label>
                    <input type="text" id="totp-token" class="admin-input" placeholder="000000" maxlength="6"
                           inputmode="numeric" style="font-size:28px;letter-spacing:8px;text-align:center;">
                </div>
                <div id="totp-error" class="error-msg" style="display:none;"></div>
                <button class="admin-btn-primary" id="confirm-setup-btn" style="width:100%">Bekreft og gå videre →</button>
            `;

            if (typeof QRCode !== 'undefined') {
                new QRCode(document.getElementById('qr-container'), {
                    text: data.otpauthUrl, width: 180, height: 180,
                    colorDark: '#0F172A', colorLight: '#FFFFFF'
                });
            }

            document.getElementById('confirm-setup-btn').addEventListener('click', () =>
                this.handleTotpVerify(document.getElementById('totp-token').value, 'confirm-setup-btn'));
            document.getElementById('totp-token').addEventListener('keydown', e =>
                e.key === 'Enter' && this.handleTotpVerify(document.getElementById('totp-token').value, 'confirm-setup-btn'));
            document.getElementById('totp-token').focus();

        } catch (err) {
            content.innerHTML = `<div class="error-msg">${err.message}</div>`;
        }
    }

    renderTotpVerify(el) {
        el.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <span class="auth-logo">🔑</span>
                    <h2>To-faktor verifisering</h2>
                    <p class="auth-subtitle">Åpne Google Authenticator og skriv inn den 6-sifrede koden</p>
                    <div class="form-group">
                        <label>Kode</label>
                        <input type="text" id="totp-token" class="admin-input" placeholder="000000"
                               maxlength="6" inputmode="numeric" style="font-size:32px;letter-spacing:10px;text-align:center;">
                    </div>
                    <div id="totp-error" class="error-msg" style="display:none;"></div>
                    <button class="admin-btn-primary" id="verify-btn" style="width:100%;margin-bottom:8px;">Bekreft →</button>
                    <button class="admin-btn-ghost" id="signout-btn" style="justify-content:center;">← Logg ut</button>
                </div>
            </div>
        `;

        const input = document.getElementById('totp-token');
        document.getElementById('verify-btn').addEventListener('click', () => this.handleTotpVerify(input.value, 'verify-btn'));
        input.addEventListener('keydown', e => e.key === 'Enter' && this.handleTotpVerify(input.value, 'verify-btn'));
        document.getElementById('signout-btn').addEventListener('click', () => this.handleSignOut());
        input.focus();
    }

    async handleTotpVerify(token, btnId) {
        if (!token || token.length !== 6) {
            this.showFormError('totp-error', 'Skriv inn en 6-sifret kode');
            return;
        }
        const btn = document.getElementById(btnId);
        if (btn) { btn.disabled = true; btn.textContent = 'Verifiserer…'; }

        try {
            const idToken = await this.user.getIdToken();
            const res = await fetch('/.netlify/functions/admin-totp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', idToken, token })
            });
            const data = await res.json();

            if (data.valid) {
                sessionStorage.setItem('adminTotpVerified', this.user.uid);
                this.totpVerified = true;
                this.navigate('dashboard');
            } else {
                this.showFormError('totp-error', 'Ugyldig kode — prøv igjen');
                if (btn) { btn.disabled = false; btn.textContent = btnId === 'verify-btn' ? 'Bekreft →' : 'Bekreft og gå videre →'; }
            }
        } catch (err) {
            this.showFormError('totp-error', 'Feil: ' + err.message);
            if (btn) { btn.disabled = false; btn.textContent = 'Bekreft →'; }
        }
    }

    async handleSignOut() {
        sessionStorage.removeItem('adminTotpVerified');
        await signOut(auth);
    }

    // ==================== DASHBOARD ====================

    renderDashboard(el) {
        el.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Dashbord</h1>
                <div class="stats-grid" id="dash-stats">
                    ${[1,2,3,4,5,6].map(() => this.statCard('⏳','…','Laster')).join('')}
                </div>
                <div class="dashboard-sections">
                    <div class="admin-card">
                        <h3>Siste innlogginger</h3>
                        <div id="recent-users">…</div>
                    </div>
                    <div class="admin-card">
                        <h3>Ventende GloseBank-godkjenninger</h3>
                        <div id="pending-glose">…</div>
                    </div>
                </div>
            </div>
        `;
        this.loadDashboard();
    }

    async loadDashboard() {
        try {
            const [usersSnap, testsSnap, gloseSnap, pendingSnap, ordersSnap] = await Promise.all([
                getDocs(query(collection(db, 'users'), limit(1000))),
                getDocs(collection(db, 'prover')),
                getDocs(collection(db, 'glosebank')),
                getDocs(query(collection(db, 'glosebank'), where('status', '==', 'pending'))),
                getDocs(query(collection(db, 'orders'), limit(500)))
            ]);

            const users = usersSnap.docs.map(d => d.data());
            const laerere = users.filter(u => u.rolle === 'laerer' || u.rolle === 'admin');
            const premium = users.filter(u => ['premium','skolepakke'].includes(u.abonnement?.type) || u.subscription?.status === 'premium');
            const paidOrders = ordersSnap.docs.filter(d => d.data().status === 'PAID');
            const revenue = paidOrders.reduce((s, d) => s + (d.data().amount || 0), 0);

            const stats = document.getElementById('dash-stats');
            if (stats) stats.innerHTML = `
                ${this.statCard('👥', users.length, 'Totale brukere')}
                ${this.statCard('🎓', laerere.length, 'Lærere')}
                ${this.statCard('⭐', premium.length, 'Premium')}
                ${this.statCard('📝', testsSnap.size, 'Prøver opprettet')}
                ${this.statCard('⏳', pendingSnap.size, 'Ventende GloseBank')}
                ${this.statCard('💰', `${Math.round(revenue/100).toLocaleString('no-NO')} kr`, 'Omsetning')}
            `;

            // Recent users
            const recent = [...usersSnap.docs]
                .sort((a,b) => (b.data().siste_innlogging?.seconds||0) - (a.data().siste_innlogging?.seconds||0))
                .slice(0, 6);
            const recentEl = document.getElementById('recent-users');
            if (recentEl) recentEl.innerHTML = recent.map(d => {
                const u = d.data();
                return `<div class="list-item">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.displayName || u.email || '—'}</span>
                    <span class="badge badge-${u.abonnement?.type||'free'}">${u.abonnement?.type||'free'}</span>
                </div>`;
            }).join('') || '<p style="color:var(--muted);font-size:14px;">Ingen brukere</p>';

            // Pending glosebank
            const pendingEl = document.getElementById('pending-glose');
            if (pendingEl) {
                const items = pendingSnap.docs.slice(0,5);
                pendingEl.innerHTML = items.map(d => `
                    <div class="list-item">
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.data().tittel||'—'}</span>
                        <button class="admin-btn-primary admin-btn-sm" onclick="window.adminApp.approveGlosebank('${d.id}', true)">Godkjenn</button>
                    </div>`).join('') || '<p style="color:var(--muted);font-size:14px;">Ingen ventende 🎉</p>';
            }

        } catch (err) {
            const s = document.getElementById('dash-stats');
            if (s) s.innerHTML = `<div class="error-msg">Feil ved lasting: ${err.message}</div>`;
        }
    }

    statCard(icon, value, label) {
        return `<div class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
    }

    // ==================== USERS ====================

    renderUsers(el) {
        el.innerHTML = `
            <div class="admin-page">
                <div class="page-header">
                    <h1 class="page-title">Brukere</h1>
                    <div class="search-bar">
                        <input type="text" id="user-search" class="admin-input" placeholder="Søk e-post eller navn…" style="width:280px;">
                        <button class="admin-btn-primary" id="search-btn">Søk</button>
                    </div>
                </div>
                <div class="admin-card" style="padding:0;overflow:hidden;">
                    <table class="admin-table">
                        <thead><tr>
                            <th>Navn</th><th>E-post</th><th>Kilde</th>
                            <th>Rolle</th><th>Abonnement</th><th>Sist aktiv</th><th>Endre abonnement</th>
                        </tr></thead>
                        <tbody id="users-tbody"><tr><td colspan="7" class="loading">Laster…</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="users-pag"></div>
            </div>
        `;

        document.getElementById('search-btn').addEventListener('click', () => {
            this.userSearch = document.getElementById('user-search').value.trim();
            this.userPage = 0;
            this.userDocs = [null];
            this.loadUsers();
        });
        document.getElementById('user-search').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                this.userSearch = e.target.value.trim();
                this.userPage = 0;
                this.userDocs = [null];
                this.loadUsers();
            }
        });
        this.loadUsers();
    }

    async loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Laster…</td></tr>';

        try {
            const PAGE = 25;
            const cursor = this.userDocs[this.userPage];

            let q = query(collection(db, 'users'), orderBy('siste_innlogging', 'desc'), limit(PAGE + 1));
            if (cursor) q = query(collection(db, 'users'), orderBy('siste_innlogging', 'desc'), startAfter(cursor), limit(PAGE + 1));

            let snap = await getDocs(q);
            let docs = snap.docs;

            // Client-side search
            if (this.userSearch) {
                const s = this.userSearch.toLowerCase();
                docs = docs.filter(d => {
                    const u = d.data();
                    return (u.email||'').toLowerCase().includes(s) || (u.displayName||'').toLowerCase().includes(s);
                });
            }

            const hasMore = docs.length > PAGE;
            const pageDocs = docs.slice(0, PAGE);
            if (pageDocs.length > 0) this.userDocs[this.userPage + 1] = pageDocs[pageDocs.length - 1];

            tbody.innerHTML = pageDocs.map(d => {
                const u = d.data();
                const uid = d.id;
                const sub = u.abonnement?.type || u.subscription?.status || 'free';
                const login = u.siste_innlogging?.toDate?.()?.toLocaleDateString('no-NO') || '—';
                return `<tr>
                    <td>${u.displayName || '—'}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${u.email || '—'}</td>
                    <td><span class="badge">${u.kilde||'—'}</span></td>
                    <td><span class="badge badge-${u.rolle||'laerer'}">${u.rolle||'laerer'}</span></td>
                    <td><span class="badge badge-${sub}">${sub}</span></td>
                    <td style="white-space:nowrap;">${login}</td>
                    <td>
                        <select class="admin-select" onchange="window.adminApp.updateSubscription('${uid}', this.value)">
                            <option value="free"       ${sub==='free'?'selected':''}>Free</option>
                            <option value="premium"    ${sub==='premium'?'selected':''}>Premium</option>
                            <option value="skolepakke" ${sub==='skolepakke'?'selected':''}>Skolepakke</option>
                        </select>
                    </td>
                </tr>`;
            }).join('') || '<tr><td colspan="7" class="empty">Ingen brukere funnet</td></tr>';

            const pag = document.getElementById('users-pag');
            if (pag) pag.innerHTML = `
                <button class="admin-btn-ghost" style="width:auto;" ${this.userPage===0?'disabled':''} onclick="window.adminApp.usersPage(-1)">← Forrige</button>
                <span style="padding:0 16px;color:var(--muted);font-size:14px;">Side ${this.userPage+1}</span>
                <button class="admin-btn-ghost" style="width:auto;" ${!hasMore?'disabled':''} onclick="window.adminApp.usersPage(1)">Neste →</button>
            `;

        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="error-msg">${err.message}</td></tr>`;
        }
    }

    usersPage(dir) {
        this.userPage = Math.max(0, this.userPage + dir);
        this.loadUsers();
    }

    async updateSubscription(uid, type) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                'abonnement.type': type,
                'abonnement.status': type === 'free' ? 'inactive' : 'active',
                sist_endret_av_admin: serverTimestamp()
            });
            this.showToast(`Abonnement oppdatert → ${type}`);
        } catch (err) {
            this.showToast('Feil: ' + err.message, 'error');
        }
    }

    // ==================== TESTS ====================

    renderTests(el) {
        el.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Prøver</h1>
                <div class="admin-card" style="padding:0;overflow:hidden;">
                    <table class="admin-table">
                        <thead><tr>
                            <th>Tittel</th><th>Kode</th><th>Opprettet av</th><th>Dato</th><th>Resultater</th><th>Aktiv</th>
                        </tr></thead>
                        <tbody id="tests-tbody"><tr><td colspan="6" class="loading">Laster…</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;
        this.loadTests();
    }

    async loadTests() {
        const tbody = document.getElementById('tests-tbody');
        if (!tbody) return;
        try {
            const snap = await getDocs(query(collection(db, 'prover'), orderBy('opprettet_dato', 'desc'), limit(200)));
            tbody.innerHTML = snap.docs.map(d => {
                const t = d.data();
                const date = t.opprettet_dato?.toDate?.()?.toLocaleDateString('no-NO') || '—';
                return `<tr>
                    <td>${t.tittel||'—'}</td>
                    <td><code class="code-badge">${t.code||'—'}</code></td>
                    <td>${t.opprettet_av_epost||t.createdBy||'—'}</td>
                    <td>${date}</td>
                    <td>${t.results?.length||t.antall_gjennomforinger||0}</td>
                    <td>${t.aktiv!==false?'✅':'❌'}</td>
                </tr>`;
            }).join('') || '<tr><td colspan="6" class="empty">Ingen prøver</td></tr>';
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="error-msg">${err.message}</td></tr>`;
        }
    }

    // ==================== GLOSEBANK ====================

    renderGlosebank(el) {
        el.innerHTML = `
            <div class="admin-page">
                <div class="page-header">
                    <h1 class="page-title">GloseBank</h1>
                    <div style="display:flex;gap:8px;">
                        <button class="admin-btn-secondary glose-filter active" data-filter="pending">Ventende</button>
                        <button class="admin-btn-secondary glose-filter" data-filter="approved">Godkjente</button>
                        <button class="admin-btn-secondary glose-filter" data-filter="all">Alle</button>
                    </div>
                </div>
                <div id="glose-list"><div class="loading">Laster…</div></div>
            </div>
        `;
        el.querySelectorAll('.glose-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                el.querySelectorAll('.glose-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadGlosebank(btn.dataset.filter);
            });
        });
        this.loadGlosebank('pending');
    }

    async loadGlosebank(filter = 'pending') {
        const listEl = document.getElementById('glose-list');
        if (!listEl) return;
        listEl.innerHTML = '<div class="loading">Laster…</div>';

        try {
            let q = collection(db, 'glosebank');
            if (filter === 'pending') q = query(q, where('status', '==', 'pending'));
            else if (filter === 'approved') q = query(q, where('status', '==', 'approved'));

            const snap = await getDocs(q);
            if (snap.empty) { listEl.innerHTML = '<div class="empty-state"><p>Ingen innleveringer</p></div>'; return; }

            listEl.innerHTML = snap.docs.map(d => {
                const g = d.data();
                const id = d.id;
                const date = g.opprettet_dato?.toDate?.()?.toLocaleDateString('no-NO') || '—';
                return `<div class="admin-card glosebank-card" style="margin-bottom:14px;">
                    <div class="glosebank-header">
                        <div style="min-width:0;">
                            <h3 style="margin:0 0 4px;">${g.tittel||'—'}</h3>
                            <p style="margin:0;color:var(--muted);font-size:13px;">
                                ${g.opprettet_av_epost||'—'} · ${date} · ${g.ordliste?.length||0} ord
                                ${g.nivå?`· ${g.nivå}`:''}${g.trinn?` · ${g.trinn}`:''}
                            </p>
                            ${g.beskrivelse?`<p style="margin:6px 0 0;font-size:13px;color:#94A3B8;">${g.beskrivelse}</p>`:''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">
                            <span class="badge badge-${g.status||'pending'}">${g.status||'pending'}</span>
                            ${g.status==='pending' ? `
                                <button class="admin-btn-primary admin-btn-sm" onclick="window.adminApp.approveGlosebank('${id}')">✅ Godkjenn</button>
                                <button class="admin-btn-danger admin-btn-sm" onclick="window.adminApp.rejectGlosebank('${id}')">❌ Avvis</button>
                            ` : `
                                <button class="admin-btn-secondary admin-btn-sm" onclick="window.adminApp.toggleGloseVisibility('${id}',${!g.synlig_for_kunder})">
                                    ${g.synlig_for_kunder?'🙈 Skjul':'👁 Vis'}
                                </button>
                            `}
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            listEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
        }
    }

    async approveGlosebank(id, fromDashboard = false) {
        try {
            await updateDoc(doc(db, 'glosebank', id), {
                status: 'approved', synlig_for_kunder: true,
                godkjent_dato: serverTimestamp(), godkjent_av: this.user.uid
            });
            this.showToast('GloseBank-innlevering godkjent ✅');
            if (fromDashboard) this.loadDashboard();
            else {
                const f = document.querySelector('.glose-filter.active')?.dataset.filter || 'pending';
                this.loadGlosebank(f);
            }
        } catch (err) { this.showToast('Feil: ' + err.message, 'error'); }
    }

    async rejectGlosebank(id) {
        if (!confirm('Avvis denne innleveringen?')) return;
        try {
            await updateDoc(doc(db, 'glosebank', id), {
                status: 'rejected', synlig_for_kunder: false, godkjent_dato: serverTimestamp()
            });
            this.showToast('Innlevering avvist');
            const f = document.querySelector('.glose-filter.active')?.dataset.filter || 'pending';
            this.loadGlosebank(f);
        } catch (err) { this.showToast('Feil: ' + err.message, 'error'); }
    }

    async toggleGloseVisibility(id, visible) {
        try {
            await updateDoc(doc(db, 'glosebank', id), { synlig_for_kunder: visible });
            this.showToast(visible ? 'Gjort synlig' : 'Skjult');
            const f = document.querySelector('.glose-filter.active')?.dataset.filter || 'approved';
            this.loadGlosebank(f);
        } catch (err) { this.showToast('Feil: ' + err.message, 'error'); }
    }

    // ==================== PAYMENTS ====================

    renderPayments(el) {
        el.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Betalinger</h1>
                <div class="admin-card" style="padding:0;overflow:hidden;">
                    <table class="admin-table">
                        <thead><tr>
                            <th>Dato</th><th>Bruker</th><th>Plan</th><th>Beløp</th><th>Status</th><th>Stripe ID</th>
                        </tr></thead>
                        <tbody id="pay-tbody"><tr><td colspan="6" class="loading">Laster…</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;
        this.loadPayments();
    }

    async loadPayments() {
        const tbody = document.getElementById('pay-tbody');
        if (!tbody) return;
        try {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
            tbody.innerHTML = snap.docs.map(d => {
                const o = d.data();
                const date = o.createdAt?.toDate?.()?.toLocaleDateString('no-NO') || '—';
                const amt = o.amount ? `${(o.amount/100).toLocaleString('no-NO')} kr` : '—';
                return `<tr>
                    <td>${date}</td>
                    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">${o.userEmail||'—'}</td>
                    <td>${o.plan||'—'}</td>
                    <td style="font-weight:700;">${amt}</td>
                    <td><span class="badge badge-${o.status||'pending'}">${o.status||'—'}</span></td>
                    <td><code style="font-size:11px;color:var(--muted);">${(o.stripeSessionId||'').substring(0,22)}…</code></td>
                </tr>`;
            }).join('') || '<tr><td colspan="6" class="empty">Ingen betalinger</td></tr>';
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="error-msg">${err.message}</td></tr>`;
        }
    }

    // ==================== SCHOOLS ====================

    renderSchools(el) {
        el.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Skolepakker</h1>
                <div id="schools-list"><div class="loading">Laster…</div></div>
            </div>
        `;
        this.loadSchools();
    }

    async loadSchools() {
        const listEl = document.getElementById('schools-list');
        if (!listEl) return;
        try {
            const snap = await getDocs(query(collection(db, 'school_inquiries'), orderBy('createdAt', 'desc')));
            if (snap.empty) { listEl.innerHTML = '<div class="empty-state"><p>Ingen skolepakkeanmodninger</p></div>'; return; }

            listEl.innerHTML = snap.docs.map(d => {
                const s = d.data();
                const date = s.createdAt?.toDate?.()?.toLocaleDateString('no-NO') || '—';
                return `<div class="admin-card" style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
                        <div>
                            <h3 style="margin:0 0 6px;">${s.schoolName||'—'}</h3>
                            <p style="margin:0 0 4px;color:var(--muted);font-size:13px;">
                                Org.nr: ${s.orgNumber||'—'} · ${s.teacherCount||'?'} lærere · ${date}
                            </p>
                            <p style="margin:0;font-size:13px;">
                                Kontakt: <strong>${s.contactPerson||'—'}</strong> — ${s.contactEmail||'—'}
                                ${s.contactPhone?` · ${s.contactPhone}`:''}
                            </p>
                            ${s.message?`<p style="margin:8px 0 0;color:#94A3B8;font-size:13px;">"${s.message}"</p>`:''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                            <span class="badge badge-${s.status||'pending'}">${s.status||'pending'}</span>
                            ${s.status!=='approved'?`
                                <button class="admin-btn-primary admin-btn-sm" onclick="window.adminApp.approveSchool('${d.id}')">Godkjenn skolepakke</button>
                            `:''}
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            listEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
        }
    }

    async approveSchool(id) {
        try {
            await updateDoc(doc(db, 'school_inquiries', id), {
                status: 'approved', approved_at: serverTimestamp(), approved_by: this.user.uid
            });
            this.showToast('Skolepakke godkjent ✅');
            this.loadSchools();
        } catch (err) { this.showToast('Feil: ' + err.message, 'error'); }
    }

    // ==================== STATS ====================

    renderStats(el) {
        el.innerHTML = `
            <div class="admin-page">
                <h1 class="page-title">Statistikk</h1>
                <div class="stats-grid" id="stat-grid"><div class="loading">Laster…</div></div>
                <div class="dashboard-sections" style="margin-top:0;">
                    <div class="admin-card">
                        <h3>Abonnementsfordeling</h3>
                        <div id="sub-chart"></div>
                    </div>
                    <div class="admin-card">
                        <h3>Innloggingsmetode</h3>
                        <div id="src-chart"></div>
                    </div>
                </div>
            </div>
        `;
        this.loadStats();
    }

    async loadStats() {
        try {
            const [usersSnap, testsSnap, ordersSnap, glosSnap] = await Promise.all([
                getDocs(query(collection(db, 'users'), limit(1000))),
                getDocs(collection(db, 'prover')),
                getDocs(collection(db, 'orders')),
                getDocs(collection(db, 'glosebank'))
            ]);

            const users = usersSnap.docs.map(d => d.data());
            const paid = ordersSnap.docs.filter(d => d.data().status === 'PAID');
            const revenue = paid.reduce((s,d) => s+(d.data().amount||0), 0);

            const subMap = {}, srcMap = {};
            users.forEach(u => {
                const sub = u.abonnement?.type || 'free';
                subMap[sub] = (subMap[sub]||0) + 1;
                const src = u.kilde || 'ukjent';
                srcMap[src] = (srcMap[src]||0) + 1;
            });

            document.getElementById('stat-grid').innerHTML = `
                ${this.statCard('👥', users.length, 'Totale brukere')}
                ${this.statCard('📝', testsSnap.size, 'Prøver')}
                ${this.statCard('📚', glosSnap.size, 'GloseBank')}
                ${this.statCard('💳', paid.length, 'Betalte ordre')}
                ${this.statCard('💰', `${Math.round(revenue/100).toLocaleString('no-NO')} kr`, 'Omsetning')}
            `;

            document.getElementById('sub-chart').innerHTML = this.barChart(subMap, users.length);
            document.getElementById('src-chart').innerHTML = this.barChart(srcMap, users.length);

        } catch (err) {
            const g = document.getElementById('stat-grid');
            if (g) g.innerHTML = `<div class="error-msg">${err.message}</div>`;
        }
    }

    barChart(data, total) {
        return Object.entries(data).sort((a,b) => b[1]-a[1]).map(([label, count]) => {
            const pct = total > 0 ? Math.round(count/total*100) : 0;
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <span style="width:90px;color:var(--muted);font-size:13px;flex-shrink:0;">${label}</span>
                <div style="flex:1;background:var(--surface);border-radius:4px;height:22px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:var(--amber);border-radius:4px;display:flex;align-items:center;padding-left:6px;min-width:28px;transition:width 0.4s ease;">
                        <span style="color:#0F172A;font-size:11px;font-weight:700;">${count}</span>
                    </div>
                </div>
                <span style="width:36px;text-align:right;color:var(--muted);font-size:12px;">${pct}%</span>
            </div>`;
        }).join('');
    }

    // ==================== UTILITIES ====================

    showFormError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    }

    showGlobalError(msg) {
        const root = document.getElementById('admin-root');
        if (root) root.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <span class="auth-logo">⛔</span>
                    <h2>Ingen tilgang</h2>
                    <p style="text-align:center;color:var(--muted);margin-bottom:24px;">${msg}</p>
                    <button class="admin-btn-ghost" style="justify-content:center;" onclick="window.location.reload()">Prøv igjen</button>
                </div>
            </div>`;
    }

    showToast(msg, type = 'success') {
        const t = document.createElement('div');
        t.className = `admin-toast admin-toast-${type}`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    firebaseError(code) {
        return ({
            'auth/user-not-found':    'Ingen bruker med denne e-posten',
            'auth/wrong-password':    'Feil passord',
            'auth/invalid-email':     'Ugyldig e-postadresse',
            'auth/too-many-requests': 'For mange forsøk — prøv igjen om litt',
            'auth/invalid-credential':'Feil e-post eller passord'
        })[code] || 'Innloggingsfeil: ' + code;
    }
}

const adminApp = new AdminApp();
window.adminApp = adminApp;
adminApp.init();
