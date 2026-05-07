/* ============================================
   QUIZ-ENGINE.JS - GloseMester v2.6
   Student prøvemodus: hent prøve fra Firestore,
   vis quiz, send resultater tilbake til lærer.
   ============================================ */

import {
    db,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from '../../core/auth/firebase-config.js';
import { visToast } from '../../core/utils/feedback.js';

// ============================================
// HENT PRØVE FRA FIRESTORE
// ============================================

/**
 * Hent prøve via 6-tegns kode
 * @param {string} kode - Prøvekoden (f.eks. "ABC123")
 * @returns {Promise<Object|null>} Prøveobjekt eller null
 */
export async function hentProveMedKode(kode) {
    const normalKode = kode.trim().toUpperCase();

    const q = query(
        collection(db, 'prover'),
        where('kode', '==', normalKode)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    const proveDoc = snap.docs[0];
    return { id: proveDoc.id, ...proveDoc.data() };
}

// ============================================
// START QUIZ
// ============================================

/**
 * Vis og kjør en quiz basert på prøvedata
 * @param {Object} prove - Prøveobjekt fra Firestore
 * @param {string} containerSelector - CSS-selector til container (standard: '#app')
 */
export async function startQuiz(prove, containerSelector = '#app') {
    const container = document.getElementById(containerSelector.replace('#', '')) ||
                      document.querySelector(containerSelector);
    if (!container) return;

    // Bygg spørsmålsliste
    const sporsmal = byggSporsmalsliste(prove);

    const quizState = {
        prove,
        sporsmal,
        currentIndex: 0,
        riktige: 0,
        svar: [],        // [{ sporsmal, brukersvar, riktig: bool }]
        startTid: Date.now()
    };

    // Vis første spørsmål
    visSporsmal(quizState, container);
}

/**
 * Bygg spørsmålsliste basert på fagtype
 */
function byggSporsmalsliste(prove) {
    const { fag, ordliste = [], oppgaver = [] } = prove;

    if (fag === 'matte') {
        // Matte: bruk oppgaver-listen direkte, eller generer
        return (oppgaver.length ? oppgaver : []).map(o => ({
            type: 'tekst',
            sporsmal: o.sporsmal || o.s,
            riktigSvar: String(o.svar ?? o.e),
            forklaring: o.forklaring || null
        }));
    }

    // Gloser / Norsk: ordliste-basert med 4 alternativer
    const stokket = stokkArray([...ordliste]);
    return stokket.map(ord => {
        const riktig = fag === 'norsk' ? ord.s : ord.e;
        const vises  = fag === 'norsk' ? ord.e || ord.s : ord.s;
        const feil   = lagFeilAlternativer(riktig, stokket.map(o => fag === 'norsk' ? o.s : o.e));
        const alts   = stokkArray([riktig, ...feil]);
        return {
            type: 'flervalg',
            sporsmal: vises,
            alternativer: alts,
            riktigSvar: riktig
        };
    });
}

/**
 * Vis ett spørsmål
 */
function visSporsmal(state, container) {
    const { sporsmal, currentIndex, prove } = state;
    const totalt = sporsmal.length;

    if (currentIndex >= totalt) {
        visResultat(state, container);
        return;
    }

    const spm = sporsmal[currentIndex];
    const prosent = Math.round((currentIndex / totalt) * 100);

    container.innerHTML = `
        <div class="quiz-wrapper" style="min-height:100vh; padding:20px; max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">

            <!-- Header -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0;">
                <div style="font-size:14px; color:#6B7280; font-weight:600;">
                    Spørsmål ${currentIndex + 1} av ${totalt}
                </div>
                <div style="font-size:13px; color:#9CA3AF;">${prove.tittel || 'Prøve'}</div>
            </div>

            <!-- Progress bar -->
            <div style="height:6px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:${prosent}%; background:linear-gradient(90deg,#7C3AED,#a78bfa); border-radius:999px; transition:width 0.4s;"></div>
            </div>

            <!-- Spørsmålskort -->
            <div class="playful-card" style="background:white; border-radius:24px; padding:36px 28px; text-align:center; box-shadow:0 8px 32px rgba(124,58,237,0.08);">
                <div style="font-size:13px; color:#9CA3AF; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">
                    ${fagLabel(prove.fag)} · Nivå ${prove.niva || '?'}
                </div>
                <div style="font-size:28px; font-weight:800; color:#1F2937; font-family:'Outfit',system-ui; margin-bottom:8px;">
                    ${spm.sporsmal}
                </div>
            </div>

            <!-- Svaralternativer / tekstfelt -->
            ${spm.type === 'flervalg' ? renderFlervalg(spm) : renderTekstfelt(spm)}

            <p id="quiz-feedback" style="text-align:center; font-weight:700; font-size:18px; min-height:28px;"></p>
        </div>
    `;

    // Koble til event handlers
    if (spm.type === 'flervalg') {
        container.querySelectorAll('.quiz-alt-btn').forEach(btn => {
            btn.addEventListener('click', () => sjekkSvar(state, container, btn.dataset.svar));
        });
    } else {
        const form = container.querySelector('#quiz-tekst-form');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = container.querySelector('#quiz-tekst-input')?.value?.trim();
            if (val) sjekkSvar(state, container, val);
        });
    }
}

