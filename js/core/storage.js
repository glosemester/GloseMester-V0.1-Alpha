/**
 * Hent lærerns prøvebibliotek (Hybrid: Cloud først, så Local)
 * @returns {Promise<Array>} Array med prøver
 */
async function hentLokaleProver() {
    let lokaleData = [];
    try {
        // 1. Hent alltid lokal backup først (raskest)
        const rawLocal = localStorage.getItem('lokale_prover');
        lokaleData = rawLocal ? JSON.parse(rawLocal) : [];
        
        // 2. Sjekk om vi er online og skal bruke skyen
        if (navigator.onLine) {
            // Last Firebase dynamisk - KUN her, ikke på toppen av filen!
            const fb = await import('./cloud/firebase.js');
            const user = fb.auth.currentUser;

            if (user) {
                console.log("☁️ Henter prøver fra skyen...");
                const q = fb.query(
                    fb.collection(fb.db, "prover"), 
                    fb.where("eierId", "==", user.uid),
                    fb.orderBy("opprettet", "desc")
                );
                
                const querySnapshot = await fb.getDocs(q);
                const cloudData = [];
                
                querySnapshot.forEach((doc) => {
                    cloudData.push({ id: doc.id, ...doc.data() });
                });

                // 3. Oppdater lokal cache med ferske data fra skyen
                localStorage.setItem('lokale_prover', JSON.stringify(cloudData));
                return cloudData;
            }
        }
    } catch (e) {
        console.warn("⚠️ Kunne ikke hente fra skyen, bruker lokal cache:", e);
    }

    // 4. Fallback: Returner lokal data hvis offline eller ikke logget inn
    return lokaleData;
}

/**
 * Lagre prøve (Hybrid: Prøv Cloud, fallback til Local)
 * @param {object} prove - Prøve-objektet
 */
async function lagreLokaleProver(prove) {
    // Alltid lagre lokalt først (Sikrer mot datatap)
    let bib = [];
    try {
        bib = JSON.parse(localStorage.getItem('lokale_prover')) || [];
    } catch(e) {}
    
    // Generer ID hvis den mangler (bruker timestamp for lokal, men Firebase lager egen ID)
    if (!prove.id) prove.id = Date.now().toString();
    if (!prove.opprettet) prove.opprettet = new Date().toISOString();
    
    // Oppdater lokal liste
    bib.push(prove);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));

    // Prøv å lagre i skyen
    try {
        if (navigator.onLine) {
            const fb = await import('./cloud/firebase.js');
            const user = fb.auth.currentUser;

            if (user) {
                console.log("☁️ Lagrer prøve i skyen...");
                
                // Klargjør data for Firestore (fjern ID, den settes av dokumentet eller overskrives)
                const docData = {
                    navn: prove.navn,
                    ordliste: prove.ordliste,
                    eierId: user.uid,
                    opprettet: prove.opprettet
                };

                // Lagre til Firestore
                await fb.addDoc(fb.collection(fb.db, "prover"), docData);
                console.log("✅ Lagret i skyen!");
                
                // Her burde vi ideelt sett hentet ny liste for å få riktige ID-er,
                // men for v1.0 holder vi det enkelt.
            }
        } else {
            console.log("⚠️ Offline: Prøve lagret kun lokalt. Husk å sync senere.");
            // Her kan du legge til logikk for "unsynced" flagg senere
        }
    } catch (e) {
        console.error("❌ Feil ved skylagring:", e);
        alert("Kunne ikke lagre i skyen (er du logget inn?). Prøven er lagret lokalt på denne enheten.");
    }
}