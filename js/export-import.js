// ============================================
// EXPORT-IMPORT.JS - GloseMester v0.1-ALPHA
// Håndterer datapakking (LZString-komprimering)
// ============================================

/**
 * Komprimer JSON-data til en Base64-streng
 */
function komprimer(data) {
    const jsonString = JSON.stringify(data);
    // Vi bruker enkel btoa (Base64) for nå. 
    // I produksjon bør man bruke LZString for bedre komprimering.
    return btoa(encodeURIComponent(jsonString));
}

/**
 * Dekomprimer Base64-streng tilbake til JSON
 */
function dekomprimer(streng) {
    try {
        const jsonString = decodeURIComponent(atob(streng));
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Dekomprimering feilet:", e);
        throw new Error("Ugyldig data");
    }
}

/**
 * EKSPORT: Generer backup-kode av hele brukeren
 */
function genererBrukerBackup() {
    const backupData = {
        navn: localStorage.getItem('aktiv_bruker') || "Spiller",
        kort: JSON.parse(localStorage.getItem('bruker_kort') || "[]"),
        credits: parseInt(localStorage.getItem('bruker_credits') || "0"),
        progress: parseInt(localStorage.getItem('credit_progress') || "0"),
        dato: Date.now(),
        type: 'bruker_backup' // Sikkerhetsstempel
    };
    
    return komprimer(backupData);
}

/**
 * IMPORT: Gjenopprett bruker fra backup-kode
 */
function gjenopprettBruker(kode) {
    try {
        const data = dekomprimer(kode);
        
        // Sikkerhetssjekk
        if (data.type !== 'bruker_backup') {
            alert("Denne koden ser ut som en prøve, ikke en bruker-backup.");
            return false;
        }
        
        // Lagre alt
        localStorage.setItem('aktiv_bruker', data.navn);
        localStorage.setItem('bruker_kort', JSON.stringify(data.kort));
        localStorage.setItem('bruker_credits', data.credits);
        localStorage.setItem('credit_progress', data.progress);
        
        return true;
        
    } catch (e) {
        alert("Koden er ugyldig eller skadet.");
        return false;
    }
}

/**
 * UI: Vis Eksport-popup
 */
function visEksportPopup() {
    const kode = genererBrukerBackup();
    const tekstFelt = document.getElementById('backup-kode-tekst');
    tekstFelt.value = kode;
    
    document.getElementById('innstillinger-popup').style.display = 'none';
    document.getElementById('eksport-popup').style.display = 'flex';
}

/**
 * UI: Kopier kode til utklippstavle
 */
function kopierBackupKode() {
    const felt = document.getElementById('backup-kode-tekst');
    felt.select();
    navigator.clipboard.writeText(felt.value).then(() => {
        alert("✅ Kode kopiert! Send denne til den nye iPaden (e-post, AirDrop, etc).");
    });
}

/**
 * UI: Vis Import-popup
 */
function visImportPopup() {
    document.getElementById('innstillinger-popup').style.display = 'none';
    const kode = prompt("Lim inn backup-koden her:");
    
    if (kode) {
        if (confirm("⚠️ ADVARSEL!\n\nDette vil SLETTE alt på denne enheten og erstatte det med dataene fra koden.\n\nEr du sikker?")) {
            if (gjenopprettBruker(kode)) {
                alert("✅ Suksess! Appen starter på nytt.");
                window.location.reload();
            }
        }
    }
}

console.log('📦 export-import.js lastet (v3 - brukerbackup)');