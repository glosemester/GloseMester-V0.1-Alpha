/* ============================================
   AUTH-SERVICE.JS - GloseMester v2.6
   Google sign-in + Feide OAuth for lærere
   ============================================ */

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
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
export function visLoginModal(melding = null) {
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

                <div style="font-size: 56px; margin-bottom: 12px;">🎓</div>
                <h2 style="font-family: 'Outfit', system-ui; font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #1F2937;">
                    Logg inn som lærer
                </h2>
                ${melding ? `<p style="color:#666;font-size:14px;margin-bottom:16px;">${melding}</p>` : ''}
                <p style="color: #6B7280; font-size: 15px; margin-bottom: 28px;">
                    Logg inn for å lage prøver, se resultater og dele med elever.
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
        googleBtn.onmouseenter = () => googleBtn.style.borderColor = '#7C3AED';
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

        // Feide sign-in (redirect til Netlify function)
        feideBtn.onclick = () => {
            // Lagre nåværende sti for redirect tilbake
            sessionStorage.setItem('feide_redirect_after_login', window.location.hash || '/');
            window.location.href = '/.netlify/functions/feide-auth?redirect=' + encodeURIComponent(window.location.origin + '/index-v2.html');
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

export { auth, onAuthStateChanged };
