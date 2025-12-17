// ============================================
// QR-SCANNER.JS - GloseMester v1.0
// ============================================
import { startProve } from './quiz.js';
import { visToast } from '../ui/helpers.js';

let videoStream = null;

export function startQRScanner() {
    const video = document.getElementById('qr-video');
    const overlay = document.getElementById('scanner-popup');
    
    if(!video || !overlay) {
        console.error("Mangler video-element eller popup!");
        return;
    }
    
    overlay.style.display = 'flex';
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            videoStream = stream;
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // For iOS
            video.play();
            requestAnimationFrame(tick);
        })
        .catch(err => {
            console.error(err);
            alert("Kunne ikke starte kamera. Sjekk tillatelser.");
            lukkScanner();
        });
}

function tick() {
    const video = document.getElementById('qr-video');
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Vi bruker jsQR biblioteket som er lastet i index.html
        if(typeof jsQR === 'undefined') {
            console.error("jsQR bibliotek ikke lastet!");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            // KODE FUNNET!
            lukkScanner();
            visToast("Kode funnet!", "success");
            
            // Sjekk om det er en URL eller ren kode
            let quizKode = code.data;
            if(quizKode.includes("quiz=")) {
                quizKode = quizKode.split("quiz=")[1];
            }
            
            // Fyll inn i feltet og start
            const input = document.getElementById('prove-kode');
            if(input) input.value = quizKode;
            
            startProve(quizKode);
            return;
        }
    }
    if(videoStream) requestAnimationFrame(tick);
}

// Hovedfunksjon for å lukke
export function lukkScanner() {
    const overlay = document.getElementById('scanner-popup');
    if(overlay) overlay.style.display = 'none';
    
    if(videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// VIKTIG: Alias for å gjøre app.js fornøyd
export const stopQRScanner = lukkScanner;