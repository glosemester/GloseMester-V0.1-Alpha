// ============================================
// TEACHER.JS - Lærerportal
// Free: maks 1 lagret prøve totalt (ingen lokal lagring)
// Premium: ubegrenset
// ============================================

import {
  db,
  auth,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from './firebase.js';

import { visToast, spillLyd } from '../ui/helpers.js';

let editorOrd = [];

const PRIVACY = {
  version: 'v0.6 beta',
  url: 'https://glosemester.no/personvern'
};

const ACCESS = {
  FREE_MAX_SAVES: 1
};

// ------------------------
// Skolevennlige auth-meldinger
// ------------------------
function mapAuthErrorToNo(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Ugyldig e-postadresse. Sjekk at den er skrevet riktig.';
    case 'auth/missing-password':
      return 'Du må skrive inn et passord.';
    case 'auth/weak-password':
      return 'Passordet er for kort. Det må være minst 6 tegn.';
    case 'auth/email-already-in-use':
      return 'Det finnes allerede en konto med denne e-postadressen. Velg “Logg inn” eller bruk “Glemt passord?”.';
    case 'auth/user-not-found':
      return 'Ingen konto funnet for denne e-postadressen. Velg “Opprett konto” eller bruk en annen e-post.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Feil e-post eller passord. Prøv igjen, eller bruk “Glemt passord?”.';
    case 'auth/too-many-requests':
      return 'For mange forsøk på kort tid. Vent litt og prøv igjen.';
    case 'auth/network-request-failed':
      return 'Nettverksfeil. Sjekk internettforbindelsen og prøv igjen.';
    default:
      return 'Innlogging feilet. Prøv igjen, eller kontakt kontakt@glosemester.no.';
  }
}

function showTeacherAuthMessage(msg, type = 'error') {
  if (typeof visToast === 'function') {
    visToast(msg, type === 'error' ? 'error' : 'success');
  } else {
    alert(msg);
  }
}

function getEmailPass() {
  const email = document.getElementById('teacher-login-email')?.value?.trim() || '';
  const pass = document.getElementById('teacher-login-pass')?.value || '';
  return { email, pass };
}


// ------------------------
// UI helpers
// ------------------------
function ensurePopup(id, titleHtml) {
  let popup = document.getElementById(id);
  if (popup) return popup;

  popup = document.createElement('div');
  popup.id = id;
  popup.className = 'popup-overlay';
  popup.innerHTML = `
    <div class="popup-content">
      <button class="popup-close" type="button" aria-label="Lukk">✕</button>
      ${titleHtml}
      <div class="popup-body"></div>
      <div class="popup-actions" style="margin-top:14px;"></div>
    </div>
  `;
  popup.querySelector('.popup-close').onclick = () => popup.classList.remove('active');
  document.body.appendChild(popup);
  return popup;
}

function showPremiumPopup(message) {
  const popup = ensurePopup('premium-popup', `<h2>Premium kreves</h2>`);

  popup.querySelector('.popup-body').innerHTML = `
    <p style="color:#333; margin-top:10px;">${message}</p>
    <div class="info-box" style="margin-top:16px; text-align:left;">
      <b>Premium gir:</b>
      <ul style="margin:8px 0 0 18px;">
        <li>Ubegrenset lagring av prøver</li>
        <li>Deling/koder (Premium)</li>
      </ul>
    </div>
    <p style="margin-top:10px;">
      Kontakt: <a href="mailto:kontakt@glosemester.no">kontakt@glosemester.no</a>
    </p>
  `;

  const actions = popup.querySelector('.popup-actions');
  actions.innerHTML = `<button class="btn-primary" type="button">OK</button>`;
  actions.querySelector('button').onclick = () => popup.classList.remove('active');

  popup.classList.add('active');
}

