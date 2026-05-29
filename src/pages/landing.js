/* ============================================
   FAGVELGER — Startsiden i appen (utlogget)
   Animert logo: G dropper ned + GloseMester fader inn
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { visStartOvingModal } from '../core/auth/auth-service.js';

const LOGO_CSS = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');

.gm-page {
  min-height: 100vh;
  background: #FAFAF8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px 60px;
  font-family: 'Nunito', 'Arial Rounded MT Bold', sans-serif;
}

/* ── Logo-seksjon ── */
.gm-hero {
  text-align: center;
  margin-bottom: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Calligrafisk G — tegner seg som håndskrift ── */
.gm-draw-g {
  width: 150px;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 4px 12px rgba(255,107,71,0.18));
}

.gm-draw-g .gm-g-path {
  stroke: #FF6B47;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawG 1.5s ease-in-out forwards;
}

@keyframes drawG {
  to { stroke-dashoffset: 0; }
}

/* ── Wordmark: spasert store bokstaver ── */
.gm-wordmark {
  font-family: 'Nunito', 'Arial Rounded MT Bold', sans-serif;
  font-size: clamp(18px, 5vw, 22px);
  font-weight: 400;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #FF6B47;
  line-height: 1;
  margin: 18px 0 0 0;
  opacity: 0;
  animation: textFadeUp 0.7s ease forwards;
  animation-delay: 1.4s;
}

.gm-tagline {
  font-size: 13px;
  color: #B0A99F;
  letter-spacing: 0.06em;
  margin: 10px 0 0 0;
  opacity: 0;
  animation: textFadeUp 0.5s ease forwards;
  animation-delay: 1.9s;
}

