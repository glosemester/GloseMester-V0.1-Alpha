/**
 * STANDARDPRØVER - Ferdiglagde prøver for Premium/Skolepakke
 * v0.7.0-BETA
 */

import { auth, db, collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, increment, serverTimestamp } from './firebase.js';

let alleStandardProver = [];
let brukerAbonnement = null;

/**
 * Last inn Standardprøver-siden
 */
export async function lastInnStandardprover() {
  const mainContent = document.getElementById('standardprover');
  const currentUser = auth.currentUser;

  if (!mainContent) {
    console.error('❌ standardprover element ikke funnet');
    return;
  }

  if (!currentUser) {
    mainContent.innerHTML = '<div class="melding">Du må være logget inn for å se Standardprøver.</div>';
    return;
  }

  // Sjekk abonnement
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const userData = userDoc.data();
  brukerAbonnement = userData?.abonnement?.type || 'free';

  // Kun premium og skolepakke har tilgang
  if (brukerAbonnement !== 'premium' && brukerAbonnement !== 'skolepakke') {
    mainContent.innerHTML = `
      <div class="standard-container">
        <div class="standard-header">
          <h1>📚 Standardprøver</h1>
          <p class="undertekst">Kvalitetssikrede prøver for premium-brukere</p>
        </div>
        <div class="oppgrader-melding">
          <h2>🔒 Kun for Premium-brukere</h2>
          <p>Standardprøver er kun tilgjengelig for premium- og skolepakke-brukere.</p>
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
          <button class="btn-primary" onclick="visSide('laerer-dashboard')" style="margin-top: 20px;">
            ⭐ Oppgrader til Premium - 500 kr/år
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Premium/Skolepakke - vis standardprøver
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
        <div id="preview-ordliste" style="max-height: 400px; overflow-y: auto; margin: 20px 0;"></div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn-secondary" onclick="lukkPreviewStandard()">Lukk</button>
          <button class="btn-primary" id="preview-kopier-btn">✅ Bruk denne</button>
        </div>
      </div>
    </div>
  `;

  // Last inn prøver
  await lastInnProver();
}

/**
 * Last inn standardprøver fra Firestore
 */
async function lastInnProver() {
  try {
    const q = query(
      collection(db, 'standardprover'),
      where('synlig', '==', true),
      orderBy('rekkefolge', 'asc')
    );

    const snapshot = await getDocs(q);
    alleStandardProver = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Lastet ${alleStandardProver.length} standardprøver`);
    visStandardProver(alleStandardProver);

  } catch (error) {
    console.error('Feil ved lasting av standardprøver:', error);
    document.getElementById('standard-liste').innerHTML = `
      <div class="melding error">
        Kunne ikke laste standardprøver. Prøv å refresh siden.
      </div>
    `;
  }
}

/**
 * Vis standardprøver i UI
 */
function visStandardProver(prover) {
  const listeEl = document.getElementById('standard-liste');

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
    html += '<h3 class="nivaa-header">━━ BARNESKOLE ━━</h3>';
    gruppert.barneskole.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  // Ungdomsskole
  if (gruppert.ungdomsskole && gruppert.ungdomsskole.length > 0) {
    html += '<h3 class="nivaa-header">━━ UNGDOMSSKOLE ━━</h3>';
    gruppert.ungdomsskole.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  // Videregående
  if (gruppert.videregaende && gruppert.videregaende.length > 0) {
    html += '<h3 class="nivaa-header">━━ VIDEREGÅENDE ━━</h3>';
    gruppert.videregaende.forEach(prove => {
      html += lagProveKort(prove);
    });
  }

  listeEl.innerHTML = html;
}

/**
 * Lag HTML-kort for en standardprøve
 */
function lagProveKort(prove) {
  const emoji = getEmojiForEmne(prove.emne);
  const LK20_text = prove.LK20_kompetansemaal?.join(', ') || 'N/A';
  const antallOrd = prove.ordliste?.length || 0;
  const kopierCount = prove.antall_kopier || 0;

  return `
    <div class="standard-kort">
      <div class="kort-header">
        <h3>${emoji} ${prove.tittel} (${antallOrd} ord)</h3>
        <span class="vanskelighet vanskelighet-${prove.vanskelighetsgrad}">
          ${prove.vanskelighetsgrad}
        </span>
      </div>
      <div class="kort-metadata">
        ${prove.nivaa} • ${prove.trinn} • LK20: ${LK20_text}
      </div>
      <p class="kort-beskrivelse">${prove.beskrivelse}</p>
      <div class="kort-stats">
        <span>📥 ${kopierCount} lærere bruker denne</span>
      </div>
      <div class="kort-actions">
        <button class="btn-secondary btn-small" onclick="visForhandsvisningStandard('${prove.id}')">
          👁️ Forhåndsvis
        </button>
        <button class="btn-primary btn-small" onclick="kopierStandardprove('${prove.id}')">
          ✅ Bruk denne
        </button>
      </div>
    </div>
  `;
}

/**
 * Få emoji basert på emne
 */
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

/**
 * Vis forhåndsvisning av standardprøve
 */
window.visForhandsvisningStandard = function(proveId) {
  const prove = alleStandardProver.find(p => p.id === proveId);
  if (!prove) return;

  const modal = document.getElementById('standard-preview-modal');
  document.getElementById('preview-tittel').textContent = prove.tittel;
  document.getElementById('preview-metadata').textContent = 
    `${prove.nivaa} • ${prove.trinn} • ${prove.ordliste.length} ord`;

  // Vis ordliste
  let ordlisteHTML = '<div class="ordliste-preview">';
  prove.ordliste.forEach((ord, index) => {
    ordlisteHTML += `
      <div class="ord-rad">
        <span class="ord-nummer">${index + 1}.</span>
        <span class="ord-norsk">${ord.s}</span>
        <span class="ord-pil">→</span>
        <span class="ord-engelsk">${ord.e}</span>
      </div>
    `;
  });
  ordlisteHTML += '</div>';
  document.getElementById('preview-ordliste').innerHTML = ordlisteHTML;

  // Sett onclick for kopier-knapp
  document.getElementById('preview-kopier-btn').onclick = () => {
    kopierStandardprove(proveId);
    lukkPreviewStandard();
  };

  modal.style.display = 'flex';
};

/**
 * Lukk forhåndsvisning
 */
window.lukkPreviewStandard = function() {
  document.getElementById('standard-preview-modal').style.display = 'none';
};

/**
 * Kopier standardprøve til lærerens bibliotek
 */
window.kopierStandardprove = async function(proveId) {
  const prove = alleStandardProver.find(p => p.id === proveId);
  if (!prove) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('Du må være logget inn');
    return;
  }

  try {
    // Kopier til lærerens prøver
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
      vanskelighetsgrad: prove.vanskelighetsgrad
    });

    // Øk antall_kopier
    await updateDoc(doc(db, 'standardprover', prove.id), {
      antall_kopier: increment(1)
    });

    alert(`✅ "${prove.tittel}" lagt til i dine prøver!`);
    
    // Oppdater visning
    prove.antall_kopier = (prove.antall_kopier || 0) + 1;
    visStandardProver(alleStandardProver);

  } catch (error) {
    console.error('Feil ved kopiering:', error);
    alert('❌ Kunne ikke kopiere prøven. Prøv igjen.');
  }
};

/**
 * Filtrer standardprøver etter nivå
 */
window.filtrerStandardProver = function() {
  const filter = document.getElementById('nivaa-filter').value;

  if (filter === 'alle') {
    visStandardProver(alleStandardProver);
  } else {
    const filtrerte = alleStandardProver.filter(p => p.nivaa === filter);
    visStandardProver(filtrerte);
  }
};