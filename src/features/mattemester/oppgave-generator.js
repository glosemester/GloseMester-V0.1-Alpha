/* ============================================
   OPPGAVE-GENERATOR.JS - MatteMester v2.0
   Generates math problems for all levels
   ============================================ */

/**
 * Configuration organized by operation type, then by grade level
 * Aligned with LK20 curriculum
 */
export const OPPGAVE_CONFIG = {
    pluss: {
        name: 'Pluss',
        emoji: '➕',
        type: 'addisjon',
        nivåer: {
            niva1: {
                name: 'Nivå 1 - Pluss',
                description: '1.-2. trinn',
                tallområde: [1, 20],
                strategi: 'enkle',
                lk20: ['K1-02']
            },
            niva2: {
                name: 'Nivå 2 - Pluss',
                description: '3.-5. trinn',
                tallområde: [1, 100],
                strategi: 'medium',
                lk20: ['K2-01', 'K3-01']
            },
            niva3: {
                name: 'Nivå 3 - Pluss',
                description: '6.-8. trinn',
                tallområde: [1, 1000],
                strategi: 'avansert',
                medDesimal: true,
                lk20: ['K4-01', 'K5-01']
            }
        }
    },
    minus: {
        name: 'Minus',
        emoji: '➖',
        type: 'subtraksjon',
        nivåer: {
            niva1: {
                name: 'Nivå 1 - Minus',
                description: '1.-2. trinn',
                tallområde: [1, 20],
                strategi: 'enkle',
                lk20: ['K1-03']
            },
            niva2: {
                name: 'Nivå 2 - Minus',
                description: '3.-5. trinn',
                tallområde: [1, 100],
                strategi: 'medium',
                lk20: ['K2-02', 'K3-02']
            },
            niva3: {
                name: 'Nivå 3 - Minus',
                description: '6.-8. trinn',
                tallområde: [1, 1000],
                strategi: 'avansert',
                medDesimal: true,
                lk20: ['K4-02', 'K5-02']
            }
        }
    },
    gange: {
        name: 'Gange',
        emoji: '✖️',
        type: 'multiplikasjon',
        nivåer: {
            niva1: {
                name: 'Nivå 1 - Gange',
                description: '1.-2. trinn',
                gangetabellTil: 5,
                faktorMaks: 10,
                strategi: 'enkle',
                lk20: ['K2-04']
            },
            niva2: {
                name: 'Nivå 2 - Gange',
                description: '3.-5. trinn',
                gangetabellTil: 10,
                faktorMaks: 12,
                strategi: 'medium',
                lk20: ['K3-03', 'K4-03']
            },
            niva3: {
                name: 'Nivå 3 - Gange',
                description: '6.-8. trinn',
                gangetabellTil: 12,
                faktorMaks: 100,
                strategi: 'avansert',
                medDesimal: true,
                lk20: ['K5-03', 'K6-03']
            }
        }
    },
    dele: {
        name: 'Dele',
        emoji: '➗',
        type: 'divisjon',
        nivåer: {
            niva1: {
                name: 'Nivå 1 - Dele',
                description: '1.-2. trinn',
                divisorMaks: 5,
                kvotientMaks: 10,
                kunHeltall: true,
                strategi: 'enkle',
                lk20: ['K2-05']
            },
            niva2: {
                name: 'Nivå 2 - Dele',
                description: '3.-5. trinn',
                divisorMaks: 10,
                kvotientMaks: 12,
                kunHeltall: true,
                strategi: 'medium',
                lk20: ['K3-04', 'K4-04']
            },
            niva3: {
                name: 'Nivå 3 - Dele',
                description: '6.-8. trinn',
                divisorMaks: 12,
                kvotientMaks: 100,
                kunHeltall: false,
                medDesimal: true,
                strategi: 'avansert',
                lk20: ['K5-04', 'K6-04']
            }
        }
    }
};

/**
 * Oppgave Generator - Main class
 */
