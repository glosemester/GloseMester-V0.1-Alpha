// ============================================
// EXPORT-IMPORT.JS - GloseMester v0.1-ALPHA
// QR-kode eksport/import av samling
// ============================================

/**
 * Eksporter brukerens samling som QR-kode
 * Komprimerer data og genererer QR-kode
 */
function eksporterSamling() {
    const samling = getSamling();
    
    if (samling.length === 0) {
        alert('Du har ingen kort å eksportere!');
        return;
    }
    
    try {
        // Komprimer samlingen
        const komprimertData = JSON.stringify({
            bruker: brukerNavn,
            dato: Date.now(),
            kort: samling.map(k => ({
                id: k.id,
                n: k.navn,
                k: k.kategori,
                r: k.rarity.type
            }))
        });
        
        // Base64 encode
        const encoded = btoa(unescape(encodeURIComponent(komprimertData)));
        
        // Vis popup med QR-kode
        visEksportPopup(encoded, samling.length);
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Export', 'Eksportert samling', `${samling.length} kort`);
        }
        
        console.log('✅ Samling eksportert:', samling.length, 'kort');
        
    } catch (e) {
        console.error('❌ Eksport feilet:', e);
        alert('Kunne ikke eksportere samling. Prøv igjen senere.');
    }
}

/**
 * Importer samling fra QR-kode
 * @param {string} kode - Base64-encoded samling
 */
function importerSamling(kode) {
    if (!kode || kode.trim() === '') {
        alert('Ingen kode oppgitt!');
        return;
    }
    
    try {
        // Decode base64
        const decoded = decodeURIComponent(escape(atob(kode.trim())));
        const data = JSON.parse(decoded);
        
        if (!data.kort || !Array.isArray(data.kort)) {
            throw new Error('Ugyldig data-format');
        }
        
        // Ekspander kortdata
        const importerteKort = data.kort.map(k => {
            // Finn fullt kort-objekt fra collection
            let fullKort = null;
            
            for (let kategori in kortSamling) {
                const funnet = kortSamling[kategori].find(kort => kort.id === k.id);
                if (funnet) {
                    fullKort = funnet;
                    break;
                }
            }
            
            return fullKort || {
                id: k.id,
                navn: k.n,
                kategori: k.k,
                rarity: getRarityFromType(k.r)
            };
        });
        
        // Bekreft import
        if (confirm(`Vil du importere ${importerteKort.length} kort fra ${data.bruker || 'ukjent bruker'}?\n\nDette vil OVERSKRIVE din nåværende samling!`)) {
            setSamling(importerteKort);
            alert(`✅ Importert ${importerteKort.length} kort!`);
            
            // Oppdater visning
            if (aktivRolle === 'elev' && typeof visSamling === 'function') {
                visSamling();
            }
            if (aktivRolle === 'oving' && typeof visOvingSamling === 'function') {
                visOvingSamling();
            }
            
            // Track i analytics
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
 * Vis eksport-popup med QR-kode
 * @param {string} kode - Encoded samling
 * @param {number} antall - Antall kort
 */
function visEksportPopup(kode, antall) {
    // Opprett popup HTML
    const popup = document.createElement('div');
    popup.className = 'popup-overlay active';
    popup.id = 'eksport-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>📤 Eksporter Samling</h2>
            <p>Din samling med <strong>${antall} kort</strong> er klar!</p>
            <div id="eksport-qr-container" style="margin: 20px 0;"></div>
            <div class="info-box">
                <strong>Slik deler du samlingen:</strong>
                <ol style="text-align: left; margin: 10px 0;">
                    <li>La mottaker skanne QR-koden</li>
                    <li>Eller kopier koden under og send den</li>
                </ol>
            </div>
            <div class="kode-boks" style="font-size: 10px; max-height: 100px; overflow-y: auto;">${kode}</div>
            <button class="btn-secondary" onclick="kopierEksportKode('${kode}')">📋 Kopier kode</button>
            <button class="btn-primary" onclick="lukkEksportPopup()">Lukk</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Generer QR-kode
    const qrContainer = document.getElementById('eksport-qr-container');
    new QRCode(qrContainer, {
        text: kode,
        width: 200,
        height: 200,
        colorDark: "#0071e3",
        colorLight: "#ffffff"
    });
}

/**
 * Kopier eksport-kode til clipboard
 * @param {string} kode - Kode å kopiere
 */
function kopierEksportKode(kode) {
    navigator.clipboard.writeText(kode).then(() => {
        alert('✅ Kode kopiert! Send den til mottaker.');
    }).catch(() => {
        // Fallback for eldre browsere
        const textarea = document.createElement('textarea');
        textarea.value = kode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Kode kopiert!');
    });
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
 * @param {string} type - Rarity type
 * @returns {object} Rarity objekt
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

console.log('📤 export-import.js lastet');