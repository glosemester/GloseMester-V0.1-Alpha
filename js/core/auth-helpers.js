/* ============================================
   AUTH-HELPERS.JS - Autentiseringshjelpere
   Versjon: 1.0.0
   Dato: 16. januar 2026
   ============================================ */

import { auth, db } from '../features/firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Sjekker om nåværende bruker er admin
 * @returns {Promise<boolean>}
 */
export async function erAdmin() {
    const user = auth.currentUser;

    if (!user) {
        return false;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return false;
        }

        const userData = userSnap.data();
        return userData.rolle === 'admin';

    } catch (error) {
        console.error('Feil ved admin-sjekk:', error);
        return false;
    }
}

/**
 * Sjekker om en spesifikk bruker-ID er admin
 * @param {string} uid - Bruker-ID
 * @returns {Promise<boolean>}
 */
export async function erBrukerAdmin(uid) {
    if (!uid) {
        return false;
    }

    try {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return false;
        }

        const userData = userSnap.data();
        return userData.rolle === 'admin';

    } catch (error) {
        console.error('Feil ved admin-sjekk for bruker', uid, ':', error);
        return false;
    }
}

/**
 * Henter brukerens rolle
 * @returns {Promise<string>} - 'admin', 'laerer', 'elev', eller 'ukjent'
 */
export async function hentBrukerRolle() {
    const user = auth.currentUser;

    if (!user) {
        return 'ukjent';
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return 'ukjent';
        }

        const userData = userSnap.data();
        return userData.rolle || 'laerer'; // Default til lærer hvis ikke satt

    } catch (error) {
        console.error('Feil ved henting av brukerrolle:', error);
        return 'ukjent';
    }
}

/**
 * Sjekker om bruker har en spesifikk rolle
 * @param {string} requiredRole - Påkrevd rolle ('admin', 'laerer', etc.)
 * @returns {Promise<boolean>}
 */
export async function harRolle(requiredRole) {
    const rolle = await hentBrukerRolle();
    return rolle === requiredRole;
}

/**
 * Beskytter en funksjon - krever at bruker er admin
 * Returnerer false og viser feilmelding hvis ikke admin
 * @param {Function} callback - Funksjon å kjøre hvis admin
 * @param {string} feilmelding - Valgfri feilmelding
 * @returns {Promise<boolean>} - True hvis admin og callback kjørte, false ellers
 */
export async function kreverAdmin(callback, feilmelding = 'Denne funksjonen krever admin-tilgang.') {
    const isAdmin = await erAdmin();

    if (!isAdmin) {
        console.warn('⛔ Admin-tilgang påkrevd');
        alert(feilmelding);
        return false;
    }

    if (typeof callback === 'function') {
        await callback();
    }

    return true;
}

/**
 * Viser admin-meny hvis bruker er admin
 */
export async function visAdminMenyHvisAdmin() {
    const isAdmin = await erAdmin();

    const adminBtn = document.getElementById('btn-admin-panel');
    if (adminBtn) {
        adminBtn.style.display = isAdmin ? 'block' : 'none';
    }

    return isAdmin;
}

// Eksporter alt
export default {
    erAdmin,
    erBrukerAdmin,
    hentBrukerRolle,
    harRolle,
    kreverAdmin,
    visAdminMenyHvisAdmin
};
