// ============================================
// QR-SCANNER.JS - GloseMester v0.1-ALPHA
// QR-kode scanning for elever
// ============================================

let qrStream = null;
let qrCanvas = null;
let qrContext = null;
let qrAnimationFrame = null;

/**
 * Start QR-scanner
 */
async function startQRScanner() {
    const container = document.getElementById('qr-scanner-container');
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    
    container.style.display = 'block';
    status.innerText = 'Starter kamera...';
    
    try {
        // Be om kamera-tilgang (bakre kamera hvis tilgjengelig)
        qrStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        video.srcObject = qrStream;
        video.setAttribute('playsinline', true);
        video.play();
        
        status.innerText = '✅ Hold kameraet over QR-koden';
        
        // Opprett canvas for scanning
        qrCanvas = document.createElement('canvas');
        qrContext = qrCanvas.getContext('2d');
        
        // Start scanning
        requestAnimationFrame(scanQRCode);
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('QR', 'Startet scanner', 'Elev');
        }
        
        console.log('📷 QR-scanner startet');
        
    } catch (error) {
        console.error('❌ Kamera-feil:', error);
        status.innerText = '❌ Kunne ikke få tilgang til kamera. Sjekk tillatelser.';
        
        setTimeout(() => {
            stopQRScanner();
            alert('Kunne ikke starte kamera. Sjekk at du har gitt tillatelse til kamerabruk.');
        }, 2000);
    }
}

/**
 * Skann QR-kode fra video
 */
function scanQRCode() {
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        qrCanvas.height = video.videoHeight;
        qrCanvas.width = video.videoWidth;
        qrContext.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
        
        const imageData = qrContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        
        // Bruk jsQR library til å dekode
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        
        if (code) {
            status.innerText = '✅ QR-kode funnet!';
            
            let proveKode = code.data;
            
            // Hvis det er en full URL, trekk ut quiz-parameteren
            if (proveKode.includes('?quiz=')) {
                const urlParams = new URLSearchParams(proveKode.split('?')[1]);
                proveKode = urlParams.get('quiz');
            }
            
            // Sett koden i input-feltet
            document.getElementById('prove-kode').value = proveKode;
            
            // Stopp scanner
            stopQRScanner();
            
            // Start prøven automatisk etter kort delay
            setTimeout(() => {
                if (typeof startProve === 'function') {
                    startProve();
                }
            }, 500);
            
            // Track i analytics
            if (typeof trackEvent === 'function') {
                trackEvent('QR', 'Skannet vellykket', 'Elev');
            }
            
            console.log('✅ QR-kode skannet');
            
            return; // Stopp scanning
        }
    }
    
    // Fortsett scanning
    qrAnimationFrame = requestAnimationFrame(scanQRCode);
}

/**
 * Stopp QR-scanner
 */
function stopQRScanner() {
    const container = document.getElementById('qr-scanner-container');
    const video = document.getElementById('qr-video');
    
    // Stopp video stream
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    // Stopp animation frame
    if (qrAnimationFrame) {
        cancelAnimationFrame(qrAnimationFrame);
        qrAnimationFrame = null;
    }
    
    // Skjul container
    container.style.display = 'none';
    video.srcObject = null;
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('QR', 'Stoppet scanner', 'Elev');
    }
    
    console.log('📷 QR-scanner stoppet');
}

/**
 * Vis lagrede prøver (14-dagers cache)
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

console.log('📷 qr-scanner.js lastet');