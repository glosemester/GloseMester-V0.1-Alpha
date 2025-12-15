// ============================================
// PRACTICE.JS - GloseMester v0.1-ALPHA
// Øvingsmodus (selvstendig trening)
// ============================================

let valgtTrinn = ""; // Holder styr på hvilket trinn vi øver på

/**
 * Sett språkretning for øving
 * @param {string} retning - 'en' (skriv engelsk) eller 'no' (skriv norsk)
 */
function settSprakRetning(retning) {
    ovingRetning = retning;
    document.getElementById('lang-en').classList.toggle('active', retning === 'en');
    document.getElementById('lang-no').classList.toggle('active', retning === 'no');
    
    // Hvis vi er midt i en økt, oppdater visningen (bytt spørsmål/knapper)
    if (document.getElementById('oving-omraade').style.display === 'block') {
        visNesteOvingSporsmaal();
    }
    
    console.log('🌐 Øvingsspråk satt til:', retning === 'en' ? 'Engelsk' : 'Norsk');
}

/**
 * Start øvingsmodus med valgt trinn
 * @param {string} trinn - '1-2', '3-4' eller '5-7'
 */
function startOving(trinn) {
    valgtTrinn = trinn; // Lagre trinnet globalt
    
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
    if (trinn === "1-2") tittel = "1. - 2. Trinn (Flervalg)";
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
    
    // Nullstill UI
    document.getElementById('oving-feedback').innerText = "";
    
    visNesteOvingSporsmaal();
    
    console.log('✅ Øving startet:', trinn, '-', ovingOrdliste.length, 'ord');
}

/**
 * Vis neste øvingsspørsmål
 * Tilpasser UI basert på trinn (Knapper for 1-2, Tekst for 3-7)
 */
function visNesteOvingSporsmaal() {
    // Hvis vi er ferdig med listen, bland på nytt
    if (ovingIndex >= ovingOrdliste.length) {
        ovingOrdliste.sort(() => Math.random() - 0.5);
        ovingIndex = 0;
    }
    
    const ord = ovingOrdliste[ovingIndex];
    
    // Spørsmål tekst (Hva skal oversettes?)
    const spmTekst = (ovingRetning === 'en') ? ord.s : ord.e;
    document.getElementById('oving-spm').innerText = spmTekst;
    document.getElementById('oving-feedback').innerText = "";
    
    // Hent UI-elementer
    const inputFelt = document.getElementById('oving-svar');
    const svarKnapp = document.getElementById('btn-svar-tekst');
    const altContainer = document.getElementById('oving-alternativer');
    
    // LOGIKK: Sjekk om vi skal vise knapper eller tekstfelt
    if (valgtTrinn === '1-2') {
        // --- FLERVALG MODUS ---
        inputFelt.style.display = 'none';
        svarKnapp.style.display = 'none';
        altContainer.style.display = 'grid'; // Eller 'flex' avhengig av CSS
        
        genererAlternativer(ord);
        
    } else {
        // --- TEKST MODUS (3-7 Trinn) ---
        inputFelt.style.display = 'block';
        svarKnapp.style.display = 'block';
        altContainer.style.display = 'none';
        
        const placeholder = (ovingRetning === 'en') ? "Skriv på engelsk..." : "Skriv på norsk...";
        inputFelt.placeholder = placeholder;
        inputFelt.value = "";
        inputFelt.focus();
    }
}

/**
 * Generer 3 alternativer for 1-2 trinn
 */
function genererAlternativer(riktigOrdObjekt) {
    const container = document.getElementById('oving-alternativer');
    container.innerHTML = ""; // Tøm gamle knapper
    
    // Fasit (det vi skal klikke på)
    const fasit = (ovingRetning === 'en') ? riktigOrdObjekt.e : riktigOrdObjekt.s;
    
    // Finn 2 feil svar (distractors)
    let alternativer = [fasit];
    
    // Lag en kopi av ordlisten uten riktig ord
    const andreOrd = ovingOrdliste.filter(o => o !== riktigOrdObjekt);
    
    // Bland de andre ordene
    andreOrd.sort(() => Math.random() - 0.5);
    
    // Ta de to første feile svarene
    if (andreOrd.length >= 2) {
        const feil1 = (ovingRetning === 'en') ? andreOrd[0].e : andreOrd[0].s;
        const feil2 = (ovingRetning === 'en') ? andreOrd[1].e : andreOrd[1].s;
        alternativer.push(feil1, feil2);
    } else {
        // Fallback hvis listen er ekstremt kort (bør ikke skje med full liste)
        alternativer.push("Feil 1", "Feil 2"); 
    }
    
    // Bland alternativene slik at riktig svar ikke alltid er først
    alternativer.sort(() => Math.random() - 0.5);
    
    // Lag knapper
    alternativer.forEach(altTekst => {
        const btn = document.createElement('button');
        btn.className = 'alt-btn';
        btn.innerText = altTekst;
        btn.onclick = () => sjekkFlervalgSvar(altTekst, fasit);
        container.appendChild(btn);
    });
}

/**
 * Sjekk svar fra knappetrykk (1-2 Trinn)
 */
async function sjekkFlervalgSvar(valgtSvar, fasit) {
    if (valgtSvar === fasit) {
        handterRiktigSvar();
    } else {
        handterFeilSvar(fasit);
    }
}

/**
 * Sjekk svar fra tekst-input (3-7 Trinn)
 */
async function sjekkOvingSvar() {
    const input = document.getElementById('oving-svar').value.trim().toLowerCase();
    const ord = ovingOrdliste[ovingIndex];
    
    // Fasit basert på retning
    const fasit = (ovingRetning === 'en') ? ord.e.toLowerCase() : ord.s.toLowerCase();

    if (input === fasit) {
        handterRiktigSvar();
    } else {
        handterFeilSvar(fasit);
    }
}

/**
 * Felles funksjon for riktig svar
 */
async function handterRiktigSvar() {
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
    
    // Kort pause før neste spørsmål
    setTimeout(visNesteOvingSporsmaal, 1000);
}

/**
 * Felles funksjon for feil svar
 */
function handterFeilSvar(fasit) {
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

console.log('💪 practice.js lastet (v3 - flervalg 1-2 trinn)');