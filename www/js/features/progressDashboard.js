/* ============================================
   PROGRESS DASHBOARD - Advanced Statistics & Gamification
   GloseMester v2.0 - Streaks, Badges, Mastery
   ============================================ */

import { getUserProgress, getActivityLog, LeitnerSystem } from './learningEngine.js';
import { getTotalCorrect, getCredits } from '../core/storage.js';

// ============================================
// STREAK CALCULATION
// ============================================

/**
 * Beregn nåværende og lengste streak
 * @returns {Object} { currentStreak, longestStreak, lastActivityDate }
 */
export function beregnStreaks() {
    const activityLog = getActivityLog();
    const dates = Object.keys(activityLog).map(d => parseInt(d)).sort((a, b) => b - a);

    if (dates.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - (24 * 60 * 60 * 1000);

    // Beregn nåværende streak
    let currentStreak = 0;
    let checkDate = today;

    while (dates.includes(checkDate)) {
        currentStreak++;
        checkDate -= (24 * 60 * 60 * 1000);
    }

    // Hvis siste aktivitet var i går, inkluder den også
    if (currentStreak === 0 && dates.includes(yesterday)) {
        currentStreak = 1;
        checkDate = yesterday - (24 * 60 * 60 * 1000);
        while (dates.includes(checkDate)) {
            currentStreak++;
            checkDate -= (24 * 60 * 60 * 1000);
        }
    }

    // Beregn lengste streak ever
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    dates.forEach(date => {
        if (prevDate === null || prevDate - date === 24 * 60 * 60 * 1000) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
        prevDate = date;
    });

    return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        lastActivityDate: new Date(dates[0])
    };
}

// ============================================
// MASTERY STATISTICS
// ============================================

/**
 * Beregn mestringsstatus per nivå
 * @returns {Object} Statistikk per nivå
 */
export function beregnMastery() {
    const userProgress = getUserProgress();
    const leitner = new LeitnerSystem();
    const vocabulary = window.vokabularData || {};

    const stats = {
        niva1: { total: 0, mastered: 0, learning: 0, new: 0 },
        niva2: { total: 0, mastered: 0, learning: 0, new: 0 },
        niva3: { total: 0, mastered: 0, learning: 0, new: 0 },
        niva4: { total: 0, mastered: 0, learning: 0, new: 0 }
    };

    Object.keys(vocabulary).forEach(level => {
        if (!stats[level]) return;

        const words = vocabulary[level];
        stats[level].total = words.length;

        words.forEach(word => {
            const wordId = leitner.getWordId(word);
            const progress = userProgress[wordId];

            if (!progress) {
                stats[level].new++;
            } else if (progress.box >= 5) {
                stats[level].mastered++;
            } else {
                stats[level].learning++;
            }
        });
    });

    return stats;
}

/**
 * Beregn total mestringsprosent
 * @returns {number} Prosent (0-100)
 */
export function beregnTotalMastery() {
    const mastery = beregnMastery();
    let totalWords = 0;
    let masteredWords = 0;

    Object.values(mastery).forEach(level => {
        totalWords += level.total;
        masteredWords += level.mastered;
    });

    return totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
}

// ============================================
// BADGE SYSTEM
// ============================================

