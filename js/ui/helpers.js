// ============================================
// HELPERS.JS - GloseMester v0.1-ALPHA
// UI-hjelpefunksjoner
// ============================================

/**
 * Vis installasjons-hjelp
 */
function visInstallHjelp() {
    const message = `📲 Slik installerer du GloseMester:

📱 iOS (iPhone/iPad):
1. Trykk på Del-knappen (firkant med pil opp)
2. Scroll ned og velg "Legg til på Hjem-skjerm"
3. Trykk "Legg til"

🤖 Android:
1. Trykk på Meny (tre prikker øverst)
2. Velg "Installer app" eller "Legg til på startskjerm"
3. Trykk "Installer"

💻 Desktop (Chrome/Edge):
1. Se etter installasjons-ikon i adressefeltet
2. Klikk og velg "Installer"`;

    alert(message);
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('UI', 'Åpnet installasjonshjelp', 'Help button');
    }
}

/**
 * Håndter Enter-tast i input-felt
 * @param {Event} e - Keyboard event
 * @param {Function} callback - Funksjon å kalle ved Enter
 */
function handleEnter(e, callback) {
    if (e.key === "Enter" || e.keyCode === 13) {
        callback();
    }
}

/**
 * Text-to-speech - les opp tekst
 * @param {string} tekst - Tekst å lese opp
 * @param {string} sprak - Språkkode (nb-NO, en-US, etc)
 */
function lesOpp(tekst, sprak) {
    if ('speechSynthesis' in window) {
        // Stopp eventuell pågående opplesing
        window.speechSynthesis.cancel();
        
        let tale = new SpeechSynthesisUtterance(tekst);
        tale.lang = sprak || 'nb-NO';
        tale.rate = 0.9;
        tale.pitch = 1.0;
        tale.volume = 1.0;
        
        window.speechSynthesis.speak(tale);
        
        console.log('🔊 Leser opp:', tekst);
    } else {
        console.warn('⚠️ Nettleseren støtter ikke opplesing');
        alert("Beklager, din nettleser støtter ikke opplesing.");
    }
}

/**
 * Stopp opplesing
 */
function stoppOpplesing() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        console.log('🔇 Opplesing stoppet');
    }
}

/**
 * Kopier tekst til clipboard
 * @param {string} tekst - Tekst å kopiere
 * @returns {Promise<boolean>} Success status
 */
async function kopierTilClipboard(tekst) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(tekst);
            console.log('✅ Kopiert til clipboard');
            return true;
        } else {
            // Fallback for eldre browsere
            const textarea = document.createElement('textarea');
            textarea.value = tekst;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            console.log('✅ Kopiert til clipboard (fallback)');
            return true;
        }
    } catch (e) {
        console.error('❌ Kunne ikke kopiere:', e);
        return false;
    }
}

/**
 * Formater dato til norsk format
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatert dato
 */
function formaterDato(timestamp) {
    const dato = new Date(timestamp);
    const dag = dato.getDate().toString().padStart(2, '0');
    const maned = (dato.getMonth() + 1).toString().padStart(2, '0');
    const ar = dato.getFullYear();
    return `${dag}.${maned}.${ar}`;
}

/**
 * Formater tid siden (relativ tid)
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relativ tid (f.eks: "2 dager siden")
 */
function tidSiden(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const sekunder = Math.floor(diff / 1000);
    const minutter = Math.floor(sekunder / 60);
    const timer = Math.floor(minutter / 60);
    const dager = Math.floor(timer / 24);
    
    if (dager > 0) return `${dager} dag${dager !== 1 ? 'er' : ''} siden`;
    if (timer > 0) return `${timer} time${timer !== 1 ? 'r' : ''} siden`;
    if (minutter > 0) return `${minutter} minutt${minutter !== 1 ? 'er' : ''} siden`;
    return 'Nettopp';
}

/**
 * Valider e-post
 * @param {string} email - E-post å validere
 * @returns {boolean} True hvis gyldig
 */
function validerEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Generer tilfeldig ID
 * @returns {string} Tilfeldig ID
 */
function genererID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce funksjon (forsinker utføring)
 * @param {Function} func - Funksjon å debounce
 * @param {number} wait - Ventetid i millisekunder
 * @returns {Function} Debounced funksjon
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Scroll til toppen av siden
 */
function scrollTilTopp() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Sjekk om brukeren er på mobil
 * @returns {boolean} True hvis mobil
 */
function erMobil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Sjekk om brukeren er online
 * @returns {boolean} True hvis online
 */
function erOnline() {
    return navigator.onLine;
}

/**
 * Vis toast-melding (enkel notification)
 * @param {string} melding - Melding å vise
 * @param {string} type - Type: 'success', 'error', 'info'
 */
function visToast(melding, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#34c759' : type === 'error' ? '#ff3b30' : '#0071e3'};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        animation: slideUp 0.3s ease;
    `;
    toast.innerText = melding;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Vibrer enhet (hvis støttet)
 * @param {number} duration - Varighet i millisekunder
 */
function vibrer(duration = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

/**
 * Lagre data til localStorage med error handling
 * @param {string} key - Nøkkel
 * @param {any} value - Verdi (blir JSON.stringify)
 * @returns {boolean} Success status
 */
function lagreTilLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('❌ Kunne ikke lagre til localStorage:', e);
        return false;
    }
}

/**
 * Hent data fra localStorage med error handling
 * @param {string} key - Nøkkel
 * @returns {any} Parsed verdi eller null
 */
function hentFraLocal(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('❌ Kunne ikke hente fra localStorage:', e);
        return null;
    }
}

/**
 * Slett data fra localStorage
 * @param {string} key - Nøkkel
 */
function slettFraLocal(key) {
    try {
        localStorage.removeItem(key);
        console.log('🗑️ Slettet fra localStorage:', key);
    } catch (e) {
        console.error('❌ Kunne ikke slette fra localStorage:', e);
    }
}

/**
 * Tøm all localStorage
 */
function tomLocalStorage() {
    if (confirm('Er du sikker på at du vil slette ALL data? Dette kan ikke angres!')) {
        localStorage.clear();
        alert('✅ All data slettet. Siden lastes inn på nytt.');
        window.location.reload();
    }
}

console.log('🛠️ helpers.js lastet');
/**
 * Anbefal appen (Share API)
 */
async function anbefalAppen() {
    const data = {
        title: 'GloseMester',
        text: 'Hei! Sjekk ut GloseMester - det er supergøy å lære gloser og samle kort! 🎮📚',
        url: window.location.href // Deler lenken til der du er nå
    };

    if (navigator.share) {
        // Bruk mobilens innebygde dele-meny
        try {
            await navigator.share(data);
            console.log('Deling vellykket');
        } catch (err) {
            console.log('Deling avbrutt');
        }
    } else {
        // Fallback for PC: Kopier lenke
        kopierTilClipboard(data.url);
        visToast('📋 Lenke kopiert til utklippstavlen!', 'success');
    }
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('UI', 'Anbefalte appen', 'Footer link');
    }
}