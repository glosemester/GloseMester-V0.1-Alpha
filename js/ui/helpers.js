/* ============================================
   HELPERS.JS - UI Verktøy
   ============================================ */

let lydErPaa = true;

export function initSoundSystem() {
    // Lyd-toggle styrer kun tale (TTS)
    const toggleBtn = document.getElementById('lyd-toggle');
    if(toggleBtn) {
        toggleBtn.onclick = () => {
            lydErPaa = !lydErPaa;
            toggleBtn.innerText = lydErPaa ? '🔊' : '🔇';
            toggleBtn.style.opacity = lydErPaa ? '1' : '0.5';
        };
    }
}

const LYDER = {
    riktig:  new Audio('sounds/correct.mp3'),
    feil:    new Audio('sounds/wrong.mp3'),
    pop:     new Audio('sounds/pop.mp3'),
    win:     new Audio('sounds/win.mp3'),
    fanfare: new Audio('sounds/fanfare.mp3')
};

export function spillLyd(type = 'riktig') {
    if (!lydErPaa) return;
    const lyd = LYDER[type];
    if (!lyd) return;
    lyd.currentTime = 0;
    lyd.play().catch(() => {});
}

export function vibrer(ms) {
    if (navigator.vibrate) {
        navigator.vibrate(ms);
    }
}

export function visToast(melding, type = 'info') {
    const gammel = document.querySelector('.toast');
    if(gammel) gammel.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = melding;

    toast.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function lesOpp(tekst, lang = 'en-US') {
    if (!lydErPaa) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

export function lagConfetti() {
    const colors = ['#ffc107', '#ff3b30', '#0071e3', '#34c759', '#af52de'];
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';

        const duration = Math.random() * 2 + 1;
        confetti.style.transition = `top ${duration}s linear, transform ${duration}s ease-in-out`;

        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = '110vh';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        }, 10);

        setTimeout(() => confetti.remove(), duration * 1000);
    }
}

/**
 * Saniterer brukerinput for å forhindre XSS-angrep
 */
export function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Debounce funksjon
 */
export function debounce(func, wait = 300) {
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
