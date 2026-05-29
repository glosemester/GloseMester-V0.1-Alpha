/* ============================================
   FAGVELGER — Startsiden i appen (utlogget)
   Animert logo-header, ingen emoji
   ============================================ */

import { router, ROUTES } from '../core/navigation/router.js';
import { visLoginModal } from '../core/auth/auth-service.js';

/* SVG-ikoner (ingen emoji) */
const ICON_BOOK = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 6C4 4.9 4.9 4 6 4H14C15.1 4 16 4.9 16 6V26C16 26 13 24 10 24H6C4.9 24 4 23.1 4 22V6Z" fill="#FF6B47" opacity="0.15"/>
  <path d="M28 6C28 4.9 27.1 4 26 4H18C16.9 4 16 4.9 16 6V26C16 26 19 24 22 24H26C27.1 24 28 23.1 28 22V6Z" fill="#FF6B47" opacity="0.25"/>
  <path d="M6 4H14C15.1 4 16 4.9 16 6V26C13.5 24.5 10.5 24 8 24H6C4.9 24 4 23.1 4 22V6C4 4.9 4.9 4 6 4Z" stroke="#FF6B47" stroke-width="1.5" fill="none"/>
  <path d="M26 4H18C16.9 4 16 4.9 16 6V26C18.5 24.5 21.5 24 24 24H26C27.1 24 28 23.1 28 22V6C28 4.9 27.1 4 26 4Z" stroke="#FFB347" stroke-width="1.5" fill="none"/>
  <line x1="16" y1="6" x2="16" y2="26" stroke="#E85A38" stroke-width="1.5"/>
  <line x1="8" y1="10" x2="14" y2="10" stroke="#FF6B47" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
  <line x1="8" y1="14" x2="14" y2="14" stroke="#FF6B47" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
  <line x1="18" y1="10" x2="24" y2="10" stroke="#FFB347" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
  <line x1="18" y1="14" x2="24" y2="14" stroke="#FFB347" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
</svg>`;

const ICON_STAR = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 1L9.5 6H14.5L10.5 9L12 14L8 11L4 14L5.5 9L1.5 6H6.5L8 1Z" fill="#FFB347"/>
</svg>`;

const ICON_ROCKET = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C12 2 7 6 7 13H17C17 6 12 2 12 2Z" fill="white" fill-opacity="0.9"/>
  <path d="M9 13V16C9 17.1 9.9 18 11 18H13C14.1 18 15 17.1 15 16V13H9Z" fill="white" fill-opacity="0.7"/>
  <circle cx="12" cy="9" r="2" fill="#FFB347"/>
  <path d="M7 13C5.5 13 4 14.5 4 16L7 16V13Z" fill="white" fill-opacity="0.5"/>
  <path d="M17 13C18.5 13 20 14.5 20 16H17V13Z" fill="white" fill-opacity="0.5"/>
</svg>`;

const ICON_SCHOOL = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="currentColor" opacity="0.8"/>
  <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="currentColor" opacity="0.5"/>
</svg>`;

const LOGO_CSS = `
<style>
.gm-hero {
  text-align: center;
  margin-bottom: 44px;
  position: relative;
}

.gm-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px; height: 72px;
  background: linear-gradient(145deg, #FFF5F2, #FFEEE8);
  border-radius: 22px;
  border: 1.5px solid rgba(255,107,71,0.2);
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(255,107,71,0.15);
  animation: iconBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.gm-wordmark {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0;
  font-family: 'Nunito', 'Arial Rounded MT Bold', sans-serif;
  font-size: clamp(38px, 10vw, 56px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 6px;
}

.gm-word-glose {
  color: #FF6B47;
  display: inline-flex;
}

.gm-word-mester {
  color: #1E1E2E;
  display: inline-flex;
}

.gm-letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(24px);
  animation: letterUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--i) * 55ms + 200ms);
}

.gm-letter-drop {
  display: inline-block;
  opacity: 0;
  transform: translateY(-20px);
  animation: letterDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--i) * 55ms + 560ms);
}

.gm-underline-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  height: 3px;
}

.gm-underline {
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #FF6B47, #FFB347);
  border-radius: 999px;
  animation: lineGrow 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 1.05s;
}

.gm-tagline {
  font-size: 15px;
  color: #6B7280;
  margin: 0;
  letter-spacing: 0.01em;
  opacity: 0;
  animation: taglineFade 0.6s ease forwards;
  animation-delay: 1.2s;
}

@keyframes iconBounceIn {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes letterUp {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes letterDrop {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lineGrow {
  to { width: 120px; }
}

@keyframes taglineFade {
  to { opacity: 1; }
}

.gm-card {
  background: #FFFFFF;
  border: 1px solid #E8E5E0;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30,30,46,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  animation: cardFadeUp 0.5s ease forwards;
}

.gm-card:nth-child(1) { animation-delay: 1.3s; }
.gm-card:nth-child(2) { animation-delay: 1.45s; }
.gm-card:nth-child(3) { animation-delay: 1.6s; }

@keyframes cardFadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.gm-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255,107,71,0.14);
}

.gm-card-topbar {
  position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, #FF6B47, #FFB347);
  border-radius: 20px 20px 0 0;
}

.gm-btn-primary {
  width: 100%; padding: 14px;
  background: #FF6B47;
  color: white; border: none;
  border-radius: 999px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255,107,71,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.gm-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255,107,71,0.45);
}

.gm-btn-secondary {
  width: 100%; padding: 12px;
  background: transparent;
  color: #FF6B47;
  border: 2px solid #FF6B47;
  border-radius: 999px;
  font-family: 'Nunito', sans-serif;
  font-size: 14px; font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}
.gm-btn-secondary:hover { background: #FFE8E3; }

.gm-install-btn {
  display: none; width: 100%; padding: 12px;
  background: #FFFFFF;
  border: 1px solid #E8E5E0;
  border-radius: 999px;
  font-family: 'Nunito', sans-serif;
  font-size: 14px; font-weight: 600;
  color: #6B7280; cursor: pointer;
  transition: background 0.15s ease;
}
.gm-install-btn:hover { background: #F5F5F3; }
</style>
`;