function showLoginNotice(message) {
  const popup = ensurePopup('teacher-login-popup', `<h2>Lærerinnlogging</h2>`);

  popup.querySelector('.popup-body').innerHTML = `
    <p style="color:#333; margin-top:10px;">${message}</p>
    <p style="margin-top:10px; font-size:12px; color:#666;">
      Tips: På mobil kan popup-innlogging noen ganger bli blokkert. Hvis det skjer, prøv å åpne siden i en vanlig nettleserfane.
    </p>
  `;

  const actions = popup.querySelector('.popup-actions');
  actions.innerHTML = `
    <button class="btn-primary" type="button" id="btn-login-google">Logg inn med Google</button>
    <button class="btn-secondary" type="button" id="btn-cancel-login">Avbryt</button>
  `;
  actions.querySelector('#btn-login-google').onclick = () => teacherLoginWithGoogle().catch(() => {});
  actions.querySelector('#btn-cancel-login').onclick = () => popup.classList.remove('active');

  popup.classList.add('active');
}

// ------------------------
// Auth (Google)
// ------------------------
export async function teacherLoginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    visToast?.('Logget inn', 'success');
    renderTeacherAuthUI();
    await updatePlanBadge();
  } catch (e) {
    console.error('Innlogging feilet:', e);
    showLoginNotice('Kunne ikke logge inn med Google. Prøv igjen, eller åpne i nettleserfane.');
    throw e;
  }
}

export async function teacherLogout() {
  try {
    await signOut(auth);
    visToast?.('Logget ut', 'info');
    renderTeacherAuthUI();
    await updatePlanBadge();
  } catch (e) {
    console.error('Logout feilet:', e);
  }
}

// ------------------------
// Personvern
// ------------------------
function visPrivacySamtykkeModal({ onAccept, onCancel }) {
  const el = document.createElement('div');
  el.id = 'privacy-consent-modal';
  el.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card">
      <h3>Personvern og vilkår (Lærer)</h3>
      <p>
        Ved å bruke lærerfunksjonene i GloseMester bekrefter du at du har lest og aksepterer personvernerklæringen.
        Lærerdata (e-post og prøver) lagres i Firebase for å gi tilgang og administrasjon.
      </p>
      <p><a href="${PRIVACY.url}" target="_blank" rel="noopener">Les personvernerklæringen</a></p>
      <div class="modal-actions">
        <button id="privacy-cancel">Avbryt</button>
        <button id="privacy-accept">Jeg godtar</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  el.querySelector('#privacy-cancel').onclick = () => { el.remove(); onCancel?.(); };
  el.querySelector('#privacy-accept').onclick = () => { el.remove(); onAccept?.(); };
}

export async function ensureTeacherPrivacyAccepted() {
  const user = auth.currentUser;
  if (!user) return false; // krever innlogging for lærer

  const localKey = `privacyAccepted_${user.uid}_${PRIVACY.version}`;
  if (localStorage.getItem(localKey) === 'true') return true;

  const ref = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.privacyAccepted === true && data?.privacyVersion === PRIVACY.version) {
        localStorage.setItem(localKey, 'true');
        return true;
      }
    }

    return await new Promise((resolve) => {
      visPrivacySamtykkeModal({
        onAccept: async () => {
          try {
            if (!snap.exists()) {
              await setDoc(ref, { email: user.email ?? null }, { merge: true });
            }
            await updateDoc(ref, {
              privacyAccepted: true,
              privacyAcceptedAt: serverTimestamp(),
              privacyVersion: PRIVACY.version,
              privacyUrl: PRIVACY.url,
              updatedAt: serverTimestamp()
            });
          } catch (e) {
            console.warn('Kunne ikke lagre samtykke i Firestore.', e);
          }
          localStorage.setItem(localKey, 'true');
          resolve(true);
        },
        onCancel: () => resolve(false)
      });
    });
  } catch (e) {
    console.warn('Kunne ikke verifisere samtykke i Firestore.', e);
    return await new Promise((resolve) => {
      visPrivacySamtykkeModal({
        onAccept: () => { localStorage.setItem(localKey, 'true'); resolve(true); },
        onCancel: () => resolve(false)
      });
    });
  }
}

// ------------------------
// Profile / plan
// ------------------------
async function getOrCreateTeacherProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();

  const profile = {
    email: user.email ?? null,
    role: 'teacher',
    plan: 'free',
    authProvider: user.providerData?.[0]?.providerId ?? 'unknown',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, profile, { merge: true });
  return profile;
}

