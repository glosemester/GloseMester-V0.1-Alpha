// ============================================
// KORT-DISPLAY.JS - GloseMester v0.1-ALPHA
// Kortvisning og samling
// ============================================

// Konfigurasjon for bilder
const BILDE_STI = 'img/kort/';
const FILTYPE = '.jpg'; // Endre til .png hvis du heller vil bruke det

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

        // Generer bildesti basert på ID
        // F.eks: img/kort/1.jpg
        const bildeUrl = `${BILDE_STI}${k.id}${FILTYPE}`;

        /* SMART BILDE-LOGIKK:
           1. Vi legger inn <img> taggen skjult (display:none)
           2. onload: Hvis bildet laster, vis bildet og skjul placeholder
           3. onerror: Hvis bildet feiler, gjør ingenting (placeholder vises allerede)
        */

        con.innerHTML += `
        <div class="poke-card rarity-${k.rarity.type}" 
             style="border-color:${k.rarity.farge}" 
             onclick="visStortKort('${k.id}', '${k.navn}', '${k.rarity.farge}', '${k.rarity.tekst}', '${k.kategori}')">
            
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
 * Oppdatert med smart bildelogikk
 */
function visStortKort(id, navn, farge, rarityTekst, kategori) {
    const popup = document.getElementById('kort-popup');
    const bildeUrl = `${BILDE_STI}${id}${FILTYPE}`;
    
    document.getElementById('stort-id').innerText = "#" + id;
    document.getElementById('stort-navn').innerText = navn;
    
    const bildeEl = document.getElementById('stort-bilde');
    
    // Reset bilde state før lasting
    bildeEl.style.display = 'none';
    bildeEl.src = bildeUrl;
    
    // Håndter lasting av stort bilde
    bildeEl.onload = function() {
        this.style.display = 'block';
    };
    
    bildeEl.onerror = function() {
        this.style.display = 'none';
        // Her kunne vi vist en stor emoji som fallback hvis vi ville
    };
    
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
 * Oppdatert med smart bildelogikk
 */
function visGevinstPopup(kort) {
    const popup = document.getElementById('gevinst-popup');
    const bildeEl = document.getElementById('gevinst-bilde');
    const bildeUrl = `${BILDE_STI}${kort.id}${FILTYPE}`;
    
    // Prøv å laste bilde
    bildeEl.style.display = 'none';
    bildeEl.src = bildeUrl;
    
    bildeEl.onload = function() {
        this.style.display = 'block';
    };
    
    // Hvis bilde mangler i gevinst, vis emoji midlertidig (fallback)
    // (Dette krever litt CSS for å se pent ut, men fungerer funksjonelt)
    
    popup.style.display = 'flex';
    
    // Auto-lukk etter 2 sekunder
    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}

/**
 * Vis feilmelding-popup
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

console.log('🎴 kort-display.js lastet (v2 - smart bilder)');