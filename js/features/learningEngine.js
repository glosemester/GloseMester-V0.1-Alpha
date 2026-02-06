/* ============================================
   LEARNING ENGINE - Leitner & Adaptive Difficulty
   GloseMester v2.0 - Phase 2: Pedagogy Features
   ============================================ */

import { getTotalCorrect } from '../core/storage.js';

// ============================================
// LEITNER SPACED REPETITION SYSTEM
// ============================================

/**
 * Implementerer Leitner-metodikk for spaced repetition
 * 5 bokser med økende intervaller mellom repetisjoner
 */
export class LeitnerSystem {
    constructor() {
        // Review intervals in days
        this.intervals = [1, 3, 7, 14, 30];

        // Box names for better UX
        this.boxNames = {
            1: 'Ny læring',
            2: 'Øver',
            3: 'God forståelse',
            4: 'Nesten mestret',
            5: 'Fullstendig mestret'
        };
    }

    /**
     * Beregn hvilken boks et ord skal flyttes til basert på svar
     * @param {boolean} isCorrect - Om svaret var riktig
     * @param {number} currentBox - Nåværende boks (1-5)
     * @returns {number} Ny boks (1-5)
     */
    moveCard(isCorrect, currentBox) {
        if (isCorrect && currentBox < 5) {
            // Riktig svar: Flytt opp én boks
            return currentBox + 1;
        } else if (!isCorrect && currentBox > 1) {
            // Feil svar: Flytt ned to bokser (raskere tilbake til start)
            return Math.max(1, currentBox - 2);
        }
        // Allerede i høyeste/laveste boks
        return currentBox;
    }

    /**
     * Finn ord som skal øves på i dag basert på sist repetisjon
     * @param {Array} vocabulary - Alle ord i nivået
     * @param {Object} userProgress - Brukerens progress-data
     * @returns {Array} Ord som skal øves på
     */
    getDueWords(vocabulary, userProgress) {
        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;

        return vocabulary.filter(word => {
            const wordId = this.getWordId(word);
            const progress = userProgress[wordId];

            // Nye ord skal alltid øves
            if (!progress || !progress.lastReview) {
                return true;
            }

            const daysSinceReview = (now - progress.lastReview) / oneDay;
            const requiredInterval = this.intervals[progress.box - 1];

            return daysSinceReview >= requiredInterval;
        });
    }

    /**
     * Generer unik ID for et ord
     * @param {Object} word - Ordbjekt med s (norsk) og e (engelsk)
     * @returns {string} Unik ID
     */
    getWordId(word) {
        // Bruk norsk+engelsk som unik nøkkel
        return `${word.s}_${word.e}`.toLowerCase().replace(/\s/g, '_');
    }

    /**
     * Hent navnet på en boks for visning
     * @param {number} box - Boksnummer (1-5)
     * @returns {string} Boksnavn
     */
    getBoxName(box) {
        return this.boxNames[box] || 'Ukjent';
    }

    /**
     * Beregn neste repetisjons-dato
     * @param {number} box - Boksnummer (1-5)
     * @returns {Date} Neste repetisjons-dato
     */
    getNextReviewDate(box) {
        const days = this.intervals[box - 1];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        return nextDate;
    }
}

// ============================================
// ADAPTIVE DIFFICULTY SYSTEM
// ============================================

/**
 * Tilpasser vanskelighetsgrad basert på brukerens prestasjon
 */
export class AdaptiveDifficulty {
    constructor() {
        this.maxHistory = 10; // Siste 10 svar brukes for å beregne suksessrate
        this.storageKey = 'glosemester_recent_performance';
        this.recentPerformance = this.loadFromStorage();
    }

    /**
     * Last inn tidligere prestasjoner fra localStorage
     * @returns {Array} Liste med boolean verdier (true = riktig, false = feil)
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Kunne ikke laste recent performance:', e);
        }
        return [];
    }

    /**
     * Lagre prestasjoner til localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recentPerformance));
        } catch (e) {
            console.warn('Kunne ikke lagre recent performance:', e);
        }
    }

    /**
     * Registrer et nytt svar
     * @param {boolean} isCorrect - Om svaret var riktig
     */
    recordAnswer(isCorrect) {
        this.recentPerformance.push(isCorrect);

        // Behold kun siste N svar
        if (this.recentPerformance.length > this.maxHistory) {
            this.recentPerformance.shift();
        }

        this.saveToStorage();
    }

    /**
     * Beregn suksessrate basert på siste svar
     * @returns {number} Suksessrate mellom 0 og 1
     */
    getSuccessRate() {
        if (this.recentPerformance.length === 0) {
            return 0.5; // Default: middels vanskelighet
        }

        const correctCount = this.recentPerformance.filter(x => x).length;
        return correctCount / this.recentPerformance.length;
    }

