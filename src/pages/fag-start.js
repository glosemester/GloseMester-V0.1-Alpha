/* ============================================
   FAG-START.JS - Mellomledd for fagvalg
   Viser Øv Selv / Prøve / Lærer valg
   GloseMester v2.6
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
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
                    <div class="playful-card purple" data-role="elev" onclick="window.FagStart.startOvSelv('${fagType}')"
                         style="text-align: center; cursor: pointer; position: relative; padding-bottom: 48px; transition: transform 0.15s, box-shadow 0.15s;"
                         onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform=''">
                        <span class="doodle doodle-star">✨</span>
                        <div class="icon-large">🧠</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">Øv Selv</h2>
                        <p style="margin-bottom: 24px; opacity: 0.95;">Velg nivå og samle kort</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 0 0; text-align: left;">
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Alle nivåer tilgjengelig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Samle kort ved god score</li>
                        </ul>
                        <div style="position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); opacity: 0.3; font-size: 22px; line-height: 1;">↓</div>
                    </div>

                    <!-- Prøve -->
                    <div class="playful-card purple" data-role="prove" onclick="window.FagStart.startProve('${fagType}')"
                         style="text-align: center; opacity: 0.9; border-style: dashed; cursor: pointer; position: relative; padding-bottom: 48px; transition: transform 0.15s;"
                         onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform=''">
                        <span class="doodle doodle-star">⭐</span>
                        <div class="icon-large">📝</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">${fagConfig.proveNavn}</h2>
                        <p style="margin-bottom: 24px; opacity: 0.95;">Har du prøvekode?</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 0 0; text-align: left;">
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Ingen pålogging nødvendig</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Få prøvekode fra lærer</li>
                            <li style="padding: 10px 0; opacity: 0.95;">✅ Resultat sendes til lærer</li>
                        </ul>
                        <div style="position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); opacity: 0.3; font-size: 22px; line-height: 1;">↓</div>
                    </div>

                    <!-- Lærer -->
                    <div class="playful-card gold" data-role="larer" onclick="window.FagStart.startLarer('${fagType}')"
                         style="text-align: center; cursor: pointer; position: relative; padding-bottom: 48px; transition: transform 0.15s;"
                         onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform=''">
                        <span class="doodle doodle-star">🌟</span>
                        <div class="icon-large">🎓</div>
                        <h2 style="font-size: 28px; margin: 0 0 12px 0;">Lærer</h2>
                        <p style="margin-bottom: 24px;">Lag prøver og følg elever</p>
                        <ul style="list-style: none; padding: 0; margin: 0 0 0 0; text-align: left;">
                            <li style="padding: 10px 0;">✅ Lag egne prøver</li>
                            <li style="padding: 10px 0;">✅ Se elevresultater</li>
                            <li style="padding: 10px 0;">✅ Del med QR-kode</li>
                        </ul>
                        <div style="position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); opacity: 0.3; font-size: 22px; line-height: 1;">↓</div>
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
        window.GloseMester.aktivtFag = fagType;
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
                gradient: 'var(--gradient-purple)',
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
                if (!window.GloseMester.moduler.glosemester) {
                    console.log('📚 Loading GloseMester module...');
                    const { glosemester } = await import('../features/glosemester/index.js');
                    window.GloseMester.moduler.glosemester = glosemester;
                    await glosemester.init();
                } else {
                    window.GloseMester.moduler.glosemester.renderPracticeUI();
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
        modal.className = 'glass-panel';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(8px);';
        modal.innerHTML = `
            <div class="glass-card" style="max-width: 400px; width: 92%; text-align: center;">
                <h2 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--purple-900);">Skriv inn prøvekode</h2>
                <p style="color: var(--purple-600); margin: 0 0 24px 0; font-size: 15px;">Du har fått en prøvekode fra læreren din</p>
                <input
                    type="text"
                    id="prove-code-input"
                    class="input-field"
                    placeholder="ABC123"
                    style="font-size: 24px; font-weight: 800; letter-spacing: 4px; text-align: center; margin-bottom: 12px; text-transform: uppercase;"
                    maxlength="8"
                    autocomplete="off"
                />
                <div id="qr-scan-area" style="display:none; margin-bottom:12px;">
                    <video id="qr-video" playsinline muted style="width:100%; border-radius:12px; background:#000; max-height:220px; object-fit:cover;"></video>
                    <p style="font-size:12px; color:#6B7280; text-align:center; margin-top:6px;">Pek kameraet mot QR-koden</p>
                </div>
                <button id="scan-qr-btn" onclick="window.FagStart.toggleQRScan('${fagType}')"
                    style="width:100%; padding:10px; background:rgba(124,58,237,0.08); border:1px dashed rgba(124,58,237,0.3); border-radius:10px; color:#7C3AED; font-weight:600; font-size:14px; cursor:pointer; margin-bottom:16px;">
                    📷 Scan QR-kode
                </button>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-secondary" onclick="window.FagStart.closeProveModal()" style="flex: 1;">
                        Avbryt
                    </button>
                    <button id="prove-start-btn" onclick="window.FagStart.submitProveCode('${fagType}')" class="btn btn-primary" style="flex: 2;">
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
        if (btn) { btn.disabled = true; btn.textContent = 'Henter…'; }

        try {
            const prove = await hentProveMedKode(code);

            if (!prove) {
                visToast(`Fant ingen prøve med kode "${code}".`, 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'Start prøve'; }
                return;
            }

            document.getElementById('prove-modal')?.remove();
            await startQuiz(prove);

        } catch (err) {
            console.error('Feil:', err);
            visToast('Kunne ikke hente prøven.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Start prøve'; }
        }
    }

    static closeProveModal() {
        FagStart.stopQRScan();
        document.getElementById('prove-modal')?.remove();
    }

    static async toggleQRScan(fagType) {
        const scanArea = document.getElementById('qr-scan-area');
        const btn = document.getElementById('scan-qr-btn');
        if (!scanArea) return;

        if (scanArea.style.display !== 'none') {
            FagStart.stopQRScan();
            return;
        }

        if (!('BarcodeDetector' in window)) {
            visToast('QR-scanning støttes ikke i denne nettleseren — skriv inn koden manuelt', 'warning');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = document.getElementById('qr-video');
            if (!video) { stream.getTracks().forEach(t => t.stop()); return; }

            video.srcObject = stream;
            await video.play();
            window._qrStream = stream;
            scanArea.style.display = 'block';
            if (btn) btn.textContent = '⏹ Stopp skanning';

            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const scan = async () => {
                if (!window._qrStream) return;
                try {
                    const codes = await detector.detect(video);
                    if (codes.length > 0) {
                        let kode = codes[0].rawValue;
                        try { kode = new URL(kode).searchParams.get('prove') || kode; } catch {}
                        FagStart.stopQRScan();
                        const input = document.getElementById('prove-code-input');
                        if (input) input.value = kode.toUpperCase();
                        FagStart.submitProveCode(fagType);
                        return;
                    }
                } catch {}
                requestAnimationFrame(scan);
            };
            video.addEventListener('loadeddata', () => requestAnimationFrame(scan), { once: true });
        } catch (e) {
            visToast('Klarte ikke åpne kamera: ' + e.message, 'error');
        }
    }

    static stopQRScan() {
        if (window._qrStream) {
            window._qrStream.getTracks().forEach(t => t.stop());
            window._qrStream = null;
        }
        const video = document.getElementById('qr-video');
        if (video) video.srcObject = null;
        const scanArea = document.getElementById('qr-scan-area');
        if (scanArea) scanArea.style.display = 'none';
        const btn = document.getElementById('scan-qr-btn');
        if (btn) btn.textContent = '📷 Scan QR-kode';
    }

    /**
     * Start Lærer mode — krev innlogging og last lærermodul
     * @param {string} fagType - Fag type
     */
    static async startLarer(fagType) {
        router.push(ROUTES.TEACHER_HOME);
    }
}

// Make globally available
window.FagStart = FagStart;
window.fagStart = FagStart;

console.log('📄 FagStart module loaded');
