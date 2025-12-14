// ============================================
// CREDITS.JS - GloseMester v0.1-ALPHA
// Byttepoeng-system
// ============================================

/**
 * Last inn brukerdata fra localStorage
 */
function loadUserData() {
    credits = parseInt(localStorage.getItem('credits_' + brukerNavn)) || 0;
    creditProgress = parseInt(localStorage.getItem('progress_' + brukerNavn)) || 0;
    updateCreditUI();
    console.log('📊 Brukerdata lastet - Credits:', credits, 'Progress:', creditProgress);
}

/**
 * Lagre brukerdata til localStorage
 */
function saveUserData() {
    localStorage.setItem('credits_' + brukerNavn, credits);
    localStorage.setItem('progress_' + brukerNavn, creditProgress);
    console.log('💾 Brukerdata lagret');
}

/**
 * Legg til ett poeng for riktig svar
 * Gir 10 byttepoeng når man når 100 riktige
 */
function addCorrectAnswerPoint() {
    creditProgress++;
    
    if (creditProgress >= 100) {
        credits += 10;
        creditProgress = 0;
        alert("🎉 Gratulerer! Du har klart 100 rette og tjent 10 Byttepoeng! 💎");
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Credits', 'Tjent 10 poeng', '100 riktige svar');
        }
    }
    
    saveUserData();
    updateCreditUI();
}

/**
 * Oppdater credit UI i alle menyer
 */
function updateCreditUI() {
    // Oppdater credit badges
    const elevCount = document.getElementById('credit-count-elev');
    const ovingCount = document.getElementById('credit-count-oving');
    
    if (elevCount) elevCount.innerText = credits;
    if (ovingCount) ovingCount.innerText = credits;
    
    // Oppdater progress bars (elev)
    const elevProgressText = document.getElementById('credit-progress-text-elev');
    const elevProgressBar = document.getElementById('credit-progress-bar-elev');
    
    if (elevProgressText) elevProgressText.innerText = creditProgress + "/100";
    if (elevProgressBar) elevProgressBar.style.width = creditProgress + "%";
    
    // Oppdater progress bars (øving)
    const ovingProgressText = document.getElementById('credit-progress-text-oving');
    const ovingProgressBar = document.getElementById('credit-progress-bar-oving');
    
    if (ovingProgressText) ovingProgressText.innerText = creditProgress + "/100";
    if (ovingProgressBar) ovingProgressBar.style.width = creditProgress + "%";
}

/**
 * Bruk credits (f.eks. til å bytte kort)
 * @param {number} amount - Antall credits å bruke
 * @returns {boolean} - True hvis vellykket, false hvis ikke nok credits
 */
function useCredits(amount) {
    if (credits >= amount) {
        credits -= amount;
        saveUserData();
        updateCreditUI();
        console.log(`💎 Brukt ${amount} credits. Gjenstående: ${credits}`);
        return true;
    } else {
        console.warn(`❌ Ikke nok credits. Har: ${credits}, trenger: ${amount}`);
        return false;
    }
}

/**
 * Gi credits direkte (for testing eller belønninger)
 * @param {number} amount - Antall credits å gi
 */
function giveCredits(amount) {
    credits += amount;
    saveUserData();
    updateCreditUI();
    console.log(`✅ Gitt ${amount} credits. Totalt: ${credits}`);
}

/**
 * Reset credits og progress (for testing)
 */
function resetCredits() {
    if (confirm('Er du sikker på at du vil resette alle credits og progress?')) {
        credits = 0;
        creditProgress = 0;
        saveUserData();
        updateCreditUI();
        console.log('🔄 Credits og progress resatt');
    }
}

console.log('💎 credits.js lastet');