    /**
     * Bestem øvelsestype basert på prestasjon
     * @param {string} level - Nåværende nivå (niva1-niva4)
     * @returns {string} Øvelsestype ('multiple-choice' eller 'typing')
     */
    getExerciseType(level) {
        const rate = this.getSuccessRate();

        // Nivå 1-2: Alltid flervalg (som før)
        if (level === 'niva1' || level === 'niva2') {
            return 'multiple-choice';
        }

        // Nivå 4: Mye skriving (som før)
        if (level === 'niva4') {
            return Math.random() < 0.8 ? 'typing' : 'multiple-choice';
        }

        // Nivå 3: Adaptiv mix basert på prestasjon
        // Hvis brukeren sliter (< 50%), gi mer flervalg
        if (rate < 0.5) {
            return Math.random() < 0.7 ? 'multiple-choice' : 'typing';
        }

        // Hvis brukeren gjør det bra (> 70%), utfordre mer med skriving
        if (rate > 0.7) {
            return Math.random() < 0.7 ? 'typing' : 'multiple-choice';
        }

        // Middels prestasjon: 50/50
        return Math.random() < 0.5 ? 'typing' : 'multiple-choice';
    }

    /**
     * Bestem antall distraktorer (feil alternativer) i flervalg
     * @returns {number} Antall distraktorer (2-5)
     */
    getDistractorCount() {
        const rate = this.getSuccessRate();

        if (rate < 0.4) {
            return 2; // Lett: 3 alternativer totalt
        }

        if (rate > 0.7) {
            return 5; // Vanskelig: 6 alternativer totalt
        }

        return 3; // Normalt: 4 alternativer totalt
    }

    /**
     * Få tilbakemelding om nåværende prestasjon
     * @returns {Object} Status-objekt med rate og nivå
     */
    getPerformanceStatus() {
        const rate = this.getSuccessRate();
        let status = 'middels';
        let emoji = '😊';

        if (rate < 0.4) {
            status = 'utfordrende';
            emoji = '💪';
        } else if (rate > 0.7) {
            status = 'utmerket';
            emoji = '🌟';
        }

        return {
            rate,
            status,
            emoji,
            recentAnswers: this.recentPerformance.length
        };
    }

    /**
     * Nullstill prestasjonshistorikk (f.eks. ved nytt nivå)
     */
    reset() {
        this.recentPerformance = [];
        this.saveToStorage();
    }
}

// ============================================
// USER PROGRESS MANAGEMENT
// ============================================

/**
 * Hent brukerens progress-data fra localStorage
 * @returns {Object} Progress-objekt med wordId som nøkler
 */
export function getUserProgress() {
    try {
        const stored = localStorage.getItem('glosemester_user_progress');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Kunne ikke laste user progress:', e);
    }
    return {};
}

/**
 * Lagre brukerens progress-data til localStorage
 * @param {Object} progress - Progress-objekt
 */
export function saveUserProgress(progress) {
    try {
        localStorage.setItem('glosemester_user_progress', JSON.stringify(progress));
    } catch (e) {
        console.error('Kunne ikke lagre user progress:', e);
    }
}

/**
 * Oppdater progress for et spesifikt ord
 * @param {string} wordId - Unik ord-ID
 * @param {boolean} isCorrect - Om svaret var riktig
 * @param {number} currentBox - Nåværende boks (valgfritt)
 */
export function updateWordProgress(wordId, isCorrect, currentBox = null) {
    const progress = getUserProgress();
    const leitner = new LeitnerSystem();

    // Hent eller opprett progress for dette ordet
    const wordProgress = progress[wordId] || {
        id: wordId,
        box: 1,
        lastReview: null,
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        masteryLevel: 0,
        createdAt: Date.now()
    };

    // Oppdater statistikk
    wordProgress.reviewCount++;
    wordProgress.lastReview = Date.now();

    if (isCorrect) {
        wordProgress.correctCount++;
        wordProgress.streak++;
    } else {
        wordProgress.incorrectCount++;
        wordProgress.streak = 0;
    }

    // Beregn mastery level (0-1)
    wordProgress.masteryLevel = wordProgress.correctCount / wordProgress.reviewCount;

    // Flytt til ny boks
    const oldBox = currentBox || wordProgress.box;
    wordProgress.box = leitner.moveCard(isCorrect, oldBox);

    // Lagre tilbake
    progress[wordId] = wordProgress;
    saveUserProgress(progress);

    return wordProgress;
}

/**
 * Hent statistikk for et ord
 * @param {string} wordId - Unik ord-ID
 * @returns {Object|null} Progress-data eller null
 */
export function getWordStats(wordId) {
    const progress = getUserProgress();
    return progress[wordId] || null;
}

/**
 * Nullstill all progress (bruk med forsiktighet!)
 */
export function resetAllProgress() {
    if (confirm('Er du sikker på at du vil nullstille all læringsprogress?')) {
        localStorage.removeItem('glosemester_user_progress');
        localStorage.removeItem('glosemester_recent_performance');
        return true;
    }
    return false;
}

// ============================================
// ACTIVITY TRACKING
// ============================================

/**
 * Registrer aktivitet for dagens dato
 */
export function recordDailyActivity() {
    const activityKey = 'glosemester_activity_log';
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const stored = localStorage.getItem(activityKey);
        const log = stored ? JSON.parse(stored) : {};

        // Inkrementer dagens aktivitet
        log[today] = (log[today] || 0) + 1;

        localStorage.setItem(activityKey, JSON.stringify(log));
    } catch (e) {
        console.warn('Kunne ikke registrere aktivitet:', e);
    }
}

/**
 * Hent aktivitetslogg
 * @returns {Object} Aktivitetslogg med timestamp som nøkler
 */
export function getActivityLog() {
    try {
        const stored = localStorage.getItem('glosemester_activity_log');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.warn('Kunne ikke hente aktivitetslogg:', e);
        return {};
    }
}
