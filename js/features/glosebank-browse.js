/**
 * GloseBank Browse v0.9.0
 * Tilgang: Kun Skolepakke og Admin
 */

import { auth, db, collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, increment, serverTimestamp } from './firebase.js';

let alleProver = [], filtrerteProver = [];

export async function lastInnGlosebankSok() {
  const mainContent = document.getElementById('glosebank-browse');
  const currentUser = auth.currentUser;

  if (!mainContent) return;

  // 1. Logget inn?
  if (!currentUser) {
    mainContent.innerHTML = '<div class="melding">Logg inn for å se GloseBank.</div>';
    return;
  }

  // 2. SJEKK TILGANG (Kun Skolepakke!)
  const harTilgang = await sjekkSkoleTilgang(currentUser);

  if (!harTilgang) {
    mainContent.innerHTML = `
      <div class="glosebank-container">
        <div class="glosebank-header">
          <h1>📚 GloseBank</h1>
          <p class="undertekst">Delte prøver fra lærere</p>
        </div>
        <div class="oppgrader-melding" style="text-align:center; padding:40px; background:white; border-radius:12px; margin-top:20px;">
          <h2>🔒 Krever Skolepakke</h2>
          <p>GloseBank er en delingsportal eksklusivt for skoler med lisens.</p>
          <p style="font-size:0.9em; color:#666;">(Premium-brukere har tilgang til Standardprøver)</p>
          <button class="btn-primary" style="margin-top:20px;" onclick="document.getElementById('upgrade-modal').style.display='flex'">
            Les om Skolepakke
          </button>
        </div>
      </div>`;
    return;
  }

  // 3. VIS INNHOLD
  mainContent.innerHTML = `
    <div class="glosebank-container">
      <div class="glosebank-header"><h1>📚 GloseBank</h1><p class="undertekst">Delte prøver fra lærere - kvalitetssikret</p></div>
      
      <div class="glosebank-sok">
        <input type="text" id="glosebank-sok-input" placeholder="🔍 Søk på tittel, emne eller ord..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-bottom:15px;">
        
        <div class="filter-container" style="display:flex; gap:10px; flex-wrap:wrap;">
           <select id="filter-nivaa" class="filter-select">
                <option value="">Alle nivå</option>
                <option value="barneskole">Barneskole</option>
                <option value="ungdomsskole">Ungdomsskole</option>
           </select>
        </div>
      </div>

      <div id="glosebank-resultater" class="glosebank-resultater" style="margin-top:20px;">
        <div class="laster">Laster prøver...</div>
      </div>
    </div>`;

  await lastInnProver();

  // Event Listeners
  const sokInput = document.getElementById('glosebank-sok-input');
  const filterInput = document.getElementById('filter-nivaa');
  
  if(sokInput) sokInput.addEventListener('input', filtrerProver);
  if(filterInput) filterInput.addEventListener('change', filtrerProver);
}

// --- HJELPEFUNKSJONER ---

async function sjekkSkoleTilgang(user) {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return false;

        const data = snap.data();
        const abo = data.abonnement || {};

        if (abo.status === 'active' || abo.type === 'skolepakke' || abo.status === 'school') {
            const exp = abo.utloper?.toDate();
            if (!exp || Date.now() < exp.getTime()) {
                return true;
            }
        }

        return false;
    } catch (e) {
        console.error("Feil ved tilgangssjekk:", e);
        return false;
    }
}

async function lastInnProver() {
  try {
    const q = query(
        collection(db, 'glosebank'),
        where('synlig_for_kunder', '==', true),
        orderBy('nedlastninger', 'desc')
    );

    const snap = await getDocs(q);

    alleProver = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    filtrerteProver = [...alleProver];
    visProver();
  } catch (e) { 
      console.error("GloseBank fetch error:", e);
      const el = document.getElementById('glosebank-resultater');
      if(el) el.innerHTML = '<p>Kunne ikke laste prøver: ' + e.message + '</p>'; 
  }
}

function filtrerProver() {
  const sok = document.getElementById('glosebank-sok-input').value.toLowerCase().trim();
  const nivaa = document.getElementById('filter-nivaa').value;

  filtrerteProver = alleProver.filter(p => {
      // Søk i tittel, emne og ordliste-innhold
      let sokMatch = !sok;
      if (sok) {
          const tittelMatch = (p.tittel || '').toLowerCase().includes(sok);
          const emneMatch = (p.emne || '').toLowerCase().includes(sok);
          const nivaaTextMatch = (p.nivaa || '').toLowerCase().includes(sok);
          const ordMatch = Array.isArray(p.ordliste) && p.ordliste.some(ord =>
              (ord.s || '').toLowerCase().includes(sok) ||
              (ord.e || '').toLowerCase().includes(sok)
          );
          sokMatch = tittelMatch || emneMatch || nivaaTextMatch || ordMatch;
      }
      const nivaaMatch = !nivaa || (p.nivaa && p.nivaa === nivaa);
      return sokMatch && nivaaMatch;
  });
  visProver();
}

function visProver() {
  const div = document.getElementById('glosebank-resultater');
  if(!div) return;
  
  if(filtrerteProver.length === 0) { 
      div.innerHTML = '<p style="color:#666; font-style:italic;">Ingen treff.</p>'; 
      return; 
  }
  
  let html = '<div style="display:grid; gap:15px; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));">';
  
  filtrerteProver.forEach(p => {
      const antallOrd = p.ordliste ? p.ordliste.length : 0;
      const nivaaTekst = p.nivaa ? p.nivaa.charAt(0).toUpperCase() + p.nivaa.slice(1) : 'Ukjent nivå';
      
      html += `
        <div style="background:white; padding:20px; border-radius:12px; border:1px solid #eee; box-shadow:0 2px 5px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
            <h3 style="margin:0 0 5px 0; font-size:16px;">${p.tittel}</h3>
            
            <div style="font-size:12px; color:#666; margin-bottom:15px; flex-grow:1;">
                ${p.emne ? `<div>📖 ${p.emne}</div>` : ''}
                <div>📚 ${antallOrd} ord</div>
                <div>🎓 ${nivaaTekst}</div>
                <div>🔥 ${p.nedlastninger || 0} nedlastninger</div>
            </div>
            
            <button class="btn-primary btn-small" onclick="window.lastNedGB('${p.id}')" style="width:100%;">
                📥 Last ned
            </button>
        </div>
      `;
  });
  div.innerHTML = html + '</div>';
}

// Global funksjon for knappen
window.lastNedGB = async function(id) {
    const p = alleProver.find(x => x.id === id);
    if(!p) return;
    
    if(!confirm(`Vil du laste ned "${p.tittel}" til dine lagrede prøver?`)) return;

    try {
        await addDoc(collection(db, 'prover'), {
            tittel: p.tittel + ' (Fra GloseBank)',
            ordliste: p.ordliste,
            opprettet_av: auth.currentUser.uid,
            opprettet_dato: serverTimestamp(),
            kilde: 'glosebank',
            original_id: id,
            antall_gjennomforinger: 0,
            aktiv: true
        });
        
        // Øk teller i glosebank
        await updateDoc(doc(db, 'glosebank', id), { 
            nedlastninger: increment(1) 
        });
        
        alert('✅ Prøve lastet ned! Du finner den under "Mine Prøver".');
        
        // Oppdater visning lokalt for å vise ny nedlastningstall
        p.nedlastninger = (p.nedlastninger || 0) + 1;
        visProver();
        
    } catch(e) { 
        console.error(e);
        alert('Feil ved nedlasting.'); 
    }
};