// ============================================
// AUTH.JS - GloseMester v1.0
// Håndterer innlogging, utlogging og UI-bytte
// ============================================

// 1. Vi importerer verktøyene vi lagde i firebase.js
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from '../core/cloud/firebase.js';

console.log('🔐 Auth-modul laster...');

// 2. Hent referanser til HTML-boksene vi lagde i index.html
const loginSection = document.getElementById('auth-login-section'); // "Logg inn"-boksen
const teacherUi = document.getElementById('teacher-ui');           // Selve dashboardet
const userNameDisplay = document.getElementById('user-name');      // Der navnet skal stå

// 3. Gjør funksjonene tilgjengelige for HTML (window)
// Siden dette er en modul, er funksjoner normalt skjult. Vi må "henge dem på vinduet".

window.loggInn = async () => {
    try {
        console.log('Forsøker Google-innlogging...');
        await signInWithPopup(auth, googleProvider);
        // Vi trenger ikke gjøre noe mer her, "onAuthStateChanged" under tar seg av resten
    } catch (error) {
        console.error("Innlogging feilet:", error);
        alert("Innlogging feilet: " + error.message);
    }
};

window.loggUt = async () => {
    if(confirm("Er du sikker på at du vil logge ut?")) {
        try {
            await signOut(auth);
            console.log('Logget ut.');
            // Vi reloader siden for å være sikker på at minnet tømmes helt
            window.location.reload(); 
        } catch (error) {
            console.error("Utlogging feilet:", error);
        }
    }
};

// 4. Lytter: Denne kjører HVER gang status endres (når du refresher, logger inn, eller logger ut)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // === HVIS LOGGET INN ===
        console.log("👤 Lærer identifisert:", user.email);
        
        // Skjul login-knappen, vis dashboardet
        if(loginSection) loginSection.style.display = 'none';
        if(teacherUi) teacherUi.style.display = 'block';
        
        // Vis navnet til læreren
        if(userNameDisplay) userNameDisplay.innerText = user.displayName || 'Lærer';

        // Last inn biblioteket (fra teacher.js)
        // Vi sjekker om funksjonen finnes før vi kaller den
        if (typeof window.oppdaterBibliotekVisning === 'function') {
            console.log("☁️ Henter data fra skyen...");
            await window.oppdaterBibliotekVisning();
        }

    } else {
        // === HVIS IKKE LOGGET INN ===
        console.log("👤 Ingen bruker logget inn (Gjest)");

        // Vis login-knappen, skjul dashboardet
        if(loginSection) loginSection.style.display = 'block';
        if(teacherUi) teacherUi.style.display = 'none';
        
        // Tøm navnet
        if(userNameDisplay) userNameDisplay.innerText = '';
        
        // (Valgfritt) Vi kan vise lokale prøver hvis vi vil, 
        // men vanligvis skjuler vi alt når læreren er logget ut.
    }
});