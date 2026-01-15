/* ============================================
   TEACHER.JS - FIXED v3.6
   Fikset: abonnement → abo (linje 154)
   ============================================ */

import { visSide } from '../core/navigation.js';
import { visToast, spillLyd } from '../ui/helpers.js';
import { auth, db, collection, addDoc, serverTimestamp, getDoc, doc, updateDoc } from './firebase.js';

// ==============================================
// INITIALISERING
// ==============================================

export function initTeacherFeatures() {
    console.log("🎓 Lærer-modul lastet v0.9.8");
    
    window.leggTilOrd = leggTilOrd;
    window.lagreProve = lagreProve;
    window.tomListe = tomListe;
    window.slettOrd = window.slettOrd || function(){};
    window.sjekkKampanjeKode = sjekkKampanjeKode;
    window.visAbonnementInfo = visAbonnementInfo; 
    
    setTimeout(setupKeyboardShortcuts, 1000);
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await oppdaterTilgang(user);
        }
    });
}

// ==============================================
// TILGANGSKONTROLL & DASHBOARD-TEKST
// ==============================================

async function oppdaterTilgang(user) {
    try {
        const abo = await sjekkAbonnement(user);
        
        const harPremiumTilgang = (abo.tier === 'premium' || abo.tier === 'school' || abo.tier === 'skolepakke');
        
        const btnStandard = document.getElementById('btn-standardprover');
        const btnGlosebank = document.getElementById('btn-glosebank-browse');
        
        // 1. Standardprøver (Premium + Skole)
        if (btnStandard) {
            if (harPremiumTilgang) {
                btnStandard.style.display = 'block';
                btnStandard.onclick = () => { 
                    visSide('standardprover'); 
                    if(window.lukkHamburger) window.lukkHamburger(); 
                };
            } else {
                btnStandard.onclick = () => {
                    visToast("🔒 Krever Premium eller Skolepakke", "warning");
                    document.getElementById('upgrade-modal').style.display='flex';
                };
            }
        }

        // 2. GloseBank (Kun Skolepakke/Admin)
        if (btnGlosebank) {
            if (abo.tier === 'school' || abo.tier === 'skolepakke') {
                btnGlosebank.style.display = 'block';
            } else {
                btnGlosebank.style.display = 'none';
            }
        }
        
        // 3. Dashboard abonnement-boks
        const infoDiv = document.getElementById('abonnement-info');
        if (infoDiv) {
            let statusTekst = 'Gratis versjon';
            let farge = '#6B7280';
            let tekst = 'Du har 3 gratis prøver.';
            
            if (abo.tier === 'premium') { 
                statusTekst = '⭐ Premium Lærer'; 
                farge = '#10B981';
                tekst = 'Du har full tilgang.';
            } else if (abo.tier === 'skolepakke' || abo.tier === 'school') { 
                statusTekst = '🏫 Skolepakke'; 
                farge = '#8B5CF6';
                tekst = 'Skolelisens aktivert.';
            }
            
            infoDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="color:${farge}; margin:0;">${statusTekst}</h3>
                        <p style="font-size:13px; color:#666; margin:5px 0 0 0;">${tekst}</p>
                    </div>
                    <button class="btn-secondary btn-small" onclick="visAbonnementInfo()">Min Side</button>
                </div>
            `;
        }

    } catch (e) {
        console.error("Feil ved tilgangssjekk:", e);
    }
}

// ==============================================
// ABONNEMENT SJEKK (MASTER LOGIKK)
// ==============================================

async function sjekkAbonnement(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            return { kanLageProver: true, tier: 'free', proverIgjen: 3, abonnementInfo: { status: 'free' } };
        }
        
        const data = userSnap.data();
        const abo = data.abonnement || {}; 
        const sub = data.subscription || {}; 
        const proverOpprettet = data.proverOpprettet || 0;
        
        // 1. Sjekk Vipps (Premium)
        if (sub.status === 'premium') {
             const expires = sub.expiresAt?.toDate();
             if (expires && Date.now() < expires.getTime()) {
                 return { kanLageProver: true, tier: 'premium', proverIgjen: Infinity, abonnementInfo: sub };
             }
        }

        // 2. Sjekk Skolepakke / Admin
        if (abo.status === 'active' || abo.type === 'skolepakke' || abo.status === 'school') {
            const utloper = abo.utloper?.toDate();
            if (!utloper || Date.now() < utloper.getTime()) {
                return { kanLageProver: true, tier: 'skolepakke', proverIgjen: Infinity, abonnementInfo: abo };
            }
        }

        // 3. Fallback til GRATIS
        // ✅ FIKSET: abonnement → abo
        return { 
            kanLageProver: proverOpprettet < 3, 
            tier: 'free', 
            proverIgjen: Math.max(0, 3 - proverOpprettet), 
            abonnementInfo: abo 
        };
        
    } catch (error) {
        console.error("Abo-sjekk feil:", error);
        return { kanLageProver: true, tier: 'free', proverIgjen: 3 }; 
    }
}

// ==============================================
// PRØVE-EDITOR
// ==============================================

let midlertidigProveListe = [];

export function leggTilOrd() {
    const spmInput = document.getElementById('norsk-ord');
    const svarInput = document.getElementById('engelsk-ord');
    
    if (!spmInput || !svarInput) return;
    
    const norsk = spmInput.value.trim();
    const engelsk = svarInput.value.trim();
    
    if (!norsk || !engelsk) { 
        visToast("Skriv både norsk og engelsk ord.", "error"); 
        spmInput.focus();
        return; 
    }
    
    midlertidigProveListe.push({ s: norsk, e: engelsk });
    oppdaterEditorListe();
    
    spmInput.value = ''; 
    svarInput.value = ''; 
    spmInput.focus();
    spillLyd('klikk');
}

function oppdaterEditorListe() {
    const listeEl = document.getElementById('ordliste-preview');
    if (!listeEl) return;
    
    listeEl.innerHTML = '';
    
    if (midlertidigProveListe.length === 0) {
        listeEl.innerHTML = `<p style="color:#999; text-align:center; padding:20px;">Ingen ord lagt til.</p>`;
    }

    midlertidigProveListe.forEach((ord, index) => {
        const li = document.createElement('li');
        li.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:12px 15px; background:#f9f9f9; border-radius:8px; margin-bottom:8px; border-left: 3px solid #0071e3;`;
        li.innerHTML = `
            <span style="flex:1;">
                <strong style="color:#0071e3;">${ord.s}</strong> 
                <span style="color:#999; margin:0 10px;">→</span> 
                <span style="color:#333;">${ord.e}</span>
            </span> 
            <button onclick="slettOrd(${index})" class="btn-danger btn-small">🗑️</button>
        `;
        listeEl.appendChild(li);
    });
    
    const lagreBtn = document.querySelector('#lag-prove .btn-primary[onclick*="lagreProve"]');
    if(lagreBtn) {
        lagreBtn.disabled = midlertidigProveListe.length < 3;
        lagreBtn.style.opacity = midlertidigProveListe.length < 3 ? '0.5' : '1';
    }
}

