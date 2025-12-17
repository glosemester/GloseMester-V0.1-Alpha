// ============================================
// HELPERS.JS - GloseMester v1.0
// Lyd, Vibrasjon og UI-verktøy
// ============================================

// --- LYD MOTOR ---
const lyder = {
    riktig: new Audio('sounds/correct.mp3'),
    feil: new Audio('sounds/wrong.mp3'),
    vinn: new Audio('sounds/win.mp3'),
    klikk: new Audio('sounds/pop.mp3'),
    fanfare: new Audio('sounds/fanfare.mp3') // Ny lyd for "Legendary"
};

// Preload lyder
Object.values(lyder).forEach(lyd => {
    lyd.load();
    lyd.volume = 0.5;
});

export function spillLyd(type) {
    if (lyder[type]) {
        lyder[type].currentTime = 0;
        lyder[type].play().catch(() => {}); // Ignorer feil hvis bruker ikke har interagert
    }
}

// --- HAPTISK FEEDBACK (Vibrasjon) ---
export function vibrer(monster = [50]) {
    if (navigator.vibrate) {
        navigator.vibrate(monster);
    }
}

// --- UI HJELPERE ---
export function visToast(melding, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = melding;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? '#10B981' : '#333'};
        color: white; padding: 12px 24px; border-radius: 50px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999;
        animation: slideUp 0.3s ease; font-weight: 600;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function lesOpp(tekst, sprak = 'nb-NO') {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const tale = new SpeechSynthesisUtterance(tekst);
        tale.lang = sprak;
        window.speechSynthesis.speak(tale);
    }
}

export function lagConfetti() {
    // Enkel CSS/JS confetti (kan byttes med bibliotek senere)
    for(let i=0; i<30; i++) {
        const c = document.createElement('div');
        c.style.cssText = `
            position: fixed; top: 50%; left: 50%; width: 10px; height: 10px;
            background: ${['#f00','#0f0','#00f','#ff0'][Math.floor(Math.random()*4)]};
            pointer-events: none; z-index: 9999;
            transform: translate(-50%, -50%);
            animation: confetti 1s ease-out forwards;
        `;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 1000);
    }
}