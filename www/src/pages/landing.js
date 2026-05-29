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

                <!-- Navbar -->
                <nav style="
                    position: sticky; top: 0; z-index: 100;
                    background: rgba(255,255,255,0.92);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(124,58,237,0.12);
                    padding: 0 20px;
                    display: flex; align-items: center; justify-content: space-between;
                    height: 56px;
                ">
                    <span style="font-family:'Nunito',system-ui;font-size:18px;font-weight:800;color:#FF6B47;">🎓 GloseMester</span>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <a href="/for-skoler.html" style="padding:8px 12px;border-radius:99px;text-decoration:none;font-size:13px;font-weight:600;color:#6b7280;">For skoler</a>
                        <a href="/faq.html" style="padding:8px 12px;border-radius:99px;text-decoration:none;font-size:13px;font-weight:600;color:#6b7280;">FAQ</a>
                        <button id="logg-inn-btn" style="
                            padding:8px 16px;background:#FF6B47;border:none;
                            border-radius:99px;font-size:13px;font-weight:700;
                            color:white;cursor:pointer;
                        ">Logg inn</button>
                    </div>
                </nav>

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
                    <div class="fag-card fag-card-active" id="fag-gloser" data-fag="gloser">

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

                        <button class="btn btn-primary btn-lg" style="width: 100%;" id="start-glosemester-btn">
                            🚀 Start øving — det er gratis
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

                <!-- For skoler / Vil du vite mer -->
                <div style="text-align:center;margin:16px auto 0;padding:0 20px;">
                    <a href="/for-skoler.html" style="display:inline-block;color:hsl(258,15%,45%);font-size:14px;text-decoration:none;padding:8px 0;border-bottom:1px dashed hsl(258,15%,70%);">
                        🏫 Er du lærer eller skole? Se priser og funksjoner →
                    </a>
                </div>

                <!-- Footer -->
                <footer class="landing-footer">
                    <p>© 2026 GloseMester</p>
                    <p>
                        <a href="/faq.html">FAQ</a> ·
                        <a href="/personvern.html">Personvern</a> ·
                        <a href="/for-skoler.html">For skoler</a> ·
                        <a href="/om-oss.html">Om oss</a>
                    </p>
                </footer>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        const startBtn   = document.getElementById('start-glosemester-btn');
        const loggInnBtn = document.getElementById('logg-inn-btn');

        startBtn?.addEventListener('click', () => router.push(ROUTES.GLOSEMESTER));

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