window.slettOrd = function(index) {
    if (index < 0 || index >= midlertidigProveListe.length) return;
    midlertidigProveListe.splice(index, 1);
    oppdaterEditorListe();
};

export function tomListe() {
    if (midlertidigProveListe.length > 0 && confirm("Er du sikker på at du vil slette alt?")) {
        midlertidigProveListe = [];
        oppdaterEditorListe();
    }
}

export async function lagreProve() {
    const tittelInput = document.getElementById('prove-tittel');
    const tittel = tittelInput?.value.trim();
    
    if (!tittel) { visToast("Prøven må ha et navn!", "error"); return; }
    if (midlertidigProveListe.length < 3) { visToast("Minst 3 ord må legges til.", "error"); return; }
    
    const user = auth.currentUser;
    if (!user) { visToast("Logg inn først.", "error"); return; }

    try {
        const abo = await sjekkAbonnement(user);
        if (!abo.kanLageProver) {
            visToast("Du har nådd grensen for gratisversjonen.", "warning");
            document.getElementById('upgrade-modal').style.display = 'flex';
            return;
        }

        const lagreBtn = document.querySelector('#lag-prove .btn-primary[onclick*="lagreProve"]');
        if(lagreBtn) { lagreBtn.innerText = "Lagrer..."; lagreBtn.disabled = true; }

        const docRef = await addDoc(collection(db, "prover"), {
            tittel: tittel,
            ordliste: midlertidigProveListe,
            opprettet_av: user.uid,
            opprettet_av_epost: user.email,
            opprettet_dato: serverTimestamp(),
            antall_gjennomforinger: 0,
            aktiv: true
        });
        
        // Backup til GloseBank - ALLE lærere kan dele prøver
        try {
            await addDoc(collection(db, "glosebank"), {
                tittel: tittel,
                ordliste: midlertidigProveListe,
                delt_av: user.uid,
                delt_av_epost: user.email,
                delt_dato: serverTimestamp(),
                status: "pending",
                synlig_for_kunder: false,
                original_prove_id: docRef.id,
                nedlastninger: 0
            });
            console.log("✅ Backup til GloseBank OK");
        } catch(e) { 
            console.warn("⚠️ GloseBank backup failed:", e); 
        }

        await inkrementerProveAntall(user);
        
        spillLyd('fanfare');
        visToast("✅ Prøve lagret!", "success");
        
        midlertidigProveListe = [];
        tittelInput.value = '';
        oppdaterEditorListe();
        
        setTimeout(() => {
            if(lagreBtn) { lagreBtn.innerText = "💾 Lagre Prøve"; lagreBtn.disabled = false; }
            visSide('lagrede-prover');
            if (typeof window.oppdaterProveliste === 'function') window.oppdaterProveliste();
        }, 1500);

    } catch (e) {
        console.error(e);
        visToast("Feil ved lagring.", "error");
        const lagreBtn = document.querySelector('#lag-prove .btn-primary[onclick*="lagreProve"]');
        if(lagreBtn) { lagreBtn.innerText = "💾 Lagre Prøve"; lagreBtn.disabled = false; }
    }
}

async function inkrementerProveAntall(user) {
    try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const count = snap.data()?.proverOpprettet || 0;
        await updateDoc(ref, { proverOpprettet: count + 1 });
    } catch(e) {}
}

export async function sjekkKampanjeKode() {
    alert("Bruk knappen i dashboardet.");
}

export function visAbonnementInfo() {
    window.location.href = '/min-side.html';
}

function setupKeyboardShortcuts() {
    const spm = document.getElementById('norsk-ord');
    const svar = document.getElementById('engelsk-ord');
    if(spm && svar) {
        const enter = (e) => { 
            if(e.key==='Enter') { 
                e.preventDefault(); 
                leggTilOrd(); 
            } 
        };
        spm.addEventListener('keydown', enter);
        svar.addEventListener('keydown', enter);
    }
}