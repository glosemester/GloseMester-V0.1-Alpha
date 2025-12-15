// ============================================
// EXPORT-IMPORT.JS - GloseMester v0.1-ALPHA
// QR-kode eksport/import av samling
// ============================================

/**
 * Eksporter brukerens samling som QR-kode
 * OPTIMALISERT: Sender kun ID-er for å spare plass
 */
function eksporterSamling() {
    const samling = getSamling();
    
    if (samling.length === 0) {
        alert('Du har ingen kort å eksportere!');
        return;
    }
    
    try {
        // 1. Trekk ut kun ID-ene (sparer masse plass!)
        const kortIDer = samling.map(k => k.id);

        // 2. Lag et minimalt objekt
        const data = {
            b: brukerNavn,  // b = bruker
            d: Date.now(),  // d = dato
            k: kortIDer     // k = kort (array av ID-er)
        };
        
        // 3. Komprimer til JSON streng
        const jsonStreng = JSON.stringify(data);
        
        // 4. Base64 encode for QR-kode
        const encoded = btoa(unescape(encodeURIComponent(jsonStreng)));
        
        // Vis popup
        visEksportPopup(encoded, samling.length);
        
        // Track
        if (typeof trackEvent === 'function') {
            trackEvent('Export', 'Eksportert samling', `${samling.length} kort`);
        }
        
        console.log('✅ Samling eksportert (optimalisert):', samling.length, 'kort');
        
    } catch (e) {
        console.error('❌ Eksport feilet:', e);
        alert('Kunne ikke eksportere samling. Prøv igjen senere.');
    }
}

/**
 * Importer samling fra QR-kode
 * @param {string} kode - Base64-encoded data
 */
function importerSamling(kode) {
    if (!kode || kode.trim() === '') {
        alert('Ingen kode oppgitt!');
        return;
    }
    
    try {
        // 1. Decode base64
        const decoded = decodeURIComponent(escape(atob(kode.trim())));
        const data = JSON.parse(decoded);
        
        // Støtte for både gammelt format (objekter) og nytt format (ID-er)
        let importerteKort = [];

        if (data.k && Array.isArray(data.k)) {
            // Sjekk om det er ID-er (tall) eller objekter
            if (typeof data.k[0] === 'number' || typeof data.k[0] === 'string') {
                // NYTT FORMAT: Liste med ID-er -> Slå opp i collection.js
                importerteKort = data.k.map(id => finnKortFraID(id)).filter(k => k !== null);
            } else {
                // GAMMELT FORMAT: Liste med objekter
                importerteKort = konverterGammelFormat(data.k);
            }
        } else if (data.kort) {
            // VELDIG GAMMELT FORMAT
            importerteKort = konverterGammelFormat(data.kort);
        } else {
            throw new Error('Ukjent dataformat');
        }
        
        if (importerteKort.length === 0) {
            throw new Error('Ingen gyldige kort funnet i koden');
        }

        // Bekreft import
        const senderNavn = data.b || data.bruker || 'ukjent bruker';
        if (confirm(`Vil du importere ${importerteKort.length} kort fra ${senderNavn}?\n\nDette vil OVERSKRIVE din nåværende samling!`)) {
            setSamling(importerteKort);
            alert(`✅ Importert ${importerteKort.length} kort!`);
            
            // Oppdater visning
            oppdaterVisningEtterImport();
            
            // Track
            if (typeof trackEvent === 'function') {
                trackEvent('Import', 'Importert samling', `${importerteKort.length} kort`);
            }
            
            console.log('✅ Samling importert:', importerteKort.length, 'kort');
        }
        
    } catch (e) {
        console.error('❌ Import feilet:', e);
        alert('Ugyldig QR-kode! Kunne ikke importere samling.');
    }
}

/**
 * Hjelper: Finn fullt kort-objekt basert på ID
 */
function finnKortFraID(id) {
    // Søk gjennom alle kategorier i kortSamling (fra collection.js)
    for (let kategori in kortSamling) {
        const funnet = kortSamling[kategori].find(k => k.id == id);
        if (funnet) return funnet;
    }
    console.warn('⚠️ Fant ikke kort med ID:', id);
    return null;
}

