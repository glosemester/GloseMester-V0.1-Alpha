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
            <div class="landing-page">
                <header class="landing-header">
                    <h1>Hva skal vi øve i dag?</h1>
                    <p>Velg fagområde og begynn å lære!</p>
                </header>

                <div class="fag-grid">
                    <!-- GloseMester - Aktiv -->
                    <div class="fag-card fag-card-active" data-fag="gloser">
                        <div class="fag-ikon">📚</div>
                        <h2>GloseMester</h2>
                        <p>Lær gloser og samle kort</p>
                        <span class="fag-badge fag-badge-active">Tilgjengelig</span>
                    </div>

                    <!-- MatteMester - Aktiv -->
                    <div class="fag-card fag-card-active" data-fag="matte">
                        <div class="fag-ikon">➕</div>
                        <h2>MatteMester</h2>
                        <p>Tren matematikk og vinn kort</p>
                        <span class="fag-badge fag-badge-active">Tilgjengelig</span>
                    </div>

                    <!-- NorskMester - Kommer snart -->
                    <div class="fag-card fag-card-disabled" data-fag="norsk">
                        <div class="fag-ikon">📖</div>
                        <h2>NorskMester</h2>
                        <p>Mestre norsk og samle kort</p>
                        <span class="fag-badge fag-badge-soon">Kommer snart</span>
                    </div>
                </div>

                <footer class="landing-footer">
                    <p>&copy; 2026 Mester Suite. Laget med ❤️ for norske elever.</p>
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
