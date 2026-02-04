/* ============================================
   FEEDBACK.JS - Rich Feedback System v2.0
   Konfetti-feiringer, kontekstuelle hint, og lydeffekter
   ============================================ */

// ============================================
// CONFETTI CELEBRATION SYSTEM
// ============================================

/**
 * Kanonisk confetti-funksjon med konfetti.js
 * Brukes ved milep\u00e6ler som mestringsniv\u00e5 opp
 */
export function viererConfetti(type = 'standard') {
    if (typeof confetti === 'undefined') {
        console.warn('confetti.js er ikke lastet');
        return;
    }

    const configs = {
        standard: {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        },
        celebration: {
            particleCount: 150,
            spread: 120,
            origin: { y: 0.7 },
            colors: ['#7c3aed', '#ec4899', '#06b6d4', '#10b981']
        },
        milestone: {
            particleCount: 200,
            spread: 160,
            origin: { y: 0.8 },
            ticks: 200,
            gravity: 0.8,
            colors: ['#fbbf24', '#f59e0b', '#fcd34d']
        },
        subtle: {
            particleCount: 50,
            spread: 40,
            origin: { y: 0.5 }
        }
    };

    const config = configs[type] || configs.standard;
    confetti(config);

    // Ekstra burst for milestone
    if (type === 'milestone') {
        setTimeout(() => confetti(config), 200);
        setTimeout(() => confetti(config), 400);
    }
}

/**
 * Mini-konfetti for mindre prestasjoner (CSS-basert, ingen avhengighet)
 */
