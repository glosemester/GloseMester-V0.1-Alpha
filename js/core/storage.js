// ============================================
// STORAGE.JS - GloseMester v1.0
// localStorage håndtering med Cloud Fallback
// ============================================

/**
 * Hent brukerens samling (Elev - Lokalt)
 */
function getSamling() {
    try {
        const data = localStorage.getItem('samling_' + brukerNavn);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('❌ Feil ved henting av samling:', e);
        return [];
    }
}

/**
 * Lagre brukerens samling (Elev - Lokalt)
 */
function setSamling(samling) {
    try {
        localStorage.setItem('samling_' + brukerNavn, JSON.stringify(samling));
    } catch (e) {
        console.error('❌ Feil ved lagring av samling:', e);
    }
}

/**
 * Legg til kort i samling
 */
function lagreBrukerKort(kort) {
    const samling = getSamling();
    samling.push(kort);
    setSamling(samling);
    console.log('✅ Kort lagt til:', kort.navn);
}

// ... (Behold andre hjelpefunksjoner for credits etc. som de var) ...

/**
 * Hent lærerns prøvebibliotek (Hybrid: Cloud først, så Local)
 */
async function hentLokaleProver() {
    let lokaleData = [];
    try {
        // 1. Hent alltid lokal backup først (raskest)
        const rawLocal = localStorage.getItem('lokale_prover');
        lokaleData = rawLocal ? JSON.parse(rawLocal) : [];
        
        // 2. Sjekk om vi er online og skal bruke skyen
        if (navigator.onLine) {
            // 👇 ENDRET STI HER: Peker nå til ../features/firebase.js
            const fb = await import('../features/firebase.js');
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
                    // Vi lagrer Firestore-IDen slik at vi kan slette den senere
                    cloudData.push({ id: doc.id, ...doc.data() });
                });

                // 3. Oppdater lokal cache med ferske data fra skyen
                localStorage.setItem('lokale_prover', JSON.stringify(cloudData));
                return cloudData;
            }
        }
    } catch (e) {
        console.warn("⚠️ Kunne ikke hente fra skyen (eller ikke logget inn), bruker lokal cache.", e);
    }

    // 4. Fallback: Returner lokal data
    return lokaleData;
}

/**
 * Lagre prøve (Hybrid: Prøv Cloud, fallback til Local)
 */
async function lagreLokaleProver(prove) {
    // Alltid lagre lokalt først (Sikrer mot datatap)
    let bib = [];
    try {
        bib = JSON.parse(localStorage.getItem('lokale_prover')) || [];
    } catch(e) {}
    
    if (!prove.id) prove.id = Date.now().toString(); // Midlertidig ID
    if (!prove.opprettet) prove.opprettet = new Date().toISOString();
    
    bib.push(prove);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));

    // Prøv å lagre i skyen
    try {
        if (navigator.onLine) {
            // 👇 ENDRET STI HER OGSÅ:
            const fb = await import('../features/firebase.js');
            const user = fb.auth.currentUser;

            if (user) {
                console.log("☁️ Lagrer prøve i skyen...");
                
                const docData = {
                    navn: prove.navn,
                    ordliste: prove.ordliste,
                    eierId: user.uid,
                    opprettet: prove.opprettet
                };

                await fb.addDoc(fb.collection(fb.db, "prover"), docData);
                console.log("✅ Lagret i skyen!");
                
                // Vi burde hente listen på nytt for å få ekte ID, men dette holder for nå
            }
        }
    } catch (e) {
        console.error("❌ Feil ved skylagring:", e);
        alert("Lagret lokalt. Kunne ikke synkronisere med skyen akkurat nå.");
    }
}

// For bakoverkompatibilitet hvis andre filer kaller slettLokaleProver (ikke async)
function slettLokaleProver(id) {
    // Dette er en placeholder. Ekte sletting skjer nå i teacher.js via slettProve()
    console.warn("Bruk slettProve() i teacher.js for å slette fra skyen.");
}