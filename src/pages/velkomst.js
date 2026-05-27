/* ============================================
   VELKOMST.JS
   Hjemskjerm for innlogget bruker.
   Viser rolle-baserte navigasjonskort.
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { auth } from '../core/auth/firebase-config.js';
import { sjekkOnboardingVist, visOnboarding } from '../features/onboarding/onboarding.js';
import { loggUt } from '../core/auth/auth-service.js';

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

        // Vis onboarding første gang
        const harSetOnboarding = await sjekkOnboardingVist(user.uid);
        if (!harSetOnboarding) {
            await visOnboarding(rolle, navn, user.uid);
        }

        const kortHtml = erLaerer ? lagLaererKort(feideGrupper) : lagElevKort();

        container.innerHTML = `
            <div style="
                min-height: 100vh;
                background: linear-gradient(160deg, #f5f0ff 0%, #fff 60%);
                padding: 0;
                display: flex;
                flex-direction: column;
            ">
                <!-- Topp-bar -->
                <div style="
                    padding: 56px 24px 24px;
                    background: #7c3aed;
                    color: white;
                    position: relative;
                ">
                    <button id="logg-ut-knapp" style="
                        position: absolute; top: 56px; right: 20px;
                        background: rgba(255,255,255,0.15); border: none;
                        color: white; padding: 6px 14px; border-radius: 20px;
                        font-size: 13px; cursor: pointer;
                    ">Logg ut</button>

                    <div style="font-size: 13px; opacity: 0.8; margin-bottom: 4px; font-weight: 500;">
                        ${erLaerer ? '👩‍🏫 Lærer' : '🎒 Elev'}
                    </div>
                    <h1 style="
                        font-family: 'Outfit', system-ui;
                        font-size: 28px; font-weight: 800;
                        margin: 0; line-height: 1.2;
                    ">Hei, ${escHtml(fornavn(navn))}!</h1>
                    <p style="margin: 6px 0 0; opacity: 0.85; font-size: 15px;">
                        Hva vil du gjøre i dag?
                    </p>
                </div>

                <!-- Navigasjonskort -->
                <div style="
                    padding: 24px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex: 1;
                ">
                    ${kortHtml}
                </div>

                <!-- Bunntekst -->
                <div style="
                    text-align: center;
                    padding: 16px;
                    color: #d1d5db;
                    font-size: 12px;
                ">
                    GloseMester ${window.GloseMester?.version || ''}
                </div>
            </div>
        `;

        document.getElementById('logg-ut-knapp').onclick = async () => {
            try {
                await loggUt();
                router.push(ROUTES.LANDING);
            } catch {
                router.push(ROUTES.LANDING);
            }
        };

        // Koble opp kortknappar
        const ovBtn = document.getElementById('kort-ov');
        const proveBtn = document.getElementById('kort-prove');
        const adminBtn = document.getElementById('kort-admin');
        const grupperBtn = document.getElementById('kort-grupper');

        if (ovBtn) ovBtn.onclick = () => router.push(ROUTES.GLOSEMESTER);
        if (proveBtn) proveBtn.onclick = erLaerer
            ? () => router.push(ROUTES.MY_TESTS)
            : () => visProveKodeModal();
        if (adminBtn) adminBtn.onclick = () => router.push(ROUTES.TEACHER_HOME);
        if (grupperBtn) grupperBtn.onclick = () => router.push(ROUTES.TEACHER_HOME);
    }
};

function lagElevKort() {
    return `
        ${kort({
            id: 'kort-ov',
            ikon: '🃏',
            tittel: 'Øving',
            tekst: 'Øv på gloser og bygg ordforrådet ditt med kortkassemetoden.',
            farge: '#7c3aed',
            stor: true
        })}
        ${kort({
            id: 'kort-prove',
            ikon: '✏️',
            tittel: 'Ta prøve',
            tekst: 'Skriv inn prøvekoden fra læreren din og ta prøven.',
            farge: '#2563eb'
        })}
    `;
}

function lagLaererKort(harFeideGrupper) {
    return `
        ${kort({
            id: 'kort-ov',
            ikon: '🃏',
            tittel: 'Øving',
            tekst: 'Se og prøv alle øvingsoppsett som elevene bruker.',
            farge: '#7c3aed'
        })}
        ${kort({
            id: 'kort-prove',
            ikon: '📝',
            tittel: 'Mine prøver',
            tekst: 'Se prøvene du har laget og resultatene fra elevene.',
            farge: '#2563eb'
        })}
        ${kort({
            id: 'kort-admin',
            ikon: '⚙️',
            tittel: 'Administrer',
            tekst: 'Lag nye prøver, administrer klassen og se statistikk.',
            farge: '#059669',
            stor: true
        })}
        ${harFeideGrupper ? kort({
            id: 'kort-grupper',
            ikon: '👥',
            tittel: 'Feide-grupper',
            tekst: 'Tildel prøver direkte til klasser fra Feide.',
            farge: '#1c4b82'
        }) : ''}
    `;
}

function kort({ id, ikon, tittel, tekst, farge, stor = false }) {
    return `
        <button id="${id}" style="
            background: white;
            border: none;
            border-radius: 20px;
            padding: ${stor ? '24px' : '20px'};
            text-align: left;
            cursor: pointer;
            box-shadow: 0 2px 16px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 18px;
            transition: transform 0.15s, box-shadow 0.15s;
            width: 100%;
            border-left: 5px solid ${farge};
        "
        onmousedown="this.style.transform='scale(0.98)'"
        onmouseup="this.style.transform=''"
        ontouchstart="this.style.transform='scale(0.97)'"
        ontouchend="this.style.transform=''">
            <div style="
                width: ${stor ? '60px' : '52px'};
                height: ${stor ? '60px' : '52px'};
                background: ${farge}18;
                border-radius: 16px;
                display: flex; align-items: center; justify-content: center;
                font-size: ${stor ? '28px' : '24px'};
                flex-shrink: 0;
            ">${ikon}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-family: 'Outfit', system-ui;
                    font-size: ${stor ? '18px' : '16px'};
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 4px;
                ">${tittel}</div>
                <div style="
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                ">${tekst}</div>
            </div>
            <div style="color: #d1d5db; font-size: 20px; flex-shrink: 0;">›</div>
        </button>
    `;
}

function visProveKodeModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10000;
        background:rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        padding:24px;
    `;
    modal.innerHTML = `
        <div style="
            background:white;border-radius:24px;
            padding:32px 24px;max-width:360px;width:100%;
            text-align:center;
        ">
            <div style="font-size:48px;margin-bottom:12px;">✏️</div>
            <h2 style="font-family:'Outfit',system-ui;font-size:22px;font-weight:800;margin:0 0 8px;color:#1f2937;">
                Ta prøve
            </h2>
            <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">
                Skriv inn prøvekoden du har fått fra læreren din.
            </p>
            <input id="prove-kode-input" type="text" placeholder="F.eks. ABC123"
                style="
                    width:100%;box-sizing:border-box;
                    padding:14px 16px;border:2px solid #e5e7eb;
                    border-radius:14px;font-size:20px;
                    text-align:center;letter-spacing:4px;
                    text-transform:uppercase;font-weight:700;
                    outline:none;
                " maxlength="8" />
            <p id="prove-feil" style="color:#ef4444;font-size:13px;margin-top:8px;display:none;"></p>
            <button id="prove-start-knapp" style="
                width:100%;margin-top:16px;padding:14px;
                background:#7c3aed;color:white;border:none;
                border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;
            ">Start prøve</button>
            <button id="prove-avbryt-knapp" style="
                width:100%;margin-top:10px;padding:12px;
                background:none;border:none;color:#9ca3af;font-size:14px;cursor:pointer;
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
                feil.textContent = `Fant ingen prøve med kode "${kode}". Sjekk at du har skrevet riktig.`;
                feil.style.display = 'block';
            }
        } catch (e) {
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