const badges = [
    { id: 'first_word', name: 'Første ord', emoji: '🌱', condition: (stats) => stats.totalCorrect >= 1, description: 'Svar riktig på ditt første ord' },
    { id: 'streak_3', name: '3-dagers streak', emoji: '🔥', condition: (stats) => stats.currentStreak >= 3, description: 'Øv 3 dager på rad' },
    { id: 'streak_7', name: 'Ukesstreak', emoji: '⚡', condition: (stats) => stats.currentStreak >= 7, description: 'Øv 7 dager på rad' },
    { id: 'streak_30', name: 'Månedsstreak', emoji: '💎', condition: (stats) => stats.currentStreak >= 30, description: 'Øv 30 dager på rad' },
    { id: 'master_10', name: 'Ti mestret', emoji: '⭐', condition: (stats) => stats.wordsMastered >= 10, description: 'Mestrer 10 ord' },
    { id: 'master_50', name: 'Femti mestret', emoji: '🌟', condition: (stats) => stats.wordsMastered >= 50, description: 'Mestrer 50 ord' },
    { id: 'master_100', name: 'Hundre mestret', emoji: '👑', condition: (stats) => stats.wordsMastered >= 100, description: 'Mestrer 100 ord' },
    { id: 'level_complete', name: 'Nivå fullført', emoji: '🏆', condition: (stats) => stats.levelCompleted, description: 'Fullfør et helt nivå' },
    { id: 'perfect_10', name: 'Perfekt 10', emoji: '💯', condition: (stats) => stats.perfectStreak >= 10, description: '10 riktige på rad i én økt' },
    { id: 'early_bird', name: 'Morgenfrisk', emoji: '🌅', condition: (stats) => stats.earlyBirdCount >= 5, description: 'Øv før kl 08:00 fem ganger' },
    { id: 'night_owl', name: 'Nattugle', emoji: '🦉', condition: (stats) => stats.nightOwlCount >= 5, description: 'Øv etter kl 22:00 fem ganger' }
];

/**
 * Sjekk hvilke badges brukeren har tjent
 * @returns {Array} Liste med opptjente badges
 */
export function sjekkBadges() {
    const stats = beregnDashboardStats();
    const earned = badges.filter(badge => badge.condition(stats));

    // Lagre opptjente badges for fremtidig referanse
    try {
        localStorage.setItem('glosemester_earned_badges', JSON.stringify(earned.map(b => b.id)));
    } catch (e) {
        console.warn('Kunne ikke lagre badges:', e);
    }

    return earned;
}

// ============================================
// COMPREHENSIVE STATS
// ============================================

/**
 * Beregn all statistikk for dashboard
 * @returns {Object} Komplett statistikkobjekt
 */
export function beregnDashboardStats() {
    const userProgress = getUserProgress();
    const leitner = new LeitnerSystem();
    const streaks = beregnStreaks();
    const mastery = beregnMastery();

    // Tell mestrede ord (box 5)
    let wordsMastered = 0;
    let wordsInProgress = 0;
    let totalReviews = 0;
    let correctReviews = 0;

    Object.values(userProgress).forEach(progress => {
        if (progress.box >= 5) wordsMastered++;
        if (progress.box < 5 && progress.reviewCount > 0) wordsInProgress++;
        totalReviews += progress.reviewCount;
        correctReviews += progress.correctCount;
    });

    const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

    // Sjekk om et nivå er fullført
    const levelCompleted = Object.values(mastery).some(level =>
        level.total > 0 && level.mastered === level.total
    );

    return {
        // XP & Progress
        totalCorrect: getTotalCorrect(),
        totalXP: getTotalCorrect() * 10, // 10 XP per riktig
        credits: getCredits(),

        // Streaks
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActivityDate: streaks.lastActivityDate,

        // Mastery
        wordsMastered,
        wordsInProgress,
        totalMasteryPercent: beregnTotalMastery(),
        masteryByLevel: mastery,

        // Accuracy
        accuracy,
        totalReviews,
        correctReviews,

        // Achievements
        levelCompleted,
        ...(() => {
            try {
                const s = JSON.parse(localStorage.getItem('mester_badge_stats') || '{}');
                return {
                    perfectStreak: s.perfectStreak || 0,
                    earlyBirdCount: s.earlyBirdCount || 0,
                    nightOwlCount: s.nightOwlCount || 0
                };
            } catch (e) {
                return { perfectStreak: 0, earlyBirdCount: 0, nightOwlCount: 0 };
            }
        })()
    };
}

// ============================================
// DASHBOARD RENDERING
// ============================================

/**
 * Vis hovedstatistikk i dashboard
 * @param {string} containerId - ID til container-element
 */