async function countUserProver(uid) {
  const q = query(collection(db, 'prover'), where('eierId', '==', uid));
  const snap = await getDocs(q);
  return snap.size;
}

async function updatePlanBadge() {
  const planBadge = document.getElementById('teacher-plan-badge');
  const user = auth.currentUser;
  if (!planBadge) return;

  if (!user) {
    planBadge.textContent = '';
    planBadge.className = 'plan-badge';
    return;
  }

  const profile = await getOrCreateTeacherProfile();
  const plan = profile?.plan ?? 'free';
  planBadge.textContent = plan.toUpperCase();
  planBadge.className = plan === 'premium' ? 'plan-badge premium' : 'plan-badge free';
}

// ------------------------
// DOM: Teacher auth UI
// ------------------------
export 

// ------------------------
// Bibliotek (lagrede prøver)
// ------------------------
async function hentMineProver() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'prover'), where('eierId', '==', user.uid));
  const snap = await getDocs(q);

  const list = [];
  snap.forEach(docSnap => {
    const d = docSnap.data() || {};
    list.push({
      id: docSnap.id,
      tittel: d.tittel ?? '(uten tittel)',
      opprettet: d.opprettet ?? null,
      ordCount: Array.isArray(d.ord) ? d.ord.length : 0
    });
  });

  list.sort((a, b) => (b.opprettet?.seconds ?? 0) - (a.opprettet?.seconds ?? 0));
  return list;
}

function renderBibliotek({ prover, loggedIn }) {
  const lib = document.getElementById('teacher-library');
  const empty = document.getElementById('teacher-library-empty');
  const ul = document.getElementById('teacher-prover-list');
  if (!lib || !empty || !ul) return;

  lib.style.display = 'block';

  if (!loggedIn) {
    empty.style.display = 'block';
    empty.textContent = 'Logg inn for å se dine lagrede prøver.';
    ul.innerHTML = '';
    return;
  }

  if (!prover || prover.length === 0) {
    empty.style.display = 'block';
    empty.textContent = 'Ingen lagrede prøver enda.';
    ul.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  ul.innerHTML = prover.map(p => `
    <li>
      <b>${p.tittel}</b>
      <div style="opacity:0.75; font-size:12px;">${p.ordCount} ord</div>
    </li>
  `).join('');
}

export async function oppdaterBibliotek() {
  const user = auth.currentUser;
  if (!user) {
    renderBibliotek({ prover: [], loggedIn: false });
    return;
  }
  const prover = await hentMineProver();
  renderBibliotek({ prover, loggedIn: true });
}
function renderTeacherAuthUI() {
  const authBox = document.getElementById('teacher-auth');
  const editorBox = document.getElementById('teacher-editor');
  if (!authBox || !editorBox) return;

  const user = auth.currentUser;

  if (!user) {
    authBox.style.display = 'block';
    editorBox.style.display = 'none';
    const emailEl = document.getElementById('teacher-email');
    if (emailEl) emailEl.textContent = 'Ikke innlogget';
    oppdaterBibliotek().catch(() => {});
    return;
  }

  authBox.style.display = 'block';
  editorBox.style.display = 'block';

  const emailEl = document.getElementById('teacher-email');
  if (emailEl) emailEl.textContent = user.email ?? 'Innlogget';
  oppdaterBibliotek().catch(() => {});
}


export async function initTeacherUI() {
  // Bind e-post handling en gang
  const loginBtn = document.getElementById('teacher-login-btn');
  const signupBtn = document.getElementById('teacher-signup-btn');
  const resetBtn = document.getElementById('teacher-reset-btn');

  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.dataset.bound = '1';
    loginBtn.addEventListener('click', async () => {
      const { email, pass } = getEmailPass();
      if (!email) return showTeacherAuthMessage('Skriv inn e-postadresse.');
      if (!pass) return showTeacherAuthMessage('Skriv inn passord.');
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        showTeacherAuthMessage('Du er nå logget inn.', 'success');
        renderTeacherAuthUI();
        await updatePlanBadge();
        await oppdaterBibliotek();
      } catch (e) {
        showTeacherAuthMessage(mapAuthErrorToNo(e));
      }
    });
  }

  if (signupBtn && !signupBtn.dataset.bound) {
    signupBtn.dataset.bound = '1';
    signupBtn.addEventListener('click', async () => {
      const { email, pass } = getEmailPass();
      if (!email) return showTeacherAuthMessage('Skriv inn e-postadresse.');
      if (!pass) return showTeacherAuthMessage('Skriv inn passord.');
      if (pass.length < 6) return showTeacherAuthMessage('Passordet må være minst 6 tegn.');
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        showTeacherAuthMessage('Konto opprettet. Du er nå logget inn.', 'success');
        renderTeacherAuthUI();
        await updatePlanBadge();
        await oppdaterBibliotek();
      } catch (e) {
        showTeacherAuthMessage(mapAuthErrorToNo(e));
      }
    });
  }

  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', async () => {
      const email = document.getElementById('teacher-login-email')?.value?.trim() || '';
      if (!email) return showTeacherAuthMessage('Skriv inn e-postadressen først.');
      try {
        await sendPasswordResetEmail(auth, email);
        showTeacherAuthMessage('E-post for tilbakestilling er sendt (hvis kontoen finnes).', 'success');
      } catch (e) {
        showTeacherAuthMessage(mapAuthErrorToNo(e));
      }
    });
  }

  renderTeacherAuthUI();
  await updatePlanBadge();
  await oppdaterBibliotek();
}


