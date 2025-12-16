// ============================================
// QR-SCANNER.JS - GloseMester v1.0 (Module)
// ============================================

// Merk: jsQR må være lastet i index.html (<script src="...jsQR.js">)
import { startProve } from './quiz.js';

let qrStream = null;
let qrCanvas = null;
let qrContext = null;
let qrAnimationFrame = null;
let aktivScanModus = 'elev';

export async function startQRScanner(modus = 'elev') {
    aktivScanModus = modus;
    const popup = document.getElementById('scanner-popup');
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    const instruks = document.getElementById('scanner-instruks');
    
    instruks.innerText = (modus === 'laerer') ? "Scan en kollegas prøve" : "Scan læreren sin kode";
    popup.style.display = 'flex';
    status.innerText = 'Starter kamera...';
    
    try {
        qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = qrStream;
        video.setAttribute('playsinline', true);
        video.play();
        status.innerText = '✅ Søker etter kode...';
        
        qrCanvas = document.createElement('canvas');
        qrContext = qrCanvas.getContext('2d');
        requestAnimationFrame(scanQRCode);
        
    } catch (error) {
        console.error(error);
        status.innerText = '❌ Ingen kameratilgang.';
        alert('Ingen kameratilgang.');
        stopQRScanner();
    }
}

function scanQRCode() {
    const video = document.getElementById('qr-video');
    const status = document.getElementById('qr-scanner-status');
    if (!qrStream) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        qrCanvas.height = video.videoHeight;
        qrCanvas.width = video.videoWidth;
        qrContext.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
        
        const imageData = qrContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        // jsQR ligger globalt fra index.html
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
            if (code) {
                status.innerText = '✅ Kode funnet!';
                if (navigator.vibrate) navigator.vibrate(50);
                stopQRScanner();
                handterScannetKode(code.data);
                return;
            }
        }
    }
    qrAnimationFrame = requestAnimationFrame(scanQRCode);
}

function handterScannetKode(data) {
    let renKode = data;
    if (renKode.includes('?quiz=')) {
        renKode = new URLSearchParams(renKode.split('?')[1]).get('quiz');
    }

    if (aktivScanModus === 'elev') {
        document.getElementById('prove-kode').value = renKode;
        setTimeout(() => startProve(), 500);
    } else if (aktivScanModus === 'laerer') {
        if (typeof window.lagreImportertProve === 'function') {
            // Denne funksjonen må ligge i teacher.js og være eksponert
            window.lagreImportertProve(renKode, "Scannet Prøve");
        } else {
            alert("Importering er ikke koblet opp enda.");
        }
    }
}

export function stopQRScanner() {
    const popup = document.getElementById('scanner-popup');
    const video = document.getElementById('qr-video');
    if (qrStream) { qrStream.getTracks().forEach(track => track.stop()); qrStream = null; }
    if (qrAnimationFrame) { cancelAnimationFrame(qrAnimationFrame); qrAnimationFrame = null; }
    popup.style.display = 'none';
    video.srcObject = null;
}

// Denne funksjonen brukes av elev-dashboardet
window.visLagredeProver = function() {
    const prover = typeof hentLagredeProver === 'function' ? hentLagredeProver() : [];
    const seksjon = document.getElementById('lagrede-prover-seksjon');
    const liste = document.getElementById('lagrede-prover-liste');
    
    if (!seksjon || !liste) return;
    if (prover.length === 0) { seksjon.style.display = 'none'; return; }
    
    seksjon.style.display = 'block';
    liste.innerHTML = '';
    
    prover.forEach((prove, index) => {
        const dagerIgjen = Math.ceil((prove.utloperDato - Date.now()) / (86400000));
        liste.innerHTML += `
        <div class="bibliotek-item" onclick="startLagretProve('${prove.kode}')">
            <div class="bib-info"><h4>Prøve ${index + 1}</h4><span>${prove.data.length} ord • ${dagerIgjen} dager igjen</span></div>
            <div class="bib-actions"><button class="btn-secondary btn-small" onclick="event.stopPropagation(); startLagretProve('${prove.kode}')">Start</button></div>
        </div>`;
    });
}
// Vi må legge startLagretProve på window for at onclick i HTML strengen over skal virke
import { startLagretProve } from './quiz.js';
window.startLagretProve = startLagretProve;