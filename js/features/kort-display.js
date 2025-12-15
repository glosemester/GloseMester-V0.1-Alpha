// ============================================
// KORT-DISPLAY.JS - GloseMester v0.1-ALPHA
// Kortvisning og samling
// ============================================

// Konfigurasjon for bilder
const BILDE_STI = 'img/kort/';
const FILTYPE = '.jpg'; 

/**
 * Vis brukerens samling
 */
function visSamling() {
    initKategoriValg();
    const samling = getSamling();
    visKortGrid('samling-liste', samling, true);
}

/**
 * Vis kort i grid (Nå med stacking av duplikater!)
 * @param {string} containerId - ID på container
 * @param {Array} liste - Array med kort
 * @param {boolean} showTrade - Vis bytte-knapp?
 */
function visKortGrid(containerId, liste, showTrade) {
    const con = document.getElementById(containerId);
    if (!con) return;
    con.innerHTML = "";

    // 1. Filtrer basert på valgt kategori
    let filtrerteKort = [...liste];
    if (valgtKategori && valgtKategori !== 'alle') {
        filtrerteKort = liste.filter(k => k.kategori === valgtKategori);
    }

    // 2. Oppdater tellere (viser totalt antall kort, inkludert duplikater)
    oppdaterKategoriTellere(liste);

    if (!filtrerteKort.length) {
        visTomSamlingMelding(con);
        return;
    }

    // 3. GRUPPER DUPLIKATER (Stacking)
    // Vi gjør om listen til unike kort med en "antall"-egenskap
    const unikeKortMap = new Map();

    filtrerteKort.forEach(kort => {
        if (unikeKortMap.has(kort.id)) {
            // Hvis kortet finnes, øk antallet
            const eksisterende = unikeKortMap.get(kort.id);
            eksisterende.antall++;
        } else {
            // Hvis nytt, legg til med antall = 1
            // Vi lager en kopi for ikke å endre originaldataene
            unikeKortMap.set(kort.id, { ...kort, antall: 1 });
        }
    });

    // Konverter tilbake til array for sortering
    let visningsListe = Array.from(unikeKortMap.values());

    // 4. Sorter basert på valgt sortering
    if (valgtSortering === 'id') {
        visningsListe.sort((a, b) => a.id - b.id);
    } else if (valgtSortering === 'navn') {
        visningsListe.sort((a, b) => a.navn.localeCompare(b.navn));
    } else {
        // Nyeste først (basert på ID for enkelhets skyld når vi stacker)
        // Siden nyere kort har høyere ID eller ligger sist i arrayet
        visningsListe.reverse(); 
    }
    
    // 5. Tegn opp kortene
    visningsListe.forEach(k => {
        let tradeBtn = "";
        
        // Vis bytteknapp bare hvis vi har lov (showTrade)
        if (showTrade) {
            tradeBtn = `<button class="trade-btn" onclick="event.stopPropagation(); byttKort(${k.id})">🔄 Bytt</button>`;
        }

        const bildeUrl = `${BILDE_STI}${k.id}${FILTYPE}`;
        
        // Lag antall-badge hvis man har flere enn 1
        const antallBadge = k.antall > 1 
            ? `<div class="antall-badge">x${k.antall}</div>` 
            : '';

        con.innerHTML += `
        <div class="poke-card rarity-${k.rarity.type}" 
             style="border-color:${k.rarity.farge}" 
             onclick="visStortKort('${k.id}', '${k.navn}', '${k.rarity.farge}', '${k.rarity.tekst}', '${k.kategori}')">
            
            ${antallBadge}

            <div class="kort-bilde-wrapper" style="position: relative; min-height: 90px; display: flex; justify-content: center;">
                <img src="${bildeUrl}" 
                     alt="${k.navn}" 
                     style="display: none;"
                     onload="this.style.display='block'; this.nextElementSibling.style.display='none'" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                
                <div class="kort-bilde-placeholder" data-kategori="${k.kategori}" style="display: flex;">
                    ${getKategoriEmoji(k.kategori)}
                </div>
            </div>
            
            <div class="poke-name">${k.navn}</div>
            <div class="rarity-badge" style="color:${k.rarity.farge}">${k.rarity.tekst}</div>
            ${tradeBtn}
        </div>`;
    });
}

/**
 * Vis melding når samlingen er tom
 */
function visTomSamlingMelding(container) {
    const kategoriNavn = valgtKategori === 'alle' ? 'samlingen' : valgtKategori;
    container.innerHTML = `
    <div class="tom-samling">
        <div class="tom-samling-icon">${getKategoriEmoji(valgtKategori)}</div>
        <h3>Ingen kort i ${kategoriNavn}</h3>
        <p>Svar riktig på spørsmål for å vinne kort!</p>
    </div>`;
}

/**
 * Få emoji for kategori
 */
function getKategoriEmoji(kategori) {
    const emojis = {
        'biler': '🚗',
        'guder': '⚡',
        'dinosaurer': '🦖',
        'dyr': '🐾',
        'alle': '🎴'
    };
    return emojis[kategori] || '🎴';
}

