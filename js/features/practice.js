// ============================================
// PRACTICE.JS - GloseMester v0.1-ALPHA
// Øvingsmodus (selvstendig trening)
// ============================================

/**
 * Sett språkretning for øving
 * @param {string} retning - 'en' (skriv engelsk) eller 'no' (skriv norsk)
 */
function settSprakRetning(retning) {
    ovingRetning = retning;
    document.getElementById('lang-en').classList.toggle('active', retning === 'en');
    document.getElementById('lang-no').classList.toggle('active', retning === 'no');
    
    console.log('🌐 Øvingsspråk satt til:', retning === 'en' ? 'Engelsk' : 'Norsk');
}

/**
 * Start øvingsmodus med valgt trinn
 * @param {string} trinn - '1-2', '3-4' eller '5-7'
 */
function startOving(trinn) {
    if (vokabularData[trinn]) {
        ovingOrdliste = [...vokabularData[trinn]];
    } else {
        ovingOrdliste = [{s:"Feil", e:"Error"}];
    }
    
    // Bland ordlisten
    ovingOrdliste.sort(() => Math.random() - 0.5);
    ovingIndex = 0;
    
    // Last inn credits hvis ikke gjort
    if (!credits && typeof loadUserData === 'function') {
        loadUserData();
    }
    
    // Sett tittel
    let tittel = "";
    if (trinn === "1-2") tittel = "1. - 2. Trinn";
    else if (trinn === "3-4") tittel = "3. - 4. Trinn";
    else if (trinn === "5-7") tittel = "5. - 7. Trinn";
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Øving', 'Start', trinn);
    }
    
    document.getElementById('oving-tittel').innerText = tittel;
    document.getElementById('oving-omraade').style.display = 'block';
    document.getElementById('oving-score').innerText = "0";
    document.getElementById('oving-progress').style.width = "0%";
    
    visNesteOvingSporsmaal();
    
    console.log('✅ Øving startet:', trinn, '-', ovingOrdliste.length, 'ord');
}

/**
 * Vis neste øvingsspørsmål
 */
function visNesteOvingSporsmaal() {
    // Hvis vi er ferdig med listen, bland på nytt
    if (ovingIndex >= ovingOrdliste.length) {
        ovingOrdliste.sort(() => Math.random() - 0.5);
        ovingIndex = 0;
    }
    
    const ord = ovingOrdliste[ovingIndex];
    
    // Spørsmål og placeholder basert på retning
    const spmTekst = (ovingRetning === 'en') ? ord.s : ord.e;
    const placeholder = (ovingRetning === 'en') ? "Skriv på engelsk..." : "Skriv på norsk...";

    document.getElementById('oving-spm').innerText = spmTekst;
    document.getElementById('oving-svar').placeholder = placeholder;
    document.getElementById('oving-svar').value = "";
    document.getElementById('oving-feedback').innerText = "";
    document.getElementById('oving-svar').focus();
}

/**
 * Les opp øvingsspørsmål
 */
function lesOppOving() {
    const ord = ovingOrdliste[ovingIndex];
    
    if (typeof lesOpp === 'function') {
        if (ovingRetning === 'en') {
            lesOpp(ord.s, 'nb-NO'); // Les opp norsk
        } else {
            lesOpp(ord.e, 'en-US'); // Les opp engelsk
        }
    }
}

/**
 * Sjekk svar i øvingsmodus
 */
async function sjekkOvingSvar() {
    const input = document.getElementById('oving-svar').value.trim().toLowerCase();
    const ord = ovingOrdliste[ovingIndex];
    
    // Fasit basert på retning
    const fasit = (ovingRetning === 'en') ? ord.e.toLowerCase() : ord.s.toLowerCase();

    if (input === fasit) {
        document.getElementById('oving-feedback').style.color = "#34c759";
        document.getElementById('oving-feedback').innerText = "Riktig! ✅";
        
        // Legg til poeng
        if (typeof addCorrectAnswerPoint === 'function') {
            addCorrectAnswerPoint();
        }

        // Oppdater streak
        let currentStreak = parseInt(document.getElementById('oving-score').innerText) + 1;
        
        // Gi kort hver 10. gang
        if (currentStreak >= 10) {
            await hentTilfeldigKort();
            currentStreak = 0;
        }
        
        document.getElementById('oving-score').innerText = currentStreak;
        document.getElementById('oving-progress').style.width = (currentStreak * 10) + "%";

        ovingIndex++;
        setTimeout(visNesteOvingSporsmaal, 1000);
        
    } else {
        // Vis feilmelding
        if (typeof visFeilMelding === 'function') {
            visFeilMelding(fasit);
        } else {
            document.getElementById('oving-feedback').style.color = "#ff3b30";
            document.getElementById('oving-feedback').innerText = `Feil! Riktig: ${fasit}`;
        }
        
        ovingIndex++;
        setTimeout(visNesteOvingSporsmaal, 3000);
    }
}

/**
 * Hent tilfeldig kort fra en TILFELDIG kategori
 */
async function hentTilfeldigKort() {
    try {
        // 1. Vi vil alltid ha en tilfeldig kategori når man vinner
        const kategorier = ['biler', 'guder', 'dinosaurer', 'dyr'];
        const gevinstKategori = kategorier[Math.floor(Math.random() * kategorier.length)];
        
        console.log('🎰 Trekker gevinst fra kategori:', gevinstKategori);

        const kategoriKort = kortSamling[gevinstKategori];
        
        if (!kategoriKort || kategoriKort.length === 0) {
            console.error('❌ Ingen kort i kategori:', gevinstKategori);
            return;
        }
        
        // Bestem rarity (samme system som før)
        let rarity = "vanlig";
        const rand = Math.random() * 100;
        
        if (rand > 98) rarity = "legendary";
        else if (rand > 85) rarity = "episk";
        else if (rand > 60) rarity = "sjelden";
        
        // Filtrer kort basert på rarity i den tilfeldige kategorien
        const muligeKort = kategoriKort.filter(k => 
            k.rarity.type === rarity
        );
        
        // Hvis ingen kort med denne rarity, ta et tilfeldig fra samme kategori
        const tilfeldigKort = muligeKort.length > 0
            ? muligeKort[Math.floor(Math.random() * muligeKort.length)]
            : kategoriKort[Math.floor(Math.random() * kategoriKort.length)];
        
        // Lagre kort
        if (typeof lagreBrukerKort === 'function') {
            lagreBrukerKort(tilfeldigKort);
        }
        
        // Vis gevinst-popup
        if (typeof visGevinstPopup === 'function') {
            visGevinstPopup(tilfeldigKort);
        }
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Kort', 'Vunnet', `${tilfeldigKort.kategori} - ${tilfeldigKort.rarity.type}`);
        }
        
        console.log('🎴 Kort vunnet:', tilfeldigKort.navn, '-', tilfeldigKort.rarity.tekst);
        
    } catch (e) {
        console.error('❌ Feil ved henting av kort:', e);
    }
}

/**
 * Vis øvingssamling (kort vunnet under øving)
 */
function visOvingSamling() {
    const samling = getSamling();
    
    if (typeof visKortGrid === 'function') {
        visKortGrid('oving-samling-liste', samling, true);
    }
}

console.log('💪 practice.js lastet');