/**
 * GloseBank Browse - Søk og last ned prøver fra GloseBank
 * Kun tilgjengelig for lærere med skolepakke
 * v0.6.1-BETA
 */

import { auth, db, collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, increment, serverTimestamp } from './firebase.js';

let alleProver = [];
let filtrerteProver = [];
let brukerAbonnement = null;

/**
 * Last inn GloseBank søkeside
 */
export async function lastInnGlosebankSok() {
  const mainContent = document.getElementById('glosebank-browse');
  const currentUser = auth.currentUser;

  if (!mainContent) {
    console.error('❌ glosebank-browse element ikke funnet');
    return;
  }

  if (!currentUser) {
    mainContent.innerHTML = '<div class="melding">Du må være logget inn for å se GloseBank.</div>';
    return;
  }

  // Sjekk abonnement
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const userData = userDoc.data();
  brukerAbonnement = userData?.abonnement?.type || 'free';

  // Kun skolepakke har tilgang
  if (brukerAbonnement !== 'skolepakke') {
    mainContent.innerHTML = `
      <div class="glosebank-container">
        <div class="glosebank-header">
          <h1>📚 GloseBank</h1>
          <p class="undertekst">Delte prøver fra lærere - kun tilgjengelig med skolepakke</p>
        </div>
        <div class="oppgrader-melding">
          <h2>🔒 Krever skolepakke</h2>
          <p>GloseBank er kun tilgjengelig for skoler med skolepakke-abonnement.</p>
          <p>Kontakt oss for å oppgradere din skole!</p>
          <div style="margin-top: 20px;">
            <strong>Fordeler med GloseBank:</strong>
            <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
              <li>✅ Hundrevis av godkjente prøver</li>
              <li>✅ LK20-alignert innhold</li>
              <li>✅ Kvalitetssikret av admin</li>
              <li>✅ Ratinger fra andre lærere</li>
              <li>✅ Spar tid på prøveplanlegging</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Skolepakke - vis søkeside
  mainContent.innerHTML = `
    <div class="glosebank-container">
      <div class="glosebank-header">
        <h1>📚 GloseBank</h1>
        <p class="undertekst">Delte prøver fra lærere - kvalitetssikret og klar til bruk</p>
      </div>

      <div class="glosebank-sok">
        <div class="sok-input-container">
          <input type="text" id="glosebank-sok-input" placeholder="🔍 Søk i prøver..." />
        </div>

        <div class="filter-container">
          <select id="filter-fag" class="filter-select">
            <option value="">Alle fag</option>
            <option value="engelsk">Engelsk</option>
            <option value="norsk">Norsk</option>
            <option value="spansk">Spansk</option>
            <option value="fransk">Fransk</option>
            <option value="tysk">Tysk</option>
          </select>

          <select id="filter-nivaa" class="filter-select">
            <option value="">Alle nivå</option>
            <option value="barneskole">Barneskole</option>
            <option value="ungdomsskole">Ungdomsskole</option>
            <option value="videregaende">Videregående</option>
          </select>

          <select id="filter-emne" class="filter-select">
            <option value="">Alle emner</option>
            <option value="familie">Familie</option>
            <option value="dyr">Dyr</option>
            <option value="mat">Mat</option>
            <option value="klaer">Klær</option>
            <option value="kropp">Kropp</option>
            <option value="tall">Tall</option>
            <option value="farger">Farger</option>
            <option value="vaer">Vær</option>
            <option value="skole">Skole</option>
            <option value="fritid">Fritid</option>
          </select>

          <select id="sorter-prover" class="filter-select">
            <option value="populaere">Mest populære</option>
            <option value="nyeste">Nyeste</option>
            <option value="rating">Best vurdert</option>
          </select>
        </div>
      </div>

      <div id="glosebank-resultater" class="glosebank-resultater">
        <div class="laster">Laster prøver...</div>
      </div>
    </div>
  `;

  // Last inn prøver
  await lastInnProver();

  // Event listeners
  document.getElementById('glosebank-sok-input').addEventListener('input', filtrerProver);
  document.getElementById('filter-fag').addEventListener('change', filtrerProver);
  document.getElementById('filter-nivaa').addEventListener('change', filtrerProver);
  document.getElementById('filter-emne').addEventListener('change', filtrerProver);
  document.getElementById('sorter-prover').addEventListener('change', sorterProver);
}

/**
 * Last inn alle godkjente prøver fra Firestore
 */
async function lastInnProver() {
  try {
    const q = query(
      collection(db, 'glosebank'),
      where('synlig_for_kunder', '==', true),
      orderBy('nedlastninger', 'desc')
    );

    const snapshot = await getDocs(q);
    alleProver = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    filtrerteProver = [...alleProver];
    visProver();
  } catch (error) {
    console.error('Feil ved lasting av prøver:', error);
    document.getElementById('glosebank-resultater').innerHTML = `
      <div class="feilmelding">
        <p>⚠️ Kunne ikke laste prøver. Prøv igjen senere.</p>
      </div>
    `;
  }
}

/**
 * Filtrer prøver basert på søk og filtere
 */
function filtrerProver() {
  const sokTekst = document.getElementById('glosebank-sok-input').value.toLowerCase();
  const fag = document.getElementById('filter-fag').value;
  const nivaa = document.getElementById('filter-nivaa').value;
  const emne = document.getElementById('filter-emne').value;

  filtrerteProver = alleProver.filter(prove => {
    const matchSok = prove.tittel.toLowerCase().includes(sokTekst);
    const matchFag = !fag || prove.fag === fag;
    const matchNivaa = !nivaa || prove.nivaa === nivaa;
    const matchEmne = !emne || prove.emne === emne;

    return matchSok && matchFag && matchNivaa && matchEmne;
  });

  sorterProver();
}

/**
 * Sorter prøver
 */
function sorterProver() {
  const sortering = document.getElementById('sorter-prover').value;

  switch(sortering) {
    case 'populaere':
      filtrerteProver.sort((a, b) => (b.nedlastninger || 0) - (a.nedlastninger || 0));
      break;
    case 'nyeste':
      filtrerteProver.sort((a, b) => {
        const datoA = a.opprettet_dato?.toMillis?.() || 0;
        const datoB = b.opprettet_dato?.toMillis?.() || 0;
        return datoB - datoA;
      });
      break;
    case 'rating':
      filtrerteProver.sort((a, b) => (b.rating_snitt || 0) - (a.rating_snitt || 0));
      break;
  }

  visProver();
}

/**
 * Vis prøver i UI
 */
function visProver() {
  const container = document.getElementById('glosebank-resultater');

  if (filtrerteProver.length === 0) {
    container.innerHTML = `
      <div class="ingen-resultater">
        <p>🔍 Ingen prøver funnet</p>
        <p class="undertekst">Prøv et annet søk eller fjern filtre</p>
      </div>
    `;
    return;
  }

  const html = filtrerteProver.map(prove => lagProveKort(prove)).join('');
  container.innerHTML = html;

  // Legg til event listeners
  filtrerteProver.forEach(prove => {
    document.getElementById(`forhandsvis-${prove.id}`)?.addEventListener('click', () => visForhandsvisning(prove));
    document.getElementById(`last-ned-${prove.id}`)?.addEventListener('click', () => lastNedProve(prove));
    document.getElementById(`rate-${prove.id}`)?.addEventListener('click', () => visRatingModal(prove));
  });
}

/**
 * Lag HTML for prøvekort
 */
function lagProveKort(prove) {
  const antallOrd = prove.ordliste?.length || 0;
  const rating = prove.rating_snitt || 0;
  const antallRatings = prove.rating_count || 0;
  const nedlastninger = prove.nedlastninger || 0;

  // Kapitalisering av metadata
  const fag = prove.fag ? prove.fag.charAt(0).toUpperCase() + prove.fag.slice(1) : 'Ukjent';
  const nivaa = prove.nivaa ? prove.nivaa.charAt(0).toUpperCase() + prove.nivaa.slice(1) : '';
  const trinn = prove.trinn || '';
  const emne = prove.emne ? prove.emne.charAt(0).toUpperCase() + prove.emne.slice(1) : '';

  // LK20 kompetansemål
  const lk20 = prove.LK20_kompetansemaal?.join(', ') || '';

  return `
    <div class="glosebank-kort">
      <div class="kort-header">
        <h3>📚 ${prove.tittel}</h3>
        <span class="antall-ord">${antallOrd} ord</span>
      </div>
      
      <div class="kort-metadata">
        <span class="metadata-tag">${fag}</span>
        ${nivaa ? `<span class="metadata-tag">${nivaa}</span>` : ''}
        ${trinn ? `<span class="metadata-tag">${trinn}</span>` : ''}
        ${emne ? `<span class="metadata-tag">📌 ${emne}</span>` : ''}
      </div>

      ${lk20 ? `<div class="kort-lk20">LK20: ${lk20}</div>` : ''}

      <div class="kort-stats">
        <span class="stat-item">
          ⭐ ${rating > 0 ? rating.toFixed(1) : 'Ingen'} 
          ${antallRatings > 0 ? `(${antallRatings})` : ''}
        </span>
        <span class="stat-item">🔥 ${nedlastninger} nedlastninger</span>
      </div>

      <div class="kort-actions">
        <button class="btn-secondary btn-small" id="forhandsvis-${prove.id}">
          👁️ Forhåndsvis
        </button>
        <button class="btn-primary btn-small" id="last-ned-${prove.id}">
          🔥 Last ned
        </button>
        <button class="btn-secondary btn-small" id="rate-${prove.id}">
          ⭐ Vurder
        </button>
      </div>
    </div>
  `;
}

/**
 * Vis forhåndsvisning modal
 */
function visForhandsvisning(prove) {
  const ordliste = prove.ordliste || [];
  const antallOrd = ordliste.length;

  const ordlisteHTML = ordliste.map((ord, index) => `
    <div class="forhandsvis-ord">
      <span class="ord-nummer">${index + 1}.</span>
      <span class="ord-norsk">${ord.s}</span>
      <span class="ord-separator">→</span>
      <span class="ord-engelsk">${ord.e}</span>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content forhandsvis-modal">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
      
      <h2>👁️ Forhåndsvisning: ${prove.tittel}</h2>
      
      <div class="forhandsvis-info">
        <p><strong>Antall ord:</strong> ${antallOrd}</p>
        <p><strong>Fag:</strong> ${prove.fag || 'Ukjent'}</p>
        <p><strong>Nivå:</strong> ${prove.nivaa || 'Ukjent'}</p>
        ${prove.emne ? `<p><strong>Emne:</strong> ${prove.emne}</p>` : ''}
      </div>

      <div class="forhandsvis-ordliste">
        ${ordlisteHTML}
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
          Lukk
        </button>
        <button class="btn-primary" onclick="window.lastNedFraModal('${prove.id}')">
          🔥 Last ned denne prøven
        </button>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  document.body.appendChild(modal);
}

/**
 * Last ned prøve fra modal (global funksjon)
 */
window.lastNedFraModal = async function(proveId) {
  const prove = alleProver.find(p => p.id === proveId);
  if (prove) {
    document.querySelector('.modal-overlay')?.remove();
    await lastNedProve(prove);
  }
};

/**
 * Last ned prøve til lærerens bibliotek
 */
async function lastNedProve(prove) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('Du må være logget inn for å laste ned prøver.');
    return;
  }

  const knapp = document.getElementById(`last-ned-${prove.id}`);
  if (knapp) {
    knapp.disabled = true;
    knapp.textContent = 'Laster ned...';
  }

  try {
    // 1. Kopier prøve til lærerens "prover" collection
    await addDoc(collection(db, 'prover'), {
      tittel: prove.tittel + ' (GloseBank)',
      ordliste: prove.ordliste,
      opprettet_av: currentUser.uid,
      opprettet_dato: serverTimestamp(),
      aktiv: true,
      antall_gjennomforinger: 0,
      kilde: 'glosebank',
      original_glosebank_id: prove.id
    });

    // 2. Øk nedlastnings-teller
    await updateDoc(doc(db, 'glosebank', prove.id), {
      nedlastninger: increment(1)
    });

    // Oppdater lokal data
    prove.nedlastninger = (prove.nedlastninger || 0) + 1;
    visProver();

    // Vis suksess
    visBekreftelse('✅ Prøve lastet ned!', 'Prøven er nå tilgjengelig i "Mine prøver".');

  } catch (error) {
    console.error('Feil ved nedlasting:', error);
    alert('❌ Kunne ikke laste ned prøve. Prøv igjen.');
  } finally {
    if (knapp) {
      knapp.disabled = false;
      knapp.textContent = '🔥 Last ned';
    }
  }
}

