// ============================================
// QUIZ.JS - Ta Prøver
// ============================================
import { spillLyd, vibrer, visToast, lagConfetti, lesOpp } from '../ui/helpers.js';
import { hentTilfeldigKort } from './kort-display.js';
import { trackEvent } from '../core/analytics.js';

let aktivProve = [];
let quizIndex = 0;
let antallRiktige = 0;

export function startProve(kode) {
    if (!kode) {
        // Hvis ingen kode sendes inn, prøv å hente fra input-feltet
        const input = document.getElementById('prove-kode');
        if (input) kode = input.value.trim();
    }
    
    if (!kode) {
        visToast('Mangler prøve-kode!', 'error');
        return;
    }
    
    try {
        // Dekomprimer koden (Base64 -> JSON)
        const json = decodeURIComponent(atob(kode));
        const data = JSON.parse(json);
        
        // Støtte for både gammelt format (array) og nytt format (objekt med tittel)
        aktivProve = data.ord || data; 
        
        // Nullstill state
        quizIndex = 0;
        antallRiktige = 0;
        window.proveSprak = 'no'; // Standard retning
        
        // Vis riktig skjerm
        if(window.visSide) window.visSide('elev-dashboard'); // Sikre at vi er på rett side
        
        document.getElementById('prove-omraade').style.display = 'block';
        document.getElementById('elev-start-skjerm').style.display = 'none';
        
        visNesteSporsmaal();
        
        // Analytics
        trackEvent('Quiz', 'Start', data.tittel || 'Ukjent');

    } catch (e) {
        console.error(e);
        visToast('Ugyldig prøve-kode', 'error');
        vibrer([50, 50, 50]);
    }
}

function visNesteSporsmaal() {
    if (quizIndex >= aktivProve.length) {
        avsluttProve();
        return;
    }
    
    const ord = aktivProve[quizIndex];
    // Sjekk språkinnstilling (Global state eller default)
    const spraak = window.proveSprak || 'no';
    
    // Hvis norsk: Vis spørsmål, vent på svar. Hvis engelsk: Vis svar, vent på spørsmål.
    const spmTekst = spraak === 'en' ? ord.svar : ord.sporsmaal;
    
    document.getElementById('quiz-spm').innerText = spmTekst;
    document.getElementById('quiz-input').value = '';
    document.getElementById('quiz-input').focus();
    
    // Oppdater teller (f.eks "1 / 10")
    const progressElem = document.getElementById('quiz-progress');
    if(progressElem) progressElem.innerText = `${quizIndex + 1} / ${aktivProve.length}`;
}

export function sjekkSvar() {
    const inputFelt = document.getElementById('quiz-input');
    const input = inputFelt.value.trim().toLowerCase();
    
    const fasitObj = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';
    
    // Finn fasiten basert på retning
    const fasit = (spraak === 'en' ? fasitObj.sporsmaal : fasitObj.svar).toLowerCase();

    if (input === fasit) {
        spillLyd('riktig');
        visToast('Riktig! 🌟', 'success');
        antallRiktige++;
    } else {
        spillLyd('feil');
        vibrer(200);
        alert(`Feil dessverre.\nRiktig svar var: ${fasit}`);
    }
    
    quizIndex++;
    visNesteSporsmaal();
}

// DENNE MANGLET SIST 👇
export function settProveSprak(retning) {
    window.proveSprak = retning;
    visToast(`Språk endret til ${retning === 'no' ? 'Norsk' : 'Engelsk'}`, 'info');
    // Hvis vi er midt i en prøve, oppdater teksten
    if(document.getElementById('prove-omraade').style.display === 'block') {
        visNesteSporsmaal();
    }
}

// DENNE MANGLET OGSÅ 👇
export function lesOppProve() {
    if (quizIndex >= aktivProve.length) return;
    
    const ord = aktivProve[quizIndex];
    const spraak = window.proveSprak || 'no';
    
    // Hvis vi skal svare på engelsk, leser vi opp det norske ordet (og vice versa)
    const tekst = spraak === 'en' ? ord.svar : ord.sporsmaal;
    const langCode = spraak === 'en' ? 'en-US' : 'nb-NO';
    
    lesOpp(tekst, langCode);
}

async function avsluttProve() {
    const prosent = Math.round((antallRiktige / aktivProve.length) * 100);
    let melding = `Du fikk ${antallRiktige} av ${aktivProve.length} riktige (${prosent}%).`;
    
    if (prosent >= 80) {
        spillLyd('vinn');
        lagConfetti();
        melding += "\n\n🎉 Du har vunnet et kort!";
        await hentTilfeldigKort(); // Gir belønning
    } else {
        melding += "\n\nPrøv igjen for å vinne kort (må ha 80% riktig).";
    }
    
    alert(melding);
    
    // Reset UI
    document.getElementById('prove-omraade').style.display = 'none';
    document.getElementById('elev-start-skjerm').style.display = 'block';
    
    trackEvent('Quiz', 'Ferdig', `${prosent}%`);
}