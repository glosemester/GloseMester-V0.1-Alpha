// ============================================
// HELPERS.JS - UI & Audio
// ============================================

export function spillLyd(navn) {
    // VIKTIG ENDRING: Sjekk global lyd-bryter
    if (window.appLydErPaa === false) return;

    const lyder = {
        'riktig': 'sounds/correct.mp3',
        'feil': 'sounds/wrong.mp3',
        'vinn': 'sounds/win.mp3',
        'klikk': 'sounds/pop.mp3',
        'fanfare': 'sounds/fanfare.mp3'
    };

    if (lyder[navn]) {
        const audio = new Audio(lyder[navn]);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Lydfeil (autoplay?):", e));
    }
}

export function vibrer(monster) {
    if (navigator.vibrate) {
        navigator.vibrate(monster);
    }
}

export function visToast(melding, type = "info") {
    // ... din eksisterende toast kode (eller standard under) ...
    const container = document.getElementById('toast-container') || opprettToastContainer();
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;
    div.innerText = melding;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function opprettToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:9999;";
    document.body.appendChild(div);
    return div;
}

export function lesOpp(tekst, lang) {
    if (window.appLydErPaa === false) return; // Også mute TTS hvis ønskelig

    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(tekst);
        u.lang = lang;
        window.speechSynthesis.speak(u);
    }
}

export function lagConfetti() {
    // (Enkel confetti implementasjon - eller behold din eksisterende hvis du har bibliotek)
    import('https://cdn.skypack.dev/canvas-confetti').then(module => {
        module.default();
    }).catch(e => console.log("Confetti ikke lastet", e));
}