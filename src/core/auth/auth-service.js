/* ============================================
   AUTH-SERVICE.JS - GloseMester v2.6
   Google sign-in + Feide OAuth for lærere og elever
   ============================================ */

// Hjelper: er appen åpen som native Android/iOS-app?
function erNativ() {
    return !!(window.Capacitor?.isNativePlatform?.());
}

// Lytter på dype lenker (no.glosemester.app://auth?...) etter Feide-innlogging på mobil.
// Kalles én gang ved oppstart av appen.
export function initMobilFeideCallback() {
    if (!erNativ()) return;
    const { App } = window.Capacitor.Plugins;
    if (!App) return;
    App.addListener('appUrlOpen', async (data) => {
        try {
            const url = new URL(data.url);
            if (url.protocol !== 'no.glosemester.app:') return;
            const token = url.searchParams.get('token');
            const rolle = url.searchParams.get('rolle');
            const navn = url.searchParams.get('navn');
            const feil = url.searchParams.get('error');
            if (feil) {
                console.error('Feide-innlogging feilet:', feil);
                document.dispatchEvent(new CustomEvent('feide-innlogging-feil', { detail: { feil } }));
                return;
            }
            if (!token) return;
            const result = await signInWithCustomToken(auth, token);
            const bruker = result.user;
            const brukerData = await hentBrukerData(bruker.uid) || {};
            document.dispatchEvent(new CustomEvent('feide-innlogging-ok', {
                detail: { user: bruker, userData: brukerData, rolle, navn }
            }));
        } catch (err) {
            console.error('Feil ved mobil Feide-callback:', err);
        }
    });
}

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signInWithCustomToken,
    signOut,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from './firebase-config.js';

// ============================================
// GOOGLE SIGN-IN
// ============================================

/**
 * Logg inn med Google
 * @returns {Promise<{user, userData}>}
 */
export async function loggInnMedGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userData = await hentEllerOpprettBruker(user);
    return { user, userData };
}

/**
 * Logg ut
 */
export async function loggUt() {
    await signOut(auth);
    window.MesterSuite.bruker = null;
    window.MesterSuite.aktivRolle = null;
}

// ============================================
// BRUKERDATA
// ============================================

/**
 * Hent eksisterende bruker, eller opprett ny i Firestore
 */
async function hentEllerOpprettBruker(user) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        return snap.data();
    }

    // Ny bruker — opprett med standardrolle lærer
    const nyBruker = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Lærer',
        photoURL: user.photoURL || null,
        rolle: 'laerer',
        abonnement: { type: 'free' },
        opprettetDato: serverTimestamp()
    };

    await setDoc(userRef, nyBruker);
    return nyBruker;
}

/**
 * Hent brukerdata fra Firestore
 */
export async function hentBrukerData(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
}

// ============================================
// AUTH-MODAL UI
// ============================================

/**
 * Vis påloggingsmodal for lærere og returnerer et Promise
 * som løser seg når brukeren er innlogget.
 * @returns {Promise<{user, userData}>}
 */
