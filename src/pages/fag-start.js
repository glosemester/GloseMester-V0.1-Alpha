/* ============================================
   FAG-START.JS - Mellomledd for fagvalg
   Viser Øv Selv / Prøve / Lærer valg
   Mester Suite v2.0
   ============================================ */

import { router } from '../core/navigation/router.js';

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
            <div class="fag-start-page">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <button class="btn-secondary" onclick="window.router.back()" style="position: absolute; left: 20px; top: 20px;">
                        ← Tilbake til fagvelger
                    </button>
                </div>

                <!-- Banner -->
                <div class="fag-banner" style="background: ${fagConfig.gradient}; border-radius: 16px; padding: 40px; text-align: center; color: white; margin-bottom: 40px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                    <div style="font-size: 64px; margin-bottom: 15px;">${fagConfig.emoji}</div>
                    <h1 style="font-size: 42px; margin: 0 0 10px 0; font-weight: 700;">${fagConfig.name}</h1>
                    <p style="font-size: 18px; margin: 0; opacity: 0.95;">${fagConfig.description}</p>
                </div>

                <!-- Role Cards -->
                <div class="role-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; max-width: 1000px; margin: 0 auto; padding: 0 20px;">

                    <!-- Øv Selv -->
                    <div class="role-card" data-role="elev" style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; position: relative;">
                        <div style="font-size: 64px; text-align: center; margin-bottom: 15px;">💪</div>
                        <h2 style="font-size: 24px; margin: 0 0 10px 0; text-align: center; color: #0071e3;">Øv Selv</h2>
                        <p style="color: #666; text-align: center; margin-bottom: 20px;">Velg nivå og samle kort</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
                            <li style="padding: 8px 0; color: #666;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 8px 0; color: #666;">✅ Alle nivåer tilgjengelig</li>
                            <li style="padding: 8px 0; color: #666;">✅ Samle kort ved god score</li>
                        </ul>
                        <button class="btn-primary" onclick="window.fagStart.startOvSelv('${fagType}')" style="width: 100%; background: #0071e3;">
                            Start øving
                        </button>
                    </div>

                    <!-- GlosePrøve -->
                    <div class="role-card" data-role="prove" style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s;">
                        <div style="font-size: 64px; text-align: center; margin-bottom: 15px;">📝</div>
                        <h2 style="font-size: 24px; margin: 0 0 10px 0; text-align: center; color: #0071e3;">${fagConfig.proveNavn}</h2>
                        <p style="color: #666; text-align: center; margin-bottom: 20px;">Har du prøvekode?</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
                            <li style="padding: 8px 0; color: #666;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 8px 0; color: #666;">✅ Få prøvekode fra lærer</li>
                            <li style="padding: 8px 0; color: #666;">✅ Resultat sendes til lærer</li>
                        </ul>
                        <button class="btn-primary" onclick="window.fagStart.startProve('${fagType}')" style="width: 100%; background: #10b981;">
                            Ta prøve
                        </button>
                    </div>

                    <!-- Lærer -->
                    <div class="role-card" data-role="larer" style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s;">
                        <div style="font-size: 64px; text-align: center; margin-bottom: 15px;">🍎</div>
                        <h2 style="font-size: 24px; margin: 0 0 10px 0; text-align: center; color: #0071e3;">Lærer</h2>
                        <p style="color: #666; text-align: center; margin-bottom: 20px;">Lag prøver og følg elever</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
                            <li style="padding: 8px 0; color: #666;">✅ Lag egne prøver</li>
                            <li style="padding: 8px 0; color: #666;">✅ Se elevresultater</li>
                            <li style="padding: 8px 0; color: #666;">✅ Del med QR-kode</li>
                        </ul>
                        <button class="btn-primary" onclick="window.fagStart.startLarer('${fagType}')" style="width: 100%; background: #f59e0b;">
                            Logg inn
                        </button>
                    </div>
                </div>

                <footer class="landing-footer" style="text-align: center; margin-top: 60px; padding: 20px; color: #666; font-size: 14px;">
                    <p>&copy; 2026 Mester Suite. Laget med ❤️ for norske elever og lærere.</p>
                </footer>
            </div>

            <style>
                .role-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
                }
            </style>
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
                description: 'Samle kort, bygg din samling og lær språk samtidig.',
                gradient: 'linear-gradient(135deg, #0071e3 0%, #00c6fb 100%)',
                proveNavn: 'GlosePrøve'
            },
            matte: {
                name: 'MatteMester',
                emoji: '➕',
                description: 'Tren matematikk og samle romkort',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                proveNavn: 'MattePrøve'
            },
            norsk: {
                name: 'NorskMester',
                emoji: '📖',
                description: 'Mestre norsk og samle kort',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                proveNavn: 'NorskPrøve'
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

            case 'matte':
                if (!window.MesterSuite.moduler.mattemester) {
                    console.log('➕ Loading MatteMester module...');
                    const { mattemester } = await import('../features/mattemester/index.js');
                    window.MesterSuite.moduler.mattemester = mattemester;
                    await mattemester.init();
                } else {
                    window.MesterSuite.moduler.mattemester.renderPracticeUI();
                }
                break;

            case 'norsk':
                alert('NorskMester kommer snart! 🚧');
                break;
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
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 40px; max-width: 400px; width: 90%;">
                <h2 style="margin: 0 0 10px 0; color: #0071e3;">Skriv inn prøvekode</h2>
                <p style="color: #666; margin: 0 0 20px 0;">Du har fått en prøvekode fra læreren din</p>
                <input
                    type="text"
                    id="prove-code-input"
                    placeholder="F.eks. ABC123"
                    style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; margin-bottom: 20px; text-transform: uppercase;"
                    maxlength="10"
                />
                <div style="display: flex; gap: 10px;">
                    <button onclick="this.closest('[style*=fixed]').remove()" style="flex: 1; padding: 15px; border: none; background: #e0e0e0; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Avbryt
                    </button>
                    <button onclick="window.fagStart.submitProveCode('${fagType}')" style="flex: 1; padding: 15px; border: none; background: #0071e3; color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Start prøve
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('prove-code-input').focus();
    }

    /**
     * Submit prove code
     * @param {string} fagType - Fag type
     */
    static submitProveCode(fagType) {
        const input = document.getElementById('prove-code-input');
        const code = input.value.trim().toUpperCase();

        if (!code) {
            alert('Vennligst skriv inn en prøvekode');
            return;
        }

        console.log(`Submitting prove code: ${code} for ${fagType}`);

        // TODO: Validate code with backend
        // For now, just show message
        alert(`Prøvekode "${code}" er registrert!\n\nDenne funksjonen kommer snart. 🚧`);

        // Close modal
        document.querySelector('[style*=fixed]').remove();
    }

    /**
     * Start Lærer mode
     * @param {string} fagType - Fag type
     */
    static startLarer(fagType) {
        console.log(`Starting Lærer for ${fagType}`);

        // For now, show login required message
        alert('Lærerfunksjonalitet kommer snart! 🚧\n\nDu vil kunne:\n- Lage egne prøver\n- Se elevresultater\n- Dele med QR-kode');
    }
}

// Make globally available
window.FagStart = FagStart;
window.fagStart = FagStart;

console.log('📄 FagStart module loaded');
