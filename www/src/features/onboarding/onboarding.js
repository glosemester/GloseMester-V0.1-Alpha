/* ============================================
   ONBOARDING.JS
   Vises én gang ved første innlogging.
   Lagrer onboarding_vist: true i Firestore.
   ============================================ */

import { db } from '../../core/auth/firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const STEG_LAERER = [
    {
        ikon: '🎓',
        tittel: 'Velkommen til GloseMester!',
        tekst: 'Her lager du prøver, deler dem med klassen og følger med på resultater — alt på ett sted.'
    },
    {
        ikon: '📝',
        tittel: 'Lag prøver enkelt',
        tekst: 'Skriv inn ordlister, og GloseMester lager automatisk prøver elevene kan ta på mobil eller PC.'
    },
    {
        ikon: '🔗',
        tittel: 'Del med klassen',
        tekst: 'Del en prøvekode med elevene, eller bruk Feide-gruppene dine for direkte tildeling.'
    },
    {
        ikon: '📊',
        tittel: 'Følg med på fremgang',
        tekst: 'Se hvem som har tatt prøven og hvordan det gikk — direkte i Administrer-seksjonen.'
    }
];

const STEG_ELEV = [
    {
        ikon: '🎓',
        tittel: 'Velkommen til GloseMester!',
        tekst: 'Her kan du øve på gloser og ta prøver — enten for seg selv eller fra læreren din.'
    },
    {
        ikon: '🃏',
        tittel: 'Øv deg med kort',
        tekst: 'Velg et tema og øv deg på glosene med hjelp fra kortkassemetoden. Jo mer du øver, jo bedre husker du!'
    },
    {
        ikon: '✏️',
        tittel: 'Ta prøver',
        tekst: 'Får du en prøvekode fra læreren, taster du den inn her og tar prøven direkte.'
    }
];

export async function sjekkOnboardingVist(uid) {
    if (!uid) return true;
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() && snap.data().onboarding_vist === true;
    } catch {
        return true;
    }
}

export async function markerOnboardingVist(uid) {
    if (!uid) return;
    try {
        await setDoc(doc(db, 'users', uid), {
            onboarding_vist: true,
            onboarding_dato: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.warn('Kunne ikke lagre onboarding-status:', e.message);
    }
}

export function visOnboarding(rolle, navn, uid) {
    return new Promise((resolve) => {
        const steg = (rolle === 'laerer' || rolle === 'admin') ? STEG_LAERER : STEG_ELEV;
        let aktivtSteg = 0;

        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 20000;
            background: #FF6B47;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 32px 24px;
            animation: fadeIn 0.3s ease;
        `;

        function render() {
            const s = steg[aktivtSteg];
            const erSiste = aktivtSteg === steg.length - 1;
            const prikker = steg.map((_, i) =>
                `<span style="width:8px;height:8px;border-radius:50%;background:${i === aktivtSteg ? 'white' : 'rgba(255,255,255,0.35)'};display:inline-block;transition:background 0.2s;"></span>`
            ).join('');

            overlay.innerHTML = `
                <style>
                    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                    @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
                    #onb-kort { animation: slideUp 0.3s ease; }
                </style>
                <div id="onb-kort" style="
                    max-width: 380px; width: 100%;
                    text-align: center; color: white;
                ">
                    <div style="font-size: 80px; margin-bottom: 24px;">${s.ikon}</div>
                    <h2 style="
                        font-family: 'Outfit', system-ui; font-size: 26px; font-weight: 800;
                        margin: 0 0 16px; line-height: 1.2;
                    ">${s.tittel}</h2>
                    <p style="
                        font-size: 17px; line-height: 1.6;
                        opacity: 0.9; margin: 0 0 40px;
                    ">${s.tekst}</p>

                    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:40px;">
                        ${prikker}
                    </div>

                    <button id="onb-neste" style="
                        width: 100%; padding: 16px;
                        background: white; color: #FF6B47;
                        border: none; border-radius: 16px;
                        font-size: 17px; font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    ">${erSiste ? 'Kom i gang!' : 'Neste →'}</button>

                    ${aktivtSteg > 0 ? `<button id="onb-tilbake" style="
                        background:none;border:none;color:rgba(255,255,255,0.7);
                        font-size:15px;margin-top:16px;cursor:pointer;padding:8px;
                    ">← Tilbake</button>` : ''}

                    <button id="onb-hopp" style="
                        background:none;border:none;color:rgba(255,255,255,0.5);
                        font-size:13px;margin-top:${aktivtSteg > 0 ? '0' : '16px'};cursor:pointer;padding:8px;display:block;margin-left:auto;margin-right:auto;
                    ">Hopp over</button>
                </div>
            `;

            document.getElementById('onb-neste').onclick = () => {
                if (erSiste) {
                    ferdig();
                } else {
                    aktivtSteg++;
                    render();
                }
            };

            const tilbakeBtn = document.getElementById('onb-tilbake');
            if (tilbakeBtn) tilbakeBtn.onclick = () => { aktivtSteg--; render(); };

            document.getElementById('onb-hopp').onclick = () => ferdig();
        }

        async function ferdig() {
            await markerOnboardingVist(uid);
            overlay.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => { overlay.remove(); resolve(); }, 200);
        }

        document.body.appendChild(overlay);
        render();
    });
}
