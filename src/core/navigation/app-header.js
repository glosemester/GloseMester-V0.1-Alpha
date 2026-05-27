/* ============================================
   APP-HEADER.JS — GloseMester v3.0
   Persistent toppbar for elev/student-sider
   ============================================ */

import { router } from './router.js';

const ICO_BACK   = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const ICO_USER   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICO_SWITCH  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
const ICO_LOGOUT  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const ICO_MINSIDE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

class AppHeader {
    constructor() {
        this._el = null;
        this._handlers = {};
        this._onDocClick = this._closeDropdown.bind(this);
    }

    /**
     * Vis toppbaren.
     * @param {Object} opts
     * @param {string}   opts.title        - Sidetittel
     * @param {string}   [opts.breadcrumb] - Undermeny-sti (valgfri)
     * @param {'elev'|'laerer'|null} [opts.role] - Rolle-chip
     * @param {boolean}  [opts.showBack]   - Vis tilbake-knapp
     * @param {Function} [opts.onBack]     - Tilbake-handler (standard: router.back())
     * @param {Function} [opts.onLogout]   - Logg ut
     * @param {Function} [opts.onSwitchRole] - Bytt rolle
     */
    show(opts = {}) {
        this._handlers = {
            onBack: opts.onBack || null,
            onLogout: opts.onLogout || null,
            onSwitchRole: opts.onSwitchRole || null,
        };

        if (!this._el) {
            this._el = document.createElement('header');
            this._el.id = 'app-header';
            document.body.appendChild(this._el);
            document.body.classList.add('has-header');
            document.addEventListener('click', this._onDocClick);
        }

        this._render(opts);
    }

    _render(opts) {
        const { title = 'GloseMester', breadcrumb = null, role = null, showBack = false } = opts;

        const backEl = showBack
            ? `<button class="app-header-back" id="app-header-back" aria-label="Tilbake">${ICO_BACK}</button>`
            : `<div style="width:36px;flex-shrink:0"></div>`;

        const roleEl = role
            ? `<span class="app-header-role ${role}">${role === 'laerer' ? 'Lærer' : 'Elev'}</span>`
            : '';

        const bcEl = breadcrumb
            ? `<div class="app-header-breadcrumb">${breadcrumb}</div>`
            : '';

        this._el.innerHTML = `
            ${backEl}
            <div class="app-header-title">
                <h1>${title}</h1>
                ${bcEl}
            </div>
            ${roleEl}
            <button class="app-header-profile" id="app-header-profile-btn" aria-label="Profil og innstillinger">
                ${ICO_USER}
            </button>
        `;

        document.getElementById('app-header-back')
            ?.addEventListener('click', () => this._handlers.onBack ? this._handlers.onBack() : router.back());

        document.getElementById('app-header-profile-btn')
            ?.addEventListener('click', (e) => { e.stopPropagation(); this._openDropdown(e.currentTarget); });
    }

    _openDropdown(anchor) {
        this._closeDropdown();

        const { onLogout, onSwitchRole } = this._handlers;
        const isTeacher = document.body.classList.contains('teacher-mode');

        let html = '';
        html += `<button class="app-header-dd-item" data-a="minside">${ICO_MINSIDE} Min side</button>`;
        if (onSwitchRole) {
            html += `<button class="app-header-dd-item" data-a="switch">${ICO_SWITCH} ${isTeacher ? 'Bytt til elevmodus' : 'Bytt til lærermodus'}</button>`;
        }
        html += `<div class="app-header-dd-divider"></div>`;
        if (onLogout) {
            html += `<button class="app-header-dd-item danger" data-a="logout">${ICO_LOGOUT} Logg ut</button>`;
        }

        if (!html) return;

        const dd = document.createElement('div');
        dd.className = 'app-header-dropdown';
        dd.id = 'app-header-dd';
        dd.innerHTML = html;
        anchor.style.position = 'relative';
        anchor.appendChild(dd);

        dd.querySelectorAll('.app-header-dd-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.a;
                this._closeDropdown();
                if (action === 'minside') window.location.href = '/min-side.html';
                else if (action === 'switch') onSwitchRole?.();
                else if (action === 'logout') onLogout?.();
            });
        });
    }

    _closeDropdown() {
        document.getElementById('app-header-dd')?.remove();
    }

    /** Oppdater tittel uten å gjenbygge hele headeren */
    setTitle(title, breadcrumb = null) {
        if (!this._el) return;
        const h1 = this._el.querySelector('.app-header-title h1');
        if (h1) h1.textContent = title;

        const bcEl = this._el.querySelector('.app-header-breadcrumb');
        if (bcEl && breadcrumb) bcEl.textContent = breadcrumb;
        else if (bcEl && !breadcrumb) bcEl.remove();
        else if (!bcEl && breadcrumb) {
            this._el.querySelector('.app-header-title')
                ?.insertAdjacentHTML('beforeend', `<div class="app-header-breadcrumb">${breadcrumb}</div>`);
        }
    }

    /** Vis/skjul tilbake-knapp */
    setBack(show, onBack = null) {
        if (!this._el) return;
        const existing = this._el.querySelector('.app-header-back');
        const placeholder = this._el.querySelector('[style*="width:36px"]');

        if (show && !existing) {
            const btn = document.createElement('button');
            btn.className = 'app-header-back';
            btn.setAttribute('aria-label', 'Tilbake');
            btn.innerHTML = ICO_BACK;
            if (onBack) this._handlers.onBack = onBack;
            btn.addEventListener('click', () => this._handlers.onBack ? this._handlers.onBack() : router.back());
            placeholder?.replaceWith(btn);
        } else if (!show && existing) {
            const div = document.createElement('div');
            div.style.cssText = 'width:36px;flex-shrink:0';
            existing.replaceWith(div);
        }
    }

    hide() {
        if (this._el) { this._el.remove(); this._el = null; }
        document.body.classList.remove('has-header');
        document.removeEventListener('click', this._onDocClick);
        this._closeDropdown();
    }
}

export const appHeader = new AppHeader();
window.appHeader = appHeader;
