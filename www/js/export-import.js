// ============================================
// EXPORT-IMPORT.JS - GloseMester v1.0 (Module)
// ============================================

// Merk: Denne er foreløpig frittstående men eksporteres for app.js

export function visEksportPopup() {
    const backupData = {
        navn: localStorage.getItem('aktiv_bruker') || "Spiller",
        kort: JSON.parse(localStorage.getItem('bruker_kort') || "[]"),
        credits: parseInt(localStorage.getItem('bruker_credits') || "0"),
        progress: parseInt(localStorage.getItem('credit_progress') || "0"),
        dato: Date.now(),
        type: 'bruker_backup'
    };
    
    const kode = btoa(encodeURIComponent(JSON.stringify(backupData)));
    const tekstFelt = document.getElementById('backup-kode-tekst');
    if(tekstFelt) tekstFelt.value = kode;
    
    const settings = document.getElementById('innstillinger-popup');
    const exportP = document.getElementById('eksport-popup');
    if(settings) settings.style.display = 'none';
    if(exportP) exportP.style.display = 'flex';
}

export function kopierBackupKode() {
    const felt = document.getElementById('backup-kode-tekst');
    felt.select();
    navigator.clipboard.writeText(felt.value).then(() => {
        alert("✅ Kode kopiert!");
    });
}

export function visImportPopup() {
    document.getElementById('innstillinger-popup').style.display = 'none';
    const kode = prompt("Lim inn backup-koden her:");
    if (kode && confirm("Dette overskriver alt. Er du sikker?")) {
        try {
            const data = JSON.parse(decodeURIComponent(atob(kode)));
            if (data.type !== 'bruker_backup') throw new Error();
            
            localStorage.setItem('aktiv_bruker', data.navn);
            localStorage.setItem('bruker_kort', JSON.stringify(data.kort));
            localStorage.setItem('bruker_credits', data.credits);
            localStorage.setItem('credit_progress', data.progress);
            
            alert("✅ Suksess! Appen starter på nytt.");
            window.location.reload();
        } catch (e) {
            alert("Ugyldig kode.");
        }
    }
}