/**
 * Vis rating modal
 */
function visRatingModal(prove) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content rating-modal">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
      
      <h2>⭐ Vurder: ${prove.tittel}</h2>
      <p class="undertekst">Din vurdering hjelper andre lærere</p>

      <div class="rating-container">
        <div class="stjerner" id="stjerne-rating">
          <span class="stjerne" data-rating="1">☆</span>
          <span class="stjerne" data-rating="2">☆</span>
          <span class="stjerne" data-rating="3">☆</span>
          <span class="stjerne" data-rating="4">☆</span>
          <span class="stjerne" data-rating="5">☆</span>
        </div>
        <p id="rating-tekst">Velg antall stjerner</p>
      </div>

      <textarea id="rating-kommentar" placeholder="Valgfri kommentar (200 tegn)" maxlength="200" rows="3"></textarea>

      <div class="modal-actions">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
          Avbryt
        </button>
        <button class="btn-primary" id="send-rating" disabled>
          Send vurdering
        </button>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  document.body.appendChild(modal);

  // Stjerne-rating interaktivitet
  let valgtRating = 0;
  const stjerner = modal.querySelectorAll('.stjerne');
  const ratingTekst = modal.getElementById('rating-tekst');
  const sendKnapp = modal.getElementById('send-rating');

  const ratingTekster = {
    1: '1 stjerne - Ikke bra',
    2: '2 stjerner - Dårlig',
    3: '3 stjerner - Grei',
    4: '4 stjerner - Bra',
    5: '5 stjerner - Utmerket!'
  };

  stjerner.forEach(stjerne => {
    stjerne.addEventListener('click', () => {
      valgtRating = parseInt(stjerne.dataset.rating);
      
      // Oppdater visuelle stjerner
      stjerner.forEach((s, i) => {
        s.textContent = i < valgtRating ? '★' : '☆';
        s.classList.toggle('aktiv', i < valgtRating);
      });

      ratingTekst.textContent = ratingTekster[valgtRating];
      sendKnapp.disabled = false;
    });

    // Hover-effekt
    stjerne.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(stjerne.dataset.rating);
      stjerner.forEach((s, i) => {
        s.textContent = i < hoverRating ? '★' : '☆';
      });
    });
  });

  modal.querySelector('.stjerner').addEventListener('mouseleave', () => {
    stjerner.forEach((s, i) => {
      s.textContent = i < valgtRating ? '★' : '☆';
    });
  });

  // Send rating
  sendKnapp.addEventListener('click', async () => {
    if (valgtRating === 0) return;

    sendKnapp.disabled = true;
    sendKnapp.textContent = 'Sender...';

    try {
      const kommentar = modal.getElementById('rating-kommentar').value.trim();
      await lagreRating(prove.id, valgtRating, kommentar);
      
      modal.remove();
      visBekreftelse('✅ Takk for din vurdering!', 'Din vurdering er registrert.');
      
      // Oppdater visning
      await lastInnProver();
      filtrerProver();
    } catch (error) {
      console.error('Feil ved lagring av rating:', error);
      alert('❌ Kunne ikke lagre vurdering. Prøv igjen.');
      sendKnapp.disabled = false;
      sendKnapp.textContent = 'Send vurdering';
    }
  });
}

