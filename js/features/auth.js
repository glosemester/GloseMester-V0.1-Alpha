/* js/features/auth.js
   Håndterer eksport og import av data (Backup-systemet).
   Ingen personlige data sendes ut, alt er basert på lokal tekst.
*/

export function opprettBackup() {
    // 1. Hent data fra LocalStorage (Foreløpig tomt, så vi lager testdata)
    // Senere bytter vi dette med ekte data.
    const data = {
        bruker: "Elev",
        dato: new Date().toLocaleDateString(),
        innhold: "Dette er en test på backup"
    };

    // 2. Gjør om data til en tekststreng (JSON)
    const jsonStreng = JSON.stringify(data);

    // 3. "Krypter" teksten til Base64 (så det ser ut som en kode, og ikke ren tekst)
    // Dette er ikke ekte sikkerhet, men hindrer at man kan lese det med det blotte øye.
    const kode = btoa(jsonStreng);

    // 4. Vis koden i tekstboksen i HTML-en
    const tekstBoks = document.getElementById('backup-kode-tekst');
    if (tekstBoks) {
        tekstBoks.value = kode;
        
        // Marker teksten og kopier til utklippstavlen
        tekstBoks.select();
        navigator.clipboard.writeText(kode)
            .then(() => alert("Koden er kopiert til utklippstavlen!"))
            .catch(err => console.error("Klarte ikke kopiere: ", err));
    }
}

export function lastInnBackup() {
    // Denne lager vi senere når vi skal hente inn data
    console.log("Funksjon for å laste inn backup kommer her.");
}