function renderFlervalg(spm) {
    return `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            ${spm.alternativer.map(alt => `
                <button class="quiz-alt-btn" data-svar="${alt}" style="
                    padding:18px 12px; border:2px solid #e5e7eb; border-radius:16px;
                    background:white; font-size:17px; font-weight:600; cursor:pointer;
                    transition:all 0.2s; color:#1F2937;
                    hover:border-color:#7C3AED;
                ">${alt}</button>
            `).join('')}
        </div>
    `;
}

function renderTekstfelt(spm) {
    return `
        <form id="quiz-tekst-form" style="display:flex; gap:10px;">
            <input id="quiz-tekst-input" type="text" autocomplete="off" spellcheck="false"
                placeholder="Skriv svaret…"
                style="flex:1; padding:16px; border:2px solid #e5e7eb; border-radius:14px; font-size:18px; font-weight:600; text-align:center; outline:none;" />
            <button type="submit" style="padding:16px 24px; background:#7C3AED; color:white; border:none; border-radius:14px; font-size:18px; font-weight:700; cursor:pointer;">
                ✓
            </button>
        </form>
    `;
}

/**
 * Sjekk svar og gå videre
 */
function sjekkSvar(state, container, brukersvar) {
    const spm = state.sporsmal[state.currentIndex];
    const erRiktig = normaliser(brukersvar) === normaliser(spm.riktigSvar);

    // Deaktiver knapper under feedback
    container.querySelectorAll('.quiz-alt-btn, #quiz-tekst-input, button[type=submit]').forEach(el => el.disabled = true);

    // Farge knapper
    container.querySelectorAll('.quiz-alt-btn').forEach(btn => {
        if (normaliser(btn.dataset.svar) === normaliser(spm.riktigSvar)) {
            btn.style.background = '#D1FAE5';
            btn.style.borderColor = '#10B981';
            btn.style.color = '#065F46';
        } else if (normaliser(btn.dataset.svar) === normaliser(brukersvar) && !erRiktig) {
            btn.style.background = '#FEE2E2';
            btn.style.borderColor = '#EF4444';
            btn.style.color = '#991B1B';
        }
    });

    const feedbackEl = container.querySelector('#quiz-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = erRiktig ? '✅ Riktig!' : `❌ Fasit: ${spm.riktigSvar}`;
        feedbackEl.style.color = erRiktig ? '#10B981' : '#EF4444';
    }

    // Lagre svar
    state.svar.push({ sporsmal: spm.sporsmal, brukersvar, riktig: erRiktig });
    if (erRiktig) state.riktige++;

    // Neste spørsmål etter kort pause
    setTimeout(() => {
        state.currentIndex++;
        visSporsmal(state, container);
    }, erRiktig ? 900 : 1600);
}

// ============================================
// RESULTATER
// ============================================

