/* ============================================
   RATE-LIMITER.JS - Forhindre misbruk av API
   Versjon: 1.0.0
   Dato: 16. januar 2026
   ============================================ */

/**
 * RateLimiter klasse for å begrense antall handlinger per tidsvindu
 */
export class RateLimiter {
    /**
     * @param {number} maxAttempts - Maksimalt antall forsøk
     * @param {number} windowMs - Tidsvindu i millisekunder
     */
    constructor(maxAttempts, windowMs) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.storageKey = 'glosemester_rate_limit_data';
    }

    /**
     * Sjekker om en handling er tillatt
     * @param {string} action - Navn på handlingen (f.eks. 'practice_answer')
     * @returns {Object} - { allowed: boolean, remaining?: number, resetTime?: Date, remainingMs?: number }
     */
    check(action) {
        const now = Date.now();
        const data = this.getData();

        // Filtrer ut gamle forsøk utenfor tidsvinduet
        const recentAttempts = (data[action] || []).filter(
            timestamp => now - timestamp < this.windowMs
        );

        // Sjekk om grense er nådd
        if (recentAttempts.length >= this.maxAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const resetTime = new Date(oldestAttempt + this.windowMs);

            return {
                allowed: false,
                resetTime: resetTime,
                remainingMs: (oldestAttempt + this.windowMs) - now,
                message: this.getBlockMessage(action, resetTime)
            };
        }

        // Legg til nytt forsøk
        recentAttempts.push(now);
        data[action] = recentAttempts;
        this.saveData(data);

        return {
            allowed: true,
            remaining: this.maxAttempts - recentAttempts.length
        };
    }

    /**
     * Nullstiller rate limit for en spesifikk handling
     * @param {string} action - Navn på handlingen
     */
    reset(action) {
        const data = this.getData();
        delete data[action];
        this.saveData(data);
    }

    /**
     * Nullstiller alle rate limits
     */
    resetAll() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Henter rate limit data fra localStorage
     * @returns {Object}
     */
    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch (error) {
            console.error('Rate limiter data parsing error:', error);
            return {};
        }
    }

    /**
     * Lagrer rate limit data til localStorage
     * @param {Object} data
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Rate limiter data saving error:', error);
        }
    }

    /**
     * Genererer bruker-vennlig blokkerings-melding
     * @param {string} action
     * @param {Date} resetTime
     * @returns {string}
     */
    getBlockMessage(action, resetTime) {
        const minutter = Math.ceil((resetTime - Date.now()) / 60000);

        const messages = {
            'practice_answer': `Du har svart på mange spørsmål! Ta en pause i ${minutter} minutter.`,
            'card_reward': `Du har mottatt mange kort! Kom tilbake om ${minutter} minutter for flere.`,
            'test_save': `Du har lagret mange prøver! Vent ${minutter} minutter før neste.`,
            'school_inquiry': `Du har sendt en forespørsel. Vennligst vent på svar før du sender flere.`
        };

        return messages[action] || `Vennligst vent ${minutter} minutter før du prøver igjen.`;
    }

    /**
     * Henter statistikk for en handling
     * @param {string} action
     * @returns {Object}
     */
    getStats(action) {
        const now = Date.now();
        const data = this.getData();
        const attempts = (data[action] || []).filter(
            timestamp => now - timestamp < this.windowMs
        );

        return {
            totalAttempts: attempts.length,
            maxAttempts: this.maxAttempts,
            remaining: Math.max(0, this.maxAttempts - attempts.length),
            windowMs: this.windowMs,
            nextReset: attempts.length > 0
                ? new Date(Math.min(...attempts) + this.windowMs)
                : null
        };
    }
}

// ============================================
// FORHÅNDSKONFIGURERTE LIMITERS
// ============================================

/**
 * Limiter for øvingssvar - maks 100 per 10 minutter
 * Forhindrer spam av svar for å generere kort
 */
export const practiceLimiter = new RateLimiter(100, 10 * 60 * 1000);

/**
 * Limiter for prøvesvar - maks 50 per 10 minutter
 * Forhindrer spam av prøvegjennomføringer
 */
export const testLimiter = new RateLimiter(50, 10 * 60 * 1000);

/**
 * Limiter for kort-belønninger - maks 20 kort per time
 * Forhindrer uendelig generering av kort
 */
export const cardLimiter = new RateLimiter(20, 60 * 60 * 1000);

/**
 * Limiter for prøvelagring - maks 10 prøver per time
 * Forhindrer spam av prøveoppretting
 */
export const testSaveLimiter = new RateLimiter(10, 60 * 60 * 1000);

/**
 * Limiter for skolepakke-forespørsler - maks 3 per dag
 * Forhindrer spam av skolepakke-forespørsler
 */
export const schoolInquiryLimiter = new RateLimiter(3, 24 * 60 * 60 * 1000);

// ============================================
// UTILITY FUNKSJONER
// ============================================

/**
 * Sjekker om bruker er i "cooldown" for noen handlinger
 * @returns {Array} - Liste over aktive cooldowns
 */
export function getActiveCooldowns() {
    const limiters = {
        'Øving': practiceLimiter,
        'Prøver': testLimiter,
        'Kort': cardLimiter,
        'Prøvelagring': testSaveLimiter,
        'Skolepakke': schoolInquiryLimiter
    };

    const cooldowns = [];

    for (const [name, limiter] of Object.entries(limiters)) {
        const stats = limiter.getStats(name.toLowerCase());
        if (stats.remaining === 0 && stats.nextReset) {
            cooldowns.push({
                name,
                resetTime: stats.nextReset,
                remainingMs: stats.nextReset - Date.now()
            });
        }
    }

    return cooldowns;
}

/**
 * Viser cooldown-status i konsollen (for debugging)
 */
export function logRateLimitStatus() {
    console.group('🔒 Rate Limit Status');

    const checks = [
        { name: 'Øving (100/10min)', limiter: practiceLimiter, action: 'practice' },
        { name: 'Prøver (50/10min)', limiter: testLimiter, action: 'test' },
        { name: 'Kort (20/time)', limiter: cardLimiter, action: 'card' },
        { name: 'Prøvelagring (10/time)', limiter: testSaveLimiter, action: 'test_save' },
        { name: 'Skolepakke (3/dag)', limiter: schoolInquiryLimiter, action: 'school_inquiry' }
    ];

    checks.forEach(({ name, limiter, action }) => {
        const stats = limiter.getStats(action);
        // Stats available via getStats()
    });

    console.groupEnd();
}

// Eksporter for bruk i andre moduler
export default {
    RateLimiter,
    practiceLimiter,
    testLimiter,
    cardLimiter,
    testSaveLimiter,
    schoolInquiryLimiter,
    getActiveCooldowns,
    logRateLimitStatus
};