/**
 * Bytt sortering
 */
function byttSortering(valg) {
    valgtSortering = valg;
    oppdaterVisning();
    console.log('🔄 Sortering endret:', valg);
}

/**
 * Vis stort kort (popup)
 */
function visStortKort(id, navn, farge, rarityTekst, kategori) {
    const popup = document.getElementById('kort-popup');
    const bildeUrl = `${BILDE_STI}${id}${FILTYPE}`;
    
    document.getElementById('stort-id').innerText = "#" + id;
    document.getElementById('stort-navn').innerText = navn;
    
    const bildeEl = document.getElementById('stort-bilde');
    bildeEl.style.display = 'none';
    bildeEl.src = bildeUrl;
    
    bildeEl.onload = function() { this.style.display = 'block'; };
    bildeEl.onerror = function() { this.style.display = 'none'; };
    
    const rarityEl = document.getElementById('stort-rarity');
    rarityEl.innerText = rarityTekst;
    rarityEl.style.color = farge;
    rarityEl.className = 'rarity-text ' + rarityTekst.toLowerCase();
    
    popup.style.display = 'flex';
}

/**
 * Lukk kort-popup
 */
function lukkKort(e) {
    if (e === null || e.target.id === 'kort-popup') {
        document.getElementById('kort-popup').style.display = 'none';
    }
}

/**
 * Vis gevinst-popup
 */
function visGevinstPopup(kort) {
    const popup = document.getElementById('gevinst-popup');
    const bildeEl = document.getElementById('gevinst-bilde');
    const bildeUrl = `${BILDE_STI}${kort.id}${FILTYPE}`;
    
    bildeEl.style.display = 'none';
    bildeEl.src = bildeUrl;
    bildeEl.onload = function() { this.style.display = 'block'; };
    
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 2000);
}

/**
 * Bytt kort (bruk credits)
 */
async function byttKort(kortId) {
    if (credits < 1) {
        alert("Du har ikke nok byttepoeng! Du trenger 1 byttepoeng for å bytte.");
        return;
    }

    if (!confirm(`Vil du bruke 1 byttepoeng for å bytte dette kortet mot et nytt tilfeldig kort?`)) {
        return;
    }

    if (!useCredits(1)) return;

    let samling = getSamling();
    
    // Fjern ÉN instans av kortet (den første vi finner med denne ID-en)
    const indexITabell = samling.findIndex(k => k.id == kortId);
    if (indexITabell > -1) {
        samling.splice(indexITabell, 1);
        // Lagre endret samling (viktig siden vi manipulerer arrayet direkte)
        setSamling(samling); 
    }
    
    // Gi nytt tilfeldig kort
    await hentTilfeldigKort();
    
    // Oppdater visning etter kort tid
    setTimeout(() => {
        oppdaterVisning();
    }, 1000);
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Kort', 'Byttet', kortId.toString());
    }
    console.log('🔄 Kort byttet:', kortId);
}

/**
 * Velg kategori
 */
function velgKategori(kategori) {
    valgtKategori = kategori;
    lagreSisteKategori(kategori);
    
    document.querySelectorAll('.kategori-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const aktivBtn = document.querySelector(`.kategori-btn[data-kategori="${kategori}"]`);
    if (aktivBtn) aktivBtn.classList.add('active');
    
    oppdaterVisning();
    console.log('📂 Kategori valgt:', kategori);
}

/**
 * Hjelper: Oppdater visning basert på aktiv rolle
 */
function oppdaterVisning() {
    if (aktivRolle === 'elev' || aktivRolle === 'kode') {
        visSamling();
    }
    if (aktivRolle === 'oving') {
        visOvingSamling();
    }
}

/**
 * Tell kort per kategori
 */
function oppdaterKategoriTellere(samling) {
    const teller = {
        alle: samling.length,
        biler: 0,
        guder: 0,
        dinosaurer: 0,
        dyr: 0
    };
    
    samling.forEach(kort => {
        if (teller[kort.kategori] !== undefined) {
            teller[kort.kategori]++;
        }
    });
    
    Object.keys(teller).forEach(kat => {
        const countEl = document.getElementById(`count-${kat}`);
        if (countEl) countEl.innerText = `(${teller[kat]})`;
    });
}

/**
 * Initialiser kategori-valg
 */
function initKategoriValg() {
    const sisteKategori = hentSisteKategori();
    valgtKategori = sisteKategori;
    
    const aktivBtn = document.querySelector(`.kategori-btn[data-kategori="${sisteKategori}"]`);
    if (aktivBtn) aktivBtn.classList.add('active');
}

/**
 * Vis øvingssamling
 */
function visOvingSamling() {
    initKategoriValg();
    const samling = getSamling();
    visKortGrid('oving-samling-liste', samling, true);
}

/**
 * Vis feilmelding (brukes av quiz/practice)
 */
function visFeilMelding(fasit) {
    const popup = document.getElementById('feedback-popup');
    const wordEl = document.getElementById('feedback-correct-word');
    wordEl.innerText = fasit;
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 3000);
}

console.log('🎴 kort-display.js lastet (v3 - stacked)');