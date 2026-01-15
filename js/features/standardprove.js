/**
 * STANDARDPRØVER v0.8.2 - FINAL
 * Oppdatert dørvakt: Vipps + Skolepakke
 * Fjernet gammel melding om "Kun for Premium"
 */

import { auth, db, collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, increment, serverTimestamp } from './firebase.js';

let alleStandardProver = [];

export async function lastInnStandardprover() {
  const mainContent = document.getElementById('standardprover');
  const currentUser = auth.currentUser;

  if (!mainContent) return;

  // 1. Er du logget inn?
  if (!currentUser) {
    mainContent.innerHTML = '<div class="melding">Du må være logget inn.</div>';
    return;
  }

  // 2. SJEKK TILGANG (Dørvakten)
  const harTilgang = await sjekkTilgang(currentUser);

  if (!harTilgang) {
    mainContent.innerHTML = `
      <div class="standard-container">
        <div class="standard-header">
          <h1>📚 Standardprøver</h1>
          <p class="undertekst">Kvalitetssikrede prøver</p>
        </div>
        <div class="oppgrader-melding" style="text-align:center; padding:40px; background:white; border-radius:12px; margin-top:20px;">
          <h2>🔒 Krever Premium eller Skolepakke</h2>
          <p>Standardprøver er kun tilgjengelig for betalende brukere.</p>
          <div style="margin-top: 20px;">
            <strong>Få tilgang til 16+ ferdiglagde prøver:</strong>
            <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
              <li>✅ LK20-alignert innhold</li>
              <li>✅ Kvalitetssikret av lærer</li>
              <li>✅ Dekker alle nivå (1-10. trinn)</li>
              <li>✅ Kan kopieres til ditt bibliotek</li>
              <li>✅ Spar tid på prøveplanlegging</li>
            </ul>
          </div>
          <button class="btn-primary" onclick="document.getElementById('upgrade-modal').style.display='flex'" style="margin-top:20px;">
            ⭐ Se tilbud
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 3. ✅ HAR TILGANG - VIS INNHOLD
  mainContent.innerHTML = `
    <div class="standard-container">
      <div class="standard-header">
        <h1>📚 Standardprøver</h1>
        <p class="undertekst">Kvalitetssikrede prøver klar til bruk</p>
      </div>
      
      <div class="filter-container">
        <label>Filter etter nivå:</label>
        <select id="nivaa-filter" onchange="filtrerStandardProver()">
          <option value="alle">Alle nivå</option>
          <option value="barneskole">Barneskole</option>
          <option value="ungdomsskole">Ungdomsskole</option>
          <option value="videregaende">Videregående</option>
        </select>
      </div>

      <div id="standard-liste">
        <div class="loading">Laster standardprøver...</div>
      </div>
    </div>

    <!-- Forhåndsvisning Modal -->
    <div id="standard-preview-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content">
        <h2 id="preview-tittel"></h2>
        <p id="preview-metadata"></p>
        <div id="preview-ordliste" style="max-height:400px; overflow-y:auto; margin:20px 0;"></div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn-secondary" onclick="document.getElementById('standard-preview-modal').style.display='none'">Lukk</button>
          <button class="btn-primary" id="preview-kopier-btn">✅ Bruk denne</button>
        </div>
      </div>
    </div>
  `;

  await lastInnProver();
}

// --- HJELPEFUNKSJONER ---

async function sjekkTilgang(user) {
    console.log("🔐 Sjekker StandardProver tilgang for:", user.uid);
    
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
            console.log("❌ Bruker finnes ikke i Firestore");
            return false;
        }
        
        const d = snap.data();
        console.log("👤 Brukerdata:", d);
        
        // 1. Sjekk Vipps Premium (subscription-feltet)
        if (d.subscription?.status === 'premium') {
            const exp = d.subscription.expiresAt?.toDate();
            if (exp && Date.now() < exp.getTime()) {
                console.log("✅ Har Vipps Premium tilgang");
                return true;
            }
        }
        
        // 2. Sjekk Skolepakke/Admin (abonnement-feltet)
        const abo = d.abonnement || {};
        if (abo.status === 'active' || abo.type === 'skolepakke' || abo.status === 'school') {
            const exp = abo.utloper?.toDate();
            if (!exp || Date.now() < exp.getTime()) {
                console.log("✅ Har Skolepakke/Admin tilgang");
                return true;
            }
        }
        
        console.log("❌ Ingen tilgang funnet");
        return false;
    } catch (e) { 
        console.error("❌ Feil ved tilgangssjekk:", e);
        return false; 
    }
}

async function lastInnProver() {
  console.log("📡 Starter lastInnProver()");
  
  try {
    const q = query(
      collection(db, 'standardprover'),
      where('synlig', '==', true),
      orderBy('rekkefolge', 'asc')
    );
    
    const snap = await getDocs(q);
    console.log("✅ Query OK - Antall prøver:", snap.size);
    
    alleStandardProver = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data };
    });
    
    visStandardProver(alleStandardProver);
  } catch (e) { 
      console.error("❌ StandardProver fetch error:", e);
      document.getElementById('standard-liste').innerHTML = '<p>Kunne ikke laste prøver: ' + e.message + '</p>'; 
  }
}

function visStandardProver(prover) {
  const listeEl = document.getElementById('standard-liste');
  if(!listeEl) return;

  if (prover.length === 0) {
    listeEl.innerHTML = '<div class="melding">Ingen standardprøver tilgjengelig ennå.</div>';
    return;
  }

  // Grupper etter nivå
  const gruppert = {};
  prover.forEach(prove => {
    const niva = prove.nivaa || 'annet';
    if (!gruppert[niva]) gruppert[niva] = [];
    gruppert[niva].push(prove);
  });

  let html = '';

  // Barneskole
  if (gruppert.barneskole && gruppert.barneskole.length > 0) {
    html += '<h3 class="nivaa-header">┏━ BARNESKOLE ━┓</h3>';
    gruppert.barneskole.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  // Ungdomsskole
  if (gruppert.ungdomsskole && gruppert.ungdomsskole.length > 0) {
    html += '<h3 class="nivaa-header">┏━ UNGDOMSSKOLE ━┓</h3>';
    gruppert.ungdomsskole.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  // Videregående
  if (gruppert.videregaende && gruppert.videregaende.length > 0) {
    html += '<h3 class="nivaa-header">┏━ VIDEREGÅENDE ━┓</h3>';
    gruppert.videregaende.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  listeEl.innerHTML = html;
}

function lagProveKort(prove) {
  const emoji = getEmojiForEmne(prove.emne);
  const LK20_text = prove.LK20_kompetansemaal?.join(', ') || 'N/A';
  const antallOrd = prove.ordliste?.length || 0;
  const kopierCount = prove.antall_kopier || 0;

  return `
    <div class="standard-kort">
      <div class="kort-header">
        <h3>${emoji} ${prove.tittel}</h3>
        <span class="vanskelighet vanskelighet-${prove.vanskelighetsgrad}">
          ${prove.vanskelighetsgrad}
        </span>
      </div>
      <div class="kort-metadata">
        ${prove.nivaa} • ${prove.trinn} • ${antallOrd} ord
      </div>
      <p class="kort-beskrivelse">${prove.beskrivelse || ''}</p>
      <div class="kort-stats">
        <span>🔥 ${kopierCount} lærere bruker denne</span>
      </div>
      <div class="kort-actions">
        <button class="btn-secondary btn-small" onclick="visPreview('${prove.id}')">
          👁️ Forhåndsvis
        </button>
        <button class="btn-primary btn-small" onclick="kopierProve('${prove.id}')">
          ✅ Bruk denne
        </button>
      </div>
    </div>
  `;
}

function getEmojiForEmne(emne) {
  const emojis = {
    'familie': '👨‍👩‍👧‍👦',
    'dyr': '🦁',
    'kropp': '🧍',
    'tall': '🔢',
    'farger': '🎨',
    'mat': '🍎',
    'klaer': '👕',
    'vaer': '☀️',
    'skole': '🏫',
    'fritid': '⚽',
    'transport': '🚗',
    'hus': '🏠'
  };
  return emojis[emne] || '📚';
}

window.visPreview = function(proveId) {
  const prove = alleStandardProver.find(p => p.id === proveId);
  if (!prove) return;

  const modal = document.getElementById('standard-preview-modal');
  document.getElementById('preview-tittel').textContent = prove.tittel;
  document.getElementById('preview-metadata').textContent = 
    `${prove.nivaa} • ${prove.trinn} • ${prove.ordliste.length} ord`;

  let ordlisteHTML = '<div class="ordliste-preview">';
  prove.ordliste.forEach((ord, index) => {
    ordlisteHTML += `
      <div class="ord-rad">
        <span class="ord-nummer">${index + 1}.</span>
        <span class="ord-norsk"><strong>${ord.s}</strong></span>
        <span class="ord-pil">→</span>
        <span class="ord-engelsk">${ord.e}</span>
      </div>
    `;
  });
  ordlisteHTML += '</div>';
  document.getElementById('preview-ordliste').innerHTML = ordlisteHTML;

  document.getElementById('preview-kopier-btn').onclick = () => {
    kopierProve(proveId);
    document.getElementById('standard-preview-modal').style.display = 'none';
  };

  modal.style.display = 'flex';
};

window.kopierProve = async function(proveId) {
  const prove = alleStandardProver.find(p => p.id === proveId);
  if (!prove) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('Du må være logget inn');
    return;
  }

  try {
    await addDoc(collection(db, 'prover'), {
      tittel: prove.tittel + ' (Standard)',
      ordliste: prove.ordliste,
      opprettet_av: currentUser.uid,
      opprettet_dato: serverTimestamp(),
      kilde: 'standardprove',
      original_standard_id: prove.id,
      fag: prove.fag,
      nivaa: prove.nivaa,
      trinn: prove.trinn,
      emne: prove.emne,
      LK20_kompetansemaal: prove.LK20_kompetansemaal,
      vanskelighetsgrad: prove.vanskelighetsgrad,
      antall_gjennomforinger: 0,
      aktiv: true
    });

    await updateDoc(doc(db, 'standardprover', prove.id), {
      antall_kopier: increment(1)
    });

    alert(`✅ "${prove.tittel}" lagt til i dine prøver!`);
    
    prove.antall_kopier = (prove.antall_kopier || 0) + 1;
    visStandardProver(alleStandardProver);

  } catch (error) {
    console.error('Feil ved kopiering:', error);
    alert('❌ Kunne ikke kopiere prøven. Prøv igjen.');
  }
};

window.filtrerStandardProver = function() {
  const filter = document.getElementById('nivaa-filter').value;

  if (filter === 'alle') {
    visStandardProver(alleStandardProver);
  } else {
    const filtrerte = alleStandardProver.filter(p => p.nivaa === filter);
    visStandardProver(filtrerte);
  }
};