export function visDashboard(containerId = 'progress-dashboard') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Dashboard container ikke funnet:', containerId);
        return;
    }

    const stats = beregnDashboardStats();
    const badges = sjekkBadges();

    container.innerHTML = `
        <div class="dashboard-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        ">
            ${visStat('🔥 Nåværende streak', `${stats.currentStreak} dager`, '#ff6b6b')}
            ${visStat('📚 Ord mestret', `${stats.wordsMastered}`, '#10b981')}
            ${visStat('⭐ Total XP', `${stats.totalXP}`, '#7c3aed')}
            ${visStat('🎯 Treffsikkerhet', `${stats.accuracy}%`, '#06b6d4')}
        </div>
        
        <div class="mastery-section" style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px; color: var(--primary-color);">📊 Fremgang per nivå</h3>
            ${visMasteryBars(stats.masteryByLevel)}
        </div>
        
        <div class="badges-section">
            <h3 style="margin-bottom: 15px; color: var(--primary-color);">🏅 Dine badges (${badges.length}/${badges.length})</h3>
            ${visBadges(badges)}
        </div>
    `;
}

/**
 * Generer HTML for en stat-kort
 */
function visStat(label, value, color) {
    return `
        <div class="stat-card" style="
            background: white;
            padding: 20px;
            border-radius: var(--border-radius-card);
            box-shadow: var(--shadow);
            text-align: center;
            border-top: 4px solid ${color};
        ">
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">
                ${label}
            </div>
            <div style="font-size: 2rem; font-weight: 800; color: ${color};">
                ${value}
            </div>
        </div>
    `;
}

/**
 * Generer HTML for mestringsbars per nivå
 */
function visMasteryBars(masteryByLevel) {
    const levels = ['niva1', 'niva2', 'niva3', 'niva4'];
    const levelNames = { niva1: 'Nivå 1', niva2: 'Nivå 2', niva3: 'Nivå 3', niva4: 'Nivå 4' };

    return levels.map(level => {
        const data = masteryByLevel[level];
        if (!data || data.total === 0) return '';

        const percent = Math.round((data.mastered / data.total) * 100);

        return `
            <div class="mastery-bar-container" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600;">${levelNames[level]}</span>
                    <span style="color: #666;">${data.mastered} / ${data.total} mestret</span>
                </div>
                <div style="
                    background: #e0e0e0;
                    height: 12px;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                ">
                    <div style="
                        background: linear-gradient(90deg, var(--electric-blue), var(--primary-color));
                        height: 100%;
                        width: ${percent}%;
                        border-radius: 6px;
                        transition: width 0.5s ease;
                    "></div>
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #888;
                    margin-top: 5px;
                ">
                    <span>🌱 Nye: ${data.new}</span>
                    <span>📖 Lærer: ${data.learning}</span>
                    <span>✅ Mestret: ${data.mastered}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Generer HTML for badges
 */
function visBadges(earnedBadges) {
    if (earnedBadges.length === 0) {
        return `
            <div style="
                text-align: center;
                padding: 40px;
                color: #888;
                background: rgba(0,0,0,0.02);
                border-radius: var(--border-radius-card);
            ">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎖️</div>
                <div>Begynn å øve for å tjene badges!</div>
            </div>
        `;
    }

    return `
        <div style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 15px;
        ">
            ${earnedBadges.map(badge => `
                <div class="badge-card" style="
                    background: white;
                    padding: 15px;
                    border-radius: var(--border-radius-sm);
                    box-shadow: var(--shadow-soft);
                    text-align: center;
                    transition: transform 0.2s ease;
                    cursor: pointer;
                " title="${badge.description}">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">${badge.emoji}</div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: #333;">
                        ${badge.name}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// MINI STATS FOR PRACTICE PAGE
// ============================================

/**
 * Vis kompakt statistikk i practice-mode
 * @param {string} containerId - ID til container
 */
export function visMiniStats(containerId = 'mini-stats') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = beregnDashboardStats();

    container.innerHTML = `
        <div style="
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            padding: 10px 0;
        ">
            <div class="mini-stat">
                🔥 <strong>${stats.currentStreak}</strong> streak
            </div>
            <div class="mini-stat">
                ⭐ <strong>${stats.totalXP}</strong> XP
            </div>
            <div class="mini-stat">
                📚 <strong>${stats.wordsMastered}</strong> mestret
            </div>
        </div>
    `;
}
