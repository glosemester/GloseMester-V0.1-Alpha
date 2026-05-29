/* ============================================
   FAGVELGER — Startsiden i appen (utlogget)
   Ingen marketing-hero. Ren fagvelger.
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { visLoginModal } from '../core/auth/auth-service.js';

export class Landing {
    static render() {
        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            <div style="
                min-height: 100vh;
                background: var(--color-bg, #FAFAF8);
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px 20px 60px;
                font-family: var(--font-primary, 'Nunito', sans-serif);
            ">

                <!-- Logo -->
                <div style="text-align:center; margin-bottom: 40px;">
                    <div style="font-size: 40px; margin-bottom: 12px;">📚</div>
                    <h1 style="
                        font-size: 32px; font-weight: 900;
                        color: var(--color-text, #1E1E2E);
                        margin: 0 0 6px 0; letter-spacing: -0.02em;
                    ">
                        <span style="color: var(--color-primary, #FF6B47);">Glose</span>Mester
                    </h1>
                    <p style="
                        font-size: 15px; color: var(--color-text-muted, #6B7280);
                        margin: 0;
                    ">Lær gloser. Samle kort. Bli mester.</p>
                </div>

                <!-- Fagkort -->
                <div style="width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 14px;">

                    <!-- GloseMester -->
                    <div id="fag-gloser" style="
                        background: var(--color-surface, #FFFFFF);
                        border: 1px solid var(--color-border, #E8E5E0);
                        border-radius: var(--radius-lg, 20px);
                        padding: 28px 24px;
                        cursor: pointer;
                        box-shadow: var(--shadow-card, 0 2px 8px rgba(30,30,46,0.08));
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        position: relative; overflow: hidden;
                    "
                    onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(255,107,71,0.15)'"
                    onmouseleave="this.style.transform='';this.style.boxShadow='var(--shadow-card)'">

                        <!-- Topstrek -->
                        <div style="
                            position: absolute; top: 0; left: 0; right: 0; height: 4px;
                            background: linear-gradient(90deg, #FF6B47, #FFB347);
                            border-radius: 20px 20px 0 0;
                        "></div>

                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 14px;">
                            <span style="font-size: 36px; line-height: 1;">📖</span>
                            <div>
                                <div style="font-size: 18px; font-weight: 800; color: var(--color-text, #1E1E2E); margin-bottom: 2px;">GloseMester</div>
                                <div style="font-size: 13px; color: var(--color-text-muted, #6B7280);">Engelsk · 4 nivåer · 150+ samlekort</div>
                            </div>
                        </div>

                        <button id="start-glosemester-btn" style="
                            width: 100%; padding: 14px;
                            background: var(--color-primary, #FF6B47);
                            color: white; border: none;
                            border-radius: var(--radius-full, 999px);
                            font-family: var(--font-primary, 'Nunito', sans-serif);
                            font-size: 15px; font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 4px 16px rgba(255,107,71,0.35);
                            transition: transform 0.2s ease, box-shadow 0.2s ease;
                        "
                        onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(255,107,71,0.45)'"
                        onmouseleave="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(255,107,71,0.35)'">
                            🚀 Start øving — gratis
                        </button>
                    </div>

                    <!-- Logg inn / Registrer -->
                    <div style="
                        background: var(--color-surface, #FFFFFF);
                        border: 1px solid var(--color-border, #E8E5E0);
                        border-radius: var(--radius-lg, 20px);
                        padding: 20px 24px;
                        box-shadow: var(--shadow-card, 0 2px 8px rgba(30,30,46,0.08));
                        text-align: center;
                    ">
                        <p style="font-size: 14px; color: var(--color-text-muted, #6B7280); margin: 0 0 14px 0;">
                            Logg inn for å lagre fremgang og XP
                        </p>
                        <button id="logg-inn-btn" style="
                            width: 100%; padding: 12px;
                            background: transparent;
                            color: var(--color-primary, #FF6B47);
                            border: 2px solid var(--color-primary, #FF6B47);
                            border-radius: var(--radius-full, 999px);
                            font-family: var(--font-primary, 'Nunito', sans-serif);
                            font-size: 14px; font-weight: 700;
                            cursor: pointer;
                            transition: background 0.15s ease;
                        "
                        onmouseenter="this.style.background='var(--color-primary-light, #FFE8E3)'"
                        onmouseleave="this.style.background='transparent'">
                            Logg inn / Registrer
                        </button>
                    </div>

                    <!-- PWA install -->
                    <button id="pwa-install-btn" style="display:none; width:100%; padding:12px;
                        background: var(--color-surface, #FFFFFF);
                        border: 1px solid var(--color-border, #E8E5E0);
                        border-radius: var(--radius-full, 999px);
                        font-family: var(--font-primary, 'Nunito', sans-serif);
                        font-size: 14px; font-weight: 600;
                        color: var(--color-text-muted, #6B7280);
                        cursor: pointer;">
                        📲 Installer app
                    </button>
                </div>

                <!-- Lærer-lenke -->
                <div style="margin-top: 32px; text-align: center;">
                    <a href="/for-laerere.html" style="
                        font-size: 13px; font-weight: 600;
                        color: var(--color-text-muted, #6B7280);
                        text-decoration: none;
                        border-bottom: 1px solid var(--color-border, #E8E5E0);
                        padding-bottom: 2px;
                    ">🏫 Er du lærer? Se lærerdashboard →</a>
                </div>

                <!-- Footer -->
                <footer style="margin-top: auto; padding-top: 48px; text-align: center;">
                    <p style="font-size: 12px; color: var(--color-text-muted, #6B7280); margin: 0 0 6px;">© 2026 GloseMester</p>
                    <p style="font-size: 12px; margin: 0;">
                        <a href="/personvern.html" style="color: var(--color-text-muted, #6B7280); text-decoration: none;">Personvern</a>
                        &nbsp;·&nbsp;
                        <a href="/vilkar.html" style="color: var(--color-text-muted, #6B7280); text-decoration: none;">Vilkår</a>
                        &nbsp;·&nbsp;
                        <a href="/om-oss.html" style="color: var(--color-text-muted, #6B7280); text-decoration: none;">Om oss</a>
                    </p>
                </footer>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        document.getElementById('start-glosemester-btn')
            ?.addEventListener('click', () => router.push(ROUTES.GLOSEMESTER));

        document.getElementById('logg-inn-btn')
            ?.addEventListener('click', async () => {
                try {
                    await visLoginModal();
                    router.push(ROUTES.HJEM);
                } catch {
                    // Bruker avbrøt
                }
            });
    }
}

window.Landing = Landing;
