/* ============================================
   FAG-START.JS - Mellomledd for fagvalg
   Viser Øv Selv / Prøve / Lærer valg
   GloseMester v2.6
   ============================================ */

import { router } from '../core/navigation/router.js';
import { krevInnlogging } from '../core/auth/auth-service.js';
import { hentProveMedKode, startQuiz } from '../shared/quiz/quiz-engine.js';
import { visToast } from '../core/utils/feedback.js';

/**
 * FagStart - Mellomledd som viser rollevalg
 */
export class FagStart {
    /**
     * Render fag start page
     * @param {string} fagType - 'gloser', 'matte', 'norsk'
     */
    static render(fagType) {
        const container = document.getElementById('app');

        if (!container) {
            console.error('App container not found');
            return;
        }

        const fagConfig = this.getFagConfig(fagType);

        container.innerHTML = `
            <div class="fag-start-page blob-bg" style="min-height: 100vh; padding: 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; position: relative;">
                    <button class="btn btn-secondary" onclick="window.router.back()" style="position: absolute; left: 0; top: 0;">
                        ← Tilbake
                    </button>
                </div>

                <!-- Hero Banner -->
                <div class="hero-section" style="background: ${fagConfig.gradient}; border-radius: var(--radius-xl, 50px); margin-bottom: 50px;">
                    <div class="icon-large">${fagConfig.emoji}</div>
                    <h1>${fagConfig.name}</h1>
                    <p>${fagConfig.description}</p>
                </div>

                <!-- Role Cards Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; padding: 0 20px;">

                    <!-- Øv Selv -->
                    <div class="playful-card purple" data-role="elev" style="text-align: center;">
                        <span class="doodle doodle-star">✨</span>
                        <div class="icon-large">🧠</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">Øv Selv</h2>
                        <p style="margin-bottom: 24px; opacity: 0.95;">Velg nivå og samle kort</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left;">
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Alle nivåer tilgjengelig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Samle kort ved god score</li>
                        </ul>
                        <button class="btn btn-primary" onclick="window.fagStart.startOvSelv('${fagType}')" style="width: 100%;">
                            🚀 Start øving
                        </button>
                    </div>

                    <!-- Prøve -->
                    <div class="playful-card orange" data-role="prove" style="text-align: center;">
                        <span class="doodle doodle-star">⭐</span>
                        <div class="icon-large">📝</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">${fagConfig.proveNavn}</h2>
                        <p style="margin-bottom: 24px; opacity: 0.95;">Har du prøvekode?</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left;">
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Få prøvekode fra lærer</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Resultat sendes til lærer</li>
                        </ul>
                        <button class="btn btn-orange" onclick="window.fagStart.startProve('${fagType}')" style="width: 100%;">
                            🎯 Ta prøve
                        </button>
                    </div>

                    <!-- Lærer -->
                    <div class="playful-card yellow" data-role="larer" style="text-align: center;">
                        <span class="doodle doodle-star">🌟</span>
                        <div class="icon-large">🎓</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">Lærer</h2>
                        <p style="margin-bottom: 24px;">Lag prøver og følg elever</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left;">
                            <li style="padding: 10px 0;">✅ Lag egne prøver</li>
                            <li style="padding: 10px 0;">✅ Se elevresultater</li>
                            <li style="padding: 10px 0;">✅ Del med QR-kode</li>
                        </ul>
                        <button class="btn btn-yellow" onclick="window.fagStart.startLarer('${fagType}')" style="width: 100%;">
                            👩‍🏫 Logg inn
                        </button>
                    </div>
                </div>

                <!-- Wave Divider -->
                <div class="wave-divider" style="margin-top: 60px;"></div>

                <footer style="text-align: center; padding: 40px 20px; color: var(--text-secondary, #6B7280);">
                    <p style="font-size: 14px;">&copy; 2026 GloseMester. Laget med ❤️ for norske elever og lærere.</p>
                </footer>
            </div>
        `;

        // Store current fag
        window.MesterSuite.aktivtFag = fagType;
        sessionStorage.setItem('aktivtFag', fagType);
    }

    /**
     * Get fag configuration
     * @param {string} fagType - Fag identifier
     * @returns {Object} Fag config
     */
    static getFagConfig(fagType) {
        const configs = {
            gloser: {
                name: 'GloseMester',
                emoji: '📚',
                description: 'Samle kort, bygg din samling og lær gloser samtidig.',
                gradient: 'linear-gradient(145deg, hsl(258, 80%, 48%) 0%, hsl(270, 85%, 55%) 100%)',
                proveNavn: 'GlosePrøve'
            }
        };

        return configs[fagType] || configs.gloser;
    }

