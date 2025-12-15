// ============================================
// QR-SCANNER.JS - GloseMester v0.1-ALPHA
// QR-kode scanning (Felles for Elev og Lærer)
// ============================================

let qrStream = null;
let qrCanvas = null;
let qrContext = null;
let qrAnimationFrame = null;
let aktivScanModus = 'elev'; // 'elev' eller 'laerer'

/**
 * Start QR-scanner
 * @param {string} modus - 'elev' (start prøve) eller 'laerer' (importer prøve)
 */
async function startQRScanner(modus = 'elev') {
    aktivScanModus = modus;
    
    const popup = document.getElementById('scanner-popup');
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    const instruks = document.getElementById('scanner-instruks');
    
    // Tilpass tekst basert på modus
    if (modus === 'laerer') {
        instruks.innerText = "Scan en kollegas prøve for å importere";
    } else {
        instruks.innerText = "Scan læreren sin kode for å starte";
    }
    
    popup.style.display = 'flex';
    status.innerText = 'Starter kamera...';
    
    try {
        qrStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        video.srcObject = qrStream;
        video.setAttribute('playsinline', true);
        video.play();
        
        status.innerText = '✅ Søker etter kode...';
        
        qrCanvas = document.createElement('canvas');
        qrContext = qrCanvas.getContext('2d');
        
        requestAnimationFrame(scanQRCode);
        
        if (typeof trackEvent === 'function') {
            trackEvent('QR', 'Startet scanner', modus);
        }
        
    } catch (error) {
        console.error('❌ Kamera-feil:', error);
        status.innerText = '❌ Ingen kameratilgang.';
        alert('Kunne ikke starte kamera. Sjekk tillatelser i nettleseren.');
        stopQRScanner();
    }
}

/**
 * Skann QR-kode fra video
 */
function scanQRCode() {
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    
    if (!qrStream) return; // Stopp hvis avsluttet

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        qrCanvas.height = video.videoHeight;
        qrCanvas.width = video.videoWidth;
        qrContext.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
        
        const imageData = qrContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        
        if (code) {
            // == KODE FUNNET! ==
            const scannetData = code.data;
            status.innerText = '✅ Kode funnet!';
            
            // Spill en liten lyd eller vibrer
            if (navigator.vibrate) navigator.vibrate(50);

            stopQRScanner();
            
            handterScannetKode(scannetData);
            return;
        }
    }
    
    qrAnimationFrame = requestAnimationFrame(scanQRCode);
}

/**
 * Håndter resultatet av scanningen
 */
function handterScannetKode(data) {
    let renKode = data;
    
    // Hvis det er en URL, trekk ut koden
    if (renKode.includes('?quiz=')) {
        const urlParams = new URLSearchParams(renKode.split('?')[1]);
        renKode = urlParams.get('quiz');
    }

    console.log(`📷 Scannet (${aktivScanModus}):`, renKode.substring(0, 20) + "...");

    if (aktivScanModus === 'elev') {
        // --- ELEV MODUS ---
        document.getElementById('prove-kode').value = renKode;
        setTimeout(() => {
            if (typeof startProve === 'function') startProve();
        }, 500);

    } else if (aktivScanModus === 'laerer') {
        // --- LÆRER MODUS ---
        try {
            // Prøv å dekomprimere for å se om det er gyldig data
            const proveData = dekomprimer(renKode);
            
            // Hvis vi har teacher.js lastet, bruk funksjonen der
            if (typeof lagreImportertProve === 'function') {
                lagreImportertProve(proveData, "Scannet Prøve");
            } else {
                alert("Fant prøve med " + proveData.length + " ord, men kunne ikke lagre (systemfeil).");
            }
        } catch (e) {
            alert("Ugyldig QR-kode! Er dette en GloseMester-prøve?");
            console.error(e);
        }
    }
}

/**
 * Stopp QR-scanner
 */
function stopQRScanner() {
    const popup = document.getElementById('scanner-popup');
    const video = document.getElementById('qr-video');
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    if (qrAnimationFrame) {
        cancelAnimationFrame(qrAnimationFrame);
        qrAnimationFrame = null;
    }
    
    popup.style.display = 'none';
    video.srcObject = null;
    
    console.log('📷 QR-scanner stoppet');
}

/**
 * Vis lagrede prøver (Elev)
 */
function visLagredeProver() {
    const prover = hentLagredeProver();
    const seksjon = document.getElementById('lagrede-prover-seksjon');
    const liste = document.getElementById('lagrede-prover-liste');
    
    if (!seksjon || !liste) return;
    
    if (prover.length === 0) {
        seksjon.style.display = 'none';
        return;
    }
    
    seksjon.style.display = 'block';
    liste.innerHTML = '';
    
    prover.forEach((prove, index) => {
        const dagerIgjen = Math.ceil((prove.utloperDato - Date.now()) / (24 * 60 * 60 * 1000));
        const antallOrd = prove.data.length;
        
        liste.innerHTML += `
        <div class="bibliotek-item" style="cursor: pointer; transition: all 0.2s;" onclick="startLagretProve('${prove.kode}')">
            <div class="bib-info">
                <h4>Prøve ${index + 1}</h4>
                <span style="font-size: 12px;">
                    ${antallOrd} ord • 
                    <span style="color: ${dagerIgjen <= 3 ? '#ff3b30' : '#86868b'};">
                        ${dagerIgjen} dag${dagerIgjen !== 1 ? 'er' : ''} igjen
                    </span>
                </span>
            </div>
            <div class="bib-actions">
                <button class="btn-secondary btn-small" onclick="event.stopPropagation(); startLagretProve('${prove.kode}')">
                    Start
                </button>
                <button class="btn-secondary btn-small btn-danger" onclick="event.stopPropagation(); slettLagretProve('${prove.kode}')">
                    ×
                </button>
            </div>
        </div>`;
    });
}

console.log('📷 qr-scanner.js lastet (Felles-modus)');