/* ============================================
   LANDING PAGE - GloseMester Fagvelger
   GloseMester v2.6
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';

/**
 * Landing page - Fagvelger (kun GloseMester)
 */
export class Landing {
    static render() {
        const container = document.getElementById('app');

        if (!container) {
            console.error('App container not found');
            return;
        }

        container.innerHTML = `
            <div class="landing-page blob-bg">

                <!-- Hero Header -->
                <header class="landing-header" style="position: relative; z-index: 1;">
                    <div class="landing-eyebrow">
                        🎓 Læringsplattform for norske skoler
                    </div>
                    <h1>GloseMester</h1>
                    <p>Lær engelske gloser, samle samlekort og mestre språket — på en morsom måte!</p>
                </header>

                <!-- Fag Grid — kun GloseMester -->
                <div class="fag-grid single" style="position: relative; z-index: 1;">
                    <div class="fag-card fag-card-active" id="fag-gloser" data-fag="gloser" role="button" tabindex="0" aria-label="Start GloseMester">

                        <!-- Dekor-element -->
                        <div style="
                            position: absolute;
                            top: -30px; right: -30px;
                            width: 140px; height: 140px;
                            border-radius: 50%;
                            background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
                            pointer-events: none;
                        "></div>

                        <span class="fag-ikon">📚</span>

                        <h2>GloseMester</h2>
                        <p>Samle over 150 unike samlekort, bygg din samling og lær gloser mens du spiller!</p>

                        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; text-align: left;">
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: hsl(258, 15%, 40%);">
                                <span style="font-size: 18px;">🃏</span> 150+ unike samlekort (Biler, Dyr, Dinosaurer, Guder)
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: hsl(258, 15%, 40%);">
                                <span style="font-size: 18px;">♻️</span> Panteordning — bytt dubletter mot diamanter
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: hsl(258, 15%, 40%);">
                                <span style="font-size: 18px;">🎓</span> Lærerdashboard med QR-kodede prøver
                            </div>
                        </div>

                        <span class="fag-badge fag-badge-active" style="margin-bottom: 24px;">
                            ✨ Tilgjengelig nå
                        </span>

                        <button class="btn btn-primary btn-lg" style="width: 100%;" id="start-glosemester-btn">
                            🚀 Start nå
                        </button>
                    </div>
                </div>

                <!-- Elev: Skriv inn prøvekode -->
                <div style="text-align: center; margin: 24px auto 0; max-width: 400px; padding: 0 20px; position: relative; z-index: 1;">
                    <p style="font-size: 14px; color: hsl(258, 15%, 45%); margin-bottom: 10px;">Har du fått en prøvekode fra læreren?</p>
                    <div style="display: flex; gap: 8px;">
                        <input
                            id="prove-kode-input"
                            type="text"
                            placeholder="Skriv inn kode (f.eks. ABC123)"
                            maxlength="6"
                            autocomplete="off"
                            autocapitalize="characters"
                            style="flex:1; padding: 12px 16px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border: 2px solid hsl(258, 40%, 88%); border-radius: 14px; outline: none; text-align: center;"
                        />
                        <button id="prove-kode-btn" class="btn btn-primary" style="padding: 12px 18px; border-radius: 14px; white-space: nowrap;">
                            🚀 Start
                        </button>
                    </div>
                    <p id="prove-kode-feil" style="display:none; color:#dc2626; font-size:13px; margin-top:8px;"></p>
                </div>

                <!-- PWA Install Button -->
                <div style="text-align: center; margin: 16px auto 0; max-width: 400px; padding: 0 20px; position: relative; z-index: 1;">
                    <button
                        id="pwa-install-btn"
                        class="btn btn-secondary"
                        style="display: none; width: 100%;"
                    >
                        📲 Installer App
                    </button>
                </div>

                <!-- For skoler / Vil du vite mer -->
                <div style="text-align:center;margin:8px auto 0;padding:0 20px;">
                    <a href="/for-skoler.html" style="display:inline-block;color:hsl(258,15%,45%);font-size:14px;text-decoration:none;padding:8px 0;border-bottom:1px dashed hsl(258,15%,70%);">
                        🏫 Er du lærer eller skole? Se priser og funksjoner →
                    </a>
                </div>

                <!-- Footer -->
                <footer class="landing-footer">
                    <p>© 2026 GloseMester. Laget med ❤️ for norske elever og lærere.</p>
                    <p><a href="/personvern.html">Personvern</a> · <a href="/for-skoler.html">For skoler</a></p>
                </footer>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        const gloserCard = document.getElementById('fag-gloser');
        const startBtn   = document.getElementById('start-glosemester-btn');

        const navigate = () => router.push(ROUTES.GLOSEMESTER);

        gloserCard?.addEventListener('click', navigate);
        gloserCard?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate();
        });
        startBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate();
        });

        // Prøvekode-input for elever
        const kodeInput = document.getElementById('prove-kode-input');
        const kodeBtn   = document.getElementById('prove-kode-btn');
        const kodeFeil  = document.getElementById('prove-kode-feil');

        const startMedKode = async () => {
            const kode = kodeInput.value.trim().toUpperCase();
            if (kode.length < 4) {
                kodeFeil.textContent = 'Skriv inn prøvekoden du fikk fra læreren.';
                kodeFeil.style.display = 'block';
                return;
            }
            kodeBtn.disabled = true;
            kodeBtn.textContent = '⏳ Leter...';
            kodeFeil.style.display = 'none';
            try {
                const { hentProveMedKode, startQuiz } = await import('../shared/quiz/quiz-engine.js');
                const prove = await hentProveMedKode(kode);
                if (prove) {
                    await startQuiz(prove);
                } else {
                    kodeFeil.textContent = `Fant ingen prøve med kode "${kode}". Sjekk at du har skrevet riktig.`;
                    kodeFeil.style.display = 'block';
                    kodeBtn.disabled = false;
                    kodeBtn.textContent = '🚀 Start';
                }
            } catch (err) {
                console.error('Prøvekode-feil:', err);
                kodeFeil.textContent = 'Noe gikk galt. Sjekk nettforbindelsen og prøv igjen.';
                kodeFeil.style.display = 'block';
                kodeBtn.disabled = false;
                kodeBtn.textContent = '🚀 Start';
            }
        };

        kodeBtn?.addEventListener('click', startMedKode);
        kodeInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startMedKode();
        });
        kodeInput?.addEventListener('input', () => {
            kodeInput.value = kodeInput.value.toUpperCase();
        });
    }
}

// Make globally available
window.Landing = Landing;
