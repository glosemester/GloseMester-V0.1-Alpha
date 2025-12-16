// ============================================
// STORAGE.JS - GloseMester v1.0 (Module)
// ============================================

// Hjelpefunksjon for å hente global brukernavn trygt
const getBruker = () => window.brukerNavn || "Spiller";

/**
 * Hent brukerens samling (Elev - Lokalt)
 */
export function getSamling() {
    try {
        const navn = getBruker();
        const data = localStorage.getItem('samling_' + navn);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('❌ Feil ved henting av samling:', e);
        return [];
    }
}

/**
 * Lagre brukerens samling (Elev - Lokalt)
 */
export function setSamling(samling) {
    try {
        const navn = getBruker();
        localStorage.setItem('samling_' + navn, JSON.stringify(samling));
    } catch (e) {
        console.error('❌ Feil ved lagring av samling:', e);
    }
}

/**
 * Legg til kort i samling
 */
export function lagreBrukerKort(kort) {
    const samling = getSamling();
    // Sjekk om kortet allerede finnes (unngå duplikater hvis ønskelig, ellers legg til)
    samling.push(kort);
    setSamling(samling);
    console.log('✅ Kort lagret i LocalStorage:', kort.navn);
}

/**
 * Hent lærerns prøvebibliotek (Hybrid: Cloud først, så Local)
 */
export async function hentLokaleProver() {
    let lokaleData = [];
    try {
        const rawLocal = localStorage.getItem('lokale_prover');
        lokaleData = rawLocal ? JSON.parse(rawLocal) : [];
        
        if (navigator.onLine) {
            // Importér Firebase kun ved behov
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
                    cloudData.push({ id: doc.id, ...doc.data() });
                });

                localStorage.setItem('lokale_prover', JSON.stringify(cloudData));
                return cloudData;
            }
        }
    } catch (e) {
        console.warn("⚠️ Kunne ikke hente fra skyen, bruker lokal cache.", e);
    }
    return lokaleData;
}

/**
 * Lagre prøve (Hybrid: Prøv Cloud, fallback til Local)
 */
export async function lagreLokaleProver(prove) {
    let bib = [];
    try {
        bib = JSON.parse(localStorage.getItem('lokale_prover')) || [];
    } catch(e) {}
    
    if (!prove.id) prove.id = Date.now().toString();
    if (!prove.opprettet) prove.opprettet = new Date().toISOString();
    
    bib.push(prove);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));

    try {
        if (navigator.onLine) {
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
            }
        }
    } catch (e) {
        console.error("❌ Feil ved skylagring:", e);
        alert("Lagret lokalt. Kunne ikke synkronisere med skyen.");
    }
}/**
 * Hent antall credits (poeng)
 */
export function getCredits() {
    try {
        const navn = getBruker();
        const stored = localStorage.getItem('credits_' + navn);
        return stored ? parseInt(stored) : 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Lagre credits
 */
export function saveCredits(antall) {
    try {
        const navn = getBruker();
        localStorage.setItem('credits_' + navn, antall.toString());
    } catch (e) {
        console.error("Kunne ikke lagre credits", e);
    }
}