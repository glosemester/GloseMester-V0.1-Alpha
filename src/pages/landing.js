/* ============================================
   LANDING PAGE - Fagvelger
   Mester Suite v2.0
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';

/**
 * Landing page - Fagvelger
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
                <!-- Hero Section -->
                <header class="hero-section" style="text-align: center; padding: 60px 20px 40px; position: relative; z-index: 1;">
                    <div style="display: inline-block; background: linear-gradient(135deg, var(--primary-purple), var(--vibrant-orange)); padding: 15px 30px; border-radius: var(--radius-xl); margin-bottom: 20px; box-shadow: var(--shadow-lg);">
                        <span style="font-size: 48px;">🚀</span>
                    </div>
                    <h1 style="font-size: 48px; margin-bottom: 15px; font-family: var(--font-heading); font-weight: 800; background: linear-gradient(135deg, var(--primary-purple), var(--vibrant-orange)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        Hva skal vi mestre i dag?
                    </h1>
                    <p style="font-size: 20px; color: var(--text-gray); font-family: var(--font-body);">
                        Velg fagområde og begynn din læringsreise!
                    </p>
                </header>

                <!-- Fag Grid -->
                <div class="fag-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; padding: 0 20px 60px;">

                    <!-- GloseMester - Aktiv -->
                    <div class="playful-card purple fag-card fag-card-active" data-fag="gloser" style="text-align: center; cursor: pointer; position: relative; overflow: visible;">
                        <span class="doodle doodle-arrow" style="position: absolute; top: -10px; right: -10px; font-size: 24px;">→</span>
                        <div class="icon-large" style="font-size: 72px; margin-bottom: 20px;">📚</div>
                        <h2 style="font-size: 32px; margin-bottom: 12px; font-family: var(--font-heading); font-weight: 700;">GloseMester</h2>
                        <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">Lær gloser og samle kort</p>
                        <span class="badge badge-active" style="display: inline-block; padding: 8px 20px; background: var(--sunny-yellow); color: var(--text-dark); border-radius: var(--radius-xl); font-weight: 600; font-size: 14px;">
                            ✨ Tilgjengelig
                        </span>
                    </div>

                    <!-- MatteMester - Aktiv nå! -->
                    <div class="playful-card orange fag-card" data-fag="matte" style="text-align: center; cursor: pointer; position: relative; overflow: visible;">
                        <span class="doodle doodle-star" style="position: absolute; top: -10px; right: -10px; font-size: 32px;">✨</span>
                        <div class="icon-large" style="font-size: 72px; margin-bottom: 20px;">➕</div>
                        <h2 style="font-size: 32px; margin-bottom: 12px; font-family: var(--font-heading); font-weight: 700;">MatteMester</h2>
                        <p style="font-size: 16px; margin-bottom: 20px;">Tren matematikk og vinn romkort</p>
                        <span class="badge badge-new" style="display: inline-block; padding: 8px 20px; background: #10b981; color: white; border-radius: var(--radius-xl); font-weight: 600; font-size: 14px;">
                            🎉 NY!
                        </span>
                    </div>

                    <!-- NorskMester - Kommer snart -->
                    <div class="playful-card yellow fag-card fag-card-disabled" data-fag="norsk" style="text-align: center; cursor: not-allowed; opacity: 0.6; position: relative;">
                        <div class="icon-large" style="font-size: 72px; margin-bottom: 20px; filter: grayscale(50%);">📖</div>
                        <h2 style="font-size: 32px; margin-bottom: 12px; font-family: var(--font-heading); font-weight: 700;">NorskMester</h2>
                        <p style="font-size: 16px; margin-bottom: 20px;">Mestre norsk og samle kort</p>
                        <span class="badge badge-soon" style="display: inline-block; padding: 8px 20px; background: var(--text-gray); color: white; border-radius: var(--radius-xl); font-weight: 600; font-size: 14px;">
                            🚧 Kommer snart
                        </span>
                    </div>
                </div>

                <!-- Wave Divider -->
                <div class="wave-divider"></div>

                <!-- Footer -->
                <footer style="text-align: center; padding: 40px 20px; background: transparent;">
                    <p style="color: var(--text-gray); font-size: 14px;">&copy; 2026 Mester Suite. Laget med ❤️ for norske elever.</p>
                </footer>
            </div>
        `;

        // Attach event listeners
        this.attachEventListeners();
    }

    static attachEventListeners() {
        const fagCards = document.querySelectorAll('.fag-card');

        fagCards.forEach(card => {
            card.addEventListener('click', () => {
                const fag = card.dataset.fag;

                // Check if card is disabled
                if (card.classList.contains('fag-card-disabled')) {
                    this.showComingSoonMessage(fag);
                    return;
                }

                // Navigate to selected fag
                this.selectFag(fag);
            });
        });
    }

    static selectFag(fag) {
        console.log(`Selected fag: ${fag}`);

        // Store selected fag
        sessionStorage.setItem('aktivtFag', fag);

        // Navigate to appropriate route
        switch (fag) {
            case 'gloser':
                router.push(ROUTES.GLOSEMESTER);
                break;
            case 'matte':
                router.push(ROUTES.MATTEMESTER);
                break;
            case 'norsk':
                router.push(ROUTES.NORSKMESTER);
                break;
            default:
                console.error('Unknown fag:', fag);
        }
    }

    static showComingSoonMessage(fag) {
        const fagNames = {
            matte: 'MatteMester',
            norsk: 'NorskMester'
        };

        // Simple alert for now - can be replaced with toast
        alert(`${fagNames[fag]} kommer snart! 🚧\n\nVi jobber hardt med å ferdigstille dette faget.`);
    }
}

// Make globally available
window.Landing = Landing;
