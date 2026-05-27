/* ============================================
   LANDING PAGE - GloseMester Fagvelger
   GloseMester v2.6
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { visLoginModal } from '../core/auth/auth-service.js';

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

                <!-- Logg inn-knapp -->
                <div style="text-align:center;margin:20px auto 0;max-width:400px;padding:0 20px;">
                    <button id="logg-inn-btn" style="
                        width:100%;padding:14px;
                        background:white;border:2px solid hsl(258,70%,70%);
                        border-radius:14px;font-size:15px;font-weight:700;
                        color:#7c3aed;cursor:pointer;
                        box-shadow:0 2px 12px rgba(124,58,237,0.1);
                    ">🎓 Logg inn som lærer</button>
                </div>

                <!-- For skoler / Vil du vite mer -->
                <div style="text-align:center;margin:16px auto 0;padding:0 20px;">
                    <a href="/for-skoler.html" style="display:inline-block;color:hsl(258,15%,45%);font-size:14px;text-decoration:none;padding:8px 0;border-bottom:1px dashed hsl(258,15%,70%);">
                        🏫 Er du lærer eller skole? Se priser og funksjoner →
                    </a>
                </div>

                <!-- Footer -->
                <footer class="landing-footer">
                    <p>© 2026 GloseMester</p>
                    <p><a href="/personvern.html">Personvern</a> · <a href="/for-skoler.html">For skoler</a></p>
                </footer>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        const gloserCard = document.getElementById('fag-gloser');
        const startBtn   = document.getElementById('start-glosemester-btn');
        const loggInnBtn = document.getElementById('logg-inn-btn');

        const navigate = () => router.push(ROUTES.GLOSEMESTER);

        gloserCard?.addEventListener('click', navigate);
        gloserCard?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate();
        });
        startBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate();
        });

        loggInnBtn?.addEventListener('click', async () => {
            try {
                await visLoginModal();
                router.push(ROUTES.HJEM);
            } catch {
                // Bruker avbrøt innlogging
            }
        });
    }
}

// Make globally available
window.Landing = Landing;