// ------------------------
// Editor
// ------------------------
export function leggTilOrd() {
  const spmEl = document.getElementById('nytt-sporsmaal');
  const svarEl = document.getElementById('nytt-svar');
  const spm = spmEl?.value?.trim();
  const svar = svarEl?.value?.trim();

  if (spm && svar) {
    editorOrd.push({ sporsmaal: spm, svar });
    oppdaterEditorListe();
    spillLyd?.('klikk');

    spmEl.value = '';
    svarEl.value = '';
    spmEl.focus();
  }
}

export function slettOrd(index) {
  editorOrd.splice(index, 1);
  oppdaterEditorListe();
}

function oppdaterEditorListe() {
  const liste = document.getElementById('editor-liste');
  if (!liste) return;
  liste.innerHTML = editorOrd.map((ord, i) => `
    <li>
      <b>${ord.sporsmaal}</b> - ${ord.svar}
      <button onclick="slettOrd(${i})" class="btn-slett">🗑️</button>
    </li>
  `).join('');
}

// ------------------------
// Save (Free/Premium gate)
// ------------------------
export async function lagreProve() {
  const tittelEl = document.getElementById('prove-tittel');
  const tittel = tittelEl?.value?.trim();

  if (!tittel || editorOrd.length === 0) {
    alert('Du må ha en tittel og minst ett ord.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    showLoginNotice('Du må logge inn for å bruke lærerportalen.');
    return;
  }

  const ok = await ensureTeacherPrivacyAccepted();
  if (!ok) return;

  const profile = await getOrCreateTeacherProfile();
  const plan = profile?.plan ?? 'free';

  const existing = await countUserProver(user.uid);
  if (plan !== 'premium' && existing >= ACCESS.FREE_MAX_SAVES) {
    showPremiumPopup(`Gratisbrukere kan lagre maks ${ACCESS.FREE_MAX_SAVES} prøve totalt. Oppgrader for ubegrenset lagring.`);
    return;
  }

  try {
    await addDoc(collection(db, 'prover'), {
      tittel,
      ord: editorOrd,
      eierId: user.uid,
      opprettet: serverTimestamp()
    });

    await addDoc(collection(db, 'felles_prover'), {
      tittel,
      ord: editorOrd,
      kilde: 'Lærer-bidrag',
      godkjent: false,
      opprettet: serverTimestamp()
    });

    spillLyd?.('vinn');
    visToast?.('Prøve lagret!', 'success');

    editorOrd = [];
    if (tittelEl) tittelEl.value = '';
    oppdaterEditorListe();

    await updatePlanBadge();
  } catch (e) {
    console.error('Feil ved lagring:', e);
    alert('Noe gikk galt ved lagring.');
  }
}
