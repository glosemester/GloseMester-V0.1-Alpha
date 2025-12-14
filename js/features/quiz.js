// ============================================
// QUIZ.JS - GloseMester v0.1-ALPHA
// Prøvelogikk (elev med kode fra lærer)
// ============================================

/**
 * Komprimer prøvedata til kort kode
 * @param {Array} data - Array med spørsmål/svar
 * @returns {string} Komprimert base64 kode
 */
function komprimer(data) {
    const json = JSON.stringify(data);
    const komprimert = json
        .replace(/"sporsmaal"/g, '"s"')
        .replace(/"svar"/g, '"a"')
        .replace(/\s+/g, '');
    return btoa(unescape(encodeURIComponent(komprimert)));
}

/**
 * Dekomprimer prøvekode
 * @param {string} kode - Komprimert base64 kode
 * @returns {Array} Array med spørsmål/svar
 */
function dekomprimer(kode) {
    try {
        const json = decodeURIComponent(escape(atob(kode)));
        const ekspandert = json
            .replace(/"s"/g, '"sporsmaal"')
            .replace(/"a"/g, '"svar"');
        return JSON.parse(ekspandert);
    } catch (e) {
        // Fallback for gammel format
        try {
            return JSON.parse(atob(kode));
        } catch (e2) {
            throw new Error("Ugyldig kode");
        }
    }
}

/**
 * Start prøve fra kode
 */
function startProve() {
    try {
        const kode = document.getElementById('prove-kode').value.trim();
        
        if (!kode) {
            alert('Vennligst lim inn en prøvekode!');
            return;
        }
        
        aktivProve = dekomprimer(kode);
        
        if (!Array.isArray(aktivProve) || aktivProve.length === 0) {
            throw new Error('Tom prøve');
        }
        
        // Lagre prøven lokalt (14 dager)
        if (typeof lagreProveLokalt === 'function') {
            lagreProveLokalt(kode, aktivProve);
        }
        
        gjeldendeSporsmaalIndex = 0;
        riktigeSvar = 0;
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Prøve', 'Start', `${aktivProve.length} spørsmål`);
        }
        
        document.getElementById('prove-omraade').style.display = 'block';
        document.getElementById('prove-kode').parentElement.style.display = 'none';
        
        visNesteSporsmaal();
        
        console.log('✅ Prøve startet:', aktivProve.length, 'spørsmål');
        
    } catch (e) {
        console.error('❌ Ugyldig kode:', e);
        alert('Ugyldig prøvekode! Sjekk at du har kopiert hele koden.');
    }
}

/**
 * Start lagret prøve
 * @param {string} kode - Prøvekode
 */
function startLagretProve(kode) {
    document.getElementById('prove-kode').value = kode;
    startProve();
}

/**
 * Vis neste spørsmål i prøven
 */
function visNesteSporsmaal() {
    if (gjeldendeSporsmaalIndex < aktivProve.length) {
        const ord = aktivProve[gjeldendeSporsmaalIndex];
        
        // Bruk valgt språkretning
        const sporsmaal = (proveSprak === 'en') ? ord.sporsmaal : ord.svar;
        const placeholder = (proveSprak === 'en') ? "Skriv på engelsk..." : "Skriv på norsk...";
        
        document.getElementById('sporsmaal-tekst').innerText = sporsmaal;
        document.getElementById('svar-input').placeholder = placeholder;
        document.getElementById('svar-input').value = "";
        document.getElementById('feedback').innerText = "";
        document.getElementById('svar-input').focus();
    } else {
        avsluttProve();
    }
}

/**
 * Sjekk svar fra elev
 */
function sjekkSvar() {
    const svar = document.getElementById('svar-input').value.toLowerCase().trim();
    const ord = aktivProve[gjeldendeSporsmaalIndex];
    
    // Fasit basert på språkretning
    const fasit = (proveSprak === 'en') 
        ? ord.svar.toLowerCase().trim() 
        : ord.sporsmaal.toLowerCase().trim();

    if (svar === fasit) {
        document.getElementById('feedback').style.color = "#34c759";
        document.getElementById('feedback').innerText = "Riktig! 🎉";
        riktigeSvar++;
        
        // Legg til poeng
        if (typeof addCorrectAnswerPoint === 'function') {
            addCorrectAnswerPoint();
        }
        
        gjeldendeSporsmaalIndex++;
        setTimeout(visNesteSporsmaal, 1500);
    } else {
        // Vis feil-popup
        if (typeof visFeilMelding === 'function') {
            visFeilMelding(fasit);
        } else {
            document.getElementById('feedback').style.color = "#ff3b30";
            document.getElementById('feedback').innerText = `Feil! Riktig svar: ${fasit}`;
        }
        
        gjeldendeSporsmaalIndex++;
        setTimeout(visNesteSporsmaal, 3000);
    }
}

/**
 * Avslutt prøve og vis resultat
 */
async function avsluttProve() {
    document.getElementById('prove-omraade').style.display = 'none';
    document.getElementById('prove-kode').parentElement.style.display = 'block';
    document.getElementById('prove-kode').value = "";
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Prøve', 'Fullført', `${riktigeSvar}/${aktivProve.length}`);
    }
    
    const prosent = Math.round((riktigeSvar / aktivProve.length) * 100);
    
    // Gi kort hvis bestått (over 50%)
    if (prosent >= 50 && aktivProve.length > 0) {
        alert(`🎉 Gratulerer! ${riktigeSvar}/${aktivProve.length} riktig (${prosent}%)`);
        
        if (typeof hentTilfeldigKort === 'function') {
            await hentTilfeldigKort();
        }
    } else {
        alert(`Du fikk ${riktigeSvar}/${aktivProve.length} (${prosent}%). Prøv igjen!`);
    }
    
    // Oppdater lagrede prøver
    if (typeof visLagredeProver === 'function') {
        visLagredeProver();
    }
}

/**
 * Sett språkretning for prøve
 * @param {string} retning - 'en' eller 'no'
 */
function settProveSprak(retning) {
    proveSprak = retning;
    document.getElementById('prove-lang-en').classList.toggle('active', retning === 'en');
    document.getElementById('prove-lang-no').classList.toggle('active', retning === 'no');
    
    console.log('🌐 Prøvespråk satt til:', retning === 'en' ? 'Engelsk' : 'Norsk');
}

/**
 * Les opp prøvespørsmål
 */
function lesOppProve() {
    const tekst = document.getElementById('sporsmaal-tekst').innerText;
    if (typeof lesOpp === 'function') {
        lesOpp(tekst, 'nb-NO');
    }
}

console.log('📝 quiz.js lastet');