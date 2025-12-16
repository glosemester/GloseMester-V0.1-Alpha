/* ============================================
   NAVIGATION.JS - GloseMester v1.1 (STRENG VERSJON)
   Fikser problem med at sider legger seg oppå hverandre.
   ============================================ */

/**
 * Hjelpefunksjon: Nullstill HELE visningen (TVUNGET)
 */
function resetVisning() {
    console.log("🧹 Nullstiller visning - Skjuler alle sider");
    
    // 1. Gå gjennom ALLE sider og tving dem til å skjules
    const sider = document.querySelectorAll('.page');
    sider.forEach(side => {
        // Fjern active-klassen for CSS-animasjoner
        side.classList.remove('active');
        // VIKTIG: Tving skjuling med inline style for sikkerhets skyld
        side.style.display = 'none';
    });

    // 2. Skjul alle navigasjonsmenyer i bunnen
    ['elev-meny', 'laerer-meny', 'oving-meny'].forEach(id => {
        const meny = document.getElementById(id);
        if (meny) meny.style.display = 'none';
    });

    // 3. Scroll til toppen (fint på mobil)
    window.scrollTo(0, 0);
}

/**
 * Hovedfunksjon for å bytte rolle (Fra startsiden)
 */
export function velgRolle(rolle) {
    console.log("🔄 Bytter rolle til:", rolle);

    // STEG 1: SKJUL ALT GAMMELT FØRST!
    resetVisning();

    // Steg 2: Sett state
    window.aktivRolle = rolle;
    if (!window.brukerNavn) window.brukerNavn = "Spiller";

    // Steg 3: Vis riktig meny og startside basert på rolle
    if (rolle === 'kode') {
        window.aktivRolle = 'elev'; 
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-dashboard');
        
        // Oppdater UI hvis funksjonene finnes (trygg sjekk)
        if(typeof window.updateCreditUI === 'function') window.updateCreditUI();
        if(typeof window.visLagredeProver === 'function') window.visLagredeProver();
        
    } else if (rolle === 'oving') {
        document.getElementById('oving-meny').style.display = 'flex';
        visSide('oving-start');
        
        if(typeof window.updateCreditUI === 'function') window.updateCreditUI();

    } else if (rolle === 'laerer') {
        document.getElementById('laerer-meny').style.display = 'flex';
        visSide('laerer-dashboard');
    }
}

/**
 * Gå tilbake til start (Logg ut/Avslutt)
 */
export function tilbakeTilStart() {
    resetVisning();
    
    // Vis landing page eksplisitt
    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
        // Fjern tvungen 'none' og legg til 'active' klasse
        landingPage.style.display = ''; 
        landingPage.classList.add('active');
    }
    
    // Nullstill input-felter for en ren start
    document.querySelectorAll('input').forEach(i => i.value = "");
    window.aktivRolle = "";
    console.log('🏠 Tilbake til start');
}

/**
 * Naviger til en spesifikk underside (Navigering inni en rolle)
 */
export function visSide(sideId) {
    console.log("📱 Navigerer til side:", sideId);

    // 1. Skjul alle andre sider først!
    resetVisning();
    
    // 2. Finn den nye siden vi vil vise
    const side = document.getElementById(sideId);
    if (side) {
        // Fjern den tvungne 'display: none' style
        side.style.display = ''; 
        // Legg til active-klassen (som trigger CSS-animasjonen 'popIn')
        // Vi bruker en mikroskopisk timeout for å sikre at nettleseren rekker å oppfatte endringen
        setTimeout(() => {
             side.classList.add('active');
        }, 10);
       
    } else {
        console.error("❌ Fant ikke siden med ID:", sideId);
        return; // Stopp hvis siden ikke finnes
    }

    // 3. Sørg for at meny-knappen lyser opp
    oppdaterMenyVisning(sideId);

    // 4. Trigger data-lasting hvis nødvendig for den siden
    if (sideId === 'elev-samling' && typeof window.visSamling === 'function') window.visSamling();
    if (sideId === 'oving-samling' && typeof window.visOvingSamling === 'function') window.visOvingSamling();
    if (sideId === 'laerer-dashboard' && typeof window.lastInnMineProver === 'function') window.lastInnMineProver();
}

/**
 * Hjelpefunksjon: Oppdater hvilken menyknapp som er aktiv
 */
function oppdaterMenyVisning(sideId) {
    let menyId = "";
    // Finn ut hvilken meny som skal vises basert på rollen
    if (window.aktivRolle === 'elev') menyId = 'elev-meny';
    else if (window.aktivRolle === 'oving') menyId = 'oving-meny';
    else if (window.aktivRolle === 'laerer') menyId = 'laerer-meny';

    if (menyId) {
        const meny = document.getElementById(menyId);
        if (meny) {
            meny.style.display = 'flex'; // Sikre at menyen er synlig
            
            // Fjern 'active' fra alle knapper i denne menyen
            meny.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            
            // Finn knappen som matcher siden vi er på (f.eks "btn-oving-start") og gjør den aktiv
            const btn = document.getElementById('btn-' + sideId);
            if (btn) btn.classList.add('active');
        }
    }
}

// Håndterer kategori-valg i samlingene
export function velgKategori(kategori) {
    window.valgtKategori = kategori;
    // Oppdater UI på knappene
    document.querySelectorAll('.kategori-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.kategori === kategori);
    });
    
    // Oppdater listen basert på hvilken rolle vi er i
    if (window.aktivRolle === 'elev' && typeof window.visSamling === 'function') window.visSamling();
    if (window.aktivRolle === 'oving' && typeof window.visOvingSamling === 'function') window.visOvingSamling();
}