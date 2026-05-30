/* ============================================
   VELKOMST.JS
   Hjemskjerm for innlogget bruker.
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { auth, db, collection, query, where, orderBy, limit, getDocs } from '../core/auth/firebase-config.js';
import { sjekkOnboardingVist, visOnboarding } from '../features/onboarding/onboarding.js';
import { loggUt } from '../core/auth/auth-service.js';

/* ── SVG-ikoner ── */
const SVG = {
    cards: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="13" height="17" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 9h3M7 12h5M7 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 2h11a2 2 0 012 2v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    pencil: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    clipboard: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    grid: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>`,
    users: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    teacher: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12v5c0 2.21 2.69 4 6 4s6-1.79 6-4v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    backpack: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/><path d="M9 2v4a3 3 0 006 0V2M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

export const Velkomst = {
    async render() {
        const container = document.getElementById('app');
        if (!container) return;

        const user = auth.currentUser;
        if (!user) {
            router.push(ROUTES.LANDING);
            return;
        }

        const bruker = window.GloseMester?.bruker || {};
        const navn = bruker.displayName || user.displayName || 'der';
        const rolle = bruker.rolle || 'elev';
        const erLaerer = rolle === 'laerer' || rolle === 'admin';
        const feideGrupper = bruker.kilde === 'feide';

        const harSetOnboarding = await sjekkOnboardingVist(user.uid);
        if (!harSetOnboarding) {
            await visOnboarding(rolle, navn, user.uid);
        }

        const kortHtml = erLaerer ? lagLaererKort(feideGrupper) : lagElevKort();

        let resultaterHtml = '';
        if (!erLaerer) {
            resultaterHtml = await hentResultaterHtml(user.uid);
        }

        container.innerHTML = `
            <div style="
                min-height: 100vh;
                background: #FAFAF8;
                display: flex;
                flex-direction: column;
                font-family: 'Nunito', 'Arial Rounded MT Bold', sans-serif;
            ">
                <!-- Hero-header -->
                <div style="
                    padding: 52px 24px 28px;
                    background: linear-gradient(145deg, #FF6B47, #FF8F6B);
                    color: white;
                    position: relative;
                    border-radius: 0 0 32px 32px;
                    box-shadow: 0 4px 24px rgba(255,107,71,0.25);
                ">
                    <!-- Logg ut -->
                    <button id="logg-ut-knapp" style="
                        position: absolute; top: 52px; right: 20px;
                        display: flex; align-items: center; gap: 6px;
                        background: rgba(255,255,255,0.15);
                        border: 1px solid rgba(255,255,255,0.25);
                        color: rgba(255,255,255,0.9);
                        padding: 7px 14px; border-radius: 999px;
                        font-size: 13px; font-weight: 600;
                        cursor: pointer; font-family: inherit;
                    ">${SVG.logout} Logg ut</button>

                    <!-- Rolle-badge -->
                    <div style="
                        display: inline-flex; align-items: center; gap: 5px;
                        font-size: 12px; font-weight: 700;
                        letter-spacing: 0.05em; text-transform: uppercase;
                        opacity: 0.8; margin-bottom: 6px;
                    ">
                        ${erLaerer ? SVG.teacher : SVG.backpack}
                        ${erLaerer ? 'Lærer' : 'Elev'}
                    </div>

                    <h1 style="
                        font-size: 28px; font-weight: 900;
                        margin: 0; line-height: 1.2; letter-spacing: -0.02em;
                    ">Hei, ${escHtml(fornavn(navn))}!</h1>
                    <p style="margin: 6px 0 0; opacity: 0.85; font-size: 15px;">
                        Hva vil du gjøre i dag?
                    </p>
                </div>

                <!-- Navigasjonskort -->
                <div style="padding: 24px 20px; display: flex; flex-direction: column; gap: 14px;">
                    ${kortHtml}
                </div>

                ${resultaterHtml}

                <div style="text-align:center;padding:16px;color:#C4C4C4;font-size:12px;margin-top:auto;">
                    GloseMester ${window.GloseMester?.version || ''}
                </div>
            </div>
        `;

        document.getElementById('logg-ut-knapp').onclick = async () => {
            try { await loggUt(); } catch {}
            router.push(ROUTES.LANDING);
        };

        const ovBtn    = document.getElementById('kort-ov');
        const proveBtn = document.getElementById('kort-prove');
        const adminBtn = document.getElementById('kort-admin');
        const grupperBtn = document.getElementById('kort-grupper');

        if (ovBtn)     ovBtn.onclick     = () => router.push(ROUTES.GLOSEMESTER);
        if (proveBtn)  proveBtn.onclick  = erLaerer ? () => router.push(ROUTES.MY_TESTS) : () => visProveKodeModal();
        if (adminBtn)  adminBtn.onclick  = () => router.push(ROUTES.TEACHER_HOME);
        if (grupperBtn) grupperBtn.onclick = () => router.push(ROUTES.TEACHER_HOME);
    }
};

async function hentResultaterHtml(uid) {
    try {
        const q = query(
            collection(db, 'resultater'),
            where('elev_id', '==', uid),
            orderBy('tidspunkt', 'desc'),
            limit(5)
        );
        const snap = await getDocs(q);
        if (snap.empty) return '';

        const rader = snap.docs.map(d => {
            const r = d.data();
            const prosent = r.prosent ?? Math.round((r.poengsum / r.maksPoeng) * 100);
            const farge = prosent >= 70 ? '#4CAF82' : prosent >= 50 ? '#FFB347' : '#F45C5C';
            const dato = r.tidspunkt?.toDate
                ? r.tidspunkt.toDate().toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                : '';
            return `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <div style="
                        width:44px;height:44px;border-radius:12px;
                        background:${farge}18;
                        display:flex;align-items:center;justify-content:center;
                        font-size:13px;font-weight:900;color:${farge};flex-shrink:0;
                    ">${prosent}%</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:700;color:#1E1E2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${escHtml(r.tittel || r.kode || '—')}
                        </div>
                        <div style="font-size:12px;color:#9CA3AF;">${r.poengsum ?? '?'} av ${r.maksPoeng ?? '?'} riktige · ${dato}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="padding: 0 20px 24px;">
                <div style="background:white;border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(30,30,46,0.08);">
                    <div style="font-size:14px;font-weight:700;color:#1E1E2E;margin-bottom:4px;">Mine siste prøver</div>
                    ${rader}
                </div>
            </div>
        `;
    } catch {
        return '';
    }
}

function lagElevKort() {
    return `
        ${kort({ id: 'kort-ov',    svg: SVG.cards,   tittel: 'Øving',    tekst: 'Øv på gloser og bygg ordforrådet ditt.', farge: '#FF6B47', stor: true })}
        ${kort({ id: 'kort-prove', svg: SVG.pencil,  tittel: 'Ta prøve', tekst: 'Skriv inn prøvekoden fra læreren din.',   farge: '#4BAED4' })}
    `;
}

function lagLaererKort(harFeideGrupper) {
    return `
        ${kort({ id: 'kort-ov',    svg: SVG.cards,     tittel: 'Øving',        tekst: 'Se og prøv alle øvingsoppsett.',              farge: '#FF6B47' })}
        ${kort({ id: 'kort-prove', svg: SVG.clipboard, tittel: 'Mine prøver',  tekst: 'Se prøvene du har laget og elevresultater.',  farge: '#4BAED4' })}
        ${kort({ id: 'kort-admin', svg: SVG.grid,      tittel: 'Administrer',  tekst: 'Lag nye prøver og se statistikk.',            farge: '#4CAF82', stor: true })}
        ${harFeideGrupper ? kort({ id: 'kort-grupper', svg: SVG.users, tittel: 'Feide-grupper', tekst: 'Tildel prøver til klasser fra Feide.', farge: '#1c4b82' }) : ''}
    `;
}

function kort({ id, svg, tittel, tekst, farge, stor = false }) {
    return `
        <button id="${id}" style="
            background: white;
            border: none;
            border-radius: 20px;
            padding: ${stor ? '22px' : '18px'};
            text-align: left;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(30,30,46,0.08);
            display: flex;
            align-items: center;
            gap: 16px;
            transition: transform 0.15s, box-shadow 0.15s;
            width: 100%;
            border-left: 4px solid ${farge};
            font-family: 'Nunito', 'Arial Rounded MT Bold', sans-serif;
        "
        onmousedown="this.style.transform='scale(0.98)'"
        onmouseup="this.style.transform=''"
        ontouchstart="this.style.transform='scale(0.97)'"
        ontouchend="this.style.transform=''">
            <div style="
                width: ${stor ? '56px' : '48px'};
                height: ${stor ? '56px' : '48px'};
                background: ${farge}18;
                border-radius: 14px;
                border: 1.5px solid ${farge}30;
                display: flex; align-items: center; justify-content: center;
                color: ${farge};
                flex-shrink: 0;
            ">${svg}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-size: ${stor ? '17px' : '15px'};
                    font-weight: 800;
                    color: #1E1E2E;
                    margin-bottom: 3px;
                ">${tittel}</div>
                <div style="font-size: 13px; color: #6B7280; line-height: 1.4;">${tekst}</div>
            </div>
            <div style="color: #D1D5DB; font-size: 20px; flex-shrink: 0;">›</div>
        </button>
    `;
}

function visProveKodeModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10000;
        background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
        display:flex;align-items:center;justify-content:center;padding:24px;
    `;
    modal.innerHTML = `
        <div style="
            background:white;border-radius:24px;
            padding:32px 24px;max-width:360px;width:100%;
            text-align:center;font-family:'Nunito',sans-serif;
        ">
            <div style="
                width:56px;height:56px;border-radius:16px;
                background:#FFE8E3;margin:0 auto 16px;
                display:flex;align-items:center;justify-content:center;
                color:#FF6B47;
            ">${SVG.pencil}</div>
            <h2 style="font-size:22px;font-weight:800;margin:0 0 8px;color:#1E1E2E;">Ta prøve</h2>
            <p style="color:#6B7280;font-size:14px;margin-bottom:20px;">
                Skriv inn prøvekoden fra læreren din.
            </p>
            <input id="prove-kode-input" type="text" placeholder="F.eks. ABC123"
                style="
                    width:100%;box-sizing:border-box;
                    padding:14px 16px;
                    border:2px solid #E8E5E0;border-radius:14px;
                    font-size:20px;text-align:center;
                    letter-spacing:4px;text-transform:uppercase;font-weight:700;
                    outline:none;font-family:'Nunito',sans-serif;
                    transition:border-color 0.15s;
                "
                onfocus="this.style.borderColor='#FF6B47'"
                onblur="this.style.borderColor='#E8E5E0'"
                maxlength="8" />
            <p id="prove-feil" style="color:#F45C5C;font-size:13px;margin-top:8px;display:none;"></p>
            <button id="prove-start-knapp" style="
                width:100%;margin-top:16px;padding:14px;
                background:#FF6B47;color:white;border:none;
                border-radius:999px;font-size:16px;font-weight:700;
                cursor:pointer;font-family:'Nunito',sans-serif;
                box-shadow:0 4px 14px rgba(255,107,71,0.32);
                transition:transform 0.15s;
            ">Start prøve</button>
            <button id="prove-avbryt-knapp" style="
                width:100%;margin-top:10px;padding:12px;
                background:none;border:none;color:#9CA3AF;
                font-size:14px;cursor:pointer;font-family:'Nunito',sans-serif;
            ">Avbryt</button>
        </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#prove-kode-input');
    input.focus();
    input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });

    modal.querySelector('#prove-start-knapp').onclick = async () => {
        const kode = input.value.trim();
        if (!kode) return;
        try {
            const { hentProveMedKode, startQuiz } = await import('../shared/quiz/quiz-engine.js');
            const prove = await hentProveMedKode(kode);
            if (prove) {
                modal.remove();
                await startQuiz(prove);
            } else {
                const feil = modal.querySelector('#prove-feil');
                feil.textContent = `Fant ingen prøve med kode "${kode}".`;
                feil.style.display = 'block';
            }
        } catch {
            const feil = modal.querySelector('#prove-feil');
            feil.textContent = 'Noe gikk galt. Prøv igjen.';
            feil.style.display = 'block';
        }
    };

    modal.querySelector('#prove-avbryt-knapp').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function fornavn(navn) {
    return (navn || '').split(' ')[0] || navn;
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