export function visMiniConfetti(x, y) {
    const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#fbbf24'];

    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
        `;

        document.body.appendChild(particle);

        // Animasjon
        const angle = (Math.random() * Math.PI * 2);
        const velocity = 2 + Math.random() * 3;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity - 5; // Start opp

        let posX = x;
        let posY = y;
        let velocityY = dy;

        const animate = () => {
            posX += dx;
            posY += velocityY;
            velocityY += 0.3; // Gravitasjon

            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = Math.max(0, 1 - (posY - y) / 200);

            if (posY < window.innerHeight && particle.style.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };

        requestAnimationFrame(animate);
    }
}

// ============================================
// CONTEXTUAL HINT SYSTEM
// ============================================

/**
 * Vis hint for et ord (f\u00f8rste bokstav, lengde, bilde)
 * @param {Object} word - Ordbjekt med s og e
 * @param {string} direction - 'no' eller 'en'
 * @param {number} hintLevel - Hint-niv\u00e5 (1-3)
 * @returns {string} HTML for hint
 */
export function genererHint(word, direction, hintLevel = 1) {
    const targetWord = direction === 'no' ? word.e : word.s;
    const hints = [];

    if (hintLevel >= 1) {
        // Hint 1: F\u00f8rste bokstav
        hints.push(`F\u00f8rste bokstav: <strong>${targetWord[0].toUpperCase()}</strong>`);
    }

    if (hintLevel >= 2) {
        // Hint 2: Lengde
        hints.push(`Antall bokstaver: <strong>${targetWord.length}</strong>`);
    }

    if (hintLevel >= 3) {
        // Hint 3: Bokstaver med mellomrom
        const masked = targetWord
            .split('')
            .map((char, i) => i === 0 || char === ' ' ? char : '_')
            .join(' ');
        hints.push(`Ord: <strong>${masked}</strong>`);
    }

    return `
        <div class="hint-container" style="
            background: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 10px 0;
            border-radius: var(--border-radius-sm);
        ">
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">💡 Hint:</div>
            ${hints.map(h => `<div style="margin: 5px 0;">${h}</div>`).join('')}
        </div>
    `;
}

/**
 * Vis hint i feil-popup
 * @param {Object} word - Ordbjekt
 * @param {string} direction - Spr\u00e5kretning
 */
export function visHintIPopup(word, direction) {
    const popup = document.getElementById('feil-svar-popup');
    if (!popup) return;

    let hintContainer = popup.querySelector('.hint-container-popup');
    if (!hintContainer) {
        hintContainer = document.createElement('div');
        hintContainer.className = 'hint-container-popup';
        popup.querySelector('.popup-content')?.appendChild(hintContainer);
    }

    const currentHintLevel = parseInt(hintContainer.dataset.hintLevel || '0') + 1;
    hintContainer.dataset.hintLevel = currentHintLevel;

    hintContainer.innerHTML = genererHint(word, direction, Math.min(currentHintLevel, 3));
}

// ============================================
// VISUAL FEEDBACK ANIMATIONS
// ============================================

/**
 * Flash-animasjon for riktig/feil svar
 * @param {HTMLElement} element - Element \u00e5 animere
 * @param {boolean} isCorrect - Om svaret var riktig
 */
export function flashElement(element, isCorrect) {
    if (!element) return;

    const color = isCorrect ? '#10b981' : '#ef4444';
    const originalBg = element.style.background;

    element.style.transition = 'background 0.2s ease';
    element.style.background = color + '22'; // 22 = 13% opacity

    setTimeout(() => {
        element.style.background = originalBg;
    }, 300);
}

/**
 * Puls-animasjon for spesiell oppmerksomhet
 * @param {HTMLElement} element - Element \u00e5 animere
 */
export function pulseElement(element) {
    if (!element) return;

    element.style.animation = 'pulse-feedback 0.5s ease';

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Legg til pulse keyframe hvis ikke finnes
if (!document.getElementById('feedback-animations-style')) {
    const style = document.createElement('style');
    style.id = 'feedback-animations-style';
    style.textContent = `
        @keyframes pulse-feedback {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
            100% { transform: scale(1); }
        }
        
        @keyframes shake-feedback {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Shake-animasjon for feil svar
 * @param {HTMLElement} element - Element \u00e5 shake
 */
export function shakeElement(element) {
    if (!element) return;

    element.style.animation = 'shake-feedback 0.4s ease';

    setTimeout(() => {
        element.style.animation = '';
    }, 400);
}

// ============================================
// MOTIVATIONAL MESSAGES
// ============================================

const motivationalMessages = {
    correct: [
        '✨ Flott jobba!',
        '🌟 Helt riktig!',
        '🎯 Perfekt!',
        '💪 Kjempebra!',
        '🔥 Du er p\u00e5 topp!',
        '⚡ Imponerende!',
        '🎊 Strålende!'
    ],
    incorrect: [
        '💭 Ikke gi opp!',
        '🌱 Du l\u00e6rer!',
        '💡 Pr\u00f8v igjen!',
        '🎯 Nesten der!',
        '🌈 \u00d8ving gj\u00f8r mester!',
        '⭐ Du klarer dette!'
    ],
    milestone: [
        '🏆 Du er en mester!',
        '👑 Fantastisk fremgang!',
        '🌟 Utrolig prestasjon!',
        '💎 Du skinner!',
        '🎉 Milep\u00e6l n\u00e5dd!'
    ]
};

/**
 * Hent tilfeldig motiverende melding
 * @param {string} type - 'correct', 'incorrect', eller 'milestone'
 * @returns {string} Motiverende melding
 */
export function hentMotivasjon(type = 'correct') {
    const messages = motivationalMessages[type] || motivationalMessages.correct;
    return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// PROGRESS CELEBRATIONS
// ============================================

/**
 * Feir milep\u00e6ler (10 riktige, ny boks, etc.)
 * @param {string} type - Type milep\u00e6l ('streak', 'levelup', 'mastery')
 * @param {Object} data - Data om milep\u00e6len
 */
export function feirMilepal(type, data = {}) {
    const celebrations = {
        streak: () => {
            viererConfetti('celebration');
            return {
                title: `🔥 ${data.count || 10} p\u00e5 rad!`,
                message: 'Du er p\u00e5 g\u00e5 fyr!',
                duration: 3000
            };
        },
        levelup: () => {
            viererConfetti('milestone');
            return {
                title: `🎉 Niv\u00e5 ${data.newBox || 2}!`,
                message: `${data.boxName || 'God forst\u00e5else'}`,
                duration: 4000
            };
        },
        mastery: () => {
            viererConfetti('milestone');
            return {
                title: '🏆 MESTRET!',
                message: 'Ordet er fullstendig mestret!',
                duration: 5000
            };
        }
    };

    const celebration = celebrations[type]?.();
    if (!celebration) return;

    // Vis feiring-overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px 40px;
        border-radius: var(--border-radius-card);
        box-shadow: var(--shadow-lifted);
        z-index: 10000;
        text-align: center;
        animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    overlay.innerHTML = `
        <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color); margin-bottom: 10px;">
            ${celebration.title}
        </div>
        <div style="font-size: 1.1rem; color: #666;">
            ${celebration.message}
        </div>
    `;

    document.body.appendChild(overlay);

    // Fjern etter duration
    setTimeout(() => {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }, celebration.duration);
}

// Legg til slideInScale animation
const existingStyle = document.getElementById('feedback-animations-style');
if (existingStyle) {
    existingStyle.textContent += `
        @keyframes slideInScale {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
}

// ============================================
// AUDIO FEEDBACK VARIATIONS
// ============================================

/**
 * Spill varierte suksess-lyder basert p\u00e5 streak
 * @param {number} streak - N\u00e5v\u00e6rende streak
 */
export function spillSuksessLyd(streak = 0) {
    if (streak >= 10) {
        // Episk lyd for lange streaks
        spillLyd('vinn'); // Eksisterende vinn-lyd
    } else if (streak >= 5) {
        // Mellomn\u00e5v\u00e5 lyd
        spillLyd('riktig');
    } else {
        // Standard riktig-lyd
        spillLyd('riktig');
    }
}

/**
 * Importer spillLyd fra helpers (hvis ikke allerede tilgjengelig)
 */
function spillLyd(type) {
    if (window.spillLyd && typeof window.spillLyd === 'function') {
        window.spillLyd(type);
    }
}
