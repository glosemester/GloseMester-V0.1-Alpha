// ============================================
// STORAGE.JS - GloseMester v1.0 (SECURED)
// Håndterer LocalStorage med obfuskering (Anti-Juks)
// ============================================

const getBruker = () => window.brukerNavn || "Spiller";

// 🛡️ SIKKERHET: Enkel XOR-kryptering for å hindre redigering av poeng
// Dette hindrer elever i å endre "10" til "9999" i Inspector.
const SALT = "GM_2025_NO_CHEAT_KEY_X9";

const safeSave = (key, value) => {
    try {
        const textStr = String(value);
        let result = '';
        // XOR Cipher
        for (let i = 0; i < textStr.length; i++) {
            result += String.fromCharCode(textStr.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
        }
        // Base64 Encode for lagring
        const encoded = btoa(result);
        localStorage.setItem(key, encoded);
    } catch (e) {
        console.error("❌ Feil ved sikker lagring:", e);
    }
};

const safeLoad = (key) => {
    try {
        const encoded = localStorage.getItem(key);
        if (!encoded) return 0;

        // Base64 Decode
        const text = atob(encoded);
        let result = '';
        // XOR Decipher
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
        }
        
        const num = parseInt(result);
        
        // Sjekk: Er resultatet et faktisk tall?
        if (isNaN(num)) {
            throw new Error("Korrupt data");
        }
        return num;

    } catch (e) {
        console.warn(`⚠️ Jukse-forsøk eller korrupt data oppdaget for ${key}. Resetter til 0.`);
        // STRAFF: Hvis dataen er tuklet med, nullstill poengene.
        localStorage.removeItem(key); 
        return 0;
    }
};

// ============================================
// PUBLIC API (Uendret signatur)
// ============================================

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

export function setSamling(samling) {
    try {
        const navn = getBruker();
        localStorage.setItem('samling_' + navn, JSON.stringify(samling));
    } catch (e) {
        console.error('❌ Feil ved lagring av samling:', e);
    }
}

export function lagreBrukerKort(kort) {
    const samling = getSamling();
    samling.push(kort);
    setSamling(samling);
    console.log('✅ Kort lagret sikkert:', kort.navn);
}

// --- SECURED FUNCTIONS START ---

export function getCredits() {
    const navn = getBruker();
    return safeLoad('credits_' + navn); // Bruker nå safeLoad
}

export function saveCredits(antall) {
    const navn = getBruker();
    safeSave('credits_' + navn, antall); // Bruker nå safeSave
}

export function getTotalCorrect() {
    const navn = getBruker();
    return safeLoad('total_correct_' + navn); // Bruker nå safeLoad
}

export function saveTotalCorrect(antall) {
    const navn = getBruker();
    safeSave('total_correct_' + navn, antall); // Bruker nå safeSave
}

// --- SECURED FUNCTIONS END ---

export async function hentLokaleProver() {
    let lokaleData = [];
    try {
        const rawLocal = localStorage.getItem('lokale_prover');
        lokaleData = rawLocal ? JSON.parse(rawLocal) : [];
        
        if (navigator.onLine) {
            const fb = await import('../features/firebase.js');
            const user = fb.auth.currentUser;

            if (user) {
                console.log("☁️ Henter prøver fra skyen...");
                const q = fb.query(
                    fb.collection(fb.db, "prover"), 
                    fb.where("opprettet_av", "==", user.uid),
                    fb.orderBy("opprettet_dato", "desc")
                );
                
                const querySnapshot = await fb.getDocs(q);
                const cloudData = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    cloudData.push({ 
                        id: doc.id, 
                        tittel: data.tittel || data.navn || "Uten navn",
                        ordliste: data.ordliste || [],
                        opprettet_dato: data.opprettet_dato
                    });
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

export async function lagreLokaleProver(prove) {
    let bib = [];
    try {
        bib = JSON.parse(localStorage.getItem('lokale_prover')) || [];
    } catch(e) {}
    
    const nyProve = {
        id: prove.id || Date.now().toString(),
        tittel: prove.tittel || prove.navn || "Ny Prøve",
        ordliste: prove.ordliste || [],
        opprettet_dato: prove.opprettet_dato || new Date().toISOString()
    };
    
    bib.push(nyProve);
    localStorage.setItem('lokale_prover', JSON.stringify(bib));

    try {
        if (navigator.onLine) {
            const fb = await import('../features/firebase.js');
            const user = fb.auth.currentUser;

            if (user) {
                console.log("☁️ Lagrer backup i skyen...");
                const docData = {
                    tittel: nyProve.tittel,
                    ordliste: nyProve.ordliste,
                    opprettet_av: user.uid,
                    opprettet_dato: fb.serverTimestamp()
                };
                await fb.addDoc(fb.collection(fb.db, "prover"), docData);
                console.log("✅ Lagret i skyen!");
            }
        }
    } catch (e) {
        console.error("❌ Feil ved skylagring (storage.js):", e);
    }
}

export function lagreElevProveLokalt(proveData) {
    let historikk = hentElevProverLokalt();
    const id = proveData.id || "ukjent_" + Date.now();
    
    historikk = historikk.filter(p => p.id !== id);
    
    historikk.unshift({
        id: id,
        tittel: proveData.tittel || "Navnløs Prøve",
        ordliste: proveData.ord || proveData.ordliste,
        lagretDato: Date.now(),
        utloperDato: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dager
    });
    
    localStorage.setItem('elev_prove_historikk', JSON.stringify(historikk));
}

export function hentElevProverLokalt() {
    try {
        const raw = localStorage.getItem('elev_prove_historikk');
        if (!raw) return [];
        
        let liste = JSON.parse(raw);
        const naa = Date.now();
        
        const gyldige = liste.filter(p => p.utloperDato > naa);
        
        if (gyldige.length !== liste.length) {
            localStorage.setItem('elev_prove_historikk', JSON.stringify(gyldige));
        }
        
        return gyldige;
    } catch (e) {
        return [];
    }
}