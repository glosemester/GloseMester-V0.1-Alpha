// ============================================
// QUIZ.JS - GloseMester v1.0 (Module)
// ============================================

import { hentTilfeldigKort } from './practice.js';
import { visFeilMelding } from './kort-display.js';

function komprimer(data) {
    const json = JSON.stringify(data).replace(/"sporsmaal"/g, '"s"').replace(/"svar"/g, '"a"');
    return btoa(unescape(encodeURIComponent(json)));
}

function dekomprimer(kode) {
    try {
        const json = decodeURIComponent(escape(atob(kode))).replace(/"s"/g, '"sporsmaal"').replace(/"a"/g, '"svar"');
        return JSON.parse(json);
    } catch (e) { return JSON.parse(atob(kode)); }
}

export function startProve() {
    try {
        const kode = document.getElementById('prove-kode').value.trim();
        if (!kode) { alert('Lim inn kode!'); return; }
        
        window.aktivProve = dekomprimer(kode);
        if (!Array.isArray(window.aktivProve)) throw new Error('Tom prøve');
        
        if (typeof lagreProveLokalt === 'function') lagreProveLokalt(kode, window.aktivProve);
        
        window.gjeldendeSporsmaalIndex = 0;
        window.riktigeSvar = 0;
        
        if (typeof trackEvent === 'function') trackEvent('Prøve', 'Start', `${window.aktivProve.length} ord`);
        
        document.getElementById('prove-omraade').style.display = 'block';
        document.getElementById('prove-kode').parentElement.style.display = 'none';
        visNesteSporsmaal();
        
    } catch (e) { alert('Ugyldig kode!'); console.error(e); }
}

// Brukes av "Mine Prøver" listen
export function startLagretProve(kode) {
    document.getElementById('prove-kode').value = kode;
    startProve();
}

function visNesteSporsmaal() {
    if (window.gjeldendeSporsmaalIndex < window.aktivProve.length) {
        const ord = window.aktivProve[window.gjeldendeSporsmaalIndex];
        const sporsmaal = (window.proveSprak === 'en') ? ord.sporsmaal : ord.svar;
        const placeholder = (window.proveSprak === 'en') ? "Skriv på engelsk..." : "Skriv på norsk...";
        
        document.getElementById('sporsmaal-tekst').innerText = sporsmaal;
        document.getElementById('svar-input').placeholder = placeholder;
        document.getElementById('svar-input').value = "";
        document.getElementById('feedback').innerText = "";
        document.getElementById('svar-input').focus();
    } else {
        avsluttProve();
    }
}

export function sjekkSvar() {
    const svar = document.getElementById('svar-input').value.toLowerCase().trim();
    const ord = window.aktivProve[window.gjeldendeSporsmaalIndex];
    const fasit = (window.proveSprak === 'en') ? ord.svar.toLowerCase().trim() : ord.sporsmaal.toLowerCase().trim();

    if (svar === fasit) {
        document.getElementById('feedback').style.color = "#34c759";
        document.getElementById('feedback').innerText = "Riktig! 🎉";
        window.riktigeSvar++;
        if (typeof addCorrectAnswerPoint === 'function') addCorrectAnswerPoint();
        window.gjeldendeSporsmaalIndex++;
        setTimeout(visNesteSporsmaal, 1500);
    } else {
        visFeilMelding(fasit);
        window.gjeldendeSporsmaalIndex++;
        setTimeout(visNesteSporsmaal, 3000);
    }
}

async function avsluttProve() {
    document.getElementById('prove-omraade').style.display = 'none';
    document.getElementById('prove-kode').parentElement.style.display = 'block';
    document.getElementById('prove-kode').value = "";
    
    if (typeof trackEvent === 'function') trackEvent('Prøve', 'Fullført', `${window.riktigeSvar}/${window.aktivProve.length}`);
    
    const prosent = Math.round((window.riktigeSvar / window.aktivProve.length) * 100);
    
    if (prosent >= 50 && window.aktivProve.length > 0) {
        alert(`🎉 Gratulerer! ${prosent}% riktig!`);
        await hentTilfeldigKort(); // Fra practice.js
    } else {
        alert(`Du fikk ${prosent}%. Prøv igjen!`);
    }
    
    if (typeof window.visLagredeProver === 'function') window.visLagredeProver();
}

export function settProveSprak(retning) {
    window.proveSprak = retning;
    document.getElementById('prove-lang-en').classList.toggle('active', retning === 'en');
    document.getElementById('prove-lang-no').classList.toggle('active', retning === 'no');
}

export function lesOppProve() {
    const tekst = document.getElementById('sporsmaal-tekst').innerText;
    if (typeof lesOpp === 'function') lesOpp(tekst, 'nb-NO');
}