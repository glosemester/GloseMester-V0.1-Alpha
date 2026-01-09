/* ============================================
   HELPERS.JS - UI og Lyd
   Oppdatert: Menylyder er mutet, kun tale fungerer.
   ============================================ */

const sounds = {};
// Vi setter denne til true slik at lesOpp virker, 
// men vi stopper selve lydeffektene manuelt i funksjonen under.
let lydErPaa = true; 

export function initSoundSystem() {
    // Vi laster fortsatt lydene i tilfelle du vil skru dem på senere,
    // men vi spiller dem ikke av nå.
    const soundList = [
        { id: 'klikk', src: 'sounds/pop.mp3' },
        { id: 'riktig', src: 'sounds/correct.mp3' },
        { id: 'feil', src: 'sounds/wrong.mp3' },
        { id: 'vinn', src: 'sounds/win.mp3' },
        { id: 'fanfare', src: 'sounds/fanfare.mp3' }
    ];

    soundList.forEach(s => {
        const audio = new Audio(s.src);
        audio.preload = 'auto';
        sounds[s.id] = audio;
    });

    // Lytter til mute-knappen
    const toggleBtn = document.getElementById('lyd-toggle');
    if(toggleBtn) {
        toggleBtn.onclick = () => {
            lydErPaa = !lydErPaa;
            toggleBtn.innerText = lydErPaa ? '🔊' : '🔇';
            toggleBtn.style.opacity = lydErPaa ? '1' : '0.5';
        };
    }
}

export function spillLyd(navn) {
    // --- MIDLERTIDIG MUTET ---
    // Hvis du vil ha tilbake menylyder senere, fjern // foran linjene under:
    
    // if (!lydErPaa || !sounds[navn]) return;
    // sounds[navn].currentTime = 0;
    // sounds[navn].play().catch(e => console.warn(e));
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
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Tale-funksjonen fungerer fortsatt som normalt!
export function lesOpp(tekst, lang = 'en-US') {
    if (!lydErPaa) return; // Respekterer hoved-mute knappen
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stopp forrige lyd

    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

export function lagConfetti() {
    // (Beholdes som før, men lager ikke lyd nå siden spillLyd er tom)
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