export function visLoginModal(melding = null, rolle = 'laerer') {
    return new Promise((resolve, reject) => {
        // Fjern evt. eksisterende modal
        document.getElementById('auth-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.55);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 24px;
                padding: 40px 32px;
                max-width: 420px;
                width: 92%;
                box-shadow: 0 24px 60px rgba(0,0,0,0.18);
                text-align: center;
                position: relative;
            ">
                <button id="auth-close-btn" style="
                    position: absolute; top: 16px; right: 16px;
                    background: none; border: none; font-size: 22px;
                    cursor: pointer; color: #999; line-height: 1;
                " aria-label="Lukk">✕</button>

                <div style="font-size: 56px; margin-bottom: 12px;">${rolle === 'laerer' ? '🎓' : '📚'}</div>
                <h2 style="font-family: 'Nunito', system-ui; font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #1E1E2E;">
                    ${rolle === 'laerer' ? 'Logg inn som lærer' : 'Logg inn'}
                </h2>
                ${melding ? `<p style="color:#666;font-size:14px;margin-bottom:16px;">${melding}</p>` : ''}
                <p style="color: #6B7280; font-size: 15px; margin-bottom: 28px;">
                    ${rolle === 'laerer'
                        ? 'Logg inn for å lage prøver, se resultater og dele med elever.'
                        : 'Logg inn for å lagre fremgang, XP og samlekort.'}
                </p>

                <!-- Feide (primær) -->
                <button id="feide-login-btn" style="
                    width: 100%; padding: 14px 20px;
                    background: #1c4b82; border: none;
                    border-radius: 14px; font-size: 16px; font-weight: 700;
                    cursor: pointer; color: white; display: flex;
                    align-items: center; justify-content: center; gap: 12px;
                    transition: all 0.2s; box-shadow: 0 4px 14px rgba(28,75,130,0.35);
                ">
                    🏫 Logg inn med Feide
                </button>

                <div style="margin: 16px 0; display: flex; align-items: center; gap: 12px; color: #9CA3AF; font-size: 13px;">
                    <div style="flex:1; height:1px; background:#e5e7eb;"></div>
                    eller
                    <div style="flex:1; height:1px; background:#e5e7eb;"></div>
                </div>

                <!-- Google -->
                <button id="google-login-btn" style="
                    width: 100%; padding: 14px 20px;
                    background: #fff; border: 2px solid #e5e7eb;
                    border-radius: 14px; font-size: 15px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
                    transition: all 0.2s; color: #1F2937;
                ">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" height="22" alt="Google" />
                    Fortsett med Google
                </button>

                <p id="auth-feil" style="color:#ef4444;font-size:13px;margin-top:16px;display:none;"></p>

                <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
                    For elever: ingen pålogging nødvendig — bruk prøvekoden fra læreren.
                </p>
            </div>
        `;

        document.body.appendChild(modal);

        // Hover-effekter
        const googleBtn = modal.querySelector('#google-login-btn');
        const feideBtn = modal.querySelector('#feide-login-btn');
        feideBtn.onmouseenter = () => { feideBtn.style.background = '#163d6a'; feideBtn.style.boxShadow = '0 6px 20px rgba(28,75,130,0.5)'; };
        feideBtn.onmouseleave = () => { feideBtn.style.background = '#1c4b82'; feideBtn.style.boxShadow = '0 4px 14px rgba(28,75,130,0.35)'; };
        googleBtn.onmouseenter = () => googleBtn.style.borderColor = '#FF6B47';
        googleBtn.onmouseleave = () => googleBtn.style.borderColor = '#e5e7eb';

        // Lukk
        modal.querySelector('#auth-close-btn').onclick = () => {
            modal.remove();
            reject(new Error('Avbrutt'));
        };
        modal.onclick = (e) => { if (e.target === modal) { modal.remove(); reject(new Error('Avbrutt')); } };

        // Google sign-in
        googleBtn.onclick = async () => {
            googleBtn.disabled = true;
            googleBtn.textContent = 'Logger inn…';
            try {
                const result = await loggInnMedGoogle();
                modal.remove();
                resolve(result);
            } catch (err) {
                const feilEl = modal.querySelector('#auth-feil');
                feilEl.textContent = err.code === 'auth/popup-closed-by-user'
                    ? 'Innlogging avbrutt.'
                    : 'Innlogging feilet. Prøv igjen.';
                feilEl.style.display = 'block';
                googleBtn.disabled = false;
                googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" height="22" alt="Google" /> Fortsett med Google';
            }
        };

        // Feide sign-in
        feideBtn.onclick = async () => {
            const scope = 'openid userid-feide email userinfo-name groups-org groups-edu';

            if (erNativ()) {
                // Android: åpne Feide i Chrome Custom Tab, callback går via Netlify-funksjon
                const redirectUri = 'https://glosemester.no/.netlify/functions/feide-mobile-auth';
                const authUrl =
                    `https://auth.dataporten.no/oauth/authorization` +
                    `?client_id=82131d17-cccd-48da-8397-4e9d70434d4d` +
                    `&response_type=code` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&scope=${encodeURIComponent(scope)}`;
                const { Browser } = window.Capacitor.Plugins;
                await Browser.open({ url: authUrl, windowName: '_self' });
            } else {
                // Web: vanlig redirect i nettleseren
                const redirectUri = window.location.origin + '/';
                const authUrl =
                    `https://auth.dataporten.no/oauth/authorization` +
                    `?client_id=82131d17-cccd-48da-8397-4e9d70434d4d` +
                    `&response_type=code` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&scope=${encodeURIComponent(scope)}`;
                sessionStorage.setItem('feideLoginProcess', 'true');
                window.location.href = authUrl;
            }
        };
    });
}

/**
 * Sjekk om bruker er innlogget, ellers vis login-modal
 * @returns {Promise<{user, userData}|null>}
 */
export async function krevInnlogging(melding = null) {
    if (auth.currentUser) {
        const userData = await hentBrukerData(auth.currentUser.uid);
        return { user: auth.currentUser, userData };
    }
    return visLoginModal(melding);
}

/**
 * Håndter Feide OAuth callback — kall tidlig ved oppstart.
 * Feide redirecter tilbake til https://glosemester.no/?code=... etter autentisering.
 * Koden POSTes til Netlify-funksjonen som returnerer et Firebase custom token.
 * @returns {Promise<{user, userData}|null>} null hvis ikke en Feide-callback
 */
export async function handleFeideCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code  = urlParams.get('code');
    const error = urlParams.get('error');
    const isFeideProcess = sessionStorage.getItem('feideLoginProcess');

    if (error) {
        sessionStorage.removeItem('feideLoginProcess');
        history.replaceState({}, '', '/');
        if (error === 'access_denied') throw new Error('Feide-innlogging avbrutt.');
        throw new Error(`Feide-innlogging feilet: ${error}`);
    }

    if (!code || !isFeideProcess) return null;

    // Rydd URL umiddelbart
    history.replaceState({}, '', '/');
    sessionStorage.removeItem('feideLoginProcess');

    const redirectUri = window.location.origin + '/';
    const response = await fetch('/.netlify/functions/feide-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error('Feide-innlogging er kun for lærere.');
        throw new Error(data.error || 'Feide-innlogging feilet. Prøv igjen.');
    }

    const { token } = await response.json();
    const result = await signInWithCustomToken(auth, token);
    const user = result.user;
    const userData = await hentBrukerData(user.uid) || {};
    return { user, userData };
}

/**
 * Vis "Start øving"-modal: Feide-innlogging eller fortsett som gjest.
 * @returns {Promise<{user, userData}|null>} null = gjest, objekt = innlogget
 */
export function visStartOvingModal() {
    return new Promise((resolve, reject) => {
        document.getElementById('start-oving-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'start-oving-modal';
        modal.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.55);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 24px;
                padding: 36px 28px 28px;
                max-width: 380px;
                width: 92%;
                box-shadow: 0 24px 60px rgba(0,0,0,0.18);
                text-align: center;
                position: relative;
                font-family: 'Nunito', system-ui, sans-serif;
            ">
                <button id="so-close-btn" style="
                    position: absolute; top: 14px; right: 14px;
                    background: none; border: none; font-size: 20px;
                    cursor: pointer; color: #bbb; line-height: 1;
                " aria-label="Lukk">✕</button>

                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style="margin: 0 auto 14px; display:block;">
                    <rect width="52" height="52" rx="16" fill="#FFE8E3"/>
                    <path d="M14 14H24C24.55 14 25 14.45 25 15V37C22.9 35.8 20.4 35.5 18 35.5H14C13.45 35.5 13 35.05 13 34.5V15C13 14.45 13.45 14 14 14Z" stroke="#FF6B47" stroke-width="1.6" fill="rgba(255,107,71,0.08)"/>
                    <path d="M38 14H28C27.45 14 27 14.45 27 15V37C29.1 35.8 31.6 35.5 34 35.5H38C38.55 35.5 39 35.05 39 34.5V15C39 14.45 38.55 14 38 14Z" stroke="#FFB347" stroke-width="1.6" fill="rgba(255,179,71,0.08)"/>
                    <line x1="25" y1="15" x2="25" y2="37" stroke="#E85A38" stroke-width="1.5"/>
                </svg>

                <h2 style="font-size: 22px; font-weight: 800; color: #1E1E2E; margin: 0 0 8px;">Klar til å øve?</h2>
                <p style="font-size: 14px; color: #6B7280; margin: 0 0 24px; line-height: 1.5;">
                    Logg inn for å lagre fremgang og XP,<br>eller øv gratis som gjest.
                </p>

                <button id="so-feide-btn" style="
                    width: 100%; padding: 14px 20px;
                    background: #1c4b82; border: none;
                    border-radius: 14px; font-size: 15px; font-weight: 700;
                    cursor: pointer; color: white; display: flex;
                    align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; box-shadow: 0 4px 14px rgba(28,75,130,0.35);
                    font-family: 'Nunito', system-ui, sans-serif;
                    margin-bottom: 10px;
                ">
                    🏫 Logg inn med Feide
                </button>

                <button id="so-gjest-btn" style="
                    width: 100%; padding: 13px 20px;
                    background: transparent;
                    border: 2px solid #FF6B47;
                    border-radius: 14px; font-size: 15px; font-weight: 700;
                    cursor: pointer; color: #FF6B47;
                    transition: all 0.2s;
                    font-family: 'Nunito', system-ui, sans-serif;
                ">
                    Fortsett som gjest
                </button>

                <p id="so-feil" style="color:#ef4444;font-size:13px;margin-top:14px;display:none;"></p>
            </div>
        `;

        document.body.appendChild(modal);

        const feideBtn = modal.querySelector('#so-feide-btn');
        const gjestBtn = modal.querySelector('#so-gjest-btn');

        feideBtn.onmouseenter = () => { feideBtn.style.background = '#163d6a'; };
        feideBtn.onmouseleave = () => { feideBtn.style.background = '#1c4b82'; };
        gjestBtn.onmouseenter = () => { gjestBtn.style.background = '#FFE8E3'; };
        gjestBtn.onmouseleave = () => { gjestBtn.style.background = 'transparent'; };

        modal.querySelector('#so-close-btn').onclick = () => {
            modal.remove();
            reject(new Error('Avbrutt'));
        };
        modal.onclick = (e) => { if (e.target === modal) { modal.remove(); reject(new Error('Avbrutt')); } };

        feideBtn.onclick = async () => {
            const scope = 'openid userid-feide email userinfo-name groups-org groups-edu';
            if (erNativ()) {
                const redirectUri = 'https://glosemester.no/.netlify/functions/feide-mobile-auth';
                const authUrl =
                    `https://auth.dataporten.no/oauth/authorization` +
                    `?client_id=82131d17-cccd-48da-8397-4e9d70434d4d` +
                    `&response_type=code` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&scope=${encodeURIComponent(scope)}`;
                const { Browser } = window.Capacitor.Plugins;
                await Browser.open({ url: authUrl, windowName: '_self' });
            } else {
                const redirectUri = window.location.origin + '/';
                const authUrl =
                    `https://auth.dataporten.no/oauth/authorization` +
                    `?client_id=82131d17-cccd-48da-8397-4e9d70434d4d` +
                    `&response_type=code` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&scope=${encodeURIComponent(scope)}`;
                sessionStorage.setItem('feideLoginProcess', 'true');
                window.location.href = authUrl;
            }
        };

        gjestBtn.onclick = () => {
            modal.remove();
            resolve(null);
        };
    });
}

export { auth, onAuthStateChanged };
