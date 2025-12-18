// ============================================
// NAVIGATION.JS - GloseMester v1.0 (Module)
// ============================================

// Hjelpefunksjon: Nullstill visning
function resetVisning() {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    ['elev-meny', 'laerer-meny', 'oving-meny'].forEach(id => {
        const meny = document.getElementById(id);
        if(meny) meny.style.display = 'none';
    });
    window.scrollTo(0, 0);
}

export function velgRolle(rolle) {
    resetVisning();
    window.aktivRolle = rolle;
    console.log("Bytter rolle til:", rolle);

    if (rolle === 'oving') {
        document.getElementById('oving-meny').style.display = 'flex';
        visSide('oving-start');
    } 
    else if (rolle === 'kode') { // Elev som velger "Har kode"
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-dashboard');
    }
    else if (rolle === 'laerer') {
        document.getElementById('laerer-meny').style.display = 'flex';
        // Personvern-samtykke kan kreves før lærerportal åpnes
        if (typeof window.openTeacherPortal === 'function') {
            window.openTeacherPortal();
        } else {
            visSide('laerer-dashboard');
        }
    }
}

export function tilbakeTilStart() {
    resetVisning();
    window.aktivRolle = "";
    const landing = document.getElementById('landing-page');
    if(landing) {
        landing.style.display = 'block';
        setTimeout(() => landing.classList.add('active'), 10);
    }
}

export function visSide(sideId) {
    // Skjul alle sider først (men behold menyen)
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });

    const side = document.getElementById(sideId);
    if (side) {
        side.style.display = 'block';
        setTimeout(() => side.classList.add('active'), 10);
    } else {
        console.error(`[visSide] Fant ikke side med id="${sideId}". Faller tilbake til landing.`);
        // Fallback til landing-page (som ikke nødvendigvis er .page)
        const landing = document.getElementById('landing-page');
        if (landing) {
            landing.style.display = 'block';
            setTimeout(() => landing.classList.add('active'), 10);
        }
    }

    // Oppdater aktiv knapp i menyen
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    const aktivKnapp = document.querySelector(`nav button[onclick*="${sideId}"]`);
    if (aktivKnapp) aktivKnapp.classList.add('active');
}

export function velgKategori(kategori) {
    window.valgtKategori = kategori;
    if(typeof window.visSamling === 'function') {
        window.visSamling();
    } else if(typeof window.visOvingSamling === 'function') {
        window.visOvingSamling();
    }
}