export class Landing {
    static render() {
        const container = document.getElementById('app');
        if (!container) return;

        const gloseLetters = 'Glose'.split('').map((l, i) =>
            `<span class="gm-letter" style="--i:${i}">${l}</span>`
        ).join('');

        const mesterLetters = 'Mester'.split('').map((l, i) =>
            `<span class="gm-letter-drop" style="--i:${i}">${l}</span>`
        ).join('');

        container.innerHTML = `
            ${LOGO_CSS}
            <div style="
                min-height: 100vh;
                background: #FAFAF8;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 48px 20px 60px;
                font-family: 'Nunito', sans-serif;
            ">
                <!-- Animert logo-header -->
                <header class="gm-hero">
                    <div class="gm-icon-wrap">
                        ${ICON_BOOK}
                    </div>

                    <div class="gm-wordmark" aria-label="GloseMester">
                        <span class="gm-word-glose">${gloseLetters}</span>
                        <span class="gm-word-mester">${mesterLetters}</span>
                    </div>

                    <div class="gm-underline-wrap">
                        <div class="gm-underline"></div>
                    </div>

                    <p class="gm-tagline">Lær gloser · Samle kort · Bli mester</p>
                </header>

                <!-- Innhold -->
                <div style="width:100%; max-width:420px; display:flex; flex-direction:column; gap:14px;">

                    <!-- Fagkort -->
                    <div class="gm-card">
                        <div class="gm-card-topbar"></div>
                        <div style="display:flex; align-items:center; gap:16px; margin-bottom:18px;">
                            <div style="
                                width:48px; height:48px;
                                background: linear-gradient(145deg, #FFE8E3, #FFF5F2);
                                border-radius:14px;
                                border: 1.5px solid rgba(255,107,71,0.2);
                                display:flex; align-items:center; justify-content:center;
                                flex-shrink:0;
                            ">${ICON_BOOK}</div>
                            <div>
                                <div style="font-size:18px; font-weight:800; color:#1E1E2E; margin-bottom:3px;">GloseMester</div>
                                <div style="display:flex; align-items:center; gap:6px; font-size:13px; color:#6B7280;">
                                    ${ICON_STAR}
                                    Engelsk · 4 nivåer · 150+ samlekort
                                </div>
                            </div>
                        </div>
                        <button id="start-glosemester-btn" class="gm-btn-primary">
                            ${ICON_ROCKET}
                            Start øving — gratis
                        </button>
                    </div>

                    <!-- Logg inn -->
                    <div class="gm-card">
                        <p style="font-size:14px; color:#6B7280; margin:0 0 12px; text-align:center;">
                            Logg inn for å lagre fremgang og XP
                        </p>
                        <button id="logg-inn-btn" class="gm-btn-secondary">
                            Logg inn / Registrer
                        </button>
                    </div>

                    <!-- PWA install -->
                    <button id="pwa-install-btn" class="gm-install-btn">
                        Installer app
                    </button>
                </div>

                <!-- Lærer-lenke -->
                <div style="margin-top:32px; text-align:center;">
                    <a href="/for-laerere.html" style="
                        display:inline-flex; align-items:center; gap:6px;
                        font-size:13px; font-weight:600;
                        color:#6B7280; text-decoration:none;
                        border-bottom:1px solid #E8E5E0; padding-bottom:2px;
                    ">
                        ${ICON_SCHOOL}
                        Er du lærer? Se lærerdashboard →
                    </a>
                </div>

                <!-- Footer -->
                <footer style="margin-top:auto; padding-top:48px; text-align:center;">
                    <p style="font-size:12px; color:#9CA3AF; margin:0 0 6px;">© 2026 GloseMester</p>
                    <p style="font-size:12px; margin:0; display:flex; gap:12px; justify-content:center;">
                        <a href="/personvern.html" style="color:#9CA3AF; text-decoration:none;">Personvern</a>
                        <a href="/vilkar.html" style="color:#9CA3AF; text-decoration:none;">Vilkår</a>
                        <a href="/om-oss.html" style="color:#9CA3AF; text-decoration:none;">Om oss</a>
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
                    await visLoginModal(null, 'elev');
                    router.push(ROUTES.HJEM);
                } catch { /* avbrøt */ }
            });
    }
}

window.Landing = Landing;
