/* ============================================
   NAVIGATION.JS - Styrer sider og menyer
   ============================================ */
import { auth, signOut } from '../features/firebase.js';

export function visSide(sideId) {
    // 1. Skjul alle sider
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        // Skjul også evt. åpne video-elementer (QR)
        const video = document.getElementById('qr-video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    });

    // 2. Vis valgt side
    const target = document.getElementById(sideId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0,0);
    } else {
        console.warn(`Siden "${sideId}" finnes ikke i HTML.`);
        return;
    }

    // 3. HÅNDTER MENYER (Her ligger fiksen din)
    oppdaterMenyer(sideId);
}

function oppdaterMenyer(sideId) {
    const elevMeny = document.getElementById('elev-meny');
    const ovingMeny = document.getElementById('oving-meny');
    const laererMeny = document.getElementById('laerer-meny');

    // Nullstill: Skjul alle menyer først
    if(elevMeny) elevMeny.style.display = 'none';
    if(ovingMeny) ovingMeny.style.display = 'none';
    if(laererMeny) laererMeny.style.display = 'none';

    // Logikk: Hvilken meny hører til hvilke sider?
    
    // LÆRER SIDER
    if (['laerer-dashboard', 'lagrede-prover'].includes(sideId)) {
        if(laererMeny) laererMeny.style.display = 'flex';
    }
    
    // ELEV (KODE) SIDER
    else if (['elev-dashboard', 'prove-omraade', 'elev-samling'].includes(sideId)) {
        if(elevMeny) elevMeny.style.display = 'flex';
    }
    
    // ØVE SELV SIDER
    else if (['oving-start', 'oving-omraade', 'oving-samling'].includes(sideId)) {
        if(ovingMeny) ovingMeny.style.display = 'flex';
    }
}

export function velgRolle(rolle) {
    if (rolle === 'oving') {
        visSide('oving-start');
    } else if (rolle === 'kode') {
        visSide('elev-dashboard');
    } else if (rolle === 'laerer') {
        // Sjekk om bruker allerede er logget inn
        if (auth.currentUser) {
            visSide('laerer-dashboard');
        } else {
            // Vis login popup
            const popup = document.getElementById('laerer-login-popup');
            if(popup) popup.style.display = 'flex';
        }
    }
}

export function tilbakeTilStart() {
    // Logg ut hvis man er lærer (valgfritt, men ryddig)
    if (document.getElementById('laerer-dashboard').classList.contains('active')) {
        signOut(auth).catch(e => console.error(e));
    }
    visSide('landing-page');
}

export function velgKategori(kategori) {
    console.log("Valgt kategori:", kategori);
    // Placeholder for fremtidig logikk
}