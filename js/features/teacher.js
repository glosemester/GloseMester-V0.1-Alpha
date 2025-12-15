// ============================================
// TEACHER.JS - GloseMester v0.1-ALPHA
// Lærerfunksjoner (prøveeditor og bibliotek)
// ============================================

/**
 * Legg til ord i prøveeditoren
 */
function leggTilOrd() {
    const spm = document.getElementById('nytt-sporsmaal').value.trim();
    const svar = document.getElementById('nytt-svar').value.trim();
    
    if (!spm || !svar) {
        alert('Fyll ut både spørsmål og svar!');
        return;
    }
    
    editorListe.push({ sporsmaal: spm, svar: svar });
    
    document.getElementById('nytt-sporsmaal').value = "";
    document.getElementById('nytt-svar').value = "";
    document.getElementById('nytt-sporsmaal').focus();
    
    oppdaterEditorListeVisning();
    
    console.log('✅ Ord lagt til. Totalt:', editorListe.length);
}

/**
 * Slett ord fra editor
 * @param {number} index - Index på ord å slette
 */
function slettOrdFraEditor(index) {
    if (confirm('Slette dette ordet?')) {
        editorListe.splice(index, 1);
        oppdaterEditorListeVisning();
        console.log('🗑️ Ord slettet. Gjenstår:', editorListe.length);
    }
}

/**
 * Oppdater editor-liste visning
 */
function oppdaterEditorListeVisning() {
    const el = document.getElementById('editor-liste');
    el.innerHTML = "";
    
    if (editorListe.length === 0) {
        el.innerHTML = '<p style="color:#999; text-align:center;">Ingen ord lagt til ennå</p>';
        return;
    }
    
    editorListe.forEach((item, index) => {
        el.innerHTML += `
            <li class="bibliotek-item">
                <div class="bib-info">
                    <strong>${item.sporsmaal}</strong> → ${item.svar}
                </div>
                <button class="btn-secondary btn-small btn-danger" onclick="slettOrdFraEditor(${index})">×</button>
            </li>`;
    });
}

/**
 * Lagre prøve til bibliotek
 */
function lagreProveTilBibliotek() {
    const navn = document.getElementById('ny-prove-navn').value.trim();
    
    if (!navn) {
        alert('Gi prøven et navn!');
        return;
    }
    
    if (editorListe.length === 0) {
        alert('Legg til minst ett ord i prøven!');
        return;
    }
    
    lagreNyProve(navn, editorListe);
    
    // Reset editor
    editorListe = [];
    document.getElementById('ny-prove-navn').value = "";
    oppdaterEditorListeVisning();
    
    // Gå til bibliotek
    visSide('laerer-dashboard');
}

/**
 * Hjelpefunksjon: Lagre ny prøve i localStorage
 */
function lagreNyProve(navn, ordliste) {
    let bib = hentLokaleProver();
    
    const nyProve = {
        id: Date.now(),
        navn: navn,
        ordliste: ordliste
    };
    
    bib.push(nyProve);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));
    
    if (typeof trackEvent === 'function') {
        trackEvent('Lærer', 'Lagret prøve', `${ordliste.length} ord`);
    }
    
    console.log('✅ Prøve lagret:', navn);
    alert('✅ Prøve lagret i biblioteket!');
    return nyProve;
}

/**
 * Oppdater bibliotek-visning
 */
function oppdaterBibliotekVisning() {
    const con = document.getElementById('bibliotek-liste');
    const ingenMsg = document.getElementById('ingen-prover-msg');
    
    con.innerHTML = "";
    
    let bib = hentLokaleProver();
    
    if (!bib || bib.length === 0) {
        if (ingenMsg) ingenMsg.style.display = 'block';
        return;
    }
    
    if (ingenMsg) ingenMsg.style.display = 'none';
    
    // Vis nyeste først
    bib.reverse().forEach(p => {
        con.innerHTML += `
            <li class="bibliotek-item">
                <div class="bib-info">
                    <h4>${p.navn}</h4>
                    <span>${p.ordliste.length} ord</span>
                </div>
                <div class="bib-actions">
                    <button class="btn-secondary btn-small" onclick="visKodeForProve(${p.id})">📤 Del</button>
                    <button class="btn-secondary btn-small btn-danger" onclick="slettProve(${p.id})">×</button>
                </div>
            </li>`;
    });
}