/**
 * Lagre rating til Firestore
 */
async function lagreRating(glosebankId, rating, kommentar) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Ikke logget inn');

  // Sjekk om lærer allerede har rated denne prøven
  const eksisterendeRatings = query(
    collection(db, 'glosebank_ratings'),
    where('glosebank_id', '==', glosebankId),
    where('laerer_id', '==', currentUser.uid)
  );

  const snapshot = await getDocs(eksisterendeRatings);

  if (!snapshot.empty) {
    // Oppdater eksisterende rating
    const ratingDoc = snapshot.docs[0];
    const gammelRating = ratingDoc.data().rating;

    await updateDoc(doc(db, 'glosebank_ratings', ratingDoc.id), {
      rating: rating,
      kommentar: kommentar,
      dato: serverTimestamp()
    });

    // Oppdater snitt (fjern gammel, legg til ny)
    const glosebankDoc = doc(db, 'glosebank', glosebankId);
    const glosebankData = (await getDoc(glosebankDoc)).data();
    
    const nyttSum = (glosebankData.rating_sum || 0) - gammelRating + rating;
    const nyttSnitt = nyttSum / (glosebankData.rating_count || 1);

    await updateDoc(glosebankDoc, {
      rating_sum: nyttSum,
      rating_snitt: nyttSnitt
    });

  } else {
    // Ny rating
    await addDoc(collection(db, 'glosebank_ratings'), {
      glosebank_id: glosebankId,
      laerer_id: currentUser.uid,
      rating: rating,
      kommentar: kommentar,
      dato: serverTimestamp()
    });

    // Oppdater snitt
    const glosebankDoc = doc(db, 'glosebank', glosebankId);
    const glosebankData = (await getDoc(glosebankDoc)).data();
    
    const nyttSum = (glosebankData.rating_sum || 0) + rating;
    const nyttCount = (glosebankData.rating_count || 0) + 1;
    const nyttSnitt = nyttSum / nyttCount;

    await updateDoc(glosebankDoc, {
      rating_sum: nyttSum,
      rating_count: nyttCount,
      rating_snitt: nyttSnitt
    });
  }
}

/**
 * Vis bekreftelses-melding
 */
function visBekreftelse(tittel, melding) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content bekreftelse-modal">
      <h2>${tittel}</h2>
      <p>${melding}</p>
      <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
        OK
      </button>
    </div>
  `;
  
  setTimeout(() => modal.remove(), 3000);
  document.body.appendChild(modal);
}
