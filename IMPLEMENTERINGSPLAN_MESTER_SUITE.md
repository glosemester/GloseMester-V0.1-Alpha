# 🏗️ IMPLEMENTERINGSPLAN: MESTER SUITE v2.0

**Dato:** 2026-02-06
**Versjon:** 2.0.0-ALPHA
**Arkitekt:** Claude + Øyvind

---

## 📋 INNHOLDSFORTEGNELSE

1. [Overordnet arkitektur](#overordnet-arkitektur)
2. [Mappestruktur](#mappestruktur)
3. [Core-infrastruktur](#core-infrastruktur)
4. [Fagmodul-interface](#fagmodul-interface)
5. [Router og navigation](#router-og-navigation)
6. [Migrering fra GloseMester v0.11](#migrering)
7. [Implementeringsrekkefølge](#implementeringsrekkefølge)
8. [Testing-strategi](#testing-strategi)

---

## 🎯 OVERORDNET ARKITEKTUR

### **Arkitektur-prinsipp: Feature-Modular Monolith**

```
┌─────────────────────────────────────────────────────────────┐
│                      MESTER SUITE                           │
│                    (Single Page App)                        │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ GloseMes │        │ MatteMes │        │ NorskMes │
    │   ter    │        │   ter    │        │   ter    │
    └──────────┘        └──────────┘        └──────────┘
           │                    │                    │
           └────────────┬───────────────────────────┘
                        ▼
         ┌──────────────────────────────────┐
         │    FELLES INFRASTRUKTUR         │
         ├─────────────────────────────────┤
         │ • Auth & Firebase               │
         │ • Kort-system (shared)          │
         │ • Quiz-engine (generisk)        │
         │ • Lærer-dashboard (multi-fag)   │
         │ • Router & Navigation           │
         └──────────────────────────────────┘
```

### **Nøkkel-beslutninger:**

1. ✅ **En database** - Alle fag deler samme Firestore
2. ✅ **En kort-samling** - Kort kan vinnes fra alle fag
3. ✅ **Lazy loading** - Fagmoduler lastes kun ved behov
4. ✅ **Type-basert routing** - Prøver og resultater har fagtype-felt
5. ✅ **Shared UI components** - Gjenbruk av quiz, kort, dashboard

---

## 📁 MAPPESTRUKTUR

```
mester-suite/
│
├── public/
│   ├── index.html                    # Entry point
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   └── assets/
│       ├── icons/
│       │   ├── glosemester-icon.svg
│       │   ├── mattemester-icon.svg
│       │   └── norskmester-icon.svg
│       ├── kort/                     # Alle kort-bilder
│       │   ├── dyr/
│       │   ├── mat/
│       │   ├── romvesen/
│       │   ├── raketter/
│       │   ├── planeter/
│       │   └── roboter/
│       └── sounds/
│           ├── klikk.mp3
│           ├── riktig.mp3
│           └── fanfare.mp3
│
├── src/
│   │
│   ├── core/                         # FELLES INFRASTRUKTUR
│   │   │
│   │   ├── auth/
│   │   │   ├── firebase-config.js    # Firebase setup
│   │   │   ├── auth-service.js       # Login/logout logikk
│   │   │   └── auth-ui.js            # Login UI komponenter
│   │   │
│   │   ├── database/
│   │   │   ├── firestore.js          # Firestore init
│   │   │   ├── prover-service.js     # CRUD for prøver
│   │   │   ├── resultater-service.js # CRUD for resultater
│   │   │   └── users-service.js      # User management
│   │   │
│   │   ├── kort/
│   │   │   ├── kort-system.js        # Felles kort-logikk
│   │   │   ├── kort-data.js          # Alle 152+ kort
│   │   │   ├── kort-display.js       # Galleri UI
│   │   │   └── kort-reward.js        # Reward-beregning
│   │   │
│   │   ├── navigation/
│   │   │   ├── router.js             # SPA routing
│   │   │   └── page-manager.js       # Page visibility
│   │   │
│   │   └── ui/
│   │       ├── toast.js              # Toast notifications
│   │       ├── modal.js              # Modal dialogs
│   │       ├── helpers.js            # UI utilities
│   │       └── sound.js              # Sound effects
│   │
│   ├── features/                     # FAG-MODULER
│   │   │
│   │   ├── glosemester/
│   │   │   ├── index.js              # Modul entry point
│   │   │   ├── glosemester.js        # Main feature class
│   │   │   ├── vocabulary-data.js    # Ordlister (Dyr, Mat, etc)
│   │   │   ├── practice-ui.js        # Practice-modus UI
│   │   │   ├── practice-logic.js     # Practice game logic
│   │   │   └── components/
│   │   │       ├── word-card.js
│   │   │       └── translation-input.js
│   │   │
│   │   ├── mattemester/
│   │   │   ├── index.js
│   │   │   ├── mattemester.js        # Main feature class
│   │   │   ├── oppgave-generator.js  # Math problem generator
│   │   │   ├── practice-ui.js        # Math practice UI
│   │   │   ├── practice-logic.js     # Math game logic
│   │   │   └── components/
│   │   │       ├── math-input.js     # Number keyboard
│   │   │       └── equation-display.js
│   │   │
│   │   └── norskmester/
│   │       ├── index.js
│   │       ├── norskmester.js        # Main feature class
│   │       ├── sporsmal-data.js      # Norwegian questions
│   │       ├── practice-ui.js        # Norwegian practice UI
│   │       ├── practice-logic.js     # Norwegian game logic
│   │       └── components/
│   │           ├── question-card.js
│   │           └── answer-input.js
│   │
│   ├── shared/                       # DELTE KOMPONENTER
│   │   │
│   │   ├── quiz/
│   │   │   ├── quiz-engine.js        # Generisk quiz-motor
│   │   │   ├── quiz-ui.js            # Quiz UI (fag-agnostisk)
│   │   │   └── quiz-results.js       # Resultat-visning
│   │   │
│   │   ├── teacher/
│   │   │   ├── dashboard.js          # Lærer-oversikt
│   │   │   ├── prove-creator.js      # Lag prøver (alle fag)
│   │   │   ├── prove-list.js         # Mine prøver liste
│   │   │   └── analytics.js          # Statistikk og grafer
│   │   │
│   │   └── student/
│   │       ├── profile.js            # Elevprofil
│   │       ├── progress.js           # Fremdrift-oversikt
│   │       └── kort-galleri.js       # Felles kortgalleri
│   │
│   ├── pages/                        # SIDER
│   │   ├── landing.js                # Fagvelger landingsside
│   │   ├── login.js                  # Login-side
│   │   ├── role-selector.js          # Elev/Lærer valg
│   │   ├── student-home.js           # Elev-dashboard
│   │   ├── teacher-home.js           # Lærer-dashboard
│   │   └── gallery.js                # Felles galleri-side
│   │
│   ├── styles/                       # STYLING
│   │   ├── main.css                  # Global styles
│   │   ├── components.css            # Component styles
│   │   ├── themes/
│   │   │   ├── glosemester.css       # Blå tema
│   │   │   ├── mattemester.css       # Oransje tema
│   │   │   └── norskmester.css       # Rød tema
│   │   └── utilities.css             # Utility classes
│   │
│   ├── app.js                        # MAIN APP ENTRY
│   └── config.js                     # App configuration
│
├── firestore.rules                   # Firestore security rules
├── package.json
├── netlify.toml
└── README.md
```

---

## ⚙️ CORE-INFRASTRUKTUR

### **1. Firebase Config (`src/core/auth/firebase-config.js`)**

```javascript
// ============================================
// FIREBASE CONFIGURATION
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC1K9xVo6rZ_T3xJ7xQX8hF9YqW5nXvL2M",
    authDomain: "glosemester-1e67e.firebaseapp.com",
    projectId: "glosemester-1e67e",
    storageBucket: "glosemester-1e67e.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Development mode: Use emulators
if (window.location.hostname === 'localhost') {
    console.log('🔧 Using Firebase Emulators');
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db, analytics, app };
```

---

### **2. Router System (`src/core/navigation/router.js`)**

```javascript
// ============================================
// SPA ROUTER - Hash-based routing
// ============================================

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., '/gloser', '/lærer')
     * @param {Function} handler - Route handler function
     */
    register(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a route
     * @param {string} path - Target path
     * @param {object} params - Optional query params
     */
    push(path, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullPath = query ? `${path}?${query}` : path;
        window.location.hash = fullPath;
    }

    /**
     * Get current route info
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, queryString] = hash.split('?');
        const params = new URLSearchParams(queryString);

        return {
            path,
            params: Object.fromEntries(params.entries()),
            fullHash: hash
        };
    }

    /**
     * Handle route change
     */
    async handleRoute() {
        const route = this.getCurrentRoute();

        // Run before hooks
        for (const hook of this.beforeHooks) {
            const result = await hook(route);
            if (result === false) return; // Cancel navigation
        }

        // Find matching route handler
        const handler = this.routes.get(route.path);

        if (handler) {
            this.currentRoute = route;
            await handler(route);
        } else {
            // 404 - redirect to landing
            console.warn(`Route not found: ${route.path}`);
            this.push('/');
        }

        // Run after hooks
        for (const hook of this.afterHooks) {
            await hook(route);
        }
    }

    /**
     * Add navigation guard
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }

    afterEach(hook) {
        this.afterHooks.push(hook);
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }
}

// Export singleton instance
export const router = new Router();

// ============================================
// PREDEFINED ROUTES
// ============================================

export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    ROLE_SELECT: '/velg-rolle',

    // Fag-routes
    GLOSEMESTER: '/gloser',
    MATTEMESTER: '/matte',
    NORSKMESTER: '/norsk',

    // Elev-routes
    STUDENT_HOME: '/elev',
    PRACTICE: '/ov',
    GALLERY: '/galleri',

    // Lærer-routes
    TEACHER_HOME: '/lærer',
    CREATE_TEST: '/lærer/lag-prove',
    MY_TESTS: '/lærer/mine-prover',
    ANALYTICS: '/lærer/statistikk',

    // Felles
    PROFILE: '/min-side'
};
```

---

### **3. Kort System (`src/core/kort/kort-system.js`)**

```javascript
// ============================================
// KORT SYSTEM - Felles for alle fag
// ============================================

import { kortData } from './kort-data.js';
import { db } from '../auth/firebase-config.js';
import { doc, getDoc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Rarity odds (må matche Midjourney kort-spesifikasjon)
 */
const RARITY_ODDS = {
    common: 0.75,      // 75%
    rare: 0.175,       // 17.5%
    epic: 0.05,        // 5%
    legendary: 0.025   // 2.5%
};

/**
 * Reward class - Håndterer kort-belønning
 */
export class KortReward {
    /**
     * Check if user won a card
     * @param {number} score - Quiz score (0-100)
     * @param {string} proveType - 'gloser', 'matte', or 'norsk'
     * @returns {object|null} - Won card or null
     */
    static async checkWinCondition(score, proveType = 'gloser') {
        // Minimum 80% score to win card
        if (score < 80) return null;

        // Get rarity based on score
        const rarity = this.calculateRarity(score);

        // Get random card from pool
        const card = this.getRandomCard(rarity, proveType);

        return card;
    }

    /**
     * Calculate card rarity based on score
     * @param {number} score - Quiz score
     * @returns {string} - Rarity tier
     */
    static calculateRarity(score) {
        const rand = Math.random();

        // Perfect score (100%) - higher legendary chance
        if (score === 100) {
            if (rand < 0.05) return 'legendary';  // 5% legendary
            if (rand < 0.20) return 'epic';       // 15% epic
            if (rand < 0.50) return 'rare';       // 30% rare
            return 'common';                       // 50% common
        }

        // Good score (90-99%) - boosted chances
        if (score >= 90) {
            if (rand < 0.03) return 'legendary';
            if (rand < 0.10) return 'epic';
            if (rand < 0.35) return 'rare';
            return 'common';
        }

        // Decent score (80-89%) - standard odds
        if (rand < RARITY_ODDS.legendary) return 'legendary';
        if (rand < RARITY_ODDS.legendary + RARITY_ODDS.epic) return 'epic';
        if (rand < RARITY_ODDS.legendary + RARITY_ODDS.epic + RARITY_ODDS.rare) return 'rare';
        return 'common';
    }

    /**
     * Get random card from pool
     * @param {string} rarity - Target rarity
     * @param {string} proveType - Fag type (for filtrering i fremtiden)
     * @returns {object} - Card object
     */
    static getRandomCard(rarity, proveType) {
        // Filter cards by rarity
        const availableCards = kortData.filter(kort => kort.rarity === rarity);

        // Random selection
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        return availableCards[randomIndex];
    }

    /**
     * Award card to user
     * @param {string} userId - User ID
     * @param {object} card - Card to award
     */
    static async awardCard(userId, card) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.error('User not found');
                return false;
            }

            const kortSamling = userSnap.data().kortSamling || [];

            // Check if user already has this card
            if (kortSamling.includes(card.id)) {
                console.log('User already has this card');
                return false; // Duplicate - no reward
            }

            // Add card to collection
            await updateDoc(userRef, {
                kortSamling: arrayUnion(card.id)
            });

            console.log(`✅ Card awarded: ${card.navn} (${card.rarity})`);
            return true;
        } catch (error) {
            console.error('Error awarding card:', error);
            return false;
        }
    }
}

/**
 * KortGalleri class - Display user's card collection
 */
export class KortGalleri {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.userCards = [];
    }

    /**
     * Load user's card collection
     * @param {string} userId - User ID
     */
    async loadUserCards(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) return;

            const kortIds = userSnap.data().kortSamling || [];
            this.userCards = kortData.filter(kort => kortIds.includes(kort.id));

            this.render();
        } catch (error) {
            console.error('Error loading cards:', error);
        }
    }

    /**
     * Render card gallery
     */
    render() {
        if (!this.container) return;

        // Group by rarity
        const grouped = {
            legendary: this.userCards.filter(k => k.rarity === 'legendary'),
            epic: this.userCards.filter(k => k.rarity === 'epic'),
            rare: this.userCards.filter(k => k.rarity === 'rare'),
            common: this.userCards.filter(k => k.rarity === 'common')
        };

        let html = `
            <div class="kort-stats">
                <h3>Din Samling: ${this.userCards.length} / ${kortData.length}</h3>
                <div class="rarity-breakdown">
                    <span class="legendary">🌟 ${grouped.legendary.length} Legendary</span>
                    <span class="epic">💎 ${grouped.epic.length} Epic</span>
                    <span class="rare">✨ ${grouped.rare.length} Rare</span>
                    <span class="common">📦 ${grouped.common.length} Common</span>
                </div>
            </div>
        `;

        // Render cards by rarity
        for (const [rarity, cards] of Object.entries(grouped)) {
            if (cards.length === 0) continue;

            html += `<h4 class="rarity-header ${rarity}">${rarity.toUpperCase()}</h4>`;
            html += '<div class="kort-grid">';

            cards.forEach(kort => {
                html += `
                    <div class="kort-card ${kort.rarity}" data-kort-id="${kort.id}">
                        <img src="${kort.image}" alt="${kort.navn}" loading="lazy">
                        <div class="kort-info">
                            <h5>${kort.navn}</h5>
                            <span class="kategori">${kort.kategori}</span>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }

        this.container.innerHTML = html;
    }
}

// Export all
export { kortData, RARITY_ODDS };
```

---

### **4. Quiz Engine (`src/shared/quiz/quiz-engine.js`)**

```javascript
// ============================================
// GENERISK QUIZ ENGINE - Fag-agnostisk
// ============================================

/**
 * QuizEngine - Håndterer quiz-logikk for alle fag
 */
export class QuizEngine {
    constructor(questions, options = {}) {
        this.questions = questions;
        this.currentIndex = 0;
        this.answers = [];
        this.score = 0;
        this.startTime = Date.now();

        // Options
        this.shuffleQuestions = options.shuffle ?? true;
        this.caseSensitive = options.caseSensitive ?? false;
        this.allowSkip = options.allowSkip ?? false;

        if (this.shuffleQuestions) {
            this.shuffle();
        }
    }

    /**
     * Shuffle questions
     */
    shuffle() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    /**
     * Get current question
     */
    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    /**
     * Check if answer is correct
     * @param {string} userAnswer - User's answer
     * @returns {boolean} - Is correct?
     */
    checkAnswer(userAnswer) {
        const current = this.getCurrentQuestion();
        const correctAnswer = current.e || current.answer; // Support both formats

        let isCorrect = false;

        if (this.caseSensitive) {
            isCorrect = userAnswer.trim() === correctAnswer.trim();
        } else {
            isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        }

        // Store answer
        this.answers.push({
            question: current.s || current.question,
            correctAnswer: correctAnswer,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            timestamp: Date.now()
        });

        if (isCorrect) {
            this.score++;
        }

        return isCorrect;
    }

    /**
     * Move to next question
     */
    next() {
        if (this.hasNext()) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    /**
     * Check if there are more questions
     */
    hasNext() {
        return this.currentIndex < this.questions.length - 1;
    }

    /**
     * Get quiz results
     */
    getResults() {
        const endTime = Date.now();
        const duration = Math.floor((endTime - this.startTime) / 1000); // seconds

        return {
            score: this.score,
            total: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            duration: duration,
            answers: this.answers,
            correctCount: this.score,
            wrongCount: this.questions.length - this.score
        };
    }

    /**
     * Get progress
     */
    getProgress() {
        return {
            current: this.currentIndex + 1,
            total: this.questions.length,
            percentage: Math.round(((this.currentIndex + 1) / this.questions.length) * 100)
        };
    }

    /**
     * Reset quiz
     */
    reset() {
        this.currentIndex = 0;
        this.answers = [];
        this.score = 0;
        this.startTime = Date.now();

        if (this.shuffleQuestions) {
            this.shuffle();
        }
    }
}
```

---

## 🎯 FAGMODUL-INTERFACE

Alle fagmoduler må implementere samme interface for konsistens.

### **FagModul Base Class (`src/features/base-modul.js`)**

```javascript
// ============================================
// BASE CLASS - Alle fagmoduler arver fra denne
// ============================================

export class FagModul {
    constructor(fagType) {
        this.fagType = fagType; // 'gloser', 'matte', 'norsk'
        this.initialized = false;
    }

    /**
     * Initialize module (MUST IMPLEMENT)
     */
    async init() {
        throw new Error('init() must be implemented by subclass');
    }

    /**
     * Get practice data (MUST IMPLEMENT)
     * @returns {Array} - Array of practice items
     */
    getPracticeData() {
        throw new Error('getPracticeData() must be implemented by subclass');
    }

    /**
     * Start practice mode (MUST IMPLEMENT)
     * @param {string} category - Practice category
     */
    startPractice(category) {
        throw new Error('startPractice() must be implemented by subclass');
    }

    /**
     * Render practice UI (MUST IMPLEMENT)
     */
    renderPracticeUI() {
        throw new Error('renderPracticeUI() must be implemented by subclass');
    }

    /**
     * Cleanup (OPTIONAL)
     */
    cleanup() {
        // Override in subclass if needed
    }

    /**
     * Get module metadata
     */
    getMetadata() {
        return {
            type: this.fagType,
            initialized: this.initialized
        };
    }
}
```

---

### **GloseMester Implementation (`src/features/glosemester/glosemester.js`)**

```javascript
// ============================================
// GLOSEMESTER - Implementation av FagModul
// ============================================

import { FagModul } from '../base-modul.js';
import { vocabularyData } from './vocabulary-data.js';
import { QuizEngine } from '../../shared/quiz/quiz-engine.js';

export class GloseMester extends FagModul {
    constructor() {
        super('gloser');
        this.categories = [];
        this.currentQuiz = null;
    }

    /**
     * Initialize GloseMester
     */
    async init() {
        console.log('📚 Initializing GloseMester...');

        // Load vocabulary categories
        this.categories = Object.keys(vocabularyData);

        // Render UI
        this.renderPracticeUI();

        this.initialized = true;
        console.log('✅ GloseMester ready');
    }

    /**
     * Get practice data
     */
    getPracticeData() {
        return vocabularyData;
    }

    /**
     * Start practice session
     */
    startPractice(category) {
        const words = vocabularyData[category];

        if (!words) {
            console.error(`Category not found: ${category}`);
            return;
        }

        // Create quiz
        this.currentQuiz = new QuizEngine(words, {
            shuffle: true,
            caseSensitive: false
        });

        // Render quiz UI
        this.renderQuizUI();
    }

    /**
     * Render practice UI
     */
    renderPracticeUI() {
        const container = document.getElementById('glosemester-container');

        if (!container) return;

        let html = '<h2>Velg kategori</h2><div class="category-grid">';

        this.categories.forEach(category => {
            const wordCount = vocabularyData[category].length;
            html += `
                <div class="category-card" onclick="window.glosemester.startPractice('${category}')">
                    <h3>${category}</h3>
                    <p>${wordCount} ord</p>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render quiz UI
     */
    renderQuizUI() {
        // Implementation here...
        // Use QuizEngine for logic
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.currentQuiz = null;
    }
}
```

---

## 🚀 APP.JS - Main Entry Point

```javascript
// ============================================
// MAIN APP ENTRY POINT
// ============================================

import { router, ROUTES } from './core/navigation/router.js';
import { auth } from './core/auth/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

/**
 * MesterSuite - Global app state
 */
window.MesterSuite = {
    version: '2.0.0-ALPHA',
    aktivtFag: null,
    aktivRolle: null,
    bruker: null,
    moduler: {
        glosemester: null,
        mattemester: null,
        norskmester: null
    }
};

/**
 * Initialize app
 */
async function initApp() {
    console.log('🚀 Mester Suite v2.0 - Initializing...');

    // Setup routes
    setupRoutes();

    // Setup auth listener
    onAuthStateChanged(auth, handleAuthChange);

    // Setup navigation guards
    setupNavigationGuards();

    console.log('✅ App initialized');
}

/**
 * Setup all routes
 */
function setupRoutes() {
    // Landing page
    router.register(ROUTES.LANDING, async () => {
        await import('./pages/landing.js');
        window.Landing.render();
    });

    // Login
    router.register(ROUTES.LOGIN, async () => {
        await import('./pages/login.js');
        window.Login.render();
    });

    // GloseMester
    router.register(ROUTES.GLOSEMESTER, async () => {
        if (!MesterSuite.moduler.glosemester) {
            const { GloseMester } = await import('./features/glosemester/glosemester.js');
            MesterSuite.moduler.glosemester = new GloseMester();
            await MesterSuite.moduler.glosemester.init();
        }
        MesterSuite.aktivtFag = 'gloser';
    });

    // MatteMester (lazy loaded)
    router.register(ROUTES.MATTEMESTER, async () => {
        if (!MesterSuite.moduler.mattemester) {
            const { MatteMester } = await import('./features/mattemester/mattemester.js');
            MesterSuite.moduler.mattemester = new MatteMester();
            await MesterSuite.moduler.mattemester.init();
        }
        MesterSuite.aktivtFag = 'matte';
    });

    // Teacher dashboard
    router.register(ROUTES.TEACHER_HOME, async () => {
        await import('./shared/teacher/dashboard.js');
        window.TeacherDashboard.render();
    });

    // Gallery
    router.register(ROUTES.GALLERY, async () => {
        await import('./pages/gallery.js');
        window.Gallery.render();
    });
}

/**
 * Setup navigation guards
 */
function setupNavigationGuards() {
    // Before each route
    router.beforeEach(async (route) => {
        // Check if user is logged in for protected routes
        const protectedRoutes = [
            ROUTES.STUDENT_HOME,
            ROUTES.TEACHER_HOME,
            ROUTES.GALLERY,
            ROUTES.PRACTICE
        ];

        if (protectedRoutes.includes(route.path) && !auth.currentUser) {
            console.warn('Redirecting to login - protected route');
            router.push(ROUTES.LOGIN);
            return false; // Cancel navigation
        }

        return true;
    });

    // After each route
    router.afterEach((route) => {
        console.log('Route changed:', route.path);

        // Update page title
        document.title = getPageTitle(route.path);
    });
}

/**
 * Handle auth state changes
 */
function handleAuthChange(user) {
    if (user) {
        console.log('✅ User logged in:', user.email);
        MesterSuite.bruker = user;
    } else {
        console.log('❌ User logged out');
        MesterSuite.bruker = null;
        router.push(ROUTES.LOGIN);
    }
}

/**
 * Get page title
 */
function getPageTitle(path) {
    const titles = {
        '/': 'Mester Suite - Hva skal vi øve i dag?',
        '/gloser': 'GloseMester - Lær gloser',
        '/matte': 'MatteMester - Tren matte',
        '/norsk': 'NorskMester - Mestre norsk',
        '/lærer': 'Lærer Dashboard',
        '/galleri': 'Min Kortsamling'
    };

    return titles[path] || 'Mester Suite';
}

// Initialize on load
initApp();
```

---

## 🔄 MIGRERING FRA GLOSEMESTER V0.11

### **Migreringsplan:**

```javascript
// OLD STRUCTURE:
js/
├── app.js
├── features/
│   ├── teacher.js
│   ├── quiz.js
│   └── kort-display.js
└── vocabulary.js

// NEW STRUCTURE:
src/
├── app.js
├── core/
│   ├── auth/
│   ├── database/
│   └── kort/
├── features/
│   └── glosemester/
├── shared/
│   ├── quiz/
│   └── teacher/
└── pages/
```

### **Mapping av filer:**

| Old File | New File | Action |
|----------|----------|--------|
| `js/app.js` | `src/app.js` | Refactor til ny router |
| `js/features/firebase.js` | `src/core/auth/firebase-config.js` | Rename + cleanup |
| `js/features/kort-display.js` | `src/core/kort/kort-display.js` | Move + generalize |
| `js/features/quiz.js` | `src/shared/quiz/quiz-engine.js` | Refactor til generisk |
| `js/features/teacher.js` | `src/shared/teacher/dashboard.js` | Refactor for multi-fag |
| `js/vocabulary.js` | `src/features/glosemester/vocabulary-data.js` | Move |
| `js/data/cardsData.js` | `src/core/kort/kort-data.js` | Merge all cards |

---

## 📅 IMPLEMENTERINGSREKKEFØLGE

### **Sprint 1: Infrastruktur (3-5 dager)**
```
✅ Opprett ny mappestruktur
✅ Migrer Firebase config
✅ Implementer Router
✅ Lag Landing page
✅ Setup Service Worker
```

### **Sprint 2: GloseMester (5-7 dager)**
```
✅ Refaktorer til FagModul
✅ Migrer vocabulary data
✅ Integrer med QuizEngine
✅ Test at alt fungerer
```

### **Sprint 3: Kort-system (3-5 dager)**
```
✅ Generaliser kort-system
✅ Lag KortReward class
✅ Lag felles galleri
✅ Test kort-belønning
```

### **Sprint 4: Lærer-dashboard (5-7 dager)**
```
✅ Refaktorer til multi-fag
✅ Fag-faner for prøveopprettelse
✅ Statistikk per fag
✅ Test end-to-end
```

### **Sprint 5: MatteMester (7-10 dager)**
```
✅ Implementer MatteMester class
✅ Lag oppgave-generator
✅ Lag tall-tastatur UI
✅ Integrer med kort-system
✅ Test komplett flow
```

### **Sprint 6: NorskMester (7-10 dager)**
```
✅ Implementer NorskMester class
✅ Lag spørsmål-data
✅ Lag norsk-spesifikk UI
✅ Integrer med system
✅ Test komplett flow
```

---

## 🧪 TESTING-STRATEGI

### **1. Unit Tests:**
```javascript
// test/core/kort-system.test.js
describe('KortReward', () => {
    it('should award legendary card on 100% score', () => {
        // Test implementation
    });

    it('should not award card on <80% score', () => {
        // Test implementation
    });
});
```

### **2. Integration Tests:**
```javascript
// test/integration/quiz-flow.test.js
describe('Complete Quiz Flow', () => {
    it('should complete quiz and award card', async () => {
        // 1. Start quiz
        // 2. Answer all questions
        // 3. Get 100% score
        // 4. Receive legendary card
        // 5. Card appears in gallery
    });
});
```

### **3. E2E Tests (Playwright/Cypress):**
```javascript
// e2e/glosemester-flow.spec.js
test('Complete GloseMester practice session', async ({ page }) => {
    await page.goto('/');
    await page.click('#glosemester-btn');
    await page.click('#dyr-category');
    // ... complete quiz
    await expect(page.locator('.kort-reward')).toBeVisible();
});
```

---

## 🎯 SUKSESS-KRITERIER

✅ **Tekniske:**
- [ ] Alle 3 fagmoduler fungerer
- [ ] Felles kort-system virker på tvers
- [ ] Lærer kan lage prøver for alle fag
- [ ] PWA offline-støtte fungerer
- [ ] Lighthouse score > 90

✅ **Bruker-opplevelse:**
- [ ] Rask lasting (lazy loading)
- [ ] Intuitiv navigasjon
- [ ] Konsistent design på tvers av fag
- [ ] Motiverende kort-belønning

✅ **Vedlikehold:**
- [ ] Modulær kodebase
- [ ] Lett å legge til nytt fag
- [ ] God test-dekning
- [ ] Dokumentert API

---

**Versjon:** 1.0
**Dato:** 2026-02-06
**Status:** ✅ Klar for implementering