/**
 * Slett prøve fra bibliotek
 * @param {number} id - Prøve-ID
 */
function slettProve(id) {
    if (!confirm('Slette denne prøven?')) return;
    
    let bib = hentLokaleProver();
    bib = bib.filter(p => p.id !== id);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Lærer', 'Slettet prøve', id.toString());
    }
    
    oppdaterBibliotekVisning();
    console.log('🗑️ Prøve slettet:', id);
}

/**
 * Vis kode for prøve (med QR)
 * @param {number} id - Prøve-ID
 */
function visKodeForProve(id) {
    let bib = hentLokaleProver();
    const p = bib.find(x => x.id === id);
    
    if (!p) {
        alert('Fant ikke prøven!');
        return;
    }
    
    // Generer komprimert kode
    const base64Code = komprimer(p.ordliste);
    
    // Oppdater popup
    document.getElementById('popup-kode-tekst').innerText = base64Code;
    
    // Generer QR-kode
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = "";
    
    // URL inkluderer nå navn for enklere import
    const currentUrl = window.location.href.split('?')[0];
    const directLink = `${currentUrl}?quiz=${base64Code}&navn=${encodeURIComponent(p.navn)}`;
    
    new QRCode(qrContainer, {
        text: directLink,
        width: 200,
        height: 200,
        colorDark: "#0071e3",
        colorLight: "#ffffff"
    });
    
    // Vis popup
    document.getElementById('kode-popup').style.display = 'flex';
    
    // Lagre ID for print-funksjon
    window.currentProveIdForPrint = id;
    
    console.log('📤 Kode generert for:', p.navn);
}

/**
 * Lukk kode-popup
 */
function lukkPopup() {
    document.getElementById('kode-popup').style.display = 'none';
}

/**
 * Skriv ut QR-kode
 */
function skrivUtQR() {
    const printPage = document.getElementById('print-qr-page');
    const proveNavn = document.getElementById('print-prove-navn');
    const printQRContainer = document.getElementById('print-qr-container');
    const printKodeTekst = document.getElementById('print-kode-tekst');
    
    const bib = hentLokaleProver();
    const aktuelProve = bib.find(p => p.id === window.currentProveIdForPrint);
    
    if (!aktuelProve) {
        alert('Kunne ikke finne prøve-informasjon');
        return;
    }
    
    proveNavn.innerText = aktuelProve.navn;
    
    // Generer QR for print
    printQRContainer.innerHTML = '';
    const kode = komprimer(aktuelProve.ordliste);
    const currentUrl = window.location.href.split('?')[0];
    const directLink = `${currentUrl}?quiz=${kode}&navn=${encodeURIComponent(aktuelProve.navn)}`;
    
    new QRCode(printQRContainer, {
        text: directLink,
        width: 300,
        height: 300,
        colorDark: "#0071e3",
        colorLight: "#ffffff"
    });
    
    printKodeTekst.innerText = kode;
    
    // Skjul popup og vis print
    document.getElementById('kode-popup').style.display = 'none';
    printPage.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            printPage.style.display = 'none';
        }, 500);
    }, 500);
}

/**
 * Last ned QR som PNG
 */
function lastNedQR() {
    const qrContainer = document.getElementById('qrcode-container');
    const canvas = qrContainer.querySelector('canvas');
    
    if (!canvas) {
        alert('Kunne ikke finne QR-kode');
        return;
    }
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'glosemester-qr-kode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

/**
 * Håndter manuell import av prøve (lim inn kode)
 */
function importerProveFraTekst() {
    const kode = prompt("Lim inn prøvekode fra en kollega:");
    if (!kode) return;
    
    try {
        const ordliste = dekomprimer(kode);
        const navn = prompt("Hva skal prøven hete?", "Importert Prøve");
        
        if (navn && ordliste.length > 0) {
            lagreNyProve(navn, ordliste);
            oppdaterBibliotekVisning();
        }
    } catch (e) {
        alert("Ugyldig kode!");
        console.error(e);
    }
}

/**
 * Lagre en importert prøve (fra lenke/QR)
 */
function lagreImportertProve(proveData, navn) {
    const nyttNavn = prompt("Gi prøven et navn:", navn || "Ny Prøve");
    if (nyttNavn) {
        lagreNyProve(nyttNavn, proveData);
        velgRolle('laerer'); // Gå til lærermenyen
    }
}

console.log('🍎 teacher.js lastet (v2 - import)');