export class OppgaveGenerator {
    /**
     * Generate a random math problem
     * @param {string} operasjon - Operation type (pluss, minus, gange, dele)
     * @param {string} nivå - Sub-level (niva1, niva2, niva3)
     * @returns {Object} Problem object
     */
    static genererOppgave(operasjon, nivå) {
        const kategori = OPPGAVE_CONFIG[operasjon];

        if (!kategori) {
            throw new Error(`Invalid operation: ${operasjon}`);
        }

        const config = kategori.nivåer[nivå];

        if (!config) {
            throw new Error(`Invalid level: ${nivå} for operation: ${operasjon}`);
        }

        // Generate problem based on operation type
        switch (operasjon) {
            case 'pluss':
                return this.genererAddisjon(config, kategori);
            case 'minus':
                return this.genererSubtraksjon(config, kategori);
            case 'gange':
                return this.genererMultiplikasjon(config, kategori);
            case 'dele':
                return this.genererDivisjon(config, kategori);
            default:
                return this.genererAddisjon(config, kategori);
        }
    }

    // ==================== PROBLEM GENERATORS ====================

    /**
     * Addition problems
     * @param {Object} config - Level config
     * @param {Object} kategori - Category config
     */
    static genererAddisjon(config, kategori) {
        const [min, max] = config.tallområde;

        // For decimals (nivå 3)
        if (config.medDesimal && Math.random() > 0.5) {
            const a = this.tilfeldigDesimal(min, max / 2, 1);
            const b = this.tilfeldigDesimal(min, max / 2, 1);
            const svar = parseFloat((a + b).toFixed(1));

            return {
                spørsmål: `${a} + ${b}`,
                svar,
                type: 'addisjon',
                operasjon: 'pluss',
                nivå: config.name,
                vanskelighetsgrad: this.beregnVanskelighetsgrad(a, b),
                forklaring: `${a} + ${b} = ${svar}`
            };
        }

        // Regular addition
        const a = this.tilfeldigTall(min, Math.floor(max / 2));
        const b = this.tilfeldigTall(min, Math.floor(max / 2));

        return {
            spørsmål: `${a} + ${b}`,
            svar: a + b,
            type: 'addisjon',
            operasjon: 'pluss',
            nivå: config.name,
            vanskelighetsgrad: this.beregnVanskelighetsgrad(a, b),
            forklaring: `${a} + ${b} = ${a + b}`
        };
    }

    /**
     * Subtraction problems (ensuring positive results)
     * @param {Object} config - Level config
     * @param {Object} kategori - Category config
     */
    static genererSubtraksjon(config, kategori) {
        const [min, max] = config.tallområde;

        // For decimals (nivå 3)
        if (config.medDesimal && Math.random() > 0.5) {
            const a = this.tilfeldigDesimal(min + 5, max, 1);
            const b = this.tilfeldigDesimal(min, a, 1);
            const svar = parseFloat((a - b).toFixed(1));

            return {
                spørsmål: `${a} − ${b}`,
                svar,
                type: 'subtraksjon',
                operasjon: 'minus',
                nivå: config.name,
                vanskelighetsgrad: this.beregnVanskelighetsgrad(a, b),
                forklaring: `${a} − ${b} = ${svar}`
            };
        }

        // Regular subtraction
        const a = this.tilfeldigTall(min + 5, max);
        const b = this.tilfeldigTall(min, a);

        return {
            spørsmål: `${a} − ${b}`,
            svar: a - b,
            type: 'subtraksjon',
            operasjon: 'minus',
            nivå: config.name,
            vanskelighetsgrad: this.beregnVanskelighetsgrad(a, b),
            forklaring: `${a} − ${b} = ${a - b}`
        };
    }

    /**
     * Multiplication problems
     * @param {Object} config - Level config
     * @param {Object} kategori - Category config
     */
    static genererMultiplikasjon(config, kategori) {
        const a = this.tilfeldigTall(1, config.gangetabellTil);
        const b = this.tilfeldigTall(1, config.faktorMaks);

        return {
            spørsmål: `${a} × ${b}`,
            svar: a * b,
            type: 'multiplikasjon',
            operasjon: 'gange',
            nivå: config.name,
            vanskelighetsgrad: Math.max(a, b) > 10 ? 4 : 3,
            forklaring: `${a} × ${b} = ${a * b}`
        };
    }