/**
 * Hjelper: Håndter gammelt format for bakoverkompatibilitet
 */
function konverterGammelFormat(kortListe) {
    return kortListe.map(k => {
        // Prøv å finn kortet i systemet først (best practice)
        const systemKort = finnKortFraID(k.id);
        if (systemKort) return systemKort;

        // Fallback hvis ID ikke finnes (bør ikke skje)
        return {
            id: k.id,
            navn: k.n || k.navn,
            kategori: k.k || k.kategori,
            rarity: getRarityFromType(k.r || (k.rarity ? k.rarity.type : 'vanlig'))
        };
    });
}

/**
 * Hjelper: Oppdater UI etter import
 */
function oppdaterVisningEtterImport() {
    if (aktivRolle === 'elev' && typeof visSamling === 'function') {
        visSamling();
    }
    if (aktivRolle === 'oving' && typeof visOvingSamling === 'function') {
        visOvingSamling();
    }
}

/**
 * Vis eksport-popup med QR-kode
 */
function visEksportPopup(kode, antall) {
    // Sjekk om popup allerede finnes
    lukkEksportPopup();

    const popup = document.createElement('div');
    popup.className = 'popup-overlay active';
    popup.id = 'eksport-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>📤 Eksporter Samling</h2>
            <p>Din samling med <strong>${antall} kort</strong> er klar!</p>
            <div id="eksport-qr-container" style="margin: 20px auto; background: white; padding: 10px; width: fit-content; border-radius: 8px;"></div>
            
            <div class="info-box">
                <strong>Slik deler du samlingen:</strong>
                <ol style="text-align: left; margin: 10px 0;">
                    <li>La mottaker skanne QR-koden</li>
                    <li>Eller kopier koden under og send den</li>
                </ol>
            </div>
            
            <div class="kode-boks" style="font-size: 10px; max-height: 80px; overflow-y: auto; overflow-x: hidden; word-break: break-all;">${kode}</div>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn-secondary" style="flex: 1;" onclick="kopierEksportKode('${kode}')">📋 Kopier</button>
                <button class="btn-primary" style="flex: 1;" onclick="lukkEksportPopup()">Lukk</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Generer QR-kode
    const qrContainer = document.getElementById('eksport-qr-container');
    new QRCode(qrContainer, {
        text: kode,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.L, // L = Lower error correction = mindre QR-kode (lettere å scanne)
        colorDark: "#000000",
        colorLight: "#ffffff"
    });
}

/**
 * Kopier eksport-kode til clipboard
 */
function kopierEksportKode(kode) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(kode).then(() => {
            alert('✅ Kode kopiert!');
        }).catch(() => fallbackKopier(kode));
    } else {
        fallbackKopier(kode);
    }
}

function fallbackKopier(kode) {
    const textarea = document.createElement('textarea');
    textarea.value = kode;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('✅ Kode kopiert!');
    } catch (err) {
        alert('Kunne ikke kopiere automatisk.');
    }
    document.body.removeChild(textarea);
}

/**
 * Lukk eksport-popup
 */
function lukkEksportPopup() {
    const popup = document.getElementById('eksport-popup');
    if (popup) {
        popup.remove();
    }
}

/**
 * Hjelper: Konverter rarity type til fullt objekt
 */
function getRarityFromType(type) {
    const rarityMap = {
        'vanlig': { type: 'vanlig', farge: '#a1a1a1', tekst: 'Vanlig' },
        'sjelden': { type: 'sjelden', farge: '#0071e3', tekst: 'Sjelden' },
        'episk': { type: 'episk', farge: '#8e44ad', tekst: 'Episk' },
        'legendary': { type: 'legendary', farge: '#f1c40f', tekst: 'Legendarisk' }
    };
    return rarityMap[type] || rarityMap['vanlig'];
}

console.log('📤 export-import.js lastet (v2 - optimized)');