/**
 * Vis sluttresultat og lagre til Firestore
 */
async function visResultat(state, container) {
    const { prove, riktige, sporsmal, svar, startTid } = state;
    const totalt = sporsmal.length;
    const prosent = totalt > 0 ? Math.round((riktige / totalt) * 100) : 0;
    const tid = Math.round((Date.now() - startTid) / 1000);

    // Lagre til Firestore (anonymt)
    let lagret = false;
    try {
        await lagreResultat(prove, riktige, totalt, prosent, svar, tid);
        lagret = true;
    } catch (e) {
        console.warn('Kunne ikke lagre resultat til Firestore:', e);
    }

    const emoji = prosent >= 90 ? '🏆' : prosent >= 70 ? '🌟' : prosent >= 50 ? '👍' : '💪';
    const farge = prosent >= 70 ? '#10B981' : prosent >= 50 ? '#F59E0B' : '#EF4444';

    container.innerHTML = `
        <div style="min-height:100vh; padding:40px 20px; max-width:560px; margin:0 auto; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; text-align:center;">

            <div style="font-size:80px;">${emoji}</div>

            <h1 style="font-family:'Outfit',system-ui; font-size:32px; font-weight:800; color:#1F2937;">
                Prøven er ferdig!
            </h1>

            <!-- Score ring -->
            <div style="background:white; border-radius:24px; padding:32px 40px; box-shadow:0 8px 32px rgba(0,0,0,0.08); width:100%;">
                <div style="font-size:64px; font-weight:900; color:${farge}; font-family:'Outfit',system-ui; line-height:1;">
                    ${prosent}%
                </div>
                <div style="color:#6B7280; font-size:16px; margin-top:8px;">
                    ${riktige} av ${totalt} riktige
                </div>
            </div>

            <!-- Resultat per spørsmål (kompakt) -->
            <div style="background:white; border-radius:20px; padding:20px; width:100%; text-align:left; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
                <div style="font-weight:700; margin-bottom:12px; color:#1F2937;">Oppsummering</div>
                ${svar.map((s, i) => `
                    <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #f3f4f6; font-size:14px;">
                        <span>${s.riktig ? '✅' : '❌'}</span>
                        <span style="flex:1; color:#374151;">${s.sporsmal}</span>
                        <span style="color:${s.riktig ? '#10B981' : '#EF4444'}; font-weight:600;">${s.brukersvar}</span>
                    </div>
                `).join('')}
            </div>

            ${lagret ? `<p style="font-size:13px; color:#10B981;">✅ Resultat sendt til læreren.</p>` : `<p style="font-size:13px; color:#9CA3AF;">Resultat lagret lokalt (ingen nettverkstilgang).</p>`}

            <button onclick="window.router?.push('/')" style="padding:16px 40px; background:#7C3AED; color:white; border:none; border-radius:16px; font-size:17px; font-weight:700; cursor:pointer;">
                🏠 Tilbake til forsiden
            </button>
        </div>
    `;
}

/**
 * Lagre resultater til Firestore `resultater`-collection
 */
async function lagreResultat(prove, riktige, totalt, prosent, svar, tidSekunder) {
    await addDoc(collection(db, 'resultater'), {
        prove_id: prove.id,
        kode: prove.kode,
        tittel: prove.tittel || '',
        fag: prove.fag || 'ukjent',
        elev_id: crypto.randomUUID(),   // Anonymt
        poengsum: riktige,
        maksPoeng: totalt,
        prosent,
        svar,
        tidSekunder,
        tidspunkt: serverTimestamp()
    });
}

// ============================================
// HJELPEFUNKSJONER
// ============================================

function stokkArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function lagFeilAlternativer(riktig, alleSvar) {
    const feil = alleSvar.filter(s => normaliser(s) !== normaliser(riktig));
    return stokkArray(feil).slice(0, 3);
}

function normaliser(s) {
    return String(s).trim().toLowerCase()
        .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'aa');
}

function fagLabel(fag) {
    return { gloser: 'GloseMester' }[fag] || 'GloseMester';
}
