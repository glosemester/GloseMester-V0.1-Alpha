/* ============================================
   FEEDBACK.JS - User feedback utilities
   Toast notifications, vibration, text-to-speech
   Mester Suite v2.0
   ============================================ */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
export function visToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.mester-toast');
    existingToasts.forEach(toast => toast.remove());

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `mester-toast mester-toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    // Color based on type
    const colors = {
        success: 'var(--sunny-yellow, #FBBF24)',
        error: '#EF4444',
        warning: 'var(--vibrant-orange, #FB923C)',
        info: 'var(--primary-purple, #7C3AED)'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: white;
        color: var(--text-dark, #1F2937);
        padding: 16px 24px;
        border-radius: var(--radius-xl, 50px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10001;
        font-family: var(--font-body, system-ui);
        font-weight: 600;
        font-size: 16px;
        border-left: 4px solid ${colors[type]};
        animation: slideDown 0.3s ease-out forwards;
    `;

    // Add animation styles
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
            }
            .toast-icon {
                font-size: 24px;
            }
            .toast-message {
                line-height: 1.4;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Vibrate device (if supported)
 * @param {number|Array} pattern - Vibration pattern in milliseconds
 */
export function vibrer(pattern = 200) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/**
 * Read text aloud using Web Speech API
 * @param {string} text - Text to read
 * @param {string} lang - Language code (e.g., 'no-NO', 'en-US')
 * @param {number} rate - Speech rate (0.1 to 10, default 1)
 */
export function lesOpp(text, lang = 'no-NO', rate = 1) {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        visToast('Text-to-speech er ikke støttet i denne nettleseren', 'warning');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Speak
    window.speechSynthesis.speak(utterance);
}

/**
 * Create a speaker button for text-to-speech
 * @param {string} text - Text to read
 * @param {string} lang - Language code
 * @returns {string} HTML for speaker button
 */
export function createSpeakerButton(text, lang = 'no-NO') {
    return `
        <div class="speaker-btn"
             onclick="event.stopPropagation(); window.MesterUtils.lesOpp('${text.replace(/'/g, "\\'")}', '${lang}')"
             style="font-size: 1.3rem; cursor: pointer; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
            🔊
        </div>
    `;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.MesterUtils = window.MesterUtils || {};
    window.MesterUtils.visToast = visToast;
    window.MesterUtils.vibrer = vibrer;
    window.MesterUtils.lesOpp = lesOpp;
    window.MesterUtils.createSpeakerButton = createSpeakerButton;
}

console.log('📢 Feedback utilities loaded');
