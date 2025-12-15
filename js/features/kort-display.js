// ============================================
// KORT-DISPLAY.JS - GloseMester v0.1-ALPHA
// Kortvisning og samling
// ============================================

/**
 * Vis brukerens samling
 */
function visSamling() {
    initKategoriValg();
    const samling = getSamling();
    visKortGrid('samling-liste', samling, true);
}

/**
 * Vis kort i grid
 * @param {string} containerId - ID på container
 * @param {Array} liste - Array med kort
 * @param {boolean} showTrade - Vis bytte-knapp?
 */
function visKortGrid(containerId, liste, showTrade) {
    // Filtrer basert på valgt kategori
    let filtrerteKort = [...liste];
    
    if (valgtKategori && valgtKategori !== 'alle') {
        filtrerteKort = liste.filter(k => k.kategori === valgtKategori);
    }
    
    // Sorter basert på valgt sortering
    if (valgtSortering === 'id') {
        filtrerteKort.sort((a, b) => a.id - b.id);
    } else if (valgtSortering === 'navn') {
        filtrerteKort.sort((a, b) => a.navn.localeCompare(b.navn));
    } else {
        // Nyeste først (default)
        filtrerteKort.reverse();
    }

    const con = document.getElementById(containerId);
    if (!con) return;
    
    con.innerHTML = "";
    
    // Oppdater kategori-tellere
    oppdaterKategoriTellere(liste);
    
    if (!filtrerteKort.length) {
        const kategoriNavn = valgtKategori === 'alle' ? 'samlingen' : valgtKategori;
        con.innerHTML = `
        <div class="tom-samling">
            <div class="tom-samling-icon">${getKategoriEmoji(valgtKategori)}</div>
            <h3>Ingen kort i ${kategoriNavn}</h3>
            <p>Svar riktig på spørsmål for å vinne kort!</p>
        </div>`;
        return;
    }
    
    filtrerteKort.forEach(k => {
        let tradeBtn = "";
        if (showTrade) {
            tradeBtn = `<button class="trade-btn" onclick="event.stopPropagation(); byttKort(${k.id})">🔄 Bytt</button>`;
        }

        con.innerHTML += `
        <div class="poke-card rarity-${k.rarity.type}" 
             style="border-color:${k.rarity.farge}" 
             onclick="visStortKort('${k.bilde || ''}', '${k.navn}', '${k.rarity.farge}', '${k.rarity.tekst}', '${k.id}', '${k.kategori}')">
            
            ${k.bilde 
                ? `<img src="${k.bilde}" alt="${k.navn}">`
                : `<div class="kort-bilde-placeholder" data-kategori="${k.kategori}">${getKategoriEmoji(k.kategori)}</div>`
            }
            
            <div class="poke-name">${k.navn}</div>
            <div class="rarity-badge" style="color:${k.rarity.farge}">${k.rarity.tekst}</div>
            ${tradeBtn}
        </div>`;
    });
}

/**
 * Få emoji for kategori
 * @param {string} kategori - Kategori-navn
 * @returns {string} Emoji
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
 * @param {string} valg - Sorteringsvalg
 */
function byttSortering(valg) {
    valgtSortering = valg;
    
    if (aktivRolle === 'elev' || aktivRolle === 'kode') {
        visSamling();
    }
    if (aktivRolle === 'oving') {
        visOvingSamling();
    }
    
    console.log('🔄 Sortering endret:', valg);
}

/**
 * Vis stort kort (popup)
 */
function visStortKort(bilde, navn, farge, rarityTekst, id, kategori) {
    const popup = document.getElementById('kort-popup');
    
    document.getElementById('stort-id').innerText = "#" + id;
    document.getElementById('stort-navn').innerText = navn;
    
    // Vis bilde eller placeholder
    const bildeEl = document.getElementById('stort-bilde');
    if (bilde) {
        bildeEl.src = bilde;
        bildeEl.style.display = 'block';
    } else {
        bildeEl.style.display = 'none';
    }
    
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
 * Vis gevinst-popup (når kort vinnes)
 * @param {object} kort - Kort-objekt
 */
function visGevinstPopup(kort) {
    const popup = document.getElementById('gevinst-popup');
    const bildeEl = document.getElementById('gevinst-bilde');
    
    if (kort.bilde) {
        bildeEl.src = kort.bilde;
    } else {
        bildeEl.src = '';
    }
    
    popup.style.display = 'flex';
    
    // Auto-lukk etter 2 sekunder
    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}

/**
 * Vis feilmelding-popup
 * @param {string} fasit - Riktig svar
 */
function visFeilMelding(fasit) {
    const popup = document.getElementById('feedback-popup');
    const wordEl = document.getElementById('feedback-correct-word');
    
    wordEl.innerText = fasit;
    popup.style.display = 'flex';
    
    // Auto-lukk etter 3 sekunder
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

/**
 * Bytt kort (bruk credits)
 * @param {number} kortId - ID på kort å bytte
 */
async function byttKort(kortId) {
    if (credits < 1) {
        alert("Du har ikke nok byttepoeng! Du trenger 1 byttepoeng for å bytte. Øv mer for å tjene poeng.");
        return;
    }

    if (!confirm(`Vil du bruke 1 byttepoeng for å bytte dette kortet mot et nytt tilfeldig kort?`)) {
        return;
    }

    // Bruk credit
    if (!useCredits(1)) {
        return;
    }

    let samling = getSamling();
    
    // Fjern gammelt kort
    const indexITabell = samling.findIndex(k => k.id == kortId);
    if (indexITabell > -1) {
        samling.splice(indexITabell, 1);
    }
    
    // Gi nytt tilfeldig kort
    await hentTilfeldigKort();
    
    // Oppdater visning
    setTimeout(() => {
        if (aktivRolle === 'elev' || aktivRolle === 'kode') visSamling();
        if (aktivRolle === 'oving') visOvingSamling();
    }, 1000);
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Kort', 'Byttet', kortId.toString());
    }
    
    console.log('🔄 Kort byttet:', kortId);
}

/**
 * Velg kategori
 * @param {string} kategori - Kategori å velge
 */
function velgKategori(kategori) {
    valgtKategori = kategori;
    lagreSisteKategori(kategori);
    
    // Oppdater UI - marker aktiv knapp
    document.querySelectorAll('.kategori-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const aktivBtn = document.querySelector(`.kategori-btn[data-kategori="${kategori}"]`);
    if (aktivBtn) aktivBtn.classList.add('active');
    
    // Oppdater visning
    if (aktivRolle === 'elev' || aktivRolle === 'kode') {
        visSamling();
    }
    if (aktivRolle === 'oving') {
        visOvingSamling();
    }
    
    console.log('📂 Kategori valgt:', kategori);
}

/**
 * Tell kort per kategori og oppdater tellere
 * @param {Array} samling - Full samling
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
    
    // Oppdater alle tellere i DOM
    Object.keys(teller).forEach(kat => {
        const countEl = document.getElementById(`count-${kat}`);
        if (countEl) {
            countEl.innerText = `(${teller[kat]})`;
        }
    });
}

/**
 * Initialiser kategori-valg ved lasting av samling
 */
function initKategoriValg() {
    const sisteKategori = hentSisteKategori();
    valgtKategori = sisteKategori;
    
    // Marker aktiv kategori
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

console.log('🎴 kort-display.js lastet');