@keyframes textFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Kort ── */
.gm-cards {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gm-card {
  background: #FFFFFF;
  border: 1px solid #E8E5E0;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30,30,46,0.07);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(14px);
  animation: cardIn 0.45s ease forwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.gm-card:nth-child(1) { animation-delay: 2.0s; }
.gm-card:nth-child(2) { animation-delay: 2.15s; }
.gm-card:nth-child(3) { animation-delay: 2.3s; }

@keyframes cardIn {
  to { opacity: 1; transform: translateY(0); }
}

.gm-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(255,107,71,0.12);
}

.gm-card-stripe {
  position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, #FF6B47, #FFB347);
  border-radius: 20px 20px 0 0;
}

.gm-fag-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.gm-fag-icon {
  width: 46px; height: 46px;
  background: linear-gradient(145deg, #FFE8E3, #FFF5F2);
  border-radius: 13px;
  border: 1.5px solid rgba(255,107,71,0.18);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.gm-fag-name {
  font-size: 17px; font-weight: 800;
  color: #1E1E2E; margin-bottom: 3px;
}

.gm-fag-meta {
  font-size: 13px; color: #9CA3AF;
}

.gm-btn {
  width: 100%; padding: 14px;
  border: none; border-radius: 999px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.gm-btn:hover  { transform: translateY(-2px); }
.gm-btn:active { transform: scale(0.98); }

.gm-btn-primary {
  background: #FF6B47; color: #fff;
  box-shadow: 0 4px 16px rgba(255,107,71,0.32);
}
.gm-btn-primary:hover { box-shadow: 0 8px 24px rgba(255,107,71,0.44); }

.gm-btn-ghost {
  background: transparent;
  color: #FF6B47;
  border: 2px solid #FF6B47;
}
.gm-btn-ghost:hover { background: #FFE8E3; }

.gm-install-btn {
  display: none; width: 100%; padding: 12px;
  background: #FFFFFF; border: 1px solid #E8E5E0;
  border-radius: 999px; cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 14px; font-weight: 600; color: #9CA3AF;
}

.gm-teacher-link {
  margin-top: 28px; text-align: center;
}
.gm-teacher-link a {
  font-size: 13px; font-weight: 600;
  color: #9CA3AF; text-decoration: none;
  border-bottom: 1px solid #E8E5E0; padding-bottom: 2px;
}
.gm-teacher-link a:hover { color: #6B7280; }

footer.gm-footer {
  margin-top: auto; padding-top: 48px;
  text-align: center;
  font-size: 12px; color: #C4C4C4;
}
footer.gm-footer a {
  color: #C4C4C4; text-decoration: none; margin: 0 6px;
}
footer.gm-footer a:hover { color: #9CA3AF; }
</style>
`;

/* SVG-ikoner */
const BOOK_SVG = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none">
  <path d="M6 4H14C15.1 4 16 4.9 16 6V26C13.5 24.5 10.5 24 8 24H6C4.9 24 4 23.1 4 22V6C4 4.9 4.9 4 6 4Z" stroke="#FF6B47" stroke-width="1.5" fill="rgba(255,107,71,0.08)"/>
  <path d="M26 4H18C16.9 4 16 4.9 16 6V26C18.5 24.5 21.5 24 24 24H26C27.1 24 28 23.1 28 22V6C28 4.9 27.1 4 26 4Z" stroke="#FFB347" stroke-width="1.5" fill="rgba(255,179,71,0.08)"/>
  <line x1="16" y1="6" x2="16" y2="26" stroke="#E85A38" stroke-width="1.5"/>
  <line x1="8" y1="11" x2="14" y2="11" stroke="#FF6B47" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  <line x1="8" y1="15" x2="13" y2="15" stroke="#FF6B47" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
  <line x1="18" y1="11" x2="24" y2="11" stroke="#FFB347" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  <line x1="18" y1="15" x2="23" y2="15" stroke="#FFB347" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
</svg>`;

export class Landing {
    static render() {
        const container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = `
            ${LOGO_CSS}
            <div class="gm-page">

                <!-- ── ANIMERT LOGO ── -->
                <header class="gm-hero">

                    <!-- Calligrafisk G tegner seg -->
                    <svg class="gm-draw-g" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path class="gm-g-path" pathLength="1"
                            d="M 156,52
                               C 138,24 100,16 68,30
                               C 36,44 20,74 20,104
                               C 20,140 42,168 74,178
                               C 106,188 140,174 156,150
                               C 164,134 162,114 152,104
                               L 100,104"
                        />
                    </svg>

                    <!-- GLOSEMESTER -->
                    <h1 class="gm-wordmark">GloseMester</h1>

                    <!-- Tagline -->
                    <p class="gm-tagline">Lær gloser &middot; Samle kort &middot; Bli mester</p>
                </header>

                <!-- ── FAGKORT ── -->
                <div class="gm-cards">

                    <div class="gm-card">
                        <div class="gm-card-stripe"></div>
                        <div class="gm-fag-row">
                            <div class="gm-fag-icon">${BOOK_SVG}</div>
                            <div>
                                <div class="gm-fag-name">GloseMester</div>
                                <div class="gm-fag-meta">Engelsk &middot; 4 nivåer &middot; 150+ samlekort</div>
                            </div>
                        </div>
                        <button id="start-glosemester-btn" class="gm-btn gm-btn-primary">
                            Start øving — gratis
                        </button>
                    </div>

                    <button id="pwa-install-btn" class="gm-install-btn">
                        Installer app
                    </button>
                </div>

                <!-- ── LÆRER-LENKE ── -->
                <div class="gm-teacher-link">
                    <a href="/for-laerere.html">Er du lærer? Se lærerdashboard →</a>
                </div>

                <!-- ── FOOTER ── -->
                <footer class="gm-footer">
                    <p style="margin:0 0 6px;">© 2026 GloseMester</p>
                    <p style="margin:0;">
                        <a href="/personvern.html">Personvern</a>
                        <a href="/vilkar.html">Vilkår</a>
                        <a href="/om-oss.html">Om oss</a>
                    </p>
                </footer>

            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        document.getElementById('start-glosemester-btn')
            ?.addEventListener('click', async () => {
                try {
                    await visStartOvingModal();
                } catch { /* avbrøt */ }
                router.push(ROUTES.GLOSEMESTER);
            });
    }
}

window.Landing = Landing;