    /**
     * Division problems
     * @param {Object} config - Level config
     * @param {Object} kategori - Category config
     */
    static genererDivisjon(config, kategori) {
        const divisor = this.tilfeldigTall(2, config.divisorMaks);
        const quotient = this.tilfeldigTall(2, config.kvotientMaks);
        const dividend = divisor * quotient;

        return {
            spørsmål: `${dividend} ÷ ${divisor}`,
            svar: quotient,
            type: 'divisjon',
            operasjon: 'dele',
            nivå: config.name,
            vanskelighetsgrad: divisor > 5 ? 4 : 3,
            forklaring: `${dividend} ÷ ${divisor} = ${quotient}`
        };
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Generate random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    static tilfeldigTall(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random decimal number
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} desimaler - Decimal places
     * @returns {number} Random decimal
     */
    static tilfeldigDesimal(min, max, desimaler) {
        const tall = Math.random() * (max - min) + min;
        return parseFloat(tall.toFixed(desimaler));
    }

    /**
     * Pick random item from array
     * @param {Array} array - Array to pick from
     * @returns {*} Random item
     */
    static velgTilfeldig(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Calculate difficulty rating (1-5)
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Difficulty (1-5)
     */
    static beregnVanskelighetsgrad(a, b) {
        const sum = a + b;

        if (sum <= 20) return 1;
        if (sum <= 50) return 2;
        if (sum <= 100) return 3;
        if (sum <= 500) return 4;
        return 5;
    }

    /**
     * Check if answer is correct
     * @param {number} userAnswer - User's answer
     * @param {number} correctAnswer - Correct answer
     * @param {number} tolerance - Tolerance for floating point (default 0.01)
     * @returns {boolean} Is correct
     */
    static sjekkSvar(userAnswer, correctAnswer, tolerance = 0.01) {
        // Handle string to number conversion
        const userNum = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer;

        if (isNaN(userNum)) {
            return false;
        }

        // For whole numbers, exact match
        if (Number.isInteger(correctAnswer)) {
            return userNum === correctAnswer;
        }

        // For decimals, allow small tolerance
        return Math.abs(userNum - correctAnswer) < tolerance;
    }

    /**
     * Get operation configuration
     * @param {string} operasjon - Operation identifier
     * @returns {Object} Operation config
     */
    static getOperationConfig(operasjon) {
        return OPPGAVE_CONFIG[operasjon];
    }

    /**
     * Get all available operations
     * @returns {Array<string>} Operation identifiers
     */
    static getAvailableOperations() {
        return Object.keys(OPPGAVE_CONFIG);
    }

    /**
     * Get sub-levels for an operation
     * @param {string} operasjon - Operation identifier
     * @returns {Array<string>} Sub-level identifiers
     */
    static getSubLevels(operasjon) {
        const kategori = OPPGAVE_CONFIG[operasjon];
        return kategori ? Object.keys(kategori.nivåer) : [];
    }

    /**
     * Generate multiple problems
     * @param {string} operasjon - Operation type
     * @param {string} nivå - Sub-level
     * @param {number} antall - Number of problems
     * @returns {Array<Object>} Array of problems
     */
    static genererFlereMuligheter(operasjon, nivå, antall = 10) {
        const problems = [];

        for (let i = 0; i < antall; i++) {
            problems.push(this.genererOppgave(operasjon, nivå));
        }

        return problems;
    }

    /**
     * Get operation emoji
     * @param {string} operasjon - Operation type
     * @returns {string} Emoji
     */
    static getOperationEmoji(operasjon) {
        const kategori = OPPGAVE_CONFIG[operasjon];
        return kategori ? kategori.emoji : '🔢';
    }
}

// ==================== EXPORTS ====================

export default OppgaveGenerator;

console.log('🔢 MatteMester oppgave-generator loaded');