    /**
     * Start Øv Selv mode
     * @param {string} fagType - Fag type
     */
    static async startOvSelv(fagType) {
        console.log(`Starting Øv Selv for ${fagType}`);

        // Load and initialize module
        switch (fagType) {
            case 'gloser':
                if (!window.MesterSuite.moduler.glosemester) {
                    console.log('📚 Loading GloseMester module...');
                    const { glosemester } = await import('../features/glosemester/index.js');
                    window.MesterSuite.moduler.glosemester = glosemester;
                    await glosemester.init();
                } else {
                    window.MesterSuite.moduler.glosemester.renderPracticeUI();
                }
                break;

            default:
                console.warn('Ukjent fag:', fagType);
        }
    }

    /**
     * Start Prøve mode
     * @param {string} fagType - Fag type
     */
    static startProve(fagType) {
        console.log(`Starting Prøve for ${fagType}`);

        // Show prove code input modal
        const modal = document.createElement('div');
        modal.id = 'prove-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);';
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 40px; max-width: 400px; width: 92%; box-shadow: 0 24px 60px rgba(0,0,0,0.18);">
                <h2 style="margin: 0 0 8px 0; font-family: 'Outfit', system-ui; font-size: 22px; font-weight: 800; color: #1F2937;">Skriv inn prøvekode</h2>
                <p style="color: #6B7280; margin: 0 0 20px 0; font-size: 14px;">Du har fått en prøvekode fra læreren din</p>
                <input
                    type="text"
                    id="prove-code-input"
                    placeholder="F.eks. ABC123"
                    style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 20px; font-weight: 700; letter-spacing: 3px; text-align: center; margin-bottom: 20px; text-transform: uppercase; outline: none;"
                    maxlength="8"
                    autocomplete="off"
                    autocapitalize="characters"
                />
                <div style="display: flex; gap: 10px;">
                    <button onclick="document.getElementById('prove-modal').remove()" style="flex: 1; padding: 15px; border: none; background: #f3f4f6; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 15px; color: #374151;">
                        Avbryt
                    </button>
                    <button id="prove-start-btn" onclick="window.fagStart.submitProveCode('${fagType}')" style="flex: 2; padding: 15px; border: none; background: #7C3AED; color: white; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 15px;">
                        🎯 Start prøve
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('prove-code-input').focus();
    }

    /**
     * Submit prove code — henter prøve fra Firestore og starter quiz
     * @param {string} fagType - Fag type
     */
    static async submitProveCode(fagType) {
        const input = document.getElementById('prove-code-input');
        const code = input?.value.trim().toUpperCase();

        if (!code || code.length < 4) {
            visToast('Skriv inn en gyldig prøvekode', 'warning');
            return;
        }

        const btn = document.querySelector('#prove-start-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Henter prøve…'; }

        try {
            const prove = await hentProveMedKode(code);

            if (!prove) {
                visToast(`Fant ingen prøve med kode "${code}". Sjekk koden og prøv igjen.`, 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'Start prøve'; }
                return;
            }

            // Lukk modal
            document.getElementById('prove-modal')?.remove();

            // Start quiz
            await startQuiz(prove);

        } catch (err) {
            console.error('Feil ved henting av prøve:', err);
            visToast('Kunne ikke hente prøven. Sjekk internettilkoblingen.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Start prøve'; }
        }
    }

    /**
     * Start Lærer mode — krev innlogging og last lærermodul
     * @param {string} fagType - Fag type
     */
    static async startLarer(fagType) {
        try {
            const { user, userData } = await krevInnlogging('Du må logge inn for å bruke lærerportalen.');

            const { TeacherModule } = await import('../features/teacher/teacher-module.js');
            const teacher = new TeacherModule();
            await teacher.init({
                userName: userData?.displayName || user.displayName || 'Lærer',
                userId: user.uid,
                isAdmin: userData?.rolle === 'admin'
            });

        } catch (err) {
            if (err?.message !== 'Avbrutt') {
                console.error('Feil ved innlogging:', err);
                visToast('Innlogging feilet. Prøv igjen.', 'error');
            }
        }
    }
}

// Make globally available
window.FagStart = FagStart;
window.fagStart = FagStart;

console.log('📄 FagStart module loaded');
